import { useMemo, useState } from 'react'
import type { Exercise, McOption, Variant } from '../../types'
import { shuffle } from '../../lib/answers'
import { useData } from '../../context/DataContext'
import VariantText from '../VariantText'
import { Feedback, Prompt, type ExerciseProps, type FeedbackState } from './shared'

type Mc = Extract<Exercise, { type: 'mc' }>

/** reusable option grid (also used by listening, dialogue choice and the placement check) */
export function OptionGrid({
  options,
  picked,
  onPick,
}: {
  options: McOption[]
  picked: number | null
  onPick: (i: number) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o, i) => {
        const done = picked !== null
        const state = !done ? '' : o.correct ? 'border-emerald-500 bg-emerald-50' : i === picked ? 'animate-shake border-red-400 bg-red-50' : 'opacity-60'
        return (
          <button key={i} type="button" disabled={done} onClick={() => onPick(i)} className={`chip ${state}`}>
            {o.text}
          </button>
        )
      })}
    </div>
  )
}

/** only the selected variant's answers are offered, unless “show other variant too” is on */
export function useVariantOptions<T extends McOption>(options: T[], variant: Variant): T[] {
  const { settings } = useData()
  return useMemo(
    () => shuffle(options.filter((o) => settings.showOtherVariant || !o.variant || o.variant === variant)),
    [options, variant, settings.showOtherVariant],
  )
}

export function feedbackForOption(o: McOption, options: McOption[]): FeedbackState {
  const correctOnes = options.filter((x) => x.correct)
  return {
    correct: !!o.correct,
    variant: o.correct ? o.variant : undefined,
    expected: o.correct ? undefined : correctOnes.map((x) => x.text + (x.variant ? (x.variant === 'spain' ? ' 🇪🇸' : ' 🌎') : '')).join(' / '),
  }
}

export default function MultipleChoice({ exercise, variant, onDone }: ExerciseProps<Mc>) {
  const options = useVariantOptions(exercise.options, variant)
  const [picked, setPicked] = useState<number | null>(null)
  const fb = picked !== null ? feedbackForOption(options[picked], options) : null

  return (
    <div>
      <Prompt>{exercise.prompt}</Prompt>
      {exercise.say && (
        <div className="mb-4 rounded-xl bg-stone-100 p-3">
          <VariantText text={exercise.say} variant={variant} />
        </div>
      )}
      <OptionGrid options={options} picked={picked} onPick={setPicked} />
      {fb && <Feedback current={variant} state={fb} explanation={exercise.explanation} onContinue={() => onDone(fb.correct)} />}
    </div>
  )
}
