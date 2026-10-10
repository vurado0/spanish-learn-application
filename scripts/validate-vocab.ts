// Validates the vocabulary database in src/data/vocab (and the lesson → word references).
// Run: npm run validate:vocab            (full check, also part of npm run build)
//      npm run validate:vocab -- --phase=A1   (while building a phase: checks targets up to that phase only)
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface Word {
  id: string
  spanishLatam: string
  spanishSpain?: string
  english: string
  article?: string
  articleSpain?: string
  gender?: string
  genderSpain?: string
  feminine?: string
  type: string
  topic: string
  level: string
  exampleLatam: string
  exampleSpain?: string
  exampleEnglish: string
  visual: string
}

interface Meta {
  topics: { id: string; name: string; target: number }[]
  levels: string[]
  types: string[]
  phaseTargets: Record<string, number>
  minTotal: number
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const vocabDir = join(root, 'src', 'data', 'vocab')
const errors: string[] = []
const warnings: string[] = []

const phaseArg = process.argv.find((a) => a.startsWith('--phase='))?.split('=')[1]

const readJson = <T>(path: string): T | null => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch (e) {
    errors.push(`${path}: invalid JSON – ${(e as Error).message}`)
    return null
  }
}

const meta = readJson<Meta>(join(vocabDir, '_meta.json'))
if (!meta) {
  console.error(errors.join('\n'))
  process.exit(1)
}
const levels = meta.levels
const phaseLimit = phaseArg ? levels.indexOf(phaseArg) : levels.length - 1
if (phaseArg && phaseLimit < 0) {
  console.error(`Unknown phase "${phaseArg}" – use one of ${levels.join(', ')}`)
  process.exit(1)
}

const REQUIRED = ['id', 'spanishLatam', 'english', 'type', 'topic', 'level', 'exampleLatam', 'exampleEnglish', 'visual'] as const
const ARTICLES = ['el', 'la', 'el/la', 'los', 'las']
const GENDERS = ['m', 'f', 'mf']
const topicIds = new Set(meta.topics.map((t) => t.id))

const ids = new Map<string, string>() // id → file
const all: Word[] = []
const files = readdirSync(vocabDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'))

for (const file of files) {
  const list = readJson<Word[]>(join(vocabDir, file))
  if (!list) continue
  if (!Array.isArray(list)) {
    errors.push(`${file}: must be an array of words`)
    continue
  }
  const topicOfFile = file.replace(/\.json$/, '')
  if (!topicIds.has(topicOfFile)) errors.push(`${file}: file name must be a topic id from _meta.json`)
  const spanishSeen = new Map<string, string>()

  list.forEach((w, i) => {
    const where = `${file}[${i}] ${w?.id ?? '?'}`
    for (const k of REQUIRED) {
      const v = (w as unknown as Record<string, unknown>)[k]
      if (v === undefined || v === null || (k !== 'visual' && v === '')) errors.push(`${where}: missing "${k}"`)
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.id ?? '')) errors.push(`${where}: id must be kebab-case ascii`)
    if (ids.has(w.id)) errors.push(`${where}: duplicate id (also in ${ids.get(w.id)})`)
    ids.set(w.id, file)
    if (w.topic !== topicOfFile) errors.push(`${where}: topic "${w.topic}" doesn't match file ${file}`)
    if (!levels.includes(w.level)) errors.push(`${where}: invalid level "${w.level}"`)
    if (!meta.types.includes(w.type)) errors.push(`${where}: invalid type "${w.type}"`)
    if (w.spanishSpain !== undefined && w.spanishSpain === w.spanishLatam) errors.push(`${where}: spanishSpain is identical – omit it`)
    if (w.exampleSpain !== undefined && w.exampleSpain === w.exampleLatam) errors.push(`${where}: exampleSpain is identical – omit it`)
    if (w.type === 'noun') {
      if (!w.article) errors.push(`${where}: nouns need an article`)
      if (!w.gender) errors.push(`${where}: nouns need a gender`)
    }
    if (w.article && !ARTICLES.includes(w.article)) errors.push(`${where}: invalid article "${w.article}"`)
    if (w.articleSpain && !ARTICLES.includes(w.articleSpain)) errors.push(`${where}: invalid articleSpain "${w.articleSpain}"`)
    if (w.gender && !GENDERS.includes(w.gender)) errors.push(`${where}: invalid gender "${w.gender}"`)
    if (w.genderSpain && !GENDERS.includes(w.genderSpain)) errors.push(`${where}: invalid genderSpain "${w.genderSpain}"`)
    if (w.article && w.gender) {
      const expect = w.article === 'el/la' ? 'mf' : ['el', 'los'].includes(w.article) ? 'm' : 'f'
      if (w.gender !== expect) errors.push(`${where}: article "${w.article}" doesn't match gender "${w.gender}"`)
    }
    if (w.spanishSpain && w.exampleSpain === undefined && w.exampleLatam.toLowerCase().includes(w.spanishLatam.toLowerCase()))
      warnings.push(`${where}: Spain word differs but there is no exampleSpain`)
    if (w.visual && w.visual.startsWith('/') && !existsSync(join(root, 'public', w.visual))) errors.push(`${where}: visual file ${w.visual} not found in /public`)
    if (w.visual && /^https?:/.test(w.visual)) errors.push(`${where}: no hotlinked images – use an emoji or a file in /public/vocab`)

    for (const text of [w.spanishLatam, w.spanishSpain].filter(Boolean) as string[]) {
      const key = `${(w.article ?? '').split('/')[0]} ${text}`.trim().toLowerCase()
      if (spanishSeen.has(key)) errors.push(`${where}: duplicate Spanish word "${text}" in ${file} (also ${spanishSeen.get(key)})`)
      spanishSeen.set(key, w.id)
    }
    all.push(w)
  })
}

