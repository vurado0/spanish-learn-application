import { useEffect, useMemo, useState } from 'react'
import type { Variant, VocabWord } from '../../types'
import { useData } from '../../context/DataContext'
import { acceptedAnswers, displayWord, speakText, wordExample, wordText, words as allWords } from '../../lib/vocab'
import { checkAnswer, shuffle } from '../../lib/answers'
import { speak } from '../../lib/speech'
import type { Rating } from '../../lib/srs'
import AudioButton from '../AudioButton'
import { AccentBar } from '../exercises/FillGap'
import { CheckButton, Feedback, type FeedbackState } from '../exercises/shared'
import GenderWord from './GenderWord'
import WordVisual from './WordVisual'

export type PracticeMode = 'pic2word' | 'word2pic' | 'listen2pic' | 'type' | 'flash'
export const PRACTICE_MODES: PracticeMode[] = ['pic2word', 'word2pic', 'listen2pic', 'type', 'flash']

interface Props {
  word: VocabWord
  mode: PracticeMode
  variant: Variant
  /** called as soon as the learner answers (auto-save) */
  onResult: (correct: boolean, rating?: Rating) => void
  /** move on to the next step */
  onNext: () => void
}

const keyWords = (en: string) => new Set(en.toLowerCase().split(/[^a-z]+/).filter((x) => x.length > 3))
/** "beer" vs "small draught beer" – too close to be a fair distractor */
const overlaps = (a: string, b: string) => {
  const kb = keyWords(b)
  return a === b || [...keyWords(a)].some((x) => kb.has(x))
}

/** 3 distractors: same topic first, never the same picture, Spanish word or a similar meaning */
export function distractors(word: VocabWord, variant: Variant, n = 3): VocabWord[] {
  const ok = (w: VocabWord) =>
    w.id !== word.id &&
    (w.visual === '' || w.visual !== word.visual) &&
    wordText(w, variant) !== wordText(word, variant) &&
    !overlaps(w.english, word.english)
  const same = shuffle(allWords.filter((w) => w.topic === word.topic && ok(w)))
  const rest = shuffle(allWords.filter((w) => w.topic !== word.topic && w.level === word.level && ok(w)))
  return [...same, ...rest].slice(0, n)
}

const PROMPT: Record<PracticeMode, string> = {
  pic2word: 'Which word is it?',
  word2pic: 'Pick the right picture',
  listen2pic: 'Listen and pick the picture',
  type: 'Type the Spanish word',
  flash: 'Do you know it?',
}

export default function Practice({ word, mode, variant, onResult, onNext }: Props) {
  if (mode === 'flash') return <Flashcard word={word} variant={variant} onResult={onResult} onNext={onNext} />
  if (mode === 'type') return <TypeIt word={word} variant={variant} onResult={onResult} onNext={onNext} />
  return <Choose word={word} mode={mode} variant={variant} onResult={onResult} onNext={onNext} />
}

