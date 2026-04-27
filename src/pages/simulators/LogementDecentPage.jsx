import { useState, useMemo } from 'react'
import {
  Users, Home, Shield, Wrench, Euro, Award, Info,
  AlertTriangle, Building, UserCheck,
} from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import WorkPostes from '../../components/simulator/WorkPostes'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import AlertBox from '../../components/ui/AlertBox'
import AidesChart from '../../components/ui/AidesChart'
import {
  INCOME_PROFILES,
  BENEFICIARY_TYPES,
  OCCUPATION_TYPES,
  OCCUPANT_FUNDING,
  BAILLEUR_CATEGORIES,
  WORK_CATEGORIES,
  TVA_RATES,
  ENERGY_CLASSES,
  TARGET_CLASSES,
  CLASS_ORDER,
  CLASSES_PASSOIRE,
  AMO,
  getEligibility,
} from '../../lib/constants/logementDecent'
import { calculateOccupant, calculateBailleur, getClassJump } from '../../lib/calculators/logementDecent'
import { formatCurrency } from '../../utils/formatters'
import { getDpeColor } from '../../utils/dpeApi'

export default function LogementDecentPage() {
  // ─── Profil ───
  const [beneficiaryType, setBeneficiaryType] = useState('pp_occupant')
  const [occupation, setOccupation] = useState('principale')
  const [incomeProfile, setIncomeProfile] = useState('Bleu')

  // ─── DPE ───
  const [classInitiale, setClassInitiale] = useState('G')
  const [classCible, setClassCible] = useState('D')
  const [classeEAtteignable, setClasseEAtteignable] = useState(true)

  // ─── Bailleur ───
  const [bailleurCategory, setBailleurCategory] = useState('indigne')
  const [surface, setSurface] = useState(70)

  // ─── MAR (Mon Accompagnateur Rénov') ───
  const [marCostTTC, setMarCostTTC] = useState(2000)

  // ─── Travaux (même pattern que BarTh174Page) ───
  const [workMode, setWorkMode] = useState('rapide')
  const [workItems, setWorkItems] = useState([])
  // Mode rapide : coûts manuels
  const [projectCostHT, setProjectCostHT] = useState(45000)
  const [projectCostTTC, setProjectCostTTC] = useState(Math.round(45000 * 1.055))
  const [projectTva, setProjectTva] = useState(5.5)
  const [costInputMode, setCostInputMode] = useState('ht')

  const isOccupant = beneficiaryType === 'pp_occupant'
  const isBailleur = beneficiaryType === 'pp_bailleur'

  // ─── Handlers coûts manuels ───
  function handleProjectCostHT(val) {
    const ht = Number(val) || 0
    setProjectCostHT(ht)
    setProjectCostTTC(Math.round(ht * (1 + projectTva / 100)))
  }
  function handleProjectCostTTC(val) {
    const ttc = Number(val) || 0
    setProjectCostTTC(ttc)
    setProjectCostHT(Math.round(ttc / (1 + projectTva / 100)))
  }
  function handleProjectTva(val) {
    const tva = Number(val)
    setProjectTva(tva)
    if (costInputMode === 'ht') {
      setProjectCostTTC(Math.round(projectCostHT * (1 + tva / 100)))
    } else {
      setProjectCostHT(Math.round(projectCostTTC / (1 + tva / 100)))
    }
  }

  // ─── Calculs dérivés ───
  const eligibility = getEligibility(beneficiaryType, occupation, incomeProfile)
  const jumps = getClassJump(classInitiale, classCible)
  const isPassoire = CLASSES_PASSOIRE.includes(classInitiale)

  // Totaux depuis les postes (mode détaillé)
  const postesTotalHT = workItems.reduce((s, w) => s + (Number(w.prixHT) || 0), 0)
  const postesTotalTVA = workItems.reduce((s, w) => {
    const ht = Number(w.prixHT) || 0
    return s + Math.round(ht * (Number(w.tva) || 5.5) / 100)
  }, 0)
  const postesTotalTTC = postesTotalHT + postesTotalTVA

  // Coûts effectifs selon le mode
  const effectiveCostHT = workMode === 'detaille' && postesTotalHT > 0 ? postesTotalHT : projectCostHT
  const effectiveCostTTC = workMode === 'detaille' && postesTotalTTC > 0 ? postesTotalTTC : projectCostTTC

  // Plafond pour helper
  const currentPlafond = isOccupant
    ? (classeEAtteignable ? OCCUPANT_FUNDING.principal.plafondHT : OCCUPANT_FUNDING.derogatoire.plafondHT)
    : (() => { const c = BAILLEUR_CATEGORIES.find((b) => b.value === bailleurCategory); return c ? c.prixM2 * Math.min(surface, c.surfaceMax) : 0 })()

  // Taux affiché
  const displayTaux = isOccupant
    ? Math.round((OCCUPANT_FUNDING[classeEAtteignable ? 'principal' : 'derogatoire'].taux[incomeProfile] || 0) * 100)
    : Math.round(((BAILLEUR_CATEGORIES.find((c) => c.value === bailleurCategory)?.taux || 0)) * 100)

  // ─── Résultat ───
  const result = useMemo(() => {
    if (!eligibility.eligible || effectiveCostHT <= 0) return null

    if (isOccupant) {
      return calculateOccupant({
        classInitiale,
        classCible,
        incomeProfile,
        projectCostHT: effectiveCostHT,
        projectCostTTC: effectiveCostTTC,
        classeEAtteignable,
        marCostTTC,
      })
    }

    return calculateBailleur({
      classInitiale,
      classCible,
      bailleurCategory,
      surface,
      projectCostHT: effectiveCostHT,
      projectCostTTC: effectiveCostTTC,
      incomeProfile,
      marCostTTC,
    })
  }, [beneficiaryType, classInitiale, classCible, incomeProfile, bailleurCategory, surface, effectiveCostHT, effectiveCostTTC, classeEAtteignable, eligibility.eligible, isOccupant, marCostTTC])

  const finalResult = result

  // Info aide potentielle
  const aideInfo = useMemo(() => {
    if (!result) return null
    const marge = result.margeResiduelle
    if (marge > 1000) {
      const pot = Math.round(marge * result.taux)
      return `Plafond éligible : ${formatCurrency(result.plafondHT)} HT — il reste ${formatCurrency(marge)} HT de travaux ajoutables, soit jusqu'à ${formatCurrency(pot)} d'aide supplémentaire.`
    }
    return null
  }, [result])

  const worksLabels = workItems.map(w => w.label || w.type).filter(Boolean).join(', ')

  return (
    <SimulatorLayout
      code="LOGEMENT-DECENT"
      title="Ma Prime Logement Décent"
      description="Rénovation globale d'un logement dégradé ou indigne — ANAH 2026"
    >
      {/* ─── PROFIL ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-violet-600" />
          Profil du bénéficiaire
        </h2>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Type de bénéficiaire"
              id="beneficiaryType"
              value={beneficiaryType}
              onChange={setBeneficiaryType}
              options={BENEFICIARY_TYPES}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Occupation du logement</label>
              <div className="flex gap-2">
                {OCCUPATION_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOccupation(opt.value)}
                    className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                      occupation === opt.value
                        ? 'bg-violet-100 border-violet-500 text-violet-800'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Profil de revenus"
              id="incomeProfile"
              value={incomeProfile}
              onChange={setIncomeProfile}
              options={INCOME_PROFILES.map((p) => ({
                value: p.value,
                label: `${p.value} — ${p.label}${!p.eligible ? ' (non éligible)' : ''}`,
              }))}
            />
            {isBailleur && (
              <InputField
                label="Surface habitable (m²)"
                type="number"
                id="surface"
                value={surface}
                onChange={setSurface}
                min={1}
                suffix="m²"
                helper="Plafond calculé sur max 80 m²"
              />
            )}
          </div>
        </div>
      </section>

      {/* ─── ÉLIGIBILITÉ ─── */}
      {eligibility.eligible ? (
        <div className="p-4 rounded-xl border-2 bg-green-50 border-green-400 text-center font-bold text-lg text-green-800">
          Ma Prime Logement Décent — Financement ANAH {displayTaux}%
        </div>
      ) : (
        <div className="p-4 rounded-xl border-2 bg-red-50 border-red-400 text-center font-bold text-lg text-red-800">
          Non éligible
        </div>
      )}

      <AlertBox type={eligibility.alert || 'info'} show={true}>
        <span>{eligibility.reason}</span>
      </AlertBox>

      {/* ─── DPE ─── */}
      {eligibility.eligible && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-green-600" />
            Diagnostic de performance énergétique
          </h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Classe DPE initiale" id="classInitiale" value={classInitiale} onChange={setClassInitiale} options={ENERGY_CLASSES} />
              <SelectField label="Classe DPE cible (après travaux)" id="classCible" value={classCible} onChange={setClassCible} options={TARGET_CLASSES} />
            </div>

            {/* Indicateur visuel DPE */}
            <div className="flex items-center justify-center gap-3 py-3 px-4 bg-white rounded-xl border border-gray-200">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-sm"
                style={{ backgroundColor: getDpeColor(classInitiale).bg, color: getDpeColor(classInitiale).text }}
              >
                {classInitiale}
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  {CLASS_ORDER.slice(CLASS_ORDER.indexOf(classInitiale), CLASS_ORDER.indexOf(classCible) + 1).map((c, i) => (
                    <div key={c} className="flex items-center gap-0.5">
                      {i > 0 && <div className="w-2 h-0.5 bg-gray-300 rounded" />}
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          c === classInitiale || c === classCible ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-50'
                        }`}
                        style={{ backgroundColor: getDpeColor(c).bg, color: getDpeColor(c).text }}
                      >
                        {c}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  jumps > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                }`}>
                  {jumps > 0 ? `+${jumps} classe${jumps > 1 ? 's' : ''}` : 'Aucun saut'}
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-sm"
                style={{ backgroundColor: getDpeColor(classCible).bg, color: getDpeColor(classCible).text }}
              >
                {classCible}
              </div>
            </div>

            {/* Badges passoire / sortie */}
            <div className="flex flex-wrap gap-2 justify-center">
              {isPassoire && (
                <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  Passoire énergétique (classe {classInitiale})
                </span>
              )}
              {isPassoire && !CLASSES_PASSOIRE.includes(classCible) && (
                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  Sortie de passoire → Prime +10%
                </span>
              )}
              {isOccupant && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  CLASS_ORDER.indexOf(classCible) >= CLASS_ORDER.indexOf('E')
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  Sortie min : E — Cible : {classCible}
                </span>
              )}
            </div>

            {/* Classe E atteignable ? */}
            {isOccupant && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!classeEAtteignable}
                    onChange={(e) => setClasseEAtteignable(!e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-800">La classe E n'est pas atteignable</span>
                    <p className="text-xs text-gray-500">
                      Mode dérogatoire : 50% de {formatCurrency(50000)} HT max (au lieu de {displayTaux}% de {formatCurrency(70000)} HT)
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── CATÉGORIE BAILLEUR ─── */}
      {eligibility.eligible && isBailleur && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            Catégorie de travaux (bailleur)
          </h2>
          <div className="space-y-2">
            {BAILLEUR_CATEGORIES.map((cat) => {
              const isActive = bailleurCategory === cat.value
              const plafond = cat.prixM2 * Math.min(surface, cat.surfaceMax)
              return (
                <button
                  key={cat.value}
                  onClick={() => setBailleurCategory(cat.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-bold ${isActive ? 'text-emerald-800' : 'text-gray-800'}`}>
                        {cat.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs font-semibold text-gray-700">
                        {cat.prixM2} €/m² × {Math.min(surface, cat.surfaceMax)} m²
                      </p>
                      <p className="text-sm font-bold text-emerald-700">
                        Plafond : {formatCurrency(plafond)} HT — Taux : {Math.round(cat.taux * 100)}%
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── POSTES DE TRAVAUX (WorkPostes comme réno globale) ─── */}
      {eligibility.eligible && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-indigo-600" />
            Postes de travaux
          </h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <WorkPostes
              workGroups={WORK_CATEGORIES}
              workItems={workItems}
              onChange={setWorkItems}
              mode={workMode}
              onModeChange={setWorkMode}
              projectCostHT={projectCostHT}
              onProjectCostHTChange={setProjectCostHT}
              projectCostTTC={projectCostTTC}
              onProjectCostTTCChange={setProjectCostTTC}
              aideLabel={finalResult ? `Aide ANAH (${Math.round(result.taux * 100)}%)` : null}
              aideAmount={finalResult ? finalResult.aideFinale : 0}
              resteACharge={finalResult?.resteACharge}
              aideInfo={aideInfo}
            />
          </div>
        </section>
      )}

      {/* ─── COÛTS (mode rapide uniquement) ─── */}
      {eligibility.eligible && workMode === 'rapide' && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-green-600" />
            Coût du projet
          </h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
              <button onClick={() => setCostInputMode('ht')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${costInputMode === 'ht' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Saisir en HT</button>
              <button onClick={() => setCostInputMode('ttc')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${costInputMode === 'ttc' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Saisir en TTC</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Coût HT (€)" type="number" id="projectCostHT" value={projectCostHT}
                onChange={costInputMode === 'ht' ? handleProjectCostHT : setProjectCostHT}
                min={0} suffix="€ HT" readOnly={costInputMode === 'ttc'}
                helper={`Plafond : ${formatCurrency(currentPlafond)} HT`}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">TVA</label>
                <select value={projectTva} onChange={(e) => handleProjectTva(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none bg-white">
                  {TVA_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <InputField
                label="Coût TTC (€)" type="number" id="projectCostTTC" value={projectCostTTC}
                onChange={costInputMode === 'ttc' ? handleProjectCostTTC : setProjectCostTTC}
                min={0} suffix="€ TTC" readOnly={costInputMode === 'ht'}
              />
            </div>
          </div>
        </section>
      )}

      {/* ─── MON ACCOMPAGNATEUR RÉNOV' (MAR) ─── */}
      {eligibility.eligible && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-violet-600" />
            Mon Accompagnateur Rénov' (MAR)
          </h2>
          <div className="bg-violet-50 p-4 rounded-xl border border-violet-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Coût de l'accompagnement TTC"
                type="number"
                id="marCostTTC"
                value={marCostTTC}
                onChange={(v) => setMarCostTTC(Number(v) || 0)}
                min={0}
                suffix="€ TTC"
                helper={`Plafond ANAH : ${formatCurrency(AMO.plafondTTC)} TTC — Taux : ${Math.round((AMO.taux[incomeProfile] || 0) * 100)}%`}
              />
              <div className="flex items-end pb-1">
                <div className="bg-white p-3 rounded-lg border border-violet-200 w-full text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aide MAR</span>
                    <span className="font-semibold text-violet-700">
                      {formatCurrency(Math.round(Math.min(marCostTTC, AMO.plafondTTC) * (AMO.taux[incomeProfile] || 0)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reste à charge MAR</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(Math.max(0, marCostTTC - Math.round(Math.min(marCostTTC, AMO.plafondTTC) * (AMO.taux[incomeProfile] || 0))))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-violet-600">
              Accompagnement obligatoire par un opérateur agréé (Mon Accompagnateur Rénov'). L'aide couvre jusqu'à {Math.round((AMO.taux[incomeProfile] || 0) * 100)}% du coût, plafonné à {formatCurrency(AMO.plafondTTC)} TTC.
            </p>
          </div>
        </section>
      )}

      {/* ─── RÉCAP FINANCIER SÉPARÉ ─── */}
      {eligibility.eligible && finalResult && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-emerald-600" />
            Récapitulatif financier
          </h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Dépenses */}
            <div className="bg-white divide-y divide-gray-100">
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dépenses</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-600">Travaux HT</span>
                <span className="font-semibold text-gray-800">{formatCurrency(effectiveCostHT)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-600">TVA ({workMode === 'rapide' ? `${projectTva}%` : 'détail'})</span>
                <span className="font-semibold text-gray-800">{formatCurrency(effectiveCostTTC - effectiveCostHT)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-gray-50">
                <span className="font-bold text-gray-800">Total Travaux TTC</span>
                <span className="font-bold text-gray-800 text-base">{formatCurrency(effectiveCostTTC)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-violet-500" />
                  Mon Accompagnateur Rénov' (MAR)
                </span>
                <span className="font-semibold text-gray-800">{formatCurrency(result.marCostTTC)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-gray-100">
                <span className="font-bold text-gray-900">COÛT TOTAL PROJET</span>
                <span className="font-bold text-gray-900 text-base">{formatCurrency(effectiveCostTTC + result.marCostTTC)}</span>
              </div>
            </div>

            {/* Aides */}
            <div className="bg-emerald-50 divide-y divide-emerald-100">
              <div className="px-4 py-2 bg-emerald-100/60">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Aides</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-emerald-700">Aide Travaux ANAH ({Math.round(result.taux * 100)}%)</span>
                <span className="font-semibold text-emerald-700">- {formatCurrency(result.aideTravaux)}</span>
              </div>
              {result.sortiePassoire && (isOccupant ? result.primeSortiePassoire > 0 : result.primePassoire > 0) && (
                <div className="flex justify-between px-4 py-2 text-xs">
                  <span className="text-emerald-600 pl-4">dont prime sortie passoire {isOccupant ? '(+10%)' : ''}</span>
                  <span className="font-semibold text-emerald-600">incluse</span>
                </div>
              )}
              {result.aideAvantEcretement > result.aideTravaux && (
                <div className="flex justify-between px-4 py-2 text-xs">
                  <span className="text-amber-600 pl-4 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Écrêtement ({Math.round((result.ecretementRate || 1) * 100)}% TTC)
                  </span>
                  <span className="font-semibold text-amber-600">plafonné</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-violet-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Aide MAR ({Math.round((result.amoTaux || 0) * 100)}%)
                </span>
                <span className="font-semibold text-violet-700">- {formatCurrency(result.aideMar)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-emerald-100/60">
                <span className="font-bold text-emerald-800">TOTAL AIDES</span>
                <span className="font-bold text-emerald-800 text-base">- {formatCurrency(result.totalAides)}</span>
              </div>
            </div>

            {/* Reste à charge */}
            <div className="bg-indigo-50 divide-y divide-indigo-100">
              <div className="px-4 py-2 bg-indigo-100/60">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Reste à charge</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-indigo-700">Reste à charge Travaux</span>
                <span className="font-semibold text-indigo-700">{formatCurrency(result.resteAChargeTravaux)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-indigo-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Reste à charge MAR
                </span>
                <span className="font-semibold text-indigo-700">{formatCurrency(result.resteAChargeMar)}</span>
              </div>
              <div className="flex justify-between px-4 py-3.5 text-sm bg-indigo-100/60">
                <span className="font-extrabold text-indigo-900">RESTE À CHARGE TOTAL</span>
                <span className="font-extrabold text-indigo-900 text-lg">{formatCurrency(result.resteACharge)}</span>
              </div>
            </div>

            {aideInfo && (
              <div className="px-4 py-2.5 bg-blue-50 text-xs text-blue-700 flex items-start gap-1.5 border-t border-blue-100">
                <span className="mt-0.5">💡</span>
                <span>{aideInfo}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── RÉSULTATS ─── */}
      {eligibility.eligible && finalResult && (
        <>
          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-green-600" />
              Ma Prime Logement Décent — Résultat
            </h2>

            <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                <div className="bg-white p-3 rounded-lg border">
                  <span className="font-semibold">Mode :</span> {result.modeLabel}
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <span className="font-semibold">Taux :</span> {Math.round(result.taux * 100)}%
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <span className="font-semibold">Dépense éligible :</span> {formatCurrency(result.depenseEligible)} HT
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="bg-white p-3 rounded-lg border">
                  <span className="font-semibold">Plafond HT :</span> {formatCurrency(result.plafondHT)}
                  {isBailleur && result.prixM2 && (
                    <span className="text-xs text-gray-400 ml-1">({result.prixM2} €/m² × {result.surfaceEligible} m²)</span>
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <span className="font-semibold">Écrêtement :</span> {Math.round((result.ecretementRate || 1) * 100)}% du TTC
                  <span className="text-xs text-gray-400 ml-1">({formatCurrency(result.plafondEcretement)})</span>
                </div>
              </div>
            </div>

            {/* Hero result */}
            <div className="bg-green-800 rounded-xl p-6 text-white shadow-xl mt-4">
              {/* Aide Travaux */}
              <div className="text-center">
                <p className="text-green-200 text-xs uppercase tracking-wider mb-1">Aide Travaux ANAH</p>
                <p className="font-extrabold text-3xl text-green-300">{formatCurrency(result.aideTravaux)}</p>
                <p className="text-green-300 text-xs mt-1">{Math.round(result.taux * 100)}% × {formatCurrency(result.depenseEligible)} HT</p>
              </div>

              {result.sortiePassoire && (isOccupant ? result.primeSortiePassoire > 0 : result.primePassoire > 0) && (
                <div className="flex justify-between items-center text-sm mt-2 px-2">
                  <span className="text-green-200 text-xs">dont prime sortie passoire {isOccupant ? '(+10%)' : ''}</span>
                  <span className="font-semibold text-yellow-300 text-xs">+ {formatCurrency(isOccupant ? result.primeSortiePassoire : result.primePassoire)}</span>
                </div>
              )}

              {result.aideAvantEcretement > result.aideTravaux && (
                <div className="flex justify-between items-center text-xs mt-1 px-2">
                  <span className="text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Écrêtement ({Math.round((result.ecretementRate || 1) * 100)}% TTC)
                  </span>
                  <span className="font-semibold text-amber-300">plafonné</span>
                </div>
              )}

              {/* Aide MAR */}
              <hr className="border-green-700 my-3" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-violet-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  Aide MAR ({Math.round((result.amoTaux || 0) * 100)}%)
                </span>
                <span className="font-bold text-violet-300">+ {formatCurrency(result.aideMar)}</span>
              </div>

              {/* Total */}
              <hr className="border-green-600 my-4" />
              <div className="flex justify-between items-center text-xl">
                <span className="font-bold">TOTAL AIDES :</span>
                <span className="font-extrabold text-3xl text-yellow-300">{formatCurrency(result.totalAides)}</span>
              </div>

              {/* Reste à charge séparé */}
              <hr className="border-green-700 my-4" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-900/50 rounded-lg p-3 text-center">
                  <p className="text-green-300 text-xs mb-1">Reste à charge Travaux</p>
                  <p className="font-bold text-white text-lg">{formatCurrency(result.resteAChargeTravaux)}</p>
                </div>
                <div className="bg-green-900/50 rounded-lg p-3 text-center">
                  <p className="text-violet-300 text-xs mb-1">Reste à charge MAR</p>
                  <p className="font-bold text-white text-lg">{formatCurrency(result.resteAChargeMar)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-lg pt-3 mt-1">
                <span className="font-bold text-green-200">RESTE À CHARGE TOTAL :</span>
                <span className="font-extrabold text-2xl text-white">{formatCurrency(result.resteACharge)}</span>
              </div>
            </div>

            {aideInfo && (
              <div className="mt-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start gap-1.5">
                <span className="mt-0.5">💡</span>
                <span>{aideInfo}</span>
              </div>
            )}

            <div className="mt-4 px-1">
              <AidesChart
                aideAmount={result.totalAides}
                aideLabel="Ma Prime Logement Décent"
                resteACharge={result.resteACharge}
                totalTTC={effectiveCostTTC + result.marCostTTC}
              />
            </div>
          </section>

          <SimulationSaveBar
            type="LOGEMENT-DECENT"
            title={`Logement Décent (${result.modeLabel}) — ${classInitiale}→${classCible} — ${formatCurrency(result.totalAides)}`}
            inputs={{
              beneficiaryType, occupation, incomeProfile, classInitiale, classCible,
              classeEAtteignable, bailleurCategory, surface, workItems, workMode,
              projectCostHT: effectiveCostHT, projectCostTTC: effectiveCostTTC, projectTva,
              marCostTTC,
            }}
            results={result}
            pdfData={{
              ficheCode: 'LOGEMENT-DECENT',
              ficheTitle: result.modeLabel,
              classInitiale,
              classCible,
              jumps,
              mprCategory: incomeProfile,
              workItems,
              programLabel: 'Ma Prime Logement Decent',
              programBadge: result.modeLabel,
              aideLabel: 'AIDE ANAH — LOGEMENT DECENT',
              infoCards: [
                { label: 'Taux de financement', value: `${Math.round(result.taux * 100)}%`, color: [22, 163, 74] },
                { label: 'Plafond HT', value: formatCurrency(result.plafondHT) },
                { label: 'Depense eligible', value: formatCurrency(result.depenseEligible) },
                { label: `Ecretement (${Math.round((result.ecretementRate || 1) * 100)}% TTC)`, value: formatCurrency(result.plafondEcretement || 0) },
              ],
              advantages: [
                'Aide ANAH jusqu\'a 80% de prise en charge pour les menages tres modestes',
                'Mise en securite et salubrite de votre logement',
                'Amelioration de la performance energetique (sortie de passoire)',
                'Valorisation de votre patrimoine immobilier',
                'Accompagnement par un operateur agree (AMO)',
              ],
              params: [
                { label: 'Beneficiaire', value: BENEFICIARY_TYPES.find((b) => b.value === beneficiaryType)?.label || beneficiaryType },
                { label: 'Occupation', value: occupation === 'principale' ? 'Residence principale' : 'Residence secondaire' },
                { label: 'Profil revenus', value: `${incomeProfile} — ${INCOME_PROFILES.find((p) => p.value === incomeProfile)?.label}` },
                { label: 'DPE initial', value: `Classe ${classInitiale}` },
                { label: 'DPE cible', value: `Classe ${classCible} (+${jumps} classes)` },
                ...(isBailleur ? [
                  { label: 'Surface habitable', value: `${surface} m2` },
                  { label: 'Categorie bailleur', value: result.modeLabel },
                ] : [
                  { label: 'Mode', value: classeEAtteignable ? 'Classe E atteignable' : 'Mode derogatoire' },
                ]),
                { label: 'Travaux', value: worksLabels || 'Non renseigne' },
                { label: 'Cout MAR (TTC)', value: formatCurrency(result.marCostTTC) },
              ],
              results: [
                { label: 'Depense eligible HT', value: formatCurrency(result.depenseEligible) },
                { label: `Aide Travaux ANAH (${Math.round(result.taux * 100)}%)`, value: formatCurrency(result.aideTravaux) },
                ...(result.sortiePassoire && isOccupant && result.primeSortiePassoire > 0
                  ? [{ label: 'Prime sortie passoire (+10%)', value: formatCurrency(result.primeSortiePassoire) }] : []),
                ...(result.sortiePassoire && isBailleur && result.primePassoire > 0
                  ? [{ label: 'Prime sortie passoire', value: formatCurrency(result.primePassoire) }] : []),
                ...(result.aideAvantEcretement > result.aideTravaux
                  ? [{ label: `Ecretement (${Math.round((result.ecretementRate || 1) * 100)}% TTC)`, value: `Plafonne a ${formatCurrency(result.aideTravaux)}` }] : []),
                { label: `Aide MAR (${Math.round((result.amoTaux || 0) * 100)}%)`, value: formatCurrency(result.aideMar) },
                { label: 'Total aides', value: formatCurrency(result.totalAides), bold: true },
                { label: 'Reste a charge Travaux', value: formatCurrency(result.resteAChargeTravaux) },
                { label: 'Reste a charge MAR', value: formatCurrency(result.resteAChargeMar) },
                { label: 'Reste a charge total', value: formatCurrency(result.resteACharge), bold: true },
              ],
              summary: {
                projectCost: result.projectCostTTC + result.marCostTTC,
                ceeCommerciale: 0,
                mprFinal: result.totalAides,
                totalAid: result.totalAides,
                resteACharge: result.resteACharge,
                showMpr: true,
              },
              margin: { ceeBase: 0, ceeApplied: 0, margin: 0, marginPercent: 0, showOnPdf: false },
              mode: 'anah',
            }}
          />
        </>
      )}

      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation basée sur le guide des aides financières ANAH — Février 2026 (pages 64-66). Montants indicatifs et non contractuels. Audit énergétique obligatoire.</p>
      </div>
    </SimulatorLayout>
  )
}
