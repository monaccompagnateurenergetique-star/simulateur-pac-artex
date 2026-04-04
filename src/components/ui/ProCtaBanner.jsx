import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Zap, ArrowRight } from 'lucide-react'

/**
 * Bandeau CTA fixe en bas de page pour inciter à créer un compte pro
 * Ne s'affiche PAS si l'utilisateur est connecté
 */
export default function ProCtaBanner() {
  const { user } = useAuth()

  if (user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg border-t border-indigo-500">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-300 shrink-0" />
          <p className="text-sm font-medium">
            <span className="hidden sm:inline">Professionnels de la rénovation — </span>
            Créez votre espace pro pour sauvegarder vos simulations et gérer vos clients
          </p>
        </div>
        <Link to="/login"
          className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-50 transition shrink-0">
          Créer un compte <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
