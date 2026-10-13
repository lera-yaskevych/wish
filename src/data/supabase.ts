import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { newId } from '@/lib/ids';

import { ApiError, type Api, type ApiErrorCode, type Profile, type User, type Wish } from './types';
import { checkPassword, cleanEmail, cleanProfile, cleanSignUp, cleanWish } from './validate';

// The real backend. Who may read or change what is decided by the database itself
// (supabase/migrations); this file only asks, and translates the answers.

const PHOTOS = 'wish-photos';
const PUBLIC_PHOTO_PATH = `/storage/v1/object/public/${PHOTOS}/`;

type UserRow = { id: string; name: string; username: string; birthday: string | null };
type CardRow = UserRow & { wish_count: number; is_following: boolean };
type WishRow = {
  id: string;
  owner_id: string;
  title: string;
  note: string | null;
  url: string | null;
  price: string | null;
  image_url: string | null;
  created_at: string;
  fulfilled_at: string | null;
  reservation?: Wish['reservation'];
};

type Failure = { code?: string; message: string } | null;

const USER_COLUMNS = 'id, name, username, birthday';

const toUser = ({ id, name, username, birthday }: UserRow): User => ({ id, name, username, birthday });

const toProfile = (row: CardRow): Profile => ({
  ...toUser(row),
  wishCount: row.wish_count,
  isFollowing: row.is_following,
});

const toWish = (row: WishRow): Wish => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  note: row.note,
  url: row.url,
  price: row.price,
  imageUri: row.image_url,
  createdAt: row.created_at,
  fulfilledAt: row.fulfilled_at,
  reservation: row.reservation ?? 'none',
});

// Known failures become codes the screens can word; anything else surfaces as "something went wrong".
const check = (error: Failure, known: Record<string, ApiErrorCode> = {}) => {
  if (!error) return;
  const code = error.code ? known[error.code] : undefined;
  throw code ? new ApiError(code) : new Error(error.message);
};

const AUTH_ERRORS: Record<string, ApiErrorCode> = {
  user_already_exists: 'email_taken',
  email_exists: 'email_taken',
  weak_password: 'weak_password',
  email_address_invalid: 'invalid_email',
  validation_failed: 'invalid_email',
  invalid_credentials: 'bad_credentials',
  email_not_confirmed: 'confirm_email',
};

const SIGNUP_REFUSALS: Record<string, ApiErrorCode> = {
  invalid_invite: 'invalid_invite',
  invalid_username: 'invalid_username',
  username_taken: 'username_taken',
};

// Postgres error codes.
const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';
const NOT_ALLOWED = '42501';
const MISSING_REFERENCE = '23503';

