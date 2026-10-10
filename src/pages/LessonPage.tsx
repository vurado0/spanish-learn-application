import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { findLesson, nextLessonId, units } from '../lib/content'
import { useData } from '../context/DataContext'
import type { LessonStep, Variant } from '../types'
import ProgressBar from '../components/ProgressBar'
import ExerciseRenderer from '../components/exercises/ExerciseRenderer'
import { ConnectorSection, DialogueSection, GrammarSection, SectionTitle, VocabSection } from '../components/lesson/LessonSections'

const STEPS: LessonStep[] = ['dialogue', 'vocab', 'grammar', 'connector', 'exercises', 'recap']
const MAX_GAP_MS = 5 * 60_000 // idle time beyond this doesn't count as study time

export default function LessonPage() {
  const { lessonId = '' } = useParams()
  const [params] = useSearchParams()
  const found = findLesson(lessonId)
  if (!found) return <Navigate to="/course" replace />
  // key → remount when switching lessons ("next lesson" button)
  return <LessonPlayer key={lessonId + params.get('restart')} lessonId={lessonId} restart={params.has('restart')} />
}

function LessonPlayer({ lessonId, restart }: { lessonId: string; restart: boolean }) {
  const { unit, lesson, index } = findLesson(lessonId)!
  const { settings, progress, saveExerciseProgress, completeLesson } = useData()
  const navigate = useNavigate()

  // resume exactly where the learner left off (unless restarting)
  const saved = restart ? null : progress[lessonId]?.inProgress
  const [step, setStep] = useState<LessonStep>(saved?.step ?? 'dialogue')
  const [exerciseIndex, setExerciseIndex] = useState(saved?.exerciseIndex ?? 0)
  const [correct, setCorrect] = useState(saved?.correct ?? 0)
  const [variant, setVariant] = useState<Variant>(settings.variant)
  const [result, setResult] = useState<{ score: number; newBadge?: string } | null>(null)

  // study-time tracking
  const lastTick = useRef(Date.now())
  const takeMinutes = useCallback(() => {
    const now = Date.now()
    const ms = Math.min(now - lastTick.current, MAX_GAP_MS)
    lastTick.current = now
    return ms / 60_000
  }, [])

  const total = lesson.exercises.length
  const stepIndex = STEPS.indexOf(step)
  const overall = ((stepIndex + (step === 'exercises' ? exerciseIndex / total : 0)) / (STEPS.length - 1)) * 100

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step, exerciseIndex])

  const goTo = (next: LessonStep) => {
    setStep(next)
    saveExerciseProgress(lessonId, { step: next, exerciseIndex, correct }, takeMinutes())
  }

  const onExerciseDone = (ok: boolean) => {
    const nextCorrect = correct + (ok ? 1 : 0)
    const nextIndex = exerciseIndex + 1
    setCorrect(nextCorrect)
    if (nextIndex < total) {
      setExerciseIndex(nextIndex)
      // auto-save after every finished exercise
      saveExerciseProgress(lessonId, { step: 'exercises', exerciseIndex: nextIndex, correct: nextCorrect }, takeMinutes())
    } else {
      const score = Math.round((nextCorrect / total) * 100)
      const { newBadge } = completeLesson(lessonId, score, takeMinutes())
      setResult({ score, newBadge })
      setStep('recap')
    }
  }

  // if a saved state points to "recap" without a result (e.g. reload), show recap with best score
  const recapScore = result?.score ?? progress[lessonId]?.bestScore ?? 0
  const badgeUnit = useMemo(() => units.find((u) => u.badge.id === result?.newBadge), [result])
  const next = nextLessonId(lessonId)

  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="text-2xl text-stone-400 hover:text-stone-700" aria-label="Close lesson (progress is saved)">✕</Link>
          <div className="flex-1">
            <div className="mb-1 truncate text-xs font-semibold text-stone-500">
              Unit {unit.order} · Lesson {index + 1} · {lesson.title}
            </div>
            <ProgressBar value={overall} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5 pb-48 sm:pb-12">
        {step === 'dialogue' && <DialogueSection dialogue={lesson.dialogue} variant={variant} onVariant={setVariant} setting={lesson.setting} />}
        {step === 'vocab' && <VocabSection vocab={lesson.vocab} variant={variant} />}
        {step === 'grammar' && <GrammarSection grammar={lesson.grammar} pronunciation={lesson.pronunciation} first={variant} />}
        {step === 'connector' && <ConnectorSection connector={lesson.connector} first={variant} />}

        {step === 'exercises' && (
          <div>
            <div className="mb-4 flex items-center justify-between text-sm text-stone-500">
              <span className="font-bold tracking-widest text-orange-600 uppercase">5 · Practice</span>
              <span>{exerciseIndex + 1} / {total}</span>
            </div>
            <ExerciseRenderer key={exerciseIndex} exercise={lesson.exercises[exerciseIndex]} variant={variant} onDone={onExerciseDone} />
          </div>
        )}

        {step === 'recap' && (
          <div className="animate-pop">
            <SectionTitle kicker="6 · Recap" title="¡Muy bien! Lesson complete" />
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <div className="text-3xl font-extrabold text-emerald-700">{recapScore}%</div>
                <div className="text-xs font-semibold text-emerald-800">score</div>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4 text-center">
                <div className="text-3xl font-extrabold text-orange-700">+{lesson.vocab.length}</div>
                <div className="text-xs font-semibold text-orange-800">words in your review deck</div>
              </div>
            </div>
            {badgeUnit && (
              <div className="animate-pop mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
                <div className="text-5xl">{badgeUnit.badge.emoji}</div>
                <div className="mt-1 font-extrabold text-amber-900">New badge: {badgeUnit.badge.name}</div>
                <div className="text-sm text-amber-800">You finished Unit {badgeUnit.order}!</div>
              </div>
            )}
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="mb-2 text-sm font-bold text-stone-500">What you can do now</div>
              <ol className="space-y-2">
                {lesson.recap.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">{i + 1}</span>
                    <span className="text-stone-800">{r}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {next && <button type="button" onClick={() => navigate(`/lesson/${next}`)} className="btn-primary flex-1">Next lesson →</button>}
              <Link to="/" className="btn-secondary flex-1">Back to dashboard</Link>
            </div>
          </div>
        )}

        {stepIndex < 4 && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0">
            <div className="mx-auto flex max-w-2xl gap-2">
              {stepIndex > 0 && (
                <button type="button" onClick={() => goTo(STEPS[stepIndex - 1])} className="btn-secondary">←</button>
              )}
              <button type="button" onClick={() => goTo(STEPS[stepIndex + 1])} className="btn-primary flex-1">
                {stepIndex === 3 ? "Let's practise →" : 'Continue →'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
