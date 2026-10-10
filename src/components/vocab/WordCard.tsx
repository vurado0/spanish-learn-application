import { useData } from '../../context/DataContext'
import { differs, speakText, wordExample } from '../../lib/vocab'
import type { Variant, VocabWord } from '../../types'
import AudioButton, { FLAG } from '../AudioButton'
import GenderWord from './GenderWord'
import MasteryDots from './MasteryDots'
import WordVisual from './WordVisual'

interface Props {
  word: VocabWord
  /** defaults to the user's setting */
  variant?: Variant
  /** compact grid tile (browse) vs full card (introduction / lesson) */
  compact?: boolean
  showExample?: boolean
  onClick?: () => void
}

export default function WordCard({ word, variant, compact = false, showExample = !compact, onClick }: Props) {
  const { settings, vocab } = useData()
  const v = variant ?? settings.variant
  const other: Variant = v === 'spain' ? 'latam' : 'spain'
  const showOther = settings.showOtherVariant && differs(word)
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`flex w-full rounded-2xl border border-stone-200 bg-white text-left shadow-sm ${
        compact ? 'items-center gap-3 p-3 hover:border-orange-300' : 'flex-col items-center gap-3 p-5 text-center'
      }`}
    >
      <WordVisual word={word} size={compact ? 'sm' : 'lg'} />
      <div className={`min-w-0 ${compact ? 'flex-1' : 'w-full'}`}>
        <div className={`flex items-center gap-2 ${compact ? '' : 'justify-center'}`}>
          <GenderWord word={word} variant={v} className={`${compact ? 'text-base' : 'text-2xl'} font-extrabold text-stone-900`} />
          <AudioButton text={speakText(word, v)} variant={v} />
        </div>
        {showOther && (
          <div className={`mt-0.5 flex items-center gap-1.5 text-sm text-stone-500 ${compact ? '' : 'justify-center'}`}>
            <span>{FLAG[other]}</span>
            <GenderWord word={word} variant={other} />
            <AudioButton text={speakText(word, other)} variant={other} />
          </div>
        )}
        <div className={`text-sm text-stone-500 ${compact ? 'truncate' : ''}`}>{word.english}</div>
        {showExample && (
          <div className="mt-3 rounded-xl bg-stone-50 p-3 text-left">
            <div className="flex items-start gap-2">
              <span className="font-medium text-stone-800">{wordExample(word, v)}</span>
              <AudioButton text={wordExample(word, v)} variant={v} />
            </div>
            {settings.showEnglish && <div className="mt-0.5 text-sm text-stone-500 italic">{word.exampleEnglish}</div>}
            {word.note && settings.showEnglish && <div className="mt-1 text-xs text-stone-500">ℹ️ {word.note}</div>}
          </div>
        )}
        <div className={`mt-1.5 ${compact ? '' : 'flex justify-center'}`}>
          <MasteryDots progress={vocab[word.id]} showLabel={!compact} />
        </div>
      </div>
    </Tag>
  )
}
