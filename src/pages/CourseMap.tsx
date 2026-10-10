import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { units } from '../lib/content'
import roadmap from '../content/roadmap.json'
import ProgressBar from '../components/ProgressBar'

export default function CourseMap() {
  const { progress, stats } = useData()
  const available = new Set(units.map((u) => u.order))
  const upcoming = (roadmap as { order: number; title: string; emoji: string; level: string; description: string }[]).filter(
    (r) => !available.has(r.order),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900">Your course</h1>
        <p className="text-stone-600">A1 → A2 → early B1 · conversation first. Every lesson is open – the highlighted one is your next step.</p>
      </div>

      {units.map((u) => {
        const done = u.lessons.filter((l) => progress[l.id]?.completed).length
        return (
          <section key={u.id} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{u.emoji}</span>
              <div className="flex-1">
                <div className="text-xs font-bold tracking-widest text-orange-600 uppercase">Unit {u.order} · {u.level}</div>
                <h2 className="text-xl font-extrabold text-stone-900">{u.title}</h2>
                <p className="text-sm text-stone-500">{u.titleEs} — {u.description}</p>
              </div>
              <span className={`text-3xl ${stats.badges?.includes(u.badge.id) ? '' : 'opacity-30 grayscale'}`} title={u.badge.name}>{u.badge.emoji}</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-stone-500">
              <ProgressBar value={(done / u.lessons.length) * 100} color="bg-emerald-500" />
              <span className="shrink-0">{done}/{u.lessons.length}</span>
            </div>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {u.lessons.map((l, i) => {
                const p = progress[l.id]
                const isCurrent = stats.currentLesson === l.id
                return (
                  <li key={l.id}>
                    <Link
                      to={`/lesson/${l.id}`}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition hover:border-orange-300 ${
                        isCurrent ? 'border-orange-500 bg-orange-50' : p?.completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-stone-200'
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${p?.completed ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-orange-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                        {p?.completed ? '✓' : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-stone-900">{l.title}</div>
                        <div className="truncate text-xs text-stone-500">
                          {l.setting === 'spain' ? '🇪🇸' : '🌎'} {l.scenario} · {l.minutes} min
                        </div>
                        <div className="text-xs text-stone-500">
                          {p?.completed ? `Best ${p.bestScore}% · ${p.attempts} attempt${p.attempts > 1 ? 's' : ''}` : p?.inProgress ? 'In progress…' : isCurrent ? 'Next up' : ''}
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-stone-500">Coming next</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((r) => (
              <div key={r.order} className="flex items-center gap-3 rounded-2xl border border-dashed border-stone-300 p-3 text-stone-500">
                <span className="text-3xl opacity-60">{r.emoji}</span>
                <div>
                  <div className="font-bold">Unit {r.order} · {r.level} — {r.title}</div>
                  <div className="text-xs">{r.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
