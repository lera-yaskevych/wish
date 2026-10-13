// Checks the promises the database makes about privacy, against the LOCAL backend only.
//
//   npx supabase start
//   npm run test:rules
//
// It signs up throwaway people and tries the things the app must never allow.

import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value]),
);

const url = env.API_URL;
const key = env.ANON_KEY;
assert.match(url ?? '', /^http:\/\/(127\.0\.0\.1|localhost):/, 'refusing to run: this is not the local backend');

const INVITE = 'local-test-code';
const PASSWORD = 'local-test-password';
const run = Math.random().toString(36).slice(2, 8);

const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const signUp = async (name, inviteCode = INVITE) => {
  const supabase = client();
  const { data, error } = await supabase.auth.signUp({
    email: `${name.toLowerCase()}.${run}@example.com`,
    password: PASSWORD,
    options: { data: { name, username: `${name.toLowerCase()}.${run}`, invite_code: inviteCode } },
  });
  return { supabase, id: data.user?.id, error };
};

const reservationOf = async (supabase, ownerId, wishId) => {
  const { data, error } = await supabase.rpc('wishes_visible', { p_owner: ownerId });
  assert.equal(error, null);
  return data.find((wish) => wish.id === wishId)?.reservation;
};

let passed = 0;
const test = async (name, body) => {
  await body();
  passed += 1;
  console.log(`  ok  ${name}`);
};

console.log(`Access rules against ${url}`);

// ---------- invite code

await test('the invite check answers before signing in', async () => {
  const anon = client();
  assert.equal((await anon.rpc('invite_ok', { code: 'nope' })).data, false);
  assert.equal((await anon.rpc('invite_ok', { code: `  ${INVITE.toUpperCase()} ` })).data, true);
});

await test('signing up with a wrong invite code creates no account', async () => {
  const { error } = await signUp('Intruder', 'wrong-code');
  assert.ok(error, 'sign-up should fail');
  const { error: loginError } = await client().auth.signInWithPassword({
    email: `intruder.${run}@example.com`,
    password: PASSWORD,
  });
  assert.ok(loginError, 'no account should exist');
});

const owner = await signUp('Olena');
const anna = await signUp('Anna');
const bohdan = await signUp('Bohdan');
for (const person of [owner, anna, bohdan]) assert.equal(person.error, null);

await test('signing up creates a profile with the requested username', async () => {
  const { data } = await owner.supabase.from('profiles').select('name, username').eq('id', owner.id).single();
  assert.deepEqual(data, { name: 'Olena', username: `olena.${run}` });
});

await test('a taken username gets a number', async () => {
  const supabase = client();
  const { data, error } = await supabase.auth.signUp({
    email: `olena2.${run}@example.com`,
    password: PASSWORD,
    options: { data: { name: 'Olena', username: `olena.${run}`, invite_code: INVITE } },
  });
  assert.equal(error, null);
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', data.user.id).single();
  assert.equal(profile.username, `olena.${run}2`);
});

await test('the sign-up check names the problem, and only for someone holding the invite code', async () => {
  const anon = client();
  const ask = async (code, wanted_username) => (await anon.rpc('signup_check', { code, wanted_username })).data;
  assert.equal(await ask(INVITE, `fresh.${run}`), 'ok');
  assert.equal(await ask(INVITE, `olena.${run}`), 'username_taken');
  assert.equal(await ask(INVITE, 'No Spaces!'), 'invalid_username');
  // Without the code, a taken username looks the same as a free one.
  assert.equal(await ask('wrong-code', `olena.${run}`), 'invalid_invite');
  assert.equal(await ask('wrong-code', `fresh.${run}`), 'invalid_invite');
});

await test('a full-length username is kept as chosen', async () => {
  const supabase = client();
  const username = `${'x'.repeat(17)}.${run}`;
  const { data, error } = await supabase.auth.signUp({
    email: `long.${run}@example.com`,
    password: PASSWORD,
    options: { data: { name: 'Long', username, invite_code: INVITE } },
  });
  assert.equal(error, null);
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', data.user.id).single();
  assert.equal(profile.username, username);
});

