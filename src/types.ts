// ---------- Content types (match the JSON files in src/content) ----------

export type Variant = 'latam' | 'spain'

/** Text in both variants. `spain` is omitted when it is identical to `latam`. */
export interface VText {
  latam: string
  spain?: string
}

/** Accepted answers per variant. `spain` omitted = same answers as latam. */
export interface VAnswers {
  latam: string[]
  spain?: string[]
}

export interface Example extends VText {
  en: string
}

export interface DialogueLine extends VText {
  speaker: string
  en: string
}

export interface Dialogue {
  title: string
  setting: string
  lines: DialogueLine[]
}

export type Level = 'A1' | 'A2' | 'B1'
export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'connector' | 'phrase' | 'preposition' | 'pronoun' | 'number' | 'interjection'
export type Article = 'el' | 'la' | 'el/la' | 'los' | 'las'
export type Gender = 'm' | 'f' | 'mf'

/** One entry of the vocabulary database (src/data/vocab/<topic>.json). `id` is stable – never rename it. */
export interface VocabWord {
  id: string
  spanishLatam: string
  /** only when different from spanishLatam */
  spanishSpain?: string
  english: string
  /** nouns only */
  article?: Article
  /** when the Spain word has a different article (la computadora / el ordenador) */
  articleSpain?: Article
  gender?: Gender
  genderSpain?: Gender
  /** feminine form of adjectives / people nouns (cansado → cansada) */
  feminine?: string
  feminineSpain?: string
  type: WordType
  topic: string
  level: Level
  exampleLatam: string
  exampleSpain?: string
  exampleEnglish: string
  /** emoji, a /vocab/*.svg path, or "" for abstract words (topic icon + text card) */
  visual: string
  note?: string
}

export interface VocabTopic {
  id: string
  name: string
  nameEs: string
  icon: string
  target: number
}

export interface ConjugationRow {
  person: string
  form: string
  /** true for vosotros (only used in Spain) */
  spainOnly?: boolean
}

export interface ConjugationTable {
  verb: string
  meaning: string
  rows: ConjugationRow[]
}

export interface CompareBox {
  title: string
  latam: { label?: string; text: string; en?: string }[]
  spain: { label?: string; text: string; en?: string }[]
  note?: string
}

export interface Grammar {
  title: string
  explanation: string
  /** Spanish version of the explanation (shown when English is hidden) */
  explanationEs?: string
  examples: Example[]
  tables?: ConjugationTable[]
  compare?: CompareBox
  tip?: string
}

export interface Connector {
  word: string
  meaning: string
  explanation: string
  examples: Example[]
}

export interface Pronunciation {
  title: string
  explanation: string
  /** each word is spoken by both voices */
  words: { text: string; latamNote: string; spainNote: string }[]
}

export interface McOption {
  text: string
  correct?: boolean
  /** which variant this correct option belongs to, for feedback */
  variant?: Variant
}

export type Exercise =
  | {
      type: 'mc'
      prompt: string
      /** optional Spanish sentence shown (and playable) above the options */
      say?: VText
      options: McOption[]
      explanation: string
    }
  | {
      type: 'gap'
      prompt?: string
      /** use ___ for the gap */
      sentence: VText
      answers: VAnswers
      en: string
      hint?: string
      explanation: string
    }
  | {
      type: 'match'
      prompt: string
      pairs: { left: string; right: string }[]
      explanation?: string
    }
  | {
      type: 'build'
      en: string
      answers: VAnswers
      distractors?: string[]
      explanation: string
    }
  | {
      type: 'listen'
      mode: 'choose' | 'type'
      audio: VText
      prompt: string
      options?: McOption[]
      answers?: VAnswers
      explanation: string
    }
  | {
      type: 'dialogue'
      prompt: string
      context: (VText & { speaker: string })[]
      options: (McOption & { feedback?: string })[]
      explanation: string
    }
  | {
      type: 'sort'
      prompt: string
      items: { text: string; variant: Variant; en?: string }[]
      explanation?: string
    }

export interface Lesson {
  id: string
  title: string
  titleEs: string
  minutes: number
  /** "spain" = Alcalá/Madrid scenario: Spain version shown first */
  setting: 'latam' | 'spain'
  scenario: string
  dialogue: Dialogue
  /** word ids from the vocabulary database (src/data/vocab) */
  vocab: string[]
  grammar: Grammar
  connector: Connector
  pronunciation?: Pronunciation
  exercises: Exercise[]
  recap: [string, string, string]
}

export interface Unit {
  id: string
  order: number
  level: 'A1' | 'A2' | 'B1'
  title: string
  titleEs: string
  emoji: string
  description: string
  badge: { id: string; name: string; emoji: string }
  lessons: Lesson[]
}

export interface PlacementQuestion {
  id: string
  prompt: string
  say?: VText
  options: McOption[]
  /** lesson this question checks */
  lessonId: string
}

export interface PlacementTest {
  intro: string
  questions: PlacementQuestion[]
  /** min score → start lesson */
  bands: { minScore: number; startLessonId: string; message: string }[]
}

// ---------- Firestore data ----------

export interface Settings {
  showEnglish: boolean
  /** selected Spanish variant – drives words, examples, dialogues and voices */
  variant: Variant
  /** also show the other variant as a small secondary line */
  showOtherVariant: boolean
  audioSpeed: 'normal' | 'slow'
  /** legacy name of `variant` (accounts created before the vocabulary section) */
  defaultVariant?: Variant
}

export interface PlacementResult {
  score: number
  total: number
  startLessonId: string
  takenAt: number
  skipped?: boolean
}

export interface UserDoc {
  displayName: string
  email: string
  createdAt: number
  settings: Settings
  placementResult?: PlacementResult | null
}

export type LessonStep = 'dialogue' | 'vocab' | 'grammar' | 'connector' | 'exercises' | 'recap'

export interface LessonProgress {
  completed: boolean
  bestScore: number
  attempts: number
  lastPlayedAt: number
  /** saved after every exercise so the lesson can be resumed exactly */
  inProgress?: {
    step: LessonStep
    exerciseIndex: number
    correct: number
  } | null
}

export interface VocabProgress {
  box: number
  intervalDays: number
  dueDate: string // YYYY-MM-DD
  timesCorrect: number
  timesWrong: number
}

export interface Stats {
  currentUnit: string
  currentLesson: string
  streak: number
  lastActiveDate: string // YYYY-MM-DD
  weeklyMinutes: { week: string; minutes: number }
  badges: string[]
}
