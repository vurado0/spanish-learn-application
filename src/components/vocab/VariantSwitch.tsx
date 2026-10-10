import { useData } from '../../context/DataContext'
import type { Variant } from '../../types'

/** quick 🌎 / 🇪🇸 switch – updates the same setting as the Settings page */
export default function VariantSwitch() {
  const { settings, updateSettings } = useData()
  return (
    <div className="inline-flex rounded-full bg-stone-100 p-1 text-lg" role="group" aria-label="Spanish variant">
      {(['latam', 'spain'] as Variant[]).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={settings.variant === v}
          title={v === 'latam' ? 'Latin American Spanish' : 'Spain (mainland) Spanish'}
          onClick={() => updateSettings({ variant: v })}
          className={`rounded-full px-3 py-1 transition ${settings.variant === v ? 'bg-white shadow' : 'opacity-50 hover:opacity-80'}`}
        >
          {v === 'latam' ? '🌎' : '🇪🇸'}
        </button>
      ))}
    </div>
  )
}
