import AsyncStorage from '@react-native-async-storage/async-storage';

import { newId, sha256Hex } from '@/lib/ids';
import { usernameFrom } from '@/lib/username';

import { seedUsers } from './seed';
import { ApiError, type Api, type Profile, type User, type Wish, type WishInput } from './types';

// On-device implementation of the Api. Everything lives in AsyncStorage on this
// phone only, so accounts and lists are not shared between devices yet.

const DB_KEY = 'wishlist.db.v1';
const SESSION_KEY = 'wishlist.session';

type StoredUser = User & { email: string; salt: string; passwordHash: string };
type StoredWish = Omit<Wish, 'reservation'> & { reservedBy: string | null };
type Db = {
  users: StoredUser[];
  wishes: StoredWish[];
  follows: { followerId: string; followeeId: string }[];
};

const hashPassword = (salt: string, password: string) => sha256Hex(`${salt}:${password}`);

const buildSeedDb = async (): Promise<Db> => {
  const db: Db = { users: [], wishes: [], follows: [] };
  const newest = Date.UTC(2026, 9, 1);
  for (const seed of seedUsers) {
    const salt = newId();
    db.users.push({
      id: seed.id,
      name: seed.name,
      username: seed.username,
      birthday: seed.birthday ?? null,
      email: seed.email,
      salt,
      passwordHash: hashPassword(salt, seed.password),
    });
    for (const followeeId of seed.follows ?? []) db.follows.push({ followerId: seed.id, followeeId });
    seed.wishes.forEach((wish, index) => {
      db.wishes.push({
        id: `${seed.id}-w${index + 1}`,
        ownerId: seed.id,
        title: wish.title,
        note: wish.note ?? null,
        url: wish.url ?? null,
        price: wish.price ?? null,
        imageUri: wish.imageUri ?? null,
        createdAt: new Date(newest - index * 60_000).toISOString(),
        fulfilledAt: wish.fulfilledAt ?? null,
        reservedBy: wish.reservedBy ?? null,
      });
    });
  }
  return db;
};

let dbPromise: Promise<Db> | null = null;

const saveDb = (db: Db) => AsyncStorage.setItem(DB_KEY, JSON.stringify(db));

const loadDb = () => {
  dbPromise ??= (async () => {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
    const db = await buildSeedDb();
    await saveDb(db);
    return db;
  })();
  return dbPromise;
};

const toUser = ({ id, name, username, birthday }: StoredUser): User => ({ id, name, username, birthday });

const toWish = ({ reservedBy, ...wish }: StoredWish, viewerId: string): Wish => ({
  ...wish,
  reservation:
    wish.ownerId === viewerId || !reservedBy ? 'none' : reservedBy === viewerId ? 'mine' : 'taken',
});

const toProfile = (db: Db, user: StoredUser, viewerId: string): Profile => ({
  ...toUser(user),
  wishCount: db.wishes.filter((w) => w.ownerId === user.id && !w.fulfilledAt).length,
  isFollowing: db.follows.some((f) => f.followerId === viewerId && f.followeeId === user.id),
});

const byNewest = (a: StoredWish, b: StoredWish) => b.createdAt.localeCompare(a.createdAt);

const requireViewer = async (db: Db) => {
  const id = await AsyncStorage.getItem(SESSION_KEY);
  const viewer = db.users.find((u) => u.id === id);
  if (!viewer) throw new ApiError('signed_out');
  return viewer;
};

const requireOwnWish = (db: Db, viewer: StoredUser, id: string) => {
  const wish = db.wishes.find((w) => w.id === id && w.ownerId === viewer.id);
  if (!wish) throw new ApiError('wish_missing');
  return wish;
};

const uniqueUsername = (db: Db, name: string) => {
  const base = usernameFrom(name);
  let candidate = base;
  for (let n = 2; db.users.some((u) => u.username === candidate); n++) candidate = `${base}${n}`;
  return candidate;
};

const cleanInput = (input: WishInput): WishInput => ({
  title: input.title.trim(),
  note: input.note?.trim() || null,
  url: input.url?.trim() || null,
  price: input.price?.trim() || null,
  imageUri: input.imageUri || null,
});

