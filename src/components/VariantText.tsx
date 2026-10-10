import type { Variant, VText } from '../types'
import AudioButton, { FLAG } from './AudioButton'

interface Props {
  text: VText
  /** which variant is shown first */
  first?: Variant
  en?: string
  showEn?: boolean
  audio?: boolean
  className?: string
}

/** Shows a Spanish phrase in both variants side by side when they differ. */
export default function VariantText({ text, first = 'latam', en, showEn = true, audio = true, className = '' }: Props) {
  const differs = text.spain !== undefined && text.spain !== text.latam
  const order: Variant[] = first === 'spain' ? ['spain', 'latam'] : ['latam', 'spain']
  const value = (v: Variant) => (v === 'spain' ? text.spain ?? text.latam : text.latam)

  return (
    <div className={className}>
      {differs ? (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          {order.map((v, i) => (
            <div key={v} className={`flex items-center gap-2 ${i === 1 ? 'text-stone-500' : ''}`}>
              <span className="text-sm" aria-label={v === 'spain' ? 'Spain' : 'Latin America'}>{FLAG[v]}</span>
              <span className={i === 0 ? 'font-semibold text-stone-900' : 'font-medium'}>{value(v)}</span>
              {audio && <AudioButton text={value(v)} variant={v} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-stone-900">{text.latam}</span>
          {audio && (
            <>
              <AudioButton text={text.latam} variant={order[0]} />
              <AudioButton text={text.latam} variant={order[1]} />
            </>
          )}
        </div>
      )}
      {en && showEn && <p className="mt-1 text-sm text-stone-500 italic">{en}</p>}
    </div>
  )
}
