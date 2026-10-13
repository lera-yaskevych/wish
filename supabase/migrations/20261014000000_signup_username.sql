-- Sign-up with a username the person chooses, and invite links.

-- Tells the sign-up form what would stop an account being created, before one exists.
-- A username is only checked for someone who holds the invite code, so a stranger
-- cannot use this to find out who is here.
create function public.signup_check(code text, wanted_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not public.invite_ok(code) then 'invalid_invite'
    when coalesce(wanted_username, '') !~ '^[a-z0-9._]{3,24}$' then 'invalid_username'
    when exists (select 1 from public.profiles p where p.username = wanted_username) then 'username_taken'
    else 'ok'
  end;
$$;

revoke all on function public.signup_check(text, text) from public;
grant execute on function public.signup_check(text, text) to anon, authenticated, service_role;

-- The invite code, so that a member can pass it on inside an invite link.
create function public.invite_code()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.value
  from public.app_settings s
  where s.key = 'invite_code' and auth.uid() is not null;
$$;

revoke all on function public.invite_code() from public, anon;
grant execute on function public.invite_code() to authenticated, service_role;

-- People now choose their username, so the full length is accepted. A number is
-- added only when two people claim the same name at the same moment.
create or replace function public.handle_new_user()
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

  base := case when wanted ~ '^[a-z0-9._]{3,24}$' then wanted else 'friend' end;
  candidate := base;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    n := n + 1;
    candidate := left(base, 20) || n;
  end loop;

  insert into public.profiles (id, name, username)
  values (new.id, left(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), 80), candidate);
  return new;
end;
$$;
