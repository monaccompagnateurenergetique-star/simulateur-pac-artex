import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Home, FileCheck, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import AlertBox from '../../components/ui/AlertBox'
import { LOC_AVANTAGE } from '../../lib/constants/locAvantage'
import { calculateLocAvantage } from '../../lib/calculators/locAvantage'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { formatCurrency } from '../../utils/formatters'

export default function LocAvantagePage() {
  const { getDefault } = useSimulatorContext()

  const [surface, setSurface] = useState(() => getDefault('surface', 80))
  const [zone, setZone] = useState(() => getDefault('zone', 'B1'))
  const [rentalLevel, setRentalLevel] = useState(() => getDefault('rentalLevel', 'Loc2'))
  const [workAmount, setWorkAmount] = useState(() => getDefault('workAmount', 25000))
  const [workType, setWorkType] = useState(() => getDefault('workType', 'amelioration'))
  const [hasIntermediation, setHasIntermediation] = useState(
    () => getDefault('hasIntermediation', false)
  )
  const [intermediationType, setIntermediationType] = useState(
    () => getDefault('intermediationType', 'mandatGestion')
  )

  const locResult = useMemo(
    () => calculateLocAvantage({
      surface, zone, rentalLevel, workAmount, workType,
      hasIntermediation, intermediationType,
    }),
    [surface, zone, rentalLevel, workAmount, workType, hasIntermediation, intermediationType]
  )

  const rentalData = LOC_AVANTAGE.RENTAL_LEVELS.find(r => r.value === rentalLevel)
  const workTypeData = LOC_AVANTAGE.WORK_TYPES.find(w => w.value === workType)

  return (
    <SimulatorLayout
      code="LOC-AVANTAGE"
      title="Loc'Avantages — Convention ANAH"
      description="Aides travaux, réduction d'impôt et intermédiation locative"
    >
      {/* ─── SECTION 1 : Convention & Logement ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-indigo-600" />
          Convention et logement
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Surface habitable"
              type="number"
              id="surface"
              value={surface}
              onChange={setSurface}
              min={9}
              max={500}
              suffix="m²"
            />
            <SelectField
              label="Zone géographique"
              id="zone"
              value={zone}
              onChange={setZone}
              options={LOC_AVANTAGE.ZONES.map(z => ({ value: z.value, label: z.label }))}
            />
            <SelectField
              label="Niveau de convention"
              id="rentalLevel"
              value={rentalLevel}
              onChange={setRentalLevel}
              options={LOC_AVANTAGE.RENTAL_LEVELS.map(l => ({ value: l.value, label: l.label }))}
            />
          </div>

          {/* Description du niveau choisi */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">{rentalData?.label}</p>
                <p className="text-gray-600">{rentalData?.description}</p>
                {rentalData?.intermediationObligatoire && (
                  <p className="text-amber-600 font-semibold mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    Intermédiation locative obligatoire pour ce niveau
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Loyers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border text-sm">
              <span className="text-gray-500 block">Loyer plafond</span>
              <span className="text-lg font-bold text-indigo-700">
                {formatCurrency(locResult.loyerMensuelPlafond)}
              </span>
              <span className="text-gray-400 text-xs block">/mois ({locResult.loyerPlafondM2} €/m²)</span>
            </div>
            <div className="bg-white p-3 rounded-lg border text-sm">
              <span className="text-gray-500 block">Loyer de marché estimé</span>
              <span className="text-lg font-bold text-gray-700">
                {formatCurrency(locResult.loyerMensuelMarche)}
              </span>
              <span className="text-gray-400 text-xs block">/mois ({locResult.loyerMarcheM2} €/m²)</span>
            </div>
            <div className={"p-3 rounded-lg border text-sm " + (locResult.decoteVsMarche > 20 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200')}>
              <span className="text-gray-500 block">Décote vs marché</span>
              <span className={"text-lg font-bold " + (locResult.decoteVsMarche > 20 ? 'text-amber-700' : 'text-green-700')}>
                -{locResult.decoteVsMarche}%
              </span>
              <span className="text-gray-400 text-xs block">
                Surface pondérée : {locResult.surfacePonderee} m²
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2 : Travaux ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-orange-600" />
          Travaux et subvention ANAH
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          {/* Type de travaux */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type de travaux</label>
            <div className="space-y-2">
              {LOC_AVANTAGE.WORK_TYPES.map(wt => (
                <button
                  key={wt.value}
                  onClick={() => setWorkType(wt.value)}
                  className={"w-full text-left px-4 py-3 rounded-lg border-2 transition " + (
                    workType === wt.value
                      ? 'bg-orange-50 border-orange-400 text-orange-900'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <span className="font-semibold text-sm">{wt.label}</span>
                  <span className="block text-xs mt-0.5 opacity-80">{wt.description}</span>
                  <span className="block text-xs mt-1 font-medium">
                    Taux : {wt.tauxSubvention * 100}% — Plafond : {wt.plafondM2} €/m² (max {formatCurrency(wt.plafondTotal)})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Montant des travaux */}
          <InputField
            label="Montant HT des travaux"
            type="number"
            id="workAmount"
            value={workAmount}
            onChange={setWorkAmount}
            min={0}
            step={500}
            suffix="€"
          />

          {/* Détail calcul subvention */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border">
              <span className="text-gray-500 block">Plafond travaux éligibles</span>
              <span className="font-bold text-gray-800">{formatCurrency(locResult.plafondTravaux)}</span>
              <span className="text-xs text-gray-400 block">{surface} m² × {workTypeData?.plafondM2} €/m²</span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="text-gray-500 block">Travaux retenus</span>
              <span className="font-bold text-gray-800">{formatCurrency(locResult.travauxEligibles)}</span>
              {locResult.travauxDepasses && (
                <span className="text-xs text-amber-600 block">Plafond dépassé</span>
              )}
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="text-gray-500 block">Subvention ANAH</span>
              <span className="font-bold text-emerald-700 text-lg">{formatCurrency(locResult.subventionAnah)}</span>
              <span className="text-xs text-emerald-600 block">{workTypeData?.tauxSubvention * 100}% des travaux retenus</span>
            </div>
          </div>

          {locResult.travauxDepasses && (
            <AlertBox
              type="warning"
              title="Plafond de travaux dépassé"
              message={"Le montant des travaux (" + formatCurrency(workAmount) + ") dépasse le plafond éligible (" + formatCurrency(locResult.plafondTravaux) + "). La subvention est calculée sur le plafond."}
            />
          )}
        </div>
      </section>

      {/* ─── SECTION 3 : Intermédiation & Réduction d'impôt ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Réduction d'impôt et intermédiation
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          {/* Intermédiation */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasIntermediation || locResult.intermediationObligatoire}
                disabled={locResult.intermediationObligatoire}
                onChange={(e) => setHasIntermediation(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
              />
              <div>
                <span className="text-sm font-semibold text-gray-700">Intermédiation locative</span>
                {locResult.intermediationObligatoire && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Obligatoire en Loc 3
                  </span>
                )}
              </div>
            </label>
            <p className="text-xs text-gray-500 ml-8">
              Confier la gestion à un organisme agréé permet de majorer la réduction d'impôt et d'obtenir une prime.
            </p>

            {locResult.intermediationEffective && (
              <div className="ml-8 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIntermediationType('mandatGestion')}
                  className={"px-3 py-2 rounded-lg border-2 text-sm font-medium transition " + (
                    intermediationType === 'mandatGestion'
                      ? 'bg-blue-50 border-blue-400 text-blue-800'
                      : 'bg-white border-gray-200 text-gray-500'
                  )}
                >
                  Mandat de gestion (1 000 €)
                </button>
                <button
                  onClick={() => setIntermediationType('locationSousLocation')}
                  className={"px-3 py-2 rounded-lg border-2 text-sm font-medium transition " + (
                    intermediationType === 'locationSousLocation'
                      ? 'bg-blue-50 border-blue-400 text-blue-800'
                      : 'bg-white border-gray-200 text-gray-500'
                  )}
                >
                  Location/sous-location (3 000 €)
                </button>
              </div>
            )}
          </div>

          {/* Taux de réduction */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <span className="text-gray-500 block">Taux réduction d'impôt</span>
              <span className="font-bold text-blue-700 text-xl">{locResult.tauxReduction}%</span>
              <span className="text-xs text-blue-500 block">
                {locResult.intermediationEffective ? 'Avec intermédiation' : 'Sans intermédiation'}
              </span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <span className="text-gray-500 block">Réduction annuelle</span>
              <span className="font-bold text-blue-700 text-lg">{formatCurrency(locResult.reductionImpotAnnuelle)}</span>
              <span className="text-xs text-blue-500 block">Sur revenus fonciers bruts</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <span className="text-gray-500 block">Réduction sur {locResult.dureeEngagement} ans</span>
              <span className="font-bold text-blue-700 text-lg">{formatCurrency(locResult.reductionImpotTotale)}</span>
              <span className="text-xs text-blue-500 block">Engagement minimum</span>
            </div>
          </div>

          {locResult.primeIntermediation > 0 && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-sm">
              <span className="text-gray-500 block">Prime d'intermédiation locative</span>
              <span className="font-bold text-purple-700 text-lg">{formatCurrency(locResult.primeIntermediation)}</span>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 4 : Synthèse des aides ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Synthèse des aides obtenues
        </h2>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 space-y-4">
          {/* Tableau détaillé */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-200">
                  <th className="text-left py-2 text-gray-600 font-semibold">Aide</th>
                  <th className="text-right py-2 text-gray-600 font-semibold">Montant</th>
                  <th className="text-right py-2 text-gray-600 font-semibold">Détail</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-emerald-100">
                  <td className="py-3 font-medium text-gray-800">Subvention ANAH travaux</td>
                  <td className="py-3 text-right font-bold text-emerald-700">{formatCurrency(locResult.subventionAnah)}</td>
                  <td className="py-3 text-right text-xs text-gray-500">{workTypeData?.tauxSubvention * 100}% sur {formatCurrency(locResult.travauxEligibles)}</td>
                </tr>
                <tr className="border-b border-emerald-100">
                  <td className="py-3 font-medium text-gray-800">
                    Réduction d'impôt ({locResult.dureeEngagement} ans)
                  </td>
                  <td className="py-3 text-right font-bold text-blue-700">{formatCurrency(locResult.reductionImpotTotale)}</td>
                  <td className="py-3 text-right text-xs text-gray-500">{formatCurrency(locResult.reductionImpotAnnuelle)}/an × {locResult.dureeEngagement} ans</td>
                </tr>
                {locResult.primeIntermediation > 0 && (
                  <tr className="border-b border-emerald-100">
                    <td className="py-3 font-medium text-gray-800">Prime intermédiation</td>
                    <td className="py-3 text-right font-bold text-purple-700">{formatCurrency(locResult.primeIntermediation)}</td>
                    <td className="py-3 text-right text-xs text-gray-500">
                      {intermediationType === 'locationSousLocation' ? 'Location/sous-location' : 'Mandat gestion'}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-emerald-300">
                  <td className="py-3 font-bold text-gray-900 text-base">Total aides</td>
                  <td className="py-3 text-right font-bold text-indigo-700 text-lg">{formatCurrency(locResult.totalAides)}</td>
                  <td className="py-3 text-right text-xs text-gray-500">Cumulées sur {locResult.dureeEngagement} ans</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cards résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 font-semibold">Coût des travaux</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(workAmount)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 font-semibold">Subvention ANAH</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(locResult.subventionAnah)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-orange-300">
              <p className="text-sm text-gray-600 font-semibold">Reste à charge</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(locResult.resteACharge)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONDITIONS ─── */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Conditions d'éligibilité
        </h2>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {LOC_AVANTAGE.CONDITIONS.map((condition, i) => (
              <div key={i} className="flex items-start gap-2 bg-white p-3 rounded-lg border">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>{condition}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-xs text-green-700 font-semibold">Travaux éligibles :</p>
            <p className="text-xs text-green-600 mt-1">
              {LOC_AVANTAGE.ELIGIBLE_WORKS.join(' • ')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Sauvegarde & PDF ─── */}
      <SimulationSaveBar
        type="LOC-AVANTAGE"
        title={"Loc'Avantages " + rentalLevel + " — " + zone + " — " + surface + "m²"}
        inputs={{ surface, zone, rentalLevel, workAmount, workType, hasIntermediation, intermediationType }}
        results={{
          subventionAnah: locResult.subventionAnah,
          reductionImpotAnnuelle: locResult.reductionImpotAnnuelle,
          reductionImpotTotale: locResult.reductionImpotTotale,
          primeIntermediation: locResult.primeIntermediation,
          totalAides: locResult.totalAides,
          resteACharge: locResult.resteACharge,
          loyerMensuelPlafond: locResult.loyerMensuelPlafond,
        }}
        pdfData={{
          ficheCode: 'LOC-AVANTAGE',
          ficheTitle: "Loc'Avantages — Convention ANAH",
          params: [
            { label: 'Surface', value: surface + ' m²' },
            { label: 'Zone', value: zone },
            { label: 'Convention', value: rentalLevel },
            { label: 'Type travaux', value: workTypeData?.label },
            { label: 'Montant travaux', value: formatCurrency(workAmount) },
            { label: 'Intermédiation', value: locResult.intermediationEffective ? 'Oui' : 'Non' },
          ],
          results: [
            { label: 'Loyer plafond', value: formatCurrency(locResult.loyerMensuelPlafond) + '/mois' },
            { label: 'Subvention ANAH', value: formatCurrency(locResult.subventionAnah) },
            { label: 'Réduction impôt/an', value: formatCurrency(locResult.reductionImpotAnnuelle) },
            { label: 'Réduction totale (6 ans)', value: formatCurrency(locResult.reductionImpotTotale) },
            { label: 'Prime intermédiation', value: formatCurrency(locResult.primeIntermediation) },
            { label: 'Total aides', value: formatCurrency(locResult.totalAides) },
            { label: 'Reste à charge', value: formatCurrency(locResult.resteACharge) },
          ],
          summary: {
            projectCost: workAmount,
            totalAid: locResult.totalAides,
            resteACharge: locResult.resteACharge,
          },
        }}
      />

      <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>
          Simulation Loc'Avantages — Convention ANAH. Subvention travaux + réduction d'impôt sur revenus fonciers + prime d'intermédiation. Engagement 6 ans minimum. Montants indicatifs et non contractuels.
        </p>
      </div>
    </SimulatorLayout>
  )
}
