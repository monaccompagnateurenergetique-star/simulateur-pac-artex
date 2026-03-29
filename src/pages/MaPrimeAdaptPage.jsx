import { useState, useMemo } from 'react'
import { Accessibility, Heart, Euro, ShieldCheck, Wrench, Info, CheckCircle, Bath, DoorOpen, ClipboardList } from 'lucide-react'
import SimulatorLayout from '../components/simulator/SimulatorLayout'
import SimulationSaveBar from '../components/simulator/SimulationSaveBar'
import SelectField from '../components/ui/SelectField'
import InputField from '../components/ui/InputField'
import ResultCard from '../components/ui/ResultCard'
import AlertBox from '../components/ui/AlertBox'
import {
  ELIGIBILITY_PROFILES,
  REVENUE_PROFILES,
  FUNDING_RATES,
  EXPENSE_CEILING,
  AMO_OPTIONS,
  WORK_CATEGORIES,
  CUMUL_INFO,
  ELIGIBLE_OCCUPANTS,
} from '../lib/constants/maprimeadapt'
import { formatCurrency } from '../utils/formatters'

const CATEGORY_ICONS = {
  salle_de_bain: Bath,
  accessibilite: DoorOpen,
  autres_travaux: Wrench,
}

const CATEGORY_COLORS = {
  blue: {
    header: 'bg-blue-50 border-blue-200',
    headerText: 'text-blue-800',
    check: 'accent-blue-600',
    input: 'focus:ring-blue-500 focus:border-blue-500',
  },
  teal: {
    header: 'bg-teal-50 border-teal-200',
    headerText: 'text-teal-800',
    check: 'accent-teal-600',
    input: 'focus:ring-teal-500 focus:border-teal-500',
  },
  emerald: {
    header: 'bg-emerald-50 border-emerald-200',
    headerText: 'text-emerald-800',
    check: 'accent-emerald-600',
    input: 'focus:ring-emerald-500 focus:border-emerald-500',
  },
}

