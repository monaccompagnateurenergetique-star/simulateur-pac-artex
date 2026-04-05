import { useState } from 'react'
import {
  X, MapPin, Phone, Mail, Globe, Award, FileText, ExternalLink,
  ChevronDown, Calendar, AlertTriangle, Clock
} from 'lucide-react'
import { PROSPECT_STATUSES, getStatusInfo, getMetaDomaineColor, getPriorityInfo, PRIORITY_LEVELS, LOSS_REASONS } from '../../utils/rgeApi'
import ActivityTimeline from './ActivityTimeline'
import ActivityForm from './ActivityForm'
import FollowUpBadge from './FollowUpBadge'

export default function ProspectDetail({
  prospect,
  activities,
  activitiesLoading,
  onClose,
  onStatusChange,
  onPriorityChange,
  onFollowUpChange,
  onClearFollowUp,
  onAddActivity,
  onDeleteActivity,
}) {
  const [showQualifications, setShowQualifications] = useState(false)
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState('appel')
  const [lossReason, setLossReason] = useState('')
  const [showLossModal, setShowLossModal] = useState(false)
  const [pendingLossStatus, setPendingLossStatus] = useState(null)

  if (!prospect) return null

  const statusInfo = getStatusInfo(prospect.status)
  const priorityInfo = getPriorityInfo(prospect.priority)

  function handleStatusClick(newStatus) {
    if (newStatus === 'perdu') {
      setPendingLossStatus(newStatus)
      setShowLossModal(true)
      return
    }
    onStatusChange(prospect.siret, newStatus)
  }

  function handleLossConfirm() {
    onStatusChange(prospect.siret, pendingLossStatus, lossReason)
    setShowLossModal(false)
    setLossReason('')
  }

  function handleFollowUpSave() {
    if (!followUpDate) return
    onFollowUpChange(prospect.siret, followUpDate, followUpType)
    setShowFollowUpForm(false)
    setFollowUpDate('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-800 truncate">{prospect.nom}</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {prospect.adresse}, {prospect.codePostal} {prospect.commune}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">SIRET: {prospect.siret}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Pipeline statut */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Pipeline</h3>
            <div className="flex flex-wrap gap-1.5">
              {PROSPECT_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusClick(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${s.color} ${
                    prospect.status === s.value ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:opacity-80'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {prospect.lossReason && prospect.status === 'perdu' && (
              <p className="text-xs text-red-500 mt-1">
                Raison : {LOSS_REASONS.find((r) => r.value === prospect.lossReason)?.label || prospect.lossReason}
              </p>
            )}
          </div>

          {/* Modal perte */}
          {showLossModal && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-red-700 mb-2">Raison de la perte</h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {LOSS_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setLossReason(r.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      lossReason === r.value ? 'bg-red-600 text-white' : 'bg-white border border-red-200 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleLossConfirm} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
                  Confirmer
                </button>
                <button onClick={() => setShowLossModal(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Priorité + Relance */}
          <div className="flex gap-3">
            <div className="flex-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Priorité</h3>
              <div className="flex gap-1">
                {PRIORITY_LEVELS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => onPriorityChange(prospect.siret, p.value)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition ${p.color} ${
                      prospect.priority === p.value ? 'ring-2 ring-offset-1 ring-gray-300' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Relance</h3>
              {prospect.nextFollowUp ? (
                <div className="flex items-center gap-2">
                  <FollowUpBadge date={prospect.nextFollowUp} type={prospect.followUpType} />
                  <button onClick={() => onClearFollowUp(prospect.siret)} className="text-[10px] text-gray-400 hover:text-red-500">
                    Supprimer
                  </button>
                </div>
              ) : showFollowUpForm ? (
                <div className="flex gap-1.5 items-end">
                  <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs flex-1" />
                  <select value={followUpType} onChange={(e) => setFollowUpType(e.target.value)} className="px-1 py-1 border border-gray-300 rounded text-xs bg-white">
                    <option value="appel">Appel</option>
                    <option value="email">Email</option>
                    <option value="reunion">RDV</option>
                    <option value="demo">Démo</option>
                  </select>
                  <button onClick={handleFollowUpSave} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded font-semibold">OK</button>
                </div>
              ) : (
                <button onClick={() => setShowFollowUpForm(true)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                  <Calendar className="w-3 h-3" /> Planifier
                </button>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Contact</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              {prospect.telephone && (
                <a href={`tel:${prospect.telephone}`} className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {prospect.telephone}
                </a>
              )}
              {prospect.email && (
                <a href={`mailto:${prospect.email}`} className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {prospect.email}
                </a>
              )}
              {prospect.siteInternet && (
                <a href={prospect.siteInternet.startsWith('http') ? prospect.siteInternet : `https://${prospect.siteInternet}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-600">
                  <Globe className="w-4 h-4 text-gray-400" /> {prospect.siteInternet.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
            </div>
          </div>

          {/* Domaines RGE */}
          {prospect.domaines && prospect.domaines.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                Domaines RGE ({prospect.qualificationCount || prospect.domaines.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {prospect.domaines.map((d) => (
                  <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getMetaDomaineColor()}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historique statut */}
          {prospect.stageHistory && prospect.stageHistory.length > 1 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Historique pipeline</h3>
              <div className="flex flex-wrap gap-1">
                {prospect.stageHistory.map((h, i) => {
                  const si = getStatusInfo(h.status)
                  return (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${si.color}`}>
                      {si.label} — {new Date(h.enteredAt).toLocaleDateString('fr-FR')}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Activités */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
              Activités {activities.length > 0 && `(${activities.length})`}
            </h3>
            <ActivityForm onSubmit={(data) => onAddActivity(prospect.siret, data)} currentStatus={prospect.status} />
            <div className="mt-4">
              {activitiesLoading ? (
                <p className="text-xs text-gray-400 text-center py-4">Chargement...</p>
              ) : (
                <ActivityTimeline activities={activities} onDelete={(id) => onDeleteActivity(prospect.siret, id)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
