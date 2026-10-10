// Validates lesson JSON so a broken unit file never reaches production.
// Run: npm run validate-content  (also runs automatically before every build)
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content')
const errors = []
const warn = []
const err = (where, msg) => errors.push(`${where}: ${msg}`)

const load = (p) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch (e) {
    err(p, `invalid JSON – ${e.message}`)
    return null
  }
}

const EX_TYPES = ['mc', 'gap', 'match', 'build', 'listen', 'dialogue', 'sort']
const lessonIds = new Set()
const vocabIds = new Set()
const unitOrders = new Set()

const unitFiles = readdirSync(join(root, 'units')).filter((f) => f.endsWith('.json'))
for (const file of unitFiles) {
  const u = load(join(root, 'units', file))
  if (!u) continue
  const W = `units/${file}`
  for (const k of ['id', 'order', 'level', 'title', 'titleEs', 'emoji', 'description', 'badge', 'lessons']) if (u[k] === undefined) err(W, `missing "${k}"`)
  if (unitOrders.has(u.order)) err(W, `duplicate unit order ${u.order}`)
  unitOrders.add(u.order)
  if (!Array.isArray(u.lessons)) continue
  if (u.lessons.length < 4 || u.lessons.length > 6) warn.push(`${W}: ${u.lessons.length} lessons (spec: 4–6)`)

  for (const l of u.lessons) {
    const L = `${W} › ${l.id}`
    if (lessonIds.has(l.id)) err(L, 'duplicate lesson id')
    lessonIds.add(l.id)
    for (const k of ['title', 'titleEs', 'minutes', 'setting', 'scenario', 'dialogue', 'vocab', 'grammar', 'connector', 'exercises', 'recap'])
      if (l[k] === undefined) err(L, `missing "${k}"`)
    if (!['latam', 'spain'].includes(l.setting)) err(L, 'setting must be "latam" or "spain"')
    if (!l.dialogue?.lines?.length) err(L, 'dialogue has no lines')
    l.dialogue?.lines?.forEach((x, i) => (!x.speaker || !x.latam || !x.en) && err(L, `dialogue line ${i} needs speaker/latam/en`))
    if (l.vocab && (l.vocab.length < 8 || l.vocab.length > 12)) warn.push(`${L}: ${l.vocab.length} words (spec: 8–12)`)
    // vocab = word ids from src/data/vocab (existence is checked by validate-vocab.ts)
    l.vocab?.forEach((id) => {
      if (typeof id !== 'string') err(L, `vocab must list word ids, got ${JSON.stringify(id)}`)
      vocabIds.add(id)
    })
    if (!l.grammar?.title || !l.grammar?.explanation || !l.grammar?.examples?.length) err(L, 'grammar needs title, explanation, examples')
    if (!l.connector?.word || !l.connector?.examples?.length) err(L, 'connector needs word + examples')
    if (!Array.isArray(l.recap) || l.recap.length !== 3) err(L, 'recap must have exactly 3 lines')
    if (l.exercises && (l.exercises.length < 5 || l.exercises.length > 8)) warn.push(`${L}: ${l.exercises.length} exercises (spec: 5–8)`)

    l.exercises?.forEach((ex, i) => {
      const E = `${L} › exercise ${i + 1} (${ex.type})`
      if (!EX_TYPES.includes(ex.type)) return err(E, 'unknown type')
      const hasCorrect = (opts) => Array.isArray(opts) && opts.some((o) => o.correct)
      switch (ex.type) {
        case 'mc':
        case 'dialogue':
          if (!hasCorrect(ex.options)) err(E, 'needs at least one correct option')
          if (ex.type === 'dialogue' && !ex.context?.length) err(E, 'needs context lines')
          break
        case 'gap':
          if (!ex.sentence?.latam?.includes('___')) err(E, 'sentence.latam needs ___')
          if (ex.sentence?.spain && !ex.sentence.spain.includes('___')) err(E, 'sentence.spain needs ___')
          if (!ex.answers?.latam?.length) err(E, 'needs answers.latam')
          break
        case 'match':
          if (!ex.pairs || ex.pairs.length < 3) err(E, 'needs ≥3 pairs')
          if (ex.pairs && new Set(ex.pairs.map((p) => p.right)).size !== ex.pairs.length) err(E, 'right-hand values must be unique')
          break
        case 'build':
          if (!ex.answers?.latam?.length) err(E, 'needs answers.latam')
          break
        case 'listen':
          if (!ex.audio?.latam) err(E, 'needs audio.latam')
          if (ex.mode === 'choose' && !hasCorrect(ex.options)) err(E, 'choose mode needs a correct option')
          if (!['choose', 'type'].includes(ex.mode)) err(E, 'mode must be choose|type')
          break
        case 'sort':
          if (!ex.items?.length) err(E, 'needs items')
          ex.items?.forEach((it) => !['latam', 'spain'].includes(it.variant) && err(E, `item "${it.text}" needs variant latam|spain`))
          break
      }
    })
  }
}

// placement test
const placement = load(join(root, 'placement.json'))
if (placement) {
  if (placement.questions?.length !== 10) warn.push(`placement.json: ${placement.questions?.length} questions (spec: 10)`)
  placement.questions?.forEach((q) => {
    if (!q.options?.some((o) => o.correct)) err(`placement › ${q.id}`, 'needs a correct option')
    if (!lessonIds.has(q.lessonId)) err(`placement › ${q.id}`, `unknown lessonId ${q.lessonId}`)
  })
  placement.bands?.forEach((b) => !lessonIds.has(b.startLessonId) && err('placement › bands', `unknown lesson ${b.startLessonId}`))
}

// reference: connectors linking to lessons
const connectors = load(join(root, 'reference', 'connectors.json'))
connectors?.connectors?.forEach((c) => c.lesson && !lessonIds.has(c.lesson) && err('reference/connectors.json', `unknown lesson ${c.lesson}`))
load(join(root, 'reference', 'tenses.json'))
load(join(root, 'reference', 'latam-vs-spain.json'))

warn.forEach((w) => console.warn('⚠️  ' + w))
if (errors.length) {
  errors.forEach((e) => console.error('✘ ' + e))
  console.error(`\n${errors.length} content error(s).`)
  process.exit(1)
}
console.log(`✔ content OK – ${unitFiles.length} units, ${lessonIds.size} lessons, ${vocabIds.size} words`)
