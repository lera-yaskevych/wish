import { ApiError, type WishInput } from './types';

// Input rules shared by every backend, so the on-device store and the real one
// accept and reject exactly the same things. The database repeats the important
// ones as constraints; these give the person a clear message first.

export const MIN_PASSWORD_LENGTH = 8;

export const cleanEmail = (email: string) => {
  const clean = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(clean)) throw new ApiError('invalid_email');
  return clean;
};

export const checkPassword = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) throw new ApiError('weak_password');
};

export const cleanSignUp = (input: { name: string; email: string; password: string; inviteCode: string }) => {
  const name = input.name.trim();
  if (!name) throw new ApiError('name_required');
  const email = cleanEmail(input.email);
  checkPassword(input.password);
  const inviteCode = input.inviteCode.trim();
  if (!inviteCode) throw new ApiError('invalid_invite');
  return { name, email, inviteCode };
};

export const cleanProfile = (input: { name: string; username: string; birthday: string | null }) => {
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase().replace(/^@/, '');
  if (!name) throw new ApiError('name_required');
  if (!/^[a-z0-9._]{3,24}$/.test(username)) throw new ApiError('invalid_username');
  return { name, username, birthday: input.birthday };
};

export const cleanWish = (input: WishInput): WishInput => {
  const title = input.title.trim();
  if (!title) throw new ApiError('title_required');
  return {
    title,
    note: input.note?.trim() || null,
    url: input.url?.trim() || null,
    price: input.price?.trim() || null,
    imageUri: input.imageUri || null,
  };
};
