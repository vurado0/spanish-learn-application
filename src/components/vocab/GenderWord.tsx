import type { Variant, VocabWord } from '../../types'
import { wordArticle, wordFeminine, wordGender, wordText } from '../../lib/vocab'

/** colour-coded article: masculine blue, feminine rose, both violet */
export const GENDER_STYLE = { m: 'text-sky-600', f: 'text-rose-600', mf: 'text-violet-600' } as const

export default function GenderWord({ word, variant, className = '' }: { word: VocabWord; variant: Variant; className?: string }) {
  const art = wordArticle(word, variant)
  const g = wordGender(word, variant)
  const fem = wordFeminine(word, variant)
  const color = g ? GENDER_STYLE[g] : ''
  const femArt = art === 'el' ? 'la' : art === 'los' ? 'las' : art
  return (
    <span className={className}>
      {art && <span className={`${color} font-bold`}>{art === 'el/la' ? 'el / la' : art} </span>}
      <span>{wordText(word, variant)}</span>
      {fem && (
        <span className="text-stone-400">
          {' / '}
          {art && <span className={`${GENDER_STYLE.f} font-bold`}>{femArt} </span>}
          <span>{fem}</span>
        </span>
      )}
    </span>
  )
}
