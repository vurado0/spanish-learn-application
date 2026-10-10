# CLAUDE.md – Charla (Spanish learning app)

Conversation-first Spanish learning web app for **one learner**. Repo: https://github.com/vurado0/spanish-learn-application · Deploy: Vercel.

## Hard constraints (never break)

- **No AI features and no paid APIs.** Everything runs on free tiers (Firebase Spark, Vercel Hobby).
- Audio is the browser **Web Speech API** only (`src/lib/speech.ts`): `es-MX`/`es-US` voice for 🌎, `es-ES` for 🇪🇸, falling back to any Spanish voice.
- **Variant setting:** `settings.variant` (🌎 default) decides which variant is shown, in words, examples, dialogues and voices. `settings.showOtherVariant` (default off) adds the other variant as a small secondary line. Comparison boxes, the sorting game and the reference page still show both on purpose.
- **No copyrighted song lyrics** or copied texts. All dialogues and texts are original.
- All learning pages are behind login. Each account has its own progress.
- New units = **new JSON files only**. Never hardcode lesson content in components.

## Learner profile (drives every content decision)

- English native speaker who speaks no other language. Knows greetings and tiny chats (hola, ¿qué tal?, muy bien, buenos días/tardes/noches).
- Goals: work/study, chatting with friends, travel. **Hold real conversations by February 2027.**
- Weak spots: **tenses** and **connecting words** to keep a conversation going.
- Interests: travel, food, culture, history, music.
- 6–8 h/week on phone and laptop. Likes short lessons, games and quizzes. Motivated by progress and streaks. Gets bored easily.
- Duolingo felt like vocabulary only → this app must be **conversation-first**.
- Prefers Latin American Spanish but **lives in Alcalá de Henares** (near Madrid). Scenarios are set there where possible.
- The learner is female. Spanish lines spoken by the learner use feminine forms (encantada, cansada, contenta).

## Tech stack

React + Vite + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), react-router v7, Firebase JS SDK (Auth + Firestore). Mobile-first responsive design.

- Firebase config comes from `VITE_FIREBASE_*` env vars: `.env` locally, Vercel project settings in production. See `.env.example`.
- `vercel.json` rewrites all routes to `index.html`, so refreshes don't 404.
- Vercel domains must be added to Firebase Auth → Authorized domains, otherwise Google sign-in fails.
- Firestore offline persistence is on (`persistentLocalCache`). **Never `await` Firestore writes** in UI flows: they only resolve on server ack. Use the fire-and-forget `fire()` helper in `DataContext`.
- `firestore.rules`: users can only read/write `users/{uid}` and its subcollections.

## Commands

```bash
npm run dev               # dev server :5173
npm run emulators         # Firebase Auth :9099 + Firestore :8080 emulators (needs .env.local with VITE_USE_EMULATORS=true)
npm run validate-content  # validate all lesson JSON (also runs in build)
npm run validate:vocab    # validate the word database (also runs in build); -- --phase=A1 while building a phase
npm run typecheck         # tsc -b
npm run build             # validate → typecheck → vite build
```

CI (`.github/workflows/ci.yml`) runs validate-content, typecheck and build on every push/PR. Keep it green.

## Firestore data model (keep in sync with `src/types.ts`)

```
users/{uid}                      displayName, email, createdAt,
                                 settings { showEnglish, variant: 'latam'|'spain', showOtherVariant, audioSpeed: 'normal'|'slow' }
                                   (legacy accounts may still have defaultVariant – normalizeSettings() maps it to variant),
                                 placementResult { score, total, startLessonId, takenAt, skipped? } | null
users/{uid}/progress/{lessonId}  completed, bestScore, attempts, lastPlayedAt,
                                 inProgress { step, exerciseIndex, correct } | null   ← exact resume point
users/{uid}/vocab/{wordId}       box (Leitner 1–6), intervalDays, dueDate (YYYY-MM-DD), timesCorrect, timesWrong
                                 wordId = id from src/data/vocab – NEVER rename word ids
users/{uid}/stats/summary        currentUnit, currentLesson, streak, lastActiveDate, weeklyMinutes { week, minutes }, badges[]
```

