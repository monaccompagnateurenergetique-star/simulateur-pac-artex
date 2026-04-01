import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Plus, Search, Phone, Mail, Trash2, Filter, X, ArrowRightCircle, MapPin, Thermometer } from 'lucide-react'
import { useLeads, LEAD_STATUSES } from '../hooks/useLeads'
import CompletionGauge from '../components/ui/CompletionGauge'
import { getCompletion } from '../lib/completionGauge'
import { getDpeColor } from '../utils/dpeApi'

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Plus récent' },
  { value: 'date_asc', label: 'Plus ancien' },
  { value: 'name_asc', label: 'Nom A-Z' },
  { value: 'completion', label: 'Complétion' },
]

export default function LeadsPage() {
  const { leads, deleteLead, getLeadStatusCounts } = useLeads()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const counts = getLeadStatusCounts()

  const activeStatuses = LEAD_STATUSES.filter((s) => s.value !== 'perdu' && s.value !== 'converti')

  const filtered = useMemo(() => {
    let result = leads.filter((l) => {
      const matchSearch = !search ||
        `${l.firstName} ${l.lastName} ${l.phone} ${l.email} ${l.address}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || l.status === filterStatus
      return matchSearch && matchStatus
    })

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
        case 'date_asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        case 'date_desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        case 'completion': {
          const ca = getCompletion(a).percent
          const cb = getCompletion(b).percent
          return cb - ca
        }
        default:
          return 0
      }
    })

    return result
  }, [leads, search, filterStatus, sortBy])

  function getLeadDisplayName(lead) {
    if (lead.firstName || lead.lastName) return `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
    if (lead.phone) return lead.phone
    if (lead.email) return lead.email
    return 'Lead sans nom'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-emerald-600" />
          Leads
          <span className="text-base font-normal text-gray-400">({leads.length})</span>
        </h1>
        <Link
          to="/leads/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau lead
        </Link>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {activeStatuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
            className={`text-center p-3 rounded-lg border transition ${
              filterStatus === s.value
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-1 ${s.dot}`} />
            <div className="font-bold text-xl text-gray-800">{counts[s.value] || 0}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un lead (nom, téléphone, email)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-transparent focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {(filterStatus !== 'all' || search) && (
        <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
          <span className="font-semibold text-gray-700">{filtered.length}</span> lead{filtered.length > 1 ? 's' : ''}
          {filterStatus !== 'all' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${LEAD_STATUSES.find((s) => s.value === filterStatus)?.color || ''}`}>
              {LEAD_STATUSES.find((s) => s.value === filterStatus)?.label}
              <button onClick={() => setFilterStatus('all')}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Lead list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">Aucun lead</p>
            <p className="text-sm mt-1">
              {leads.length === 0
                ? 'Ajoutez votre premier lead pour commencer le suivi.'
                : 'Aucun résultat pour ces critères.'}
            </p>
          </div>
        )}
        {filtered.map((lead) => {
          const status = LEAD_STATUSES.find((s) => s.value === lead.status)
          const completion = getCompletion(lead)
          const displayName = getLeadDisplayName(lead)

          return (
            <Link
              key={lead.id}
              to={lead.status === 'converti' ? `/projets/${lead.convertedToProjectId}` : `/leads/${lead.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-emerald-200 transition group"
            >
              {/* Top section: Jauge + Nom + Status */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <CompletionGauge percent={completion.percent} size="sm" variant="circle" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-800 truncate text-sm sm:text-base">{displayName}</span>
                    {lead.status === 'converti' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 flex items-center gap-0.5">
                        <ArrowRightCircle className="w-3 h-3" /> Projet
                      </span>
                    )}
                  </div>
                  {/* Contact info mobile-optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge - visible on desktop */}
                <div className="hidden sm:block shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${status?.color || ''}`}>
                    {status?.label || lead.status}
                  </span>
                </div>
              </div>

              {/* Bottom section: DPE + Address */}
              <div className="flex flex-col gap-2 sm:gap-1 w-full sm:w-auto">
                {/* DPE badge */}
                {lead.dpe?.etiquetteDpe && (() => {
                  const dpeColor = getDpeColor(lead.dpe.etiquetteDpe)
                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-black shrink-0 flex-col"
                        style={{ backgroundColor: dpeColor?.bg, color: dpeColor?.text }}
                      >
                        <span className="leading-tight">{lead.dpe.etiquetteDpe}</span>
                        <span className="text-[7px] leading-none">DPE</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold block">{lead.dpe.consoM2 ? `${lead.dpe.consoM2} kWh/m²` : 'Enregistré'}</span>
                        {lead.dpe.surface && <span className="text-gray-400">{lead.dpe.surface} m²</span>}
                      </div>
                    </div>
                  )
                })()}

                {/* Address */}
                {lead.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{lead.address}</span>
                  </div>
                )}

                {/* Status badge - mobile only */}
                <div className="sm:hidden">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${status?.color || ''}`}>
                    {status?.label || lead.status}
                  </span>
                </div>
              </div>

              {/* Delete */}
              {lead.status !== 'converti' && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (confirm(`Supprimer ce lead ?`)) {
                      deleteLead(lead.id)
                    }
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
