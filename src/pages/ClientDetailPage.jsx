import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Home,
  ChevronRight, MessageSquare, Send, Trash2, Calculator, FileText, Plus, ExternalLink,
  Search, Loader2, Zap, Thermometer, ChevronDown, ChevronUp,
  Bell, Check, Calendar, AlertTriangle, CheckCircle, Layers
} from 'lucide-react'
import { useProjects, PROJECT_STATUSES } from '../hooks/useProjects'
import { useSimulationHistory } from '../hooks/useSimulationHistory'
import { CATALOG } from '../lib/constants/catalog'
import { getLocationInfo } from '../utils/postalCode'
import { searchDPE, getDpeColor } from '../utils/dpeApi'
import CompletionGauge from '../components/ui/CompletionGauge'
import { getCompletion } from '../lib/completionGauge'

const CATEGORY_BADGE = {
  Bleu: 'bg-blue-100 text-blue-800 border-blue-300',
  Jaune: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Violet: 'bg-purple-100 text-purple-800 border-purple-300',
  Rose: 'bg-pink-100 text-pink-800 border-pink-300',
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    projects, updateProject, updateProjectStatus, addNote, deleteNote, linkSimulation,
    addScenario, deleteScenario, getScenarioTotals,
    addReminder, toggleReminder, deleteReminder,
  } = useProjects()
  const { history } = useSimulationHistory()
  const [noteText, setNoteText] = useState('')
  const [showLinkSim, setShowLinkSim] = useState(false)
  const [showNewSim, setShowNewSim] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [showAddScenario, setShowAddScenario] = useState(false)

  // Rappels
  const [reminderText, setReminderText] = useState('')
  const [reminderDate, setReminderDate] = useState('')

  // DPE state
  const [dpeResults, setDpeResults] = useState(null)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [dpeError, setDpeError] = useState(null)
  const [showDpeSection, setShowDpeSection] = useState(false)

  const project = projects.find((c) => c.id === id)

  const completion = useMemo(() => getCompletion(project), [project])

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">Projet introuvable</p>
        <Link to="/projets" className="text-indigo-600 hover:underline mt-2 inline-block">
          Retour aux projets
        </Link>
      </div>
    )
  }

  const currentStatus = PROJECT_STATUSES.find((s) => s.value === project.status)
  const linkedSims = (project.simulations || [])
    .map((simId) => history.find((h) => h.id === simId))
    .filter(Boolean)
  const unlinkedSims = history.filter((h) => !(project.simulations || []).includes(h.id))

  const locationInfo = project.postalCode ? getLocationInfo(project.postalCode) : null

  function handleAddNote() {
    if (!noteText.trim()) return
    addNote(id, noteText.trim())
    setNoteText('')
  }

  function handleLinkSim(simId) {
    linkSimulation(id, simId)
    setShowLinkSim(false)
  }

  function handleAddScenario(e) {
    e.preventDefault()
    addScenario(id, newScenarioName.trim() || undefined)
    setNewScenarioName('')
    setShowAddScenario(false)
  }

  function handleAddReminder(e) {
    e.preventDefault()
    if (!reminderText.trim() || !reminderDate) return
    addReminder(id, { text: reminderText.trim(), dueAt: reminderDate })
    setReminderText('')
    setReminderDate('')
  }

  async function handleSearchDPE() {
    if (!project.postalCode && !project.address) return
    setDpeLoading(true)
    setDpeError(null)
    setDpeResults(null)
    setShowDpeSection(true)
    try {
      const { results, geocoding, method } = await searchDPE(
        project.address || '',
        project.postalCode || '',
        project.city || ''
      )
      setDpeResults({ items: results, geocoding, method })
    } catch (err) {
      setDpeError(err.message)
    } finally {
      setDpeLoading(false)
    }
  }

  function handleSelectDPE(dpe) {
    updateProject(id, {
      dpe: {
        numeroDpe: dpe.numeroDpe,
        etiquetteDpe: dpe.etiquetteDpe,
        etiquetteGes: dpe.etiquetteGes,
        periodeConstruction: dpe.periodeConstruction,
        anneeConstruction: dpe.anneeConstruction,
        surface: dpe.surface,
        consoM2: dpe.consoM2,
        emissionGes: dpe.emissionGes,
        energieChauffage: dpe.energieChauffage,
        isolationEnveloppe: dpe.isolationEnveloppe,
        isolationMurs: dpe.isolationMurs,
        isolationMenuiseries: dpe.isolationMenuiseries,
        dateEtablissement: dpe.dateEtablissement,
        dateFinValidite: dpe.dateFinValidite,
        adresse: dpe.adresse,
        observatoireUrl: dpe.observatoireUrl,
      },
    })
    setShowDpeSection(false)
  }

  const dpe = project.dpe
  const dpeColor = dpe?.etiquetteDpe ? getDpeColor(dpe.etiquetteDpe) : null
  const gesColor = dpe?.etiquetteGes ? getDpeColor(dpe.etiquetteGes) : null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back + Edit */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/projets')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Projets
        </button>
        <Link
          to={`/projets/${id}/modifier`}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Jauge */}
          <CompletionGauge percent={completion.percent} size="lg" variant="circle" />

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {project.firstName} {project.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {project.category && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${CATEGORY_BADGE[project.category]}`}>
                  {project.category} — {project.categoryLabel}
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentStatus?.color}`}>
                {currentStatus?.label}
              </span>
              {project.leadId && (
                <Link
                  to={`/leads/${project.leadId}`}
                  className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                >
                  Voir le lead
                </Link>
              )}
            </div>

            {/* Missing fields */}
            {completion.percent < 100 && (
              <div className="mt-3 flex items-center gap-2">
                <CompletionGauge percent={completion.percent} variant="bar" label={`${completion.filledCount}/${completion.totalCount} champs`} />
                <Link
                  to={`/projets/${project.id}/modifier`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold whitespace-nowrap"
                >
                  Compléter
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
          {project.phone && (
            <a href={`tel:${project.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
              <Phone className="w-4 h-4 text-gray-400" /> {project.phone}
            </a>
          )}
          {project.email && (
            <a href={`mailto:${project.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
              <Mail className="w-4 h-4 text-gray-400" /> {project.email}
            </a>
          )}
          {(project.address || project.city) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              {[project.address, project.postalCode, project.city].filter(Boolean).join(', ')}
            </div>
          )}
          {project.typeLogement && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="w-4 h-4 text-gray-400" />
              {project.typeLogement === 'maison' ? 'Maison' : 'Appartement'}
              {project.surface ? ` — ${project.surface} m²` : ''}
            </div>
          )}
          {project.rfr && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4 text-gray-400" />
              RFR : {Number(project.rfr).toLocaleString('fr-FR')} € — {project.personnes} pers.
            </div>
          )}
        </div>

        {/* Auto-detected location badges */}
        {locationInfo && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              <MapPin className="w-3 h-3" /> {locationInfo.region}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Zone {locationInfo.zoneClimatique}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Dept. {locationInfo.departement}
            </span>
            {locationInfo.isIDF && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                Île-de-France
              </span>
            )}
          </div>
        )}
      </div>

      {/* DPE Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Diagnostic énergétique (DPE)
          </h2>
          <button
            onClick={handleSearchDPE}
            disabled={!project.postalCode || dpeLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition disabled:opacity-40"
          >
            {dpeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {dpe ? 'Actualiser le DPE' : 'Consulter les DPE'}
          </button>
        </div>

        {/* Saved DPE */}
        {dpe && (
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                style={{ backgroundColor: dpeColor?.bg, color: dpeColor?.text }}
              >
                {dpe.etiquetteDpe}
              </div>
              {dpe.etiquetteGes && (
                <div
                  className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ backgroundColor: gesColor?.bg, color: gesColor?.text }}
                >
                  <span className="text-2xl font-black leading-none">{dpe.etiquetteGes}</span>
                  <span className="text-[8px] font-bold leading-none">GES</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800">
                  DPE {dpe.etiquetteDpe}
                  {dpe.consoM2 ? ` — ${dpe.consoM2} kWh/m²/an` : ''}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dpe.periodeConstruction ? `Construction : ${dpe.periodeConstruction}` : ''}
                  {dpe.anneeConstruction ? ` (${dpe.anneeConstruction})` : ''}
                  {dpe.surface ? ` — ${dpe.surface} m²` : ''}
                  {dpe.energieChauffage ? ` — ${dpe.energieChauffage}` : ''}
                </p>
                {(dpe.isolationEnveloppe || dpe.isolationMurs) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {dpe.isolationEnveloppe ? `Isolation : ${dpe.isolationEnveloppe}` : ''}
                    {dpe.isolationMurs ? ` — Murs : ${dpe.isolationMurs}` : ''}
                    {dpe.isolationMenuiseries ? ` — Menuiseries : ${dpe.isolationMenuiseries}` : ''}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-400">
                    {dpe.dateEtablissement ? `Établi le ${new Date(dpe.dateEtablissement).toLocaleDateString('fr-FR')}` : ''}
                    {dpe.dateFinValidite ? ` — Valide jusqu'au ${new Date(dpe.dateFinValidite).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                  {dpe.observatoireUrl && (
                    <a
                      href={dpe.observatoireUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Fiche ADEME
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!dpe && !showDpeSection && (
          <p className="text-sm text-gray-400 text-center py-2">
            Aucun DPE rattaché. Cliquez sur \« Consulter les DPE \» pour rechercher.
          </p>
        )}

        {/* DPE search results */}
        {showDpeSection && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">
                {dpeLoading && 'Recherche en cours\…'}
                {!dpeLoading && dpeResults && (
                  <>
                    {dpeResults.items.length} résultat{dpeResults.items.length > 1 ? 's' : ''} trouvé{dpeResults.items.length > 1 ? 's' : ''}
                    {dpeResults.geocoding && (
                      <span className="text-gray-400 ml-1">— {dpeResults.geocoding.label}</span>
                    )}
                  </>
                )}
              </p>
              <button onClick={() => setShowDpeSection(false)} className="text-xs text-gray-400 hover:text-gray-600">
                Fermer
              </button>
            </div>

            {dpeError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg p-2">{dpeError}</p>
            )}

            {dpeResults && dpeResults.items.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Aucun DPE trouvé à cette adresse.</p>
            )}

            {dpeResults && dpeResults.items.length > 0 && (
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {dpeResults.items.map((dpeItem) => {
                  const color = getDpeColor(dpeItem.etiquetteDpe)
                  return (
                    <button
                      key={dpeItem.numeroDpe}
                      onClick={() => handleSelectDPE(dpeItem)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black shrink-0"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {dpeItem.etiquetteDpe || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {dpeItem.adresse || 'Adresse non renseignée'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dpeItem.consoM2 ? `${dpeItem.consoM2} kWh/m²/an` : ''}
                          {dpeItem.surface ? ` — ${dpeItem.surface} m²` : ''}
                          {dpeItem.periodeConstruction ? ` — ${dpeItem.periodeConstruction}` : ''}
                          {dpeItem.typeBatiment ? ` — ${dpeItem.typeBatiment}` : ''}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {dpeItem.dateEtablissement ? new Date(dpeItem.dateEtablissement).toLocaleDateString('fr-FR') : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline / Statut */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Avancement</h2>
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateProjectStatus(id, s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                project.status === s.value
                  ? `${s.color} border-current ring-2 ring-offset-1 ring-current/20`
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${project.status === s.value ? s.dot : 'bg-gray-300'}`} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scénarios */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Scénarios ({(project.scenarios || []).length})
          </h2>
          <button
            onClick={() => setShowAddScenario(!showAddScenario)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau scénario
          </button>
        </div>

        {showAddScenario && (
          <form onSubmit={handleAddScenario} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              placeholder="Nom du scénario (optionnel)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Créer
            </button>
          </form>
        )}

        {(project.scenarios || []).length === 0 && !showAddScenario && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucun scénario. Créez un scénario pour simuler différentes options de travaux.
          </p>
        )}

        <div className="space-y-3">
          {(project.scenarios || []).map((scenario) => {
            const totals = getScenarioTotals(scenario)
            return (
              <Link
                key={scenario.id}
                to={`/projets/${id}/scenario/${scenario.id}`}
                className="block p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{scenario.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {scenario.simulations.length} simulation{scenario.simulations.length > 1 ? 's' : ''}
                      {scenario.ptz && ' + PTZ'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {totals.totalAides > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{totals.totalAides.toLocaleString('fr-FR')} €</p>
                        <p className="text-[10px] text-gray-400">aides totales</p>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition" />
                  </div>
                </div>
                {totals.totalCost > 0 && (
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>CEE : <strong className="text-gray-700">{totals.totalCee.toLocaleString('fr-FR')} €</strong></span>
                    <span>MPR : <strong className="text-gray-700">{totals.totalMpr.toLocaleString('fr-FR')} €</strong></span>
                    <span>Coût : <strong className="text-gray-700">{totals.totalCost.toLocaleString('fr-FR')} €</strong></span>
                    <span>RAC : <strong className="text-orange-600">{totals.resteACharge.toLocaleString('fr-FR')} €</strong></span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Simulations (legacy / rattachement) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Simulations rapides ({linkedSims.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLinkSim(!showLinkSim)}
              className="text-xs text-gray-500 font-medium hover:underline"
            >
              Rattacher
            </button>
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowNewSim(!showNewSim)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold text-sm hover:bg-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle simulation
          </button>
        </div>

        {showNewSim && (
          <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xs text-indigo-600 font-semibold mb-3">Choisir un simulateur :</p>
            <div className="space-y-3">
              {CATALOG.map((cat) => (
                <div key={cat.category}>
                  <p className="text-xs text-gray-500 font-medium mb-1">{cat.emoji} {cat.category}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {cat.items.filter((i) => i.active).map((item) => (
                      <Link
                        key={item.code}
                        to={`${item.route}?clientId=${id}`}
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

        {showLinkSim && unlinkedSims.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto space-y-1">
            {unlinkedSims.map((sim) => (
              <button
                key={sim.id}
                onClick={() => handleLinkSim(sim.id)}
                className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition text-sm"
              >
                <span>
                  <span className="font-semibold text-gray-800">{sim.title}</span>
                  <span className="text-gray-400 ml-2">{new Date(sim.date).toLocaleDateString('fr-FR')}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
        {showLinkSim && unlinkedSims.length === 0 && (
          <p className="text-xs text-gray-400 mb-4">Aucune simulation non rattachée disponible.</p>
        )}

        {linkedSims.length === 0 && !showNewSim && !showLinkSim && (
          <p className="text-sm text-gray-400 text-center py-2">Aucune simulation rattachée.</p>
        )}
        {linkedSims.length > 0 && (
          <div className="space-y-2">
            {linkedSims.map((sim) => {
              const ficheRoute = CATALOG.flatMap((c) => c.items).find((i) => i.code === sim.type)?.route
              return (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">{sim.type}</span>
                      <p className="font-semibold text-sm text-gray-800">{sim.title}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(sim.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {sim.results?.totalAid != null && (
                        <span className="ml-2 text-green-600 font-semibold">
                          Aides : {Number(sim.results.totalAid).toLocaleString('fr-FR')} €
                        </span>
                      )}
                      {sim.results?.totalAides != null && !sim.results?.totalAid && (
                        <span className="ml-2 text-green-600 font-semibold">
                          Aides : {Number(sim.results.totalAides).toLocaleString('fr-FR')} €
                        </span>
                      )}
                      {sim.results?.resteACharge != null && (
                        <span className="ml-2 text-orange-600 font-medium">
                          RAC : {Number(sim.results.resteACharge).toLocaleString('fr-FR')} €
                        </span>
                      )}
                    </p>
                  </div>
                  {ficheRoute && (
                    <Link
                      to={`${ficheRoute}?clientId=${id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Simuler
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes ({(project.notes || []).length})
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Ajouter une note..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(project.notes || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune note.</p>
            )}
            {(project.notes || []).map((note) => (
              <div key={note.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg group">
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{note.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(note.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => deleteNote(id, note.id)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rappels */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" /> Rappels
          </h2>
          <form onSubmit={handleAddReminder} className="space-y-2 mb-4">
            <input
              type="text"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="Rappel..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!reminderText.trim() || !reminderDate}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(project.reminders || []).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Aucun rappel</p>
            )}
            {(project.reminders || []).map((reminder) => {
              const isOverdue = !reminder.done && reminder.dueAt && new Date(reminder.dueAt) < new Date()
              return (
                <div key={reminder.id} className={`flex items-start gap-2 p-2 rounded-lg text-sm group ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <button
                    onClick={() => toggleReminder(id, reminder.id)}
                    className={`mt-0.5 shrink-0 ${reminder.done ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}`}
                  >
                    {reminder.done ? <CheckCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-gray-700 ${reminder.done ? 'line-through opacity-50' : ''}`}>{reminder.text}</p>
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(reminder.dueAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {isOverdue && <AlertTriangle className="w-3 h-3" />}
                    </p>
                  </div>
                  <button onClick={() => deleteReminder(id, reminder.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
