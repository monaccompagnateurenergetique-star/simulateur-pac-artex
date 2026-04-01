import { useState, useMemo } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { LOC_AVANTAGE } from '../../lib/constants/locAvantage'
import { calculateLocAvantage } from '../../lib/calculators/locAvantage'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { formatCurrency } from '../../utils/formatters'

export default function LocAvantagePage() {
  const { getDefault } = useSimulatorContext()
  const [surface, setSurface] = useState(() => getDefault('surface', 80))
  const [zone, setZone] = useState(() => getDefault('zone', 'B1'))
  const [rentalLevel, setRentalLevel] = useState(() => getDefault('rentalLevel', 'Loc2'))
  const [workAmount, setWorkAmount] = useState(() => getDefault('workAmount', 15000))
  const [hasIntermediationAgent, setHasIntermediationAgent] = useState(
    () => getDefault('hasIntermediationAgent', false)
  )
  const [actorType, setActorType] = useState(() => getDefault('actorType', 'individual'))

  const locResult = useMemo(
    () => calculateLocAvantage({ surface, zone, rentalLevel, workAmount, hasIntermediationAgent, actorType }),
    [surface, zone, rentalLevel, workAmount, hasIntermediationAgent, actorType]
  )

  return (
    <SimulatorLayout
      code="LOC-AVANTAGE"
      title="Loc Avantages — Logement Locatif Intermediaire"
      description="Simulateur des aides ANAH"
    >
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul des Aides ANAH
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Surface (m2)" type="number" id="surface" value={surface} onChange={setSurface} min={1} max={500} suffix="m2" />
            <SelectField label="Zone" id="zone" value={zone} onChange={setZone} options={LOC_AVANTAGE.ZONES.map((z) => ({ value: z.value, label: z.label }))} />
            <SelectField label="Niveau" id="rentalLevel" value={rentalLevel} onChange={setRentalLevel} options={LOC_AVANTAGE.RENTAL_LEVELS.map((l) => ({ value: l.value, label: l.label }))} />
          </div>

          <InputField label="Montant travaux" type="number" id="workAmount" value={workAmount} onChange={setWorkAmount} min={0} step={100} suffix="EUR" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-100 rounded-lg border border-emerald-300">
              <ResultCard label="Aide ANAH" value={formatCurrency(locResult.anahSubsidyAmount)} sublabel="25 pct plafond 28k" className="text-emerald-900" />
            </div>
            <div className="p-4 bg-blue-100 rounded-lg border border-blue-300">
              <ResultCard label="Reduction impot" value={formatCurrency(locResult.totalTaxReductionOver9Years)} sublabel="9 ans" className="text-blue-900" />
            </div>
          </div>

          <div className="mt-4 p-4 bg-indigo-100 rounded-lg border border-indigo-300 text-center">
            <ResultCard label="Total Avantages" value={formatCurrency(locResult.totalFinancialBenefit)} sublabel="ANAH + Reduction" className="text-indigo-900" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Synthese Financiere
        </h2>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Montant travaux</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(workAmount)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Aide ANAH</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(locResult.anahSubsidyAmount)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Reduction impot par an</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(locResult.annualTaxReduction)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-indigo-300">
              <p className="text-sm text-gray-600 font-semibold">Total Avantages</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">{formatCurrency(locResult.totalFinancialBenefit)}</p>
            </div>
          </div>
        </div>
      </section>

      <SimulationSaveBar
        type="LOC-AVANTAGE"
        title={"Zone " + zone + " - " + rentalLevel + " - " + surface + "m2"}
        inputs={{ surface, zone, rentalLevel, workAmount, hasIntermediationAgent, actorType }}
        results={{ anahSubsidyAmount: locResult.anahSubsidyAmount, totalTaxReductionOver9Years: locResult.totalTaxReductionOver9Years, totalFinancialBenefit: locResult.totalFinancialBenefit }}
        pdfData={{ ficheCode: 'LOC-AVANTAGE', ficheTitle: 'Loc Avantages' }}
      />

      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation ANAH. Aide 25 pct plafond 28k EUR. Montants indicatifs.</p>
      </div>
    </SimulatorLayout>
  )
}