// every lesson word must exist in the database
const unitsDir = join(root, 'src', 'content', 'units')
let lessonRefs = 0
for (const file of readdirSync(unitsDir).filter((f) => f.endsWith('.json'))) {
  const unit = readJson<{ lessons: { id: string; vocab: unknown[] }[] }>(join(unitsDir, file))
  unit?.lessons.forEach((l) =>
    l.vocab.forEach((ref) => {
      lessonRefs++
      if (typeof ref !== 'string') errors.push(`units/${file} › ${l.id}: vocab must be a list of word ids`)
      else if (!ids.has(ref)) errors.push(`units/${file} › ${l.id}: word id "${ref}" not in the vocabulary database`)
    }),
  )
}

// ---- report ----
const count = (f: (w: Word) => boolean) => all.filter(f).length
console.log('\nWords per topic (A1 / A2 / B1 = total, target):')
for (const t of meta.topics) {
  const per = levels.map((l) => count((w) => w.topic === t.id && w.level === l))
  const total = per.reduce((a, b) => a + b, 0)
  console.log(`  ${t.id.padEnd(8)} ${per.map((n) => String(n).padStart(3)).join(' /')} = ${String(total).padStart(3)}  (~${t.target})`)
}
console.log('\nPhases:')
levels.forEach((l, i) => {
  const n = count((w) => w.level === l)
  const target = meta.phaseTargets[l]
  const checked = i <= phaseLimit
  const ok = n >= Math.floor(target * 0.95)
  console.log(`  Phase ${i + 1} – ${l}: ${n} words (target ~${target}) ${checked ? (ok ? '✔' : '✘') : '· not checked yet'}`)
  if (checked && !ok) errors.push(`Phase ${i + 1} (${l}) has ${n} words, target ~${target}`)
})
console.log(`\nTotal: ${all.length} words · ${count((w) => !!w.spanishSpain || !!w.articleSpain)} differ 🌎/🇪🇸 · ${lessonRefs} lesson references`)
if (!phaseArg && all.length < meta.minTotal) errors.push(`total is ${all.length}, needs at least ${meta.minTotal}`)

warnings.forEach((w) => console.warn('⚠️  ' + w))
if (errors.length) {
  errors.forEach((e) => console.error('✘ ' + e))
  console.error(`\n${errors.length} vocabulary error(s).`)
  process.exit(1)
}
console.log('✔ vocabulary OK\n')
