# Chip — stocks for kids

A Duolingo-style app that teaches kids how investing works, one bite-sized lesson at a time. Chip the bull guides learners through 22 chapters, from "what's a stock?" to building their own money plan.

**Live:** https://chip-stock-coach.vercel.app

## Features

- **Learning path:** 22 chapters of short lessons with multiple-choice, true/false, sentence-building and matching questions. A chapter review lets confident learners skip ahead.
- **Adaptive practice:** a spaced-repetition system (Leitner boxes) tracks how strong each concept is and builds practice sessions around weak or overdue skills.
- **Motivation:** hearts, XP, daily goals, streaks with a weekly calendar, achievements and daily quests that pay out coin chests.
- **Shop:** heart refills, streak freezes, a double-XP boost, and outfits for Chip.
- **Friends & leagues:** follow friends by username and race them on a weekly XP leaderboard. This is opt-in and needs a parent or guardian's OK.
- **Profile & settings:** avatar, username, bio, light/dark/auto theme, accent colour, sound, daily goal and streak emails.
- **Sync:** progress lives in `localStorage` and syncs to Firestore when the learner signs in with Google or email.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole app: styles, course content for chapters 1–2, game engine, UI and Firebase wiring |
| `chapters.js` | Chapters 3–22, loaded before the main script |
| `firebase-config.js` | Public Firebase web config |
| `firestore.rules` | Security rules for `users`, `usernames` and `profiles` |
| `apps-script/` | Google Apps Script that sends streak emails every hour |
| `.github/workflows/firestore-rules.yml` | Deploys `firestore.rules` on every push to `main` that changes them |

No build step and no dependencies. GSAP and the Firebase SDK load from CDNs.

## Run locally

```sh
python3 -m http.server 8000   # or any static server
open http://localhost:8000
```

Sign-in only works on domains listed under **Firebase console → Authentication → Settings → Authorized domains**. `localhost` is listed by default.

## Data model (Firestore)

| Collection | Who can read | Who can write | Contents |
| --- | --- | --- | --- |
| `users/{uid}` | Only the owner | Only the owner | Full private progress, plus email and time zone for streak emails |
| `usernames/{name}` | Signed-in users | The owner can claim a free name or release their own | `{ uid }`, which guarantees each username is unique |
| `profiles/{uid}` | Signed-in users | The owner, only under a username they've claimed | Public profile, opt-in: username, avatar, XP, streak, weekly XP, who they follow. Never the real name or bio. |

## Adding content

Lessons are built from helpers defined in `index.html`:

```js
I(title, html, emoji)            // info card
M(question, ['🍕|Answer', …], correctIndex, explanation, tag)  // multiple choice
T(statement, true|false, explanation, tag)                     // true / false
B(prompt, 'answer sentence', ['distractor', …], tag)           // build the sentence
P([['left', 'right'], …], tag)                                 // match pairs
```

To add a chapter, add a `ch(...)` entry to `chapters.js`. Every `tag` must exist in the `tags` map there, because tags drive the skills panel and adaptive practice. Each chapter gets a review lesson automatically.

## Deploy

- **App:** a static site, hosted on Vercel. `firebase.json` also supports Firebase Hosting (`firebase deploy --only hosting`).
- **Firestore rules:** deploy automatically through the GitHub Action. One-time setup: add a repo secret `FIREBASE_SERVICE_ACCOUNT` holding a service-account JSON key for project `chip-stocks` with the *Firebase Rules Admin* role. To deploy by hand: `firebase deploy --only firestore:rules`.
- **Streak emails:** copy `apps-script/` into a Google Apps Script project owned by an account with Firestore access. Run `selfTest()` once to check access and send sample emails, then `setup()` to install the hourly trigger.

## Testing the rules

`tests/firestore.rules.test.mjs` checks 13 allowed and denied cases against the Firestore emulator. The emulator needs Java.

```sh
npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
npx firebase emulators:exec --only firestore --project chip-test "node tests/firestore.rules.test.mjs"
```
