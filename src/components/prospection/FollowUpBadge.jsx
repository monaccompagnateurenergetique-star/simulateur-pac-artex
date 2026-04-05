import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'

/**
 * Badge de relance — vert (à venir), amber (aujourd'hui), rouge (en retard)
 */
export default function FollowUpBadge({ date, type, compact = false }) {
  if (!date) return null

  const now = new Date()
  const target = new Date(date)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / 86400000)

  let color, icon, text
  if (diffDays < 0) {
    color = 'bg-red-100 text-red-700'
    icon = <AlertTriangle className="w-3 h-3" />
    text = `En retard ${Math.abs(diffDays)}j`
  } else if (diffDays === 0) {
    color = 'bg-amber-100 text-amber-700'
    icon = <Clock className="w-3 h-3" />
    text = "Aujourd'hui"
  } else if (diffDays <= 3) {
    color = 'bg-emerald-100 text-emerald-700'
    icon = <Clock className="w-3 h-3" />
    text = `Dans ${diffDays}j`
  } else {
    color = 'bg-gray-100 text-gray-600'
    icon = <Clock className="w-3 h-3" />
    text = target.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${color}`} title={`Relance: ${type || 'appel'}`}>
        {icon}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${color}`}>
      {icon} {text} {type && `(${type})`}
    </span>
  )
}
