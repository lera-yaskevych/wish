export type User = {
  id: string;
  name: string;
  username: string;
  // Month and day as "MM-DD"; the year is never collected.
  birthday: string | null;
};

export type Profile = User & {
  wishCount: number;
  isFollowing: boolean;
};

// What the viewer may know about a wish's reservation. The owner always gets 'none'.
export type Reservation = 'none' | 'mine' | 'taken';

export type Wish = {
  id: string;
  ownerId: string;
  title: string;
  note: string | null;
  url: string | null;
  price: string | null;
  imageUri: string | null;
  createdAt: string;
  fulfilledAt: string | null;
  reservation: Reservation;
};

export type WishInput = {
  title: string;
  note: string | null;
  url: string | null;
  price: string | null;
  imageUri: string | null;
};

export type ApiErrorCode =
  | 'signed_out'
  | 'wish_missing'
  | 'name_required'
  | 'invalid_email'
  | 'weak_password'
  | 'email_taken'
  | 'bad_credentials'
  | 'invalid_username'
  | 'username_taken'
  | 'title_required'
  | 'cannot_reserve'
  | 'already_reserved'
  | 'invalid_invite'
  | 'confirm_email'
  | 'email_required'
  | 'reset_unavailable';

// The data layer reports what went wrong as a code; screens turn it into words.
export class ApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode) {
    super(code);
    this.code = code;
  }
}

export type Api = {
  getSession: () => Promise<User | null>;
  signUp: (input: {
    name: string;
    username: string;
    email: string;
    password: string;
    inviteCode: string;
  }) => Promise<User>;
  logIn: (input: { email: string; password: string }) => Promise<User>;
  logOut: () => Promise<void>;
  // Emails a link that opens the app's reset-password screen, already signed in.
  requestPasswordReset: (email: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  // Web push: remembers how to reach a device, and in which language to write to it.
  savePushSubscription: (subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
    language: string;
  }) => Promise<void>;
  removePushSubscription: (endpoint: string) => Promise<void>;
  // For members to pass on in an invite link.
  getInviteCode: () => Promise<string | null>;
  updateProfile: (patch: { name: string; username: string; birthday: string | null }) => Promise<User>;

  listMyWishes: () => Promise<Wish[]>;
  listArchive: () => Promise<Wish[]>;
  getWish: (id: string) => Promise<Wish | null>;
  createWish: (input: WishInput) => Promise<Wish>;
  updateWish: (id: string, input: WishInput) => Promise<Wish>;
  deleteWish: (id: string) => Promise<void>;
  fulfillWish: (id: string) => Promise<void>;
  restoreWish: (id: string) => Promise<void>;

  listFollowing: () => Promise<Profile[]>;
  searchPeople: (query: string) => Promise<Profile[]>;
  getProfile: (userId: string) => Promise<Profile | null>;
  listWishesOf: (userId: string) => Promise<Wish[]>;
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  reserve: (wishId: string) => Promise<void>;
  unreserve: (wishId: string) => Promise<void>;
};
