import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Phone, Mail, MapPin, Home, Users as UsersIcon,
  Bell, Plus, Trash2, Check, ArrowRightCircle, MessageSquare, Calendar,
  AlertTriangle, CheckCircle, Thermometer, Search, Loader2, ChevronDown, ChevronUp, X
} from 'lucide-react'
import { useLeads, LEAD_STATUSES } from '../hooks/useLeads'
import { useProjects } from '../hooks/useProjects'
import { useRole } from '../contexts/RoleContext'
import { useAllOrgData } from '../hooks/useAllOrgData'
import CompletionGauge from '../components/ui/CompletionGauge'
import DpeDetailCard from '../components/dpe/DpeDetailCard'
import AddressAutocomplete from '../components/ui/AddressAutocomplete'
import { getCompletion } from '../lib/completionGauge'
import { searchDPE } from '../utils/dpeApi'

const CATEGORY_BADGE = {
  Bleu: 'bg-blue-100 text-blue-700 border-blue-200',
  Jaune: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Violet: 'bg-purple-100 text-purple-700 border-purple-200',
  Rose: 'bg-pink-100 text-pink-700 border-pink-200',
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    leads: ownLeads, updateLead, updateLeadStatus, addLeadNote, deleteLeadNote,
    addLeadReminder, toggleLeadReminder, deleteLeadReminder,
    convertToProject,
  } = useLeads()
  const { addProject } = useProjects()
  const { isSuperAdmin } = useRole()
  const { allData: allOrgLeads } = useAllOrgData('leads')
  const leads = isSuperAdmin() && allOrgLeads.length > 0 ? [...ownLeads, ...allOrgLeads] : ownLeads

  const lead = leads.find((l) => l.id === id)

  const [noteText, setNoteText] = useState('')
  const [reminderText, setReminderText] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [dpeResults, setDpeResults] = useState(null)
  const [dpeError, setDpeError] = useState(null)
  const [showDpePanel, setShowDpePanel] = useState(false)
  const [showDpeResults, setShowDpeResults] = useState(false)
  const [auditResults, setAuditResults] = useState(null)

  const completion = useMemo(() => getCompletion(lead), [lead])

  if (!lead) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        <p className="text-lg">Lead introuvable</p>
        <Link to="/leads" className="text-emerald-600 hover:underline mt-2 inline-block">Retour aux leads</Link>
      </div>
    )
  }

  const displayName = (lead.firstName || lead.lastName)
    ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
    : lead.phone || lead.email || 'Lead sans nom'

  const isConverted = lead.status === 'converti'

  function handleConvert() {
    const project = convertToProject(lead.id, addProject)
    if (project) {
      navigate(`/projets/${project.id}`)
    }
  }

  function handleAddNote(e) {
    e.preventDefault()
    if (!noteText.trim()) return
    addLeadNote(lead.id, noteText.trim())
    setNoteText('')
  }

  function handleAddReminder(e) {
    e.preventDefault()
    if (!reminderText.trim() || !reminderDate) return
    addLeadReminder(lead.id, { text: reminderText.trim(), dueAt: reminderDate })
    setReminderText('')
    setReminderDate('')
  }

  async function handleSearchDpe(address, postalCode, city) {
    const addr = address ?? lead.address ?? ''
    const cp = postalCode ?? lead.postalCode ?? ''
    const cty = city ?? lead.city ?? ''
    if (!cp && !addr) return
    setDpeLoading(true)
    setDpeResults(null)
    setDpeError(null)
    setAuditResults(null)
    setShowDpeResults(true)
    try {
      const { results, audits } = await searchDPE(addr, cp, cty)
      setDpeResults(results)
      setAuditResults(audits || [])
      // Persister audits si DPE deja attache
      if (lead.dpe && audits && audits.length > 0) {
        updateLead(lead.id, { audits })
      }
    } catch (err) {
      setDpeError(err.message || 'Erreur lors de la recherche')
    } finally {
      setDpeLoading(false)
    }
  }

  function handleAddressSelect({ address, postalCode, city }) {
    // Auto-remplir les champs du lead
    const updates = {}
    if (address) updates.address = address
    if (postalCode) updates.postalCode = postalCode
    if (city) updates.city = city
    if (Object.keys(updates).length > 0) {
      updateLead(lead.id, updates)
    }
    // Lancer la recherche DPE automatiquement
    handleSearchDpe(address, postalCode, city)
  }

  function handleSelectDpe(d) {
    updateLead(lead.id, { dpe: d, audits: auditResults || [] })
    setShowDpeResults(false)
    setShowDpePanel(false)
  }

  function handleDetachDpe() {
    updateLead(lead.id, { dpe: null, audits: null })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/leads')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour aux leads
      </button>

      {/* ─── HEADER CARD ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Jauge */}
          <CompletionGauge percent={completion.percent} size="lg" variant="circle" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{displayName}</h1>
              {lead.category && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${CATEGORY_BADGE[lead.category]}`}>
                  {lead.category}
                </span>
              )}
              {isConverted && (
                <Link
                  to={`/projets/${lead.convertedToProjectId}`}
                  className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 flex items-center gap-1"
                >
                  <ArrowRightCircle className="w-3 h-3" /> Voir le projet
                </Link>
              )}
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-emerald-600">
                  <Phone className="w-3.5 h-3.5" /> {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-emerald-600">
                  <Mail className="w-3.5 h-3.5" /> {lead.email}
                </a>
              )}
              {lead.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {lead.address} {lead.postalCode} {lead.city}
                </span>
              )}
            </div>

            {/* Missing fields */}
            {completion.percent < 100 && (
              <div className="mt-3 flex items-center gap-2">
                <CompletionGauge percent={completion.percent} variant="bar" label={`${completion.filledCount}/${completion.totalCount} champs`} />
                <Link
                  to={`/leads/${lead.id}/modifier`}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold whitespace-nowrap"
                >
                  Compléter
                </Link>
              </div>
            )}
          </div>

          {/* Edit button */}
          {!isConverted && (
            <Link
              to={`/leads/${lead.id}/modifier`}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition shrink-0"
            >
              <Edit3 className="w-4 h-4" /> Modifier
            </Link>
          )}
        </div>
      </div>

      {/* ─── STATUS PIPELINE ─── */}
      {!isConverted && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Statut du lead</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LEAD_STATUSES.filter((s) => s.value !== 'converti').map((s) => (
              <button
                key={s.value}
                onClick={() => updateLeadStatus(lead.id, s.value)}
                className={`p-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                  lead.status === s.value
                    ? `${s.color} border-current ring-2 ring-offset-1`
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${s.dot}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── CONVERT TO PROJECT ─── */}
      {!isConverted && lead.status === 'qualifie' && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 mb-6">
          {!showConvertConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-800">Lead qualifié</h3>
                <p className="text-sm text-emerald-700">Ce lead est prêt à devenir un projet avec scénarios de simulation.</p>
              </div>
              <button
                onClick={() => setShowConvertConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
              >
                <ArrowRightCircle className="w-4 h-4" /> Convertir en projet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-emerald-800 font-medium">
                Confirmer la conversion ? Toutes les informations du lead seront copiées dans un nouveau projet.
              </p>
              <div className="flex gap-2">
                <button onClick={handleConvert} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition">
                  Confirmer
                </button>
                <button onClick={() => setShowConvertConfirm(false)} className="px-4 py-2 bg-white text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition border border-gray-200">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── DPE SECTION ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-500" />
            Diagnostic DPE
          </h2>
          {!isConverted && (
            <button
              onClick={() => setShowDpePanel(!showDpePanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
            >
              <Search className="w-3.5 h-3.5" />
              {lead.dpe ? 'Actualiser' : 'Rechercher'}
              {showDpePanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Panneau de recherche avec autocomplete */}
        {showDpePanel && (
          <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Rechercher par adresse
            </p>
            <AddressAutocomplete
              value={lead.address ? `${lead.address}${lead.postalCode ? ', ' + lead.postalCode : ''}${lead.city ? ' ' + lead.city : ''}` : ''}
              onChange={handleAddressSelect}
              placeholder="Saisissez l'adresse du logement..."
            />
            <p className="text-[10px] text-indigo-400 mt-1.5">
              L'adresse, le code postal et la ville du lead seront mis a jour automatiquement.
            </p>

            {/* Bouton recherche manuelle si adresse deja remplie */}
            {(lead.postalCode || lead.address) && (
              <button
                onClick={() => handleSearchDpe()}
                disabled={dpeLoading}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-300 bg-white rounded-lg hover:bg-indigo-50 transition disabled:opacity-40"
              >
                {dpeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Rechercher avec l'adresse actuelle
              </button>
            )}

            {/* Loader */}
            {dpeLoading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Recherche en cours...
              </div>
            )}

            {/* Erreur */}
            {dpeError && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {dpeError}
              </div>
            )}

            {/* Resultats */}
            {showDpeResults && dpeResults && dpeResults.length > 0 && (
              <div className="mt-3 border border-indigo-200 rounded-xl overflow-hidden bg-white">
                <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-700">
                    {dpeResults.length} DPE trouve{dpeResults.length > 1 ? 's' : ''}
                  </p>
                  <button onClick={() => setShowDpeResults(false)} className="text-indigo-400 hover:text-indigo-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {dpeResults.slice(0, 8).map((d) => (
                    <div key={d.numeroDpe} className="hover:bg-indigo-50/50 transition">
                      <DpeDetailCard dpe={d} compact onAttach={() => handleSelectDpe(d)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showDpeResults && dpeResults && dpeResults.length === 0 && !dpeLoading && (
              <p className="mt-3 text-xs text-gray-400 text-center py-2">Aucun DPE trouve pour cette adresse.</p>
            )}
          </div>
        )}

        {/* DPE attache */}
        <div className="px-6 py-4">
          {lead.dpe ? (
            <DpeDetailCard dpe={lead.dpe} audits={lead.audits || auditResults} onDetach={!isConverted ? handleDetachDpe : undefined} />
          ) : (
            <div className="text-center py-6">
              <Thermometer className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">Aucun DPE rattache</p>
              <p className="text-xs text-gray-300">
                {lead.postalCode || lead.address
                  ? 'Cliquez sur "Rechercher" pour trouver le diagnostic energetique.'
                  : 'Renseignez une adresse pour rechercher le DPE.'}
              </p>
              {!showDpePanel && (lead.postalCode || lead.address) && (
                <button
                  onClick={() => { setShowDpePanel(true); handleSearchDpe() }}
                  disabled={dpeLoading}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-40"
                >
                  {dpeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Rechercher le DPE
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── NOTES ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Notes
          </h2>
          <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ajouter une note..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!noteText.trim()}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(lead.notes || []).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Aucune note</p>
            )}
            {(lead.notes || []).map((note) => (
              <div key={note.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 text-sm group">
                <div className="flex-1">
                  <p className="text-gray-700">{note.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(note.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => deleteLeadNote(lead.id, note.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RAPPELS ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" /> Rappels
          </h2>
          <form onSubmit={handleAddReminder} className="space-y-2 mb-4">
            <input
              type="text"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="Rappel..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!reminderText.trim() || !reminderDate}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(lead.reminders || []).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Aucun rappel</p>
            )}
            {(lead.reminders || []).map((reminder) => {
              const isOverdue = !reminder.done && reminder.dueAt && new Date(reminder.dueAt) < new Date()
              return (
                <div key={reminder.id} className={`flex items-start gap-2 p-2 rounded-lg text-sm group ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <button
                    onClick={() => toggleLeadReminder(lead.id, reminder.id)}
                    className={`mt-0.5 shrink-0 ${reminder.done ? 'text-green-500' : 'text-gray-300 hover:text-emerald-500'}`}
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
                  <button onClick={() => deleteLeadReminder(lead.id, reminder.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
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
