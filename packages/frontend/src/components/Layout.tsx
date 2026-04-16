import { Outlet, NavLink } from 'react-router-dom'
import { useStore } from '../store'

const nav = [
  { to: '/library',   label: 'ספרייה',   icon: '🖼️',  desc: 'מדיה' },
  { to: '/studio',    label: 'סטודיו',   icon: '🎬',  desc: 'סקריפט' },
  { to: '/capcut',    label: 'CapCut',   icon: '✂️',  desc: 'עריכה' },
  { to: '/publisher', label: 'פרסום',    icon: '📤',  desc: 'תזמון' },
  { to: '/analytics', label: 'אנליטיקס', icon: '📊',  desc: 'נתונים' },
]

export default function Layout() {
  const selectedCount = useStore((s) => s.selectedMedia.length)
  const hasScript = useStore((s) => !!s.currentScript)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💪</span>
            <div>
              <div className="font-bold text-white leading-none">ActiveWear IL</div>
              <div className="text-xs text-gray-500">לוח בקרה לתוכן</div>
            </div>
          </div>

          <nav className="flex gap-1 flex-wrap justify-end">
            {nav.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <span>{icon}</span>
                <span className="hidden sm:inline font-medium">{label}</span>
                {to === '/studio' && selectedCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-pink-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {selectedCount}
                  </span>
                )}
                {to === '/capcut' && hasScript && (
                  <span className="absolute -top-1 -left-1 bg-green-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    ✓
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800 py-3 text-center text-xs text-gray-600">
        ActiveWear IL Dashboard · Pipeline: ספרייה → סטודיו → CapCut → פרסום
      </footer>
    </div>
  )
}
