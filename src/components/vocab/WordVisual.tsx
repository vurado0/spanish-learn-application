import type { VocabWord } from '../../types'
import { topicIndex } from '../../lib/vocab'

const SIZES = { sm: 'h-12 w-12 text-3xl', md: 'h-20 w-20 text-5xl', lg: 'h-32 w-32 text-7xl' }

/**
 * Emoji or local SVG. Abstract words (visual "") get a text card with the topic icon
 * instead of a misleading picture.
 */
export default function WordVisual({ word, size = 'md', label = true }: { word: VocabWord; size?: keyof typeof SIZES; label?: boolean }) {
  const box = `flex shrink-0 items-center justify-center ${SIZES[size]}`
  if (word.visual.startsWith('/')) return <img src={word.visual} alt="" className={`${box} object-contain p-1`} draggable={false} />
  if (word.visual) return <span className={`${box} leading-none select-none`} aria-hidden>{word.visual}</span>
  const icon = topicIndex.get(word.topic)?.icon ?? '💬'
  return (
    <span className={`${box} flex-col rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-1 text-center`} aria-hidden>
      <span className={size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-base'}>{icon}</span>
      {label && size !== 'sm' && <span className="mt-0.5 line-clamp-2 text-[11px] leading-tight font-semibold text-stone-600">{word.english}</span>}
    </span>
  )
}
