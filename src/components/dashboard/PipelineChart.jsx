/**
 * Barres horizontales représentant le pipeline leads ou projets
 */
export default function PipelineChart({ title, statuses, counts, total }) {
  if (total === 0) {
    return (
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>
        <p className="text-xs text-gray-400">Aucune donnée</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {statuses.map((s) => {
          const count = counts[s.value] || 0
          const pct = total > 0 ? (count / total) * 100 : 0
          if (count === 0) return null
          return (
            <div key={s.value} className="flex items-center gap-3">
              <div className="w-28 text-xs text-gray-600 font-medium truncate flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0`} />
                {s.label}
              </div>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.dot} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
