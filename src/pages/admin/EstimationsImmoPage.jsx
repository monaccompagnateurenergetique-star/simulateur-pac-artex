import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEstimationsImmo } from '../../hooks/useEstimationsImmo'
import { useAgencesImmo } from '../../hooks/useAgencesImmo'
import { ESTIMATION_STATUSES } from '../../lib/constants/prixTravaux'
import { generateEstimationImmoPdf } from '../../lib/estimationImmoPdf'
import {
  FileText, Plus, Search, Filter, Trash2, Copy, Download,
  Building2, MapPin, ArrowRight
} from 'lucide-react'

const DPE_COLORS = {
  A: 'bg-green-600', B: 'bg-lime-500', C: 'bg-yellow-400 text-gray-900',
  D: 'bg-amber-400 text-gray-900', E: 'bg-orange-500', F: 'bg-red-500', G: 'bg-red-700',
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount || 0)

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'

function StatusBadge({ status }) {
  const s = ESTIMATION_STATUSES.find((st) => st.value === status) || ESTIMATION_STATUSES[0]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function DpeBadge({ letter }) {
  if (!letter) return <span className="text-gray-400 text-xs">—</span>
  const c = DPE_COLORS[letter] || 'bg-gray-200 text-gray-700'
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold text-white ${c}`}>
      {letter}
    </span>
  )
}

export default function EstimationsImmoPage() {
  const navigate = useNavigate()
  const { estimations, deleteEstimation, duplicateEstimation } = useEstimationsImmo()
  const { agences } = useAgencesImmo()

  const [search, setSearch] = useState('')
  const [agenceFilter, setAgenceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // --- Filtered list ---
  const filtered = useMemo(() => {
    let list = estimations
    if (agenceFilter) list = list.filter((e) => e.agenceId === agenceFilter)
    if (statusFilter) list = list.filter((e) => e.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          (e.addressLabel || '').toLowerCase().includes(q) ||
          (e.dossier || '').toLowerCase().includes(q) ||
          (e.ville || '').toLowerCase().includes(q) ||
          (e.agenceNom || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [estimations, agenceFilter, statusFilter, search])

  // --- Stats ---
  const totalTravaux = estimations
    .filter((e) => e.status === 'en_cours')
    .reduce((sum, e) => sum + (e.totalTravauxTTC || 0), 0)

  const uniqueAgences = new Set(estimations.map((e) => e.agenceId).filter(Boolean))

  // --- Actions ---
  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette estimation ? Cette action est irréversible.')) {
      deleteEstimation(id)
    }
  }

  const handleDuplicate = (id) => {
    const copy = duplicateEstimation(id)
    if (copy) navigate(`/admin/estimations-immo/${copy.id}`)
  }

  const handleExportPdf = (est) => {
    generateEstimationImmoPdf(est)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimations immobilières</h1>
          <p className="text-sm text-gray-500 mt-1">
            {estimations.length} estimation{estimations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/estimations-immo/nouveau')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle estimation
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total estimations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{estimations.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Travaux en cours</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalTravaux)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Agences</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueAgences.size}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm"
            placeholder="Rechercher par adresse, dossier, ville..."
          />
        </div>
        <select
          value={agenceFilter}
          onChange={(e) => setAgenceFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Toutes les agences</option>
          {agences.map((a) => (
            <option key={a.id} value={a.id}>{a.nom}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Tous les statuts</option>
          {ESTIMATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucune estimation trouvée</p>
          <p className="text-gray-400 text-sm mt-1">
            {estimations.length === 0
              ? 'Créez votre première estimation pour commencer.'
              : 'Essayez de modifier vos filtres.'}
          </p>
          {estimations.length === 0 && (
            <button
              onClick={() => navigate('/admin/estimations-immo/nouveau')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Créer une estimation
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Adresse</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Agence</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">DPE</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Total travaux</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((est) => (
                  <tr
                    key={est.id}
                    className="hover:bg-gray-50/60 transition cursor-pointer"
                    onClick={() => navigate(`/admin/estimations-immo/${est.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[220px]">
                            {est.addressLabel || 'Adresse non renseignée'}
                          </p>
                          {est.dossier && (
                            <p className="text-xs text-gray-400 truncate">{est.dossier}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[120px]">{est.agenceNom || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <DpeBadge letter={est.dpeActuel} />
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <DpeBadge letter={est.dpeVise} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(est.totalTravauxTTC)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={est.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(est.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/admin/estimations-immo/${est.id}`)}
                          title="Voir / Modifier"
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(est.id)}
                          title="Dupliquer"
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPdf(est)}
                          title="Exporter PDF"
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(est.id)}
                          title="Supprimer"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
