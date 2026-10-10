# Charla 💬 – conversation-first Spanish

A Spanish learning web app for one learner: short lessons built around **real conversations**, with **Latin American Spanish 🌎 first and Spain Spanish 🇪🇸 always right next to it**. The scenarios are set in Alcalá de Henares and Madrid.

- React + Vite + TypeScript + Tailwind CSS (mobile-first)
- Firebase **Spark (free) plan**: Authentication + Firestore with offline persistence
- Audio via the browser's **Web Speech API**. No paid APIs and no AI.
- Deploys to **Vercel** (free Hobby plan)

## Features

| | |
|---|---|
| **Course** | Placement check (10 questions) → Units A1 → A2 → B1. Every lesson: dialogue with audio → 8–12 words → mini grammar → connector → 5–8 exercises → 3-line recap |
| **Vocabulary** | 548 words (A1 325 · A2 166 · B1 57) in 10 topics with pictures, gender-coloured articles, audio and examples · *Learn new words* in batches of 5 · daily spaced-repetition review (max. 15 min) · 6 practice modes (picture→word, word→picture, listen→picture, type it, flashcard, memory game) · A2/B1 unlock at 70 % “familiar” · browse with filters and search |
| **Variants** | One **Spanish variant** setting (🌎 by default / 🇪🇸) drives words, examples, dialogues and voices · optional “show other variant too” line · conjugation tables mark *vosotros* as 🇪🇸 only · answers in the other variant are accepted with “✔ correct – that's the 🇪🇸 Spain version” |
| **Exercises** | Multiple choice, fill the gap, matching pairs, sentence builder (tap or drag), listening (choose/type), dialogue choice, “🌎 or 🇪🇸?” sorting game. Instant feedback with an explanation |
| **Motivation** | Streak, % course completed, weekly minutes vs the 6-hour target, countdown to February 2027, “Continue where you left off”, a badge per unit, daily spaced-repetition review (Leitner boxes), optional browser reminder |
| **Reference** | Latin America vs Spain, tense overview, connectors cheat sheet |
| **Settings** | Show/hide English, default dialogue variant, audio speed (normal/slow) |

Progress auto-saves after every exercise and every lesson. Phone and laptop stay in sync, and progress made offline syncs once you're back online.

---

## 1. Local setup

Requirements: Node.js 22.18+ (the vocabulary validator is a `.ts` file run directly by Node) and npm.

```bash
git clone <your-repo-url> charla && cd charla
npm install
cp .env.example .env      # then fill in the values from step 2
npm run dev               # http://localhost:5173
```

### Option: run without a Firebase project (emulators)

