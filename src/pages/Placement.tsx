import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { placement, findLesson, allLessons } from '../lib/content'
import { shuffle } from '../lib/answers'
import { useData } from '../context/DataContext'
import { OptionGrid } from '../components/exercises/MultipleChoice'
import VariantText from '../components/VariantText'
import ProgressBar from '../components/ProgressBar'

export default function Placement() {
  const { savePlacement, profile } = useData()
  const navigate = useNavigate()
  const questions = useMemo(() => placement.questions.map((q) => ({ ...q, options: shuffle(q.options) })), [])
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const retake = !!profile?.placementResult

  const band = [...placement.bands].sort((a, b) => b.minScore - a.minScore).find((b) => score >= b.minScore) ?? placement.bands[0]

  const pick = (idx: number) => {
    setPicked(idx)
    const ok = idx >= 0 && !!questions[i].options[idx].correct
    setTimeout(() => {
      const s = score + (ok ? 1 : 0)
      setScore(s)
      setPicked(null)
      if (i + 1 < questions.length) setI(i + 1)
      else setFinished(true)
    }, 700)
  }

  const finish = (startLessonId: string, skipped = false) => {
    savePlacement({ score, total: questions.length, startLessonId, takenAt: Date.now(), skipped })
    navigate('/', { replace: true })
  }

  const q = questions[i]

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-orange-50 via-stone-50 to-emerald-50 px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
        {!started && (
          <div className="text-center">
            <div className="text-5xl">🧭</div>
            <h1 className="mt-2 text-2xl font-extrabold text-stone-900">Quick placement check</h1>
            <p className="mt-2 text-stone-600">{placement.intro}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" className="btn-primary" onClick={() => setStarted(true)}>Start · 10 questions</button>
              <button type="button" className="btn-secondary" onClick={() => (retake ? navigate(-1) : finish(allLessons[0].id, true))}>
                {retake ? 'Cancel' : "Skip – I'm a total beginner"}
              </button>
            </div>
          </div>
        )}

        {started && !finished && (
          <div>
            <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-stone-500">
              <ProgressBar value={(i / questions.length) * 100} />
              <span className="shrink-0">{i + 1}/{questions.length}</span>
            </div>
            <h2 className="mb-3 text-lg font-bold text-stone-900">{q.prompt}</h2>
            {q.say && (
              <div className="mb-4 rounded-xl bg-stone-100 p-3">
                <VariantText text={q.say} />
              </div>
            )}
            <OptionGrid key={q.id} options={q.options} picked={picked} onPick={pick} />
            <button type="button" onClick={() => pick(-1)} disabled={picked !== null} className="mt-4 text-sm text-stone-500 underline">
              I don't know
            </button>
          </div>
        )}

        {finished && (
          <div className="animate-pop text-center">
            <div className="text-5xl">🎯</div>
            <h2 className="mt-2 text-2xl font-extrabold text-stone-900">{score} / {questions.length}</h2>
            <p className="mt-2 text-stone-700">{band.message}</p>
            <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm text-orange-900">
              You'll start at <b>{findLesson(band.startLessonId)?.lesson.title}</b>. Every earlier lesson stays open if you want a refresher.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" className="btn-primary" onClick={() => finish(band.startLessonId)}>¡Vamos! Start learning</button>
              <button type="button" className="btn-secondary" onClick={() => finish(allLessons[0].id)}>Start from the very beginning instead</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
