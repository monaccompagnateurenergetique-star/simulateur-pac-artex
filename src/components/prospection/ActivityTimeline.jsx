import { Phone, Mail, Users, Monitor, FileText, RefreshCw, Send, Trash2 } from 'lucide-react'
import { getActivityTypeInfo, ACTIVITY_OUTCOMES } from '../../utils/rgeApi'

const ICONS = { Phone, Mail, Users, Monitor, FileText, RefreshCw, Send }

export default function ActivityTimeline({ activities, onDelete }) {
  if (!activities || activities.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic py-4 text-center">Aucune activité enregistrée</p>
    )
  }

  return (
    <div className="relative">
      {/* Ligne verticale */}
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-3">
        {activities.map((activity) => {
          const typeInfo = getActivityTypeInfo(activity.type)
          const IconComponent = ICONS[typeInfo.icon] || FileText
          const outcomeInfo = activity.outcome
            ? ACTIVITY_OUTCOMES.find((o) => o.value === activity.outcome)
            : null

          return (
            <div key={activity.id} className="flex gap-3 relative group">
              {/* Icône */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white border-2 border-gray-200 z-10 ${typeInfo.color}`}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700">{typeInfo.label}</span>
                  {outcomeInfo && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${outcomeInfo.color}`}>
                      {outcomeInfo.label}
                    </span>
                  )}
                  {activity.duration && (
                    <span className="text-[10px] text-gray-400">{activity.duration} min</span>
                  )}
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}
                    {new Date(activity.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {activity.description && (
                  <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                )}

                {activity.triggeredStatusChange && (
                  <p className="text-[10px] text-indigo-500 mt-0.5 font-medium">
                    → Statut changé en "{activity.triggeredStatusChange}"
                  </p>
                )}

                {/* Delete button */}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(activity.id) }}
                    className="absolute top-0 right-0 p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
