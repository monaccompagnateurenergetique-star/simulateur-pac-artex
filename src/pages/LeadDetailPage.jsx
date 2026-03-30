import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Phone, Mail, MapPin, Home, Users as UsersIcon,
  Bell, Plus, Trash2, Check, ArrowRightCircle, MessageSquare, Calendar,
  AlertTriangle, CheckCircle
} from 'lucide-react'
import { useLeads, LEAD_STATUSES } from '../hooks/useLeads'
import { useProjects } from '../hooks/useProjects'
import CompletionGauge from '../components/ui/CompletionGauge'
import { getCompletion } from '../lib/completionGauge'

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
    leads, updateLeadStatus, addLeadNote, deleteLeadNote,
    addLeadReminder, toggleLeadReminder, deleteLeadReminder,
    convertToProject,
  } = useLeads()
  const { addProject } = useProjects()

  const lead = leads.find((l) => l.id === id)

  const [noteText, setNoteText] = useState('')
  const [reminderText, setReminderText] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)

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
