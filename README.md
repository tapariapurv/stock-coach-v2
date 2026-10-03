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
- **Chip's Fund:** after Chapter 2, kids invest coins (1 coin = $1) in 14 real companies and an S&P 500 fund at daily closing prices, with a nudge when one holding dominates. Includes a "company of the week".
- **Parents:** a child adds a parent's email. The parent signs in at `/dashboard.html` (email must be verified), sees progress and a conversation starter, approves friends, and gets a weekly email on Sundays.
- **Classrooms:** teachers create a class in the dashboard and share a 6-character code. Students get a class leaderboard; teachers see each student's progress and weak spots, and assign chapters (students see a 📌 badge).
- **Installable app + push reminders:** a web app manifest and service worker (works offline), plus Firebase Cloud Messaging streak reminders.
- **Read-aloud:** questions can be read out with the browser's built-in speech.
- **Analytics:** first-party daily counters (no third-party trackers) and D2/D7 retention, shown to admins in the dashboard.
- **Sync:** progress lives in `localStorage` and syncs to Firestore when the learner signs in with Google or email.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole app: styles, course content for chapters 1–2, game engine, UI and Firebase wiring |
| `chapters.js` | Chapters 3–22, loaded before the main script |
| `fund.js` / `prices.json` | Fund companies, and daily closes written by `scripts/update-prices.mjs` |
| `dashboard.html` | Parent, teacher and admin dashboard |
| `sw.js` / `manifest.json` / `icons/` | Installable app, offline cache and background push |
| `firebase-config.js` | Public Firebase web config |
| `firestore.rules` | Security rules for `users`, `usernames` and `profiles` |
| `apps-script/` | Google Apps Script that sends streak emails every hour |
| `.github/workflows/prices.yml` | Refreshes `prices.json` every weekday after the U.S. market close |
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
| `users/{uid}` | The owner, a linked parent with a verified email, admins | Only the owner | Full private progress, plus email and time zone for streak emails |
| `usernames/{name}` | Signed-in users | The owner can claim a free name or release their own | `{ uid }`, which guarantees each username is unique |
| `classes/{code}` | Signed-in users can open a class by code; teachers list their own | The teacher | Class name, teacher uid, assigned chapters. `members/{uid}` holds each student's first name, avatar and progress, readable by the teacher and classmates |
| `metrics/{day}_{event}` | Admins | Anyone, +1 at a time, allowed event names only | Daily analytics counters |
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
- **Fund prices:** run the *Update fund prices* action once by hand after merging (Actions tab → Run workflow). Until then the fund shows clearly labelled sample prices.
- **Push reminders (optional):** Firebase console → Project settings → Cloud Messaging → Web Push certificates → *Generate key pair*, then paste the public key into `FIREBASE_VAPID_KEY` in `firebase-config.js`. Leave it empty to hide the setting. On iPhone, push works only after the app is added to the home screen.
- **Admin analytics:** in Firestore, create a document `admins/{your uid}` (any content). Your uid is under Authentication → Users. The dashboard then shows an Analytics tab.
- **Streak emails, push and weekly parent emails:** copy `apps-script/` into a Google Apps Script project owned by an account with Firestore access. Run `selfTest()` once to check access and send sample emails, then `setup()` to install the hourly trigger. After updating the script, re-authorize once: it now also needs the Firebase Cloud Messaging scope.

## Testing the rules

`tests/firestore.rules.test.mjs` checks 13 allowed and denied cases against the Firestore emulator. The emulator needs Java.

```sh
npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
npx firebase emulators:exec --only firestore --project chip-test "node tests/firestore.rules.test.mjs"
```
