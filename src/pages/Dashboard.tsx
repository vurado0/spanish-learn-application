import { Link } from 'react-router-dom'
import { useData, displayStreak } from '../context/DataContext'
import { allLessons, findLesson, units } from '../lib/content'
import { daysUntilGoal, weekKey, WEEKLY_TARGET_MINUTES } from '../lib/dates'
import { isDue } from '../lib/srs'
import ProgressBar from '../components/ProgressBar'
import Card from '../components/Card'

const STEP_LABEL: Record<string, string> = {
  dialogue: 'Dialogue',
  vocab: 'New words',
  grammar: 'Grammar',
  connector: 'Connector',
  exercises: 'Exercises',
  recap: 'Recap',
}

export default function Dashboard() {
  const { profile, stats, progress, vocab } = useData()
  const streak = displayStreak(stats)
  const completed = allLessons.filter((l) => progress[l.id]?.completed).length
  const coursePct = allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0
  const minutes = stats.weeklyMinutes?.week === weekKey() ? stats.weeklyMinutes.minutes : 0
  const due = Object.values(vocab).filter((v) => isDue(v)).length
  const days = daysUntilGoal()

  const current = findLesson(stats.currentLesson) ?? findLesson(allLessons[0].id)!
  const inProgress = progress[current.lesson.id]?.inProgress
  const allDone = completed === allLessons.length
  const firstName = (profile?.displayName ?? '').split(' ')[0]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">¡Hola{firstName ? `, ${firstName}` : ''}! 👋</h1>
        <p className="text-stone-600">{streak > 0 ? `${streak}-day streak – ¡sigue así!` : 'Start a lesson today to begin a streak.'}</p>
      </div>

      {/* Continue where you left off */}
      <Link
        to={`/lesson/${current.lesson.id}`}
        className="group block rounded-3xl bg-gradient-to-br from-orange-600 to-rose-600 p-5 text-white shadow-lg transition hover:shadow-xl sm:p-6"
      >
        <div className="text-xs font-bold tracking-widest text-orange-100 uppercase">
          {inProgress ? 'Continue where you left off' : allDone ? 'Practise again' : 'Up next'}
        </div>
        <div className="mt-1 text-2xl font-extrabold">{current.lesson.title}</div>
        <div className="text-orange-100">
          {current.lesson.titleEs} · Unit {current.unit.order}: {current.unit.title}
        </div>
        {inProgress && (
          <div className="mt-2 text-sm text-orange-50">
            Saved at: {STEP_LABEL[inProgress.step]}
            {inProgress.step === 'exercises' && ` ${inProgress.exerciseIndex + 1}/${current.lesson.exercises.length}`}
          </div>
        )}
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-bold text-orange-700 group-hover:bg-orange-50">
          {inProgress ? '▶ Continue' : '▶ Start'} · ~{current.lesson.minutes} min
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <div className="text-3xl">🔥</div>
          <div className="text-2xl font-extrabold text-stone-900">{streak}</div>
          <div className="text-xs font-semibold text-stone-500">day streak</div>
        </Card>
        <Card>
          <div className="text-3xl">📈</div>
          <div className="text-2xl font-extrabold text-stone-900">{coursePct}%</div>
          <div className="text-xs font-semibold text-stone-500">course completed ({completed}/{allLessons.length} lessons)</div>
          <ProgressBar value={coursePct} className="mt-2" color="bg-emerald-500" />
        </Card>
        <Card>
          <div className="text-3xl">⏱️</div>
          <div className="text-2xl font-extrabold text-stone-900">
            {Math.round(minutes)}<span className="text-base font-bold text-stone-400"> / {WEEKLY_TARGET_MINUTES} min</span>
          </div>
          <div className="text-xs font-semibold text-stone-500">this week (6 h target)</div>
          <ProgressBar value={(minutes / WEEKLY_TARGET_MINUTES) * 100} className="mt-2" color="bg-sky-500" />
        </Card>
        <Card>
          <div className="text-3xl">🗓️</div>
          <div className="text-2xl font-extrabold text-stone-900">{days}</div>
          <div className="text-xs font-semibold text-stone-500">days until February 2027 – real conversations!</div>
        </Card>
      </div>

      <Link to="/review" className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-orange-300">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔁</span>
          <div>
            <div className="font-bold text-stone-900">Daily vocabulary review</div>
            <div className="text-sm text-stone-500">
              {due > 0 ? `${due} word${due > 1 ? 's' : ''} due today` : Object.keys(vocab).length ? 'All caught up – come back tomorrow' : 'Finish a lesson to fill your deck'}
            </div>
          </div>
        </div>
        {due > 0 && <span className="rounded-full bg-orange-600 px-3 py-1 text-sm font-bold text-white">{due}</span>}
      </Link>

      <Card>
        <div className="mb-3 font-bold text-stone-900">🏅 Badges</div>
        <div className="flex flex-wrap gap-3">
          {units.map((u) => {
            const earned = stats.badges?.includes(u.badge.id)
            return (
              <div key={u.id} className={`flex w-24 flex-col items-center rounded-2xl p-2 text-center ${earned ? 'bg-amber-50' : 'opacity-40 grayscale'}`} title={earned ? 'Earned!' : `Finish Unit ${u.order}`}>
                <span className="text-4xl">{u.badge.emoji}</span>
                <span className="mt-1 text-xs font-semibold text-stone-700">{u.badge.name}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/reference/latam-vs-spain" className="rounded-2xl bg-emerald-50 p-4 font-semibold text-emerald-900 hover:bg-emerald-100">🌎 vs 🇪🇸 Latin America vs Spain</Link>
        <Link to="/reference/tenses" className="rounded-2xl bg-sky-50 p-4 font-semibold text-sky-900 hover:bg-sky-100">⏳ Tense overview</Link>
        <Link to="/reference/connectors" className="rounded-2xl bg-violet-50 p-4 font-semibold text-violet-900 hover:bg-violet-100">🔗 Connectors cheat sheet</Link>
      </div>
    </div>
  )
}
