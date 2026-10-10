import type { CompareBox as T } from '../types'
import AudioButton from './AudioButton'

export default function CompareBox({ box, showEn = true }: { box: T; showEn?: boolean }) {
  const col = (side: 'latam' | 'spain') => (
    <div className={`flex-1 rounded-xl p-3 ${side === 'latam' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
      <div className="mb-2 text-sm font-bold">{side === 'latam' ? '🌎 Latin America' : '🇪🇸 Spain'}</div>
      <ul className="space-y-2">
        {box[side].map((item, i) => (
          <li key={i} className="text-sm">
            {item.label && <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{item.label}</div>}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900">{item.text}</span>
              <AudioButton text={item.text} variant={side} />
            </div>
            {item.en && showEn && <div className="text-xs text-stone-500 italic">{item.en}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
  return (
    <div className="rounded-2xl border border-stone-200 p-3">
      <div className="mb-2 font-semibold text-stone-800">⚖️ {box.title}</div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {col('latam')}
        {col('spain')}
      </div>
      {box.note && showEn && <p className="mt-2 text-sm text-stone-600">{box.note}</p>}
    </div>
  )
}
