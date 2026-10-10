import type { VocabProgress } from '../types'
import { addDays, todayKey } from './dates'

/**
 * Leitner boxes. A correct answer moves a word up one box (longer interval),
 * a wrong answer sends it back to box 1 (review again tomorrow).
 */
export const BOX_INTERVALS = [1, 2, 4, 8, 16, 32] // days, box 1..6
export const MAX_BOX = BOX_INTERVALS.length

export function newVocab(): VocabProgress {
  return { box: 1, intervalDays: 1, dueDate: todayKey(), timesCorrect: 0, timesWrong: 0 }
}

export function review(v: VocabProgress, correct: boolean): VocabProgress {
  const box = correct ? Math.min(v.box + 1, MAX_BOX) : 1
  const intervalDays = BOX_INTERVALS[box - 1]
  return {
    box,
    intervalDays,
    dueDate: addDays(todayKey(), intervalDays),
    timesCorrect: v.timesCorrect + (correct ? 1 : 0),
    timesWrong: v.timesWrong + (correct ? 0 : 1),
  }
}

export function isDue(v: VocabProgress, today = todayKey()): boolean {
  return v.dueDate <= today
}
