import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Home,
  ChevronRight, ChevronDown, ChevronUp, MessageSquare, Send, Trash2, FileText, Plus, ExternalLink,
  Loader2, Thermometer,
  Bell, Check, Calendar, CheckCircle, Layers, User, Zap,
  Clock, MoreHorizontal, Copy, PhoneCall, MailPlus, Globe
} from 'lucide-react'
import { useProjects, PROJECT_STATUSES } from '../hooks/useProjects'
import { useRole } from '../contexts/RoleContext'
import { useAllOrgData } from '../hooks/useAllOrgData'
import { useDocumentRequests, DOC_TYPES, DOC_REQUEST_STATUSES } from '../hooks/useDocumentRequests'
import { useProjectBeneficiary } from '../hooks/useProjectBeneficiary'
import { useSimulationHistory } from '../hooks/useSimulationHistory'
import { useSettings } from '../hooks/useSettings'
import DocumentRequestModal from '../components/project/DocumentRequestModal'
import { CATALOG } from '../lib/constants/catalog'
import { getLocationInfo } from '../utils/postalCode'
import { searchDPE, getDpeColor } from '../utils/dpeApi'
import { getCompletion } from '../lib/completionGauge'

const CAT_STYLE = {
  Bleu: { bg: 'bg-blue-500', text: 'text-white', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  Jaune: { bg: 'bg-yellow-500', text: 'text-white', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  Violet: { bg: 'bg-purple-500', text: 'text-white', light: 'bg-purple-50 text-purple-700 border-purple-200' },
  Rose: { bg: 'bg-pink-500', text: 'text-white', light: 'bg-pink-50 text-pink-700 border-pink-200' },
}

const fmt = (v) => v ? Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '0'

/* ─── Mini composants ─── */

function InfoItem({ icon: Icon, label, value, href, mono }) {
  if (!value) return null
  const content = (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-slate-800 ${mono ? 'font-mono' : ''} ${href ? 'hover:text-indigo-600 transition' : ''}`}>{value}</p>
      </div>
    </div>
  )
  if (href) return <a href={href} className="block">{content}</a>
  return content
}

function CompletionBar({ percent, filledCount, totalCount }) {
  const color = percent === 100 ? 'bg-emerald-500' : percent >= 70 ? 'bg-indigo-500' : percent >= 40 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 tabular-nums whitespace-nowrap">{filledCount}/{totalCount}</span>
    </div>
  )
}

function StatusStepper({ currentStatus, onStatusChange }) {
  const currentIdx = PROJECT_STATUSES.findIndex((s) => s.value === currentStatus)

  return (
    <div className="space-y-0.5">
      {PROJECT_STATUSES.map((s, i) => {
        const isCurrent = s.value === currentStatus
        const isPast = i < currentIdx
        const isLost = s.value === 'perdu'

        return (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
              isCurrent
                ? isLost
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                : isPast
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : isLost
                    ? 'text-red-300 hover:text-red-500 hover:bg-red-50'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            {isPast ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : isCurrent ? (
              <div className={`w-3 h-3 rounded-full shrink-0 ring-[3px] ring-offset-1 ${
                isLost ? 'bg-red-500 ring-red-200' : `${s.dot} ring-indigo-200`
              }`} />
            ) : (
              <div className="w-3 h-3 rounded-full bg-slate-200 shrink-0" />
            )}
            <span>{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    projects: ownProjects, updateProject, updateProjectStatus,
    addNote, deleteNote, addScenario, getScenarioTotals,
    addReminder, toggleReminder, deleteReminder,
  } = useProjects()
  const { isSuperAdmin } = useRole()
  const { allData: allOrgProjects } = useAllOrgData('projects')
  const projects = isSuperAdmin() && allOrgProjects.length > 0 ? [...ownProjects, ...allOrgProjects] : ownProjects
  const { history } = useSimulationHistory()

  const [noteText, setNoteText] = useState('')
  const [newScenarioName, setNewScenarioName] = useState('')
  const [showAddScenario, setShowAddScenario] = useState(false)
  const [reminderText, setReminderText] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [showDocForm, setShowDocForm] = useState(false)
  const [showDocRequestModal, setShowDocRequestModal] = useState(false)
  const [docType, setDocType] = useState('autre')
  const [docMessage, setDocMessage] = useState('')
  const [dpeResults, setDpeResults] = useState(null)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [showDpe, setShowDpe] = useState(false)
  const [showNewSim, setShowNewSim] = useState(false)
  const [contextExpanded, setContextExpanded] = useState(false)

  const { beneficiary, sharedScenarios: projectSharedScenarios } = useProjectBeneficiary(id)
  const { requests: docRequests, createRequest: createDocRequest, updateRequestStatus } = useDocumentRequests(id)
  const { settings } = useSettings()

  const project = projects.find((c) => c.id === id)
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-lg">Projet introuvable</p>
      </div>
    )
  }

  const st = PROJECT_STATUSES.find((s) => s.value === project.status)
  const loc = project.postalCode ? getLocationInfo(project.postalCode) : null
  const dpe = project.dpe
  const completion = getCompletion(project)
  const catStyle = CAT_STYLE[project.category] || {}

  // Totaux globaux de tous les scenarios
  const allScenarioTotals = (project.scenarios || []).map((sc) => getScenarioTotals(sc))
  const globalTotals = allScenarioTotals.reduce(
    (acc, t) => ({
      totalCost: acc.totalCost + t.totalCost,
      totalCee: acc.totalCee + t.totalCee,
      totalMpr: acc.totalMpr + t.totalMpr,
      resteACharge: acc.resteACharge + t.resteACharge,
    }),
    { totalCost: 0, totalCee: 0, totalMpr: 0, resteACharge: 0 }
  )
  const hasFinancials = globalTotals.totalCost > 0

  // Rappels en retard
  const overdueReminders = (project.reminders || []).filter(
    (r) => !r.done && r.dueAt && new Date(r.dueAt) < new Date()
  )

  function handleAddNote() {
    if (!noteText.trim()) return
    addNote(id, noteText.trim())
    setNoteText('')
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

  async function handleSearchDpe() {
    if (!project.postalCode) return
    setDpeLoading(true)
    setDpeResults(null)
    setShowDpe(true)
    try {
      const { results } = await searchDPE(project.address || '', project.postalCode || '', project.city || '')
      setDpeResults(results)
    } catch {
      /* ignore */
    } finally {
      setDpeLoading(false)
    }
  }

  function selectDpe(d) {
    updateProject(id, {
      dpe: {
        numeroDpe: d.numeroDpe, etiquetteDpe: d.etiquetteDpe, etiquetteGes: d.etiquetteGes,
        periodeConstruction: d.periodeConstruction, anneeConstruction: d.anneeConstruction,
        surface: d.surface, consoM2: d.consoM2, emissionGes: d.emissionGes,
        energieChauffage: d.energieChauffage, isolationEnveloppe: d.isolationEnveloppe,
        isolationMurs: d.isolationMurs, isolationMenuiseries: d.isolationMenuiseries,
        dateEtablissement: d.dateEtablissement, dateFinValidite: d.dateFinValidite,
        adresse: d.adresse, observatoireUrl: d.observatoireUrl,
      },
    })
    setShowDpe(false)
  }

  async function handleCreateDocRequest() {
    await createDocRequest({
      projectId: id, beneficiaryUid: beneficiary?.uid || '',
      docType, label: DOC_TYPES.find((d) => d.value === docType)?.label || docType,
      message: docMessage,
    })
    setShowDocForm(false)
    setDocType('autre')
    setDocMessage('')
  }

  const fullName = `${project.civilite ? project.civilite + '. ' : ''}${project.firstName} ${project.lastName}`.trim()
  const initials = `${(project.firstName || '?')[0]}${(project.lastName || '?')[0]}`.toUpperCase()
  const addressLine = [project.address, project.postalCode, project.city].filter(Boolean).join(', ')

  return (
    <div className="animate-fade-in bg-slate-50 min-h-screen">

      {/* ═══ HEADER STICKY ═══ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 py-2 text-xs text-slate-400">
            <Link to="/projets" className="hover:text-indigo-600 transition">Projets</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">{project.firstName} {project.lastName}</span>
          </div>

          {/* Main header */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold ${
                project.category ? `${catStyle.bg} ${catStyle.text}` : 'bg-slate-200 text-slate-500'
              }`}>
                {initials}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
                  {project.category && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catStyle.light}`}>
                      {project.categoryLabel}
                    </span>
                  )}
                  {st && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  )}
                  {overdueReminders.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5">
                      <Bell className="w-2.5 h-2.5" />{overdueReminders.length} en retard
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {project.phone && (
                    <a href={`tel:${project.phone}`} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition">
                      <Phone className="w-3 h-3" />{project.phone}
                    </a>
                  )}
                  {project.email && (
                    <a href={`mailto:${project.email}`} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition">
                      <Mail className="w-3 h-3" />{project.email}
                    </a>
                  )}
                  {project.city && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{project.postalCode} {project.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {project.phone && (
                <a href={`tel:${project.phone}`} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition" title="Appeler">
                  <PhoneCall className="w-4 h-4" />
                </a>
              )}
              {project.email && (
                <a href={`mailto:${project.email}`} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Email">
                  <MailPlus className="w-4 h-4" />
                </a>
              )}
              <Link to={`/projets/${id}/modifier`} className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5">
                <Edit className="w-3.5 h-3.5" />Modifier
              </Link>
              <select
                value={project.status}
                onChange={(e) => updateProjectStatus(id, e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg border-0 text-white cursor-pointer transition"
              >
                {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BARRE CONTEXTE : Client + Logement (collapsible) ═══ */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Ligne resume toujours visible */}
          <button
            onClick={() => setContextExpanded(!contextExpanded)}
            className="w-full flex items-center justify-between py-2.5 text-left group"
          >
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
              {/* Completion */}
              <div className="flex items-center gap-2">
                <div className="w-20">
                  <CompletionBar percent={completion.percent} filledCount={completion.filledCount} totalCount={completion.totalCount} />
                </div>
                <span className="text-[10px] text-slate-400">{completion.percent}%</span>
              </div>

              <div className="w-px h-4 bg-slate-200" />

              {/* Infos cles client */}
              {project.occupation && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {project.occupation.replace(/_/g, ' ')}
                </span>
              )}
              {project.rfr && (
                <span>RFR {Number(project.rfr).toLocaleString('fr-FR')} € — {project.personnes} pers.</span>
              )}
              {project.category && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catStyle.light}`}>
                  {project.categoryLabel}
                </span>
              )}

              <div className="w-px h-4 bg-slate-200" />

              {/* Infos cles logement */}
              {project.typeLogement && (
                <span className="flex items-center gap-1">
                  <Home className="w-3 h-3 text-slate-400" />
                  {project.typeLogement === 'maison' ? 'Maison' : 'Appartement'}
                </span>
              )}
              {project.surface && <span>{project.surface} m²</span>}
              {project.ageBatiment && (
                <span>{project.ageBatiment === 'plus_15' ? '+15 ans' : project.ageBatiment === 'plus_2' ? '+2 ans' : '<2 ans'}</span>
              )}
              {loc && <span className="text-slate-400">{loc.zoneClimatique}</span>}
              {dpe && (
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-black"
                  style={{ backgroundColor: getDpeColor(dpe.etiquetteDpe)?.bg, color: getDpeColor(dpe.etiquetteDpe)?.text }}
                >
                  {dpe.etiquetteDpe}
                </span>
              )}

              {/* KPIs financiers inline */}
              {hasFinancials && (
                <>
                  <div className="w-px h-4 bg-slate-200" />
                  <span className="font-semibold text-slate-700">{fmt(globalTotals.totalCost)} €</span>
                  <span className="text-emerald-600 font-semibold">CEE {fmt(globalTotals.totalCee)} €</span>
                  <span className="text-blue-600 font-semibold">MPR {fmt(globalTotals.totalMpr)} €</span>
                  <span className="text-orange-600 font-semibold">RAC {fmt(globalTotals.resteACharge)} €</span>
                  {globalTotals.totalCost > 0 && (
                    <div className="w-24 flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                      {globalTotals.totalCee > 0 && (
                        <div className="bg-emerald-500" style={{ width: `${(globalTotals.totalCee / globalTotals.totalCost) * 100}%` }} />
                      )}
                      {globalTotals.totalMpr > 0 && (
                        <div className="bg-blue-500" style={{ width: `${(globalTotals.totalMpr / globalTotals.totalCost) * 100}%` }} />
                      )}
                      <div className="bg-orange-300 flex-1" />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-500 transition shrink-0 ml-4">
              <span className="text-[10px] font-medium">{contextExpanded ? 'Masquer' : 'Details'}</span>
              {contextExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Contenu depliable : detail client + logement */}
          {contextExpanded && (
            <div className="pb-4 pt-1 grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-slate-100 animate-fade-in">
              {/* Client */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <User className="w-3 h-3 text-indigo-500" />Informations client
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  <InfoItem icon={User} label="Nom complet" value={fullName} />
                  <InfoItem label="Occupation" value={project.occupation?.replace(/_/g, ' ')} />
                  <InfoItem icon={Mail} label="Email" value={project.email} href={`mailto:${project.email}`} />
                  <InfoItem icon={Phone} label="Telephone" value={project.phone} href={`tel:${project.phone}`} />
                  {project.rfr && (
                    <InfoItem label="RFR" value={`${Number(project.rfr).toLocaleString('fr-FR')} € — ${project.personnes} pers.`} />
                  )}
                  {project.category && (
                    <div className="py-1.5">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Precarite</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${catStyle.light}`}>
                        {project.categoryLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logement + DPE */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-3 h-3 text-indigo-500" />Logement
                  </h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSearchDpe() }}
                    disabled={!project.postalCode || dpeLoading}
                    className="text-[10px] font-medium text-indigo-500 hover:text-indigo-700 disabled:opacity-30 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
                  >
                    {dpeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Thermometer className="w-3 h-3" />}
                    Chercher DPE
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  {addressLine && <InfoItem icon={MapPin} label="Adresse" value={addressLine} />}
                  <InfoItem label="Surface" value={project.surface ? `${project.surface} m²` : null} />
                  <InfoItem label="Type" value={
                    project.typeLogement === 'maison' ? 'Maison individuelle' :
                    project.typeLogement === 'appartement' ? 'Appartement' : null
                  } />
                  <InfoItem label="Age" value={
                    project.ageBatiment === 'plus_15' ? 'Plus de 15 ans' :
                    project.ageBatiment === 'plus_2' ? 'Plus de 2 ans' :
                    project.ageBatiment === 'moins_2' ? 'Moins de 2 ans' : null
                  } />
                  <InfoItem label="Chauffage" value={project.chauffageActuel} />
                  {loc && <InfoItem icon={Globe} label="Zone climatique" value={`${loc.zoneClimatique} — ${loc.region}`} />}
                </div>

                {/* DPE affiche */}
                {dpe && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-black shrink-0"
                        style={{ backgroundColor: getDpeColor(dpe.etiquetteDpe)?.bg, color: getDpeColor(dpe.etiquetteDpe)?.text }}
                      >
                        {dpe.etiquetteDpe}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">DPE {dpe.etiquetteDpe} — {dpe.consoM2} kWh/m²/an</p>
                        <p className="text-[10px] text-slate-500">{dpe.periodeConstruction} — {dpe.surface} m² — {dpe.energieChauffage}</p>
                        {dpe.observatoireUrl && (
                          <a href={dpe.observatoireUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-indigo-500 hover:underline inline-flex items-center gap-0.5 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />Voir sur l'observatoire ADEME
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultats recherche DPE */}
                {showDpe && dpeResults?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 max-h-36 overflow-y-auto">
                    <p className="text-[10px] text-slate-400 font-semibold mb-1">Resultats DPE trouves :</p>
                    {dpeResults.map((d) => (
                      <button key={d.numeroDpe} onClick={(e) => { e.stopPropagation(); selectDpe(d) }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-50 text-left text-xs text-slate-600 transition">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-[10px]"
                          style={{ backgroundColor: getDpeColor(d.etiquetteDpe)?.bg }}>
                          {d.etiquetteDpe}
                        </div>
                        <span>{d.consoM2} kWh/m² — {d.surface} m²</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ZONE DE TRAVAIL PRINCIPALE ═══ */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ─── COLONNE PRINCIPALE (2/3) — Scenarios + Documents ─── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Scenarios */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </div>
                  Scenarios
                  <span className="text-slate-400 font-normal text-xs">({(project.scenarios || []).length})</span>
                </h2>
                <button onClick={() => setShowAddScenario(!showAddScenario)}
                  className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 px-3 py-2 rounded-lg transition shadow-sm">
                  <Plus className="w-3.5 h-3.5" />Nouveau scenario
                </button>
              </div>

              <div className="p-5 space-y-3">
                {showAddScenario && (
                  <form onSubmit={handleAddScenario} className="flex gap-2 mb-2">
                    <input type="text" value={newScenarioName} onChange={(e) => setNewScenarioName(e.target.value)}
                      placeholder="Nom du scenario (optionnel)" autoFocus
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Creer</button>
                    <button type="button" onClick={() => setShowAddScenario(false)} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-600">Annuler</button>
                  </form>
                )}

                {(project.scenarios || []).length === 0 && !showAddScenario && (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Layers className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Aucun scenario</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Creez un scenario pour commencer les simulations CEE</p>
                    <button onClick={() => setShowAddScenario(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition">
                      <Plus className="w-3.5 h-3.5" />Creer un scenario
                    </button>
                  </div>
                )}

                {(project.scenarios || []).map((sc) => {
                  const t = getScenarioTotals(sc)
                  return (
                    <Link key={sc.id} to={`/projets/${id}/scenario/${sc.id}`}
                      className="block rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group overflow-hidden">
                      {/* En-tete scenario */}
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            {sc.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                            {sc.simulations.length} simulation{sc.simulations.length > 1 ? 's' : ''}
                            {sc.ptz ? ' + PTZ' : ''}
                            {' — '}
                            {new Date(sc.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition" />
                      </div>

                      {/* Liste des simulations */}
                      {sc.simulations.length > 0 && (
                        <div className="px-4 pb-2 space-y-1">
                          {sc.simulations.map((sim) => {
                            const r = sim.results || {}
                            const cee = r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
                            const mpr = r.mprFinal || r.mprAmount || r.primeAmount || 0
                            return (
                              <div key={sim.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  {sim.type && (
                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px]">{sim.type}</span>
                                  )}
                                  <span className="text-slate-600">{sim.title || 'Simulation'}</span>
                                </div>
                                <div className="flex gap-3">
                                  {cee > 0 && <span className="text-emerald-600 font-semibold">{cee.toLocaleString('fr-FR')} €</span>}
                                  {mpr > 0 && <span className="text-blue-600 font-semibold">{mpr.toLocaleString('fr-FR')} €</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Totaux financiers */}
                      {t.totalCost > 0 && (
                        <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
                          <div className="py-2.5 text-center">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Cout</p>
                            <p className="text-xs font-bold text-slate-700">{fmt(t.totalCost)} €</p>
                          </div>
                          <div className="py-2.5 text-center">
                            <p className="text-[9px] uppercase text-emerald-500 font-bold tracking-wider">CEE</p>
                            <p className="text-xs font-bold text-emerald-600">{fmt(t.totalCee)} €</p>
                          </div>
                          <div className="py-2.5 text-center">
                            <p className="text-[9px] uppercase text-blue-500 font-bold tracking-wider">MPR</p>
                            <p className="text-xs font-bold text-blue-600">{fmt(t.totalMpr)} €</p>
                          </div>
                          <div className="py-2.5 text-center bg-orange-50/50">
                            <p className="text-[9px] uppercase text-orange-500 font-bold tracking-wider">RAC</p>
                            <p className="text-xs font-bold text-orange-600">{fmt(t.resteACharge)} €</p>
                          </div>
                        </div>
                      )}
                    </Link>
                  )
                })}

                {/* Simulation rapide */}
                {(project.scenarios || []).length > 0 && (
                  <div className="pt-2">
                    <button onClick={() => setShowNewSim(!showNewSim)}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />Simulation rapide (hors scenario)
                    </button>
                    {showNewSim && (
                      <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        {CATALOG.map((cat) => (
                          <div key={cat.category}>
                            <p className="text-[10px] text-slate-500 font-semibold mb-1">{cat.emoji} {cat.category}</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {cat.items.filter((i) => i.active).map((item) => (
                                <Link key={item.code} to={`${item.route}?clientId=${id}`}
                                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm text-xs transition">
                                  <span className="text-slate-700 font-medium">{item.title}</span>
                                  <ChevronRight className="w-3 h-3 text-slate-300" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Documents */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  Documents
                  <span className="text-slate-400 font-normal text-xs">({docRequests.length})</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowDocRequestModal(true)}
                    className="text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <MailPlus className="w-3 h-3" />Demander des pièces
                  </button>
                  <button onClick={() => setShowDocForm(!showDocForm)} disabled={!beneficiary}
                    className={`text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                      beneficiary
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}>
                    <Plus className="w-3 h-3" />Ajouter
                  </button>
                </div>
              </div>
              <div className="p-5">
                {showDocForm && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Type</label>
                        <select value={docType} onChange={(e) => setDocType(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-200 outline-none">
                          {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Message</label>
                        <input type="text" value={docMessage} onChange={(e) => setDocMessage(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-200 outline-none" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowDocForm(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Annuler</button>
                      <button onClick={handleCreateDocRequest}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-1 transition">
                        <Send className="w-3 h-3" />Envoyer
                      </button>
                    </div>
                  </div>
                )}

                {docRequests.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Aucun document demande</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docRequests.map((req) => {
                      const sm = DOC_REQUEST_STATUSES.find((s) => s.value === req.status) || DOC_REQUEST_STATUSES[0]
                      return (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-slate-700">{req.label}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${sm.color}`}>{sm.label}</span>
                            </div>
                            {req.message && <p className="text-[10px] text-slate-400 mt-0.5">{req.message}</p>}
                          </div>
                          {req.status === 'en_attente' && (
                            <button onClick={() => updateRequestStatus(req.id, 'fourni')} className="p-1.5 rounded-lg hover:bg-emerald-50 transition">
                              <Check className="w-4 h-4 text-emerald-500" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ─── SIDEBAR DROITE (1/3) ─── */}
          <div className="space-y-5">

            {/* Suivi & Pipeline */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />Suivi du projet
                </h2>
              </div>
              <div className="p-4">
                {/* Beneficiaire */}
                {beneficiary ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-1.5 mb-4">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium">{beneficiary.name || beneficiary.email}</span>
                  </div>
                ) : projectSharedScenarios.length > 0 ? (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600 flex items-center gap-1.5 mb-4">
                    <Clock className="w-3.5 h-3.5 shrink-0" />En attente d'inscription
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 flex items-center gap-1.5 mb-4">
                    <Send className="w-3.5 h-3.5 shrink-0" />Partagez un scenario pour lier le client
                  </div>
                )}

                <StatusStepper currentStatus={project.status} onStatusChange={(v) => updateProjectStatus(id, v)} />
              </div>
            </section>

            {/* Rappels */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-500" />
                  Rappels
                  {overdueReminders.length > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{overdueReminders.length}</span>
                  )}
                </h2>
              </div>
              <div className="p-4">
                <form onSubmit={handleAddReminder} className="space-y-2 mb-3">
                  <input type="text" value={reminderText} onChange={(e) => setReminderText(e.target.value)}
                    placeholder="Nouveau rappel..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-200 outline-none" />
                  <div className="flex gap-1.5">
                    <input type="datetime-local" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-indigo-200 outline-none" />
                    <button type="submit" disabled={!reminderText.trim() || !reminderDate}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-30 hover:bg-indigo-700 transition">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </form>

                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {(project.reminders || []).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-3">Aucun rappel</p>
                  )}
                  {(project.reminders || []).map((r) => {
                    const overdue = !r.done && r.dueAt && new Date(r.dueAt) < new Date()
                    return (
                      <div key={r.id} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs group transition ${
                        overdue ? 'bg-red-50 border border-red-200' : r.done ? 'bg-slate-50 opacity-60' : 'bg-slate-50'
                      }`}>
                        <button onClick={() => toggleReminder(id, r.id)}
                          className={`mt-0.5 shrink-0 transition ${r.done ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}>
                          {r.done ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-slate-700 ${r.done ? 'line-through' : ''}`}>{r.text}</p>
                          <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${overdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(r.dueAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button onClick={() => deleteReminder(id, r.id)}
                          className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Notes
                  <span className="text-slate-400 font-normal">({(project.notes || []).length})</span>
                </h2>
              </div>
              <div className="p-4">
                <div className="flex gap-1.5 mb-3">
                  <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Ajouter une note..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-200 outline-none" />
                  <button onClick={handleAddNote} disabled={!noteText.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-30 hover:bg-indigo-700 transition">
                    <Send className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {(project.notes || []).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-3">Aucune note</p>
                  )}
                  {(project.notes || []).map((n) => (
                    <div key={n.id} className="p-2.5 bg-slate-50 rounded-lg group">
                      <div className="flex justify-between">
                        <p className="text-xs text-slate-700 leading-relaxed">{n.text}</p>
                        <button onClick={() => deleteNote(id, n.id)}
                          className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0 ml-2 transition">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(n.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ═══ MODAL — Demande de pièces ═══ */}
      <DocumentRequestModal
        open={showDocRequestModal}
        onClose={() => setShowDocRequestModal(false)}
        clientFirstName={beneficiary?.firstName || project?.firstName || ''}
        clientLastName={beneficiary?.lastName || project?.lastName || ''}
        clientEmail={beneficiary?.email || project?.email || ''}
        initialTags={['CEE']}
        initialPrecarity={
          project?.category === 'Bleu' ? 'tres_modeste' :
          project?.category === 'Jaune' ? 'modeste' :
          project?.category === 'Violet' ? 'intermediaire' :
          project?.category === 'Rose' ? 'superieur' : ''
        }
        company={settings?.company || {}}
      />
    </div>
  )
}
