import { timingSafeEqual } from 'node:crypto';

import webpush from 'web-push';

// Called by the database (see supabase/migrations) when someone adds a wish, and when a
// gift is marked as given. Sends each device a notification written in its language.

type Target = { endpoint: string; p256dh: string; auth: string; language: string };

// Senders from before gifts could be marked as given leave out `kind`.
type Body = { targets: Target[] } & (
  | { kind?: 'new_wish'; ownerId: string; ownerName: string; wishTitle: string }
  | { kind: 'gift_given'; wishId: string; wishTitle: string }
);

// Names stay in the form they were typed, so each phrase must work without a case ending.
const NEW_WISH: Record<string, (name: string) => string> = {
  en: (name) => `${name} added a wish`,
  uk: (name) => `${name}: нове бажання`,
  tr: (name) => `${name} yeni bir dilek ekledi`,
};

// For the owner of the wish, who is never told who gave it.
const GIFT_GIVEN: Record<string, { title: string; body: (wish: string) => string }> = {
  en: { title: 'Did you get it?', body: (wish) => `Someone says they’ve given you “${wish}”.` },
  uk: { title: 'Ви це отримали?', body: (wish) => `Хтось каже, що вже подарував вам «${wish}».` },
  tr: { title: 'Hediyeni aldın mı?', body: (wish) => `Biri “${wish}” dileğini gerçekleştirdiğini söylüyor.` },
};

const messageFor = (body: Body, language: string) => {
  if (body.kind === 'gift_given') {
    const words = GIFT_GIVEN[language] ?? GIFT_GIVEN.en;
    return { title: words.title, body: words.body(body.wishTitle), url: `/wish/${body.wishId}` };
  }
  const firstName = body.ownerName.trim().split(/\s+/)[0];
  return {
    title: (NEW_WISH[language] ?? NEW_WISH.en)(firstName),
    body: body.wishTitle,
    url: `/friends/${body.ownerId}`,
  };
};

const DAY = 60 * 60 * 24;

const sameSecret = (given: string | null, expected: string) => {
  const a = Buffer.from(given ?? '');
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Push services answer 404 or 410 once a browser has unsubscribed; those rows are dead.
const forget = async (endpoints: string[], secret: string) => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/rpc/remove_push_subscriptions`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, endpoints }),
  }).catch(() => {});
};

export const POST = async (request: Request) => {
  const secret = process.env.PUSH_SECRET;
  const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !publicKey || !privateKey) return new Response('Not configured', { status: 503 });
  if (!sameSecret(request.headers.get('authorization'), secret)) return new Response('Forbidden', { status: 403 });

  const body = (await request.json()) as Body;
  // Push services want to know who is sending; the site's own address serves as that contact.
  const vapid = { subject: new URL(request.url).origin, publicKey, privateKey };

  const gone: string[] = [];
  await Promise.all(
    body.targets.map(async ({ endpoint, p256dh, auth, language }) => {
      const notification = JSON.stringify(messageFor(body, language));
      try {
        await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, notification, {
          vapidDetails: vapid,
          TTL: DAY,
        });
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(endpoint);
      }
    }),
  );

  if (gone.length) await forget(gone, secret);
  return Response.json({ sent: body.targets.length - gone.length, removed: gone.length });
};
