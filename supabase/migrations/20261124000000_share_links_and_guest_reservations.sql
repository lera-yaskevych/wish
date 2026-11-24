-- Sharing a list by link, reservations that say who made them, and reserving from a
-- shared link without an account.
--
-- What each viewer learns about a reserved wish:
--   the owner                 that it is reserved, never by whom
--   the person who reserved   that it is theirs
--   other members             who reserved it: a member's name or a guest's nickname
--   guests on a shared link   that it is reserved, or that it is theirs. Never by whom,
--                             or the owner could open their own link signed out and see.
--
-- The owner may remove a reservation a guest made (someone on a link could reserve
-- everything), so they are also told whether a reservation came from a guest. Members'
-- reservations stay theirs alone to undo.

-- ---------------------------------------------------------------------------
-- Share links
-- ---------------------------------------------------------------------------

-- One secret link per person. Whoever holds it can see that person's current wishes and
-- reserve one under a nickname. It is not the person's id: ids appear in photo addresses,
-- so they are not secret.
create table public.share_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

alter table public.share_links enable row level security;
-- No policies on purpose: links are handed out and looked up only by the functions below.

-- Any member may pass on anyone's list, their own included. A link is made the first
-- time someone asks for it.
create function public.share_token(p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  found text;
begin
  if auth.uid() is null or not exists (select 1 from public.profiles p where p.id = p_user) then
    return null;
  end if;
  insert into public.share_links (user_id) values (p_user) on conflict (user_id) do nothing;
  select l.token into found from public.share_links l where l.user_id = p_user;
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reservations by guests
-- ---------------------------------------------------------------------------

-- A reservation is made either by a member (reserver_id) or by a guest who opened a shared
-- link (guest_name). The guest's device keeps a random key; only its hash is stored, and
-- showing the key again is how a guest proves a reservation is theirs.
alter table public.reservations
  alter column reserver_id drop not null,
  add column guest_name text check (char_length(btrim(guest_name)) between 1 and 40),
  add column guest_key_hash text,
  add constraint reservations_one_reserver check (
    (reserver_id is not null and guest_name is null and guest_key_hash is null)
    or (reserver_id is null and guest_name is not null and guest_key_hash is not null)
  );

-- Null for a missing or too-short key, so it can never match a stored hash.
create function public.guest_key_hash(p_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when char_length(coalesce(p_key, '')) >= 20 then encode(sha256(convert_to(p_key, 'UTF8')), 'hex')
  end;
$$;

-- ---------------------------------------------------------------------------
-- Reading wishes with who reserved them
-- ---------------------------------------------------------------------------

-- Same as before, with three changes: the owner now gets 'taken' once a wish is
-- reserved; `reserved_by` names whoever reserved it, for everyone except the owner and
-- the reserver (whose wishes say 'mine'); and `guest_reservation` says whether a guest
-- made it, so the owner knows which ones they may remove.
drop function public.wishes_visible(uuid, uuid);

create function public.wishes_visible(p_owner uuid default null, p_wish uuid default null)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  note text,
  url text,
  price text,
  image_url text,
  created_at timestamptz,
  fulfilled_at timestamptz,
  reservation text,
  reserved_by text,
  guest_reservation boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id, w.owner_id, w.title, w.note, w.url, w.price, w.image_url, w.created_at, w.fulfilled_at,
    case
      when r.wish_id is null then 'none'
      when r.reserver_id = auth.uid() then 'mine'
      else 'taken'
    end,
    case
      when w.owner_id = auth.uid() or r.reserver_id = auth.uid() then null
      else coalesce(p.name, r.guest_name)
    end,
    r.wish_id is not null and r.reserver_id is null
  from public.wishes w
  left join public.reservations r on r.wish_id = w.id
  left join public.profiles p on p.id = r.reserver_id
  where auth.uid() is not null
    and (p_owner is not null or p_wish is not null)
    and (p_owner is null or w.owner_id = p_owner)
    and (p_wish is null or w.id = p_wish)
    and (w.fulfilled_at is null or w.owner_id = auth.uid())
  order by w.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Opening a shared link, with or without an account
-- ---------------------------------------------------------------------------

-- Whose list a link opens. An unknown link returns nothing.
create function public.shared_owner(p_token text)
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name
  from public.share_links l
  join public.profiles p on p.id = l.user_id
  where l.token = p_token;
$$;

-- The current wishes behind a link as a guest sees them. The guest's device key marks
-- their own reservations as 'mine'. `reserved_by` and `guest_reservation` are always
-- empty; they are there so the rows have the same shape as wishes_visible.
create function public.shared_wishes(p_token text, p_guest_key text default null)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  note text,
  url text,
  price text,
  image_url text,
  created_at timestamptz,
  fulfilled_at timestamptz,
  reservation text,
  reserved_by text,
  guest_reservation boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id, w.owner_id, w.title, w.note, w.url, w.price, w.image_url, w.created_at, w.fulfilled_at,
    case
      when r.wish_id is null then 'none'
      when r.guest_key_hash = public.guest_key_hash(p_guest_key) then 'mine'
      else 'taken'
    end,
    null::text,
    false
  from public.share_links l
  join public.wishes w on w.owner_id = l.user_id
  left join public.reservations r on r.wish_id = w.id
  where l.token = p_token
    and w.fulfilled_at is null
  order by w.created_at desc;
$$;

-- Reserves a wish for a guest. The link has to be the wish owner's, so a guest can only
-- reserve from a list that was shared with them. Reserving the same wish again with the
-- same key counts as done.
create function public.reserve_as_guest(p_token text, p_wish uuid, p_guest_key text, p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  key_hash text := public.guest_key_hash(p_guest_key);
  nickname text := btrim(coalesce(p_name, ''));
begin
  if key_hash is null or char_length(nickname) not between 1 and 40 then
    raise exception 'a nickname and a device key are needed' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.share_links l
    join public.wishes w on w.owner_id = l.user_id
    where l.token = p_token and w.id = p_wish and w.fulfilled_at is null
  ) then
    raise exception 'cannot reserve' using errcode = '42501';
  end if;

  insert into public.reservations (wish_id, reserver_id, guest_name, guest_key_hash)
  values (p_wish, null, nickname, key_hash)
  on conflict (wish_id) do nothing;

  if not found and not exists (
    select 1 from public.reservations r where r.wish_id = p_wish and r.guest_key_hash = key_hash
  ) then
    raise exception 'already reserved' using errcode = '23505';
  end if;
end;
$$;

-- Releases a guest's reservation. Only the device key that made it can.
create function public.unreserve_as_guest(p_wish uuid, p_guest_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.reservations r
  where r.wish_id = p_wish
    and r.guest_key_hash = public.guest_key_hash(p_guest_key);
$$;

-- The owner of a wish can free it from a guest's reservation. Nobody else can, and
-- a member's reservation is never touched. Asking about any other wish does nothing.
create function public.release_guest_reservation(p_wish uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.reservations r
  using public.wishes w
  where r.wish_id = p_wish
    and w.id = r.wish_id
    and w.owner_id = auth.uid()
    and r.reserver_id is null;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

revoke all on public.share_links from anon, authenticated;

revoke all on function public.guest_key_hash(text) from public, anon, authenticated;

revoke all on function public.share_token(uuid) from public, anon;
grant execute on function public.share_token(uuid) to authenticated, service_role;

revoke all on function public.wishes_visible(uuid, uuid) from public, anon;
grant execute on function public.wishes_visible(uuid, uuid) to authenticated, service_role;

revoke all on function public.release_guest_reservation(uuid) from public, anon;
grant execute on function public.release_guest_reservation(uuid) to authenticated, service_role;

-- A shared link works without an account.
revoke all on function public.shared_owner(text) from public;
revoke all on function public.shared_wishes(text, text) from public;
revoke all on function public.reserve_as_guest(text, uuid, text, text) from public;
revoke all on function public.unreserve_as_guest(uuid, text) from public;
grant execute on function public.shared_owner(text) to anon, authenticated, service_role;
grant execute on function public.shared_wishes(text, text) to anon, authenticated, service_role;
grant execute on function public.reserve_as_guest(text, uuid, text, text) to anon, authenticated, service_role;
grant execute on function public.unreserve_as_guest(uuid, text) to anon, authenticated, service_role;
