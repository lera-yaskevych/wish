# Wishlist

A small web app for family and friends to keep wishlists. Everyone has their own
list, follows the people they buy gifts for, and can quietly reserve a wish so
nobody buys the same thing twice. It runs in the phone's browser and can be added
to the home screen like an app. English and Ukrainian.

## What it does

- **Your list.** Add a wish with just a few words, or attach a note, a photo, a
  link and a price. Edit or delete it later.
- **Archive.** When you receive something, mark it "I got this" and it moves to
  the archive. You can put it back on the list from there.
- **Friends.** Find people by name or username and follow them to see their lists.
- **Reserving.** On a friend's list, reserve a wish you plan to give. Other friends
  see that it is taken, but not by whom. The owner of the list sees nothing, so the
  surprise is kept.
- **Languages.** The app follows the phone's language. Switch between English and
  Ukrainian in your profile, or from the link on the sign-up screen.

## Using it

1. Create an account with your name, email and a password. You stay signed in.
2. Tap **+** on **My list** to add a wish. Only the first field is required.
3. Open a wish to edit it, mark it as received, or delete it.
4. Go to **Friends → Find people**, search for someone and tap **Follow**.
5. Open a friend's list and tap **Reserve** on what you will give. **Undo** releases it.
6. Tap your initial at the top of **My list** to change your name, username,
   birthday or language, or to log out.

To keep it on your phone, open it in the browser and choose **Add to Home Screen**
(Share menu in Safari, the ⋮ menu in Chrome).

## Current state

This is a working front end on demo data. Accounts, wishes, follows and
reservations are saved in the browser they were created in and are **not shared
between devices yet**.

## Running it on your computer

You need Node 22 (the project has an `.nvmrc`).

```bash
nvm use
npm install
npx expo start --web
```

Then open <http://localhost:8081>. To try it on a phone on the same Wi-Fi, open
`http://<your-computer's-address>:8081`; on a Mac, `ipconfig getifaddr en0` prints
that address.

A demo account with a filled-in list and a few friends is defined in
[`src/data/seed.ts`](src/data/seed.ts). Signing up instead gives you an empty list.

Before finishing a change, run the type check:

```bash
npm run typecheck
```

## Where things live

| Path | What is there |
| --- | --- |
| `src/app/` | The screens. Each file is a page (Expo Router). |
| `src/components/` | Shared pieces: buttons, fields, wish cards, sheets. |
| `src/data/` | Everything about accounts and wishes. Screens only talk to `api` in `index.ts`; `local.ts` is the in-browser version that a real backend will replace. |
| `src/i18n/` | All on-screen text: `en.ts` and `uk.ts`. Edit wording here. |
| `src/theme.ts` | Colours, fonts and text styles. |
| `public/` | Web app manifest, home-screen icons and the HTML shell. |

Built with Expo (React Native for Web) and TypeScript.
