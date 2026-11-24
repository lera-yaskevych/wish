-- Saying a gift has been given, and its owner confirming it arrived.
--
-- The member who reserved a wish can mark it as given. Its owner is then asked whether
-- it arrived: yes marks the wish as received, exactly as "I got this" always has; no
-- clears the question and leaves the reservation as it was. The owner still never
-- learns who reserved it, and can mark any wish as received without being asked.
--
-- Guests on a shared link cannot mark a wish as given yet.

alter table public.reservations add column given_at timestamptz;

-- ---------------------------------------------------------------------------
-- Marking and answering
-- ---------------------------------------------------------------------------

-- For whoever reserved a wish: says it has been given, or with p_given false takes that
-- back. Saying it again keeps the first time. Asking about any other wish does nothing.
create function public.mark_given(p_wish uuid, p_given boolean default true)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.reservations r
  set given_at = case when p_given then coalesce(r.given_at, now()) end
  where r.wish_id = p_wish
    and r.reserver_id = auth.uid();
$$;

-- For the owner: "I haven't got it". The question goes away, the reservation stays, and
-- whoever reserved it can mark it as given again. Asking about any other wish does nothing.
create function public.dismiss_given(p_wish uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.reservations r
  set given_at = null
  from public.wishes w
  where r.wish_id = p_wish
    and w.id = r.wish_id
    and w.owner_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Reading wishes with whether they have been given
-- ---------------------------------------------------------------------------

-- Same as before, plus `given`: the reservation has been marked as given. Told only to
-- the owner, who is asked to confirm, and to the person who reserved it.
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
  guest_reservation boolean,
  given boolean
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
    r.wish_id is not null and r.reserver_id is null,
    coalesce(r.given_at is not null and (w.owner_id = auth.uid() or r.reserver_id = auth.uid()), false)
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
-- Notifying the owner
-- ---------------------------------------------------------------------------

-- When a wish is marked as given, hands its owner's devices to the sending function
-- (see push_notifications) so they can be asked whether it arrived. Who gave it is
-- never sent.
create function public.notify_owner_of_given_gift()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_url text;
  secret text;
  wish_owner uuid;
  wish_title text;
  targets jsonb;
begin
  select s.value into target_url from public.app_settings s where s.key = 'push_url';
  select s.value into secret from public.app_settings s where s.key = 'push_secret';
  if target_url is null or secret is null then
    return new;
  end if;

  select w.owner_id, w.title into wish_owner, wish_title from public.wishes w where w.id = new.wish_id;

  select jsonb_agg(
    jsonb_build_object('endpoint', p.endpoint, 'p256dh', p.p256dh, 'auth', p.auth, 'language', p.language)
  )
  into targets
  from public.push_subscriptions p
  where p.user_id = wish_owner;

  if targets is null then
    return new;
  end if;

  perform net.http_post(
    url := target_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    body := jsonb_build_object(
      'kind', 'gift_given',
      'wishId', new.wish_id,
      'wishTitle', wish_title,
      'targets', targets
    )
  );
  return new;
exception
  -- A problem with notifications must never stop a gift from being marked as given.
  when others then
    return new;
end;
$$;

create trigger on_gift_given
  after update of given_at on public.reservations
  for each row
  when (old.given_at is null and new.given_at is not null)
  execute function public.notify_owner_of_given_gift();

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

revoke all on function public.mark_given(uuid, boolean) from public, anon;
revoke all on function public.dismiss_given(uuid) from public, anon;
revoke all on function public.wishes_visible(uuid, uuid) from public, anon;
grant execute on function public.mark_given(uuid, boolean) to authenticated, service_role;
grant execute on function public.dismiss_given(uuid) to authenticated, service_role;
grant execute on function public.wishes_visible(uuid, uuid) to authenticated, service_role;
