import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Phone, Building2, Save, CheckCircle, LogOut, Shield } from 'lucide-react'

export default function ProfilPage() {
  const { user, userProfile, updateUserProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        company: userProfile.company || '',
      })
    }
  }, [userProfile])

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Non connecté</h2>
        <p className="text-gray-500 mb-6">Connectez-vous pour accéder à votre profil</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Se connecter
        </button>
      </div>
    )
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUserProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = [form.firstName, form.lastName]
    .map((n) => n?.charAt(0)?.toUpperCase() || '')
    .join('')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* En-tête profil */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {initials || <User className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {form.firstName || form.lastName
                ? `${form.firstName} ${form.lastName}`.trim()
                : 'Mon profil'}
            </h1>
            <p className="text-indigo-200 text-sm flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
            {form.company && (
              <p className="text-indigo-200 text-sm flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {form.company}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          Informations personnelles
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Prénom</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm"
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              {user.email}
              <span className="ml-auto text-xs text-gray-400">(non modifiable)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm"
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Entreprise</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm"
                placeholder="Nom de votre entreprise"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition text-sm"
            >
              {saving ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Enregistré !' : 'Enregistrer'}
            </button>

            {saved && (
              <span className="text-sm text-emerald-600 font-medium animate-fade-in">
                Profil mis à jour
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Section compte */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500" />
          Compte
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 font-medium">Membre depuis</p>
            <p className="text-xs text-gray-400">
              {userProfile?.createdAt
                ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}
