import type { Variant, VText } from '../types'
import { useData } from '../context/DataContext'
import AudioButton, { FLAG } from './AudioButton'

interface Props {
  text: VText
  /** variant to show; defaults to the user's setting */
  variant?: Variant
  en?: string
  showEn?: boolean
  audio?: boolean
  className?: string
}

/**
 * Shows a Spanish phrase in the selected variant only. When “Show other variant too”
 * is on and the wording differs, the other variant appears as a small secondary line.
 */
export default function VariantText({ text, variant, en, showEn = true, audio = true, className = '' }: Props) {
  const { settings } = useData()
  const v = variant ?? settings.variant
  const other: Variant = v === 'spain' ? 'latam' : 'spain'
  const value = (x: Variant) => (x === 'spain' ? text.spain ?? text.latam : text.latam)
  const differs = text.spain !== undefined && text.spain !== text.latam

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-stone-900">{value(v)}</span>
        {audio && <AudioButton text={value(v)} variant={v} />}
      </div>
      {differs && settings.showOtherVariant && (
        <div className="mt-0.5 flex items-center gap-2 text-sm text-stone-500">
          <span aria-label={other === 'spain' ? 'Spain' : 'Latin America'}>{FLAG[other]}</span>
          <span>{value(other)}</span>
          {audio && <AudioButton text={value(other)} variant={other} />}
        </div>
      )}
      {en && showEn && <p className="mt-1 text-sm text-stone-500 italic">{en}</p>}
    </div>
  )
}
