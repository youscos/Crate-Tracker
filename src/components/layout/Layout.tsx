import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, QrCode, Search, ClipboardList, User } from 'lucide-react'
import OfflineBanner from '@/components/ui/OfflineBanner'
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useRef, useState } from 'react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau' },
  { path: '/scan', icon: QrCode, label: 'Scanner' },
  { path: '/search', icon: Search, label: 'Recherche' },
  { path: '/activity', icon: ClipboardList, label: 'Journal' },
  { path: '/profile', icon: User, label: 'Profil' }
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  // 👇 État pour l'animation : visible ou en train de disparaître
  const [visible, setVisible] = useState(true)
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (prevPath.current === location.pathname) return

    // 1. Fade out rapide (100ms)
    setVisible(false)

    // 2. Après le fade out, fade in sur la nouvelle page
    const timer = setTimeout(() => {
      prevPath.current = location.pathname
      setVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-700/50 sticky top-0 z-40 pt-safe">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">CrateTracker</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 capitalize">{profile?.role}</span>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
        </div>
      </header>

      <OfflineBanner />

      {/* 👇 Contenu avec animation fade + légère remontée */}
      <main className="flex-1 overflow-y-auto pb-safe">
        <div className="max-w-2xl mx-auto">
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0px)' : 'translateY(6px)',
              transition: 'opacity 180ms ease, transform 180ms ease'
            }}
          >
            <Outlet />
          </div>
        </div>
      </main>

      {/* Nav bas */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-700/50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname.startsWith(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200 min-h-[56px] ${
                  active ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {path === '/scan' ? (
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-0.5 transition-all duration-200 ${
                    active ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-slate-700'
                  }`}>
                    <Icon className={`w-6 h-6 ${active ? 'text-slate-900' : 'text-slate-300'}`} />
                  </div>
                ) : (
                  <>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{label}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}