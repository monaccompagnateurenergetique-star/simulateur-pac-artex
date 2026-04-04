import { useState } from 'react'
import { useTeamMembers } from '../../hooks/useTeamMembers'
import { useRole } from '../../contexts/RoleContext'
import { useAuth } from '../../contexts/AuthContext'
import {
  Users, UserPlus, Trash2, Shield, ShieldCheck, AlertCircle, Check, Copy, Eye, EyeOff
} from 'lucide-react'

export default function TeamPage() {
  const { user } = useAuth()
  const { orgId, isInstallerAdmin, isSuperAdmin } = useRole()
  const { members, createMember, removeMember, updateMemberRole } = useTeamMembers()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'member' })
  const [error, setError] = useState('')
  const [createdInfo, setCreatedInfo] = useState(null) // { email, tempPassword }
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const canManage = isInstallerAdmin() || isSuperAdmin()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.firstName.trim()) {
      setError('Le prénom et l\'email sont obligatoires')
      return
    }
    setError('')
    setCreatedInfo(null)
    setLoading(true)

    try {
      const { uid, tempPassword, isExisting } = await createMember({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        memberRole: form.role,
      })
      setCreatedInfo({ email: form.email.trim(), tempPassword, isExisting })
      setForm({ firstName: '', lastName: '', email: '', role: 'member' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (uid, name) => {
    if (!confirm(`Retirer ${name || 'ce membre'} de l'équipe ?`)) return
    try {
      await removeMember(uid)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleRole = async (uid, currentRole) => {
    try {
      await updateMemberRole(uid, currentRole === 'admin' ? 'member' : 'admin')
    } catch (err) {
      setError(err.message)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Mon équipe
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {members.length} membre{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowForm(!showForm); setCreatedInfo(null); setError('') }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un collaborateur
          </button>
        )}
      </div>

      {/* Resultat creation */}
      {createdInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-700">
              {createdInfo.isExisting ? 'Membre ajouté avec succès' : 'Compte créé avec succès'}
            </h3>
          </div>
          {createdInfo.isExisting ? (
            <p className="text-sm text-emerald-600">
              <strong>{createdInfo.email}</strong> avait déjà un compte et a été ajouté à l'équipe. Il peut se connecter avec ses identifiants existants.
            </p>
          ) : (
            <>
              <p className="text-sm text-emerald-600 mb-3">
                Communiquez ces identifiants à <strong>{createdInfo.email}</strong> :
              </p>
              <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Email :</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-800">{createdInfo.email}</code>
                    <button onClick={() => copyToClipboard(createdInfo.email)} className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Mot de passe :</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-800">
                      {showPwd ? createdInfo.tempPassword : '••••••••••••'}
                    </code>
                    <button onClick={() => setShowPwd(!showPwd)} className="p-1 hover:bg-gray-100 rounded">
                      {showPwd ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    <button onClick={() => copyToClipboard(createdInfo.tempPassword)} className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-emerald-500 mt-2">
                L'utilisateur devra changer son mot de passe à la première connexion.
              </p>
            </>
          )}
        </div>
      )}

      {/* Formulaire creation */}
      {showForm && !createdInfo && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 animate-fade-in">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            Nouveau collaborateur
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Jean"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nom</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Dupont"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jean@entreprise.fr"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
              >
                <option value="member">Membre (commercial, secrétaire...)</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Créer le compte
            </button>
          </div>
        </form>
      )}

      {/* Liste des membres */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Membres</h2>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun membre dans l'équipe</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m) => {
              const profile = m.profile
              const fullName = profile
                ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
                : ''
              const initials = fullName
                ? fullName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('').substring(0, 2)
                : (profile?.email?.charAt(0) || '?').toUpperCase()
              const isAdmin = m.role === 'admin'
              const isSelf = m.uid === user?.uid

              return (
                <div key={m.uid} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">{fullName || 'Sans nom'}</span>
                      {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">Vous</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isAdmin ? 'Admin' : 'Membre'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{profile?.email || ''}</p>
                  </div>

                  {canManage && !isSelf && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleRole(m.uid, m.role)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        title={isAdmin ? 'Rétrograder en membre' : 'Promouvoir admin'}
                      >
                        {isAdmin ? (
                          <Shield className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemove(m.uid, fullName)}
                        className="p-2 rounded-lg hover:bg-red-50 transition"
                        title="Retirer de l'équipe"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
