import { useMemo, useState, type DragEvent } from 'react'
import type { Exercise } from '../../types'
import { checkAnswer, normalize, shuffle } from '../../lib/answers'
import { CheckButton, Feedback, Prompt, type ExerciseProps, type FeedbackState } from './shared'

type Build = Extract<Exercise, { type: 'build' }>

interface Tile {
  id: number
  word: string
}

/** Tiles = the words of the 🌎 and 🇪🇸 answers (so both orders can be built) + distractors. */
function makeTiles(ex: Build): Tile[] {
  const counts = new Map<string, number>()
  const sentences = [ex.answers.latam[0], ex.answers.spain?.[0]].filter(Boolean) as string[]
  for (const s of sentences) {
    const local = new Map<string, number>()
    for (const w of s.replace(/[¿?¡!.,]/g, '').split(' ').filter(Boolean)) local.set(w, (local.get(w) ?? 0) + 1)
    local.forEach((n, w) => counts.set(w, Math.max(counts.get(w) ?? 0, n)))
  }
  for (const d of ex.distractors ?? []) counts.set(d, (counts.get(d) ?? 0) + 1)
  const words: string[] = []
  counts.forEach((n, w) => {
    for (let i = 0; i < n; i++) words.push(w)
  })
  return shuffle(words).map((word, id) => ({ id, word }))
}

export default function SentenceBuilder({ exercise, variant, onDone }: ExerciseProps<Build>) {
  const tiles = useMemo(() => makeTiles(exercise), [exercise])
  const [line, setLine] = useState<number[]>([])
  const [fb, setFb] = useState<FeedbackState | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  const bank = tiles.filter((t) => !line.includes(t.id))
  const word = (id: number) => tiles.find((t) => t.id === id)!.word

  const add = (id: number, at?: number) => {
    if (fb) return
    setLine((l) => {
      const without = l.filter((x) => x !== id)
      const pos = at === undefined ? without.length : at
      return [...without.slice(0, pos), id, ...without.slice(pos)]
    })
  }
  const remove = (id: number) => !fb && setLine((l) => l.filter((x) => x !== id))

  const check = () => {
    const sentence = line.map(word).join(' ')
    // punctuation-insensitive: compare against answers stripped the same way
    const res = checkAnswer(normalize(sentence), exercise.answers, variant)
    setFb(res)
  }

  const onDropLine = (e: DragEvent, at?: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragId !== null) add(dragId, at)
    setDragId(null)
  }

  return (
    <div>
      <Prompt sub="Tap (or drag) the words into the right order.">Build: “{exercise.en}”</Prompt>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDropLine(e)}
        className="flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-white p-3"
      >
        {line.length === 0 && <span className="text-sm text-stone-400">Your sentence…</span>}
        {line.map((id, i) => (
          <button
            key={id}
            type="button"
            draggable={!fb}
            onDragStart={() => setDragId(id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropLine(e, i)}
            onClick={() => remove(id)}
            className="rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-1.5 font-semibold text-stone-900 shadow-sm"
          >
            {word(id)}
          </button>
        ))}
      </div>
      <div
        className="mt-4 flex min-h-12 flex-wrap gap-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (dragId !== null) remove(dragId)
          setDragId(null)
        }}
      >
        {bank.map((t) => (
          <button
            key={t.id}
            type="button"
            draggable={!fb}
            onDragStart={() => setDragId(t.id)}
            onClick={() => add(t.id)}
            className="rounded-lg border-2 border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-800 shadow-sm hover:border-orange-300"
          >
            {t.word}
          </button>
        ))}
      </div>
      {!fb && <CheckButton disabled={line.length === 0} onClick={check} />}
      {fb && <Feedback state={fb} explanation={exercise.explanation} onContinue={() => onDone(fb.correct)} />}
    </div>
  )
}
