import { useEffect, useRef, type ReactNode } from 'react'
import { registerAnswer } from '../../lib/combo'
import type { Variant } from '../../types'

export interface ExerciseProps<T> {
  exercise: T
  /** variant currently shown in the lesson */
  variant: Variant
  onDone: (correct: boolean) => void
}

export interface FeedbackState {
  correct: boolean
  variant?: Variant | 'both'
  accentWarning?: boolean
  expected?: string
  extra?: string
}

export function Prompt({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-stone-900 sm:text-xl">{children}</h2>
      {sub && <div className="mt-1 text-sm text-stone-500">{sub}</div>}
    </div>
  )
}

/** Instant feedback bar with a short explanation on mistakes. */
/** “✔ Correct” – or, when the answer was in the other variant, “✔ Correct – that's the 🇪🇸 Spain version” */
export function correctLabel(matched: Variant | 'both' | undefined, current: Variant | undefined): string {
  if (!matched || matched === 'both' || !current || matched === current) return '✔ Correct!'
  return matched === 'spain' ? "✔ Correct – that's the 🇪🇸 Spain version" : "✔ Correct – that's the 🌎 Latin American version"
}

export function Feedback({
  state,
  explanation,
  onContinue,
  current,
}: {
  state: FeedbackState
  explanation?: string
  onContinue: () => void
  /** variant currently shown – used to name the other variant when the learner used it */
  current?: Variant
}) {
  // every feedback = one answered question → sound + answers-in-a-row combo (once, even in StrictMode)
  const counted = useRef(false)
  useEffect(() => {
    if (counted.current) return
    counted.current = true
    registerAnswer(state.correct)
  }, [state.correct])

  const otherVariant = state.correct && !!current && !!state.variant && state.variant !== 'both' && state.variant !== current
  return (
    <div
      className={`animate-slide-up fixed inset-x-0 bottom-0 z-30 border-t-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:static sm:mt-6 sm:rounded-2xl sm:border-2 ${
        state.correct ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
      }`}
      role="status"
    >
      <div className="mx-auto max-w-2xl">
        <p className={`flex items-center gap-2 text-lg font-extrabold ${state.correct ? 'text-emerald-800' : 'text-red-800'}`}>
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white ${state.correct ? 'animate-bounce-in bg-emerald-500' : 'animate-shake bg-red-500'}`} aria-hidden>
            {state.correct ? '✓' : '✕'}
          </span>
          {state.correct ? correctLabel(state.variant, current).replace(/^✔ /, '') : 'Not quite'}
        </p>
        {state.accentWarning && state.expected && (
          <p className="text-sm text-emerald-900">Watch the accent: <b>{state.expected}</b></p>
        )}
        {!state.correct && state.expected && (
          <p className="text-sm text-red-900">Correct answer: <b>{state.expected}</b></p>
        )}
        {state.extra && <p className="text-sm text-stone-700">{state.extra}</p>}
        {explanation && (!state.correct || otherVariant) && (
          <p className="mt-1 text-sm text-stone-700">💡 {explanation}</p>
        )}
        <button type="button" autoFocus onClick={onContinue} className={`mt-3 w-full rounded-xl py-3 font-bold text-white ${state.correct ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
          Continue
        </button>
      </div>
    </div>
  )
}

export function CheckButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="btn-primary mt-5 w-full">
      Check
    </button>
  )
}
