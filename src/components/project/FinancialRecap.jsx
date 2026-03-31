/**
 * Tableau récapitulatif financier d'un scénario
 * Affiche : par geste CEE + MPR + Coût + RAC, puis totaux + PTZ + RAC final
 */
export default function FinancialRecap({ scenario, totals }) {
  if (!scenario || !totals) return null

  const sims = scenario.simulations || []
  const hasSims = sims.length > 0
  const hasPtz = !!scenario.ptz

  if (!hasSims && !hasPtz) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        Ajoutez des simulations pour voir le récapitulatif financier.
      </div>
    )
  }

  const fmt = (v) => v ? Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '—'

  return (
    <div className="space-y-4">
      {/* Tableau détaillé */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-500 uppercase">Geste</th>
              <th className="text-right py-2 px-2 text-xs font-bold text-green-600 uppercase">CEE</th>
              <th className="text-right py-2 px-2 text-xs font-bold text-blue-600 uppercase">MPR</th>
              <th className="text-right py-2 px-2 text-xs font-bold text-gray-500 uppercase">Coût TTC</th>
              <th className="text-right py-2 pl-2 text-xs font-bold text-orange-600 uppercase">RAC</th>
            </tr>
          </thead>
          <tbody>
            {sims.map((sim) => {
              const r = sim.results || {}
              const inp = sim.inputs || {}
              const cee = r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
              const mpr = r.mprFinal || r.mprAmount || r.primeAmount || 0
              const cost = r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
              const rac = Math.max(0, cost - cee - mpr)
              return (
                <tr key={sim.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-gray-800">{sim.title || sim.type || 'Simulation'}</span>
                    {sim.type && <span className="ml-1.5 text-xs text-gray-400">{sim.type}</span>}
                  </td>
                  <td className="text-right py-2.5 px-2 text-green-700 font-medium">{fmt(cee)} €</td>
                  <td className="text-right py-2.5 px-2 text-blue-700 font-medium">{fmt(mpr)} €</td>
                  <td className="text-right py-2.5 px-2 text-gray-700 font-medium">{fmt(cost)} €</td>
                  <td className="text-right py-2.5 pl-2 text-orange-600 font-medium">{cost > 0 ? `${fmt(rac)} €` : '—'}</td>
                </tr>
              )
            })}

            {/* Séparateur total */}
            <tr className="border-t-2 border-gray-300">
              <td className="py-3 pr-4 font-bold text-gray-800">Total Aides</td>
              <td className="text-right py-3 px-2 text-green-700 font-bold">{fmt(totals.totalCee)} €</td>
              <td className="text-right py-3 px-2 text-blue-700 font-bold">{fmt(totals.totalMpr)} €</td>
              <td className="text-right py-3 px-2 text-gray-400">—</td>
              <td className="text-right py-3 pl-2 text-gray-400">—</td>
            </tr>

            {/* PTZ */}
            {hasPtz && (
              <tr className="border-b border-gray-100">
                <td className="py-2.5 pr-4">
                  <span className="font-semibold text-indigo-700">Prêt à Taux Zéro (PTZ)</span>
                  <span className="ml-2 text-xs text-gray-400">{scenario.ptz.dureeTotale} ans</span>
                </td>
                <td className="text-right py-2.5 px-2 text-gray-400">—</td>
                <td className="text-right py-2.5 px-2 text-gray-400">—</td>
                <td className="text-right py-2.5 px-2 text-indigo-700 font-bold">{fmt(totals.ptzMontant)} €</td>
                <td className="text-right py-2.5 pl-2 text-gray-400">—</td>
              </tr>
            )}

            {/* Coût total */}
            <tr className="border-b border-gray-200 bg-gray-50">
              <td className="py-3 pr-4 font-bold text-gray-800">Coût total travaux</td>
              <td className="text-right py-3 px-2 text-gray-400">—</td>
              <td className="text-right py-3 px-2 text-gray-400">—</td>
              <td className="text-right py-3 px-2 font-black text-gray-800 text-base">{fmt(totals.totalCost)} €</td>
              <td className="text-right py-3 pl-2 text-gray-400">—</td>
            </tr>

            {/* Reste à charge final */}
            <tr className="bg-orange-50">
              <td className="py-4 pr-4 font-black text-orange-800 text-base">Reste à charge</td>
              <td className="text-right py-4 px-2 text-gray-400">—</td>
              <td className="text-right py-4 px-2 text-gray-400">—</td>
              <td className="text-right py-4 px-2 text-gray-400">—</td>
              <td className="text-right py-4 pl-2 font-black text-orange-700 text-lg">{fmt(totals.resteACharge)} €</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Barre visuelle du financement */}
      {totals.totalCost > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Répartition du financement</p>
          <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
            {totals.totalCee > 0 && (
              <div
                className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${Math.min(100, (totals.totalCee / totals.totalCost) * 100)}%` }}
                title={`CEE : ${fmt(totals.totalCee)} €`}
              >
                {((totals.totalCee / totals.totalCost) * 100) >= 10 && 'CEE'}
              </div>
            )}
            {totals.totalMpr > 0 && (
              <div
                className="bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${Math.min(100, (totals.totalMpr / totals.totalCost) * 100)}%` }}
                title={`MPR : ${fmt(totals.totalMpr)} €`}
              >
                {((totals.totalMpr / totals.totalCost) * 100) >= 10 && 'MPR'}
              </div>
            )}
            {totals.ptzMontant > 0 && (
              <div
                className="bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${Math.min(100, (totals.ptzMontant / totals.totalCost) * 100)}%` }}
                title={`PTZ : ${fmt(totals.ptzMontant)} €`}
              >
                {((totals.ptzMontant / totals.totalCost) * 100) >= 10 && 'PTZ'}
              </div>
            )}
            {totals.resteACharge > 0 && (
              <div
                className="bg-orange-400 flex items-center justify-center text-[10px] font-bold text-white flex-1"
                title={`RAC : ${fmt(totals.resteACharge)} €`}
              >
                RAC
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {totals.totalCee > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                CEE : {fmt(totals.totalCee)} € ({Math.round((totals.totalCee / totals.totalCost) * 100)}%)
              </span>
            )}
            {totals.totalMpr > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                MPR : {fmt(totals.totalMpr)} € ({Math.round((totals.totalMpr / totals.totalCost) * 100)}%)
              </span>
            )}
            {totals.ptzMontant > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                PTZ : {fmt(totals.ptzMontant)} € ({Math.round((totals.ptzMontant / totals.totalCost) * 100)}%)
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              RAC : {fmt(totals.resteACharge)} € ({Math.round((totals.resteACharge / totals.totalCost) * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
