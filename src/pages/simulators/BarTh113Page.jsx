import { useState, useMemo } from 'react'
import { Flame } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import CommercialStrategy from '../../components/simulator/CommercialStrategy'
import FinancialSummary from '../../components/simulator/FinancialSummary'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import SelectField from '../../components/ui/SelectField'
import InputField from '../../components/ui/InputField'
import ToggleGroup from '../../components/ui/ToggleGroup'
import ResultCard from '../../components/ui/ResultCard'
import { BAR_TH_113 } from '../../lib/constants/barTh113'
import { MPR_GRANTS } from '../../lib/constants/mpr'
import { calculateBarTh113 } from '../../lib/calculators/barTh113'
import { useCommercialStrategy } from '../../hooks/useCommercialStrategy'
import { formatCurrency, formatKWhc } from '../../utils/formatters'

export default function BarTh113Page() {
  const [mprCategory, setMprCategory] = useState('Bleu')
  const [fuelType, setFuelType] = useState('granules')
  const [replacedEnergy, setReplacedEnergy] = useState('fioul')
  const [priceMWh, setPriceMWh] = useState(7.5)
  const [projectCost, setProjectCost] = useState(15000)
  const [ceePercent, setCeePercent] = useState(58)

  const isPrecarite = mprCategory === 'Bleu' || mprCategory === 'Jaune'
  const mprGrants = MPR_GRANTS['bar-th-113'] || {}
  const mprGrantTheorique = mprGrants[mprCategory] || 0

  const result = useMemo(
    () => calculateBarTh113({ isPrecarite, priceMWh }),
    [isPrecarite, priceMWh]
  )

  const commercial = useCommercialStrategy({
    ceeEurosBase: result.ceeEuros,
    ceePercentApplied: ceePercent,
    mprCategory,
    mprGrantTheorique,
    projectCost,
    maxEligibleCost: 18000,
  })

  return (
    <SimulatorLayout
      code="BAR-TH-113"
      title="Chaudière biomasse individuelle"
      description="Calcul CEE pour l'installation d'une chaudière biomasse"
    >
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-600" />
          Paramètres de l'installation
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <ToggleGroup
              label="Ménage en précarité énergétique ?"
              options={[
                { value: 'Oui', label: 'OUI' },
                { value: 'Non', label: 'NON' },
              ]}
              value={isPrecarite ? 'Oui' : 'Non'}
              onChange={(v) => setMprCategory(v === 'Oui' ? 'Bleu' : 'Violet')}
              activeColor={isPrecarite ? 'green' : 'red'}
            />
            <p className="text-xs text-gray-500 mt-2">
              {isPrecarite ? '727 300 kWhc (bonification précarité)' : '454 500 kWhc (ménage standard)'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Type de combustible"
              id="fuelType"
              value={fuelType}
              onChange={setFuelType}
              options={BAR_TH_113.FUEL_TYPES}
            />
            <SelectField
              label="Énergie remplacée"
              id="replacedEnergy"
              value={replacedEnergy}
              onChange={setReplacedEnergy}
              options={BAR_TH_113.REPLACED_ENERGY}
            />
          </div>

          <InputField
            label="Prix CEE (€/MWhc)"
            type="number"
            id="priceMWh"
            value={priceMWh}
            onChange={setPriceMWh}
            step={0.1}
            suffix="€/MWhc"
          />

          <div className="mt-4 p-4 bg-indigo-100 rounded-lg border border-indigo-300 text-center">
            <ResultCard
              label="Valeur CEE Négociée (Base 100%)"
              value={formatCurrency(result.ceeEuros)}
              sublabel={formatKWhc(result.volumeCEE)}
              className="text-indigo-900"
            />
          </div>
        </div>
      </section>

      <CommercialStrategy
        projectCost={projectCost}
        onProjectCostChange={setProjectCost}
        mprCategory={mprCategory}
        onMprCategoryChange={setMprCategory}
        ceePercent={ceePercent}
        onCeePercentChange={setCeePercent}
        mprGrantTheorique={mprGrantTheorique}
        maxEligibleCost={18000}
      />

      <FinancialSummary
        ceeCommerciale={commercial.ceeCommerciale}
        mprFinal={commercial.mprFinal}
        totalAid={commercial.totalAid}
        resteACharge={commercial.resteACharge}
        ceeEurosBase={result.ceeEuros}
        ceeMargin={commercial.ceeMargin}
        ceeMarginPercent={commercial.ceeMarginPercent}
        isCeilingExceeded={commercial.isCeilingExceeded}
        maxAidPercentage={commercial.maxAidPercentage}
      />

      <SimulationSaveBar
        type="BAR-TH-113"
        title={`Biomasse ${fuelType} remplace ${replacedEnergy}`}
        inputs={{ mprCategory, fuelType, replacedEnergy, priceMWh, projectCost, ceePercent }}
        results={{ ...result, ...commercial }}
        pdfData={{
          ficheCode: 'BAR-TH-113',
          ficheTitle: 'Chaudière biomasse individuelle',
          params: [
            { label: 'Précarité énergétique', value: isPrecarite ? 'Oui' : 'Non' },
            { label: 'Type de combustible', value: fuelType },
            { label: 'Énergie remplacée', value: replacedEnergy },
            { label: 'Prix CEE', value: `${priceMWh} €/MWhc` },
            { label: 'Profil revenus', value: mprCategory },
          ],
          results: [
            { label: 'Volume CEE', value: formatKWhc(result.volumeCEE) },
            { label: 'Valeur CEE (Base 100%)', value: formatCurrency(result.ceeEuros) },
            { label: 'MPR forfaitaire', value: formatCurrency(mprGrantTheorique) },
          ],
          summary: {
            projectCost,
            ceeCommerciale: commercial.ceeCommerciale,
            mprFinal: commercial.mprFinal,
            totalAid: commercial.totalAid,
            resteACharge: commercial.resteACharge,
            showMpr: true,
          },
          margin: {
            ceeBase: result.ceeEuros,
            ceeApplied: commercial.ceeCommerciale,
            margin: commercial.ceeMargin,
            marginPercent: commercial.ceeMarginPercent,
            showOnPdf: false,
          },
        }}
      />

      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation basée sur la fiche CEE BAR-TH-113. Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
