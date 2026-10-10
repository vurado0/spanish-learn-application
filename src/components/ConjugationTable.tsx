import type { ConjugationTable as T } from '../types'
import AudioButton from './AudioButton'

export default function ConjugationTable({ table }: { table: T }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200">
      <div className="bg-stone-100 px-3 py-2 text-sm">
        <span className="font-bold text-stone-900">{table.verb}</span> <span className="text-stone-500">– {table.meaning}</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.person} className={`border-t border-stone-100 ${r.spainOnly ? 'bg-amber-50' : ''}`}>
              <td className="w-1/2 px-3 py-1.5 text-stone-500">
                {r.person}
                {r.spainOnly && <span className="ml-1 rounded bg-amber-200 px-1 text-[10px] font-bold text-amber-900">🇪🇸 only</span>}
              </td>
              <td className="px-3 py-1.5 font-semibold text-stone-900">
                <span className="mr-2">{r.form}</span>
                <AudioButton text={r.form} variant={r.spainOnly ? 'spain' : 'latam'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
