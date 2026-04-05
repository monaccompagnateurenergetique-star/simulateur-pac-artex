import { AlertTriangle, TrendingUp, Phone, Users } from 'lucide-react'
import { PROSPECT_STATUSES, getActiveStatuses } from '../../utils/rgeApi'

export default function PipelineKPIs({ statusCounts, overdueCount, totalProspects }) {
  const activeStatuses = getActiveStatuses()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* Total prospects */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
          <Users className="w-3.5 h-3.5" /> Pipeline
        </div>
        <p className="text-2xl font-bold text-gray-800">{totalProspects}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">prospects actifs</p>
      </div>

      {/* Funnel mini */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-2">
          <TrendingUp className="w-3.5 h-3.5" /> Funnel
        </div>
        <div className="flex gap-0.5 h-6">
          {activeStatuses.map((s) => {
            const count = statusCounts[s.value] || 0
            const maxCount = Math.max(...Object.values(statusCounts), 1)
            const height = Math.max(count / maxCount * 100, 8)
            return (
              <div key={s.value} className="flex-1 flex flex-col justify-end" title={`${s.label}: ${count}`}>
                <div
                  className="rounded-sm transition-all"
                  style={{ height: `${height}%`, backgroundColor: s.hex }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-0.5 mt-1">
          {activeStatuses.map((s) => (
            <span key={s.value} className="flex-1 text-center text-[8px] text-gray-400 font-medium">
              {statusCounts[s.value] || 0}
            </span>
          ))}
        </div>
      </div>

      {/* Relances en retard */}
      <div className={`rounded-xl border p-4 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase mb-1" style={{ color: overdueCount > 0 ? '#dc2626' : '#9ca3af' }}>
          <AlertTriangle className="w-3.5 h-3.5" /> Relances
        </div>
        <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
          {overdueCount}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">en retard</p>
      </div>

      {/* Gagné / Perdu */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
          Conversion
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold text-indigo-600">{statusCounts.gagne || 0}</span>
          <span className="text-xs text-gray-400">gagné{(statusCounts.gagne || 0) > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-bold text-red-500">{statusCounts.perdu || 0}</span>
          <span className="text-xs text-gray-400">perdu{(statusCounts.perdu || 0) > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
