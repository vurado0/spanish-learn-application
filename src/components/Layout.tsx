import { NavLink, Outlet } from 'react-router-dom'
import { useData, displayStreak } from '../context/DataContext'
import { useReminder } from '../lib/reminder'

const NAV = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/course', label: 'Course', icon: '🗺️' },
  { to: '/vocab', label: 'Vocab', icon: '📚' },
  { to: '/reference', label: 'Reference', icon: '🧭' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Layout() {
  const { stats } = useData()
  useReminder(stats.lastActiveDate)
  const streak = displayStreak(stats)

  return (
    <div className="min-h-dvh bg-stone-50 pb-20 sm:pb-0">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-extrabold text-orange-700">
            <img src="/favicon.svg" alt="" className="h-7 w-7" /> Charla
          </NavLink>
          <nav className="hidden gap-1 sm:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-orange-100 text-orange-800' : 'text-stone-600 hover:bg-stone-100'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700" title="Day streak">
            🔥 {streak}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-orange-700' : 'text-stone-500'}`
              }
            >
              <span className="text-xl leading-none">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
