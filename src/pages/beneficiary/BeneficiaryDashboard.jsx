import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useBeneficiaryData } from '../../hooks/useBeneficiaryData'
import { DOC_REQUEST_STATUSES } from '../../hooks/useDocumentRequests'
import { PROJECT_STATUSES } from '../../hooks/useProjects'
import {
  Home, FileText, Clock, CheckCircle, AlertCircle, LogOut,
  Zap, Euro, TrendingDown, Layers, User, MapPin, Thermometer
} from 'lucide-react'

function formatEuro(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
}

export default function BeneficiaryDashboard() {
  const { user, userProfile, logout } = useAuth()
  const { scenarios, projectInfo, docRequests, pendingDocs, completedDocs, loading } = useBeneficiaryData()

  const firstName = userProfile?.firstName || user?.email?.split('@')[0] || ''
  const statusMeta = projectInfo?.status
    ? PROJECT_STATUSES.find((s) => s.value === projectInfo.status) || null
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
        <p className="ml-3 text-sm text-gray-500">Chargement de votre dossier...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bonjour {firstName} !</h1>
          <p className="text-sm text-gray-500 mt-1">Votre espace de suivi de dossier</p>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      {/* Message si aucun scenario */}
      {scenarios.length === 0 && docRequests.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-700">Bienvenue dans votre espace</h2>
          <p className="text-sm text-gray-500 mt-2">
            Votre installateur préparera vos scénarios de travaux et vos demandes de documents ici.
          </p>
        </div>
      )}

      {/* Infos projet + statut */}
      {projectInfo && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <User className="w-4 h-4 text-indigo-500" /> Mon dossier
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Nom</span>
                  <p className="font-medium text-gray-800">
                    {projectInfo.firstName} {projectInfo.lastName}
                  </p>
                </div>
                {projectInfo.phone && (
                  <div>
                    <span className="text-gray-400 text-xs">Téléphone</span>
                    <p className="font-medium text-gray-800">{projectInfo.phone}</p>
                  </div>
                )}
                {(projectInfo.address || projectInfo.city) && (
                  <div className="col-span-2">
                    <span className="text-gray-400 text-xs">Adresse</span>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {[projectInfo.address, projectInfo.postalCode, projectInfo.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {projectInfo.category && (
                  <div>
                    <span className="text-gray-400 text-xs">Précarité</span>
                    <p className="font-medium text-gray-800">{projectInfo.categoryLabel || projectInfo.category}</p>
                  </div>
                )}
                {projectInfo.dpe && (
                  <div>
                    <span className="text-gray-400 text-xs">DPE</span>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> {typeof projectInfo.dpe === 'object' ? (projectInfo.dpe.etiquette || projectInfo.dpe.classe || 'Disponible') : projectInfo.dpe}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Statut */}
            {statusMeta && (
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Statut</span>
                <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusMeta.color}`}>
                  <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                  {statusMeta.label}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
          <Layers className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-indigo-700">{scenarios.length}</p>
          <p className="text-[10px] text-indigo-500 font-semibold">Scénario{scenarios.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
          <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-amber-700">{pendingDocs.length}</p>
          <p className="text-[10px] text-amber-500 font-semibold">Docs en attente</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
          <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-emerald-700">{completedDocs.length}</p>
          <p className="text-[10px] text-emerald-500 font-semibold">Docs fournis</p>
        </div>
      </div>

      {/* Scenarios */}
      {scenarios.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Mes scénarios de travaux
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {scenarios.map((sc) => {
              const totals = sc.totals || {}
              return (
                <Link key={sc.id} to={`/s/${sc.token || sc.id}`}
                  className="block px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-800">
                        {sc.scenarioName || 'Scénario de rénovation'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(sc.simulations || []).length} travaux — {new Date(sc.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0 text-right">
                      <div>
                        <p className="text-xs text-gray-400">Aides</p>
                        <p className="text-sm font-bold text-lime-600">{formatEuro((totals.totalCee || 0) + (totals.totalMpr || 0))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Reste</p>
                        <p className="text-sm font-bold text-gray-800">{formatEuro(totals.resteACharge)}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Documents demandes */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" />
            Documents demandés ({docRequests.length})
          </h2>
        </div>

        {docRequests.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun document demandé</p>
            <p className="text-sm text-gray-400 mt-1">Votre installateur vous demandera les documents nécessaires</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {docRequests.map((req) => {
              const statusMeta = DOC_REQUEST_STATUSES.find((s) => s.value === req.status) || DOC_REQUEST_STATUSES[0]
              return (
                <div key={req.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800">{req.label}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${statusMeta.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                      </div>
                      {req.message && <p className="text-xs text-gray-400 mt-1">{req.message}</p>}
                      <p className="text-[10px] text-gray-300 mt-1">
                        Demandé le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {req.status === 'en_attente' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" /> À fournir
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Aide */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Besoin d'aide ?</h2>
        <p className="text-sm text-gray-500">
          Contactez votre installateur ou créez un ticket pour toute question.
        </p>
        <Link to="/tickets/nouveau"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
          Contacter le support
        </Link>
      </div>
    </div>
  )
}
