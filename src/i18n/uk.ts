import type { ApiErrorCode, Profile } from '@/data/types';
import { firstName } from '@/lib/format';

import type { Dictionary } from './en';

const MONTHS = ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'вер.', 'жовт.', 'лист.', 'груд.'];

// "11-02" → "2 лист."
const dayMonth = (birthday: string) => {
  const [month, day] = birthday.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};

const monthYear = (iso: string) => {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

// Ukrainian counts three ways: 1 бажання, 2 бажання, 5 бажань (and 11–14 are always "many").
const plural = (count: number, one: string, few: string, many: string) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (last === 1 && lastTwo !== 11) return one;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
};

const wishCount = (count: number) =>
  count === 0 ? 'Поки немає бажань' : `${count} ${plural(count, 'бажання', 'бажання', 'бажань')}`;

const errors: Record<ApiErrorCode | 'unknown', string> = {
  signed_out: 'Ви вийшли з акаунта. Увійдіть знову.',
  wish_missing: 'Цього бажання вже немає.',
  name_required: 'Вкажіть своє ім’я.',
  invalid_email: 'Схоже, адреса пошти неправильна.',
  weak_password: 'Пароль має містити щонайменше 8 символів.',
  email_taken: 'Акаунт із такою поштою вже існує. Спробуйте увійти.',
  bad_credentials: 'Пошта або пароль не збігаються.',
  invalid_username: 'Нікнейм — це 3–24 символи: латинські літери, цифри, крапки або підкреслення.',
  username_taken: 'Цей нікнейм уже зайнятий.',
  title_required: 'Дайте бажанню назву.',
  cannot_reserve: 'Це бажання не можна забронювати.',
  already_reserved: 'Хтось щойно забронював це бажання.',
  invalid_invite: 'Код запрошення не підходить. Запитайте в того, хто вас запросив.',
  confirm_email: 'Перевірте пошту й підтвердьте адресу, а потім увійдіть.',
  email_required: 'Спершу введіть свою пошту вище.',
  reset_unavailable: 'На демоданих скидання пароля недоступне.',
  unknown: 'Щось пішло не так. Спробуйте ще раз.',
};

