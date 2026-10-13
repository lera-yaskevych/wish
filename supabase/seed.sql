-- Local development only: a known invite code for the local backend.
update public.app_settings set value = 'local-test-code' where key = 'invite_code';
