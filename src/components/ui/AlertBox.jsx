import clsx from 'clsx'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

const styles = {
  error: { bg: 'bg-red-50 border-red-300 text-red-700', icon: XCircle },
  warning: { bg: 'bg-yellow-50 border-yellow-300 text-yellow-700', icon: AlertTriangle },
  info: { bg: 'bg-blue-50 border-blue-300 text-blue-700', icon: Info },
  success: { bg: 'bg-green-50 border-green-300 text-green-700', icon: CheckCircle },
}

export default function AlertBox({ type = 'warning', title, children, show = true }) {
  if (!show) return null

  const { bg, icon: Icon } = styles[type]

  return (
    <div className={clsx('px-4 py-3 rounded-xl border animate-fade-in', bg)}>
      <div className="flex items-start gap-2">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          {title && <p className="font-bold">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
