import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, X, Home, Calculator, History, Newspaper, Settings, BookOpen,
  Users, Thermometer, UserPlus, ChevronDown, Wrench, LogIn, LogOut, Cloud, CloudOff
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const toolsRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const mainLinks = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/leads', label: 'Leads', icon: UserPlus },
    { to: '/projets', label: 'Projets', icon: Users },
    { to: '/simulations', label: 'Simulations', icon: Calculator },
  ]

  const toolLinks = [
    { to: '/boite-a-outils', label: 'Boîte à outils', icon: BookOpen },
    { to: '/prospection-dpe', label: 'Prospection DPE', icon: Thermometer },
    { to: '/actualites', label: 'Actualités', icon: Newspaper },
    { to: '/historique', label: 'Historique', icon: History },
    { to: '/parametrage', label: 'Paramétrage', icon: Settings },
  ]

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  const isToolActive = toolLinks.some((l) => isActive(l.to))

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    function handleClick(e) {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) setToolsOpen(false)
    }
    if (toolsOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [toolsOpen])

  return (
    <header className="bg-[#121212] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="https://artex360.fr/static/img/logo_artex.png"
              alt="Artex360"
              className="h-8 object-contain"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x32/84cc16/121212?text=Artex360' }}
            />
            <span className="hidden lg:block text-xs text-gray-500 font-medium">Pilotage & Simulation CEE</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {mainLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-lime-500/20 text-lime-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            {/* Outils dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isToolActive || toolsOpen
                    ? 'bg-lime-500/20 text-lime-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Wrench className="w-4 h-4" />
                Outils
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>
              {toolsOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1a1a] rounded-xl border border-gray-700 shadow-xl py-1 animate-fade-in z-50">
                  {toolLinks.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setToolsOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all ${
                        isActive(to)
                          ? 'text-lime-400 bg-lime-500/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <NotificationBell />

            {/* Sync indicator */}
            {user ? (
              <button
                onClick={() => { signOut(); navigate('/') }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-white/10 transition"
                title={"Connecté : " + user.email}
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden lg:inline">Sync</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <CloudOff className="w-4 h-4" />
                <span className="hidden lg:inline">Hors-ligne</span>
              </Link>
            )}
          </nav>

          {/* Mobile: bell + burger */}
          <div className="md:hidden flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 space-y-1 animate-fade-in">
            {mainLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-lime-500/20 text-lime-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <div className="border-t border-gray-700 mt-2 pt-2">
              <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wide font-bold">Outils</p>
              {toolLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(to)
                      ? 'bg-lime-500/20 text-lime-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-700 mt-2 pt-2">
              {user ? (
                <button
                  onClick={() => { signOut(); setMobileOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-emerald-400 hover:bg-white/10 transition"
                >
                  <Cloud className="w-5 h-5" />
                  Sync actif — Déconnexion
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
                >
                  <LogIn className="w-5 h-5" />
                  Connexion (sync cloud)
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
