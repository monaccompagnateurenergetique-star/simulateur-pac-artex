import { useParams, Link, useNavigate } from 'react-router-dom'
import { Building2, ArrowLeft, Plus, Edit, Trash2, MapPin, Phone, Mail, FileText, Calendar } from 'lucide-react'
import { useAgencies } from '../../hooks/useAgencies'
import { useEstimations } from '../../hooks/useEstimations'

export default function AgencyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { agencies, deleteAgency } = useAgencies()
  const { estimations, loading: loadingEst, deleteEstimation } = useEstimations(id)

  const agency = agencies.find((a) => a.id === id)

  if (!agency) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Agence non trouvée</p>
        <Link to="/admin/agences" className="text-indigo-400 hover:underline mt-2 inline-block">
          Retour aux agences
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!confirm(`Supprimer l'agence "${agency.name}" et toutes ses estimations ?`)) return
    await deleteAgency(id)
    navigate('/admin/agences')
  }

  async function handleDeleteEstimation(estId) {
    if (!confirm('Supprimer cette estimation ?')) return
    await deleteEstimation(estId)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/admin/agences"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Toutes les agences
      </Link>

      {/* Agency header */}
      <div className="bg-white/5 border border-gray-700 rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agency.name}</h1>
              {agency.contact && <p className="text-gray-400">{agency.contact}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/agences/${id}/modifier`}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl text-sm text-gray-300 transition-all"
            >
              <Edit className="w-3.5 h-3.5" />
              Modifier
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-400">
          {(agency.address || agency.city) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-500" />
              {[agency.address, agency.postalCode, agency.city].filter(Boolean).join(', ')}
            </div>
          )}
          {agency.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-gray-500" />
              {agency.phone}
            </div>
          )}
          {agency.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-500" />
              {agency.email}
            </div>
          )}
        </div>
      </div>

      {/* Estimations */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">
          Estimations ({estimations.length})
        </h2>
        <Link
          to={`/admin/agences/${id}/estimation/nouvelle`}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouvelle estimation
        </Link>
      </div>

      {loadingEst ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : estimations.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-gray-700 rounded-2xl">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Aucune estimation pour cette agence</p>
          <Link
            to={`/admin/agences/${id}/estimation/nouvelle`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Créer une estimation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {estimations.map((est) => (
            <div
              key={est.id}
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl p-4 transition-all"
            >
              <Link
                to={`/admin/agences/${id}/estimation/${est.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${est.status === 'brouillon' ? 'bg-amber-500' : est.status === 'envoye' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="text-white font-medium truncate">
                      {est.address ? `${est.address}, ${est.city || ''}` : 'Sans adresse'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                      {est.typeLogement && <span>{est.typeLogement}</span>}
                      {est.surface && <span>{est.surface} m²</span>}
                      {est.classInitiale && est.classeCible && <span>DPE {est.classInitiale} → {est.classeCible}</span>}
                      {est.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(est.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleDeleteEstimation(est.id)}
                className="ml-3 p-2 text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
