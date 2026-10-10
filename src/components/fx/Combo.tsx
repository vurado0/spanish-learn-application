import { useEffect, useState } from 'react'
import { useCombo } from '../../lib/combo'

const MESSAGES: Record<number, [string, string]> = {
  3: ['🔥', '3 in a row!'],
  5: ['⚡', '5 in a row – ¡increíble!'],
  10: ['🚀', '10 in a row – ¡imparable!'],
  15: ['🌟', '15 in a row – ¡qué crack!'],
  20: ['👑', '20 in a row – ¡leyenda!'],
  30: ['🏆', '30 in a row – ¡perfecto!'],
}

/** small flame counter for the header – bounces on every correct answer */
export function ComboChip() {
  const { current } = useCombo()
  if (current < 2) return null
  return (
    <span
      key={current}
      className="animate-bounce-in inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-sm font-extrabold text-orange-700"
      aria-label={`${current} correct in a row`}
    >
      <span className="animate-flame inline-block">🔥</span>
      {current}
    </span>
  )
}

/** big toast at 3, 5, 10 … answers in a row */
export function ComboToast() {
  const { milestone, seq } = useCombo()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!seq || !milestone) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1600)
    return () => clearTimeout(t)
  }, [seq, milestone])

  if (!visible || !MESSAGES[milestone]) return null
  const [icon, text] = MESSAGES[milestone]
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center" role="status">
      <div key={seq} className="animate-combo flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-lg font-extrabold text-white shadow-xl">
        <span className="animate-wiggle inline-block text-2xl">{icon}</span>
        {text}
      </div>
    </div>
  )
}
