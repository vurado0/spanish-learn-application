import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { vocabIndex } from '../lib/content'
import { isDue, BOX_INTERVALS } from '../lib/srs'
import { checkAnswer, shuffle, variantLabel, vocabAnswers, type CheckResult } from '../lib/answers'
import VariantText from '../components/VariantText'
import { AccentBar } from '../components/exercises/FillGap'
import ProgressBar from '../components/ProgressBar'
import Card from '../components/Card'

const MAX_GAP_MS = 2 * 60_000

export default function Review() {
  const { vocab, reviewWord, settings } = useData()
  // freeze the queue when the session starts so cards don't disappear mid-review
  const [queue, setQueue] = useState<string[] | null>(null)
  const dueIds = useMemo(() => Object.entries(vocab).filter(([id, v]) => isDue(v) && vocabIndex.has(id)).map(([id]) => id), [vocab])
  const [pos, setPos] = useState(0)
  const [value, setValue] = useState('')
  const [res, setRes] = useState<CheckResult | null>(null)
  const [right, setRight] = useState(0)
  const lastTick = useRef(Date.now())

  const boxCounts = BOX_INTERVALS.map((_, i) => Object.values(vocab).filter((v) => v.box === i + 1).length)

  if (!queue) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Daily review 🔁</h1>
          <p className="text-stone-600">Spaced repetition (Leitner boxes): words you know come back less often, words you miss come back tomorrow.</p>
        </div>
        <Card>
          <div className="mb-3 text-sm font-bold text-stone-500">Your boxes</div>
          <div className="grid grid-cols-6 gap-2 text-center">
            {boxCounts.map((n, i) => (
              <div key={i} className="rounded-xl bg-stone-100 p-2">
                <div className="text-lg font-extrabold text-stone-900">{n}</div>
                <div className="text-[10px] font-semibold text-stone-500">box {i + 1}<br />every {BOX_INTERVALS[i]}d</div>
              </div>
            ))}
          </div>
        </Card>
        {dueIds.length > 0 ? (
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setQueue(shuffle(dueIds).slice(0, 20))
              lastTick.current = Date.now()
            }}
          >
            Review {Math.min(20, dueIds.length)} word{dueIds.length > 1 ? 's' : ''} now
          </button>
        ) : (
          <Card className="text-center">
            <div className="text-4xl">🌟</div>
            <p className="mt-2 font-semibold text-stone-800">
              {Object.keys(vocab).length ? 'Nothing due – you are all caught up!' : 'Your deck is empty. Finish a lesson and its words appear here tomorrow.'}
            </p>
            <Link to="/" className="btn-secondary mt-4">Back to dashboard</Link>
          </Card>
        )}
      </div>
    )
  }

  const done = pos >= queue.length
  if (done) {
    return (
      <Card className="animate-pop text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">Review done!</h2>
        <p className="text-stone-600">{right} / {queue.length} remembered.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/" className="btn-primary">Dashboard</Link>
          <button type="button" className="btn-secondary" onClick={() => { setQueue(null); setPos(0); setRight(0) }}>Back</button>
        </div>
      </Card>
    )
  }

  const word = vocabIndex.get(queue[pos])!

  const minutes = () => {
    const now = Date.now()
    const m = Math.min(now - lastTick.current, MAX_GAP_MS) / 60_000
    lastTick.current = now
    return m
  }

  const submit = (giveUp = false) => {
    if (res) return
    const r = giveUp
      ? { correct: false, expected: word.latam }
      : checkAnswer(value, { latam: vocabAnswers(word.latam), spain: word.spain ? vocabAnswers(word.spain) : undefined }, settings.defaultVariant)
    setRes(r)
    if (r.correct) setRight((n) => n + 1)
    reviewWord(word.id, r.correct, minutes())
  }

  const next = () => {
    setRes(null)
    setValue('')
    setPos((p) => p + 1)
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3 text-sm font-semibold text-stone-500">
        <ProgressBar value={(pos / queue.length) * 100} />
        <span className="shrink-0">{pos + 1}/{queue.length}</span>
      </div>
      <Card className="text-center">
        <div className="text-xs font-bold tracking-widest text-stone-400 uppercase">How do you say…</div>
        <div className="mt-2 text-2xl font-extrabold text-stone-900">{word.en}</div>
        {word.spain && word.spain !== word.latam && <div className="mt-1 text-xs text-stone-500">🌎 and 🇪🇸 answers both count</div>}
      </Card>
      <form onSubmit={(e) => { e.preventDefault(); if (res) next(); else if (value.trim()) submit() }}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!!res}
          placeholder="Escribe en español…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          lang="es"
          className="input text-lg"
        />
        {!res && <AccentBar onInsert={(c) => setValue((v) => v + c)} />}
        {!res && (
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => submit(true)}>Show answer</button>
            <button type="submit" className="btn-primary flex-1" disabled={!value.trim()}>Check</button>
          </div>
        )}
      </form>
      {res && (
        <div className={`animate-pop rounded-2xl border-2 p-4 ${res.correct ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <p className={`font-extrabold ${res.correct ? 'text-emerald-800' : 'text-red-800'}`}>
            {res.correct ? `✔ Correct${variantLabel(res.variant) ? ` – ${variantLabel(res.variant)}` : '!'}` : '✘ This one comes back tomorrow'}
          </p>
          {res.accentWarning && <p className="text-sm">Watch the accents: <b>{res.expected}</b></p>}
          <VariantText text={word} className="mt-2" />
          <button type="button" autoFocus onClick={next} className="btn-primary mt-3 w-full">Next</button>
        </div>
      )}
    </div>
  )
}