export const localApi: Api = {
  getSession: async () => {
    const db = await loadDb();
    const id = await AsyncStorage.getItem(SESSION_KEY);
    const user = db.users.find((u) => u.id === id);
    return user ? toUser(user) : null;
  },

  signUp: async ({ name, email, password }) => {
    const db = await loadDb();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) throw new ApiError('name_required');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new ApiError('invalid_email');
    if (password.length < 8) throw new ApiError('weak_password');
    if (db.users.some((u) => u.email === cleanEmail)) {
      throw new ApiError('email_taken');
    }
    const salt = newId();
    const user: StoredUser = {
      id: newId(),
      name: cleanName,
      username: uniqueUsername(db, cleanName),
      birthday: null,
      email: cleanEmail,
      salt,
      passwordHash: hashPassword(salt, password),
    };
    db.users.push(user);
    await saveDb(db);
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    return toUser(user);
  },

  logIn: async ({ email, password }) => {
    const db = await loadDb();
    const user = db.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || hashPassword(user.salt, password) !== user.passwordHash) {
      throw new ApiError('bad_credentials');
    }
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    return toUser(user);
  },

  logOut: () => AsyncStorage.removeItem(SESSION_KEY),

  updateProfile: async ({ name, username, birthday }) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanName) throw new ApiError('name_required');
    if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername)) {
      throw new ApiError('invalid_username');
    }
    if (db.users.some((u) => u.id !== viewer.id && u.username === cleanUsername)) {
      throw new ApiError('username_taken');
    }
    viewer.name = cleanName;
    viewer.username = cleanUsername;
    viewer.birthday = birthday;
    await saveDb(db);
    return toUser(viewer);
  },

  listMyWishes: async () => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    return db.wishes
      .filter((w) => w.ownerId === viewer.id && !w.fulfilledAt)
      .sort(byNewest)
      .map((w) => toWish(w, viewer.id));
  },

  listArchive: async () => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    return db.wishes
      .filter((w) => w.ownerId === viewer.id && w.fulfilledAt)
      .sort((a, b) => b.fulfilledAt!.localeCompare(a.fulfilledAt!))
      .map((w) => toWish(w, viewer.id));
  },

  getWish: async (id) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const wish = db.wishes.find((w) => w.id === id);
    // Other people's fulfilled wishes are no longer visible to friends.
    if (!wish || (wish.ownerId !== viewer.id && wish.fulfilledAt)) return null;
    return toWish(wish, viewer.id);
  },

  createWish: async (input) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const clean = cleanInput(input);
    if (!clean.title) throw new ApiError('title_required');
    const wish: StoredWish = {
      id: newId(),
      ownerId: viewer.id,
      ...clean,
      createdAt: new Date().toISOString(),
      fulfilledAt: null,
      reservedBy: null,
    };
    db.wishes.push(wish);
    await saveDb(db);
    return toWish(wish, viewer.id);
  },

  updateWish: async (id, input) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const wish = requireOwnWish(db, viewer, id);
    const clean = cleanInput(input);
    if (!clean.title) throw new ApiError('title_required');
    Object.assign(wish, clean);
    await saveDb(db);
    return toWish(wish, viewer.id);
  },

  deleteWish: async (id) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const wish = requireOwnWish(db, viewer, id);
    db.wishes.splice(db.wishes.indexOf(wish), 1);
    await saveDb(db);
  },

  fulfillWish: async (id) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const wish = requireOwnWish(db, viewer, id);
    wish.fulfilledAt = new Date().toISOString();
    wish.reservedBy = null;
    await saveDb(db);
  },

  restoreWish: async (id) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    requireOwnWish(db, viewer, id).fulfilledAt = null;
    await saveDb(db);
  },

  listFollowing: async () => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    return db.follows
      .filter((f) => f.followerId === viewer.id)
      .map((f) => db.users.find((u) => u.id === f.followeeId))
      .filter((u): u is StoredUser => !!u)
      .map((u) => toProfile(db, u, viewer.id));
  },

  searchPeople: async (query) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const needle = query.trim().toLowerCase().replace(/^@/, '');
    if (!needle) return [];
    return db.users
      .filter((u) => u.id !== viewer.id)
      .filter((u) => u.name.toLowerCase().includes(needle) || u.username.includes(needle))
      .map((u) => toProfile(db, u, viewer.id));
  },

  getProfile: async (userId) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const user = db.users.find((u) => u.id === userId);
    return user ? toProfile(db, user, viewer.id) : null;
  },

  listWishesOf: async (userId) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    return db.wishes
      .filter((w) => w.ownerId === userId && !w.fulfilledAt)
      .sort(byNewest)
      .map((w) => toWish(w, viewer.id));
  },

  follow: async (userId) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    if (userId === viewer.id) return;
    if (db.follows.some((f) => f.followerId === viewer.id && f.followeeId === userId)) return;
    db.follows.push({ followerId: viewer.id, followeeId: userId });
    await saveDb(db);
  },

  unfollow: async (userId) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    db.follows = db.follows.filter((f) => !(f.followerId === viewer.id && f.followeeId === userId));
    await saveDb(db);
  },

  reserve: async (wishId) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const wish = db.wishes.find((w) => w.id === wishId && !w.fulfilledAt);
    if (!wish || wish.ownerId === viewer.id) throw new ApiError('cannot_reserve');
    if (wish.reservedBy && wish.reservedBy !== viewer.id) throw new ApiError('already_reserved');
    wish.reservedBy = viewer.id;
    await saveDb(db);
  },

  unreserve: async (wishId) => {
    const db = await loadDb();
    const viewer = await requireViewer(db);
    const wish = db.wishes.find((w) => w.id === wishId);
    if (wish?.reservedBy !== viewer.id) return;
    wish.reservedBy = null;
    await saveDb(db);
  },
};
