import { Link } from 'react-router-dom'

const PAGES = [
  { to: '/reference/latam-vs-spain', emoji: '🌎🇪🇸', title: 'Latin America vs Spain', desc: 'Vocabulary, grammar and pronunciation differences side by side.', cls: 'bg-emerald-50 hover:bg-emerald-100' },
  { to: '/reference/tenses', emoji: '⏳', title: 'Tense overview', desc: 'When to use each tense – with examples in both variants.', cls: 'bg-sky-50 hover:bg-sky-100' },
  { to: '/reference/connectors', emoji: '🔗', title: 'Connectors cheat sheet', desc: 'pero, porque, entonces, o sea… the glue of real conversations.', cls: 'bg-violet-50 hover:bg-violet-100' },
]

export default function Reference() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-stone-900">Reference</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {PAGES.map((p) => (
          <Link key={p.to} to={p.to} className={`rounded-2xl p-5 transition ${p.cls}`}>
            <div className="text-3xl">{p.emoji}</div>
            <div className="mt-2 font-extrabold text-stone-900">{p.title}</div>
            <div className="text-sm text-stone-600">{p.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
