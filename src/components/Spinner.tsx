export default function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-stone-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
