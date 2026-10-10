import { useEffect, useState, type ReactNode } from 'react'
import type { Connector, Dialogue, Grammar, Pronunciation, Variant } from '../../types'
import { wordIndex } from '../../lib/vocab'
import WordCard from '../vocab/WordCard'
import { pick } from '../../lib/answers'
import { speakSequence } from '../../lib/speech'
import { useData } from '../../context/DataContext'
import AudioButton, { FLAG } from '../AudioButton'
import VariantText from '../VariantText'
import VariantToggle from '../VariantToggle'
import EnglishToggle from '../EnglishToggle'
import ConjugationTable from '../ConjugationTable'
import CompareBox from '../CompareBox'
import Card from '../Card'

export function SectionTitle({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <div className="text-xs font-bold tracking-widest text-orange-600 uppercase">{kicker}</div>
        <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">{title}</h2>
      </div>
      {right}
    </div>
  )
}

export function DialogueSection({
  dialogue,
  variant,
  onVariant,
  setting,
}: {
  dialogue: Dialogue
  variant: Variant
  onVariant: (v: Variant) => void
  setting: Variant
}) {
  const { settings } = useData()
  const [playing, setPlaying] = useState(-1)
  const [stop, setStop] = useState<null | (() => void)>(null)
  const speakers = [...new Set(dialogue.lines.map((l) => l.speaker))]
  const hasDifferences = dialogue.lines.some((l) => l.spain && l.spain !== l.latam)

  useEffect(() => () => stop?.(), [stop])

  const playAll = () => {
    if (playing >= 0) {
      stop?.()
      setStop(null)
      return
    }
    const cancel = speakSequence(
      dialogue.lines.map((l) => ({ text: pick(l, variant), variant })),
      settings.audioSpeed,
      setPlaying,
    )
    setStop(() => cancel)
  }

  return (
    <div>
      <SectionTitle kicker="1 · Dialogue" title={dialogue.title} />
      <p className="mb-3 text-sm text-stone-600">📍 {dialogue.setting}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Alcalá/Madrid scenes start in the Spain version; the other one is a toggle */}
        <VariantToggle value={variant} onChange={(v) => { stop?.(); onVariant(v) }} />
        {setting === 'spain' && variant !== 'spain' && (
          <button type="button" onClick={() => { stop?.(); onVariant('spain') }} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200">
            🇪🇸 Set in Alcalá – hear it as people say it here
          </button>
        )}
        {!hasDifferences && <span className="text-xs text-stone-500">Same words in both – listen to the accents!</span>}
      </div>
      <button type="button" onClick={playAll} className="btn-secondary mb-4 py-2">
        {playing >= 0 ? '⏹ Stop' : '▶️ Play whole dialogue'}
      </button>
      <div className="space-y-2">
        {dialogue.lines.map((l, i) => {
          const right = speakers.indexOf(l.speaker) % 2 === 1
          const text = pick(l, variant)
          const differs = l.spain && l.spain !== l.latam
          return (
            <div key={i} className={`flex ${right ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 transition ${right ? 'rounded-br-sm bg-orange-100' : 'rounded-bl-sm bg-white shadow-sm'} ${
                  playing === i ? 'ring-2 ring-orange-400' : ''
                }`}
              >
                <div className="text-xs font-bold text-stone-500">{l.speaker}</div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-stone-900">
                    {text}
                    {differs && <span className="ml-1 align-super text-[10px]" title="Different in the other variant">{variant === 'spain' ? '🇪🇸' : '🌎'}</span>}
                  </span>
                  <AudioButton text={text} variant={variant} />
                </div>
                {differs && settings.showOtherVariant && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
                    <span>{FLAG[variant === 'spain' ? 'latam' : 'spain']}</span>
                    <span>{pick(l, variant === 'spain' ? 'latam' : 'spain')}</span>
                    <AudioButton text={pick(l, variant === 'spain' ? 'latam' : 'spain')} variant={variant === 'spain' ? 'latam' : 'spain'} />
                  </div>
                )}
                {settings.showEnglish && <div className="mt-0.5 text-sm text-stone-500 italic">{l.en}</div>}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4"><EnglishToggle /></div>
    </div>
  )
}

export function VocabSection({ vocab, variant }: { vocab: string[]; variant: Variant }) {
  const list = vocab.map((id) => wordIndex.get(id)).filter((w) => !!w)
  return (
    <div>
      <SectionTitle kicker="2 · New words" title={`${list.length} words for this conversation`} right={<EnglishToggle />} />
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((w) => <WordCard key={w.id} word={w} variant={variant} />)}
      </div>
    </div>
  )
}

export function GrammarSection({ grammar, pronunciation, first }: { grammar: Grammar; pronunciation?: Pronunciation; first: Variant }) {
  const { settings } = useData()
  const explanation = settings.showEnglish || !grammar.explanationEs ? grammar.explanation : grammar.explanationEs
  return (
    <div className="space-y-4">
      <SectionTitle kicker="3 · Mini grammar" title={grammar.title} right={<EnglishToggle />} />
      <Card>
        <p className="leading-relaxed whitespace-pre-line text-stone-800">{explanation}</p>
      </Card>
      {grammar.tables && (
        <div className="grid gap-3 sm:grid-cols-2">
          {grammar.tables.map((t) => <ConjugationTable key={t.verb} table={t} />)}
        </div>
      )}
      <Card>
        <div className="mb-2 text-sm font-bold text-stone-500">Examples</div>
        <div className="space-y-3">
          {grammar.examples.map((e, i) => <VariantText key={i} text={e} variant={first} en={e.en} showEn={settings.showEnglish} />)}
        </div>
      </Card>
      {grammar.compare && <CompareBox box={grammar.compare} showEn={settings.showEnglish} />}
      {grammar.tip && settings.showEnglish && <div className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900">💡 {grammar.tip}</div>}
      {pronunciation && <PronunciationBox p={pronunciation} />}
    </div>
  )
}

export function PronunciationBox({ p }: { p: Pronunciation }) {
  const { settings } = useData()
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <div className="font-bold text-violet-900">🗣️ {p.title}</div>
      {settings.showEnglish && <p className="mt-1 text-sm text-violet-900">{p.explanation}</p>}
      <div className="mt-3 space-y-2">
        {p.words.map((w) => (
          <div key={w.text} className="rounded-xl bg-white p-3">
            <div className="text-lg font-bold text-stone-900">{w.text}</div>
            <div className="mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
              <div className="flex items-center gap-2"><AudioButton text={w.text} variant="latam" /> <span className="text-stone-600">{w.latamNote}</span></div>
              <div className="flex items-center gap-2"><AudioButton text={w.text} variant="spain" /> <span className="text-stone-600">{w.spainNote}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConnectorSection({ connector, first }: { connector: Connector; first: Variant }) {
  const { settings } = useData()
  return (
    <div className="space-y-4">
      <SectionTitle kicker="4 · Connector" title="Keep the conversation going" right={<EnglishToggle />} />
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-5 text-white shadow">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold">{connector.word}</span>
          <AudioButton text={connector.word} variant={first} />
        </div>
        <div className="mt-1 text-orange-50">= {connector.meaning}</div>
      </div>
      {settings.showEnglish && (
        <Card><p className="leading-relaxed text-stone-800">{connector.explanation}</p></Card>
      )}
      <Card>
        <div className="space-y-3">
          {connector.examples.map((e, i) => <VariantText key={i} text={e} variant={first} en={e.en} showEn={settings.showEnglish} />)}
        </div>
      </Card>
    </div>
  )
}
