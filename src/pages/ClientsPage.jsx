import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Search, Phone, MapPin, Trash2 } from 'lucide-react'
import { useClients, STATUSES } from '../hooks/useClients'

const CATEGORY_BADGE = {
  Bleu: 'bg-blue-100 text-blue-700 border-blue-200',
  Jaune: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Violet: 'bg-purple-100 text-purple-700 border-purple-200',
  Rose: 'bg-pink-100 text-pink-700 border-pink-200',
}

export default function ClientsPage() {
  const { clients, deleteClient, getStatusCounts } = useClients()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [view, setView] = useState('list') // 'list' | 'pipeline'
  const counts = getStatusCounts()

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      `${c.lastName} ${c.firstName} ${c.phone} ${c.address}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const activeStatuses = STATUSES.filter((s) => s.value !== 'perdu')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          Bénéficiaires
          <span className="text-base font-normal text-gray-400">({clients.length})</span>
        </h1>
        <Link
          to="/clients/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau bénéficiaire
        </Link>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {activeStatuses.map((s) => (
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

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un bénéficiaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
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

      {/* View: List */}
      {view === 'list' && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Aucun bénéficiaire</p>
              <p className="text-sm mt-1">
                {clients.length === 0
                  ? 'Ajoutez votre premier client pour commencer.'
                  : 'Aucun résultat pour cette recherche.'}
              </p>
            </div>
          )}
          {filtered.map((client) => {
            const status = STATUSES.find((s) => s.value === client.status)
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-800 truncate">
                      {client.firstName} {client.lastName}
                    </span>
                    {client.category && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${CATEGORY_BADGE[client.category] || ''}`}>
                        {client.category}
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
                  onClick={(e) => {
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
            {activeStatuses.map((s) => {
              const columnClients = clients.filter((c) => c.status === s.value)
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
                    {columnClients.map((client) => (
                      <Link
                        key={client.id}
                        to={`/clients/${client.id}`}
                        className="block p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
                      >
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.category && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-1 inline-block ${CATEGORY_BADGE[client.category]}`}>
                            {client.category}
                          </span>
                        )}
                        {client.phone && (
                          <p className="text-xs text-gray-400 mt-1">{client.phone}</p>
                        )}
                      </Link>
                    ))}
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
