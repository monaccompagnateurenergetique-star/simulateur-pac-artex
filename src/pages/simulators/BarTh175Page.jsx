import { useState, useMemo, useEffect } from 'react'
import { Building, Calculator, Euro, TrendingUp, Award, Users } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import Slider from '../../components/ui/Slider'
import {
  ENERGY_CLASSES, TARGET_CLASSES, WORK_CATEGORIES_APPART, MIN_CLASS_JUMP, CLASS_ORDER,
  CLASSES_ANAH, MPR_INCOME_OPTIONS, MPR_PARCOURS_TAUX, MPR_PARCOURS_PLAFOND, PRIX_CEE_DEFAUT,
  BENEFICIARY_TYPES, OCCUPATION_TYPES, getEligibility,
} from '../../lib/constants/renovationGlobale'
import { calculateRenovationGlobale } from '../../lib/calculators/renovationGlobale'
import { formatCurrency, formatKWhc } from '../../utils/formatters'
import { useClientContext } from '../../hooks/useClientContext'

export default function BarTh175Page() {
  const [beneficiaryType, setBeneficiaryType] = useState('pp_occupant')
  const [occupation, setOccupation] = useState('principale')
  const [classInitiale, setClassInitiale] = useState('F')
  const [classCible, setClassCible] = useState('C')
  const [surface, setSurface] = useState(60)
  const [selectedWorks, setSelectedWorks] = useState([])
  const [mprCategory, setMprCategory] = useState('Bleu')
  const [projectCostHT, setProjectCostHT] = useState(25000)
  const [projectCostTTC, setProjectCostTTC] = useState(27500)
  const [priceMWhPrecaire, setPriceMWhPrecaire] = useState(PRIX_CEE_DEFAUT.precaire)
  const [priceMWhClassique, setPriceMWhClassique] = useState(PRIX_CEE_DEFAUT.classique)
  const [ceePercent, setCeePercent] = useState(100)

  const { prefill } = useClientContext()

  useEffect(() => {
    if (!prefill) return
    if (prefill.surface) setSurface(prefill.surface)
    if (prefill.mprCategory) setMprCategory(prefill.mprCategory)
  }, [])

  const eligibility = getEligibility(beneficiaryType, occupation, classInitiale)

  const jumps = CLASS_ORDER.indexOf(classCible) - CLASS_ORDER.indexOf(classInitiale)
  const isValidJump = jumps >= MIN_CLASS_JUMP
  const isValidWorks = selectedWorks.length >= 2
  const isEligible = isValidJump && isValidWorks && eligibility.eligible
  const isAnah = eligibility.mode === 'anah'

  const result = useMemo(() => {
    if (!isEligible) return null
    return calculateRenovationGlobale({
      classInitiale, classCible, surface, mprCategory,
      projectCostHT, projectCostTTC, priceMWhPrecaire, priceMWhClassique,
      forceMode: eligibility.mode,
    })
  }, [classInitiale, classCible, surface, mprCategory, projectCostHT, projectCostTTC, priceMWhPrecaire, priceMWhClassique, isEligible, eligibility.mode])

  const finalResult = useMemo(() => {
    if (!result) return null
    if (result.mode === 'anah') return result
    const ceeAppliquee = Math.round(result.ceeEuros * ceePercent / 100)
    const marge = Math.round(result.ceeEuros - ceeAppliquee)
    return {
      ...result, ceeFinal: ceeAppliquee, totalAides: ceeAppliquee,
      resteACharge: Math.max(0, projectCostTTC - ceeAppliquee),
      ceeMargin: marge, ceeMarginPercent: result.ceeEuros > 0 ? (marge / result.ceeEuros) * 100 : 0,
    }
  }, [result, ceePercent, projectCostTTC])

  function toggleWork(value) {
    setSelectedWorks(prev => prev.includes(value) ? prev.filter(w => w !== value) : [...prev, value])
  }

  return (
    <SimulatorLayout
      code="BAR-TH-175"
      title="Rénovation globale — Appartement"
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

      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-blue-600" /> Paramètres de la rénovation
        </h2>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Classe DPE initiale" id="classInitiale" value={classInitiale} onChange={setClassInitiale} options={ENERGY_CLASSES} />
            <SelectField label="Classe DPE cible" id="classCible" value={classCible} onChange={setClassCible} options={TARGET_CLASSES} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Surface habitable (m²)" type="number" id="surface" value={surface} onChange={setSurface} min={1} suffix="m²" />
            <SelectField label="Profil de revenus" id="mprCategory" value={mprCategory} onChange={setMprCategory} options={MPR_INCOME_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catégories de travaux (minimum 2)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WORK_CATEGORIES_APPART.map(cat => (
                <label key={cat.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                  selectedWorks.includes(cat.value) ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                  <input type="checkbox" checked={selectedWorks.includes(cat.value)} onChange={() => toggleWork(cat.value)} className="rounded text-blue-600" />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
          <AlertBox type="warning" show={!isValidJump} title="Saut insuffisant">Minimum 2 classes requis ({jumps}).</AlertBox>
          <AlertBox type="warning" show={isValidJump && !isValidWorks} title="Travaux insuffisants">Minimum 2 catégories ({selectedWorks.length}/2).</AlertBox>
        </div>
      </section>

      {isEligible && finalResult && (
        <>
          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
              <Euro className="w-5 h-5 text-green-600" /> Coût du projet
            </h2>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              {isAnah ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Coût HT (€)" type="number" id="projectCostHT" value={projectCostHT} onChange={setProjectCostHT} min={1000} suffix="€ HT"
                    helper={`Plafond : ${formatCurrency(MPR_PARCOURS_PLAFOND[Math.min(jumps >= 4 ? 4 : jumps, 4)] || 30000)} HT`} />
                  <InputField label="Coût TTC (€)" type="number" id="projectCostTTC" value={projectCostTTC} onChange={setProjectCostTTC} min={1000} suffix="€ TTC" />
                </div>
              ) : (
                <>
                  <InputField label="Coût total TTC (€)" type="number" id="projectCostTTC" value={projectCostTTC} onChange={setProjectCostTTC} min={1000} suffix="€ TTC" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Prix CEE précarité (€/MWhc)" type="number" id="pricePrecaire" value={priceMWhPrecaire} onChange={setPriceMWhPrecaire} step={0.5} suffix="€/MWhc" helper="Bleu" />
                    <InputField label="Prix CEE classique (€/MWhc)" type="number" id="priceClassique" value={priceMWhClassique} onChange={setPriceMWhClassique} step={0.5} suffix="€/MWhc" helper="Autres" />
                  </div>
                </>
              )}
            </div>
          </section>

          {isAnah && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-green-600" /> MaPrimeRénov' Parcours Accompagné
              </h2>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                  <div className="bg-white p-3 rounded-lg border"><span className="font-semibold">Sauts :</span> {finalResult.jumps}</div>
                  <div className="bg-white p-3 rounded-lg border"><span className="font-semibold">Taux :</span> {Math.round((finalResult.taux || 0) * 100)}%</div>
                  <div className="bg-white p-3 rounded-lg border"><span className="font-semibold">Éligible :</span> {formatCurrency(finalResult.depenseEligible)}</div>
                </div>
              </div>
              <div className="bg-green-800 rounded-xl p-6 text-white shadow-xl mt-4">
                <div className="text-center">
                  <p className="text-green-200 text-sm uppercase mb-1">MaPrimeRénov'</p>
                  <p className="font-extrabold text-3xl text-green-300">{formatCurrency(finalResult.mprAmount)}</p>
                  <p className="text-green-300 text-xs mt-1">{Math.round((finalResult.taux || 0) * 100)}% × {formatCurrency(finalResult.depenseEligible)}</p>
                </div>
                <hr className="border-green-700 my-4" />
                <div className="flex justify-between items-center text-xl"><span className="font-bold">TOTAL AIDES :</span><span className="font-extrabold text-3xl text-yellow-300">{formatCurrency(finalResult.totalAides)}</span></div>
                <div className="flex justify-between items-center text-lg pt-4 mt-2"><span className="font-bold text-green-200">RESTE À CHARGE :</span><span className="font-extrabold text-2xl">{formatCurrency(finalResult.resteACharge)}</span></div>
              </div>
            </section>
          )}

          {!isAnah && (
            <>
              <section>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-indigo-600" /> Calcul CEE BAR-TH-175
                </h2>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="bg-white p-3 rounded-lg border"><span className="font-semibold">Sauts :</span> {finalResult.jumps} ({classInitiale}→{classCible})</div>
                    <div className="bg-white p-3 rounded-lg border"><span className="font-semibold">Surface :</span> ×{finalResult.surfaceFactor}</div>
                    <div className="bg-white p-3 rounded-lg border"><span className="font-semibold">Précarité :</span> ×{finalResult.bonusPrecarite}{finalResult.bonusPrecarite > 1 && <span className="text-green-600 font-bold"> (TMO)</span>}</div>
                  </div>
                  <div className="mt-4 p-4 bg-indigo-100 rounded-lg border border-indigo-300 text-center">
                    <ResultCard label="Valeur CEE (Base 100%)" value={formatCurrency(finalResult.ceeEuros)} sublabel={`${formatKWhc(finalResult.volumeCEE)} — ${finalResult.priceMWh} €/MWhc`} className="text-indigo-900" />
                  </div>
                </div>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-green-600" /> Stratégie Commerciale</h2>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <Slider label="% CEE appliqué au client" value={ceePercent} onChange={setCeePercent} min={0} max={100} unit="%" leftLabel="0% (Max Marge)" rightLabel="100% (Max Aide)" />
                </div>
              </section>
              <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-xl">
                <div className="text-center">
                  <p className="text-indigo-300 text-sm uppercase mb-1">Prime CEE</p>
                  <p className="font-extrabold text-3xl text-yellow-300">{formatCurrency(finalResult.ceeFinal)}</p>
                  <p className="text-indigo-400 text-xs mt-1">{ceePercent}% de {formatCurrency(finalResult.ceeEuros)}</p>
                </div>
                <hr className="border-indigo-700 my-4" />
                <div className="flex justify-between items-center text-xl"><span className="font-bold">TOTAL AIDES :</span><span className="font-extrabold text-3xl text-yellow-300">{formatCurrency(finalResult.totalAides)}</span></div>
                <div className="flex justify-between items-center text-lg pt-4 mt-2"><span className="font-bold text-indigo-200">RESTE À CHARGE :</span><span className="font-extrabold text-2xl">{formatCurrency(finalResult.resteACharge)}</span></div>
              </div>
              <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-1">
                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Marge CEE</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Base 100% : {formatCurrency(finalResult.ceeEuros)}</p>
                  <p>Appliquée : <span className="text-indigo-600 font-medium">{formatCurrency(finalResult.ceeFinal)}</span></p>
                  <p className="font-bold">Marge : <span className="text-red-600 font-extrabold">{formatCurrency(finalResult.ceeMargin)}</span> ({Math.round(finalResult.ceeMarginPercent)}%)</p>
                </div>
              </div>
            </>
          )}

          <SimulationSaveBar type="BAR-TH-175"
            title={`Réno appart ${classInitiale}→${classCible} (${isAnah ? 'MPR' : 'CEE'}) — ${surface}m²`}
            inputs={{ beneficiaryType, occupation, classInitiale, classCible, surface, mprCategory, projectCostHT, projectCostTTC, priceMWhPrecaire, priceMWhClassique, ceePercent, selectedWorks }}
            results={finalResult}
            pdfData={{
              ficheCode: 'BAR-TH-175',
              ficheTitle: 'Rénovation globale — Appartement',
              params: [
                { label: 'Bénéficiaire', value: BENEFICIARY_TYPES.find(b => b.value === beneficiaryType)?.label || beneficiaryType },
                { label: 'Occupation', value: occupation === 'principale' ? 'Résidence principale' : 'Résidence secondaire' },
                { label: 'Classe DPE initiale', value: classInitiale },
                { label: 'Classe DPE cible', value: classCible },
                { label: 'Surface habitable', value: `${surface} m²` },
                { label: 'Profil revenus', value: mprCategory },
                { label: 'Travaux sélectionnés', value: selectedWorks.join(', ') },
              ],
              results: finalResult.mode === 'anah' ? [
                { label: 'MaPrimeRénov\'', value: formatCurrency(finalResult.mprAmount) },
                { label: 'Total aides', value: formatCurrency(finalResult.totalAides) },
              ] : [
                { label: 'Volume CEE', value: formatKWhc(finalResult.volumeCEE) },
                { label: 'Valeur CEE (Base 100%)', value: formatCurrency(finalResult.ceeEuros) },
              ],
              summary: finalResult.mode === 'anah' ? {
                projectCost: projectCostTTC,
                ceeCommerciale: 0,
                mprFinal: finalResult.mprAmount,
                totalAid: finalResult.totalAides,
                resteACharge: finalResult.resteACharge,
                showMpr: true,
              } : {
                projectCost: projectCostTTC,
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
                ceeBase: 0,
                ceeApplied: 0,
                margin: 0,
                marginPercent: 0,
                showOnPdf: false,
              },
              mode: finalResult.mode,
            }}
          />
        </>
      )}

      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation basée sur BAR-TH-175 vA80-3 (17/01/2026) et guide ANAH (février 2026). Indicatif, non contractuel.</p>
      </div>
    </SimulatorLayout>
  )
}