export default function MaPrimeAdaptPage() {
  // Profil beneficiaire
  const [eligibility, setEligibility] = useState('70plus')
  const [revenueProfile, setRevenueProfile] = useState('Bleu')

  // Travaux selectionnes: { workId: { checked: bool, cost: number } }
  const [selectedWorks, setSelectedWorks] = useState({})

  // AMO
  const [amoType, setAmoType] = useState('complet')

  // Revenue profile info
  const currentRevenue = REVENUE_PROFILES.find(r => r.value === revenueProfile)
  const isEligible = currentRevenue?.eligible ?? false
  const fundingRate = FUNDING_RATES[revenueProfile] || 0

  // AMO cost
  const amoOption = AMO_OPTIONS.find(a => a.value === amoType)
  const amoCost = amoOption?.cost || 600

  // Toggle work selection
  function toggleWork(workId) {
    setSelectedWorks(prev => {
      const existing = prev[workId]
      if (existing?.checked) {
        const next = { ...prev }
        delete next[workId]
        return next
      }
      return { ...prev, [workId]: { checked: true, cost: 0 } }
    })
  }

  // Update work cost
  function updateWorkCost(workId, cost) {
    setSelectedWorks(prev => ({
      ...prev,
      [workId]: { ...prev[workId], cost: cost === '' ? '' : cost },
    }))
  }

  // Calculations
  const calculation = useMemo(() => {
    const totalCost = Object.values(selectedWorks)
      .filter(w => w.checked)
      .reduce((sum, w) => sum + (parseFloat(w.cost) || 0), 0)

    const eligibleAmount = Math.min(totalCost, EXPENSE_CEILING)
    const primeAmount = isEligible ? Math.round(eligibleAmount * fundingRate) : 0
    const resteACharge = Math.max(0, totalCost - primeAmount)
    const worksCount = Object.values(selectedWorks).filter(w => w.checked).length

    return {
      totalCost,
      eligibleAmount,
      primeAmount,
      resteACharge,
      worksCount,
      isCapped: totalCost > EXPENSE_CEILING,
    }
  }, [selectedWorks, fundingRate, isEligible])

  // Collect selected work labels for PDF
  const selectedWorkLabels = useMemo(() => {
    const labels = []
    WORK_CATEGORIES.forEach(cat => {
      cat.works.forEach(w => {
        if (selectedWorks[w.id]?.checked) {
          labels.push(w.label)
        }
      })
    })
    return labels
  }, [selectedWorks])

  return (
    <SimulatorLayout
      code="MaPrimeAdapt'"
      title="Aide a l'adaptation du logement"
      description="Perte d'autonomie / Handicap - Aide ANAH"
    >
      {/* SECTION 1: Profil du beneficiaire */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Accessibility className="w-5 h-5 text-teal-600" />
          Profil du beneficiaire
        </h2>

        <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 space-y-4">
          {/* Eligibility criteria */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Critere d'eligibilite
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ELIGIBILITY_PROFILES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEligibility(opt.value)}
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                    eligibility === opt.value
                      ? 'bg-teal-100 border-teal-500 text-teal-800'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue profile */}
          <SelectField
            label="Profil de revenus"
            id="revenueProfile"
            value={revenueProfile}
            onChange={setRevenueProfile}
            options={REVENUE_PROFILES.map(r => ({
              value: r.value,
              label: `${r.label}${r.eligible ? ` (${Math.round(r.rate * 100)}%)` : ' - NON ELIGIBLE'}`,
            }))}
          />

          {/* Eligible occupants info */}
          <div className="flex items-start gap-2 text-sm text-teal-700 bg-teal-100/50 p-3 rounded-lg">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong>Beneficiaires eligibles :</strong> {ELIGIBLE_OCCUPANTS.join(', ')}
            </div>
          </div>

          {/* Non-eligible alert */}
          <AlertBox type="error" title="Profil non eligible" show={!isEligible}>
            MaPrimeAdapt' est reservee aux menages aux revenus <strong>tres modestes (Bleu)</strong> et <strong>modestes (Jaune)</strong>.
            Les profils intermediaires et superieurs ne sont pas eligibles a cette aide.
          </AlertBox>
        </div>
      </section>

      {/* SECTION 2: Travaux selectionnes */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-teal-600" />
          Travaux selectionnes
        </h2>

        <div className="space-y-4">
          {WORK_CATEGORIES.map(category => {
            const IconComp = CATEGORY_ICONS[category.id] || Wrench
            const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.teal

            return (
              <div key={category.id} className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Category header */}
                <div className={`px-4 py-3 flex items-center gap-2 border-b ${colors.header}`}>
                  <IconComp className={`w-5 h-5 ${colors.headerText}`} />
                  <h3 className={`font-bold ${colors.headerText}`}>{category.title}</h3>
                </div>

                {/* Works list */}
                <div className="divide-y divide-gray-100">
                  {category.works.map(work => {
                    const isChecked = selectedWorks[work.id]?.checked || false
                    return (
                      <div key={work.id} className={`px-4 py-3 transition ${isChecked ? 'bg-teal-50/30' : ''}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={work.id}
                            checked={isChecked}
                            onChange={() => toggleWork(work.id)}
                            className={`w-4 h-4 rounded ${colors.check}`}
                          />
                          <label htmlFor={work.id} className={`text-sm cursor-pointer flex-1 ${isChecked ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                            {work.label}
                          </label>
                        </div>

                        {/* Cost input - visible when checked */}
                        {isChecked && (
                          <div className="mt-2 ml-7 max-w-xs animate-fade-in">
                            <InputField
                              label=""
                              type="number"
                              id={`cost_${work.id}`}
                              value={selectedWorks[work.id]?.cost ?? 0}
                              onChange={(val) => updateWorkCost(work.id, val)}
                              min={0}
                              step={100}
                              suffix="EUR HT"
                              placeholder="Cout HT"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Capped warning */}
        <AlertBox type="warning" title="Plafond depasse" show={calculation.isCapped}>
          Le cout total des travaux ({formatCurrency(calculation.totalCost)}) depasse le plafond de{' '}
          <strong>{formatCurrency(EXPENSE_CEILING)} HT</strong>. Le montant eligible sera plafonne.
          Vous pouvez faire une 2e demande dans les 5 ans si le plafond n'est pas atteint.
        </AlertBox>
      </section>

      {/* SECTION 3: Accompagnement AMO */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-teal-600" />
          Accompagnement AMO (obligatoire)
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AMO_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAmoType(opt.value)}
                className={`px-4 py-3 rounded-lg border-2 text-left transition ${
                  amoType === opt.value
                    ? 'bg-teal-100 border-teal-500'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`font-bold text-sm ${amoType === opt.value ? 'text-teal-800' : 'text-gray-700'}`}>
                  {opt.label}
                </div>
                <div className={`text-xs mt-0.5 ${amoType === opt.value ? 'text-teal-600' : 'text-gray-500'}`}>
                  {opt.cost} EUR TTC - {opt.description}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              L'accompagnement AMO ({amoCost} EUR TTC) est <strong>integralement pris en charge par l'ANAH</strong>.
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4: Resultat */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Euro className="w-5 h-5 text-teal-600" />
          Resultat de la simulation
        </h2>

        {!isEligible ? (
          <AlertBox type="error" title="Simulation impossible">
            Le profil de revenus selectionne n'est pas eligible a MaPrimeAdapt'.
            Seuls les menages aux revenus tres modestes (Bleu) et modestes (Jaune) peuvent en beneficier.
          </AlertBox>
        ) : calculation.worksCount === 0 ? (
          <AlertBox type="info" title="Aucun travaux selectionne">
            Selectionnez au moins un type de travaux ci-dessus pour obtenir une estimation.
          </AlertBox>
        ) : (
          <div className="space-y-4">
            {/* Main results grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total cost */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <ResultCard
                  label="Cout total travaux HT"
                  value={formatCurrency(calculation.totalCost)}
                  sublabel={`${calculation.worksCount} poste${calculation.worksCount > 1 ? 's' : ''} selectionne${calculation.worksCount > 1 ? 's' : ''}`}
                  className="text-gray-800"
                  size="sm"
                />
              </div>

              {/* Eligible amount */}
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
                <ResultCard
                  label="Montant eligible"
                  value={formatCurrency(calculation.eligibleAmount)}
                  sublabel={`Plafond : ${formatCurrency(EXPENSE_CEILING)} HT`}
                  className="text-teal-800"
                  size="sm"
                />
              </div>

              {/* Funding rate */}
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
                <ResultCard
                  label="Taux de financement"
                  value={`${Math.round(fundingRate * 100)}%`}
                  sublabel={`Profil ${revenueProfile}`}
                  className="text-teal-800"
                  size="sm"
                />
              </div>
            </div>

            {/* Prime amount - highlighted */}
            <div className="p-6 bg-teal-600 rounded-xl text-center">
              <ResultCard
                label="MaPrimeAdapt'"
                value={formatCurrency(calculation.primeAmount)}
                sublabel={`${Math.round(fundingRate * 100)}% de ${formatCurrency(calculation.eligibleAmount)}`}
                className="text-white"
                size="lg"
              />
            </div>

            {/* Reste a charge + AMO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 text-center">
                <ResultCard
                  label="Reste a charge"
                  value={formatCurrency(calculation.resteACharge)}
                  sublabel="Apres deduction de MaPrimeAdapt'"
                  className="text-orange-800"
                  size="md"
                />
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                <ResultCard
                  label="AMO (pris en charge ANAH)"
                  value={formatCurrency(amoCost)}
                  sublabel={amoOption?.description}
                  className="text-green-800"
                  size="md"
                />
              </div>
            </div>

            {/* Cumul info */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-blue-800 mb-1">Cumul possible avec :</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {CUMUL_INFO.map((info, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-blue-400 mt-0.5">-</span>
                        {info}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sauvegarde & PDF */}
      <SimulationSaveBar
        type="MaPrimeAdapt"
        title={`MaPrimeAdapt' - ${revenueProfile} - ${calculation.worksCount} poste(s)`}
        inputs={{
          eligibility,
          revenueProfile,
          amoType,
          selectedWorks,
        }}
        results={{
          totalCost: calculation.totalCost,
          eligibleAmount: calculation.eligibleAmount,
          fundingRate,
          primeAmount: calculation.primeAmount,
          resteACharge: calculation.resteACharge,
          amoCost,
        }}
        pdfData={{
          ficheCode: 'MaPrimeAdapt\'',
          ficheTitle: 'Aide a l\'adaptation du logement - Perte d\'autonomie',
          params: [
            { label: 'Critere d\'eligibilite', value: ELIGIBILITY_PROFILES.find(e => e.value === eligibility)?.label },
            { label: 'Profil de revenus', value: currentRevenue?.label },
            { label: 'Taux de financement', value: `${Math.round(fundingRate * 100)}%` },
            { label: 'Accompagnement AMO', value: `${amoOption?.label} (${amoCost} EUR TTC)` },
            { label: 'Travaux selectionnes', value: selectedWorkLabels.join(', ') || 'Aucun' },
          ],
          results: [
            { label: 'Cout total travaux HT', value: formatCurrency(calculation.totalCost) },
            { label: 'Montant eligible', value: formatCurrency(calculation.eligibleAmount) },
            { label: 'MaPrimeAdapt\'', value: formatCurrency(calculation.primeAmount) },
          ],
          summary: {
            projectCost: calculation.totalCost,
            ceeCommerciale: 0,
            mprFinal: calculation.primeAmount,
            totalAid: calculation.primeAmount,
            resteACharge: calculation.resteACharge,
          },
        }}
      />

      {/* Disclaimer */}
      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>
          Simulation basee sur le barreme MaPrimeAdapt' (ANAH). Plafond de depenses : {formatCurrency(EXPENSE_CEILING)} HT.
          Une 2e demande est possible dans les 5 ans si le plafond n'est pas atteint. Montants indicatifs et non contractuels.
        </p>
      </div>
    </SimulatorLayout>
  )
}
