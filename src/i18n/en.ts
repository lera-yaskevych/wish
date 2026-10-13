import type { ApiErrorCode, Profile } from '@/data/types';
import { firstName } from '@/lib/format';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "11-02" → "2 Nov"
const dayMonth = (birthday: string) => {
  const [month, day] = birthday.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};

const monthYear = (iso: string) => {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const wishCount = (count: number) =>
  count === 0 ? 'No wishes yet' : count === 1 ? '1 wish' : `${count} wishes`;

const errors: Record<ApiErrorCode | 'unknown', string> = {
  signed_out: 'You’re signed out. Please log in again.',
  wish_missing: 'This wish no longer exists.',
  name_required: 'Tell us your name.',
  invalid_email: 'That email doesn’t look right.',
  weak_password: 'Use at least 8 characters for your password.',
  email_taken: 'There’s already an account with that email. Try logging in.',
  bad_credentials: 'That email and password don’t match.',
  invalid_username: 'Usernames are 3–24 characters: Latin letters, numbers, dots or underscores.',
  username_taken: 'That username is taken.',
  title_required: 'Give your wish a name.',
  cannot_reserve: 'This wish can’t be reserved.',
  already_reserved: 'Someone just reserved this one.',
  invalid_invite: 'That invite code isn’t right. Ask whoever invited you.',
  confirm_email: 'Check your email and confirm your address, then log in.',
  email_required: 'Type your email above first.',
  reset_unavailable: 'Password reset by email arrives once accounts move online.',
  unknown: 'Something went wrong. Please try again.',
};

export const en = {
  quote: (text: string) => `“${text}”`,
  wishCount,
  errors,

  common: {
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    backTo: (place: string) => `Back to ${place}`,
    close: 'Close',
  },

  tabs: { myList: 'My list', friends: 'Friends' },

  auth: {
    // Second part is set in italics.
    headline: ['Make a list.', 'Let friends do the rest.'],
    welcome: ['Welcome ', 'back.'],
    intro: 'Keep your wishes in one place and see what the people you follow are hoping for.',
    name: 'Name',
    namePlaceholder: 'Valeria',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    password: 'Password',
    newPasswordPlaceholder: 'At least 8 characters',
    passwordPlaceholder: 'Your password',
    createAccount: 'Create account',
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    forgot: 'Forgot password?',
    resetSent: 'If there’s an account for that email, a link to choose a new password is on its way.',
    username: 'Username',
    usernameHint: 'Friends can find you by this name.',
    inviteCode: 'Invite code',
    inviteCodePlaceholder: 'From whoever invited you',
    newPasswordTitle: ['Choose a ', 'new password.'],
    newPassword: 'New password',
    savePassword: 'Save password',
    staySignedIn: 'You’ll stay signed in on this device',
    newHere: 'New here?',
    createAnAccount: 'Create an account',
  },

  myList: {
    title: 'My wishlist',
    archive: 'Archive',
    profile: 'Your profile',
    addWish: 'Add a wish',
    emptyTitle: 'Nothing here yet.',
    emptyBody: 'Add the first thing you’re hoping for — a thing, an idea, an experience.',
  },

  card: {
    note: 'Note',
    reserve: 'Reserve',
    reservedByYou: 'Reserved by you',
    reserved: 'Reserved',
    undo: 'Undo',
    undoReservation: 'Undo reservation',
  },

  wish: {
    edit: 'Edit',
    gotThis: 'I got this',
    putBack: 'Put back on my list',
    deleteWish: 'Delete wish',
    gone: 'This wish is no longer on the list.',
    ownedBy: (name: string) => `${firstName(name)}’s wish`,
    fulfilledOn: (iso: string) => `Fulfilled · ${monthYear(iso)}`,
    open: (domain: string) => `Open ${domain}`,
    reserveGift: 'Reserve this gift',
    alreadyReserved: 'Already reserved',
    takenNote: 'Someone else is taking care of this one.',
    secretNote: (name: string) =>
      `${firstName(name)} won’t see who reserved it — other friends will just see it’s taken.`,
    secretNoteShort: (name: string) => `${firstName(name)} won’t see who reserved it.`,
    deleteTitle: 'Delete this wish?',
    deleteBody: (title: string) => `“${title}” will be removed for good.`,
    deleteHint: 'If you received it, mark it as fulfilled instead — it’ll be kept in your archive.',
    delete: 'Delete',
    markFulfilled: 'Mark as fulfilled instead',
  },

  form: {
    newTitle: 'New wish',
    editTitle: 'Edit wish',
    question: 'What do you wish for?',
    wish: 'Wish',
    wishPlaceholder: 'A thing, an idea, an experience…',
    note: 'Note',
    notePlaceholder: 'Size, colour, why you want it — anything that helps',
    link: 'Link',
    linkPlaceholder: 'shop.com/the-thing',
    price: 'Price',
    pricePlaceholder: '€48',
    photo: 'Photo',
    addIfYouLike: 'Add if you like',
    autoFillHint: 'Paste a link and we’ll fill in the photo and price for you.',
    lookingUp: 'Looking for a photo and price…',
    removePhoto: 'Remove photo',
    badLink: 'That link doesn’t look right.',
    photoFailed: 'That photo couldn’t be added. Try a different one.',
  },

  archive: {
    title: 'Archive',
    subtitle: 'Wishes that came true',
    restore: 'Restore',
    restoreItem: (title: string) => `Restore ${title}`,
    emptyTitle: 'Nothing here yet.',
    emptyBody: 'When you receive something from your list, it’s kept here.',
  },

  friends: {
    title: 'Friends',
    findPeople: 'Find people',
    followingCount: (count: number) =>
      count === 0 ? 'You’re not following anyone yet' : `You follow ${count} ${count === 1 ? 'person' : 'people'}`,
    emptyTitle: 'It’s quiet in here.',
    emptyBody: 'Follow family and friends to see what they’re hoping for.',
    subtitle: (profile: Profile) =>
      [wishCount(profile.wishCount), profile.birthday && `birthday ${dayMonth(profile.birthday)}`]
        .filter(Boolean)
        .join(' · '),
    listOf: (name: string) => `${firstName(name)}’s list`,
    follow: 'Follow',
    following: 'Following',
    noWishesTitle: 'No wishes yet.',
    noWishesBody: (name: string) =>
      `${firstName(name)} hasn’t added anything. Check back before the next occasion.`,
  },

  find: {
    title: 'Find people',
    placeholder: 'Search by name or username',
    none: 'No one by that name yet.',
    inviteTitle: 'Friend not here yet?',
    inviteBody: 'Send them a link to your list.',
    share: 'Share',
    copied: 'Copied',
    shareMessage: (username: string, link: string | null) =>
      link
        ? `I keep my wishlist in the Wishlist app. Join with this link and find me as @${username}: ${link}`
        : `I keep my wishlist in the Wishlist app. Find me there as @${username}.`,
  },

  profile: {
    title: 'Profile',
    name: 'Name',
    username: 'Username',
    birthdayDay: 'Birthday · day',
    birthdayMonth: 'Month',
    birthdayHint: 'Friends see it next to your name. No year needed.',
    birthdayError: 'That birthday doesn’t look right — use a day and a month, like 2 and 11.',
    language: 'Language',
    logOut: 'Log out',
  },
};

export type Dictionary = typeof en;
