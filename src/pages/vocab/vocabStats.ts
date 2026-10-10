import type { VocabProgress } from '../../types'
import { isDue, mastery } from '../../lib/srs'
import { levelStatus, wordIndex, words } from '../../lib/vocab'

/** numbers shown on the Vocabulary page and the dashboard */
export function vocabStats(progress: Record<string, VocabProgress>) {
  const known = Object.entries(progress).filter(([id]) => wordIndex.has(id))
  const levels = levelStatus(progress)
  const current = [...levels].reverse().find((l) => l.unlocked) ?? levels[0]
  const next = levels.find((l) => !l.unlocked)
  return {
    total: words.length,
    learned: known.length,
    due: known.filter(([, v]) => isDue(v)).length,
    mastered: known.filter(([, v]) => mastery(v) === 'mastered').length,
    levels,
    current,
    next,
  }
}

export const unlockHint = (needed: number, prevLevel: string, level: string) =>
  `Learn ${needed} more ${prevLevel} word${needed === 1 ? '' : 's'} to “familiar” to unlock ${level}`