await test('members can read the invite code to pass it on; nobody else can', async () => {
  assert.equal((await owner.supabase.rpc('invite_code')).data, INVITE);
  assert.ok((await client().rpc('invite_code')).error);
});

// ---------- people outside the family

await test('someone who is not signed in can read nothing', async () => {
  const anon = client();
  assert.deepEqual((await anon.from('profiles').select()).data, []);
  assert.deepEqual((await anon.from('wishes').select()).data, []);
  assert.ok((await anon.from('profile_cards').select()).error);
  assert.ok((await anon.rpc('wishes_visible', { p_owner: owner.id })).error);
  assert.ok((await anon.rpc('search_people', { q: 'a' })).error);
});

await test('settings, including the invite code, are unreadable through the app', async () => {
  const { data, error } = await owner.supabase.from('app_settings').select();
  assert.ok(error || data.length === 0);
});

// ---------- wishes

const { data: wish, error: wishError } = await owner.supabase
  .from('wishes')
  .insert({ title: 'Hiking poles', price: '€75' })
  .select()
  .single();
assert.equal(wishError, null);

await test('friends see a wish; only its owner can change or delete it', async () => {
  assert.equal(await reservationOf(anna.supabase, owner.id, wish.id), 'none');
  const edit = await anna.supabase.from('wishes').update({ title: 'Hacked' }).eq('id', wish.id).select();
  assert.deepEqual(edit.data, []);
  const removal = await anna.supabase.from('wishes').delete().eq('id', wish.id).select();
  assert.deepEqual(removal.data, []);
  const { data } = await owner.supabase.from('wishes').select('title').eq('id', wish.id).single();
  assert.equal(data.title, 'Hiking poles');
});

await test('nobody can add a wish to someone else’s list', async () => {
  const { error } = await anna.supabase.from('wishes').insert({ title: 'Planted', owner_id: owner.id });
  assert.equal(error?.code, '42501');
});

// ---------- reservations: the surprise

await test('a friend can reserve; they see "mine", another friend sees "taken"', async () => {
  assert.equal((await anna.supabase.from('reservations').insert({ wish_id: wish.id })).error, null);
  assert.equal(await reservationOf(anna.supabase, owner.id, wish.id), 'mine');
  assert.equal(await reservationOf(bohdan.supabase, owner.id, wish.id), 'taken');
});

await test('the owner is told nothing about the reservation', async () => {
  assert.equal(await reservationOf(owner.supabase, owner.id, wish.id), 'none');
  const single = await owner.supabase.rpc('wishes_visible', { p_wish: wish.id });
  assert.equal(single.data[0].reservation, 'none');
  assert.deepEqual((await owner.supabase.from('reservations').select()).data, []);
});

await test('the owner cannot probe by trying to reserve their own wish', async () => {
  const { error } = await owner.supabase.from('reservations').insert({ wish_id: wish.id });
  // "Not allowed", never "already reserved": the refusal reveals nothing.
  assert.equal(error?.code, '42501');
});

await test('another friend cannot see who reserved, nor reserve twice, nor undo it', async () => {
  assert.deepEqual((await bohdan.supabase.from('reservations').select()).data, []);
  const second = await bohdan.supabase.from('reservations').insert({ wish_id: wish.id });
  assert.equal(second.error?.code, '23505');
  await bohdan.supabase.from('reservations').delete().eq('wish_id', wish.id);
  assert.equal(await reservationOf(anna.supabase, owner.id, wish.id), 'mine');
});

await test('nobody can reserve in someone else’s name', async () => {
  await anna.supabase.from('reservations').delete().eq('wish_id', wish.id);
  const { error } = await bohdan.supabase.from('reservations').insert({ wish_id: wish.id, reserver_id: anna.id });
  assert.equal(error?.code, '42501');
  assert.equal((await anna.supabase.from('reservations').insert({ wish_id: wish.id })).error, null);
});

