import { useState, useMemo } from 'react'
import { Calculator, Info } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import CommercialStrategy from '../../components/simulator/CommercialStrategy'
import FinancialSummary from '../../components/simulator/FinancialSummary'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ToggleGroup from '../../components/ui/ToggleGroup'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import { ZONE_OPTIONS } from '../../lib/constants/zones'
import { BAR_EN_102 } from '../../lib/constants/barEn102'
import { calculateBarEn102 } from '../../lib/calculators/barEn102'
import { useCommercialStrategy } from '../../hooks/useCommercialStrategy'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { formatCurrency, formatKWhc } from '../../utils/formatters'

export default function BarEn102Page() {
  const { getDefault, getDealPrice, minCeePercent } = useSimulatorContext('BAR-EN-102')

  const [surface, setSurface] = useState(() => getDefault('surface', 60))
  const [zone, setZone] = useState(() => getDefault('zone', 'H1'))
  const [method, setMethod] = useState(() => getDefault('method', 'interieur'))
  const [priceMWh, setPriceMWh] = useState(() => getDefault('priceMWh', 7.5))
  const [projectCost, setProjectCost] = useState(() => getDefault('projectCost', 8000))
  const [mprCategory, setMprCategoryRaw] = useState(() => getDefault('mprCategory', 'Bleu'))
  const [ceePercent, setCeePercent] = useState(() => getDefault('ceePercent', 100))

  function setMprCategory(cat) {
    setMprCategoryRaw(cat)
    const price = getDealPrice(cat)
    if (price != null) setPriceMWh(price)
  }

  const result = useMemo(
    () => calculateBarEn102({ surface, zone, priceMWh }),
    [surface, zone, priceMWh]
  )

  const commercial = useCommercialStrategy({
    ceeEurosBase: result.ceeEuros,
    ceePercentApplied: ceePercent,
    mprCategory,
    mprGrantTheorique: 0,
    projectCost,
    maxEligibleCost: 12000,
  })

  return (
    <SimulatorLayout
      code="BAR-EN-102"
      title="Isolation des murs"
      description="Calcul CEE pour l'isolation des murs par l'intérieur ou l'extérieur"
    >
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul de la Prime CEE
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToggleGroup
              label="Méthode d'isolation"
              options={BAR_EN_102.INSULATION_METHODS}
              value={method}
              onChange={setMethod}
            />
            <InputField
              label="Surface des murs (m²)"
              type="number"
              id="surface"
              value={surface}
              onChange={setSurface}
              min={1}
              suffix="m²"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Zone Climatique"
              id="zone"
              value={zone}
              onChange={setZone}
              options={ZONE_OPTIONS}
            />
            <InputField
              label="Prix CEE (€/MWhc)"
              type="number"
              id="priceMWh"
              value={priceMWh}
              onChange={setPriceMWh}
              step={0.1}
              suffix="€/MWhc"
            />
          </div>

          <AlertBox type="info" show={true}>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              Résistance thermique minimale requise : <strong>R ≥ {BAR_EN_102.R_THRESHOLD} m².K/W</strong>
            </div>
          </AlertBox>

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
        mprGrantTheorique={0}
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
        isCeilingExceeded={false}
        maxAidPercentage={0}
        showMpr={false}
      />

      <SimulationSaveBar
        type="BAR-EN-102"
        title={`Isolation murs ${method === 'interieur' ? 'ITI' : 'ITE'} — ${surface}m² ${zone}`}
        inputs={{ surface, zone, method, priceMWh, projectCost, mprCategory, ceePercent }}
        results={{ ...result, ...commercial, projectCost }}
        pdfData={{
          ficheCode: 'BAR-EN-102',
          ficheTitle: 'Isolation des murs',
          params: [
            { label: 'Méthode d\'isolation', value: method === 'interieur' ? 'ITI (Intérieur)' : 'ITE (Extérieur)' },
            { label: 'Surface des murs', value: `${surface} m²` },
            { label: 'Zone climatique', value: zone },
            { label: 'Prix CEE', value: `${priceMWh} €/MWhc` },
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
        <p>Simulation basée sur la fiche CEE BAR-EN-102. Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
