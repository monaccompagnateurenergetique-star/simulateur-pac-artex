import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Search, Phone, MapPin, Trash2, Filter, SortAsc, SortDesc, X } from 'lucide-react'
import { useClients, STATUSES } from '../hooks/useClients'
import { useSimulationHistory } from '../hooks/useSimulationHistory'

const CATEGORY_BADGE = {
  Bleu: 'bg-blue-100 text-blue-700 border-blue-200',
  Jaune: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Violet: 'bg-purple-100 text-purple-700 border-purple-200',
  Rose: 'bg-pink-100 text-pink-700 border-pink-200',
}

const CATEGORY_FILTERS = [
  { value: 'Bleu', label: 'Bleu', bg: 'bg-blue-500', ring: 'ring-blue-300', text: 'text-white' },
  { value: 'Jaune', label: 'Jaune', bg: 'bg-yellow-400', ring: 'ring-yellow-200', text: 'text-yellow-900' },
  { value: 'Violet', label: 'Violet', bg: 'bg-purple-500', ring: 'ring-purple-300', text: 'text-white' },
  { value: 'Rose', label: 'Rose', bg: 'bg-pink-400', ring: 'ring-pink-200', text: 'text-white' },
  { value: 'none', label: 'Non renseigne', bg: 'bg-gray-300', ring: 'ring-gray-200', text: 'text-gray-700' },
]

const WORK_TYPE_FILTERS = [
  { value: 'BAR-TH-171', label: 'PAC air/eau', short: 'TH-171' },
  { value: 'BAR-TH-112', label: 'Chauffage bois', short: 'TH-112' },
  { value: 'BAR-TH-113', label: 'Chaudiere biomasse', short: 'TH-113' },
  { value: 'BAR-TH-174', label: 'Renov globale maison', short: 'TH-174' },
  { value: 'BAR-TH-175', label: 'Renov globale appart', short: 'TH-175' },
  { value: 'BAR-EN-101', label: 'Isolation combles', short: 'EN-101' },
  { value: 'BAR-EN-102', label: 'Isolation murs', short: 'EN-102' },
  { value: 'BAR-EN-103', label: 'Isolation plancher', short: 'EN-103' },
  { value: 'MaPrimeAdapt', label: "MaPrimeAdapt'", short: 'Adapt' },
]

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nom A-Z' },
  { value: 'name_desc', label: 'Nom Z-A' },
  { value: 'date_desc', label: 'Plus recent' },
  { value: 'date_asc', label: 'Plus ancien' },
  { value: 'category', label: 'Precarite' },
]

