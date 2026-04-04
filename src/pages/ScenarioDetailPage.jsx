import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Trash2, Plus, ChevronRight, Layers, Calculator,
  RefreshCw, TrendingDown, TrendingUp, Wallet, Euro, FileDown, Send, Copy, Check, Link2
} from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useSettings } from '../hooks/useSettings'
import { useShareScenario } from '../hooks/useSharedScenario'
import { CATALOG } from '../lib/constants/catalog'
import FinancialRecap from '../components/project/FinancialRecap'
import { generateProposalPDF } from '../lib/proposalPdfGenerator'

export default function ScenarioDetailPage() {
  const { id: projectId, sid: scenarioId } = useParams()
  const navigate = useNavigate()
  const {
    projects, getScenarioTotals,
    updateScenario, deleteScenario, removeSimFromScenario,
  } = useProjects()
  const { settings } = useSettings()

  const { shareScenario } = useShareScenario()
  const [editName, setEditName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [showAddSim, setShowAddSim] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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

  function handleExportPDF() {
    generateProposalPDF({
      company: settings.company,
      project,
      scenario,
      totals,
    })
  }

  function handleRemoveSim(simId) {
    if (confirm('Retirer cette simulation du scénario ?')) {
      removeSimFromScenario(projectId, scenarioId, simId)
    }
  }

  async function handleShare() {
    setSharing(true)
    try {
      const token = await shareScenario({
        projectId,
        projectName: `${project.firstName || ''} ${project.lastName || ''}`.trim(),
        scenarioId,
        scenarioName: scenario.name,
        simulations: scenario.simulations,
        totals: getScenarioTotals(scenario),
        clientInfo: {
          firstName: project.firstName,
          lastName: project.lastName,
          email: project.email,
          phone: project.phone,
          address: project.address,
          postalCode: project.postalCode,
          city: project.city,
          category: project.category,
          categoryLabel: project.categoryLabel,
          dpe: project.dpe,
        },
      })
      const url = `${window.location.origin}${import.meta.env.BASE_URL || '/'}s/${token}`
      setShareLink(url)
    } catch (err) {
      console.error('Erreur partage:', err)
    } finally {
      setSharing(false)
    }
  }

  function copyShareLink() {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function getSimEditUrl(sim) {
    const catalogItem = CATALOG.flatMap((c) => c.items).find((i) => i.code === sim.type)
    if (!catalogItem) return null
    return `${catalogItem.route}?projectId=${projectId}&scenarioId=${scenarioId}&editSimId=${sim.id}`
  }

  const projectName = `${project.firstName || ''} ${project.lastName || ''}`.trim() || 'Projet'
  const fmt = (v) => v ? Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '0'

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
          <div className="flex items-center gap-2">
            {scenario.simulations.length > 0 && (
              <>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition font-medium"
                >
                  {sharing ? <span className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
                  Envoyer au client
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition font-medium"
                >
                  <FileDown className="w-4 h-4" /> PDF
                </button>
              </>
            )}
            <button
              onClick={handleDeleteScenario}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
        {/* Lien partage */}
        {shareLink && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Lien envoyé au client</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={shareLink}
                className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-gray-700 font-mono" />
              <button onClick={copyShareLink}
                className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition">
                {linkCopied ? <><Check className="w-4 h-4" /> Copié</> : <><Copy className="w-4 h-4" /> Copier</>}
              </button>
            </div>
            <p className="text-[10px] text-emerald-500 mt-2">Le client pourra consulter le scénario et créer un compte pour suivre son dossier.</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-2">
          {scenario.simulations.length} simulation{scenario.simulations.length > 1 ? 's' : ''}
          {scenario.ptz && ' + PTZ'}
          {' — '}
          Créé le {new Date(scenario.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* KPI résumé financier */}
      {scenario.simulations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <Euro className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-800">{fmt(totals.totalCost)} €</p>
            <p className="text-xs text-gray-500">Coût total travaux</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-600">{fmt(totals.totalAides)} €</p>
            <p className="text-xs text-gray-500">Total aides</p>
          </div>
          {totals.ptzMontant > 0 && (
            <div className="bg-white rounded-xl border border-indigo-200 p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <Wallet className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-indigo-600">{fmt(totals.ptzMontant)} €</p>
              <p className="text-xs text-gray-500">PTZ</p>
            </div>
          )}
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-orange-600">{fmt(totals.resteACharge)} €</p>
            <p className="text-xs text-gray-500">Reste à charge</p>
          </div>
        </div>
      )}

      {/* Récap financier détaillé */}
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
            const inp = sim.inputs || {}
            const cee = r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
            const mpr = r.mprFinal || r.mprAmount || r.primeAmount || 0
            const cost = r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
            const rac = cost - cee - mpr
            const editUrl = getSimEditUrl(sim)

            return (
              <div
                key={sim.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {sim.type && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">{sim.type}</span>}
                      <p className="font-semibold text-sm text-gray-800">{sim.title || 'Simulation'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {editUrl && (
                      <Link
                        to={editUrl}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition opacity-0 group-hover:opacity-100"
                        title="Modifier cette simulation"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Modifier
                      </Link>
                    )}
                    <button
                      onClick={() => handleRemoveSim(sim.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      title="Retirer du scénario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Détail financier de la simulation */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-semibold">CEE</p>
                    <p className="text-sm font-bold text-green-600">{cee > 0 ? `${cee.toLocaleString('fr-FR')} €` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-semibold">MPR</p>
                    <p className="text-sm font-bold text-blue-600">{mpr > 0 ? `${mpr.toLocaleString('fr-FR')} €` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-semibold">Coût TTC</p>
                    <p className="text-sm font-bold text-gray-700">{cost > 0 ? `${cost.toLocaleString('fr-FR')} €` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-semibold">RAC</p>
                    <p className={`text-sm font-bold ${rac > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {cost > 0 ? `${Math.max(0, rac).toLocaleString('fr-FR')} €` : '—'}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 mt-2">{new Date(sim.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
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
            <div className="flex justify-center mt-3">
              <Link
                to={`/simulations/ptz?projectId=${projectId}&scenarioId=${scenarioId}`}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Recalculer le PTZ
              </Link>
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
