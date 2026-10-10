import type { Variant } from '../types'

export default function VariantToggle({ value, onChange }: { value: Variant; onChange: (v: Variant) => void }) {
  return (
    <div className="inline-flex rounded-full bg-stone-100 p-1 text-sm font-medium" role="group" aria-label="Spanish variant">
      {(['latam', 'spain'] as Variant[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-full px-3 py-1.5 transition ${value === v ? 'bg-white text-stone-900 shadow' : 'text-stone-500 hover:text-stone-800'}`}
        >
          {v === 'latam' ? '🌎 Latin America' : '🇪🇸 Spain version'}
        </button>
      ))}
    </div>
  )
}
