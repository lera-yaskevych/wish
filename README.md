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
  see that it is taken, but not by whom. The owner of the list sees nothing, so the
  surprise is kept.
- **Invite only.** Creating an account needs an invite code, so lists are seen only
  by people who were invited.
- **Notifications.** Turn them on in your profile to hear when someone you follow
  adds a wish. On iPhone this works once the app is on the Home Screen.
- **Languages.** English, Ukrainian and Turkish. The app follows the phone's
  language; switch in your profile or from the links on the sign-up screen.

## Using it

1. Create an account with your name, a username, email, a password and the invite
   code you were given. You stay signed in.
2. Tap **+** on **My list** to add a wish. Only the first field is required.
3. Open a wish to edit it, mark it as received, or delete it.
4. Go to **Friends → Find people**, search for someone and tap **Follow**.
5. Open a friend's list and tap **Reserve** on what you will give. **Undo** releases it.
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
whenever a wish is added.

Three rules are enforced by the database itself:

- Only someone with the invite code can sign up.
- A reservation is visible only to the person who made it. Other friends see that
  the wish is taken; its owner sees nothing.
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
login and invite code are in [`src/data/seed.ts`](src/data/seed.ts).

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
