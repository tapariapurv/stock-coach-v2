# Chip — stocks for kids

A Duolingo-style app that teaches kids how investing works, one bite-sized lesson at a time. Chip the bull guides learners through 22 chapters, from "what's a stock?" to building their own money plan.

**Live:** https://chip-stock-coach.vercel.app

## Features

- **Learning path:** 22 chapters of short lessons with multiple-choice, true/false, sentence-building and matching questions. Any learner can tap **Jump here?** on the chapter review to skip the rest of the chapter (2 mistakes or fewer).
- **Chip, the mascot:** a shaded SVG bull with moods (happy, sad, cheering, thinking, sleepy) and motion: breathing, blinking, looking around, ear twitches and a swishing tail (CSS, paused off screen), plus jumps, spins, dances and waves on top. Tap him anywhere.
- **Custom icon set:** every icon in the app chrome is drawn in `icons.js` (no emoji in navigation, stats, shop, quests or leagues).
- **Practice hub:** a smart workout from the spaced-repetition engine, a mistakes review, **Words** (flip flashcards + quizzes, 49 terms), **Listen** (hear a sentence or definition, then build or pick the answer), **Speak** (say a phrase; scored with the browser's speech recognition, with a typing fallback), and 8 **Stories & reading** passages with comprehension questions. Content unlocks chapter by chapter. Practice never costs hearts.
- **Gems:** the shop currency. Earned from daily quests, the quest chest, achievements, streak milestones, chapter completions, level-ups and league finishes. **Coins** are separate: lessons pay coins, and coins are what you invest in Chip's Fund.
- **Quests:** three rotating daily quests (from a pool of 11), a bonus chest when all three are done, and a **monthly challenge**: finish 30 quests in a month to earn that month's badge.
- **Streaks:** freezes (auto-cover missed days), a weekend amulet, and streak repair for 3 days after a streak ends. Milestones at 7, 14, 30, 50, 100… days pay gems.
- **Levels & achievements:** levels from total XP; 12 tiered achievements (Wildfire, Sage, Scholar, Sharpshooter, Champion, Overachiever, Storyteller, Wordsmith, Investor, Friendly, League climber, Conqueror).
- **Leagues:** 10 tiers from Bronze to Diamond, 30 per league, top 7 promoted and bottom 5 demoted each Monday, top 3 earn gems. Real learners in your tier fill the board first; **practice rivals** (clearly labelled with a robot badge) fill the rest so the race works from day one. Rivals are seeded, so every device shows the same week.
- **Profile:** photo upload (cropped and shrunk to 192px in the browser), a **character builder** whose styles unlock as you level up, or an emoji. Following/followers lists, statistics, a weekly XP chart, friend suggestions (people who follow you, friends of friends, league-mates), achievements, monthly badges, and a **friend activity feed** ("@sam came back to learn about stocks after 1 month", streaks, promotions, badges).
- **Shop:** heart refill, streak freeze, weekend amulet, streak repair, double XP, and 10 outfits for Chip.
- **Chip's Fund:** after Chapter 2, kids invest coins (1 coin = $1) in 14 real companies and an S&P 500 fund at daily closing prices, with a nudge when one holding dominates. Includes a "company of the week".
- **Parents:** a child adds a parent's email. The parent signs in at `/dashboard.html` (email must be verified), sees progress and a conversation starter, approves friends, and gets a weekly email on Sundays.
- **Classrooms:** teachers create a class in the dashboard and share a 6-character code. Students get a class leaderboard; teachers see each student's progress and weak spots, and assign chapters.
- **Installable app + push reminders:** a web app manifest and service worker (works offline), plus Firebase Cloud Messaging streak reminders.
- **Read-aloud, themes, sync:** questions can be read aloud; light/dark/auto theme and accent colours; progress lives in `localStorage` and syncs to Firestore when signed in.

### Kid safety

Friends, leagues with real learners and the public profile stay off until a parent or guardian OKs them. The public profile never includes the real name or bio. An uploaded photo is private by default: friends see the learner's character instead unless the learner ticks **Show my photo to friends**, and the Firestore rules only accept small `data:image/…` pictures.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | Styles, course content for chapters 1–2, lesson engine, learning path, fund, settings, onboarding and Firebase wiring |
| `icons.js` | The hand-drawn SVG icon set, achievement badges and monthly badges |
| `mascot.js` | Chip (shaded SVG, moods, reactions) and the avatar/character builder renderer |
| `game.js` | Gems, levels, daily quests and chest, monthly challenge, achievements, streak protection, shop, modals |
| `social.js` | Leagues and practice rivals, friends, followers, suggestions, activity feed, profile and avatar editor |
| `practice.js` | Practice hub, words, phrases, stories and reading, and the session builders |
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
| `profiles/{uid}` | Signed-in users | The owner, only under a username they've claimed | Public profile, opt-in: username, avatar (emoji, character, or a small opted-in photo), XP, level, streak, weekly XP, league tier, a 10-item activity feed, who they follow. Never the real name or bio. Leagues query `league == tier && weekId == week` (no composite index needed). |

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
- **Firestore rules:** deploy automatically through the GitHub Action, keylessly (no secrets). One-time setup in Google Cloud Shell for project `chip-stocks`:
  ```sh
  SA=firebase-rules-deployer@chip-stocks.iam.gserviceaccount.com
  gcloud config set project chip-stocks
  gcloud services enable iamcredentials.googleapis.com sts.googleapis.com firebaserules.googleapis.com
  gcloud iam service-accounts create firebase-rules-deployer --display-name="GitHub rules deploy"
  for r in firebaserules.admin serviceusage.serviceUsageConsumer firebase.viewer; do gcloud projects add-iam-policy-binding chip-stocks --member=serviceAccount:$SA --role=roles/$r --condition=None -q; done
  gcloud iam workload-identity-pools create github --location=global --display-name=GitHub
  gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=github --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository --attribute-condition="assertion.repository=='tapariapurv/stock-coach-v2'"
  gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser --member=principalSet://iam.googleapis.com/projects/147169736788/locations/global/workloadIdentityPools/github/attribute.repository/tapariapurv/stock-coach-v2
  ```
  Then run the *Deploy Firestore rules* action once to confirm. To deploy by hand instead: `firebase deploy --only firestore:rules`.
- **Fund prices:** run the *Update fund prices* action once by hand after merging (Actions tab → Run workflow). Until then the fund shows clearly labelled sample prices.
- **Push reminders (optional):** Firebase console → Project settings → Cloud Messaging → Web Push certificates → *Generate key pair*, then paste the public key into `FIREBASE_VAPID_KEY` in `firebase-config.js`. Leave it empty to hide the setting. On iPhone, push works only after the app is added to the home screen.
- **Admin analytics:** in Firestore, create a document `admins/{your uid}` (any content). Your uid is under Authentication → Users. The dashboard then shows an Analytics tab.
- **Streak emails, push and weekly parent emails:** copy `apps-script/` into a Google Apps Script project owned by an account with Firestore access. Run `selfTest()` once to check access and send sample emails, then `setup()` to install the hourly trigger. After updating the script, re-authorize once: it now also needs the Firebase Cloud Messaging scope.

## Tests

**App (end to end + stress):** drives the real app in headless Chromium with Firebase blocked; social features run against an in-memory backend. Covers onboarding, the Jump-here popup (on top of the banners, clickable, on screen for every node), lessons, hearts and refills, quests, chest, monthly badge, level-ups, streak freeze/repair, shop, every practice mode, all stories, league promotion and zones, follow/followers/suggestions/feed, photo upload, the character builder, dark mode, no horizontal scroll at 360/768/1440px, and a stress run (60 lessons back to back, 300 tab switches, render time and animation clean-up).

```sh
npm i --no-save playwright gsap@3.12.5
node tests/e2e.mjs                 # SHOTS=some/dir saves screenshots
```

**Firestore rules:** `tests/firestore.rules.test.mjs` checks allowed and denied cases (including photo, feed and league limits) against the emulator. The emulator needs Java.

```sh
npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
npx firebase emulators:exec --only firestore --project chip-test "node tests/firestore.rules.test.mjs"
```
