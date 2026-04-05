import { MapPin, Globe, Phone, Mail } from 'lucide-react'
import { getStatusInfo, getMetaDomaineColor, getPriorityInfo } from '../../utils/rgeApi'
import FollowUpBadge from './FollowUpBadge'

/**
 * Card compacte pour le Kanban et la liste
 */
export default function ProspectCard({ prospect, onClick, compact = false }) {
  const { siret, nom, commune, codePostal, domaines, status, nextFollowUp, followUpType, priority, lastActivityAt, siteInternet, telephone, email } = prospect
  const statusInfo = getStatusInfo(status)
  const priorityInfo = getPriorityInfo(priority)

  const daysSinceActivity = lastActivityAt
    ? Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86400000)
    : null

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-gray-300 transition group"
      style={{ borderLeftWidth: '3px', borderLeftColor: statusInfo.hex }}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-sm text-gray-800 truncate group-hover:text-indigo-700 transition">{nom}</h4>
          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            {codePostal} {commune}
          </p>
        </div>
        {/* Priorité dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${priorityInfo.dot}`} title={priorityInfo.label} />
      </div>

      {/* Contact rapide */}
      {!compact && (
        <div className="flex gap-2 mt-1.5 text-[10px] text-gray-400">
          {telephone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {telephone}</span>}
          {email && <span className="flex items-center gap-0.5 truncate"><Mail className="w-2.5 h-2.5" /> {email}</span>}
          {siteInternet && <span className="flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" /> Site</span>}
        </div>
      )}

      {/* Domaines */}
      {domaines && domaines.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {domaines.slice(0, compact ? 2 : 4).map((d) => (
            <span key={d} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getMetaDomaineColor()}`}>
              {d.length > 25 ? d.slice(0, 22) + '...' : d}
            </span>
          ))}
          {domaines.length > (compact ? 2 : 4) && (
            <span className="text-[9px] text-gray-400 px-1">+{domaines.length - (compact ? 2 : 4)}</span>
          )}
        </div>
      )}

      {/* Pied : relance + dernière activité */}
      <div className="flex items-center justify-between mt-2 gap-2">
        <FollowUpBadge date={nextFollowUp} type={followUpType} compact />
        {daysSinceActivity !== null && (
          <span className={`text-[10px] ${daysSinceActivity > 14 ? 'text-red-400' : daysSinceActivity > 7 ? 'text-amber-400' : 'text-gray-400'}`}>
            {daysSinceActivity === 0 ? "Aujourd'hui" : `${daysSinceActivity}j`}
          </span>
        )}
      </div>
    </div>
  )
}