// Names are never declined here: the app cannot know the right case ending for an
// arbitrary name, so every phrase keeps the name in the nominative.
export const uk: Dictionary = {
  quote: (text) => `«${text}»`,
  wishCount,
  errors,

  common: {
    cancel: 'Скасувати',
    save: 'Зберегти',
    back: 'Назад',
    backTo: (place) => `Назад: ${place}`,
    close: 'Закрити',
  },

  tabs: { myList: 'Мій список', friends: 'Друзі' },

  auth: {
    headline: ['Складіть список.', 'Решту зроблять друзі.'],
    welcome: ['З ', 'поверненням.'],
    intro: 'Зберігайте бажання в одному місці та дивіться, про що мріють ваші друзі.',
    name: 'Ім’я',
    namePlaceholder: 'Валерія',
    email: 'Електронна пошта',
    emailPlaceholder: 'you@email.com',
    password: 'Пароль',
    newPasswordPlaceholder: 'Щонайменше 8 символів',
    passwordPlaceholder: 'Ваш пароль',
    createAccount: 'Створити акаунт',
    haveAccount: 'Вже маєте акаунт?',
    logIn: 'Увійти',
    forgot: 'Забули пароль?',
    resetSent: 'Якщо для цієї пошти є акаунт, лист із посиланням для нового пароля вже в дорозі.',
    username: 'Нікнейм',
    usernameHint: 'За ним вас знайдуть друзі.',
    inviteCode: 'Код запрошення',
    inviteCodePlaceholder: 'Від того, хто вас запросив',
    newPasswordTitle: ['Оберіть ', 'новий пароль.'],
    newPassword: 'Новий пароль',
    savePassword: 'Зберегти пароль',
    staySignedIn: 'Ви залишитеся в акаунті на цьому пристрої',
    newHere: 'Вперше тут?',
    createAnAccount: 'Створити акаунт',
  },

  myList: {
    title: 'Мої бажання',
    archive: 'Архів',
    profile: 'Ваш профіль',
    addWish: 'Додати бажання',
    emptyTitle: 'Тут поки порожньо.',
    emptyBody: 'Додайте перше, про що мрієте: річ, ідею чи враження.',
  },

  card: {
    note: 'Нотатка',
    reserve: 'Бронюю',
    reservedByYou: 'Заброньовано вами',
    reserved: 'Заброньовано',
    undo: 'Скасувати',
    undoReservation: 'Скасувати бронювання',
  },

  wish: {
    edit: 'Редагувати',
    gotThis: 'Збулось',
    putBack: 'Повернути до списку',
    deleteWish: 'Видалити бажання',
    gone: 'Цього бажання вже немає у списку.',
    ownedBy: (name) => `${firstName(name)} бажає`,
    fulfilledOn: (iso) => `Збулось · ${monthYear(iso)}`,
    open: (domain) => `Відкрити ${domain}`,
    reserveGift: 'Забронювати подарунок',
    alreadyReserved: 'Вже заброньовано',
    takenNote: 'Про цей подарунок уже подбали.',
    secretNote: (name) =>
      `${firstName(name)} не побачить, хто забронював — інші друзі побачать лише, що подарунок зайнято.`,
    secretNoteShort: (name) => `${firstName(name)} не побачить, хто забронював.`,
    deleteTitle: 'Видалити це бажання?',
    deleteBody: (title) => `«${title}» зникне назавжди.`,
    deleteHint: 'Якщо ви вже отримали подарунок, позначте, що бажання збулось — воно збережеться в архіві.',
    delete: 'Видалити',
    markFulfilled: 'Позначити, що збулось',
  },

  form: {
    newTitle: 'Нове бажання',
    editTitle: 'Редагування',
    question: 'Чого ви бажаєте?',
    wish: 'Бажання',
    wishPlaceholder: 'Річ, ідея, враження…',
    note: 'Нотатка',
    notePlaceholder: 'Розмір, колір, чому хочеться — усе, що допоможе',
    link: 'Посилання',
    linkPlaceholder: 'shop.com/podarunok',
    price: 'Ціна',
    pricePlaceholder: '1200 ₴',
    photo: 'Фото',
    addIfYouLike: 'Додайте за бажанням',
    autoFillHint: 'Вставте посилання — і ми додамо фото та ціну.',
    lookingUp: 'Шукаємо фото та ціну…',
    removePhoto: 'Прибрати фото',
    badLink: 'Схоже, посилання неправильне.',
    photoFailed: 'Не вдалося додати це фото. Спробуйте інше.',
  },

  archive: {
    title: 'Архів',
    subtitle: 'Бажання, що збулися',
    restore: 'Повернути',
    restoreItem: (title) => `Повернути: ${title}`,
    emptyTitle: 'Тут поки порожньо.',
    emptyBody: 'Коли бажання зі списку збудеться, воно зберігатиметься тут.',
  },

  friends: {
    title: 'Друзі',
    findPeople: 'Знайти людей',
    followingCount: (count) =>
      count === 0
        ? 'Ви ще ні за ким не стежите'
        : `Ви стежите за ${count} ${plural(count, 'людиною', 'людьми', 'людьми')}`,
    emptyTitle: 'Тут поки тихо.',
    emptyBody: 'Стежте за рідними та друзями, щоб бачити, про що вони мріють.',
    subtitle: (profile: Profile) =>
      [wishCount(profile.wishCount), profile.birthday && `ДН ${dayMonth(profile.birthday)}`]
        .filter(Boolean)
        .join(' · '),
    // The screen is plainly that person's list, so the name alone is the title.
    listOf: (name) => firstName(name),
    follow: 'Стежити',
    following: 'Стежите',
    noWishesTitle: 'Бажань поки немає.',
    noWishesBody: () => 'Зазирніть сюди перед наступним святом.',
  },

  find: {
    title: 'Знайти людей',
    placeholder: 'Ім’я або нікнейм',
    none: 'Поки нікого з таким іменем.',
    inviteTitle: 'Друга ще немає тут?',
    inviteBody: 'Надішліть посилання на свій список.',
    share: 'Поділитися',
    copied: 'Скопійовано',
    shareMessage: (username, link) =>
      link
        ? `Я веду список бажань у застосунку Wish. Приєднуйтесь за посиланням і шукайте мене як @${username}: ${link}`
        : `Я веду список бажань у застосунку Wish. Шукайте мене там: @${username}.`,
  },

  profile: {
    title: 'Профіль',
    name: 'Ім’я',
    username: 'Нікнейм',
    birthdayDay: 'Народження · день',
    birthdayMonth: 'Місяць',
    birthdayHint: 'Друзі бачитимуть дату біля вашого імені. Рік не потрібен.',
    birthdayError: 'Схоже, дата неправильна — вкажіть день і місяць, наприклад 2 і 11.',
    language: 'Мова',
    logOut: 'Вийти',
  },
};
