import { useEffect, type ReactNode } from 'react'
import { sfx } from '../../lib/sfx'
import Confetti from './Confetti'
import { useCountUp } from './useCountUp'

export interface CelebrationStat {
  label: string
  value: number
  suffix?: string
  icon: string
  /** tailwind classes for the tile */
  tone: string
}

function StatTile({ stat, index }: { stat: CelebrationStat; index: number }) {
  const delay = 350 + index * 180
  const n = useCountUp(stat.value, 900, delay)
  return (
    <div className={`animate-rise rounded-2xl border-2 p-3 text-center ${stat.tone}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="text-xs font-extrabold tracking-wide uppercase opacity-80">{stat.label}</div>
      <div className="mt-1 flex items-center justify-center gap-1 text-2xl font-extrabold">
        <span aria-hidden>{stat.icon}</span>
        <span className="tabular-nums">
          {n}
          {stat.suffix}
        </span>
      </div>
    </div>
  )
}

/**
 * End-of-lesson / end-of-session screen: confetti, bouncing hero, count-up stats,
 * plus optional streak-extended and badge banners.
 */
export default function Celebration({
  hero,
  title,
  subtitle,
  stats,
  streak,
  badge,
  children,
}: {
  hero: string
  title: string
  subtitle?: string
  stats: CelebrationStat[]
  /** day streak, shown when it was extended by this session */
  streak?: number
  badge?: { emoji: string; name: string; text: string }
  children?: ReactNode
}) {
  useEffect(() => {
    sfx.complete()
    const timers = [streak ? setTimeout(() => sfx.sparkle(), 1100) : 0, badge ? setTimeout(() => sfx.sparkle(), 1700) : 0]
    return () => timers.forEach((t) => t && clearTimeout(t))
    // only once per screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const streakDelay = 400 + stats.length * 180

  return (
    <div className="relative">
      <Confetti fire={1} />
      {badge && <Confetti fire={2} pieces={90} duration={2400} />}
      <div className="flex flex-col items-center text-center">
        <div className="animate-hero text-8xl drop-shadow-lg" aria-hidden>{hero}</div>
        <h1 className="animate-rise mt-3 text-3xl font-extrabold text-stone-900" style={{ animationDelay: '150ms' }}>{title}</h1>
        {subtitle && <p className="animate-rise mt-1 text-stone-600" style={{ animationDelay: '250ms' }}>{subtitle}</p>}
      </div>

      <div className={`mt-6 grid gap-2 ${stats.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {stats.map((s, i) => <StatTile key={s.label} stat={s} index={i} />)}
      </div>

      {!!streak && (
        <div className="animate-rise mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white shadow-lg" style={{ animationDelay: `${streakDelay}ms` }}>
          <span className="animate-flame inline-block text-5xl" aria-hidden>🔥</span>
          <div className="text-left">
            <div className="text-2xl font-extrabold">{streak}-day streak!</div>
            <div className="text-sm text-amber-50">{streak === 1 ? 'Your streak starts today. ¡Vamos!' : 'You kept it going today. ¡Sigue así!'}</div>
          </div>
        </div>
      )}

      {badge && (
        <div className="animate-badge mt-4 overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center" style={{ animationDelay: `${streakDelay + 300}ms` }}>
          <div className="relative inline-block text-6xl">
            {badge.emoji}
            <span className="animate-shine pointer-events-none absolute inset-0" aria-hidden />
          </div>
          <div className="mt-1 font-extrabold text-amber-900">New badge: {badge.name}</div>
          <div className="text-sm text-amber-800">{badge.text}</div>
        </div>
      )}

      {children && (
        <div className="animate-rise" style={{ animationDelay: `${streakDelay + 450}ms` }}>
          {children}
        </div>
      )}
    </div>
  )
}
