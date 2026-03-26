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
import { BAR_EN_101 } from '../../lib/constants/barEn101'
import { calculateBarEn101 } from '../../lib/calculators/barEn101'
import { useCommercialStrategy } from '../../hooks/useCommercialStrategy'
import { formatCurrency, formatKWhc } from '../../utils/formatters'

export default function BarEn101Page() {
  const [surface, setSurface] = useState(80)
  const [zone, setZone] = useState('H1')
  const [insulationType, setInsulationType] = useState('combles')
  const [priceMWh, setPriceMWh] = useState(7.5)
  const [projectCost, setProjectCost] = useState(5000)
  const [mprCategory, setMprCategory] = useState('Bleu')
  const [ceePercent, setCeePercent] = useState(58)

  // Rampants = éligible MPR au m², Combles perdus = pas de MPR
  const isRampants = insulationType === 'rampants'
  const mprRates = BAR_EN_101.MPR_PER_M2[insulationType]
  const mprGrantTheorique = isRampants ? (mprRates[mprCategory] || 0) * Number(surface) : 0

  const result = useMemo(
    () => calculateBarEn101({ surface, zone, priceMWh }),
    [surface, zone, priceMWh]
  )

  const commercial = useCommercialStrategy({
    ceeEurosBase: result.ceeEuros,
    ceePercentApplied: ceePercent,
    mprCategory: isRampants ? mprCategory : 'Rose',
    mprGrantTheorique,
    projectCost,
    maxEligibleCost: BAR_EN_101.DEPENSE_ELIGIBLE_PER_M2 * Number(surface),
  })

  const rThreshold = BAR_EN_101.R_THRESHOLDS[insulationType]

  return (
    <SimulatorLayout
      code="BAR-EN-101"
      title="Isolation des combles ou toitures"
      description="Calcul CEE pour l'isolation des combles perdus ou rampants de toiture"
    >
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul de la Prime CEE
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToggleGroup
              label="Type d'isolation"
              options={BAR_EN_101.INSULATION_TYPES}
              value={insulationType}
              onChange={setInsulationType}
            />
            <InputField
              label="Surface à isoler (m²)"
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
              Résistance thermique minimale requise : <strong>R ≥ {rThreshold} m².K/W</strong>
            </div>
          </AlertBox>

          {/* Alerte MPR selon type */}
          <AlertBox type={isRampants ? 'success' : 'warning'} show={true}>
            {isRampants ? (
              <span>
                <strong>Rampants de toiture :</strong> Cumulable CEE + MaPrimeRénov' ({mprRates.Bleu}€/m² Bleu, {mprRates.Jaune}€/m² Jaune, {mprRates.Violet}€/m² Violet)
              </span>
            ) : (
              <span>
                <strong>Combles perdus :</strong> Non éligible à MaPrimeRénov'. Seule la prime CEE s'applique.
              </span>
            )}
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
        mprCategory={isRampants ? mprCategory : 'Rose'}
        onMprCategoryChange={setMprCategory}
        ceePercent={ceePercent}
        onCeePercentChange={setCeePercent}
        mprGrantTheorique={mprGrantTheorique}
        maxEligibleCost={BAR_EN_101.DEPENSE_ELIGIBLE_PER_M2 * Number(surface)}
        showMpr={isRampants}
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
        showMpr={isRampants}
      />

      <SimulationSaveBar
        type="BAR-EN-101"
        title={`Isolation ${insulationType} — ${surface}m² ${zone}`}
        inputs={{ surface, zone, insulationType, priceMWh, projectCost, mprCategory, ceePercent }}
        results={{ ...result, ...commercial }}
      />

      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation basée sur la fiche CEE BAR-EN-101 et le guide des aides ANAH (février 2026). Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
