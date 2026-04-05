import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ACTIVITY_TYPES, ACTIVITY_OUTCOMES, PROSPECT_STATUSES } from '../../utils/rgeApi'

export default function ActivityForm({ onSubmit, currentStatus }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('appel')
  const [description, setDescription] = useState('')
  const [outcome, setOutcome] = useState('')
  const [duration, setDuration] = useState('')
  const [changeStatus, setChangeStatus] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState('appel')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)

    try {
      await onSubmit({
        type,
        description: description.trim(),
        outcome: outcome || null,
        duration: duration ? parseInt(duration) : null,
        date: new Date().toISOString(),
        triggeredStatusChange: changeStatus || null,
        nextFollowUp: followUpDate || null,
        followUpType: followUpDate ? followUpType : null,
      })
      // Reset
      setDescription('')
      setOutcome('')
      setDuration('')
      setChangeStatus('')
      setFollowUpDate('')
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
      >
        <Plus className="w-4 h-4" /> Ajouter une activité
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-700 uppercase">Nouvelle activité</h4>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Annuler
        </button>
      </div>

      {/* Type */}
      <div className="flex flex-wrap gap-1.5">
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              type === t.value ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Que s'est-il passé ?"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        autoFocus
      />

      {/* Ligne résultat + durée */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Résultat</label>
          <div className="flex gap-1">
            {ACTIVITY_OUTCOMES.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setOutcome(outcome === o.value ? '' : o.value)}
                className={`flex-1 px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                  outcome === o.value ? o.color + ' ring-1 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {(type === 'appel' || type === 'reunion' || type === 'demo') && (
          <div className="w-20">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Durée (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              min={0}
            />
          </div>
        )}
      </div>

      {/* Changer le statut */}
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Changer le statut (optionnel)</label>
        <select
          value={changeStatus}
          onChange={(e) => setChangeStatus(e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Pas de changement</option>
          {PROSPECT_STATUSES.filter((s) => s.value !== currentStatus).map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Planifier relance */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Prochaine relance</label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {followUpDate && (
          <div className="w-28">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Type</label>
            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none bg-white"
            >
              <option value="appel">Appel</option>
              <option value="email">Email</option>
              <option value="reunion">Réunion</option>
              <option value="demo">Démo</option>
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!description.trim() || submitting}
        className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-40"
      >
        Enregistrer l'activité
      </button>
    </form>
  )
}
