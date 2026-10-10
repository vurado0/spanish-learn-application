import { Link } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { LEVELS, topics, words } from '../../lib/vocab'
import ProgressRing from '../../components/vocab/ProgressRing'
import VariantSwitch from '../../components/vocab/VariantSwitch'
import ProgressBar from '../../components/ProgressBar'
import { unlockHint, vocabStats } from './vocabStats'

export default function VocabHome() {
  const { vocab, settings, updateSettings } = useData()
  const s = vocabStats(vocab)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Vocabulary 📚</h1>
          <p className="text-sm text-stone-600">{s.total} words · beginner base first</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <VariantSwitch />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-500">
            <input type="checkbox" checked={settings.showOtherVariant} onChange={(e) => updateSettings({ showOtherVariant: e.target.checked })} className="accent-orange-600" />
            Show other variant too
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="text-2xl font-extrabold text-stone-900">{s.learned}</div>
          <div className="text-xs font-semibold text-stone-500">words learned</div>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="text-2xl font-extrabold text-orange-600">{s.due}</div>
          <div className="text-xs font-semibold text-stone-500">due today</div>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="text-2xl font-extrabold text-violet-700">{s.mastered}</div>
          <div className="text-xs font-semibold text-stone-500">mastered</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/vocab/learn" className="group rounded-3xl bg-gradient-to-br from-orange-500 to-rose-500 p-5 text-white shadow-lg transition hover:shadow-xl">
          <div className="text-3xl">✨</div>
          <div className="mt-1 text-xl font-extrabold">Learn new words</div>
          <div className="text-sm text-orange-50">5 words · picture, audio, example – then play</div>
        </Link>
        <Link to="/vocab/review" className={`rounded-3xl p-5 shadow-lg transition hover:shadow-xl ${s.due ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-white text-stone-800'}`}>
          <div className="text-3xl">🔁</div>
          <div className="mt-1 text-xl font-extrabold">Daily review {s.due > 0 && <span className="ml-1 rounded-full bg-white/25 px-2 text-base">{s.due}</span>}</div>
          <div className={`text-sm ${s.due ? 'text-emerald-50' : 'text-stone-500'}`}>{s.due ? 'Max. 15 minutes · spaced repetition' : 'Nothing due – come back tomorrow'}</div>
        </Link>
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold text-stone-900">Your level</h2>
        <div className="space-y-3">
          {s.levels.map((l, i) => (
            <div key={l.level} className={l.unlocked ? '' : 'opacity-70'}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-extrabold text-stone-900">
                  {l.unlocked ? '🔓' : '🔒'} {l.level}
                </span>
                <span className="text-stone-500">{l.familiar} / {l.total} familiar · {l.seen} seen</span>
              </div>
              <ProgressBar value={(l.familiar / l.total) * 100} color={l.unlocked ? 'bg-emerald-500' : 'bg-stone-400'} className="mt-1" />
              {!l.unlocked && <p className="mt-1 text-xs text-stone-500">{unlockHint(l.needed, LEVELS[i - 1], l.level)}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-stone-900">Topics</h2>
          <Link to="/vocab/words" className="text-sm font-semibold text-orange-700">Browse all words →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {topics.map((t) => {
            const list = words.filter((w) => w.topic === t.id)
            const learned = list.filter((w) => vocab[w.id]).length
            return (
              <Link key={t.id} to={`/vocab/words?topic=${t.id}`} className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300">
                <ProgressRing value={learned / list.length} size={64}>
                  <span className="text-2xl">{t.icon}</span>
                </ProgressRing>
                <div className="mt-2 text-sm font-bold text-stone-900">{t.name}</div>
                <div className="text-xs text-stone-500">{learned}/{list.length} learned</div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
