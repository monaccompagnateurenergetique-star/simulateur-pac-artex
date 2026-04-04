import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { X, Zap, Shield, Users, BarChart3, ArrowRight } from 'lucide-react'

/**
 * ProCtaPopup — Popup d'appel à l'action pour créer un compte pro
 * S'affiche après 5 minutes sur la page OU après 3 simulations
 * Ne s'affiche PAS si l'utilisateur est déjà connecté
 */
export default function ProCtaPopup() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Ne pas afficher si connecté ou déjà fermé
    if (user || dismissed) return

    // Vérifier si déjà fermé dans cette session
    if (sessionStorage.getItem('artex360_cta_dismissed')) return

    // Timer : afficher après 5 minutes
    const timer = setTimeout(() => {
      if (!user && !sessionStorage.getItem('artex360_cta_dismissed')) {
        setShow(true)
      }
    }, 5 * 60 * 1000)

    // Compteur de simulations
    const checkSimCount = () => {
      const count = parseInt(sessionStorage.getItem('artex360_sim_count') || '0')
      if (count >= 3 && !sessionStorage.getItem('artex360_cta_dismissed')) {
        setShow(true)
      }
    }

    // Écouter les changements du compteur
    const interval = setInterval(checkSimCount, 10000)

    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [user, dismissed])

  function handleDismiss() {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem('artex360_cta_dismissed', '1')
  }

  if (!show || user) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={handleDismiss}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-8 text-white text-center relative">
          <button onClick={handleDismiss} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
          <Zap className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
          <h2 className="text-2xl font-bold">Passez à la vitesse supérieure</h2>
          <p className="text-indigo-200 mt-2 text-sm">
            Créez votre espace professionnel gratuit et gérez vos dossiers CEE en toute simplicité
          </p>
        </div>

        {/* Avantages */}
        <div className="px-8 py-6">
          <div className="space-y-3">
            {[
              { icon: BarChart3, text: 'Sauvegardez et retrouvez toutes vos simulations' },
              { icon: Users, text: 'Gérez vos clients et suivez vos projets en temps réel' },
              { icon: Shield, text: 'Espace sécurisé multi-utilisateurs pour votre équipe' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-700">{text}</p>
              </div>
            ))}
          </div>

          <Link to="/login" onClick={handleDismiss}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm">
            Créer mon compte pro gratuitement <ArrowRight className="w-4 h-4" />
          </Link>

          <button onClick={handleDismiss} className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition">
            Continuer sans compte
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Incrémenter le compteur de simulations (à appeler après chaque simulation)
 */
export function incrementSimCount() {
  const count = parseInt(sessionStorage.getItem('artex360_sim_count') || '0')
  sessionStorage.setItem('artex360_sim_count', String(count + 1))
}
