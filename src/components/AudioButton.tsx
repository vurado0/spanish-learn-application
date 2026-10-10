import { speak, speechSupported } from '../lib/speech'
import { useData } from '../context/DataContext'
import type { Variant } from '../types'

interface Props {
  text: string
  variant: Variant
  size?: 'sm' | 'md'
  label?: string
}

export const FLAG: Record<Variant, string> = { latam: '🌎', spain: '🇪🇸' }

export default function AudioButton({ text, variant, size = 'sm', label }: Props) {
  const { settings } = useData()
  if (!speechSupported()) return null
  const cls =
    size === 'md'
      ? 'h-11 px-4 text-base gap-2'
      : 'h-8 px-2.5 text-sm gap-1'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        speak(text, variant, settings.audioSpeed)
      }}
      className={`inline-flex shrink-0 items-center rounded-full border border-stone-200 bg-white font-medium text-stone-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 active:scale-95 ${cls}`}
      aria-label={`Play ${variant === 'spain' ? 'Spain' : 'Latin American'} audio: ${text}`}
    >
      <span aria-hidden>🔊</span>
      <span aria-hidden>{FLAG[variant]}</span>
      {label && <span>{label}</span>}
    </button>
  )
}
