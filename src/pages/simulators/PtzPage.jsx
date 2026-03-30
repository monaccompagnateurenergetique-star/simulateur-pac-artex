import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calculator, CheckCircle, XCircle, Banknote } from 'lucide-react'
import { calculerPTZ } from '../../lib/calculators/ptz'
import { PTZ_PLAFONDS, PTZ_GESTES_OPTIONS, PTZ_CONDITIONS } from '../../lib/constants/ptz'
import { useProjects } from '../../hooks/useProjects'

const CATEGORY_OPTIONS = [
  { value: 'Bleu', label: 'Bleu — Très modestes', bg: 'bg-blue-500', text: 'text-white' },
  { value: 'Jaune', label: 'Jaune — Modestes', bg: 'bg-yellow-400', text: 'text-yellow-900' },
  { value: 'Violet', label: 'Violet — Intermédiaires', bg: 'bg-purple-500', text: 'text-white' },
  { value: 'Rose', label: 'Rose — Supérieurs', bg: 'bg-pink-400', text: 'text-white' },
]

export default function PtzPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setPtzForScenario } = useProjects()
  const projectId = searchParams.get('projectId')
  const scenarioId = searchParams.get('scenarioId')

  const [nbGestes, setNbGestes] = useState(2)
  const [montantTravaux, setMontantTravaux] = useState('')
  const [category, setCategory] = useState('')

  const result = useMemo(() => {
    if (!category || !montantTravaux) return null
    return calculerPTZ({
      nbGestes,
      montantTravaux: Number(montantTravaux),
      category,
    })
  }, [nbGestes, montantTravaux, category])

  function handleSaveToScenario() {
    if (!result || !result.eligible || !projectId || !scenarioId) return
    setPtzForScenario(projectId, scenarioId, result)
    navigate(`/projets/${projectId}/scenario/${scenarioId}`)
  }

  const fmt = (v) => Number(v).toLocaleString('fr-FR')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="flex items-center gap-3 mb-8">
        <Banknote className="w-7 h-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Simulateur PTZ</h1>
          <p className="text-sm text-gray-500">Prêt à Taux Zéro — Barème 2026</p>
        </div>
      </div>

      {projectId && scenarioId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-6 text-sm text-indigo-700">
          Le résultat sera rattaché au scénario du projet.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-6">
        {/* Profil revenus */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Profil de revenus</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const cond = PTZ_CONDITIONS[opt.value]
              return (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    category === opt.value
                      ? `${opt.bg} ${opt.text} border-current ring-2 ring-offset-1`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${category === opt.value ? 'opacity-80' : 'text-gray-400'}`}>
                    {cond.eligible
                      ? `Différé ${cond.differe} ans, total ${cond.dureeTotale} ans`
                      : 'Non éligible au PTZ'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Nombre de gestes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de gestes de rénovation</label>
          <div className="grid grid-cols-4 gap-2">
            {PTZ_GESTES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setNbGestes(opt.value)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  nbGestes === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <p className="font-bold text-lg">{opt.value}{opt.value === 4 ? '+' : ''}</p>
                <p className="text-xs text-gray-400">Plafond {fmt(PTZ_PLAFONDS[opt.value])} €</p>
              </button>
            ))}
          </div>
        </div>

        {/* Montant travaux */}
        <div>
          <label htmlFor="montantTravaux" className="block text-sm font-bold text-gray-700 mb-2">
            Coût total des travaux (€ TTC)
          </label>
          <div className="relative">
            <input
              id="montantTravaux"
              type="number"
              value={montantTravaux}
              onChange={(e) => setMontantTravaux(e.target.value)}
              placeholder="25000"
              min={0}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
          </div>
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <div className={`rounded-2xl border-2 p-6 mb-6 ${result.eligible ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex items-center gap-3 mb-4">
            {result.eligible ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h2 className={`text-lg font-bold ${result.eligible ? 'text-green-800' : 'text-red-800'}`}>
              {result.eligible ? 'Éligible au PTZ' : 'Non éligible au PTZ'}
            </h2>
          </div>

          {!result.eligible && (
            <p className="text-sm text-red-700">{result.raison}</p>
          )}

          {result.eligible && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-xl">
                  <p className="text-2xl font-black text-indigo-700">{fmt(result.montantPTZ)} €</p>
                  <p className="text-xs text-gray-500 mt-1">Montant PTZ</p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl">
                  <p className="text-2xl font-black text-gray-800">{fmt(result.mensualite)} €</p>
                  <p className="text-xs text-gray-500 mt-1">Mensualité</p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl">
                  <p className="text-2xl font-black text-gray-800">{result.dureeDiffere} ans</p>
                  <p className="text-xs text-gray-500 mt-1">Différé</p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl">
                  <p className="text-2xl font-black text-gray-800">{result.dureeTotale} ans</p>
                  <p className="text-xs text-gray-500 mt-1">Durée totale</p>
                </div>
              </div>

              <div className="text-sm text-green-700 space-y-1">
                <p>Plafond PTZ pour {result.nbGestes} geste{result.nbGestes > 1 ? 's' : ''} : <strong>{fmt(result.plafond)} €</strong></p>
                <p>Période de remboursement : <strong>{result.dureeRemboursement} ans</strong> ({result.nbMensualites} mensualités)</p>
                <p>Après un différé de <strong>{result.dureeDiffere} ans</strong> sans remboursement</p>
              </div>

              {projectId && scenarioId && (
                <button
                  onClick={handleSaveToScenario}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
                >
                  <Calculator className="w-4 h-4" /> Rattacher au scénario
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Tableau des plafonds */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Barème PTZ 2026 — Rénovation énergétique
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs font-bold text-gray-500 uppercase">Nb gestes</th>
                <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase">Plafond</th>
                <th className="text-center py-2 text-xs font-bold text-gray-500 uppercase">Bleu/Jaune</th>
                <th className="text-center py-2 text-xs font-bold text-gray-500 uppercase">Violet</th>
                <th className="text-center py-2 text-xs font-bold text-gray-500 uppercase">Rose</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PTZ_PLAFONDS).map(([gestes, plafond]) => (
                <tr key={gestes} className="border-b border-gray-100">
                  <td className="py-2 font-semibold text-gray-800">{gestes}{Number(gestes) === 4 ? '+' : ''} geste{Number(gestes) > 1 ? 's' : ''}</td>
                  <td className="text-right py-2 font-bold text-indigo-700">{fmt(plafond)} €</td>
                  <td className="text-center py-2 text-green-600">20 ans (5 différé)</td>
                  <td className="text-center py-2 text-purple-600">15 ans (2 différé)</td>
                  <td className="text-center py-2 text-red-500">Non éligible</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
