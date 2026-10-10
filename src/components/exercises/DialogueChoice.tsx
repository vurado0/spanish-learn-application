import { useState } from 'react'
import type { Exercise } from '../../types'
import { pick } from '../../lib/answers'
import AudioButton from '../AudioButton'
import { OptionGrid, feedbackForOption, useVariantOptions } from './MultipleChoice'
import { Feedback, Prompt, type ExerciseProps } from './shared'

type Dlg = Extract<Exercise, { type: 'dialogue' }>

export default function DialogueChoice({ exercise, variant, onDone }: ExerciseProps<Dlg>) {
  const options = useVariantOptions(exercise.options, variant)
  const [picked, setPicked] = useState<number | null>(null)
  const fb = picked !== null ? feedbackForOption(options[picked], options) : null
  const chosen = picked !== null ? options[picked] : null

  return (
    <div>
      <Prompt>💬 {exercise.prompt}</Prompt>
      <div className="mb-4 space-y-2">
        {exercise.context.map((line, i) => {
          const text = pick(line, variant)
          const isYou = line.speaker === 'Tú' || line.speaker === 'You'
          return (
            <div key={i} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${isYou ? 'rounded-br-sm bg-orange-100' : 'rounded-bl-sm bg-stone-100'}`}>
                <div className="text-xs font-bold text-stone-500">{line.speaker}</div>
                <div className="flex items-center gap-2 font-medium text-stone-900">
                  {text} <AudioButton text={text} variant={variant} />
                </div>
              </div>
            </div>
          )
        })}
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-br-sm border-2 border-dashed border-orange-300 px-4 py-2 text-stone-400">
            {chosen ? chosen.text : 'Your reply…'}
          </div>
        </div>
      </div>
      <OptionGrid options={options} picked={picked} onPick={setPicked} />
      {fb && chosen && (
        <Feedback current={variant} state={{ ...fb, extra: chosen.feedback }} explanation={exercise.explanation} onContinue={() => onDone(fb.correct)} />
      )}
    </div>
  )
}