You can develop fully offline with the Firebase Emulator Suite. It needs the [Firebase CLI](https://firebase.google.com/docs/cli) and Java 11+.

```bash
# .env.local
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-charla.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-charla
VITE_FIREBASE_APP_ID=demo-app
VITE_USE_EMULATORS=true
```

```bash
npm run emulators   # terminal 1 – Auth :9099, Firestore :8080, UI http://localhost:4000
npm run dev         # terminal 2
```

The emulators also enforce `firestore.rules`. Register any account. During development the emulator test account was `learner@example.test` / `charla-test`. Emulator data is wiped when the emulators stop.

## 2. Create the Firebase project (free Spark plan)

1. Go to <https://console.firebase.google.com> → **Add project**. Google Analytics isn't needed.
2. **Project settings (⚙️) → General → Your apps → Web (`</>`)**. Register an app (Firebase Hosting isn't needed) and copy the `firebaseConfig` values.
3. Put them in `.env`:

   | Variable | firebaseConfig key |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

   These values are not secrets: they end up in the browser bundle anyway. The Firestore rules are what protect the data.

## 3. Enable Google + email sign-in

**Build → Authentication → Get started → Sign-in method**:

- **Email/Password** → Enable → Save. Password reset emails work out of the box. You can edit the template under *Templates*.
- **Google** → Enable → choose a support email → Save.

`localhost` is an authorized domain by default, so sign-in works locally right away.

## 4. Firestore database + security rules

1. **Build → Firestore Database → Create database**. Pick a location close to you (e.g. `eur3` or `europe-southwest1` Madrid) and start in **production mode**.
2. Deploy the rules in [`firestore.rules`](firestore.rules). Each user can only read and write their own `users/{uid}` document and its subcollections:
   - **Console:** Firestore → **Rules** tab → paste the file's contents → **Publish**, or
   - **CLI:** `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules --project <your-project-id>`

### Data model

```
users/{uid}                      displayName, email, createdAt,
                                 settings { showEnglish, variant, showOtherVariant, audioSpeed },   (older accounts: defaultVariant, still read)
                                 placementResult { score, total, startLessonId, takenAt }
users/{uid}/progress/{lessonId}  completed, bestScore, attempts, lastPlayedAt,
                                 inProgress { step, exerciseIndex, correct }   ← exact resume point
users/{uid}/vocab/{wordId}       box (Leitner 1–6), intervalDays, dueDate, timesCorrect, timesWrong   ← wordId = id in src/data/vocab
users/{uid}/stats/summary        currentUnit, currentLesson, streak, lastActiveDate,
                                 weeklyMinutes { week, minutes }, badges[]
```

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Go to <https://vercel.com/new> → **Import** the GitHub repo. Vercel detects Vite automatically (`npm run build`, output `dist`).
3. Before deploying, open **Environment Variables** and add all six `VITE_FIREBASE_*` variables from your `.env`. Enable them for Production and Preview. Don't set `VITE_USE_EMULATORS`.
4. Click **Deploy**.
5. **Authorize the domain in Firebase**, otherwise Google sign-in fails with `auth/unauthorized-domain`:
   Firebase console → **Authentication → Settings → Authorized domains → Add domain** → `your-app.vercel.app`.
   Preview deployments get their own URLs (`your-app-git-branch-you.vercel.app`). Add the ones you want to test, or test previews with email/password.
6. Every later `git push` to `main` redeploys automatically. Branches and PRs get preview URLs.

[`vercel.json`](vercel.json) rewrites every route to `index.html`. That way, refreshing `/lesson/u2l1` or `/review` doesn't 404.

> Changed an env variable on Vercel? Redeploy: Vite inlines `VITE_*` values at build time.

---

## Adding content (no code changes)

Units are plain JSON files in [`src/content/units/`](src/content/units). Every file in that folder is loaded automatically and sorted by `order`.

1. Copy an existing unit, e.g. `unit-03-getting-around.json` → `unit-04-travel.json`.
2. Change `id`, `order`, `title`, `badge`, and write 4–6 lessons. Lesson ids must be unique (`u4l1`, …), and so must vocab `id`s across the whole course.
3. Run `npm run validate-content`. It checks the structure, unique ids, that every exercise has a correct answer, and the counts the course spec asks for. It also runs before every build, so a broken file never reaches production.
4. Add the unit to [`src/content/roadmap.json`](src/content/roadmap.json) if it isn't there yet. Units without a JSON file appear there as "Coming next".

### Lesson cheat sheet

```jsonc
{
  "id": "u4l1", "title": "…", "titleEs": "…", "minutes": 12,
  "setting": "latam",                      // "spain" = Alcalá/Madrid scene → Spain version shown first
  "scenario": "one-line description",
  "dialogue": { "title": "…", "setting": "…",
    "lines": [{ "speaker": "Diego", "latam": "…", "spain": "… (only if different)", "en": "…" }] },
  "vocab": [{ "id": "phone", "latam": "el celular", "spain": "el móvil", "en": "mobile phone", "note": "optional" }],
  "grammar": { "title": "…", "explanation": "English…", "explanationEs": "Spanish (shown when English is hidden)",
    "examples": [{ "latam": "…", "spain": "…", "en": "…" }],
    "tables": [{ "verb": "ser", "meaning": "to be", "rows": [{ "person": "vosotros", "form": "sois", "spainOnly": true }] }],
    "compare": { "title": "…", "latam": [{ "text": "…", "en": "…" }], "spain": [{ "text": "…" }], "note": "…" } },
  "connector": { "word": "pero", "meaning": "but", "explanation": "…", "examples": [ … ] },
  "pronunciation": { "title": "…", "explanation": "…", "words": [{ "text": "gracias", "latamNote": "…", "spainNote": "…" }] },
  "exercises": [ … ],
  "recap": ["line 1", "line 2", "line 3"]
}
```

Exercise types (see `Exercise` in [`src/types.ts`](src/types.ts)):

| type | key fields |
|---|---|
| `mc` | `prompt`, `options[{text, correct?, variant?}]`, optional `say` (Spanish shown with audio). Several options can be correct with different `variant`s |
| `gap` | `sentence {latam, spain?}` containing `___`, `answers {latam[], spain?[]}`, `en`, `hint?` |
| `match` | `prompt`, `pairs[{left, right}]` (right values unique) |
| `build` | `en`, `answers {latam[], spain?[]}`, `distractors?[]`. Tiles come from the answers, so both variant orders are buildable |
| `listen` | `mode: "choose" \| "type"`, `audio {latam, spain?}`, `prompt`, `options` (choose) or `answers` (type; defaults to the audio text) |
| `dialogue` | `context[{speaker, latam, spain?}]`, `options[{text, correct?, variant?, feedback?}]` |
| `sort` | `items[{text, variant: "latam"\|"spain", en?}]` – the 🌎/🇪🇸 game |

Every exercise has an `explanation`, which is shown on mistakes. Answers are checked without case or punctuation. Missing accents still count as correct, with a gentle reminder.

## Vocabulary database

All words live in [`src/data/vocab/`](src/data/vocab), one JSON file per topic (`basics`, `people`, `food`, `city`, `home`, `travel`, `culture`, `work`, `verbs`, `phrases`), one word per line. Lessons only reference word ids (`"vocab": ["flat", "flatmate", …]`).

```jsonc
{ "id": "phone",                      // stable – never rename (saved progress uses it)
  "spanishLatam": "celular", "spanishSpain": "móvil",   // spanishSpain only if different
  "english": "mobile phone", "article": "el", "gender": "m",   // nouns; articleSpain/genderSpain if they differ
  "feminine": "…",                    // optional: cansado → cansada, profesor → profesora
  "type": "noun", "topic": "home", "level": "A1",
  "exampleLatam": "Mi celular no tiene batería.", "exampleSpain": "Mi móvil no tiene batería.",
  "exampleEnglish": "My phone has no battery.",
  "visual": "📱",                     // emoji, "/vocab/<file>.svg", or "" for abstract words (topic icon + text card)
  "note": "optional tip" }
```

To add words, append them to a topic file and run `npm run validate:vocab`. It checks unique ids, duplicates within a topic, required fields, valid level/topic/type values, articles/genders on nouns, that every lesson word id exists, that an example never uses the *other* variant's word (e.g. “móvil” in the 🌎 example), and the phase targets / 500-word minimum. The build fails on any error.

**Images:** words use the device's own emoji font, so no emoji image files are shipped. The one custom picture, [`public/vocab/stork.svg`](public/vocab/stork.svg) (there is no stork emoji), is an original drawing released under CC0. If you add images, use only your own or openly licensed ones (e.g. [OpenMoji](https://openmoji.org), CC BY-SA 4.0, or [Twemoji](https://github.com/jdecked/twemoji), CC BY 4.0) in `/public/vocab/`, credit them here, and never hotlink external images.

## Project structure

```
src/
  content/            ← all course content (JSON)
    units/*.json      ← one file per unit
    placement.json    roadmap.json
    reference/        latam-vs-spain.json, tenses.json, connectors.json
  components/
    exercises/        one component per exercise type + ExerciseRenderer
    lesson/           dialogue / vocab / grammar / connector sections
  context/            AuthContext (Firebase Auth), DataContext (Firestore sync, streaks, SRS)
  lib/                firebase, speech (voice picking), answers (variant-aware checking),
                      srs (Leitner), dates, reminder, content loader
  pages/              Dashboard, CourseMap, LessonPage, Placement, Settings, reference pages, AuthPage
  pages/vocab/        VocabHome, VocabBrowse, VocabSession (learn / review)
  components/vocab/   WordCard, WordVisual, GenderWord, MasteryDots, Practice (6 modes), VariantSwitch
  data/vocab/         <topic>.json word database + _meta.json (topics, levels, phase targets)
scripts/validate-content.mjs  scripts/validate-vocab.ts
firestore.rules  vercel.json  firebase.json
```

## Good to know

- **Voices:** speech uses the voices installed on the device. 🌎 prefers `es-MX` → `es-US` → other Latin American locales, 🇪🇸 uses `es-ES`, and both fall back to any Spanish voice. Settings shows which voices this device has. iOS/macOS: *Settings → Accessibility → Spoken Content → Voices → Spanish*. Windows: *Settings → Time & language → Speech*. Android: *Google TTS → Install voice data*.
- **Reminders** use the Notification API. Without a push server (which would need paid infrastructure), they only fire while a Charla tab is open, e.g. pinned in the background on the laptop. The reminder is stored per device.
- **Study time** counts the time between finished steps and exercises, capped at 5 minutes per step, so leaving a lesson open doesn't inflate your minutes.
- **Free-tier limits:** Spark allows 50k document reads and 20k writes per day. One learner uses a tiny fraction of that.

## Scripts

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | validate content → validate vocabulary → typecheck → production build |
| `npm run validate-content` | check all lesson JSON |
| `npm run validate:vocab` | check the word database (`-- --phase=A1` while building a phase) |
| `npm run emulators` | local Firebase Auth + Firestore emulators |
| `npm run preview` | serve the production build |

CI (GitHub Actions, [`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the content validation, typecheck and build on every push and PR.
