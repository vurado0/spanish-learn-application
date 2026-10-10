import { useEffect, useState } from 'react'
import type { Exercise } from '../../types'
import { checkAnswer, pick } from '../../lib/answers'
import { speak } from '../../lib/speech'
import { useData } from '../../context/DataContext'
import { OptionGrid, feedbackForOption, useVariantOptions } from './MultipleChoice'
import { AccentBar } from './FillGap'
import { CheckButton, Feedback, Prompt, type ExerciseProps, type FeedbackState } from './shared'

type Listen = Extract<Exercise, { type: 'listen' }>

export default function Listening({ exercise, variant, onDone }: ExerciseProps<Listen>) {
  const { settings } = useData()
  const text = pick(exercise.audio, variant)
  const options = useVariantOptions(exercise.options ?? [], variant)
  const [picked, setPicked] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const [typedFb, setTypedFb] = useState<FeedbackState | null>(null)

  const play = (slow = false) => speak(text, variant, slow ? 'slow' : settings.audioSpeed)

  useEffect(() => {
    const t = setTimeout(() => play(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, variant])

  const fb: FeedbackState | null =
    exercise.mode === 'choose' ? (picked !== null ? feedbackForOption(options[picked], options) : null) : typedFb

  const answers = exercise.answers ?? { latam: [exercise.audio.latam], spain: exercise.audio.spain ? [exercise.audio.spain] : undefined }

  return (
    <div>
      <Prompt>🎧 {exercise.prompt}</Prompt>
      <div className="mb-5 flex items-center justify-center gap-3">
        <button type="button" onClick={() => play()} className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-600 text-3xl text-white shadow-lg hover:bg-orange-700 active:scale-95" aria-label="Play audio">
          🔊
        </button>
        <button type="button" onClick={() => play(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-xl hover:bg-orange-200" aria-label="Play slowly">
          🐢
        </button>
      </div>
      {exercise.mode === 'choose' ? (
        <OptionGrid options={options} picked={picked} onPick={setPicked} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim() && !typedFb) setTypedFb(checkAnswer(value, answers, variant))
          }}
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!!typedFb}
            placeholder="Type what you hear…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            lang="es"
            className="input text-lg"
          />
          <AccentBar onInsert={(c) => setValue((v) => v + c)} />
          {!typedFb && <CheckButton disabled={!value.trim()} onClick={() => setTypedFb(checkAnswer(value, answers, variant))} />}
        </form>
      )}
      {fb && (
        <Feedback
          state={{ ...fb, extra: `You heard: “${text}”` }}
          explanation={exercise.explanation}
          onContinue={() => onDone(fb.correct)}
        />
      )}
    </div>
  )
}
