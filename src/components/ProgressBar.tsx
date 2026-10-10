export default function ProgressBar({ value, className = '', color = 'bg-orange-500' }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-stone-200 ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
