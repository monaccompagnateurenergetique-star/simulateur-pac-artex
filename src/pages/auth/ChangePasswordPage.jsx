import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { changePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = password.length >= 8 && password === confirm

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setError('')
    setLoading(true)
    try {
      await changePassword(password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Changement de mot de passe</h1>
            <p className="text-sm text-gray-500 mt-1">
              Vous devez définir un nouveau mot de passe avant de continuer
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-[10px] text-red-400 mt-1">Minimum 8 caractères</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Confirmer le mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Retapez votre mot de passe"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="text-[10px] text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Valider mon nouveau mot de passe
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
