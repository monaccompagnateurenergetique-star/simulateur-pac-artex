import { useState, useMemo } from 'react'
import { Flame, Calculator, AlertTriangle } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import CommercialStrategy from '../../components/simulator/CommercialStrategy'
import FinancialSummary from '../../components/simulator/FinancialSummary'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import SelectField from '../../components/ui/SelectField'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import { BAR_TH_113 } from '../../lib/constants/barTh113'
import { ZONE_OPTIONS } from '../../lib/constants/zones'
import { calculateBarTh113 } from '../../lib/calculators/barTh113'
import { useCommercialStrategy } from '../../hooks/useCommercialStrategy'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { formatCurrency, formatKWhc } from '../../utils/formatters'

export default function BarTh113Page() {
  const { getDefault, getDealPrice, minCeePercent } = useSimulatorContext('BAR-TH-113')

  const [zone, setZone] = useState(() => getDefault('zone', 'H1'))
  const [mprCategory, setMprCategoryRaw] = useState(() => getDefault('mprCategory', 'Bleu'))
  const [fuelType, setFuelType] = useState(() => getDefault('fuelType', 'granules'))
  const [replacedEnergy, setReplacedEnergy] = useState(() => getDefault('replacedEnergy', 'fioul'))
  const [priceMWh, setPriceMWh] = useState(() => getDefault('priceMWh', 7.5))
  const [projectCost, setProjectCost] = useState(() => getDefault('projectCost', 15000))
  const [ceePercent, setCeePercent] = useState(() => getDefault('ceePercent', 100))

  function setMprCategory(cat) {
    setMprCategoryRaw(cat)
    const price = getDealPrice(cat)
    if (price != null) setPriceMWh(price)
  }

  const result = useMemo(
    () => calculateBarTh113({ zone, mprCategory, priceMWh }),
    [zone, mprCategory, priceMWh]
  )

  const commercial = useCommercialStrategy({
    ceeEurosBase: result.ceeEuros,
    ceePercentApplied: ceePercent,
    mprCategory,
    mprGrantTheorique: 0, // Exclue de MPR depuis 01/01/2026
    projectCost,
    maxEligibleCost: projectCost,
  })

  return (
    <SimulatorLayout
      code="BAR-TH-113"
      title="Chaudière biomasse individuelle"
      description="Calcul CEE Coup de Pouce Chauffage 2026"
    >
      <AlertBox type="warning" show={true} title="MaPrimeRénov' supprimée">
        Depuis le 1er janvier 2026, la chaudière biomasse n'est plus financée par MaPrimeRénov'. Seul le financement via les CEE (Coup de Pouce ×5) est disponible.
      </AlertBox>

      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul de la Prime CEE — Coup de Pouce Chauffage 2026
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Zone climatique"
              id="zone"
              value={zone}
              onChange={setZone}
              options={ZONE_OPTIONS}
            />
            <SelectField
              label="Profil de revenus"
              id="mprCategory"
              value={mprCategory}
              onChange={setMprCategory}
              options={[
                { value: 'Bleu', label: 'Bleu — Très modestes (×5)' },
                { value: 'Jaune', label: 'Jaune — Modestes (×5)' },
                { value: 'Violet', label: 'Violet — Intermédiaires (×5)' },
                { value: 'Rose', label: 'Rose — Supérieurs (×5)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <InputField
              label="Prix CEE (€/MWhc)"
              type="number"
              id="priceMWh"
              value={priceMWh}
              onChange={setPriceMWh}
              step={0.5}
              suffix="€/MWhc"
            />
          </div>

          {/* Détail calcul */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
            <div className="bg-white p-3 rounded-lg border">
              <span className="font-semibold">Montant base :</span> {formatKWhc(result.baseValue)} ({zone})
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="font-semibold">Bonification :</span>{' '}
              <span className="text-green-600 font-bold">×{result.bonusPrecarite} (Coup de Pouce)</span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="font-semibold">MPR :</span>{' '}
              <span className="text-red-500 font-semibold">Exclue 2026</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-indigo-100 rounded-lg border border-indigo-300 text-center">
            <ResultCard
              label="Valeur CEE Coup de Pouce (Base 100%)"
              value={formatCurrency(result.ceeEuros)}
              sublabel={`${formatKWhc(result.volumeCEE)} — Prix : ${priceMWh} €/MWhc`}
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
        mprGrantTheorique={0}
        maxEligibleCost={projectCost}
        minCeePercent={minCeePercent}
        showMpr={false}
      />

      <FinancialSummary
        ceeCommerciale={commercial.ceeCommerciale}
        mprFinal={0}
        totalAid={commercial.totalAid}
        resteACharge={commercial.resteACharge}
        ceeEurosBase={result.ceeEuros}
        ceeMargin={commercial.ceeMargin}
        ceeMarginPercent={commercial.ceeMarginPercent}
        isCeilingExceeded={commercial.isCeilingExceeded}
        maxAidPercentage={commercial.maxAidPercentage}
        showMpr={false}
      />

      <SimulationSaveBar
        type="BAR-TH-113"
        title={`Biomasse ${fuelType} — ${zone} — remplace ${replacedEnergy}`}
        inputs={{ zone, mprCategory, fuelType, replacedEnergy, priceMWh, projectCost, ceePercent }}
        results={{ ...result, ...commercial, projectCost }}
        pdfData={{
          ficheCode: 'BAR-TH-113',
          ficheTitle: 'Chaudière biomasse individuelle',
          params: [
            { label: 'Zone climatique', value: zone },
            { label: 'Type de combustible', value: fuelType },
            { label: 'Énergie remplacée', value: replacedEnergy },
            { label: 'Prix CEE', value: `${priceMWh} €/MWhc` },
            { label: 'Profil revenus', value: mprCategory },
            { label: 'Bonification Coup de Pouce', value: `×${result.bonusPrecarite}` },
          ],
          results: [
            { label: 'Volume CEE', value: formatKWhc(result.volumeCEE) },
            { label: 'Valeur CEE (Base 100%)', value: formatCurrency(result.ceeEuros) },
          ],
          summary: {
            projectCost,
            ceeCommerciale: commercial.ceeCommerciale,
            mprFinal: 0,
            totalAid: commercial.totalAid,
            resteACharge: commercial.resteACharge,
            showMpr: false,
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
        <p>Simulation basée sur la fiche CEE BAR-TH-113 avec Coup de Pouce Chauffage 2026 (×5). MPR exclue depuis le 01/01/2026. Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
