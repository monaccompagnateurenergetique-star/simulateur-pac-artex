import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function SimulatorLayout({ code, title, description, children }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au catalogue
      </Link>

      {/* Header */}
      <div className="bg-indigo-900 rounded-t-2xl p-6 text-center">
        <p className="text-indigo-300 text-xs font-mono uppercase tracking-widest mb-1">{code}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-indigo-200 text-sm mt-1">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-200 border-t-0">
        <div className="p-6 md:p-8 space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
}
