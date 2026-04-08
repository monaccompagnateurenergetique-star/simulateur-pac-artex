import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function SimulatorLayout({ code, title, description, children }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Back link */}
      <Link
        to="/simulations"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-brand-600 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au catalogue
      </Link>

      {/* Header */}
      <div className="bg-artex-primary rounded-t-[var(--radius-lg)] p-6 text-center">
        <p className="text-artex-green/60 text-xs font-mono uppercase tracking-widest mb-1">{code}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-white/60 text-sm mt-1">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="bg-surface rounded-b-[var(--radius-lg)] shadow-v2-md border border-border border-t-0">
        <div className="p-6 md:p-8 space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
}