function Choose({ word, mode, variant, onResult, onNext }: Props) {
  const { settings } = useData()
  const options = useMemo(() => shuffle([word, ...distractors(word, variant)]), [word, variant])
  const [picked, setPicked] = useState<string | null>(null)
  const pictures = mode !== 'pic2word'

  useEffect(() => {
    if (mode !== 'listen2pic') return
    const t = setTimeout(() => speak(speakText(word, variant), variant, settings.audioSpeed), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, mode, variant])

  const choose = (w: VocabWord) => {
    if (picked) return
    setPicked(w.id)
    onResult(w.id === word.id)
    // hear the right answer after picking
    if (mode !== 'listen2pic') speak(speakText(word, variant), variant, settings.audioSpeed)
  }

  const fb: FeedbackState | null = picked
    ? { correct: picked === word.id, expected: picked === word.id ? undefined : displayWord(word, variant) }
    : null

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-stone-900">{PROMPT[mode]}</h2>
      <div className="mb-5 flex flex-col items-center gap-2">
        {mode === 'pic2word' && <WordVisual word={word} size="lg" />}
        {mode === 'word2pic' && (
          <div className="flex items-center gap-2">
            <GenderWord word={word} variant={variant} className="text-3xl font-extrabold text-stone-900" />
            <AudioButton text={speakText(word, variant)} variant={variant} size="md" />
          </div>
        )}
        {mode === 'listen2pic' && (
          <button
            type="button"
            onClick={() => speak(speakText(word, variant), variant, settings.audioSpeed)}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-600 text-3xl text-white shadow-lg hover:bg-orange-700 active:scale-95"
            aria-label="Play the word again"
          >
            🔊
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((w) => {
          const state = !picked
            ? 'border-stone-200 bg-white hover:border-orange-300'
            : w.id === word.id
              ? 'border-emerald-500 bg-emerald-50'
              : w.id === picked
                ? 'animate-shake border-red-400 bg-red-50'
                : 'border-stone-200 bg-white opacity-50'
          return (
            <button
              key={w.id}
              type="button"
              disabled={!!picked}
              onClick={() => choose(w)}
              className={`flex min-h-20 items-center justify-center rounded-2xl border-2 p-3 font-bold text-stone-800 shadow-sm transition active:scale-95 ${state}`}
            >
              {pictures ? <WordVisual word={w} size="md" /> : <GenderWord word={w} variant={variant} className="text-lg" />}
            </button>
          )
        })}
      </div>
      {fb && <Feedback state={fb} current={variant} explanation={`${displayWord(word, variant)} = ${word.english}`} onContinue={onNext} />}
    </div>
  )
}

function TypeIt({ word, variant, onResult, onNext }: Omit<Props, 'mode'>) {
  const [value, setValue] = useState('')
  const [fb, setFb] = useState<FeedbackState | null>(null)

  const check = () => {
    if (!value.trim() || fb) return
    const res = checkAnswer(value, { latam: acceptedAnswers(word, 'latam'), spain: acceptedAnswers(word, 'spain') }, variant)
    const state: FeedbackState = { ...res, expected: res.correct && !res.accentWarning ? undefined : res.accentWarning ? res.expected : displayWord(word, variant) }
    setFb(state)
    onResult(res.correct)
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-stone-900">{PROMPT.type}</h2>
      <div className="mb-4 flex flex-col items-center gap-1">
        <WordVisual word={word} size="lg" label={false} />
        <div className="text-sm font-semibold text-stone-500">{word.english}</div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
      >
        <input
          autoFocus
          value={value}
          disabled={!!fb}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe en español…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          lang="es"
          className="input text-center text-lg"
          aria-label="Your answer"
        />
        {!fb && <AccentBar onInsert={(c) => setValue((v) => v + c)} />}
        {!fb && <CheckButton disabled={!value.trim()} onClick={check} />}
      </form>
      {fb && (
        <Feedback
          state={{ ...fb, extra: fb.correct ? undefined : `${displayWord(word, variant)} – ${wordExample(word, variant)}` }}
          current={variant}
          onContinue={onNext}
        />
      )}
    </div>
  )
}

function Flashcard({ word, variant, onResult, onNext }: Omit<Props, 'mode'>) {
  const { settings } = useData()
  const [flipped, setFlipped] = useState(false)

  const flip = () => {
    setFlipped(true)
    speak(speakText(word, variant), variant, settings.audioSpeed)
  }
  const rate = (r: Rating) => {
    onResult(r !== 'again', r)
    onNext()
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-stone-900">{PROMPT.flash}</h2>
      <button
        type="button"
        onClick={() => !flipped && flip()}
        className="animate-pop mx-auto flex min-h-64 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-3xl border-2 border-stone-200 bg-white p-6 text-center shadow-md"
        aria-label={flipped ? undefined : 'Flip the card'}
      >
        <WordVisual word={word} size="lg" label={!flipped} />
        {!flipped ? (
          <>
            <div className="text-lg font-semibold text-stone-600">{word.english}</div>
            <div className="text-sm text-stone-400">Say it out loud, then tap to flip</div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <GenderWord word={word} variant={variant} className="text-2xl font-extrabold text-stone-900" />
              <AudioButton text={speakText(word, variant)} variant={variant} />
            </div>
            <div className="text-sm text-stone-600">{wordExample(word, variant)}</div>
            {settings.showEnglish && <div className="text-xs text-stone-400 italic">{word.exampleEnglish}</div>}
          </>
        )}
      </button>
      {flipped && (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {(
            [
              ['again', 'Again', 'bg-red-500 hover:bg-red-600'],
              ['hard', 'Hard', 'bg-amber-500 hover:bg-amber-600'],
              ['good', 'Good', 'bg-emerald-600 hover:bg-emerald-700'],
              ['easy', 'Easy', 'bg-sky-600 hover:bg-sky-700'],
            ] as [Rating, string, string][]
          ).map(([r, label, cls]) => (
            <button key={r} type="button" onClick={() => rate(r)} className={`rounded-xl py-3 font-bold text-white ${cls}`}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Memory game: match up to 6 picture–word pairs. Reports which words had a mismatch. */
export function MemoryGame({ words, variant, onDone }: { words: VocabWord[]; variant: Variant; onDone: (results: Record<string, boolean>) => void }) {
  const { settings } = useData()
  const cards = useMemo(
    () => shuffle(words.flatMap((w) => [{ key: `p-${w.id}`, id: w.id, kind: 'pic' as const }, { key: `w-${w.id}`, id: w.id, kind: 'word' as const }])),
    [words],
  )
  const [open, setOpen] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [missed, setMissed] = useState<Set<string>>(new Set())
  const [moves, setMoves] = useState(0)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  const done = matched.size === words.length

  const flip = (key: string) => {
    if (open.length === 2 || open.includes(key)) return
    const card = cards.find((c) => c.key === key)!
    if (matched.has(card.id)) return
    if (card.kind === 'word') speak(speakText(byId.get(card.id)!, variant), variant, settings.audioSpeed)
    const next = [...open, key]
    setOpen(next)
    if (next.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = next.map((k) => cards.find((c) => c.key === k)!)
      if (a.id === b.id) {
        setMatched((m) => new Set(m).add(a.id))
        setOpen([])
      } else {
        // a real mistake only if the first card's partner had already been revealed – the learner
        // could have known where it was. The second card of a move is a blind guess.
        const partner = `${a.kind === 'pic' ? 'w' : 'p'}-${a.id}`
        if (seen.has(partner)) setMissed((s) => new Set(s).add(a.id))
        setTimeout(() => setOpen([]), 900)
      }
    }
    setSeen((s) => new Set(s).add(key))
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-stone-900">🧠 Memory: match each picture with its word</h2>
      <p className="mb-4 text-sm text-stone-500">{moves} moves · {matched.size}/{words.length} pairs</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const w = byId.get(c.id)!
          const isOpen = open.includes(c.key) || matched.has(c.id)
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => flip(c.key)}
              className={`flex aspect-square items-center justify-center rounded-2xl border-2 p-1 text-center font-bold transition active:scale-95 ${
                matched.has(c.id)
                  ? 'border-emerald-300 bg-emerald-50'
                  : isOpen
                    ? 'border-orange-400 bg-white'
                    : 'border-orange-200 bg-gradient-to-br from-orange-400 to-rose-500 text-2xl text-white'
              }`}
              aria-label={isOpen ? (c.kind === 'pic' ? w.english : wordText(w, variant)) : 'Hidden card'}
            >
              {!isOpen ? '?' : c.kind === 'pic' ? <WordVisual word={w} size="sm" /> : <GenderWord word={w} variant={variant} className="text-sm leading-tight text-stone-900 sm:text-base" />}
            </button>
          )
        })}
      </div>
      {done && (
        <Feedback
          state={{ correct: missed.size === 0, extra: missed.size ? `All pairs found in ${moves} moves – ${missed.size} word${missed.size > 1 ? 's' : ''} to practise again.` : `Great memory – ${moves} moves!` }}
          onContinue={() => onDone(Object.fromEntries(words.map((w) => [w.id, !missed.has(w.id)])))}
        />
      )}
    </div>
  )
}
