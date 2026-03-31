import { useState, useMemo } from 'react'
import { Calculator, Flame, Info, CheckCircle } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import CommercialStrategy from '../../components/simulator/CommercialStrategy'
import FinancialSummary from '../../components/simulator/FinancialSummary'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import { BAR_TH_112, MPR_BAR_TH_112 } from '../../lib/constants/barTh112'
import { ZONE_OPTIONS } from '../../lib/constants/zones'
import { calculateBarTh112 } from '../../lib/calculators/barTh112'
import { useCommercialStrategy } from '../../hooks/useCommercialStrategy'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { formatCurrency, formatKWhc } from '../../utils/formatters'

export default function BarTh112Page() {
  const { getDefault } = useSimulatorContext()

  const [zone, setZone] = useState(() => getDefault('zone', 'H1'))
  const [etas, setEtas] = useState(() => getDefault('etas', 'high'))
  const [appareilType, setAppareilType] = useState(() => getDefault('appareilType', 'poele_granules'))
  const [mprCategory, setMprCategory] = useState(() => getDefault('mprCategory', 'Bleu'))
  const [priceMWh, setPriceMWh] = useState(() => getDefault('priceMWh', 7.5))
  const [projectCost, setProjectCost] = useState(() => getDefault('projectCost', 5000))
  const [ceePercent, setCeePercent] = useState(() => getDefault('ceePercent', 100))

  // CEE Calculation
  const ceeResult = useMemo(
    () => calculateBarTh112({ etas, zone, mprCategory, priceMWh }),
    [etas, zone, mprCategory, priceMWh]
  )

  const ceeEurosBase = ceeResult.ceeEuros
  const volumeCEE = ceeResult.volumeCEE

  // MPR par type d'appareil
  const mprGrants = MPR_BAR_TH_112[appareilType] || {}
  const mprGrantTheorique = mprGrants[mprCategory] || 0

  // Commercial Strategy
  const commercial = useCommercialStrategy({
    ceeEurosBase,
    ceePercentApplied: ceePercent,
    mprCategory,
    mprGrantTheorique,
    projectCost,
    maxEligibleCost: projectCost,
  })

  // Type combustible pour afficher les conditions
  const isGranules = appareilType === 'poele_granules'
  const conditions = isGranules ? BAR_TH_112.CONDITIONS.granules : BAR_TH_112.CONDITIONS.buches
  const appareilLabel = BAR_TH_112.APPAREIL_TYPES.find(a => a.value === appareilType)?.label || ''
  const etasLabel = BAR_TH_112.ETAS_OPTIONS.find(e => e.value === etas)?.label || ''

  return (
    <SimulatorLayout
      code="BAR-TH-112"
      title="Appareil indépendant de chauffage au bois"
      description="Poêle, insert, foyer fermé ou cuisinière — Maison individuelle"
    >
      {/* ─── SECTION 1 : Calcul CEE ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul de la Prime CEE — Coup de Pouce Chauffage 2026
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          {/* Type d'appareil */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type d'appareil</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BAR_TH_112.APPAREIL_TYPES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAppareilType(opt.value)}
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                    appareilType === opt.value
                      ? 'bg-orange-100 border-orange-500 text-orange-800'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Etas + Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Efficacité énergétique saisonnière (Etas)"
              id="etas"
              value={etas}
              onChange={setEtas}
              options={BAR_TH_112.ETAS_OPTIONS}
            />
            <SelectField
              label="Zone climatique"
              id="zone"
              value={zone}
              onChange={setZone}
              options={ZONE_OPTIONS}
            />
          </div>

          {/* Prix CEE + Profil revenus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Prix CEE (€/MWhc)"
              type="number"
              id="priceMWh"
              value={priceMWh}
              onChange={setPriceMWh}
              step={0.5}
              suffix="€/MWhc"
            />
            <SelectField
              label="Profil de revenus"
              id="mprCategory"
              value={mprCategory}
              onChange={setMprCategory}
              options={[
                { value: 'Bleu', label: 'Bleu — Très modestes (×5)' },
                { value: 'Jaune', label: 'Jaune — Modestes (×5)' },
                { value: 'Violet', label: 'Violet — Intermédiaires (×4)' },
                { value: 'Rose', label: 'Rose — Supérieurs (×4)' },
              ]}
            />
          </div>

          {/* Détail calcul */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
            <div className="bg-white p-3 rounded-lg border">
              <span className="font-semibold">Montant base :</span> {formatKWhc(ceeResult.baseValue)}
              <span className="text-xs text-gray-400 ml-1">({etasLabel}, {zone})</span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="font-semibold">Bonification :</span>{' '}
              <span className={`font-bold ${ceeResult.bonusPrecarite === 5 ? 'text-green-600' : 'text-blue-600'}`}>
                ×{ceeResult.bonusPrecarite} {ceeResult.bonusPrecarite === 5 ? '(précaire)' : '(classique)'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="font-semibold">MPR {appareilLabel} :</span> {formatCurrency(mprGrantTheorique)}
            </div>
          </div>

          {/* Résultat CEE */}
          <div className="mt-4 p-4 bg-indigo-100 rounded-lg border border-indigo-300 text-center">
            <ResultCard
              label="Valeur CEE Coup de Pouce (Base 100%)"
              value={formatCurrency(ceeEurosBase)}
              sublabel={`${formatKWhc(volumeCEE)} — Prix : ${priceMWh} €/MWhc`}
              className="text-indigo-900"
            />
          </div>
        </div>
      </section>

      {/* ─── CONDITIONS TECHNIQUES ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-600" />
          Conditions techniques — {conditions.label}
        </h2>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span><strong>Rendement nominal :</strong> {conditions.rendement}</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span><strong>Particules :</strong> {conditions.particules}</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span><strong>CO :</strong> {conditions.co}</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span><strong>NOx :</strong> {conditions.nox}</span>
            </div>
          </div>
          <p className="text-xs text-orange-700 mt-2">
            <Info className="w-3.5 h-3.5 inline mr-1" />
            Un appareil possédant le label <strong>Flamme Verte 7*</strong> est réputé satisfaire ces conditions.
            Valeurs en mg/Nm³ à 13% d'O₂.
          </p>
        </div>
      </section>

      {/* ─── SECTION 2 : Stratégie commerciale ─── */}
      <CommercialStrategy
        projectCost={projectCost}
        onProjectCostChange={setProjectCost}
        mprCategory={mprCategory}
        onMprCategoryChange={setMprCategory}
        ceePercent={ceePercent}
        onCeePercentChange={setCeePercent}
        mprGrantTheorique={mprGrantTheorique}
        maxEligibleCost={projectCost}
      />

      {/* ─── SECTION 3 : Synthèse financière ─── */}
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

      {/* ─── Sauvegarde & PDF ─── */}
      <SimulationSaveBar
        type="BAR-TH-112"
        title={`Bois ${appareilLabel} — ${etasLabel} — ${zone} — ${mprCategory}`}
        inputs={{ zone, etas, appareilType, mprCategory, priceMWh, projectCost, ceePercent }}
        results={{ ceeEurosBase, volumeCEE, projectCost, ...commercial }}
        pdfData={{
          ficheCode: 'BAR-TH-112',
          ficheTitle: 'Appareil indépendant de chauffage au bois',
          params: [
            { label: 'Type d\'appareil', value: appareilLabel },
            { label: 'Efficacité (Etas)', value: etasLabel },
            { label: 'Zone climatique', value: zone },
            { label: 'Prix CEE', value: `${priceMWh} €/MWhc` },
            { label: 'Profil revenus', value: mprCategory },
            { label: 'Bonification Coup de Pouce', value: `×${ceeResult.bonusPrecarite}` },
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

      {/* Disclaimer */}
      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>Simulation basée sur la fiche CEE BAR-TH-112 avec bonification Coup de Pouce Chauffage 2026. Maison individuelle existante {'>'} 2 ans. Montants indicatifs et non contractuels.</p>
      </div>
    </SimulatorLayout>
  )
}
