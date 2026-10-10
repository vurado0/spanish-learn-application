import { Link } from 'react-router-dom'
import data from '../content/reference/tenses.json'
import type { CompareBox as CompareBoxT, Example } from '../types'
import { useData } from '../context/DataContext'
import VariantText from '../components/VariantText'
import CompareBox from '../components/CompareBox'
import EnglishToggle from '../components/EnglishToggle'
import Card from '../components/Card'

interface Tense {
  id: string
  name: string
  nameEs: string
  unit: string
  when: string[]
  formation: string
  examples: Example[]
  spainNote?: string
}

export default function Tenses() {
  const d = data as { intro: string; tenses: Tense[]; pastCompare: CompareBoxT; timeline: string }
  const { settings } = useData()
  return (
    <div className="space-y-5">
      <div>
        <Link to="/reference" className="text-sm text-orange-700">← Reference</Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-stone-900">⏳ Tense overview</h1>
          <EnglishToggle />
        </div>
        <p className="mt-1 text-stone-600">{d.intro}</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {d.tenses.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800 hover:bg-sky-100">{t.nameEs}</a>
        ))}
      </nav>
      {d.tenses.map((t) => (
        <Card key={t.id}>
          <div id={t.id} className="scroll-mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-extrabold text-stone-900">{t.nameEs} <span className="text-base font-semibold text-stone-500">· {t.name}</span></h2>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">{t.unit}</span>
            </div>
            <div className="mt-2 text-sm font-bold text-stone-500">Use it for</div>
            <ul className="ml-5 list-disc text-stone-800">
              {t.when.map((w) => <li key={w}>{w}</li>)}
            </ul>
            <div className="mt-2 rounded-lg bg-stone-100 p-2 font-mono text-sm text-stone-700">{t.formation}</div>
            <div className="mt-3 space-y-3">
              {t.examples.map((e, i) => <VariantText key={i} text={e} en={e.en} showEn={settings.showEnglish} />)}
            </div>
            {t.spainNote && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">🇪🇸 {t.spainNote}</p>}
          </div>
        </Card>
      ))}
      <CompareBox box={d.pastCompare} showEn={settings.showEnglish} />
      <Card><p className="text-sm whitespace-pre-line text-stone-700">{d.timeline}</p></Card>
    </div>
  )
}
