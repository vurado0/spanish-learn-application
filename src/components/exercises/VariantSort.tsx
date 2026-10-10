import { useMemo, useState } from 'react'
import type { Exercise, Variant } from '../../types'
import { shuffle } from '../../lib/answers'
import { useData } from '../../context/DataContext'
import AudioButton from '../AudioButton'
import { Feedback, Prompt, type ExerciseProps } from './shared'

type Sort = Extract<Exercise, { type: 'sort' }>

/** "🌎 or 🇪🇸?" sorting game: one card at a time, instant feedback per card. */
export default function VariantSort({ exercise, onDone }: ExerciseProps<Sort>) {
  const { settings } = useData()
  const items = useMemo(() => shuffle(exercise.items), [exercise])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [flash, setFlash] = useState<null | boolean>(null)
  const done = results.length === items.length
  const mistakes = results.filter((r) => !r).length

  const choose = (v: Variant) => {
    if (flash !== null) return
    const ok = items[index].variant === v
    setFlash(ok)
    setTimeout(() => {
      setResults((r) => [...r, ok])
      setIndex((i) => i + 1)
      setFlash(null)
    }, ok ? 450 : 1100)
  }

  const item = items[Math.min(index, items.length - 1)]

  return (
    <div>
      <Prompt sub={`${Math.min(results.length + 1, items.length)} / ${items.length}`}>{exercise.prompt}</Prompt>
      {!done && (
        <>
          <div
            className={`animate-pop mx-auto mb-5 flex min-h-32 max-w-sm flex-col items-center justify-center rounded-2xl border-2 bg-white p-5 text-center shadow ${
              flash === true ? 'border-emerald-400 bg-emerald-50' : flash === false ? 'animate-shake border-red-400 bg-red-50' : 'border-stone-200'
            }`}
            key={index}
          >
            <div className="flex items-center gap-2 text-2xl font-extrabold text-stone-900">
              {item.text} <AudioButton text={item.text} variant={item.variant} />
            </div>
            {item.en && settings.showEnglish && <div className="mt-1 text-sm text-stone-500 italic">{item.en}</div>}
            {flash === false && (
              <div className="mt-2 text-sm font-semibold text-red-700">
                That's {item.variant === 'spain' ? '🇪🇸 Spain' : '🌎 Latin America'}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => choose('latam')} className="rounded-2xl bg-emerald-600 py-5 text-lg font-extrabold text-white shadow hover:bg-emerald-700 active:scale-95">
              🌎 Latin America
            </button>
            <button type="button" onClick={() => choose('spain')} className="rounded-2xl bg-amber-500 py-5 text-lg font-extrabold text-white shadow hover:bg-amber-600 active:scale-95">
              🇪🇸 Spain
            </button>
          </div>
        </>
      )}
      {done && (
        <Feedback
          state={{ correct: mistakes <= 1, extra: `${items.length - mistakes} / ${items.length} sorted correctly.` }}
          explanation={exercise.explanation}
          onContinue={() => onDone(mistakes <= 1)}
        />
      )}
    </div>
  )
}
