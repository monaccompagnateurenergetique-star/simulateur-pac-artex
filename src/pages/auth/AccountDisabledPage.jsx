import { ShieldOff, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AccountDisabledPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-red-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Compte désactivé</h1>
          <p className="text-sm text-gray-500">
            Votre compte <span className="font-medium text-gray-700">{user?.email}</span> a été
            désactivé par un administrateur. Si vous pensez qu'il s'agit d'une erreur, veuillez
            contacter le support.
          </p>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
