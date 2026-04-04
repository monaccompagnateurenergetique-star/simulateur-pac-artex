import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSharedScenarioView } from '../../hooks/useSharedScenario'
import { useAuth } from '../../contexts/AuthContext'
import { auth as firebaseAuth, db as firebaseDb } from '../../lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import {
  FileText, Zap, Euro, Home, TrendingDown, AlertCircle, Eye, UserPlus, LogIn, Check
} from 'lucide-react'

function formatEuro(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
}

export default function SharedScenarioPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, loading, error } = useSharedScenarioView(token)
  const [showSignup, setShowSignup] = useState(false)
  const [signupForm, setSignupForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-lime-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">{error || 'Scénario introuvable'}</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Ce lien est peut-être expiré ou invalide.
        </p>
      </div>
    )
  }

  const totals = data.totals || {}
  const simulations = data.simulations || []
  const client = data.clientInfo || {}

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-lime-50 to-emerald-50 rounded-2xl p-6 border border-lime-200 mb-6">
        <div className="flex items-center gap-2 text-xs text-lime-600 font-semibold mb-2">
          <Eye className="w-3.5 h-3.5" />
          Scénario partagé
        </div>
        <h1 className="text-xl font-bold text-gray-800">
          {data.scenarioName || 'Scénario de rénovation'}
        </h1>
        {data.projectName && (
          <p className="text-sm text-gray-500 mt-1">Projet : {data.projectName}</p>
        )}
        {(client.firstName || client.lastName) && (
          <p className="text-sm text-gray-400 mt-0.5">
            Pour : {[client.firstName, client.lastName].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Euro className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{formatEuro(totals.totalCost)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Coût total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Zap className="w-5 h-5 text-lime-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-lime-600">{formatEuro(totals.totalCee)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Prime CEE</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Home className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-600">{formatEuro(totals.totalMpr)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">MaPrimeRénov'</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <TrendingDown className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-indigo-600">{formatEuro(totals.resteACharge)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Reste à charge</p>
        </div>
      </div>

      {/* Liste des travaux */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Travaux prévus ({simulations.length})
          </h2>
        </div>

        {simulations.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun travail dans ce scénario</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {simulations.map((sim, idx) => {
              const r = sim.results || {}
              const inp = sim.inputs || {}
              return (
                <div key={sim.id || idx} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-800">
                        {sim.title || sim.type || `Travail ${idx + 1}`}
                      </h3>
                      {(inp.projectCost || inp.projectCostTTC || r.projectCost) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Coût : {formatEuro(r.projectCost || inp.projectCost || inp.projectCostTTC)}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {(r.ceeCommerciale || r.ceeFinal || r.ceeEuros) && (
                        <p className="text-xs font-semibold text-lime-600">
                          CEE : {formatEuro(r.ceeCommerciale || r.ceeFinal || r.ceeEuros)}
                        </p>
                      )}
                      {(r.mprFinal || r.mprAmount || r.primeAmount) && (
                        <p className="text-xs font-semibold text-blue-600">
                          MPR : {formatEuro(r.mprFinal || r.mprAmount || r.primeAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* PTZ */}
      {totals.ptzMontant > 0 && (
        <div className="mt-4 bg-indigo-50 rounded-xl border border-indigo-200 p-4 text-center">
          <p className="text-xs text-indigo-500 font-semibold uppercase">Éco-PTZ éligible</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">{formatEuro(totals.ptzMontant)}</p>
        </div>
      )}

      {/* CTA Espace bénéficiaire */}
      {user ? (
        <div className="mt-8 bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center">
          <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-gray-800">Vous êtes connecté</h3>
          <a href="/beneficiaire"
            className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition">
            Accéder à mon espace
          </a>
        </div>
      ) : showSignup ? (
        <div className="mt-8 bg-white rounded-2xl border border-indigo-200 p-6 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-500" />
            Créer votre espace suivi
          </h3>
          <p className="text-sm text-gray-500 mb-4">Inscription gratuite — accès immédiat à votre dossier</p>

          {signupError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{signupError}
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!signupForm.email || !signupForm.password) { setSignupError('Email et mot de passe obligatoires'); return }
            if (signupForm.password.length < 6) { setSignupError('Mot de passe : 6 caractères minimum'); return }
            setSignupError('')
            setSignupLoading(true)
            try {
              const cred = await createUserWithEmailAndPassword(firebaseAuth, signupForm.email, signupForm.password)
              const uid = cred.user.uid
              const firstName = signupForm.firstName || data.clientInfo?.firstName || ''
              const lastName = signupForm.lastName || data.clientInfo?.lastName || ''

              // 1. Profil utilisateur
              await setDoc(doc(firebaseDb, 'users', uid, 'profile', 'info'), {
                email: signupForm.email,
                firstName, lastName,
                createdAt: new Date().toISOString(),
              })

              // 2. Role beneficiaire auto-active
              await setDoc(doc(firebaseDb, 'roles', uid), {
                role: 'beneficiary',
                orgId: data.orgId || null,
                status: 'active',
                projectId: data.projectId || null,
                scenarioToken: token,
                createdAt: new Date().toISOString(),
              })

              // 3. Lier le beneficiaire au scenario partage (seule source de verite)
              await setDoc(doc(firebaseDb, 'shared_scenarios', token), {
                beneficiaryUid: uid,
                beneficiaryName: `${firstName} ${lastName}`.trim(),
                beneficiaryEmail: signupForm.email,
              }, { merge: true })

              // 5. Index email
              const hashData = new TextEncoder().encode(signupForm.email.toLowerCase().trim())
              const hashBuf = await crypto.subtle.digest('SHA-256', hashData)
              const emailHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
              await setDoc(doc(firebaseDb, 'email_to_uid', emailHash), {
                uid, email: signupForm.email.toLowerCase(),
              }).catch(() => {})

              // Sauver en session pour que le dashboard le retrouve immediatement
              try {
                sessionStorage.setItem('artex360_scenarioToken', token)
                sessionStorage.setItem('artex360_projectId', data.projectId || '')
              } catch { /* ignore */ }

              navigate('/beneficiaire')
            } catch (err) {
              if (err.code === 'auth/email-already-in-use') {
                setSignupError('Cet email a déjà un compte. Connectez-vous plutôt.')
              } else {
                setSignupError(err.message)
              }
            } finally { setSignupLoading(false) }
          }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom</label>
                <input type="text" value={signupForm.firstName}
                  onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                  placeholder={data.clientInfo?.firstName || ''}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom</label>
                <input type="text" value={signupForm.lastName}
                  onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                  placeholder={data.clientInfo?.lastName || ''}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
              <input type="email" required value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                placeholder={data.clientInfo?.email || 'votre@email.fr'}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mot de passe *</label>
              <input type="password" required value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                placeholder="6 caractères minimum"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
            </div>
            <button type="submit" disabled={signupLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition">
              {signupLoading
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : <><UserPlus className="w-4 h-4" /> Créer mon espace</>
              }
            </button>
          </form>
          <p className="text-center mt-3">
            <a href="/login" className="text-sm text-indigo-500 hover:underline">Déjà un compte ? Se connecter</a>
          </p>
        </div>
      ) : (
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6 text-center">
          <UserPlus className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">Suivez votre dossier en ligne</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Créez votre espace gratuit pour suivre l'avancement et déposer vos documents.
          </p>
          <button onClick={() => setShowSignup(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition">
            <UserPlus className="w-4 h-4" /> Créer mon espace
          </button>
          <p className="mt-3">
            <a href="/login" className="text-sm text-indigo-500 hover:underline">Déjà un compte ? Se connecter</a>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-400">
        <p>Ce scénario est fourni à titre indicatif et non contractuel.</p>
        <p className="mt-1">Généré par Artex360 — {new Date(data.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  )
}
