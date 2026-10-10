import { useMemo, useState } from 'react'
import type { Exercise } from '../../types'
import { shuffle } from '../../lib/answers'
import { Feedback, Prompt, type ExerciseProps } from './shared'

type Match = Extract<Exercise, { type: 'match' }>

export default function MatchPairs({ exercise, onDone }: ExerciseProps<Match>) {
  const left = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ text: p.left, i }))), [exercise])
  const right = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ text: p.right, i }))), [exercise])
  const [selL, setSelL] = useState<number | null>(null)
  const [selR, setSelR] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<[number, number] | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const done = matched.size === exercise.pairs.length

  function tryMatch(l: number | null, r: number | null) {
    if (l === null || r === null) return
    if (l === r) {
      setMatched((m) => new Set(m).add(l))
    } else {
      setMistakes((m) => m + 1)
      setWrong([l, r])
      setTimeout(() => setWrong(null), 500)
    }
    setSelL(null)
    setSelR(null)
  }

  const cls = (i: number, sel: number | null, side: 0 | 1) => {
    if (matched.has(i)) return 'border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60'
    if (wrong && wrong[side] === i) return 'animate-shake border-red-400 bg-red-50'
    if (sel === i) return 'border-orange-500 bg-orange-50'
    return ''
  }

  return (
    <div>
      <Prompt sub="Tap one on the left, then its partner on the right.">{exercise.prompt}</Prompt>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex flex-col gap-2">
          {left.map((x) => (
            <button key={x.i} type="button" disabled={matched.has(x.i)} onClick={() => { setSelL(x.i); tryMatch(x.i, selR) }} className={`chip min-h-12 ${cls(x.i, selL, 0)}`}>
              {x.text}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((x) => (
            <button key={x.i} type="button" disabled={matched.has(x.i)} onClick={() => { setSelR(x.i); tryMatch(selL, x.i) }} className={`chip min-h-12 ${cls(x.i, selR, 1)}`}>
              {x.text}
            </button>
          ))}
        </div>
      </div>
      {done && (
        <Feedback
          state={{ correct: mistakes === 0, extra: mistakes ? `All matched – with ${mistakes} mistake${mistakes > 1 ? 's' : ''}.` : 'All pairs matched, no mistakes!' }}
          explanation={exercise.explanation}
          onContinue={() => onDone(mistakes === 0)}
        />
      )}
    </div>
  )
}
