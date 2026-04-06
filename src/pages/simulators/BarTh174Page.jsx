import { useState, useMemo } from 'react'
import { Home, Calculator, Euro, TrendingUp, Award, Users, Building, ArrowRight } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import Slider from '../../components/ui/Slider'
import AidesChart from '../../components/ui/AidesChart'
import WorkPostes from '../../components/simulator/WorkPostes'
import {
  ENERGY_CLASSES,
  TARGET_CLASSES,
  WORK_GROUPS_MAISON,
  MIN_CLASS_JUMP,
  CLASS_ORDER,
  CLASSES_ANAH,
  MPR_INCOME_OPTIONS,
  MPR_PARCOURS_TAUX,
  MPR_PARCOURS_PLAFOND,
  PRIX_CEE_DEFAUT,
  BENEFICIARY_TYPES,
  OCCUPATION_TYPES,
  TVA_RATES,
  getEligibility,
} from '../../lib/constants/renovationGlobale'
import { calculateRenovationGlobale } from '../../lib/calculators/renovationGlobale'
import { formatCurrency, formatKWhc } from '../../utils/formatters'
import { getDpeColor } from '../../utils/dpeApi'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'

export default function BarTh174Page() {
  const { getDefault } = useSimulatorContext('BAR-TH-174')

  const [beneficiaryType, setBeneficiaryType] = useState(() => getDefault('beneficiaryType', 'pp_occupant'))
  const [occupation, setOccupation] = useState(() => getDefault('occupation', 'principale'))
  const [classInitiale, setClassInitiale] = useState(() => getDefault('classInitiale', 'F'))
  const [classCible, setClassCible] = useState(() => getDefault('classCible', 'C'))
  const [surface, setSurface] = useState(() => getDefault('surface', 100))
  const [mprCategory, setMprCategory] = useState(() => getDefault('mprCategory', 'Bleu'))
  const [priceMWhPrecaire, setPriceMWhPrecaire] = useState(() => getDefault('priceMWhPrecaire', PRIX_CEE_DEFAUT.precaire))
  const [priceMWhClassique, setPriceMWhClassique] = useState(() => getDefault('priceMWhClassique', PRIX_CEE_DEFAUT.classique))
  const [ceePercent, setCeePercent] = useState(() => getDefault('ceePercent', 100))
  const [chauffageActuel, setChauffageActuel] = useState(() => getDefault('chauffageActuel', null))

  // Travaux
  const [workMode, setWorkMode] = useState(() => getDefault('workMode', 'rapide'))
  const [workItems, setWorkItems] = useState(() => getDefault('workItems', []))
  // Mode rapide : coûts manuels
  const [projectCostHT, setProjectCostHT] = useState(() => getDefault('projectCostHT', 35000))
  const [projectCostTTC, setProjectCostTTC] = useState(() => getDefault('projectCostTTC', 38500))
  const [projectTva, setProjectTva] = useState(() => getDefault('projectTva', 5.5))
  const [costInputMode, setCostInputMode] = useState('ht') // 'ht' ou 'ttc'

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

  const eligibility = getEligibility(beneficiaryType, occupation, classInitiale)

  const jumps = CLASS_ORDER.indexOf(classCible) - CLASS_ORDER.indexOf(classInitiale)
  const isValidJump = jumps >= MIN_CLASS_JUMP

  // Valider 2 gestes d'isolation distincts (combles, murs, fenetres, plancher)
  const isolationGroup = WORK_GROUPS_MAISON.find(g => g.group === 'isolation')
  const isolationItems = isolationGroup?.items || []
  const isolationValues = new Set(isolationItems.map(i => i.value))
  const isolationGestesMap = Object.fromEntries(isolationItems.map(i => [i.value, i.geste || i.value]))
  const isolationGestes = new Set(workItems.filter(w => isolationValues.has(w.type)).map(w => isolationGestesMap[w.type]))
  const isolationCount = isolationGestes.size

  const isFioul = chauffageActuel === 'fioul'
  const chauffageGroup = WORK_GROUPS_MAISON.find(g => g.group === 'chauffage')
  const chauffageValues = new Set((chauffageGroup?.items || []).map(i => i.value))
  const hasChauffage = workItems.some(w => chauffageValues.has(w.type))
  const isValidWorks = isolationCount >= 2 && (!isFioul || hasChauffage)

  const isEligible = isValidJump && isValidWorks && eligibility.eligible
  const isAnah = eligibility.mode === 'anah'

  // Totaux calculés depuis les postes (mode détaillé)
  const postesTotalHT = workItems.reduce((s, w) => s + (Number(w.prixHT) || 0), 0)
  const postesTotalTVA = workItems.reduce((s, w) => {
    const ht = Number(w.prixHT) || 0
    return s + Math.round(ht * (Number(w.tva) || 5.5) / 100)
  }, 0)
  const postesTotalTTC = postesTotalHT + postesTotalTVA

  // Coûts effectifs selon le mode
  const effectiveCostHT = workMode === 'detaille' && postesTotalHT > 0 ? postesTotalHT : projectCostHT
  const effectiveCostTTC = workMode === 'detaille' && postesTotalTTC > 0 ? postesTotalTTC : projectCostTTC

  const result = useMemo(() => {
    if (!isEligible) return null
    return calculateRenovationGlobale({
      classInitiale, classCible, surface, mprCategory,
      projectCostHT: effectiveCostHT,
      projectCostTTC: effectiveCostTTC,
      priceMWhPrecaire, priceMWhClassique,
      forceMode: eligibility.mode,
    })
  }, [classInitiale, classCible, surface, mprCategory, effectiveCostHT, effectiveCostTTC, priceMWhPrecaire, priceMWhClassique, isEligible, eligibility.mode])

  const finalResult = useMemo(() => {
    if (!result) return null
    if (result.mode === 'anah') {
      return {
        ...result,
        mprFinal: result.mprAmount || 0,
        ceeCommerciale: 0,
        projectCost: effectiveCostTTC,
        resteACharge: Math.max(0, effectiveCostTTC - (result.mprAmount || 0)),
      }
    }
    const ceeAppliquee = Math.round(result.ceeEuros * ceePercent / 100)
    const marge = Math.round(result.ceeEuros - ceeAppliquee)
    return {
      ...result,
      ceeFinal: ceeAppliquee,
      ceeCommerciale: ceeAppliquee,
      mprFinal: 0,
      totalAides: ceeAppliquee,
      projectCost: effectiveCostTTC,
      resteACharge: Math.max(0, effectiveCostTTC - ceeAppliquee),
      ceeMargin: marge,
      ceeMarginPercent: result.ceeEuros > 0 ? (marge / result.ceeEuros) * 100 : 0,
    }
  }, [result, ceePercent, effectiveCostTTC])

  const worksLabels = workItems.map(w => w.label || w.type).filter(Boolean).join(', ')

  // Info potentiel d'aide restant
  const aideInfo = useMemo(() => {
    if (!finalResult) return null
    if (isAnah) {
      const plafond = MPR_PARCOURS_PLAFOND[Math.min(jumps >= 4 ? 4 : jumps, 4)] || 30000
      const taux = finalResult.taux || 0
      const gap = plafond - effectiveCostHT
      if (gap > 1000) {
        const aidePotentielle = Math.round(gap * taux)
        return `Plafond éligible : ${formatCurrency(plafond)} HT — il reste ${formatCurrency(gap)} HT de travaux ajoutables, soit jusqu'à ${formatCurrency(aidePotentielle)} d'aide supplémentaire.`
      }
      if (gap > 0 && gap <= 1000) {
        return `Vous êtes proche du plafond éligible (${formatCurrency(plafond)} HT). Encore ${formatCurrency(gap)} HT de travaux ajoutables.`
      }
      return null
    }
    // Mode CEE : couverture
    const couverture = effectiveCostTTC > 0 ? Math.round((finalResult.ceeFinal / effectiveCostTTC) * 100) : 0
    if (couverture >= 100) return `La prime CEE couvre l'intégralité du coût des travaux.`
    if (couverture >= 70) return `La prime CEE couvre ${couverture}% du coût des travaux TTC.`
    return null
  }, [finalResult, isAnah, effectiveCostHT, effectiveCostTTC, jumps])

  return (
    <SimulatorLayout
      code="BAR-TH-174"
      title="Rénovation globale — Maison individuelle"
      description={eligibility.eligible ? (isAnah ? "MaPrimeRénov' Parcours Accompagné" : "Financement 100% CEE") : "Vérifiez l'éligibilité"}
    >
      {/* ─── PROFIL DU BÉNÉFICIAIRE ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-violet-600" />
          Profil du bénéficiaire
        </h2>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Type de bénéficiaire" id="beneficiaryType" value={beneficiaryType} onChange={setBeneficiaryType} options={BENEFICIARY_TYPES} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Occupation du logement</label>
              <div className="flex gap-2">
                {OCCUPATION_TYPES.map(opt => (
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
        </div>
      </section>

      {/* ─── AIDE RECOMMANDÉE ─── */}
      {eligibility.eligible ? (
        <div className={`p-4 rounded-xl border-2 text-center font-bold text-lg ${
          isAnah
            ? 'bg-green-50 border-green-400 text-green-800'
            : 'bg-indigo-50 border-indigo-400 text-indigo-800'
        }`}>
          {isAnah
            ? `➜ MaPrimeRénov' Parcours Accompagné (DPE ${classInitiale})`
            : `➜ Financement 100% CEE (DPE ${classInitiale})`
          }
        </div>
      ) : (
        <div className="p-4 rounded-xl border-2 bg-red-50 border-red-400 text-center font-bold text-lg text-red-800">
          Non éligible
        </div>
      )}

      <AlertBox type={eligibility.alert || 'info'} show={true}>
        <span>{eligibility.reason}</span>
      </AlertBox>

      {/* ─── PARAMÈTRES ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-green-600" />
          Paramètres de la rénovation
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Classe DPE initiale" id="classInitiale" value={classInitiale} onChange={setClassInitiale} options={ENERGY_CLASSES} />
            <SelectField label="Classe DPE cible (après travaux)" id="classCible" value={classCible} onChange={setClassCible} options={TARGET_CLASSES} />
          </div>

          {/* Indicateur visuel saut de classe */}
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
                jumps >= MIN_CLASS_JUMP ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Surface habitable (m²)" type="number" id="surface" value={surface} onChange={setSurface} min={1} suffix="m²" />
            <SelectField label="Profil de revenus" id="mprCategory" value={mprCategory} onChange={setMprCategory} options={MPR_INCOME_OPTIONS} />
          </div>

          {/* Chauffage actuel */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de chauffage actuel</label>
            <select
              value={chauffageActuel || ''}
              onChange={(e) => setChauffageActuel(e.target.value || null)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none transition ${
                isFioul
                  ? 'border-orange-400 bg-orange-50 text-orange-800 font-semibold'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              <option value="">— Sélectionner —</option>
              <option value="fioul">Fioul</option>
              <option value="gaz">Gaz</option>
              <option value="electrique">Électrique</option>
              <option value="bois">Bois / Bûches</option>
              <option value="granules">Granulés / Pellets</option>
              <option value="charbon">Charbon</option>
              <option value="gpl">GPL / Propane</option>
              <option value="pac">Pompe à chaleur</option>
              <option value="autre">Autre</option>
            </select>
            {isFioul && (
              <p className="mt-1.5 text-[11px] text-orange-600 font-medium flex items-center gap-1">
                🔥 Chauffage fioul détecté — le remplacement du système de chauffage sera obligatoire dans les postes de travaux.
              </p>
            )}
          </div>

          <AlertBox type="warning" show={!isValidJump} title="Saut de classes insuffisant">
            Un saut minimum de 2 classes DPE est requis. Actuellement : {jumps} classe{jumps !== 1 ? 's' : ''}.
          </AlertBox>
        </div>
      </section>

      {/* ─── POSTES DE TRAVAUX ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-indigo-600" />
          Postes de travaux
        </h2>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <WorkPostes
            workGroups={WORK_GROUPS_MAISON}
            workItems={workItems}
            onChange={setWorkItems}
            mode={workMode}
            onModeChange={setWorkMode}
            chauffageActuel={chauffageActuel}
            onChauffageActuelChange={setChauffageActuel}
            projectCostHT={projectCostHT}
            onProjectCostHTChange={setProjectCostHT}
            projectCostTTC={projectCostTTC}
            onProjectCostTTCChange={setProjectCostTTC}
            aideLabel={finalResult ? (isAnah ? "MaPrimeRénov' Parcours Accompagné" : `Prime CEE (${ceePercent}%)`) : null}
            aideAmount={finalResult ? (isAnah ? finalResult.mprAmount : finalResult.ceeFinal) : 0}
            resteACharge={finalResult?.resteACharge}
            aideInfo={aideInfo}
          />
        </div>
      </section>

      {/* ─── COÛTS (mode rapide uniquement) ─── */}
      {workMode === 'rapide' && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-green-600" />
            Coût du projet
          </h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            {/* Saisie HT ou TTC avec TVA */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
              <button onClick={() => setCostInputMode('ht')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${costInputMode === 'ht' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Saisir en HT</button>
              <button onClick={() => setCostInputMode('ttc')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${costInputMode === 'ttc' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Saisir en TTC</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Coût HT (€)" type="number"
                id="projectCostHT" value={projectCostHT}
                onChange={costInputMode === 'ht' ? handleProjectCostHT : setProjectCostHT}
                min={0} suffix="€ HT"
                readOnly={costInputMode === 'ttc'}
                helper={isAnah ? `Plafond : ${formatCurrency(MPR_PARCOURS_PLAFOND[Math.min(jumps >= 4 ? 4 : jumps, 4)] || 30000)} HT` : undefined}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">TVA</label>
                <select value={projectTva} onChange={(e) => handleProjectTva(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none bg-white">
                  {TVA_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <InputField
                label="Coût TTC (€)" type="number"
                id="projectCostTTC" value={projectCostTTC}
                onChange={costInputMode === 'ttc' ? handleProjectCostTTC : setProjectCostTTC}
                min={0} suffix="€ TTC"
                readOnly={costInputMode === 'ht'}
              />
            </div>

            {/* Recap financier rapide */}
            {isEligible && finalResult && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-white divide-y divide-gray-100">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-600">Total Travaux HT</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(projectCostHT)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-600">TVA ({projectTva}%)</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(projectCostTTC - projectCostHT)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="font-bold text-gray-800">Total Travaux TTC</span>
                    <span className="font-bold text-gray-800 text-base">{formatCurrency(projectCostTTC)}</span>
                  </div>
                </div>
                <div className="bg-emerald-50 divide-y divide-emerald-100">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-emerald-700">{isAnah ? "MaPrimeRénov' Parcours Accompagné" : `Prime CEE (${ceePercent}%)`}</span>
                    <span className="font-semibold text-emerald-700">- {formatCurrency(isAnah ? finalResult.mprAmount : finalResult.ceeFinal)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="font-bold text-indigo-800">Reste à charge</span>
                    <span className="font-bold text-indigo-800 text-lg">{formatCurrency(finalResult.resteACharge)}</span>
                  </div>
                  {aideInfo && (
                    <div className="px-4 py-2.5 bg-blue-50 text-xs text-blue-700 flex items-start gap-1.5">
                      <span className="mt-0.5">💡</span>
                      <span>{aideInfo}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prix CEE */}
            {!isAnah && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Prix CEE précarité (€/MWhc)" type="number" id="pricePrecaire" value={priceMWhPrecaire} onChange={setPriceMWhPrecaire} step={0.5} suffix="€/MWhc" helper="Ménages très modestes (Bleu)" />
                <InputField label="Prix CEE classique (€/MWhc)" type="number" id="priceClassique" value={priceMWhClassique} onChange={setPriceMWhClassique} step={0.5} suffix="€/MWhc" helper="Autres profils" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── PRIX CEE (mode détaillé + CEE) ─── */}
      {isEligible && finalResult && workMode === 'detaille' && !isAnah && (
        <section>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Prix CEE précarité (€/MWhc)" type="number" id="pricePrecaire" value={priceMWhPrecaire} onChange={setPriceMWhPrecaire} step={0.5} suffix="€/MWhc" helper="Ménages très modestes (Bleu)" />
              <InputField label="Prix CEE classique (€/MWhc)" type="number" id="priceClassique" value={priceMWhClassique} onChange={setPriceMWhClassique} step={0.5} suffix="€/MWhc" helper="Autres profils" />
            </div>
          </div>
        </section>
      )}

      {isEligible && finalResult && (
        <>
          {/* ─── RÉSULTATS MODE ANAH ─── */}
          {isAnah && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-green-600" />
                MaPrimeRénov' Parcours Accompagné
              </h2>

              <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="font-semibold">Sauts DPE :</span> {finalResult.jumps} classes
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="font-semibold">Taux MPR :</span> {Math.round((finalResult.taux || 0) * 100)}%
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="font-semibold">Dépense éligible :</span> {formatCurrency(finalResult.depenseEligible)}
                  </div>
                </div>
              </div>

              <div className="bg-green-800 rounded-xl p-6 text-white shadow-xl mt-4">
                <div className="text-center">
                  <p className="text-green-200 text-sm uppercase tracking-wider mb-1">MaPrimeRénov' Parcours Accompagné</p>
                  <p className="font-extrabold text-3xl text-green-300">{formatCurrency(finalResult.mprAmount)}</p>
                  <p className="text-green-300 text-xs mt-1">
                    {Math.round((finalResult.taux || 0) * 100)}% × {formatCurrency(finalResult.depenseEligible)} HT
                  </p>
                </div>
                <hr className="border-green-700 my-4" />
                <div className="flex justify-between items-center text-xl pt-2">
                  <span className="font-bold">TOTAL AIDES :</span>
                  <span className="font-extrabold text-3xl text-yellow-300">{formatCurrency(finalResult.totalAides)}</span>
                </div>
                <div className="flex justify-between items-center text-lg pt-4 mt-2">
                  <span className="font-bold text-green-200">RESTE À CHARGE :</span>
                  <span className="font-extrabold text-2xl text-white">{formatCurrency(finalResult.resteACharge)}</span>
                </div>
              </div>

              <div className="mt-4 px-1">
                <AidesChart
                  aideAmount={finalResult.totalAides}
                  aideLabel="MaPrimeRénov'"
                  resteACharge={finalResult.resteACharge}
                  totalTTC={effectiveCostTTC}
                />
              </div>
            </section>
          )}

          {/* ─── RÉSULTATS MODE CEE ─── */}
          {!isAnah && (
            <>
              <section>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  Calcul CEE BAR-TH-174
                </h2>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="font-semibold">Sauts DPE :</span> {finalResult.jumps} classes ({classInitiale} → {classCible})
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="font-semibold">Facteur surface :</span> ×{finalResult.surfaceFactor}
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="font-semibold">Bonus précarité :</span> ×{finalResult.bonusPrecarite}
                      {finalResult.bonusPrecarite > 1 && <span className="text-green-600 font-bold"> (TMO)</span>}
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-indigo-100 rounded-lg border border-indigo-300 text-center">
                    <ResultCard
                      label="Valeur CEE (Base 100%)"
                      value={formatCurrency(finalResult.ceeEuros)}
                      sublabel={`${formatKWhc(finalResult.volumeCEE)} — Prix : ${finalResult.priceMWh} €/MWhc`}
                      className="text-indigo-900"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Stratégie Commerciale
                </h2>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <Slider label="% de la CEE appliqué au client" value={ceePercent} onChange={setCeePercent} min={0} max={100} unit="%" leftLabel="0% (Max Marge)" rightLabel="100% (Max Aide Client)" />
                </div>
              </section>

              <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-xl">
                <div className="text-center">
                  <p className="text-indigo-300 text-sm uppercase tracking-wider mb-1">Prime CEE (100% CEE)</p>
                  <p className="font-extrabold text-3xl text-yellow-300">{formatCurrency(finalResult.ceeFinal)}</p>
                  <p className="text-indigo-400 text-xs mt-1">{ceePercent}% de {formatCurrency(finalResult.ceeEuros)}</p>
                </div>
                <hr className="border-indigo-700 my-4" />
                <div className="flex justify-between items-center text-xl pt-2">
                  <span className="font-bold">TOTAL AIDES :</span>
                  <span className="font-extrabold text-3xl text-yellow-300">{formatCurrency(finalResult.totalAides)}</span>
                </div>
                <div className="flex justify-between items-center text-lg pt-4 mt-2">
                  <span className="font-bold text-indigo-200">RESTE À CHARGE :</span>
                  <span className="font-extrabold text-2xl text-white">{formatCurrency(finalResult.resteACharge)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-1">
                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Marge CEE
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Valeur CEE (Base 100%) : {formatCurrency(finalResult.ceeEuros)}</p>
                  <p>CEE appliquée au client : <span className="text-indigo-600 font-medium">{formatCurrency(finalResult.ceeFinal)}</span></p>
                  <p className="font-bold">Marge conservée : <span className="text-red-600 font-extrabold">{formatCurrency(finalResult.ceeMargin)}</span> ({Math.round(finalResult.ceeMarginPercent)}%)</p>
                </div>
              </div>

              <div className="mt-4 px-1">
                <AidesChart
                  aideAmount={finalResult.totalAides}
                  aideLabel={`Prime CEE (${ceePercent}%)`}
                  resteACharge={finalResult.resteACharge}
                  totalTTC={effectiveCostTTC}
                />
              </div>
            </>
          )}

          <SimulationSaveBar
            type="BAR-TH-174"
            title={`Réno maison ${classInitiale}→${classCible} (${isAnah ? 'MPR' : 'CEE'}) — ${surface}m²`}
            inputs={{ beneficiaryType, occupation, classInitiale, classCible, surface, mprCategory, projectCostHT: effectiveCostHT, projectCostTTC: effectiveCostTTC, priceMWhPrecaire, priceMWhClassique, ceePercent, workItems, workMode, chauffageActuel }}
            results={{ ...finalResult, projectCost: effectiveCostTTC }}
            pdfData={{
              ficheCode: 'BAR-TH-174',
              ficheTitle: 'Renovation globale — Maison',
              classInitiale,
              classCible,
              jumps,
              surface: Number(surface),
              workItems,
              mprCategory,
              mprTaux: finalResult.taux,
              mprDepenseEligible: finalResult.depenseEligible,
              mprPlafond: finalResult.plafondHT,
              params: [
                { label: 'Beneficiaire', value: BENEFICIARY_TYPES.find(b => b.value === beneficiaryType)?.label || beneficiaryType },
                { label: 'Occupation', value: occupation === 'principale' ? 'Residence principale' : 'Residence secondaire' },
                { label: 'Classe DPE initiale', value: classInitiale },
                { label: 'Classe DPE cible', value: classCible },
                { label: 'Surface habitable', value: `${surface} m2` },
                { label: 'Profil revenus', value: mprCategory },
                { label: 'Travaux', value: worksLabels || 'Non renseigne' },
              ],
              results: finalResult.mode === 'anah' ? [
                { label: 'MaPrimeRénov\'', value: formatCurrency(finalResult.mprAmount) },
                { label: 'Total aides', value: formatCurrency(finalResult.totalAides) },
              ] : [
                { label: 'Volume CEE', value: formatKWhc(finalResult.volumeCEE) },
                { label: 'Valeur CEE (Base 100%)', value: formatCurrency(finalResult.ceeEuros) },
              ],
              summary: finalResult.mode === 'anah' ? {
                projectCost: effectiveCostTTC,
                ceeCommerciale: 0,
                mprFinal: finalResult.mprAmount,
                totalAid: finalResult.totalAides,
                resteACharge: finalResult.resteACharge,
                showMpr: true,
              } : {
                projectCost: effectiveCostTTC,
                ceeCommerciale: finalResult.ceeFinal,
                mprFinal: 0,
                totalAid: finalResult.totalAides,
                resteACharge: finalResult.resteACharge,
                showMpr: false,
              },
              margin: finalResult.mode === 'cee' ? {
                ceeBase: finalResult.ceeEuros,
                ceeApplied: finalResult.ceeFinal,
                margin: finalResult.ceeMargin,
                marginPercent: finalResult.ceeMarginPercent,
                showOnPdf: false,
              } : {
                ceeBase: 0, ceeApplied: 0, margin: 0, marginPercent: 0, showOnPdf: false,
              },
              mode: finalResult.mode,
            }}
          />
        </>
      )}

      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation basée sur la fiche CEE BAR-TH-174 vA80-3 (17/01/2026) et le guide ANAH (février 2026). Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
