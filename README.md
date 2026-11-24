# Wish

A small web app for family and friends to keep wishlists. Everyone has their own
list, follows the people they buy gifts for, and can quietly reserve a wish so
nobody buys the same thing twice. It runs in the phone's browser and can be added
to the home screen like an app. English, Ukrainian and Turkish.

**Live at <https://wish-omega-coral.vercel.app>.** Signing up needs an invite code. Write me an email at valerie.yaskevych@gmail.com if you would like to get the code to join.

## What it does

- **Your list.** Add a wish with just a few words, or attach a note, a photo, a
  link and a price. Edit or delete it later.
- **Archive.** When you receive something, mark it "I got this" and it moves to
  the archive. You can put it back on the list from there.
- **Friends.** Find people by name or username and follow them to keep their
  lists one tap away.
- **Reserving.** On a friend's list, reserve a wish you plan to give. Other friends
  see who reserved it, so you can team up. The owner of the list only sees that it
  is reserved, never by whom, so the surprise is kept. The Reserved tab lists
  everything you have promised to give.
- **Giving.** Once you have given a gift you reserved, open it and tap **Mark as
  given**. The owner is asked whether it arrived: **Yes, I got it** moves it to
  their archive, **No, not yet** keeps it on the list, still reserved by you. They
  are still not told who it was from. The owner can mark anything as received with
  **I got this** at any time, asked or not.
- **Sharing a list.** Tap **Share list** on your own list or a friend's to send a
  link. Anyone with the link can see the list without an account and reserve a
  wish by leaving a nickname. Friends in the app see that nickname. People on the
  link see only that a wish is taken, and can undo their own from the same browser.
  If someone on a link reserves something they won't give, the list's owner can
  remove that reservation from the wish. Friends' reservations stay theirs to undo.
- **Invite only.** Creating an account needs an invite code, so lists are seen only
  by people who were invited.
- **Notifications.** Turn them on in your profile to hear when someone you follow
  adds a wish, and when someone marks a gift for you as given. On iPhone this works
  once the app is on the Home Screen.
- **Languages.** English, Ukrainian and Turkish. The app follows the phone's
  language; switch in your profile or from the links on the sign-up screen.

## Using it

1. Create an account with your name, a username, email, a password and the invite
   code you were given. You stay signed in.
2. Tap **+** on **My list** to add a wish. Only the first field is required.
3. Open a wish to edit it, mark it as received, or delete it.
4. Go to **Friends → Find people**, search for someone and tap **Follow**.
5. Open a friend's list and tap **Reserve** on what you will give. **Undo** releases it.
   **Share list** at the top sends a link to that list to someone without an account.
6. Tap your initial at the top of **My list** to change your name, username,
   birthday or language, or to log out.
7. To invite someone, tap **Share** in **Friends → Find people**. It sends a link
   that opens sign-up with the invite code already filled in.

To keep it on your phone, open it in the browser and choose **Add to Home Screen**
(Share menu in Safari, the ⋮ menu in Chrome).

## How it is built

The app is written with Expo (React Native for Web) and TypeScript. Accounts,
wishes and photos are stored in [Supabase](https://supabase.com). The tables, and
the rules for who may see what, are in [`supabase/migrations`](supabase/migrations).
It is hosted on [Vercel](https://vercel.com), which redeploys on every push to `main`.
Notifications are web push: the database calls the function in [`api/push.ts`](api/push.ts)
whenever a wish is added or a gift is marked as given.

These rules are enforced by the database itself:

- Only someone with the invite code can sign up.
- Who reserved a wish is shown only to other members. Its owner sees that it is
  reserved, never by whom. People on a shared link see the same as the owner, so
  the owner cannot find out by opening their own link signed out.
- A shared link opens one person's current wishes and nothing else. It is a random
  code, not the person's id, and a guest can reserve only from that list.
- Only the person who reserved a wish can mark it as given, and only its owner can
  answer. Other friends are not told it was given.
- Once a wish is marked as received, friends no longer see it.

## Running it locally

Needs Node 22.

```bash
nvm use
npm install
npx expo start --web
```

Then open <http://localhost:8081>.

To connect a Supabase project, copy `.env.example` to `.env.local` and fill in its
two values. Without them the app runs on demo data kept in the browser; the demo
login and invite code are in [`src/data/seed.ts`](src/data/seed.ts). To try the demo
while `.env.local` is filled in, start with `EXPO_PUBLIC_DEMO=1 npx expo start --web`.

| Command | What it does |
| --- | --- |
| `npm run typecheck` | Checks the types. |
| `npm run test:rules` | Checks the access rules against a local Supabase (`npx supabase start`). |

## Where things live

| Path | What is there |
| --- | --- |
| `src/app/` | The screens. Each file is a page (Expo Router). |
| `src/components/` | Shared pieces: buttons, fields, wish cards, sheets. |
| `src/data/` | Accounts and wishes. Screens only talk to `api` in `index.ts`, which uses `supabase.ts` or, when no backend is configured, `local.ts`. |
| `src/i18n/` | All on-screen text, one file per language. |
| `src/lib/` | Small helpers: usernames, links, photos, sharing. |
| `src/theme.ts` | Colours, fonts and text styles. |
| `supabase/` | Database tables, access rules and their test. |
| `api/` | The server function that sends notifications. |
| `public/` | Web app manifest, home-screen icons, service worker and the HTML shell. |
