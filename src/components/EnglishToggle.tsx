import { useData } from '../context/DataContext'

/** "Show English" switch shown on every explanation; persisted in settings. */
export default function EnglishToggle() {
  const { settings, updateSettings } = useData()
  return (
    <button
      type="button"
      onClick={() => updateSettings({ showEnglish: !settings.showEnglish })}
      className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
      aria-pressed={settings.showEnglish}
    >
      <span className={`relative h-4 w-7 rounded-full transition ${settings.showEnglish ? 'bg-orange-500' : 'bg-stone-300'}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${settings.showEnglish ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      Show English
    </button>
  )
}
