// Demo content for the on-device store, used when no backend is configured.
// Log in with DEMO_LOGIN to see every screen filled in.

export const DEMO_LOGIN = { email: 'valeria@email.com', password: 'wishlist-demo' };

// What the demo store accepts in the sign-up screen's invite field.
export const DEMO_INVITE_CODE = 'family';

type SeedWish = {
  title: string;
  note?: string;
  url?: string;
  price?: string;
  // "demo:<tint>" renders the tinted placeholder from the design instead of a photo.
  imageUri?: string;
  fulfilledAt?: string;
  reservedBy?: string;
};

type SeedUser = {
  id: string;
  name: string;
  username: string;
  birthday?: string;
  email: string;
  password: string;
  follows?: string[];
  wishes: SeedWish[];
};

export const seedUsers: SeedUser[] = [
  {
    id: 'u-valeria',
    name: 'Valeria',
    username: 'valeria',
    ...DEMO_LOGIN,
    follows: ['u-marta', 'u-jonas', 'u-anya', 'u-leo'],
    wishes: [
      {
        title: 'Ceramic pour-over set',
        note: 'The matte white one, not the glossy. Dripper plus the carafe if possible.',
        url: 'https://ceramics-studio.com/pour-over',
        price: '€48',
        imageUri: 'demo:sand',
      },
      { title: 'Linen bedding, oat', note: 'Double size · any neutral', imageUri: 'demo:sage' },
      { title: 'Hiking poles', url: 'https://outdoor-shop.com/hiking-poles', price: '€75' },
      { title: 'A day trip somewhere by the sea — just the two of us.' },
      { title: 'Any book by Ursula K. Le Guin', note: 'Paperback is perfect' },
      { title: 'Enamel teapot', imageUri: 'demo:sand', fulfilledAt: '2026-10-03T10:00:00.000Z' },
      { title: 'Cooking class for two', fulfilledAt: '2026-08-14T10:00:00.000Z' },
      { title: 'Wool throw blanket', imageUri: 'demo:sage', fulfilledAt: '2025-12-26T10:00:00.000Z' },
    ],
  },
  {
    id: 'u-marta',
    name: 'Marta Kovač',
    username: 'marta.kovac',
    birthday: '11-02',
    email: 'marta@example.com',
    password: 'wishlist-demo',
    wishes: [
      {
        title: 'Trail running vest',
        note: 'Size S. Any colour except neon yellow, please.',
        url: 'https://outdoor-shop.com/trail-vest',
        price: '€65',
        imageUri: 'demo:sage',
      },
      { title: 'Hand-thrown mug', imageUri: 'demo:sand', reservedBy: 'u-valeria' },
      { title: 'Tickets to anything at the philharmonic.' },
      {
        title: 'Polaroid film, colour',
        url: 'https://photo-supply.com/polaroid-colour',
        price: '€18',
        reservedBy: 'u-jonas',
      },
      { title: 'Merino running socks', note: 'Size 38–40', price: '€22' },
      { title: 'Proofing basket', url: 'https://bakers-corner.com/banneton', price: '€24', imageUri: 'demo:sand' },
      { title: 'A long breakfast somewhere new.' },
      { title: 'The Dispossessed', note: 'Any edition' },
    ],
  },
  {
    id: 'u-jonas',
    name: 'Jonas Weber',
    username: 'jonas',
    email: 'jonas@example.com',
    password: 'wishlist-demo',
    wishes: [
      { title: 'Chef’s knife, 20 cm', url: 'https://kitchen-works.com/chef-knife', price: '€89', imageUri: 'demo:sand' },
      { title: 'Bike repair stand', price: '€60' },
      { title: 'Record brush', note: 'Carbon fibre', price: '€12' },
      { title: 'A weekend with no plans at all.' },
      { title: 'Wool beanie', note: 'Dark green or navy', imageUri: 'demo:sage' },
      { title: 'Espresso cups, set of two', url: 'https://ceramics-studio.com/espresso', price: '€28' },
      { title: 'Headlamp', price: '€35' },
      { title: 'Field notebook', note: 'Dotted pages' },
      { title: 'Climbing chalk bag', price: '€19', imageUri: 'demo:sand' },
      { title: 'Someone to teach me to make pasta.' },
      { title: 'Thermos, 1 litre', url: 'https://outdoor-shop.com/thermos', price: '€32' },
      { title: 'Chess set', note: 'Wooden, travel size' },
    ],
  },
  {
    id: 'u-anya',
    name: 'Anya',
    username: 'anya',
    email: 'anya@example.com',
    password: 'wishlist-demo',
    wishes: [
      { title: 'Watercolour paper, A4', note: 'Cold pressed, 300 gsm', price: '€16' },
      { title: 'Silk scarf', imageUri: 'demo:sage', price: '€40' },
      { title: 'A picnic when it’s warm again.' },
    ],
  },
  {
    id: 'u-leo',
    name: 'Leo Martin',
    username: 'leo.martin',
    email: 'leo@example.com',
    password: 'wishlist-demo',
    wishes: [],
  },
  {
    id: 'u-sofia',
    name: 'Sofia Romero',
    username: 'sofiar',
    email: 'sofia@example.com',
    password: 'wishlist-demo',
    wishes: [{ title: 'Film camera strap', price: '€25' }, { title: 'Dinner at that tiny ramen place.' }],
  },
  {
    id: 'u-sofie',
    name: 'Sofie Lund',
    username: 'sofie.lund',
    birthday: '03-19',
    email: 'sofie@example.com',
    password: 'wishlist-demo',
    wishes: [{ title: 'Beeswax candles', note: 'The tall ones', price: '€14', imageUri: 'demo:sand' }],
  },
  {
    id: 'u-sofiya',
    name: 'Sofiya Petrenko',
    username: 'sofiya',
    email: 'sofiya@example.com',
    password: 'wishlist-demo',
    wishes: [],
  },
];