export default function ClientsPage() {
  const { clients, deleteClient, getStatusCounts } = useClients()
  const { history } = useSimulationHistory()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterWorkType, setFilterWorkType] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState('list')
  const counts = getStatusCounts()

  // Build a map: clientId -> set of simulation types
  const clientSimTypes = useMemo(() => {
    const map = {}
    clients.forEach(c => {
      const simIds = c.simulations || []
      const types = new Set()
      simIds.forEach(simId => {
        const sim = history.find(h => h.id === simId)
        if (sim?.type) types.add(sim.type)
      })
      map[c.id] = types
    })
    return map
  }, [clients, history])

  // Count clients per category for badges
  const categoryCounts = useMemo(() => {
    const c = { Bleu: 0, Jaune: 0, Violet: 0, Rose: 0, none: 0 }
    clients.forEach(cl => {
      if (cl.category && c[cl.category] !== undefined) c[cl.category]++
      else c.none++
    })
    return c
  }, [clients])

  // Active filter count
  const activeFilterCount = [
    filterCategory !== 'all',
    filterWorkType !== 'all',
    filterStatus !== 'all',
  ].filter(Boolean).length

  // Filter + sort
  const filtered = useMemo(() => {
    let result = clients.filter(c => {
      // Search
      const matchSearch = !search ||
        `${c.lastName} ${c.firstName} ${c.phone} ${c.address} ${c.city}`.toLowerCase().includes(search.toLowerCase())

      // Status
      const matchStatus = filterStatus === 'all' || c.status === filterStatus

      // Category (precarite)
      let matchCategory = true
      if (filterCategory !== 'all') {
        if (filterCategory === 'none') {
          matchCategory = !c.category
        } else {
          matchCategory = c.category === filterCategory
        }
      }

      // Work type
      let matchWork = true
      if (filterWorkType !== 'all') {
        const types = clientSimTypes[c.id] || new Set()
        matchWork = types.has(filterWorkType)
      }

      return matchSearch && matchStatus && matchCategory && matchWork
    })

    // Sort
    const categoryOrder = { Bleu: 0, Jaune: 1, Violet: 2, Rose: 3 }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
        case 'name_desc':
          return `${b.lastName} ${b.firstName}`.localeCompare(`${a.lastName} ${a.firstName}`)
        case 'date_asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        case 'date_desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        case 'category':
          return (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99)
        default:
          return 0
      }
    })

    return result
  }, [clients, search, filterStatus, filterCategory, filterWorkType, sortBy, clientSimTypes])

  const activeStatuses = STATUSES.filter(s => s.value !== 'perdu')

  function clearAllFilters() {
    setFilterCategory('all')
    setFilterWorkType('all')
    setFilterStatus('all')
    setSearch('')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          Beneficiaires
          <span className="text-base font-normal text-gray-400">({clients.length})</span>
        </h1>
        <Link
          to="/clients/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau beneficiaire
        </Link>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {activeStatuses.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
            className={`text-center p-2 rounded-lg border transition text-xs ${
              filterStatus === s.value
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-1 ${s.dot}`} />
            <div className="font-bold text-lg text-gray-800">{counts[s.value] || 0}</div>
            <div className="text-gray-500 truncate">{s.label.split(' ')[0]}</div>
          </button>
        ))}
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un beneficiaire..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter toggle + sort + view */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                showFilters || activeFilterCount > 0
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-transparent focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* View toggle */}
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setView('pipeline')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                view === 'pipeline' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pipeline
            </button>
          </div>
        </div>

        {/* Expanded filters panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4 animate-fade-in">
            {/* Filter by precarite */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Precarite (profil revenus)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    filterCategory === 'all'
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Tous ({clients.length})
                </button>
                {CATEGORY_FILTERS.map(cf => (
                  <button
                    key={cf.value}
                    onClick={() => setFilterCategory(filterCategory === cf.value ? 'all' : cf.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                      filterCategory === cf.value
                        ? `${cf.bg} ${cf.text} border-transparent ring-2 ${cf.ring}`
                        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cf.label} ({categoryCounts[cf.value] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by work type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Type de travaux (simulations liees)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterWorkType('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    filterWorkType === 'all'
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Tous
                </button>
                {WORK_TYPE_FILTERS.map(wf => {
                  // Count clients with this work type
                  const count = clients.filter(c => (clientSimTypes[c.id] || new Set()).has(wf.value)).length
                  return (
                    <button
                      key={wf.value}
                      onClick={() => setFilterWorkType(filterWorkType === wf.value ? 'all' : wf.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        filterWorkType === wf.value
                          ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                          : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {wf.short} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold transition"
              >
                <X className="w-3.5 h-3.5" />
                Effacer tous les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {(activeFilterCount > 0 || search) && (
        <div className="text-sm text-gray-500 mb-3">
          <span className="font-semibold text-gray-700">{filtered.length}</span> beneficiaire{filtered.length > 1 ? 's' : ''} sur {clients.length}
          {filterCategory !== 'all' && (
            <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_BADGE[filterCategory] || 'bg-gray-100 text-gray-600'}`}>
              {filterCategory === 'none' ? 'Non renseigne' : filterCategory}
              <button onClick={() => setFilterCategory('all')} className="hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filterWorkType !== 'all' && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              {WORK_TYPE_FILTERS.find(w => w.value === filterWorkType)?.label || filterWorkType}
              <button onClick={() => setFilterWorkType('all')} className="hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* View: List */}
      {view === 'list' && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Aucun beneficiaire</p>
              <p className="text-sm mt-1">
                {clients.length === 0
                  ? 'Ajoutez votre premier client pour commencer.'
                  : 'Aucun resultat pour ces criteres.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
          {filtered.map(client => {
            const status = STATUSES.find(s => s.value === client.status)
            const simTypes = clientSimTypes[client.id] || new Set()
            return (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-indigo-200 transition group"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {(client.firstName?.[0] || '').toUpperCase()}
                  {(client.lastName?.[0] || '').toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-gray-800 truncate">
                      {client.firstName} {client.lastName}
                    </span>
                    {client.category && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${CATEGORY_BADGE[client.category] || ''}`}>
                        {client.category}
                      </span>
                    )}
                    {/* Work type badges */}
                    {simTypes.size > 0 && (
                      [...simTypes].slice(0, 3).map(type => {
                        const wf = WORK_TYPE_FILTERS.find(w => w.value === type)
                        return (
                          <span
                            key={type}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100"
                          >
                            {wf?.short || type}
                          </span>
                        )
                      })
                    )}
                    {simTypes.size > 3 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        +{simTypes.size - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.address && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {client.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status?.color || ''}`}>
                    {status?.label || client.status}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (confirm(`Supprimer ${client.firstName} ${client.lastName} ?`)) {
                      deleteClient(client.id)
                    }
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Link>
            )
          })}
        </div>
      )}

      {/* View: Pipeline */}
      {view === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {activeStatuses.map(s => {
              const columnClients = filtered.filter(c => c.status === s.value)
              return (
                <div key={s.value} className="w-64 shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <span className="text-sm font-bold text-gray-700">{s.label}</span>
                    <span className="text-xs text-gray-400">({columnClients.length})</span>
                  </div>
                  <div className="space-y-2 min-h-[100px] bg-gray-50 rounded-xl p-2 border border-gray-200">
                    {columnClients.length === 0 && (
                      <p className="text-xs text-gray-300 text-center py-6">Aucun</p>
                    )}
                    {columnClients.map(client => {
                      const simTypes = clientSimTypes[client.id] || new Set()
                      return (
                        <Link
                          key={client.id}
                          to={`/clients/${client.id}`}
                          className="block p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
                        >
                          <p className="font-semibold text-sm text-gray-800 truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {client.category && (
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${CATEGORY_BADGE[client.category]}`}>
                                {client.category}
                              </span>
                            )}
                            {[...simTypes].slice(0, 2).map(type => {
                              const wf = WORK_TYPE_FILTERS.find(w => w.value === type)
                              return (
                                <span key={type} className="text-[10px] font-medium px-1 py-0.5 rounded bg-indigo-50 text-indigo-600">
                                  {wf?.short || type}
                                </span>
                              )
                            })}
                          </div>
                          {client.phone && (
                            <p className="text-xs text-gray-400 mt-1">{client.phone}</p>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
