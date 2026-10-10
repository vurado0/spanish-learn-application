import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { differs, LEVELS, topicIndex, topics, words } from '../../lib/vocab'
import { isDue, mastery, MASTERY_LEVELS, type Mastery } from '../../lib/srs'
import { normalize } from '../../lib/answers'
import type { VocabWord } from '../../types'
import WordCard from '../../components/vocab/WordCard'
import VariantSwitch from '../../components/vocab/VariantSwitch'
import { MASTERY_LABEL } from '../../components/vocab/MasteryDots'

const fold = (s: string) => normalize(s).normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function VocabBrowse() {
  const { vocab } = useData()
  const [params, setParams] = useSearchParams()
  const topic = params.get('topic') ?? ''
  const [level, setLevel] = useState('')
  const [mast, setMast] = useState<Mastery | ''>('')
  const [dueOnly, setDueOnly] = useState(false)
  const [diffOnly, setDiffOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<VocabWord | null>(null)

  const list = useMemo(() => {
    const q = fold(query)
    return words.filter(
      (w) =>
        (!topic || w.topic === topic) &&
        (!level || w.level === level) &&
        (!mast || mastery(vocab[w.id]) === mast) &&
        (!dueOnly || (vocab[w.id] && isDue(vocab[w.id]))) &&
        (!diffOnly || differs(w)) &&
        (!q || [w.spanishLatam, w.spanishSpain ?? '', w.feminine ?? '', w.english].some((t) => fold(t).includes(q))),
    )
  }, [topic, level, mast, dueOnly, diffOnly, query, vocab])

  const t = topicIndex.get(topic)
  const select = 'rounded-xl border border-stone-300 bg-white px-2 py-2 text-sm'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/vocab" className="text-sm text-orange-700">← Vocabulary</Link>
          <h1 className="text-2xl font-extrabold text-stone-900">{t ? `${t.icon} ${t.name}` : 'All words'}</h1>
        </div>
        <VariantSwitch />
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search in Spanish or English…" className="input" aria-label="Search words" />

      <div className="flex flex-wrap gap-2">
        <select value={topic} onChange={(e) => setParams(e.target.value ? { topic: e.target.value } : {})} className={select} aria-label="Topic">
          <option value="">All topics</option>
          {topics.map((x) => <option key={x.id} value={x.id}>{x.icon} {x.name}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={select} aria-label="Level">
          <option value="">All levels</option>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={mast} onChange={(e) => setMast(e.target.value as Mastery | '')} className={select} aria-label="Mastery">
          <option value="">Any mastery</option>
          {MASTERY_LEVELS.map((m) => <option key={m} value={m}>{MASTERY_LABEL[m]}</option>)}
        </select>
        <label className={`${select} flex cursor-pointer items-center gap-1.5`}>
          <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} className="accent-orange-600" /> Due today
        </label>
        <label className={`${select} flex cursor-pointer items-center gap-1.5`}>
          <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="accent-orange-600" /> 🌎 ≠ 🇪🇸
        </label>
      </div>

      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{list.length} word{list.length === 1 ? '' : 's'}</span>
        {topic && <Link to={`/vocab/learn?topic=${topic}`} className="font-semibold text-orange-700">✨ Learn 5 from this topic</Link>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((w) => <WordCard key={w.id} word={w} compact onClick={() => setOpen(w)} />)}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-stone-500">No words match these filters.</p>}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="animate-pop w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <WordCard word={open} />
            <button type="button" onClick={() => setOpen(null)} className="btn-secondary mt-2 w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
