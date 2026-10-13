-- Wishlist: tables, access rules and helper functions.

-- ---------------------------------------------------------------------------
-- Settings only the project owner can see (dashboard or SQL editor).
-- ---------------------------------------------------------------------------

create table public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings enable row level security;
-- No policies on purpose: nothing here is readable or writable through the app.

-- Starts as a random code so a fresh project is never open to a guessable default.
insert into public.app_settings (key, value)
values ('invite_code', substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  username text not null unique check (username ~ '^[a-z0-9._]{3,24}$'),
  -- Month and day as "MM-DD"; the year is never collected.
  birthday text check (birthday ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'),
  created_at timestamptz not null default now()
);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  note text check (char_length(note) <= 2000),
  url text check (char_length(url) <= 2000),
  price text check (char_length(price) <= 40),
  image_url text check (char_length(image_url) <= 2000),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index wishes_owner_idx on public.wishes (owner_id, created_at desc);

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- One row per reserved wish. The primary key is what stops two people reserving the same gift.
create table public.reservations (
  wish_id uuid primary key references public.wishes (id) on delete cascade,
  reserver_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Who may read and change what
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.wishes enable row level security;
alter table public.follows enable row level security;
alter table public.reservations enable row level security;

-- Profiles: signed-in members can find each other; each person edits only their own.
-- Profiles are created by the sign-up trigger below, never directly.
create policy "members read profiles" on public.profiles
  for select to authenticated using (true);

create policy "edit own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Wishes: members see everyone's current wishes. A person's archive stays private.
create policy "read current wishes and own archive" on public.wishes
  for select to authenticated
  using (fulfilled_at is null or owner_id = (select auth.uid()));

create policy "add own wishes" on public.wishes
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "edit own wishes" on public.wishes
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "delete own wishes" on public.wishes
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Follows: you see and manage only your own.
create policy "read own follows" on public.follows
  for select to authenticated using (follower_id = (select auth.uid()));

create policy "follow someone" on public.follows
  for insert to authenticated with check (follower_id = (select auth.uid()));

create policy "unfollow" on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

-- Reservations: the surprise depends on these three rules.
-- A row can be read only by the person who made it. Everyone else, the wish's owner
-- included, learns about reservations solely through wishes_visible() below.
create policy "read own reservations" on public.reservations
  for select to authenticated using (reserver_id = (select auth.uid()));

create policy "reserve someone else's open wish" on public.reservations
  for insert to authenticated
  with check (
    reserver_id = (select auth.uid())
    and exists (
      select 1 from public.wishes w
      where w.id = wish_id
        and w.owner_id <> (select auth.uid())
        and w.fulfilled_at is null
    )
  );

create policy "undo own reservation" on public.reservations
  for delete to authenticated using (reserver_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Sign-up: invite code and profile creation
-- ---------------------------------------------------------------------------

create function public.invite_ok(code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_settings s
    where s.key = 'invite_code'
      and lower(btrim(s.value)) = lower(btrim(coalesce(code, '')))
  );
$$;

-- Runs inside the sign-up itself, so a wrong code means no account is created at all.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  base text;
  candidate text;
  n int := 1;
begin
  if not public.invite_ok(new.raw_user_meta_data ->> 'invite_code') then
    raise exception 'invalid invite code';
  end if;

  -- At most 20 characters, leaving room for a number when the name is already taken.
  base := case when wanted ~ '^[a-z0-9._]{3,20}$' then wanted else 'friend' end;
  candidate := base;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    n := n + 1;
    candidate := base || n;
  end loop;

  insert into public.profiles (id, name, username)
  values (new.id, left(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), 80), candidate);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Reading wishes with their reservation state
-- ---------------------------------------------------------------------------

-- Returns one person's wishes (p_owner) or a single wish (p_wish) as the caller may see
-- them. `reservation` is 'mine', 'taken' or 'none'; for the wish's owner it is always
-- 'none', and nobody is ever told who reserved something.
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
  reservation text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id, w.owner_id, w.title, w.note, w.url, w.price, w.image_url, w.created_at, w.fulfilled_at,
    case
      when w.owner_id = auth.uid() then 'none'
      when r.reserver_id = auth.uid() then 'mine'
      when r.wish_id is not null then 'taken'
      else 'none'
    end
  from public.wishes w
  left join public.reservations r on r.wish_id = w.id
  where auth.uid() is not null
    and (p_owner is not null or p_wish is not null)
    and (p_owner is null or w.owner_id = p_owner)
    and (p_wish is null or w.id = p_wish)
    and (w.fulfilled_at is null or w.owner_id = auth.uid())
  order by w.created_at desc;
$$;

-- Marking a wish as received releases whoever had reserved it.
create function public.release_reservation_when_fulfilled()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.fulfilled_at is not null and old.fulfilled_at is null then
    delete from public.reservations r where r.wish_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_wish_fulfilled
  after update of fulfilled_at on public.wishes
  for each row execute function public.release_reservation_when_fulfilled();

-- ---------------------------------------------------------------------------
-- People, with what the Friends screens show next to a name
-- ---------------------------------------------------------------------------

-- security_invoker: the view obeys the table rules above for whoever is asking.
create view public.profile_cards
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.username,
  p.birthday,
  (select count(*) from public.wishes w where w.owner_id = p.id and w.fulfilled_at is null)::int as wish_count,
  exists (
    select 1 from public.follows f
    where f.follower_id = auth.uid() and f.followee_id = p.id
  ) as is_following
from public.profiles p;

create function public.search_people(q text)
returns setof public.profile_cards
language sql
stable
set search_path = ''
as $$
  -- Escapes \ % and _ so a search is always for the literal text typed.
  with needle as (
    select '%' || replace(replace(replace(ltrim(btrim(coalesce(q, '')), '@'), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select c.*
  from public.profile_cards c, needle
  where c.id <> auth.uid()
    and needle.pattern <> '%%'
    and (c.name ilike needle.pattern or c.username ilike needle.pattern)
  order by c.name
  limit 30;
$$;

create function public.following()
returns setof public.profile_cards
language sql
stable
set search_path = ''
as $$
  select c.*
  from public.profile_cards c
  join public.follows f on f.followee_id = c.id
  where f.follower_id = auth.uid()
  order by f.created_at;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

-- The invite check must work before signing in; everything else needs an account.
revoke all on function public.invite_ok(text) from public;
grant execute on function public.invite_ok(text) to anon, authenticated, service_role;

revoke all on function public.wishes_visible(uuid, uuid) from public, anon;
revoke all on function public.search_people(text) from public, anon;
revoke all on function public.following() from public, anon;
grant execute on function public.wishes_visible(uuid, uuid) to authenticated, service_role;
grant execute on function public.search_people(text) to authenticated, service_role;
grant execute on function public.following() to authenticated, service_role;

revoke all on public.profile_cards from anon;
revoke all on public.app_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Wish photos
-- ---------------------------------------------------------------------------

-- Public bucket: a photo opens for anyone who has its exact address (a random id),
-- which lets the app show pictures without signing every image request.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wish-photos', 'wish-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Each person may only add to, list and remove from their own folder, named after their id.
create policy "see own wish photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'wish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "upload own wish photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "remove own wish photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
