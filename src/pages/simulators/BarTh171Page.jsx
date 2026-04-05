import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import CommercialStrategy from '../../components/simulator/CommercialStrategy'
import FinancialSummary from '../../components/simulator/FinancialSummary'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import ToggleGroup from '../../components/ui/ToggleGroup'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import { BAR_TH_171 } from '../../lib/constants/barTh171'
import { ZONE_OPTIONS } from '../../lib/constants/zones'
import { MPR_GRANTS } from '../../lib/constants/mpr'
import { calculateBarTh171 } from '../../lib/calculators/barTh171'
import { useCommercialStrategy } from '../../hooks/useCommercialStrategy'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { formatCurrency, formatKWhc } from '../../utils/formatters'

export default function BarTh171Page() {
  const { getDefault, getDealPrice, minCeePercent } = useSimulatorContext('BAR-TH-171')

  // Inputs — pré-remplis depuis le projet ou la simulation en édition
  const [isPrimaryResidence, setIsPrimaryResidence] = useState('Oui')
  const [housingType, setHousingType] = useState(() => getDefault('housingType', 'Maison'))
  const [surface, setSurface] = useState(() => getDefault('surface', 100))
  const [zone, setZone] = useState(() => getDefault('zone', 'H1'))
  const [etas, setEtas] = useState(() => getDefault('etas', 'high'))
  const [priceMWh, setPriceMWh] = useState(() => getDefault('priceMWh', 7.5))
  const [projectCost, setProjectCost] = useState(() => getDefault('projectCost', 12000))
  const [mprCategory, setMprCategoryRaw] = useState(() => getDefault('mprCategory', 'Bleu'))
  const [ceePercent, setCeePercent] = useState(() => getDefault('ceePercent', 100))

  function setMprCategory(cat) {
    setMprCategoryRaw(cat)
    const price = getDealPrice(cat)
    if (price != null) setPriceMWh(price)
  }

  // CEE Calculation
  const ceeResult = useMemo(
    () => calculateBarTh171({ type: housingType, surface, etas, zone, priceMWh }),
    [housingType, surface, etas, zone, priceMWh]
  )

  const ceeEurosBase = isPrimaryResidence === 'Oui' ? ceeResult.ceeEuros : 0
  const volumeCEE = isPrimaryResidence === 'Oui' ? ceeResult.volumeCEE : 0

  // MPR
  const mprGrants = MPR_GRANTS['bar-th-171'] || {}
  const mprGrantTheorique = mprGrants[mprCategory] || 0

  // Commercial Strategy
  const commercial = useCommercialStrategy({
    ceeEurosBase,
    ceePercentApplied: ceePercent,
    mprCategory,
    mprGrantTheorique,
    projectCost,
    maxEligibleCost: 12000,
  })

  const isIneligible = isPrimaryResidence === 'Non'

  return (
    <SimulatorLayout
      code="BAR-TH-171"
      title="Simulateur Aides PAC Air/Eau"
      description="Calcul CEE + Stratégie de Déduction et Plafond"
    >
      {/* SECTION 1: CEE Calculation */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul de la Prime CEE (Valeur Négociée)
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          {/* Résidence principale */}
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <ToggleGroup
              label="Le logement est-il occupé à titre de résidence principale ?"
              options={[
                { value: 'Oui', label: 'OUI' },
                { value: 'Non', label: 'NON' },
              ]}
              value={isPrimaryResidence}
              onChange={setIsPrimaryResidence}
              activeColor={isPrimaryResidence === 'Oui' ? 'green' : 'red'}
            />
          </div>

          {/* Type + Surface + Zone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToggleGroup
              label="Type de Logement"
              options={[
                { value: 'Maison', label: 'Maison' },
                { value: 'Appartement', label: 'Appart.' },
              ]}
              value={housingType}
              onChange={setHousingType}
            />

            <InputField
              label="Surface (m²)"
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
          </div>

          {/* Etas + Prix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Efficacité (Etas)"
              id="etas"
              value={etas}
              onChange={setEtas}
              options={BAR_TH_171.ETAS_OPTIONS}
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

          {/* CEE Result */}
          <div className="mt-4 p-4 bg-indigo-100 rounded-lg border border-indigo-300 text-center">
            <ResultCard
              label="Valeur CEE Négociée (Base 100%)"
              value={formatCurrency(ceeEurosBase)}
              sublabel={formatKWhc(volumeCEE)}
              className="text-indigo-900"
            />
          </div>
        </div>
      </section>

      {/* Ineligibility Alert */}
      <AlertBox
        type="error"
        title="Non éligible aux aides"
        show={isIneligible}
      >
        Le logement doit être la résidence principale pour bénéficier des aides CEE et MaPrimeRénov'.
      </AlertBox>

      {/* SECTION 2: Commercial Strategy */}
      {!isIneligible && (
        <CommercialStrategy
          projectCost={projectCost}
          onProjectCostChange={setProjectCost}
          mprCategory={mprCategory}
          onMprCategoryChange={setMprCategory}
          ceePercent={ceePercent}
          onCeePercentChange={setCeePercent}
          mprGrantTheorique={mprGrantTheorique}
          maxEligibleCost={12000}
          minCeePercent={minCeePercent}
        />
      )}

      {/* SECTION 3: Financial Summary */}
      {!isIneligible && (
        <FinancialSummary
          ceeCommerciale={commercial.ceeCommerciale}
          mprFinal={commercial.mprFinal}
          totalAid={commercial.totalAid}
          resteACharge={commercial.resteACharge}
          ceeEurosBase={ceeEurosBase}
          ceeMargin={commercial.ceeMargin}
          ceeMarginPercent={commercial.ceeMarginPercent}
          isCeilingExceeded={commercial.isCeilingExceeded}
          maxAidPercentage={commercial.maxAidPercentage}
        />
      )}

      {/* Save & PDF */}
      {!isIneligible && (
        <SimulationSaveBar
          type="BAR-TH-171"
          title={`PAC Air/Eau — ${housingType} ${surface}m² ${zone}`}
          inputs={{ housingType, surface, zone, etas, priceMWh, projectCost, mprCategory, ceePercent }}
          results={{ ceeEurosBase, volumeCEE, projectCost, ...commercial }}
          pdfData={{
            ficheCode: 'BAR-TH-171',
            ficheTitle: 'Simulateur Aides PAC Air/Eau',
            params: [
              { label: 'Type de logement', value: housingType },
              { label: 'Surface chauffée', value: `${surface} m²` },
              { label: 'Zone climatique', value: zone },
              { label: 'Efficacité (Etas)', value: etas === 'high' ? '≥ 140%' : '111% à 140%' },
              { label: 'Prix CEE', value: `${priceMWh} €/MWhc` },
              { label: 'Profil revenus', value: mprCategory },
            ],
            results: [
              { label: 'Volume CEE', value: formatKWhc(volumeCEE) },
              { label: 'Valeur CEE (Base 100%)', value: formatCurrency(ceeEurosBase) },
              { label: 'MPR forfaitaire', value: formatCurrency(mprGrantTheorique) },
            ],
            summary: {
              projectCost,
              ceeCommerciale: commercial.ceeCommerciale,
              mprFinal: commercial.mprFinal,
              totalAid: commercial.totalAid,
              resteACharge: commercial.resteACharge,
            },
            margin: {
              ceeBase: ceeEurosBase,
              ceeApplied: commercial.ceeCommerciale,
              margin: commercial.ceeMargin,
              marginPercent: commercial.ceeMarginPercent,
              showOnPdf: false,
            },
          }}
        />
      )}

      {/* Disclaimer */}
      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation basée sur la fiche CEE BAR-TH-171 (Arrêté du 15 décembre 2025) et la réglementation MPR. Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