await test('marking a wish as received releases the reservation and hides it from friends', async () => {
  await owner.supabase.from('wishes').update({ fulfilled_at: new Date().toISOString() }).eq('id', wish.id);
  assert.equal(await reservationOf(anna.supabase, owner.id, wish.id), undefined);
  assert.deepEqual((await anna.supabase.from('wishes').select().eq('id', wish.id)).data, []);
  assert.deepEqual((await anna.supabase.from('reservations').select()).data, []);
  await owner.supabase.from('wishes').update({ fulfilled_at: null }).eq('id', wish.id);
  assert.equal(await reservationOf(anna.supabase, owner.id, wish.id), 'none');
});

// ---------- following and finding people

await test('follows are private to the follower; search and counts work', async () => {
  assert.equal((await anna.supabase.from('follows').insert({ followee_id: owner.id })).error, null);
  assert.deepEqual((await owner.supabase.from('follows').select()).data, []);

  const following = await anna.supabase.rpc('following');
  assert.equal(following.data.length, 1);
  assert.equal(following.data[0].id, owner.id);
  assert.equal(following.data[0].wish_count, 1);
  assert.equal(following.data[0].is_following, true);

  const found = await bohdan.supabase.rpc('search_people', { q: `@olena.${run}` });
  assert.equal(found.data.length, 2);
  assert.equal(found.data[0].is_following, false);
  assert.deepEqual((await bohdan.supabase.rpc('search_people', { q: '%' })).data, []);
  assert.deepEqual((await bohdan.supabase.rpc('search_people', { q: '   ' })).data, []);
});

await test('nobody can follow on someone else’s behalf or edit another profile', async () => {
  const forged = await bohdan.supabase.from('follows').insert({ follower_id: anna.id, followee_id: bohdan.id });
  assert.equal(forged.error?.code, '42501');
  const edit = await bohdan.supabase.from('profiles').update({ name: 'Hacked' }).eq('id', anna.id).select();
  assert.deepEqual(edit.data, []);
});

// ---------- notifications

await test('a device’s push subscription is visible only to its owner and moves with whoever signs in', async () => {
  const subscription = { p_endpoint: `https://push.example/${run}`, p_p256dh: 'key', p_auth: 'auth', p_language: 'uk' };
  assert.equal((await anna.supabase.rpc('save_push_subscription', subscription)).error, null);
  assert.equal((await anna.supabase.from('push_subscriptions').select()).data.length, 1);
  assert.deepEqual((await owner.supabase.from('push_subscriptions').select()).data, []);
  assert.ok((await client().rpc('save_push_subscription', subscription)).error);
  assert.ok((await anna.supabase.rpc('save_push_subscription', { ...subscription, p_language: 'xx' })).error);

  // Someone else signs in on the same phone: the subscription becomes theirs.
  assert.equal((await bohdan.supabase.rpc('save_push_subscription', subscription)).error, null);
  assert.deepEqual((await anna.supabase.from('push_subscriptions').select()).data, []);
  assert.equal((await bohdan.supabase.from('push_subscriptions').select()).data.length, 1);

  const wrongSecret = await client().rpc('remove_push_subscriptions', { secret: 'guess', endpoints: [subscription.p_endpoint] });
  assert.ok(wrongSecret.error);
  assert.equal((await bohdan.supabase.from('push_subscriptions').delete().eq('endpoint', subscription.p_endpoint)).error, null);
});

// ---------- photos

await test('photos go only into your own folder and open by their address', async () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const options = { contentType: 'image/jpeg' };
  const own = await anna.supabase.storage.from('wish-photos').upload(`${anna.id}/test.jpg`, jpeg, options);
  assert.equal(own.error, null);
  const foreign = await anna.supabase.storage.from('wish-photos').upload(`${owner.id}/test.jpg`, jpeg, options);
  assert.ok(foreign.error);

  const { publicUrl } = anna.supabase.storage.from('wish-photos').getPublicUrl(`${anna.id}/test.jpg`).data;
  assert.equal((await fetch(publicUrl)).status, 200);

  await bohdan.supabase.storage.from('wish-photos').remove([`${anna.id}/test.jpg`]);
  assert.equal((await fetch(publicUrl)).status, 200, 'someone else must not be able to delete it');
  await anna.supabase.storage.from('wish-photos').remove([`${anna.id}/test.jpg`]);
  assert.notEqual((await fetch(publicUrl)).status, 200);
});

console.log(`\n${passed} checks passed`);
