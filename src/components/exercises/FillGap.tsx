import { useState } from 'react'
import type { Exercise } from '../../types'
import { checkAnswer, pick } from '../../lib/answers'
import { useData } from '../../context/DataContext'
import { CheckButton, Feedback, Prompt, type ExerciseProps, type FeedbackState } from './shared'

type Gap = Extract<Exercise, { type: 'gap' }>

export default function FillGap({ exercise, variant, onDone }: ExerciseProps<Gap>) {
  const { settings } = useData()
  const [value, setValue] = useState('')
  const [fb, setFb] = useState<FeedbackState | null>(null)
  const sentence = pick(exercise.sentence, variant)
  const [before, after] = sentence.split('___')

  const check = () => setFb(checkAnswer(value, exercise.answers, variant))

  return (
    <div>
      <Prompt sub={settings.showEnglish ? exercise.en : undefined}>{exercise.prompt ?? 'Fill in the gap'}</Prompt>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim() && !fb) check()
        }}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-stone-100 p-4 text-lg font-semibold text-stone-900">
          <span>{before}</span>
          <input
            autoFocus
            value={value}
            disabled={!!fb}
            onChange={(e) => setValue(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            lang="es"
            className="w-36 rounded-lg border-b-4 border-orange-400 bg-white px-2 py-1 text-center outline-none focus:border-orange-600"
            aria-label="Your answer"
          />
          <span>{after}</span>
        </div>
        {exercise.hint && <p className="mt-2 text-sm text-stone-500">Hint: {exercise.hint}</p>}
        <AccentBar onInsert={(c) => setValue((v) => v + c)} />
        {!fb && <CheckButton disabled={!value.trim()} onClick={check} />}
      </form>
      {fb && <Feedback current={variant} state={fb} explanation={exercise.explanation} onContinue={() => onDone(fb.correct)} />}
    </div>
  )
}

/** on-screen buttons for Spanish characters (laptop keyboards often lack them) */
export function AccentBar({ onInsert }: { onInsert: (c: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'].map((c) => (
        <button key={c} type="button" onClick={() => onInsert(c)} className="h-9 w-9 rounded-lg border border-stone-300 bg-white font-semibold text-stone-700 hover:bg-stone-100">
          {c}
        </button>
      ))}
    </div>
  )
}
