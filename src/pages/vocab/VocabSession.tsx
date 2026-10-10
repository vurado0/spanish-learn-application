import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { nextNewWords, speakText, wordIndex } from '../../lib/vocab'
import { isDue, mastery, masteryRank, type Rating } from '../../lib/srs'
import { shuffle } from '../../lib/answers'
import { speak } from '../../lib/speech'
import type { VocabProgress, VocabWord } from '../../types'
import ProgressBar from '../../components/ProgressBar'
import WordCard from '../../components/vocab/WordCard'
import WordVisual from '../../components/vocab/WordVisual'
import GenderWord from '../../components/vocab/GenderWord'
import Practice, { MemoryGame, PRACTICE_MODES, type PracticeMode } from '../../components/vocab/Practice'

const BATCH = 5
const MAX_REVIEW_WORDS = 25
const MAX_SESSION_MS = 15 * 60_000
const MAX_GAP_MS = 2 * 60_000

type Step =
  | { kind: 'intro'; word: VocabWord }
  | { kind: 'practice'; word: VocabWord; mode: PracticeMode }
  | { kind: 'memory'; words: VocabWord[] }

const randomMode = (allowed: PracticeMode[], prev?: PracticeMode) => {
  const options = allowed.filter((m) => m !== prev)
  return options[Math.floor(Math.random() * options.length)]
}

/** Learn: intro card → immediate practice for each of 5 words, then a memory round. */
function buildLearn(batch: VocabWord[], extra?: VocabWord): Step[] {
  const steps: Step[] = []
  let prev: PracticeMode | undefined
  for (const word of batch) {
    const mode = randomMode(['pic2word', 'word2pic', 'listen2pic', 'type'], prev)
    prev = mode
    steps.push({ kind: 'intro', word }, { kind: 'practice', word, mode })
  }
  if (batch.length >= 3) steps.push({ kind: 'memory', words: shuffle(extra ? [...batch, extra] : batch) })
  return steps
}

/** Review: random modes, mixed with a memory round of 6 every now and then. */
function buildReview(due: VocabWord[]): Step[] {
  const steps: Step[] = []
  const queue = [...due]
  let prev: PracticeMode | undefined
  let sinceMemory = 0
  while (queue.length) {
    if (queue.length >= 6 && sinceMemory >= 4 && Math.random() < 0.35) {
      steps.push({ kind: 'memory', words: queue.splice(0, 6) })
      sinceMemory = 0
      continue
    }
    const word = queue.shift()!
    const mode = randomMode(PRACTICE_MODES, prev)
    prev = mode
    steps.push({ kind: 'practice', word, mode })
    sinceMemory++
  }
  return steps
}

export default function VocabSession({ mode }: { mode: 'learn' | 'review' }) {
  const [params] = useSearchParams()
  const topic = params.get('topic') ?? undefined
  // key → a fresh session (and a fresh batch) every time "Learn 5 more" is pressed
  const [round, setRound] = useState(0)
  return <Session key={`${mode}-${topic}-${round}`} mode={mode} topic={topic} onAgain={() => setRound((r) => r + 1)} />
}

