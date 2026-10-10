import data from '../content/reference/latam-vs-spain.json'
import type { CompareBox as CompareBoxT, Pronunciation } from '../types'
import { useData } from '../context/DataContext'
import AudioButton from '../components/AudioButton'
import CompareBox from '../components/CompareBox'
import EnglishToggle from '../components/EnglishToggle'
import { PronunciationBox } from '../components/lesson/LessonSections'
import Card from '../components/Card'
import { Link } from 'react-router-dom'

interface CompareData {
  intro: string
  vocabulary: { category: string; items: { en: string; latam: string; spain: string }[] }[]
  grammar: CompareBoxT[]
  pronunciation: Pronunciation[]
  usage: { title: string; text: string }[]
}

export default function Compare() {
  const d = data as CompareData
  const { settings } = useData()
  return (
    <div className="space-y-6">
      <div>
        <Link to="/reference" className="text-sm text-orange-700">← Reference</Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-stone-900">🌎 Latin America vs 🇪🇸 Spain</h1>
          <EnglishToggle />
        </div>
        <p className="mt-1 text-stone-600">{d.intro}</p>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-extrabold text-stone-900">Vocabulary</h2>
        <div className="space-y-4">
          {d.vocabulary.map((cat) => (
            <Card key={cat.category} className="p-0 sm:p-0">
              <div className="border-b border-stone-100 px-4 py-2 font-bold text-stone-700">{cat.category}</div>
              <div className="divide-y divide-stone-100">
                <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-bold text-stone-400 uppercase">
                  <span>English</span><span>🌎 Latin America</span><span>🇪🇸 Spain</span>
                </div>
                {cat.items.map((it) => (
                  <div key={it.en} className="grid grid-cols-3 items-center gap-2 px-4 py-2 text-sm">
                    <span className="text-stone-500">{it.en}</span>
                    <span className="flex flex-wrap items-center gap-1 font-semibold text-stone-900">{it.latam} <AudioButton text={it.latam} variant="latam" /></span>
                    <span className="flex flex-wrap items-center gap-1 font-semibold text-stone-900">{it.spain} <AudioButton text={it.spain} variant="spain" /></span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-stone-900">Grammar</h2>
        {d.grammar.map((g) => <CompareBox key={g.title} box={g} showEn={settings.showEnglish} />)}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-stone-900">Pronunciation</h2>
        {d.pronunciation.map((p) => <PronunciationBox key={p.title} p={p} />)}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-stone-900">Usage notes</h2>
        {d.usage.map((u) => (
          <Card key={u.title}>
            <div className="font-bold text-stone-900">{u.title}</div>
            <p className="mt-1 text-sm whitespace-pre-line text-stone-700">{u.text}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
