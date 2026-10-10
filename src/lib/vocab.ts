import type { Article, Gender, Level, Variant, VocabProgress, VocabTopic, VocabWord } from '../types'
import meta from '../data/vocab/_meta.json'
import { mastery, masteryRank } from './srs'

// Every <topic>.json in src/data/vocab is part of the database (files starting with _ are metadata).
const modules = import.meta.glob<VocabWord[]>(['../data/vocab/*.json', '!../data/vocab/_*.json'], { eager: true, import: 'default' })

export const topics: VocabTopic[] = meta.topics
export const LEVELS = meta.levels as Level[]
export const UNLOCK_THRESHOLD = meta.unlockThreshold

const topicOrder = new Map(topics.map((t, i) => [t.id, i]))

/** all words, in priority order: by level, then file order (= frequency) within each topic, topics interleaved */
export const words: VocabWord[] = (() => {
  const byTopic = Object.values(modules).sort((a, b) => (topicOrder.get(a[0]?.topic) ?? 99) - (topicOrder.get(b[0]?.topic) ?? 99))
  const out: VocabWord[] = []
  for (const level of LEVELS) {
    const lists = byTopic.map((list) => list.filter((w) => w.level === level))
    const max = Math.max(0, ...lists.map((l) => l.length))
    for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i])
  }
  return out
})()

export const wordIndex = new Map(words.map((w) => [w.id, w]))
export const topicIndex = new Map(topics.map((t) => [t.id, t]))

export const differs = (w: VocabWord) =>
  (w.spanishSpain !== undefined && w.spanishSpain !== w.spanishLatam) || (w.articleSpain !== undefined && w.articleSpain !== w.article)

export const wordText = (w: VocabWord, v: Variant) => (v === 'spain' ? w.spanishSpain ?? w.spanishLatam : w.spanishLatam)
export const wordArticle = (w: VocabWord, v: Variant): Article | undefined => (v === 'spain' ? w.articleSpain ?? w.article : w.article)
export const wordGender = (w: VocabWord, v: Variant): Gender | undefined => (v === 'spain' ? w.genderSpain ?? w.gender : w.gender)
export const wordFeminine = (w: VocabWord, v: Variant) => (v === 'spain' ? w.feminineSpain ?? w.feminine : w.feminine)
export const wordExample = (w: VocabWord, v: Variant) => (v === 'spain' ? w.exampleSpain ?? w.exampleLatam : w.exampleLatam)

/** "el café", "cansado / cansada", "la computadora" */
export function displayWord(w: VocabWord, v: Variant): string {
  const art = wordArticle(w, v)
  const base = wordText(w, v)
  const fem = wordFeminine(w, v)
  if (art === 'el/la') return `el / la ${base}`
  const main = art ? `${art} ${base}` : base
  if (fem) return art ? `${main} / ${art === 'el' ? 'la' : 'las'} ${fem}` : `${base} / ${fem}`
  return main
}

/** what to speak: article + word (+ feminine form) */
export const speakText = (w: VocabWord, v: Variant) => displayWord(w, v).replace(/ \/ /g, ', ').replace(/…/g, '')

/** typed answers accepted for a variant: word, with/without article, feminine form */
export function acceptedAnswers(w: VocabWord, v: Variant): string[] {
  const base = wordText(w, v).replace(/…/g, '').trim()
  const art = wordArticle(w, v)
  const fem = wordFeminine(w, v)
  const out = new Set([base])
  if (art) art.split('/').forEach((a) => out.add(`${a} ${base}`))
  if (fem) {
    out.add(fem)
    if (art) out.add(`${art === 'el' ? 'la' : art === 'los' ? 'las' : art} ${fem}`)
  }
  return [...out]
}

export interface LevelStatus {
  level: Level
  total: number
  seen: number
  familiar: number
  unlocked: boolean
  /** words still needed at "familiar" in the previous level to unlock this one */
  needed: number
}

/** A1 always open; A2 opens when 70 % of A1 is ≥ familiar; B1 when 70 % of A2 is */
export function levelStatus(progress: Record<string, VocabProgress>): LevelStatus[] {
  const res: LevelStatus[] = []
  LEVELS.forEach((level, i) => {
    const list = words.filter((w) => w.level === level)
    const familiar = list.filter((w) => masteryRank(mastery(progress[w.id])) >= masteryRank('familiar')).length
    const seen = list.filter((w) => progress[w.id]).length
    let unlocked = true
    let needed = 0
    if (i > 0) {
      const prev = res[i - 1]
      const required = Math.ceil(prev.total * UNLOCK_THRESHOLD)
      needed = Math.max(0, required - prev.familiar)
      unlocked = prev.unlocked && needed === 0
    }
    res.push({ level, total: list.length, seen, familiar, unlocked, needed })
  })
  return res
}

/** next unseen words to learn: lowest unlocked level first (optionally one topic) */
export function nextNewWords(progress: Record<string, VocabProgress>, count: number, topic?: string): VocabWord[] {
  const open = new Set(levelStatus(progress).filter((l) => l.unlocked).map((l) => l.level))
  return words.filter((w) => !progress[w.id] && open.has(w.level) && (!topic || w.topic === topic)).slice(0, count)
}
