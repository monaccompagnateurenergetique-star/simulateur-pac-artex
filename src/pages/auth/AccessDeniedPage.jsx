import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AccessDeniedPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-800">Accès refusé</h1>
      <p className="text-sm text-gray-500 mt-2">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
      >
        Retour au tableau de bord
      </Link>
    </div>
  )
}
