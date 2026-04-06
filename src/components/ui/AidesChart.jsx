const fmt = (v) => v ? Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '0'

/**
 * Barre fine de répartition aides vs reste à charge
 */
export default function AidesChart({ aideAmount = 0, aideLabel = 'Aides', resteACharge = 0, totalTTC = 0 }) {
  if (totalTTC <= 0 || aideAmount <= 0) return null

  const aidePct = Math.round((aideAmount / totalTTC) * 100)
  const racPct = 100 - aidePct

  return (
    <div className="space-y-1.5">
      {/* Barre */}
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: `${aidePct}%` }}
          title={`${aideLabel} : ${fmt(aideAmount)} € (${aidePct}%)`}
        />
        <div
          className="bg-indigo-400 transition-all duration-500"
          style={{ width: `${racPct}%` }}
          title={`Reste à charge : ${fmt(resteACharge)} € (${racPct}%)`}
        />
      </div>

      {/* Légende */}
      <div className="flex justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {aideLabel} — {fmt(aideAmount)} € ({aidePct}%)
        </span>
        <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
          Reste — {fmt(resteACharge)} € ({racPct}%)
        </span>
      </div>
    </div>
  )
}
