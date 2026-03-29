import { useState, useMemo } from 'react'
import { Accessibility, Heart, Euro, ShieldCheck, Wrench, Info, CheckCircle, Bath, DoorOpen, ClipboardList, Filter, AlertTriangle, User, Home } from 'lucide-react'
import SimulatorLayout from '../components/simulator/SimulatorLayout'
import SimulationSaveBar from '../components/simulator/SimulationSaveBar'
import SelectField from '../components/ui/SelectField'
import InputField from '../components/ui/InputField'
import ResultCard from '../components/ui/ResultCard'
import AlertBox from '../components/ui/AlertBox'
import {
  ELIGIBILITY_PROFILES,
  OCCUPATION_TYPES,
  GIR_LEVELS,
  HANDICAP_TYPES,
  REVENUE_PROFILES,
  FUNDING_RATES,
  EXPENSE_CEILING,
  AMO_OPTIONS,
  WORK_CATEGORIES,
  CUMUL_INFO,
  ELIGIBLE_OCCUPANTS,
  getActiveTags,
  filterWorks,
} from '../lib/constants/maprimeadapt'
import { formatCurrency } from '../utils/formatters'

const CATEGORY_ICONS = {
  salle_de_bain: Bath,
  accessibilite: DoorOpen,
  securite: ShieldCheck,
  autres_travaux: Wrench,
}

const CATEGORY_COLORS = {
  blue: {
    header: 'bg-blue-50 border-blue-200',
    headerText: 'text-blue-800',
    check: 'accent-blue-600',
  },
  teal: {
    header: 'bg-teal-50 border-teal-200',
    headerText: 'text-teal-800',
    check: 'accent-teal-600',
  },
  amber: {
    header: 'bg-amber-50 border-amber-200',
    headerText: 'text-amber-800',
    check: 'accent-amber-600',
  },
  emerald: {
    header: 'bg-emerald-50 border-emerald-200',
    headerText: 'text-emerald-800',
    check: 'accent-emerald-600',
  },
}

const SEVERITY_COLORS = {
  high: 'bg-red-50 border-red-300 text-red-800',
  medium: 'bg-orange-50 border-orange-300 text-orange-800',
  low: 'bg-green-50 border-green-300 text-green-800',
}

