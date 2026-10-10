import { MASTERY_LEVELS, mastery, masteryRank, type Mastery } from '../../lib/srs'
import type { VocabProgress } from '../../types'

export const MASTERY_COLOR: Record<Mastery, string> = {
  new: 'bg-stone-300',
  learning: 'bg-amber-400',
  familiar: 'bg-sky-500',
  strong: 'bg-emerald-500',
  mastered: 'bg-violet-600',
}
export const MASTERY_LABEL: Record<Mastery, string> = {
  new: 'New',
  learning: 'Learning',
  familiar: 'Familiar',
  strong: 'Strong',
  mastered: 'Mastered',
}

/** 4 dots fill up as a word goes new → learning → familiar → strong → mastered */
export default function MasteryDots({ progress, showLabel = false }: { progress?: VocabProgress; showLabel?: boolean }) {
  const m = mastery(progress)
  const rank = masteryRank(m)
  return (
    <span className="inline-flex items-center gap-1" title={MASTERY_LABEL[m]} aria-label={`Mastery: ${MASTERY_LABEL[m]}`}>
      {MASTERY_LEVELS.slice(1).map((_, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i < rank ? MASTERY_COLOR[m] : 'bg-stone-200'}`} />
      ))}
      {showLabel && <span className="ml-1 text-[11px] font-semibold text-stone-500">{MASTERY_LABEL[m]}</span>}
    </span>
  )
}