- **Auto-save** after every finished exercise and lesson. There is no save button.
- Dashboard "Continue where you left off" resumes the exact lesson, step and exercise.
- The same account shows the same progress on phone and laptop.

## Course requirements

**Structure:** 10-question placement check on first login (skips known basics) → units A1 → A2 → early B1. Each unit has **4–6 lessons of 10–15 min**.

**Every lesson, in this order:**
1. Short dialogue with audio (both variants)
2. 8–12 new words
3. One mini grammar point
4. One new connector
5. 5–8 exercises
6. 3-line recap

**Explanations:** in English with Spanish examples. The Spanish share grows in later units (`explanationEs`). Every explanation has a "show English" toggle.

**Tense track across units:** present (regular/irregular) → ser vs estar → gustar → pretérito → pretérito perfecto (Spain usage) → imperfecto → pretérito vs imperfecto → future with *ir a*.

**Connectors** (one per lesson, plus the cheat-sheet page): pero, porque, entonces, además, también, o sea, bueno, pues, por eso, sin embargo, mientras, cuando.

### Units

| # | Level | Topic | Status |
|---|---|---|---|
| 1 | A1 | Meeting people & small talk – friends, flatmates, Universidad de Alcalá | ✅ `unit-01-meeting-people.json` |
| 2 | A1 | Food & bars – ordering, free tapa with a drink in Alcalá, menú del día, market | ✅ `unit-02-food-and-bars.json` |
| 3 | A1 | Getting around – Calle Mayor, Plaza de Cervantes, directions, Cercanías Alcalá ⇄ Madrid, tickets | ✅ `unit-03-getting-around.json` |
| 4 | A2 | Travel – hotels, trips, Latin American destinations, past trips (pretérito / pretérito perfecto) | ⏳ issue #1 |
| 5 | A2 | Culture & history – Cervantes' birthplace museum, historic university, storks on rooftops, Mercado Cervantino (October); imperfecto | ⏳ issue #2 |
| 6 | A2 | Music – flamenco, salsa, cumbia, reggaetón; tastes with gustar. **Original texts only, no lyrics** | ⏳ issue #3 |
| 7 | B1 | Work & study – studies/job, future plans with *ir a* | ⏳ issue #4 |

When adding a unit, also check `src/content/roadmap.json` and close its GitHub issue.

### Exercise types (rotate so no lesson feels repetitive)

`mc` multiple choice · `gap` fill-in-the-gap · `match` matching pairs · `build` sentence builder (tap/drag) · `listen` listening (choose or type) · `dialogue` pick the right reply · `sort` "🌎 or 🇪🇸?" game. Feedback is instant and shows a short explanation on mistakes.

## Variant rules (LatAm vs Spain)

- **Vocabulary cards:** both words + both audio buttons (celular/móvil, computadora/ordenador, carro/coche, jugo/zumo, papa/patata, departamento/piso, manejar/conducir, tomar/coger el autobús, ¡qué padre!/¡qué guay!, está bien/vale, amigo/tío, lentes/gafas, durazno/melocotón, ¿qué onda?/¿qué pasa?).
- **Conjugation tables** show ustedes (both) and vosotros (🇪🇸 only, `"spainOnly": true`).
- **Past tense:** Latin America uses pretérito ("Hoy comí"), Spain uses pretérito perfecto ("Hoy he comido"). Teach both with a comparison box.
- **Tú/usted:** a brief note on how usage differs.
- **Pronunciation:** seseo 🌎 vs distinción 🇪🇸 ("gracias"), demonstrated with both voices.
- **Dialogues:** the user's `variant`, with a toggle that swaps wording and voice. Alcalá/Madrid scenario lessons (`"setting": "spain"`) show a one-tap “🇪🇸 hear it as people say it here” switch (decided with the user: the setting wins over Spain-first).
- **Answers:** accepted in both variants. Feedback names the variant used ("✔ Correct – Spain version 🇪🇸"). Matching ignores case and punctuation, and missing accents count as correct with a warning.
- **Reference page:** "Latin America vs Spain" covers vocabulary, grammar and pronunciation (`src/content/reference/latam-vs-spain.json`).
- **Tense overview page:** when to use each tense, with examples in both variants (`reference/tenses.json`).