function Session({ mode, topic, onAgain }: { mode: 'learn' | 'review'; topic?: string; onAgain: () => void }) {
  const { vocab, settings, learnWord, reviewWord, rateWord } = useData()
  const navigate = useNavigate()
  const variant = settings.variant

  // freeze the plan and the "before" snapshot when the session starts
  const [before] = useState<Record<string, VocabProgress>>(() => vocab)
  const steps = useMemo<Step[]>(() => {
    if (mode === 'learn') {
      const batch = nextNewWords(before, BATCH, topic)
      const known = Object.keys(before).map((id) => wordIndex.get(id)).filter((w): w is VocabWord => !!w)
      return buildLearn(batch, known.length ? known[Math.floor(Math.random() * known.length)] : undefined)
    }
    const due = Object.entries(before)
      .filter(([id, v]) => isDue(v) && wordIndex.has(id) && (!topic || wordIndex.get(id)!.topic === topic))
      .sort(([, a], [, b]) => a.dueDate.localeCompare(b.dueDate) || a.box - b.box)
      .slice(0, MAX_REVIEW_WORDS)
      .map(([id]) => wordIndex.get(id)!)
    return buildReview(shuffle(due))
  }, [mode, topic, before])

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({ total: 0, correct: 0 })
  const [practised, setPractised] = useState<Set<string>>(new Set())
  const started = useRef(Date.now())
  const lastTick = useRef(Date.now())
  const [timeUp, setTimeUp] = useState(false)

  const minutes = () => {
    const now = Date.now()
    const m = Math.min(now - lastTick.current, MAX_GAP_MS) / 60_000
    lastTick.current = now
    return m
  }

  const record = (wordId: string, correct: boolean, rating?: Rating) => {
    const m = minutes()
    // the extra, already-known word in a learn memory round only counts towards accuracy
    if (mode === 'learn' && before[wordId]) {
      setAnswers((a) => ({ total: a.total + 1, correct: a.correct + (correct ? 1 : 0) }))
      return
    }
    if (mode === 'learn') learnWord(wordId, correct, m)
    else if (rating) rateWord(wordId, rating, m)
    else reviewWord(wordId, correct, m)
    setAnswers((a) => ({ total: a.total + 1, correct: a.correct + (correct ? 1 : 0) }))
    setPractised((p) => new Set(p).add(wordId))
  }

  const next = () => {
    if (mode === 'review' && Date.now() - started.current > MAX_SESSION_MS) setTimeUp(true)
    setIndex((i) => i + 1)
  }

  const step = steps[index]
  const finished = index >= steps.length || timeUp

  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (step?.kind === 'intro') speak(speakText(step.word, variant), variant, settings.audioSpeed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!steps.length) {
    return (
      <Shell title={mode === 'learn' ? 'Learn new words' : 'Daily review'} progress={0}>
        <div className="py-10 text-center">
          <div className="text-5xl">{mode === 'learn' ? '🔒' : '🌟'}</div>
          <p className="mt-3 font-semibold text-stone-800">
            {mode === 'learn' ? 'No new words available here right now – unlock the next level first.' : 'Nothing due – you are all caught up!'}
          </p>
          <Link to="/vocab" className="btn-primary mt-6">Back to vocabulary</Link>
        </div>
      </Shell>
    )
  }

  if (finished) return <Summary mode={mode} before={before} practised={practised} answers={answers} timeUp={timeUp} onAgain={onAgain} />

  return (
    <Shell title={mode === 'learn' ? 'Learn new words' : 'Daily review'} progress={(index / steps.length) * 100} onClose={() => navigate('/vocab')}>
      {step.kind === 'intro' && (
        <div className="animate-pop">
          <div className="mb-3 text-xs font-bold tracking-widest text-orange-600 uppercase">New word</div>
          <WordCard word={step.word} />
          <button type="button" autoFocus onClick={next} className="btn-primary mt-5 w-full">Got it – practise →</button>
        </div>
      )}
      {step.kind === 'practice' && (
        <Practice key={index} word={step.word} mode={step.mode} variant={variant} onResult={(ok, rating) => record(step.word.id, ok, rating)} onNext={next} />
      )}
      {step.kind === 'memory' && (
        <MemoryGame
          key={index}
          words={step.words}
          variant={variant}
          onDone={(results) => {
            Object.entries(results).forEach(([id, ok]) => record(id, ok))
            next()
          }}
        />
      )}
    </Shell>
  )
}

function Shell({ title, progress, onClose, children }: { title: string; progress: number; onClose?: () => void; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <Link to="/vocab" onClick={onClose} className="text-2xl text-stone-400 hover:text-stone-700" aria-label="Close (progress is saved)">✕</Link>
          <div className="flex-1">
            <div className="mb-1 text-xs font-semibold text-stone-500">{title}</div>
            <ProgressBar value={progress} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-5 pb-48 sm:pb-12">{children}</main>
    </div>
  )
}

function Summary({
  mode,
  before,
  practised,
  answers,
  timeUp,
  onAgain,
}: {
  mode: 'learn' | 'review'
  before: Record<string, VocabProgress>
  practised: Set<string>
  answers: { total: number; correct: number }
  timeUp: boolean
  onAgain: () => void
}) {
  const { vocab, settings } = useData()
  const accuracy = answers.total ? Math.round((answers.correct / answers.total) * 100) : 0
  const levelledUp = [...practised]
    .map((id) => wordIndex.get(id)!)
    .filter((w) => masteryRank(mastery(vocab[w.id])) > masteryRank(mastery(before[w.id])))

  return (
    <Shell title="Session summary" progress={100}>
      <div className="animate-pop text-center">
        <div className="text-5xl">{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🌱'}</div>
        <h1 className="mt-2 text-2xl font-extrabold text-stone-900">{mode === 'learn' ? '¡Palabras nuevas!' : '¡Repaso terminado!'}</h1>
        {timeUp && <p className="text-sm text-stone-500">15 minutes are up – great work, the rest can wait for tomorrow.</p>}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-orange-50 p-3">
          <div className="text-2xl font-extrabold text-orange-700">{practised.size}</div>
          <div className="text-xs font-semibold text-orange-800">words practised</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3">
          <div className="text-2xl font-extrabold text-emerald-700">{accuracy}%</div>
          <div className="text-xs font-semibold text-emerald-800">accuracy</div>
        </div>
        <div className="rounded-2xl bg-violet-50 p-3">
          <div className="text-2xl font-extrabold text-violet-700">{levelledUp.length}</div>
          <div className="text-xs font-semibold text-violet-800">levelled up</div>
        </div>
      </div>
      {levelledUp.length > 0 && (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="mb-2 text-sm font-bold text-stone-500">⬆️ Levelled up</div>
          <div className="flex flex-wrap gap-2">
            {levelledUp.map((w) => (
              <span key={w.id} className="flex items-center gap-1 rounded-full bg-stone-100 py-1 pr-3 pl-1 text-sm">
                <WordVisual word={w} size="sm" label={false} />
                <GenderWord word={w} variant={settings.variant} className="font-semibold" />
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {mode === 'learn' && <button type="button" onClick={onAgain} className="btn-primary flex-1">Learn 5 more</button>}
        <Link to="/vocab" className="btn-secondary flex-1">Back to vocabulary</Link>
      </div>
    </Shell>
  )
}
