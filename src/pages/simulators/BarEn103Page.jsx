import { useState, useMemo } from 'react'
import { Calculator, Info } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import CommercialStrategy from '../../components/simulator/CommercialStrategy'
import FinancialSummary from '../../components/simulator/FinancialSummary'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import { ZONE_OPTIONS } from '../../lib/constants/zones'
import { BAR_EN_103 } from '../../lib/constants/barEn103'
import { calculateBarEn103 } from '../../lib/calculators/barEn103'
import { useCommercialStrategy } from '../../hooks/useCommercialStrategy'
import { formatCurrency, formatKWhc } from '../../utils/formatters'

export default function BarEn103Page() {
  const [surface, setSurface] = useState(70)
  const [zone, setZone] = useState('H1')
  const [priceMWh, setPriceMWh] = useState(7.5)
  const [projectCost, setProjectCost] = useState(4000)
  const [ceePercent, setCeePercent] = useState(58)

  const result = useMemo(
    () => calculateBarEn103({ surface, zone, priceMWh }),
    [surface, zone, priceMWh]
  )

  const commercial = useCommercialStrategy({
    ceeEurosBase: result.ceeEuros,
    ceePercentApplied: ceePercent,
    mprCategory: 'Rose',
    mprGrantTheorique: 0,
    projectCost,
    maxEligibleCost: 12000,
  })

  return (
    <SimulatorLayout
      code="BAR-EN-103"
      title="Isolation d'un plancher bas"
      description="Calcul CEE pour l'isolation du plancher bas sur local non chauffé"
    >
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul de la Prime CEE
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Surface du plancher (m²)"
              type="number"
              id="surface"
              value={surface}
              onChange={setSurface}
              min={1}
              suffix="m²"
            />
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
              Résistance thermique minimale requise : <strong>R ≥ {BAR_EN_103.R_THRESHOLD} m².K/W</strong>
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
        mprCategory="Rose"
        onMprCategoryChange={() => {}}
        ceePercent={ceePercent}
        onCeePercentChange={setCeePercent}
        mprGrantTheorique={0}
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
        type="BAR-EN-103"
        title={`Isolation plancher — ${surface}m² ${zone}`}
        inputs={{ surface, zone, priceMWh, projectCost, ceePercent }}
        results={{ ...result, ...commercial }}
        pdfData={{
          ficheCode: 'BAR-EN-103',
          ficheTitle: 'Isolation plancher bas',
          params: [
            { label: 'Surface du plancher', value: `${surface} m²` },
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
        <p>Simulation basée sur la fiche CEE BAR-EN-103. Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