export default function MaPrimeAdaptPage() {
  // --- Profil beneficiaire ---
  const [occupation, setOccupation] = useState('proprietaire')
  const [eligibility, setEligibility] = useState('70plus')
  const [girLevel, setGirLevel] = useState('')
  const [handicapType, setHandicapType] = useState('')
  const [revenueProfile, setRevenueProfile] = useState('Bleu')
  const [showAllWorks, setShowAllWorks] = useState(false)

  // Travaux selectionnes: { workId: { checked: bool, cost: number } }
  const [selectedWorks, setSelectedWorks] = useState({})

  // AMO
  const [amoType, setAmoType] = useState('complet')

  // --- Derived state ---
  const occupationInfo = OCCUPATION_TYPES.find(o => o.value === occupation)
  const isOccupationEligible = occupationInfo?.eligible !== false
  const currentRevenue = REVENUE_PROFILES.find(r => r.value === revenueProfile)
  const isRevenueEligible = currentRevenue?.eligible ?? false
  const isEligible = isOccupationEligible && isRevenueEligible
  const fundingRate = FUNDING_RATES[revenueProfile] || 0

  // AMO
  const amoOption = AMO_OPTIONS.find(a => a.value === amoType)
  const amoCost = amoOption?.cost || 600

  // Tags actifs en fonction du profil
  const activeTags = useMemo(() =>
    getActiveTags(eligibility, girLevel, handicapType),
    [eligibility, girLevel, handicapType]
  )

  // Travaux filtres selon le profil
  const filteredCategories = useMemo(() => {
    if (showAllWorks) return WORK_CATEGORIES
    return filterWorks(WORK_CATEGORIES, activeTags)
  }, [activeTags, showAllWorks])

  // Total travaux filtres vs total
  const totalFilteredWorks = filteredCategories.reduce((sum, cat) => sum + cat.works.length, 0)
  const totalAllWorks = WORK_CATEGORIES.reduce((sum, cat) => sum + cat.works.length, 0)

  // Decocher les travaux qui ne sont plus dans les filtres
  // (on laisse l'utilisateur gerer manuellement)

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

  // Profil description for summary
  const profileSummary = useMemo(() => {
    const parts = [ELIGIBILITY_PROFILES.find(e => e.value === eligibility)?.label]
    if (eligibility === '60_69_gir' && girLevel) {
      parts.push(GIR_LEVELS.find(g => g.value === girLevel)?.label)
    }
    if (eligibility === 'handicap' && handicapType) {
      parts.push(HANDICAP_TYPES.find(h => h.value === handicapType)?.label)
    }
    return parts.filter(Boolean).join(' — ')
  }, [eligibility, girLevel, handicapType])

  return (
    <SimulatorLayout
      code="MaPrimeAdapt'"
      title="Aide a l'adaptation du logement"
      description="Perte d'autonomie / Handicap - Aide ANAH"
    >
      {/* ============================================================= */}
      {/* SECTION 1: Profil du beneficiaire                             */}
      {/* ============================================================= */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Accessibility className="w-5 h-5 text-teal-600" />
          Profil du beneficiaire
        </h2>

        <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 space-y-5">

          {/* --- Type d'occupation --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-teal-600" />
              Type d'occupation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {OCCUPATION_TYPES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setOccupation(opt.value)}
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                    occupation === opt.value
                      ? opt.eligible === false
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-teal-100 border-teal-500 text-teal-800'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {!isOccupationEligible && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Les bailleurs et SCI ne sont <strong>pas eligibles</strong> a MaPrimeAdapt'. Seuls les proprietaires occupants et locataires du parc prive peuvent en beneficier.</span>
              </div>
            )}
          </div>

          {/* --- Critere d'eligibilite (situation) --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-teal-600" />
              Situation du beneficiaire
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ELIGIBILITY_PROFILES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setEligibility(opt.value)
                    // Reset sub-selections
                    if (opt.value !== '60_69_gir') setGirLevel('')
                    if (opt.value !== 'handicap') setHandicapType('')
                  }}
                  className={`px-3 py-2.5 rounded-lg border-2 text-left transition ${
                    eligibility === opt.value
                      ? 'bg-teal-100 border-teal-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-sm font-semibold ${eligibility === opt.value ? 'text-teal-800' : 'text-gray-600'}`}>
                    {opt.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${eligibility === opt.value ? 'text-teal-600' : 'text-gray-400'}`}>
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* --- Sous-filtre GIR (si 60-69 ans) --- */}
          {eligibility === '60_69_gir' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Niveau de dependance GIR
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {GIR_LEVELS.map(gir => (
                  <button
                    key={gir.value}
                    onClick={() => setGirLevel(gir.value)}
                    className={`px-3 py-2.5 rounded-lg border-2 text-left transition ${
                      girLevel === gir.value
                        ? SEVERITY_COLORS[gir.severity] + ' border-2'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold">{gir.label}</div>
                    <div className="text-xs mt-0.5 opacity-75">{gir.description}</div>
                  </button>
                ))}
              </div>
              {girLevel && (
                <div className="mt-2 flex items-center gap-2 text-sm text-teal-700 bg-teal-100/60 p-2.5 rounded-lg">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Les travaux affiches sont adaptes au niveau <strong>{GIR_LEVELS.find(g => g.value === girLevel)?.label}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* --- Sous-filtre Handicap --- */}
          {eligibility === 'handicap' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type de reconnaissance
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {HANDICAP_TYPES.map(h => (
                  <button
                    key={h.value}
                    onClick={() => setHandicapType(h.value)}
                    className={`px-3 py-2.5 rounded-lg border-2 text-left transition ${
                      handicapType === h.value
                        ? 'bg-purple-50 border-purple-400 text-purple-800'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold">{h.label}</div>
                    <div className="text-xs mt-0.5 opacity-75">{h.description}</div>
                  </button>
                ))}
              </div>
              {handicapType && (
                <div className="mt-2 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Les travaux affiches sont adaptes a votre profil <strong>{HANDICAP_TYPES.find(h => h.value === handicapType)?.label}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* --- Profil de revenus (precarite) --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Euro className="w-4 h-4 text-teal-600" />
              Profil de revenus (precarite)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REVENUE_PROFILES.map(r => {
                const isSelected = revenueProfile === r.value
                const colorMap = {
                  Bleu: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', label: 'text-blue-600' },
                  Jaune: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', label: 'text-yellow-600' },
                  Violet: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-800', label: 'text-purple-500' },
                  Rose: { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-800', label: 'text-pink-500' },
                }
                const c = colorMap[r.value]
                return (
                  <button
                    key={r.value}
                    onClick={() => setRevenueProfile(r.value)}
                    className={`px-3 py-3 rounded-lg border-2 text-center transition ${
                      isSelected
                        ? `${c.bg} ${c.border} ${c.text}`
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-bold">{r.value}</div>
                    <div className="text-xs mt-0.5">
                      {r.eligible ? `${Math.round(r.rate * 100)}%` : 'Non eligible'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* --- Resume d'eligibilite --- */}
          <div className={`p-3 rounded-lg border ${
            isEligible
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {isEligible ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <div className={`text-sm font-bold ${isEligible ? 'text-green-800' : 'text-red-800'}`}>
                  {isEligible ? 'Eligible a MaPrimeAdapt\'' : 'Non eligible a MaPrimeAdapt\''}
                </div>
                <div className={`text-xs ${isEligible ? 'text-green-700' : 'text-red-700'}`}>
                  {!isOccupationEligible && 'Bailleurs et SCI non eligibles. '}
                  {!isRevenueEligible && 'Seuls les profils Bleu et Jaune sont eligibles. '}
                  {isEligible && (
                    <>
                      {profileSummary} — Taux : <strong>{Math.round(fundingRate * 100)}%</strong> — Plafond : <strong>{formatCurrency(EXPENSE_CEILING)} HT</strong>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECTION 2: Travaux selectionnes (filtres par profil)          */}
      {/* ============================================================= */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-teal-600" />
          Travaux selectionnes
        </h2>

        {/* Filter toggle + counter */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>
              <strong>{totalFilteredWorks}</strong> travaux affiches sur {totalAllWorks}
              {!showAllWorks && ' (filtres selon le profil)'}
            </span>
          </div>
          <button
            onClick={() => setShowAllWorks(!showAllWorks)}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${
              showAllWorks
                ? 'bg-teal-100 border-teal-400 text-teal-700'
                : 'bg-white border-gray-300 text-gray-500 hover:border-teal-400'
            }`}
          >
            {showAllWorks ? 'Filtrer par profil' : 'Afficher tous les travaux'}
          </button>
        </div>

        <div className="space-y-4">
          {filteredCategories.map(category => {
            const IconComp = CATEGORY_ICONS[category.id] || Wrench
            const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.teal

            return (
              <div key={category.id} className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Category header */}
                <div className={`px-4 py-3 flex items-center justify-between border-b ${colors.header}`}>
                  <div className="flex items-center gap-2">
                    <IconComp className={`w-5 h-5 ${colors.headerText}`} />
                    <h3 className={`font-bold ${colors.headerText}`}>{category.title}</h3>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 ${colors.headerText}`}>
                    {category.works.length} poste{category.works.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Works list */}
                <div className="divide-y divide-gray-100">
                  {category.works.map(work => {
                    const isChecked = selectedWorks[work.id]?.checked || false
                    // Check if this work is "recommended" for the profile (has a specific tag, not just 'all')
                    const isRecommended = work.tags.some(t => t !== 'all' && activeTags.has(t))
                    const isGeneral = work.tags.includes('all')

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
                          {!showAllWorks && isRecommended && !isGeneral && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 uppercase shrink-0">
                              Recommande
                            </span>
                          )}
                        </div>

                        {/* Cost input */}
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

      {/* ============================================================= */}
      {/* SECTION 3: Accompagnement AMO                                 */}
      {/* ============================================================= */}
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

          {/* AMO recommendation based on profile */}
          {eligibility === '60_69_gir' && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <Info className="w-4 h-4 shrink-0" />
              <span>Pour les personnes en perte d'autonomie GIR, l'option <strong>AMO + Ergotherapie</strong> est recommandee pour un diagnostic adapte.</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              L'accompagnement AMO ({amoCost} EUR TTC) est <strong>integralement pris en charge par l'ANAH</strong>.
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECTION 4: Resultat                                           */}
      {/* ============================================================= */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Euro className="w-5 h-5 text-teal-600" />
          Resultat de la simulation
        </h2>

        {!isEligible ? (
          <AlertBox type="error" title="Simulation impossible">
            {!isOccupationEligible
              ? 'Les bailleurs et SCI ne sont pas eligibles a MaPrimeAdapt\'. Seuls les proprietaires occupants et locataires du parc prive peuvent en beneficier.'
              : 'Le profil de revenus selectionne n\'est pas eligible a MaPrimeAdapt\'. Seuls les menages aux revenus tres modestes (Bleu) et modestes (Jaune) peuvent en beneficier.'
            }
          </AlertBox>
        ) : calculation.worksCount === 0 ? (
          <AlertBox type="info" title="Aucun travaux selectionne">
            Selectionnez au moins un type de travaux ci-dessus pour obtenir une estimation.
          </AlertBox>
        ) : (
          <div className="space-y-4">
            {/* Profile recap */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-1">
                <User className="w-4 h-4 text-teal-600" />
                Recapitulatif profil
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                <span><strong>Occupation :</strong> {occupationInfo?.label}</span>
                <span><strong>Situation :</strong> {profileSummary}</span>
                <span><strong>Revenus :</strong> {currentRevenue?.label}</span>
              </div>
            </div>

            {/* Main results grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <ResultCard
                  label="Cout total travaux HT"
                  value={formatCurrency(calculation.totalCost)}
                  sublabel={`${calculation.worksCount} poste${calculation.worksCount > 1 ? 's' : ''} selectionne${calculation.worksCount > 1 ? 's' : ''}`}
                  className="text-gray-800"
                  size="sm"
                />
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
                <ResultCard
                  label="Montant eligible"
                  value={formatCurrency(calculation.eligibleAmount)}
                  sublabel={`Plafond : ${formatCurrency(EXPENSE_CEILING)} HT`}
                  className="text-teal-800"
                  size="sm"
                />
              </div>

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

            {/* Prime amount */}
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
          occupation,
          eligibility,
          girLevel,
          handicapType,
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
            { label: 'Occupation', value: occupationInfo?.label },
            { label: 'Situation', value: profileSummary },
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
