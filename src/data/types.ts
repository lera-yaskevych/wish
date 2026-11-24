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

// What the viewer may know about a wish's reservation: 'mine' when they made it, 'taken'
// when someone else did. The owner sees 'taken' too, but never who it was.
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
  // Who reserved a 'taken' wish: a member's name or a guest's nickname. Only other members
  // are told; for the owner and for guests on a shared link it stays null.
  reservedBy: string | null;
  // A guest on a shared link made the reservation. Told to members so the owner can
  // remove one; always false for guests.
  reservedByGuest: boolean;
};

// A wish the viewer has reserved, with the person it is for.
export type ReservedWish = { wish: Wish; owner: User };

// Someone's list as it opens from a shared link, with or without an account.
export type SharedList = { owner: { id: string; name: string }; wishes: Wish[] };

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
  | 'nickname_required'
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
  listMyReservations: () => Promise<ReservedWish[]>;
  reserve: (wishId: string) => Promise<void>;
  unreserve: (wishId: string) => Promise<void>;

  // The secret part of the link to someone's list, yours included. Null if they are gone.
  getShareToken: (userId: string) => Promise<string | null>;
  // A list opened from its link, as someone without an account sees it. The guest key is
  // what this device keeps to recognise its own reservations. Null for an unknown link.
  getSharedList: (token: string, guestKey: string | null) => Promise<SharedList | null>;
  reserveAsGuest: (input: { token: string; wishId: string; guestKey: string; nickname: string }) => Promise<void>;
  unreserveAsGuest: (input: { wishId: string; guestKey: string }) => Promise<void>;
  // For the owner of a wish: frees it from a guest's reservation. Members' stay theirs.
  releaseGuestReservation: (wishId: string) => Promise<void>;
};
