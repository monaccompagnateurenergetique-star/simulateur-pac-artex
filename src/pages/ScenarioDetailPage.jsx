import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Trash2, Plus, ChevronRight, Layers, Calculator
} from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { CATALOG } from '../lib/constants/catalog'
import FinancialRecap from '../components/project/FinancialRecap'

export default function ScenarioDetailPage() {
  const { id: projectId, sid: scenarioId } = useParams()
  const navigate = useNavigate()
  const {
    projects, getScenarioTotals,
    updateScenario, deleteScenario, removeSimFromScenario,
  } = useProjects()

  const [editName, setEditName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [showAddSim, setShowAddSim] = useState(false)

  const project = projects.find((p) => p.id === projectId)
  const scenario = project?.scenarios?.find((s) => s.id === scenarioId)

  if (!project || !scenario) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">Scénario introuvable</p>
        <Link to={project ? `/projets/${projectId}` : '/projets'} className="text-indigo-600 hover:underline mt-2 inline-block">
          Retour
        </Link>
      </div>
    )
  }

  const totals = getScenarioTotals(scenario)

  function handleRename(e) {
    e.preventDefault()
    if (nameValue.trim()) {
      updateScenario(projectId, scenarioId, { name: nameValue.trim() })
    }
    setEditName(false)
  }

  function handleDeleteScenario() {
    if (confirm(`Supprimer le scénario "${scenario.name}" ?`)) {
      deleteScenario(projectId, scenarioId)
      navigate(`/projets/${projectId}`)
    }
  }

  function handleRemoveSim(simId) {
    if (confirm('Retirer cette simulation du scénario ?')) {
      removeSimFromScenario(projectId, scenarioId, simId)
    }
  }

  const projectName = `${project.firstName || ''} ${project.lastName || ''}`.trim() || 'Projet'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(`/projets/${projectId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> {projectName}
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-indigo-600" />
            {editName ? (
              <form onSubmit={handleRename} className="flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium">OK</button>
                <button type="button" onClick={() => setEditName(false)} className="px-3 py-1.5 text-gray-500 text-sm">Annuler</button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">{scenario.name}</h1>
                <button
                  onClick={() => { setNameValue(scenario.name); setEditName(true) }}
                  className="p-1 text-gray-400 hover:text-indigo-600 transition"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleDeleteScenario}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {scenario.simulations.length} simulation{scenario.simulations.length > 1 ? 's' : ''}
          {scenario.ptz && ' + PTZ'}
          {' \— '}
          Créé le {new Date(scenario.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Récap financier */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-600" />
          Récapitulatif financier
        </h2>
        <FinancialRecap scenario={scenario} totals={totals} />
      </div>

      {/* Simulations du scénario */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Simulations ({scenario.simulations.length})
          </h2>
          <button
            onClick={() => setShowAddSim(!showAddSim)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        {showAddSim && (
          <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xs text-indigo-600 font-semibold mb-3">Lancer une simulation :</p>
            <div className="space-y-3">
              {CATALOG.map((cat) => (
                <div key={cat.category}>
                  <p className="text-xs text-gray-500 font-medium mb-1">{cat.emoji} {cat.category}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {cat.items.filter((i) => i.active).map((item) => (
                      <Link
                        key={item.code}
                        to={`${item.route}?projectId=${projectId}&scenarioId=${scenarioId}`}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow-sm transition text-sm"
                      >
                        <span>
                          <span className="font-semibold text-gray-800">{item.title}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{item.code}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-indigo-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenario.simulations.length === 0 && !showAddSim && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucune simulation dans ce scénario. Ajoutez-en pour voir le récap financier.
          </p>
        )}

        <div className="space-y-2">
          {scenario.simulations.map((sim) => {
            const r = sim.results || {}
            const cee = r.ceeCommerciale || r.ceeEuros || 0
            const mpr = r.mprFinal || r.primeAmount || 0
            const cost = r.projectCost || r.totalCost || 0

            return (
              <div
                key={sim.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {sim.type && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">{sim.type}</span>}
                    <p className="font-semibold text-sm text-gray-800">{sim.title || 'Simulation'}</p>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {cee > 0 && <span>CEE : <strong className="text-green-700">{cee.toLocaleString('fr-FR')} €</strong></span>}
                    {mpr > 0 && <span>MPR : <strong className="text-blue-700">{mpr.toLocaleString('fr-FR')} €</strong></span>}
                    {cost > 0 && <span>Coût : <strong className="text-gray-700">{cost.toLocaleString('fr-FR')} €</strong></span>}
                    <span className="text-gray-400">{new Date(sim.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSim(sim.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* PTZ section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Prêt à Taux Zéro (PTZ)
        </h2>
        {scenario.ptz ? (
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-indigo-700">{scenario.ptz.montantPTZ?.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-gray-500">Montant PTZ</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{scenario.ptz.mensualite?.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-gray-500">Mensualité</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{scenario.ptz.dureeDiffere} ans</p>
                <p className="text-xs text-gray-500">Différé</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{scenario.ptz.dureeTotale} ans</p>
                <p className="text-xs text-gray-500">Durée totale</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-3">Aucune simulation PTZ liée à ce scénario.</p>
            <Link
              to={`/simulations/ptz?projectId=${projectId}&scenarioId=${scenarioId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition"
            >
              <Plus className="w-4 h-4" /> Simuler un PTZ
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
