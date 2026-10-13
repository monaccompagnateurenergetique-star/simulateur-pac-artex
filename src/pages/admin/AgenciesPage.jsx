import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Search, MapPin, Phone, Mail, ChevronRight } from 'lucide-react'
import { useAgencies } from '../../hooks/useAgencies'

export default function AgenciesPage() {
  const { agencies, loading } = useAgencies()
  const [search, setSearch] = useState('')

  const filtered = agencies.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.postalCode?.includes(q) ||
      a.contact?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agences immobilières</h1>
            <p className="text-sm text-gray-500">{agencies.length} agence{agencies.length > 1 ? 's' : ''} enregistrée{agencies.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link
          to="/admin/agences/nouvelle"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouvelle agence
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une agence..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {search ? 'Aucune agence trouvée' : 'Aucune agence enregistrée'}
          </p>
          {!search && (
            <Link
              to="/admin/agences/nouvelle"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all mt-4"
            >
              <Plus className="w-4 h-4" />
              Créer la première agence
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agency) => (
            <Link
              key={agency.id}
              to={`/admin/agences/${agency.id}`}
              className="group bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-500/50 rounded-2xl p-5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-1 truncate">{agency.name}</h3>
              {agency.contact && (
                <p className="text-sm text-gray-500 mb-3">{agency.contact}</p>
              )}
              <div className="space-y-1.5 text-xs text-gray-500">
                {(agency.address || agency.city) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{[agency.address, agency.postalCode, agency.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{agency.phone}</span>
                  </div>
                )}
                {agency.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{agency.email}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
