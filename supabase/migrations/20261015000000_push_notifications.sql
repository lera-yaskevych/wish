-- Push notifications: followers hear when someone adds a wish.
--
-- The database decides who is told; the sending itself is done by the web app's
-- /api/push function, whose address and shared secret live in app_settings under
-- 'push_url' and 'push_secret'. Until both are set, nothing is sent.

create extension if not exists pg_net;

-- One row per browser that asked for notifications.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  -- The language the app is set to on that device; notifications are written in it.
  language text not null default 'en' check (language in ('en', 'uk', 'tr')),
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "read own push subscriptions" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "remove own push subscriptions" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Saving goes through a function because a shared phone keeps its endpoint when a
-- different person signs in: the row has to move to them, which the rules above forbid.
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_language text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, language)
  select p_endpoint, auth.uid(), p_p256dh, p_auth, p_language
  where auth.uid() is not null
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        language = excluded.language;
$$;

-- Lets the sending function drop subscriptions the push services report as gone.
-- It has no account, so it proves itself with the shared secret instead.
create function public.remove_push_subscriptions(secret text, endpoints text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.app_settings s where s.key = 'push_secret' and s.value = secret
  ) then
    raise exception 'forbidden';
  end if;
  delete from public.push_subscriptions p where p.endpoint = any (endpoints);
end;
$$;

-- When a wish is added, hands the owner's followers' subscriptions to the sending function.
-- Who follows whom never leaves the database for anywhere else.
create function public.notify_followers_of_new_wish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_url text;
  secret text;
  targets jsonb;
begin
  select s.value into target_url from public.app_settings s where s.key = 'push_url';
  select s.value into secret from public.app_settings s where s.key = 'push_secret';
  if target_url is null or secret is null then
    return new;
  end if;

  select jsonb_agg(
    jsonb_build_object('endpoint', p.endpoint, 'p256dh', p.p256dh, 'auth', p.auth, 'language', p.language)
  )
  into targets
  from public.follows f
  join public.push_subscriptions p on p.user_id = f.follower_id
  where f.followee_id = new.owner_id;

  if targets is null then
    return new;
  end if;

  perform net.http_post(
    url := target_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    body := jsonb_build_object(
      'ownerId', new.owner_id,
      'ownerName', (select pr.name from public.profiles pr where pr.id = new.owner_id),
      'wishTitle', new.title,
      'targets', targets
    )
  );
  return new;
exception
  -- A problem with notifications must never stop a wish from being saved.
  when others then
    return new;
end;
$$;

create trigger on_wish_added
  after insert on public.wishes
  for each row execute function public.notify_followers_of_new_wish();

revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated, service_role;

revoke all on function public.remove_push_subscriptions(text, text[]) from public;
grant execute on function public.remove_push_subscriptions(text, text[]) to anon, authenticated, service_role;

revoke all on public.push_subscriptions from anon;