## Motivation & settings

- **Dashboard:** streak, % course completed, weekly minutes vs **6-hour target**, countdown to **1 Feb 2027**, "Continue where you left off".
- **Vocabulary section** (`/vocab`): 548 words in `src/data/vocab/` (A1 325 / A2 166 / B1 57). Learn in batches of 5, daily review max 15 min, 6 practice modes (picture→word, word→picture, listen→picture, type, flashcard, memory). Mastery: new → learning (box 1–2) → familiar (3) → strong (4–5) → mastered (6). Correct = up one box, wrong = down one box; flashcard again/hard/good/easy. A2 unlocks at 70 % of A1 ≥ familiar, B1 at 70 % of A2. A lesson's words join the deck on completion.
- **Memory game mistakes:** a mismatch only counts when the first card's partner had already been revealed (blind second picks are not mistakes).
- **Badges:** one per completed unit.
- **Reminder:** optional browser notification. Stored per device in localStorage, and it only fires while a tab is open (no push server on the free tier).
- **Settings:** show/hide English, default dialogue variant (🌎/🇪🇸), audio speed (normal/slow).

## Content JSON conventions

- Text objects are `{ "latam": "...", "spain": "..." }`. Omit `spain` when it's identical.
- Lesson `vocab` is a list of word ids from `src/data/vocab`. New words go into the database, not into lessons.
- Vocabulary words: correct accents, articles and genders (feminine nouns with stressed a- take *el*: el agua, gender f). Examples must not use the other variant's words – the validator enforces it. Abstract words get `"visual": ""`, never a misleading emoji.
- Lesson ids are `u{unit}l{n}`. Vocab `id`s must be **unique across the whole course** (the validator enforces this).
- `mc`/`dialogue` options may have several correct answers tagged with `"variant"`.
- `build` tiles are generated from the answers of both variants plus `distractors`. Don't add a distractor that also forms a valid sentence.
- Avoid `gap` exercises whose sentence differs grammatically between variants (e.g. ustedes vs vosotros). A wrong-variant answer would be accepted. Use `mc` with variant-tagged options instead.
- Use typographic quotes “ ” inside JSON strings. Keep the Spanish natural and correct for each region; when unsure about a regionalism, prefer the widely understood form and explain it in `note`.

## Code layout

```
src/content/        units/*.json, placement.json, roadmap.json, reference/*.json
src/data/vocab/     <topic>.json word database + _meta.json
src/components/     exercises/* (one per type + ExerciseRenderer), lesson/LessonSections.tsx, shared UI
src/context/        AuthContext, DataContext (all Firestore reads/writes, streak, minutes, badges, SRS)
src/lib/            firebase, speech, answers (variant-aware checking), srs, dates, reminder, content loader
src/pages/          Dashboard, CourseMap, LessonPage, Review, Placement, Settings, Reference pages, AuthPage
scripts/validate-content.mjs, scripts/validate-vocab.ts
```

## Conventions

- Match the existing style: functional components, Tailwind utility classes, the shared classes `.btn-primary`, `.btn-secondary`, `.chip`, `.input` in `index.css`, and minimal comments.
- Add new Firestore writes through `DataContext` only.
- Verify UI changes in the browser against the emulators (`npm run emulators` + `npm run dev`). Test at mobile width (375px) and desktop.
- Commit in small, descriptive steps and push to `main` (development should be visible on GitHub). Keep CI green.
