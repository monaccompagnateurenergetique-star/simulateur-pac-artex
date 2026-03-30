/**
 * Tableau récapitulatif financier d'un scénario
 * Affiche : par geste CEE + MPR + Coût, puis totaux + PTZ + RAC
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

  const fmt = (v) => v ? Number(v).toLocaleString('fr-FR') : '—'

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 pr-4 text-xs font-bold text-gray-500 uppercase">Geste</th>
            <th className="text-right py-2 px-2 text-xs font-bold text-gray-500 uppercase">CEE</th>
            <th className="text-right py-2 px-2 text-xs font-bold text-gray-500 uppercase">MPR</th>
            <th className="text-right py-2 pl-2 text-xs font-bold text-gray-500 uppercase">Coût TTC</th>
          </tr>
        </thead>
        <tbody>
          {sims.map((sim) => {
            const r = sim.results || {}
            const cee = r.ceeCommerciale || r.ceeEuros || 0
            const mpr = r.mprFinal || r.primeAmount || 0
            const cost = r.projectCost || r.totalCost || 0
            return (
              <tr key={sim.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  <span className="font-semibold text-gray-800">{sim.title || sim.type || 'Simulation'}</span>
                  {sim.type && <span className="ml-1.5 text-xs text-gray-400">{sim.type}</span>}
                </td>
                <td className="text-right py-2 px-2 text-green-700 font-medium">{fmt(cee)} €</td>
                <td className="text-right py-2 px-2 text-blue-700 font-medium">{fmt(mpr)} €</td>
                <td className="text-right py-2 pl-2 text-gray-700 font-medium">{fmt(cost)} €</td>
              </tr>
            )
          })}

          {/* Ligne totaux */}
          <tr className="border-t-2 border-gray-300 font-bold">
            <td className="py-3 pr-4 text-gray-800">Total Aides</td>
            <td className="text-right py-3 px-2 text-green-700">{fmt(totals.totalCee)} €</td>
            <td className="text-right py-3 px-2 text-blue-700">{fmt(totals.totalMpr)} €</td>
            <td className="text-right py-3 pl-2 text-gray-400">—</td>
          </tr>

          {/* PTZ */}
          {hasPtz && (
            <tr className="border-b border-gray-100">
              <td className="py-2 pr-4 font-semibold text-indigo-700">Prêt à Taux Zéro (PTZ)</td>
              <td className="text-right py-2 px-2 text-gray-400">—</td>
              <td className="text-right py-2 px-2 text-gray-400">—</td>
              <td className="text-right py-2 pl-2 text-indigo-700 font-bold">{fmt(totals.ptzMontant)} €</td>
            </tr>
          )}

          {/* Coût total */}
          <tr className="border-b border-gray-100">
            <td className="py-2 pr-4 font-semibold text-gray-800">Coût total travaux</td>
            <td className="text-right py-2 px-2 text-gray-400">—</td>
            <td className="text-right py-2 px-2 text-gray-400">—</td>
            <td className="text-right py-2 pl-2 font-bold text-gray-800">{fmt(totals.totalCost)} €</td>
          </tr>

          {/* Reste à charge */}
          <tr className="bg-orange-50 rounded-lg">
            <td className="py-3 pr-4 font-bold text-orange-800">Reste à charge</td>
            <td className="text-right py-3 px-2 text-gray-400">—</td>
            <td className="text-right py-3 px-2 text-gray-400">—</td>
            <td className="text-right py-3 pl-2 font-black text-orange-700 text-base">{fmt(totals.resteACharge)} €</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
