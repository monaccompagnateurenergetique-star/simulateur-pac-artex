import { Link } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import clsx from 'clsx'

export default function CatalogCard({ code, title, route, active }) {
  const content = (
    <div
      className={clsx(
        'group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200',
        active
          ? 'bg-white border-gray-200 hover:border-lime-400 hover:shadow-md cursor-pointer'
          : 'bg-gray-50 border-gray-100 opacity-60 cursor-default'
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-gray-400 mb-0.5">{code}</p>
        <p className={clsx('text-sm font-semibold truncate', active ? 'text-gray-800' : 'text-gray-500')}>
          {title}
        </p>
      </div>
      <div className="ml-3 flex-shrink-0">
        {active ? (
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-lime-600 group-hover:translate-x-1 transition-all" />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" />
            Bientôt
          </span>
        )}
      </div>

      {/* Left accent bar on hover */}
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-lime-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  )

  if (active && route) {
    return <Link to={route} className="block no-underline">{content}</Link>
  }

  return content
}
