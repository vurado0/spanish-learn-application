import { Link } from 'react-router-dom'
import data from '../content/reference/connectors.json'
import type { Example } from '../types'
import { useData } from '../context/DataContext'
import VariantText from '../components/VariantText'
import AudioButton from '../components/AudioButton'
import EnglishToggle from '../components/EnglishToggle'

interface ConnectorRef {
  word: string
  meaning: string
  group: string
  use: string
  example: Example
  lesson?: string
}

export default function Connectors() {
  const d = data as { intro: string; connectors: ConnectorRef[] }
  const { settings } = useData()
  const groups = [...new Set(d.connectors.map((c) => c.group))]
  return (
    <div className="space-y-5">
      <div>
        <Link to="/reference" className="text-sm text-orange-700">← Reference</Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-stone-900">🔗 Connectors cheat sheet</h1>
          <EnglishToggle />
        </div>
        <p className="mt-1 text-stone-600">{d.intro}</p>
      </div>
      {groups.map((g) => (
        <section key={g}>
          <h2 className="mb-2 text-sm font-bold tracking-widest text-violet-700 uppercase">{g}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {d.connectors.filter((c) => c.group === g).map((c) => (
              <div key={c.word} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-violet-800">{c.word}</span>
                  <AudioButton text={c.word} variant="latam" />
                  <AudioButton text={c.word} variant="spain" />
                  <span className="text-sm text-stone-500">= {c.meaning}</span>
                </div>
                {settings.showEnglish && <p className="mt-1 text-sm text-stone-700">{c.use}</p>}
                <VariantText text={c.example} en={c.example.en} showEn={settings.showEnglish} className="mt-2 text-sm" />
                {c.lesson && <Link to={`/lesson/${c.lesson}`} className="mt-2 inline-block text-xs font-semibold text-orange-700">Learn it in a lesson →</Link>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