export const createSupabaseApi = (url: string, publishableKey: string): Api => {
  const supabase = createClient(url, publishableKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      // Password-reset links arrive as a URL carrying the session.
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  const requireMe = async () => {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new ApiError('signed_out');
    return id;
  };

  const loadUser = async (id: string) => {
    const { data, error } = await supabase.from('profiles').select(USER_COLUMNS).eq('id', id).maybeSingle();
    check(error);
    return data ? toUser(data as UserRow) : null;
  };

  const visibleWishes = async (args: { p_owner?: string; p_wish?: string }) => {
    const { data, error } = await supabase.rpc('wishes_visible', args);
    check(error);
    return (data as WishRow[]).map(toWish);
  };

  // A freshly picked photo is still on the device; anything starting with http is already online.
  const isOnDevice = (uri: string) => !/^https?:\/\//i.test(uri);

  const uploadPhoto = async (me: string, uri: string) => {
    const body = await (await fetch(uri)).arrayBuffer();
    const path = `${me}/${newId()}.jpg`;
    const { error } = await supabase.storage
      .from(PHOTOS)
      .upload(path, body, { contentType: 'image/jpeg', cacheControl: '31536000' });
    check(error);
    return supabase.storage.from(PHOTOS).getPublicUrl(path).data.publicUrl;
  };

  // Best effort: a leftover file is harmless, so a failure here never blocks the person.
  const removePhoto = async (imageUrl: string | null) => {
    const at = imageUrl?.indexOf(PUBLIC_PHOTO_PATH) ?? -1;
    if (!imageUrl || at < 0) return;
    await supabase.storage
      .from(PHOTOS)
      .remove([imageUrl.slice(at + PUBLIC_PHOTO_PATH.length)])
      .catch(() => {});
  };

  const storedImage = async (me: string, id: string) => {
    const { data, error } = await supabase
      .from('wishes')
      .select('image_url')
      .eq('id', id)
      .eq('owner_id', me)
      .maybeSingle();
    check(error);
    if (!data) throw new ApiError('wish_missing');
    return (data as { image_url: string | null }).image_url;
  };

  const setFulfilled = async (id: string, fulfilledAt: string | null) => {
    const me = await requireMe();
    const { data, error } = await supabase
      .from('wishes')
      .update({ fulfilled_at: fulfilledAt })
      .eq('id', id)
      .eq('owner_id', me)
      .select('id');
    check(error);
    if (!data?.length) throw new ApiError('wish_missing');
  };

  return {
    getSession: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session ? loadUser(data.session.user.id) : null;
    },

    signUp: async (input) => {
      const { name, username, email, inviteCode } = cleanSignUp(input);
      // Asked first for a clear message; the database checks again while creating the account.
      const verdict = await supabase.rpc('signup_check', { code: inviteCode, wanted_username: username });
      check(verdict.error);
      if (verdict.data !== 'ok') {
        const refusal = SIGNUP_REFUSALS[verdict.data as string];
        throw refusal ? new ApiError(refusal) : new Error(`signup_check: ${verdict.data}`);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: { data: { name, username, invite_code: inviteCode } },
      });
      check(error, AUTH_ERRORS);
      // No session means the project still asks people to confirm their email first.
      if (!data.session) throw new ApiError('confirm_email');
      const user = await loadUser(data.session.user.id);
      if (!user) throw new ApiError('signed_out');
      return user;
    },

    logIn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      check(error, AUTH_ERRORS);
      const user = data.user && (await loadUser(data.user.id));
      if (!user) throw new ApiError('bad_credentials');
      return user;
    },

    logOut: async () => {
      await supabase.auth.signOut({ scope: 'local' });
    },

    requestPasswordReset: async (email) => {
      const redirectTo =
        Platform.OS === 'web' ? `${window.location.origin}/reset-password` : Linking.createURL('reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail(email), { redirectTo });
      check(error, AUTH_ERRORS);
    },

    setPassword: async (password) => {
      await requireMe();
      checkPassword(password);
      const { error } = await supabase.auth.updateUser({ password });
      check(error, AUTH_ERRORS);
    },

    getInviteCode: async () => {
      const { data, error } = await supabase.rpc('invite_code');
      check(error);
      return (data as string | null) ?? null;
    },

    updateProfile: async (input) => {
      const me = await requireMe();
      const { data, error } = await supabase
        .from('profiles')
        .update(cleanProfile(input))
        .eq('id', me)
        .select(USER_COLUMNS)
        .single();
      check(error, { [UNIQUE_VIOLATION]: 'username_taken', [CHECK_VIOLATION]: 'invalid_username' });
      return toUser(data as UserRow);
    },

    listMyWishes: async () => {
      const wishes = await visibleWishes({ p_owner: await requireMe() });
      return wishes.filter((wish) => !wish.fulfilledAt);
    },

    listArchive: async () => {
      const wishes = await visibleWishes({ p_owner: await requireMe() });
      return wishes
        .filter((wish) => wish.fulfilledAt)
        .sort((a, b) => b.fulfilledAt!.localeCompare(a.fulfilledAt!));
    },

    getWish: async (id) => (await visibleWishes({ p_wish: id }))[0] ?? null,

    createWish: async (input) => {
      const me = await requireMe();
      const { imageUri, ...fields } = cleanWish(input);
      const image_url = imageUri && isOnDevice(imageUri) ? await uploadPhoto(me, imageUri) : imageUri;
      const { data, error } = await supabase
        .from('wishes')
        .insert({ ...fields, image_url })
        .select()
        .single();
      check(error);
      return toWish(data as WishRow);
    },

    updateWish: async (id, input) => {
      const me = await requireMe();
      const { imageUri, ...fields } = cleanWish(input);
      const previous = await storedImage(me, id);
      const image_url = imageUri && isOnDevice(imageUri) ? await uploadPhoto(me, imageUri) : imageUri;
      const { data, error } = await supabase
        .from('wishes')
        .update({ ...fields, image_url })
        .eq('id', id)
        .eq('owner_id', me)
        .select()
        .single();
      check(error);
      if (previous !== image_url) await removePhoto(previous);
      return toWish(data as WishRow);
    },

    deleteWish: async (id) => {
      const me = await requireMe();
      const previous = await storedImage(me, id);
      const { error } = await supabase.from('wishes').delete().eq('id', id).eq('owner_id', me);
      check(error);
      await removePhoto(previous);
    },

    // The database releases any reservation when a wish is marked as received.
    fulfillWish: (id) => setFulfilled(id, new Date().toISOString()),

    restoreWish: (id) => setFulfilled(id, null),

    listFollowing: async () => {
      const { data, error } = await supabase.rpc('following');
      check(error);
      return (data as CardRow[]).map(toProfile);
    },

    searchPeople: async (query) => {
      if (!query.trim()) return [];
      const { data, error } = await supabase.rpc('search_people', { q: query });
      check(error);
      return (data as CardRow[]).map(toProfile);
    },

    getProfile: async (userId) => {
      const { data, error } = await supabase.from('profile_cards').select().eq('id', userId).maybeSingle();
      check(error);
      return data ? toProfile(data as CardRow) : null;
    },

    listWishesOf: (userId) => visibleWishes({ p_owner: userId }),

    follow: async (userId) => {
      const { error } = await supabase.from('follows').insert({ followee_id: userId });
      // Already following counts as done.
      if (error?.code !== UNIQUE_VIOLATION) check(error);
    },

    unfollow: async (userId) => {
      const me = await requireMe();
      const { error } = await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', userId);
      check(error);
    },

    reserve: async (wishId) => {
      const { error } = await supabase.from('reservations').insert({ wish_id: wishId });
      check(error, {
        [UNIQUE_VIOLATION]: 'already_reserved',
        [NOT_ALLOWED]: 'cannot_reserve',
        [MISSING_REFERENCE]: 'cannot_reserve',
      });
    },

    unreserve: async (wishId) => {
      const me = await requireMe();
      const { error } = await supabase.from('reservations').delete().eq('wish_id', wishId).eq('reserver_id', me);
      check(error);
    },
  };
};
