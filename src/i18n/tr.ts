import type { ApiErrorCode, Profile } from '@/data/types';
import { firstName } from '@/lib/format';

import type { Dictionary } from './en';

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// "11-02" → "2 Kas"
const dayMonth = (birthday: string) => {
  const [month, day] = birthday.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};

const monthYear = (iso: string) => {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

// Turkish nouns stay singular after a number: 1 dilek, 5 dilek.
const wishCount = (count: number) => (count === 0 ? 'Henüz dilek yok' : `${count} dilek`);

const errors: Record<ApiErrorCode | 'unknown', string> = {
  signed_out: 'Oturumun kapanmış. Lütfen tekrar giriş yap.',
  wish_missing: 'Bu dilek artık yok.',
  name_required: 'Adını yaz.',
  invalid_email: 'Bu e-posta adresi doğru görünmüyor.',
  weak_password: 'Şifren en az 8 karakter olmalı.',
  email_taken: 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.',
  bad_credentials: 'E-posta veya şifre hatalı.',
  invalid_username: 'Kullanıcı adı 3–24 karakter olmalı: Latin harfleri, rakamlar, nokta veya alt çizgi.',
  username_taken: 'Bu kullanıcı adı alınmış.',
  title_required: 'Dileğine bir ad ver.',
  cannot_reserve: 'Bu dilek ayırtılamıyor.',
  already_reserved: 'Bu dileği az önce başkası ayırttı.',
  invalid_invite: 'Davet kodu doğru değil. Seni davet eden kişiye sor.',
  confirm_email: 'E-postanı kontrol edip adresini onayla, sonra giriş yap.',
  email_required: 'Önce yukarıya e-postanı yaz.',
  reset_unavailable: 'Demo verilerde şifre sıfırlama kullanılamaz.',
  unknown: 'Bir şeyler ters gitti. Lütfen tekrar dene.',
};

// Names are never given case endings here: the right suffix depends on the name's
// vowels, which the app cannot know for names written in other alphabets.
export const tr: Dictionary = {
  quote: (text) => `“${text}”`,
  wishCount,
  errors,

  common: {
    cancel: 'Vazgeç',
    save: 'Kaydet',
    back: 'Geri',
    backTo: (place) => `Geri: ${place}`,
    close: 'Kapat',
  },

  tabs: { myList: 'Listem', friends: 'Arkadaşlar' },

  auth: {
    headline: ['Listeni yap.', 'Gerisi arkadaşlarda.'],
    welcome: ['Tekrar ', 'hoş geldin.'],
    intro: 'Dileklerini tek bir yerde tut, takip ettiğin kişilerin neler istediğini gör.',
    name: 'Ad',
    namePlaceholder: 'Valeria',
    email: 'E-posta',
    emailPlaceholder: 'ornek@email.com',
    password: 'Şifre',
    newPasswordPlaceholder: 'En az 8 karakter',
    passwordPlaceholder: 'Şifren',
    createAccount: 'Hesap oluştur',
    haveAccount: 'Zaten hesabın var mı?',
    logIn: 'Giriş yap',
    forgot: 'Şifreni mi unuttun?',
    resetSent: 'Bu e-postaya ait bir hesap varsa, yeni şifre belirleme bağlantısı yolda.',
    username: 'Kullanıcı adı',
    usernameHint: 'Arkadaşların seni bu adla bulabilir.',
    inviteCode: 'Davet kodu',
    inviteCodePlaceholder: 'Seni davet eden kişiden',
    newPasswordTitle: ['Yeni şifreni ', 'belirle.'],
    newPassword: 'Yeni şifre',
    savePassword: 'Şifreyi kaydet',
    staySignedIn: 'Bu cihazda oturumun açık kalacak',
    newHere: 'Yeni misin?',
    createAnAccount: 'Hesap oluştur',
  },

  myList: {
    title: 'Dilek listem',
    archive: 'Arşiv',
    profile: 'Profilin',
    addWish: 'Dilek ekle',
    emptyTitle: 'Burası henüz boş.',
    emptyBody: 'İstediğin ilk şeyi ekle: bir eşya, bir fikir, bir deneyim.',
  },

  card: {
    note: 'Not',
    reserve: 'Ayırt',
    reservedByYou: 'Sen ayırttın',
    reserved: 'Ayırtıldı',
    undo: 'Vazgeç',
    undoReservation: 'Ayırtmaktan vazgeç',
  },

  wish: {
    edit: 'Düzenle',
    gotThis: 'Gerçekleşti',
    putBack: 'Listeme geri koy',
    deleteWish: 'Dileği sil',
    gone: 'Bu dilek artık listede yok.',
    ownedBy: (name) => `${firstName(name)} istiyor`,
    fulfilledOn: (iso) => `Gerçekleşti · ${monthYear(iso)}`,
    open: (domain) => `${domain} sitesini aç`,
    reserveGift: 'Bu hediyeyi ayırt',
    alreadyReserved: 'Zaten ayırtıldı',
    takenNote: 'Bu hediyeyle başka biri ilgileniyor.',
    secretNote: (name) =>
      `${firstName(name)} kimin ayırttığını görmeyecek — diğer arkadaşlar yalnızca ayırtıldığını görecek.`,
    secretNoteShort: (name) => `${firstName(name)} kimin ayırttığını görmeyecek.`,
    deleteTitle: 'Bu dilek silinsin mi?',
    deleteBody: (title) => `“${title}” kalıcı olarak silinecek.`,
    deleteHint: 'Hediyeyi aldıysan bunun yerine gerçekleşti olarak işaretle; arşivinde saklanır.',
    delete: 'Sil',
    markFulfilled: 'Gerçekleşti olarak işaretle',
  },

  form: {
    newTitle: 'Yeni dilek',
    editTitle: 'Dileği düzenle',
    question: 'Ne diliyorsun?',
    wish: 'Dilek',
    wishPlaceholder: 'Bir eşya, bir fikir, bir deneyim…',
    note: 'Not',
    notePlaceholder: 'Beden, renk, neden istediğin — işe yarayacak her şey',
    link: 'Bağlantı',
    linkPlaceholder: 'magaza.com/urun',
    price: 'Fiyat',
    pricePlaceholder: '1200 ₺',
    photo: 'Fotoğraf',
    addIfYouLike: 'İstersen ekle',
    autoFillHint: 'Bir bağlantı yapıştır, fotoğrafı ve fiyatı biz dolduralım.',
    lookingUp: 'Fotoğraf ve fiyat aranıyor…',
    removePhoto: 'Fotoğrafı kaldır',
    badLink: 'Bu bağlantı doğru görünmüyor.',
    photoFailed: 'Bu fotoğraf eklenemedi. Başka bir tane dene.',
  },

  archive: {
    title: 'Arşiv',
    subtitle: 'Gerçekleşen dilekler',
    restore: 'Geri koy',
    restoreItem: (title) => `Geri koy: ${title}`,
    emptyTitle: 'Burası henüz boş.',
    emptyBody: 'Listendeki bir dilek gerçekleştiğinde burada saklanır.',
  },

  friends: {
    title: 'Arkadaşlar',
    findPeople: 'Kişi bul',
    followingCount: (count) =>
      count === 0 ? 'Henüz kimseyi takip etmiyorsun' : `${count} kişiyi takip ediyorsun`,
    emptyTitle: 'Burası sessiz.',
    emptyBody: 'Neler istediklerini görmek için aileni ve arkadaşlarını takip et.',
    subtitle: (profile: Profile) =>
      // "DG" is the everyday short form of "doğum günü"; the full phrase does not fit beside the follow button.
      [wishCount(profile.wishCount), profile.birthday && `DG ${dayMonth(profile.birthday)}`]
        .filter(Boolean)
        .join(' · '),
    // The screen is plainly that person's list, so the name alone is the title.
    listOf: (name) => firstName(name),
    follow: 'Takip et',
    following: 'Takiptesin',
    noWishesTitle: 'Henüz dilek yok.',
    noWishesBody: () => 'Bir sonraki özel günden önce tekrar bak.',
  },

  find: {
    title: 'Kişi bul',
    placeholder: 'Ad veya kullanıcı adı',
    none: 'Bu adla henüz kimse yok.',
    inviteTitle: 'Arkadaşın burada yok mu?',
    inviteBody: 'Ona listenin bağlantısını gönder.',
    share: 'Paylaş',
    copied: 'Kopyalandı',
    shareMessage: (username, link) =>
      link
        ? `Dilek listemi Wish uygulamasında tutuyorum. Bu bağlantıyla katıl ve beni @${username} olarak bul: ${link}`
        : `Dilek listemi Wish uygulamasında tutuyorum. Beni orada @${username} olarak bulabilirsin.`,
  },

  profile: {
    title: 'Profil',
    name: 'Ad',
    username: 'Kullanıcı adı',
    birthdayDay: 'Doğum günü · gün',
    birthdayMonth: 'Ay',
    birthdayHint: 'Arkadaşların adının yanında görür. Yıl gerekmez.',
    birthdayError: 'Bu doğum günü doğru görünmüyor — gün ve ay yaz, örneğin 2 ve 11.',
    language: 'Dil',
    notifications: 'Bildirimler',
    notifyNewWishes: 'Takip ettiğin biri dilek eklediğinde',
    turnOn: 'Aç',
    turnedOn: 'Açık',
    notifyInstallHint: 'iPhone’da önce Wish’i Ana Ekrana ekle, sonra bildirimleri oradan aç.',
    notifyBlocked: 'Bu site için bildirimler tarayıcı ayarlarında engellenmiş.',
    notifyFailed: 'Bildirimler açılamadı. Lütfen tekrar dene.',
    logOut: 'Çıkış yap',
  },
};
