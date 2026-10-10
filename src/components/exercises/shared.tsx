import type { ReactNode } from 'react'
import type { Variant } from '../../types'
import { variantLabel } from '../../lib/answers'

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
export function Feedback({ state, explanation, onContinue }: { state: FeedbackState; explanation?: string; onContinue: () => void }) {
  const label = variantLabel(state.variant)
  return (
    <div
      className={`animate-pop fixed inset-x-0 bottom-0 z-30 border-t-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:static sm:mt-6 sm:rounded-2xl sm:border-2 ${
        state.correct ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
      }`}
      role="status"
    >
      <div className="mx-auto max-w-2xl">
        <p className={`text-lg font-extrabold ${state.correct ? 'text-emerald-800' : 'text-red-800'}`}>
          {state.correct ? `✔ Correct${label ? ` – ${label}` : '!'}` : '✘ Not quite'}
        </p>
        {state.accentWarning && state.expected && (
          <p className="text-sm text-emerald-900">Watch the accents: <b>{state.expected}</b></p>
        )}
        {!state.correct && state.expected && (
          <p className="text-sm text-red-900">Correct answer: <b>{state.expected}</b></p>
        )}
        {state.extra && <p className="text-sm text-stone-700">{state.extra}</p>}
        {explanation && (!state.correct || state.variant === 'latam' || state.variant === 'spain') && (
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
