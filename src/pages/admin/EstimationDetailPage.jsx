import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, Home, Calendar, Hammer, FileText } from 'lucide-react'
import { useAgencies } from '../../hooks/useAgencies'
import { useEstimations } from '../../hooks/useEstimations'
import SyntheseStep from '../../components/estimation/SyntheseStep'
import { getDpeColor } from '../../utils/dpeApi'

export default function EstimationDetailPage() {
  const { agId, estId } = useParams()
  const { agencies } = useAgencies()
  const { estimations } = useEstimations(agId)

  const agency = agencies.find((a) => a.id === agId)
  const estimation = estimations.find((e) => e.id === estId)

  if (!estimation) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Estimation non trouvée</p>
        <Link to={`/admin/agences/${agId}`} className="text-indigo-600 hover:underline mt-2 inline-block">
          Retour à l'agence
        </Link>
      </div>
    )
  }

  const dpeColor = getDpeColor(estimation.classInitiale)
  const dpeColorCible = getDpeColor(estimation.classeCible)

  const statusLabels = {
    brouillon: { label: 'Brouillon', color: 'bg-amber-100 text-amber-700' },
    envoye: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700' },
    valide: { label: 'Validé', color: 'bg-emerald-100 text-emerald-700' },
  }
  const status = statusLabels[estimation.status] || statusLabels.brouillon

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to={`/admin/agences/${agId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {agency?.name || 'Retour'}
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Estimation rénovation énergétique</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {agency?.name}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</p>
            <p className="text-gray-900 text-sm font-medium">
              {estimation.address || '—'}
            </p>
            <p className="text-gray-500 text-xs">{estimation.postalCode} {estimation.city}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Home className="w-3 h-3" /> Logement</p>
            <p className="text-gray-900 text-sm font-medium">{estimation.typeLogement}</p>
            <p className="text-gray-500 text-xs">{estimation.surface} m²</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">DPE</p>
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                style={{ backgroundColor: dpeColor.bg, color: dpeColor.text }}
              >
                {estimation.classInitiale}
              </span>
              <span className="text-gray-500">→</span>
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                style={{ backgroundColor: dpeColorCible.bg, color: dpeColorCible.text }}
              >
                {estimation.classeCible}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Créé le</p>
            <p className="text-gray-900 text-sm font-medium">
              {estimation.createdAt ? new Date(estimation.createdAt).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
        </div>

        {/* Travaux */}
        {estimation.travaux?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Hammer className="w-3 h-3" /> Postes de travaux
            </p>
            <div className="flex flex-wrap gap-2">
              {estimation.travaux.map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                  {t.label} — {(t.prixHT || 0).toLocaleString('fr-FR')} € HT
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Synthèse financière */}
      <SyntheseStep data={estimation} />
    </div>
  )
}
