import type { VocabProgress } from '../types'
import { addDays, todayKey } from './dates'

/**
 * Leitner boxes 1..6. Correct answers move a word up one box (longer interval),
 * mistakes move it down one box. Flashcards can also be self-rated.
 */
export const BOX_INTERVALS = [1, 2, 4, 8, 16, 32] // days, box 1..6
export const MAX_BOX = BOX_INTERVALS.length

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export function newVocab(): VocabProgress {
  return { box: 1, intervalDays: 1, dueDate: todayKey(), timesCorrect: 0, timesWrong: 0 }
}

function toBox(v: VocabProgress, box: number, correct: boolean): VocabProgress {
  const b = Math.max(1, Math.min(MAX_BOX, box))
  const intervalDays = BOX_INTERVALS[b - 1]
  return {
    box: b,
    intervalDays,
    // a missed word comes back today (it's practised again in the same review)
    dueDate: correct ? addDays(todayKey(), intervalDays) : todayKey(),
    timesCorrect: v.timesCorrect + (correct ? 1 : 0),
    timesWrong: v.timesWrong + (correct ? 0 : 1),
  }
}

export function review(v: VocabProgress, correct: boolean): VocabProgress {
  return toBox(v, correct ? v.box + 1 : v.box - 1, correct)
}

/** flashcard self-rating: again → box 1, hard → same box, good → +1, easy → +2 */
export function rate(v: VocabProgress, r: Rating): VocabProgress {
  const box = r === 'again' ? 1 : r === 'hard' ? v.box : r === 'good' ? v.box + 1 : v.box + 2
  const res = toBox(v, box, r !== 'again')
  // "hard" keeps the box but still schedules it (shorter: half the interval, at least 1 day)
  if (r === 'hard') res.dueDate = addDays(todayKey(), Math.max(1, Math.floor(res.intervalDays / 2)))
  return res
}

/** first contact in "Learn new words": box 1, due tomorrow if answered correctly, else today */
export function learn(v: VocabProgress | undefined, correct: boolean): VocabProgress {
  const base = v ?? newVocab()
  return {
    ...base,
    dueDate: correct ? addDays(todayKey(), 1) : todayKey(),
    timesCorrect: base.timesCorrect + (correct ? 1 : 0),
    timesWrong: base.timesWrong + (correct ? 0 : 1),
  }
}

export function isDue(v: VocabProgress, today = todayKey()): boolean {
  return v.dueDate <= today
}

export type Mastery = 'new' | 'learning' | 'familiar' | 'strong' | 'mastered'
export const MASTERY_LEVELS: Mastery[] = ['new', 'learning', 'familiar', 'strong', 'mastered']

/** 5 visible mastery levels on top of the 6 Leitner boxes */
export function mastery(v?: VocabProgress): Mastery {
  if (!v) return 'new'
  if (v.box <= 2) return 'learning'
  if (v.box === 3) return 'familiar'
  if (v.box <= 5) return 'strong'
  return 'mastered'
}

export const masteryRank = (m: Mastery) => MASTERY_LEVELS.indexOf(m)
