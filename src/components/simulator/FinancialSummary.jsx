import { Award, TrendingUp } from 'lucide-react'
import AlertBox from '../ui/AlertBox'
import { formatCurrency, formatPercent } from '../../utils/formatters'

export default function FinancialSummary({
  ceeCommerciale,
  mprFinal,
  totalAid,
  resteACharge,
  ceeEurosBase,
  ceeMargin,
  ceeMarginPercent,
  isCeilingExceeded,
  maxAidPercentage,
  showMpr = true,
}) {
  return (
    <div className="space-y-4">
      {/* Ceiling Alert */}
      <AlertBox
        type="error"
        title="ATTENTION : Plafond d'Aide Dépassé !"
        show={isCeilingExceeded}
      >
        L'aide totale ({formatPercent(maxAidPercentage)} du Coût Éligible) est dépassée.
        La prime MaPrimeRénov' est réduite à {formatCurrency(mprFinal)} pour respecter le plafond total.
      </AlertBox>

      {/* Results Box */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-600" />
          Synthèse Financière & Reste à Charge
        </h2>

        <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-xl animate-result">
          <div className={`grid ${showMpr ? 'grid-cols-2 divide-x divide-indigo-700' : ''} text-center`}>
            <div>
              <p className="text-indigo-300 text-sm uppercase tracking-wider mb-1">CEE Déduite (Devis)</p>
              <p className="font-extrabold text-2xl text-yellow-300">{formatCurrency(ceeCommerciale)}</p>
            </div>
            {showMpr && (
              <div>
                <p className="text-indigo-300 text-sm uppercase tracking-wider mb-1">MPR (Montant Final)</p>
                <p className="font-extrabold text-2xl text-green-400">{formatCurrency(mprFinal)}</p>
              </div>
            )}
          </div>

          <hr className="border-indigo-700 my-4" />

          <div className="flex justify-between items-center text-xl pt-2">
            <span className="font-bold text-white">TOTAL AIDES DÉDUITES :</span>
            <span className="font-extrabold text-3xl text-yellow-300">{formatCurrency(totalAid)}</span>
          </div>

          <div className="flex justify-between items-center text-lg pt-4 mt-2">
            <span className="font-bold text-indigo-200">RESTE À CHARGE CLIENT :</span>
            <span className="font-extrabold text-2xl text-white">{formatCurrency(resteACharge)}</span>
          </div>
        </div>
      </section>

      {/* Margin Analysis */}
      <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          Marge CEE et Plafond
        </h3>
        <div className="text-gray-700 space-y-1 text-sm">
          <p>Valeur CEE Négociée (Base 100%) : <span className="font-medium">{formatCurrency(ceeEurosBase)}</span></p>
          <p>Prime CEE Appliquée au Client : <span className="font-medium text-indigo-600">{formatCurrency(ceeCommerciale)}</span></p>
          <p className="font-bold">
            Marge CEE conservée (Bénéfice) :{' '}
            <span className="font-extrabold text-red-600">{formatCurrency(ceeMargin)}</span>
            {' '}({Math.round(ceeMarginPercent)}%)
          </p>
        </div>
      </div>
    </div>
  )
}
