import { Percent, Tag } from 'lucide-react'
import InputField from '../ui/InputField'
import SelectField from '../ui/SelectField'
import Slider from '../ui/Slider'
import { MPR_INCOME_OPTIONS } from '../../lib/constants/mpr'
import { formatCurrency } from '../../utils/formatters'

export default function CommercialStrategy({
  projectCost,
  onProjectCostChange,
  mprCategory,
  onMprCategoryChange,
  ceePercent,
  onCeePercentChange,
  mprGrantTheorique,
  maxEligibleCost = 12000,
  showMpr = true,
  minCeePercent = 0,
}) {
  const effectiveMin = Math.max(0, Math.min(100, minCeePercent))
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-green-600" />
        Stratégie Commerciale & Plafond
      </h2>

      <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Coût total TTC du projet (€)"
            type="number"
            id="projectCost"
            value={projectCost}
            onChange={onProjectCostChange}
            min={1000}
            suffix="€"
            helper={`Plafond éligible : ${formatCurrency(maxEligibleCost)}`}
          />

          <SelectField
            label={showMpr ? "Profil de Revenus MaPrimeRénov'" : "Catégorie de revenus CEE"}
            id="mprCategory"
            value={mprCategory}
            onChange={onMprCategoryChange}
            options={MPR_INCOME_OPTIONS}
            helper={showMpr ? `MPR Forfaitaire Théorique : ${formatCurrency(mprGrantTheorique)}` : undefined}
          />
        </div>

        <div className="pt-4 border-t border-green-200">
          <Slider
            label={
              <span className="flex items-center gap-1">
                <Percent className="w-4 h-4 inline" />
                Pourcentage de la CEE appliqué sur le Devis
              </span>
            }
            id="ceePercent"
            value={Math.max(ceePercent, effectiveMin)}
            onChange={(v) => onCeePercentChange(Math.max(v, effectiveMin))}
            min={effectiveMin}
            max={100}
            step={1}
            unit="%"
            leftLabel={effectiveMin > 0 ? `${effectiveMin}% (Min contrat)` : '0% (Max Marge)'}
            rightLabel="100% (Max Aide Client)"
          />
        </div>
      </div>
    </section>
  )
}
