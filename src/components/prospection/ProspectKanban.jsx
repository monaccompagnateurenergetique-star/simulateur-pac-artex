import { PROSPECT_STATUSES } from '../../utils/rgeApi'
import ProspectCard from './ProspectCard'

export default function ProspectKanban({ prospects, onProspectClick }) {
  // Grouper les prospects par statut
  const columns = PROSPECT_STATUSES.map((s) => ({
    ...s,
    prospects: prospects
      .filter((p) => p.status === s.value)
      .sort((a, b) => {
        // Priorité haute en premier, puis par date de mise à jour
        const prioOrder = { haute: 0, moyenne: 1, basse: 2 }
        const aPrio = prioOrder[a.priority] ?? 2
        const bPrio = prioOrder[b.priority] ?? 2
        if (aPrio !== bPrio) return aPrio - bPrio
        return (b.updatedAt || '').localeCompare(a.updatedAt || '')
      }),
  }))

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
      {columns.map((col) => (
        <div key={col.value} className="flex-shrink-0 w-64">
          {/* En-tete colonne */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.hex }} />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{col.label}</h3>
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto">
              {col.prospects.length}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2 min-h-[120px] bg-gray-50/50 rounded-xl p-2 border border-gray-100">
            {col.prospects.length === 0 ? (
              <p className="text-[10px] text-gray-300 text-center py-8 italic">Aucun prospect</p>
            ) : (
              col.prospects.map((prospect) => (
                <ProspectCard
                  key={prospect.siret}
                  prospect={prospect}
                  onClick={() => onProspectClick(prospect)}
                  compact
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
