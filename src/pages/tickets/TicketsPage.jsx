import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTickets, TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from '../../hooks/useTickets'
import { useRole } from '../../contexts/RoleContext'
import {
  MessageSquare, Plus, Filter, Clock, AlertCircle
} from 'lucide-react'

export default function TicketsPage() {
  const { tickets, loading } = useTickets()
  const { isSuperAdmin } = useRole()
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = statusFilter === 'all'
    ? tickets
    : tickets.filter((t) => t.status === statusFilter)

  const statusCounts = {}
  TICKET_STATUSES.forEach((s) => { statusCounts[s.value] = 0 })
  tickets.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1 })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            {isSuperAdmin() ? 'Tous les tickets' : 'Mes tickets'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/tickets/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau ticket
        </Link>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            statusFilter === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous ({tickets.length})
        </button>
        {TICKET_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === s.value
                ? `${s.color}`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.label} ({statusCounts[s.value] || 0})
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun ticket</p>
          <p className="text-sm text-gray-400 mt-1">
            Créez un ticket pour contacter le support
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const statusMeta = TICKET_STATUSES.find((s) => s.value === ticket.status) || TICKET_STATUSES[0]
            const priorityMeta = TICKET_PRIORITIES.find((p) => p.value === ticket.priority) || TICKET_PRIORITIES[1]
            const categoryMeta = TICKET_CATEGORIES.find((c) => c.value === ticket.category)

            return (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="block bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm p-4 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${statusMeta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityMeta.color}`}>
                        {priorityMeta.label}
                      </span>
                      {categoryMeta && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                          {categoryMeta.label}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{ticket.subject}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>{ticket.createdByName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
