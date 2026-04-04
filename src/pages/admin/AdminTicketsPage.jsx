import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTickets, TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from '../../hooks/useTickets'
import {
  MessageSquare, Clock, ArrowLeft, Filter, Building2
} from 'lucide-react'

export default function AdminTicketsPage() {
  const { tickets, loading, updateTicketStatus } = useTickets()
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  let filtered = tickets
  if (statusFilter !== 'all') filtered = filtered.filter((t) => t.status === statusFilter)
  if (priorityFilter !== 'all') filtered = filtered.filter((t) => t.priority === priorityFilter)

  const openCount = tickets.filter((t) => t.status === 'ouvert').length
  const inProgressCount = tickets.filter((t) => t.status === 'en_cours').length
  const urgentCount = tickets.filter((t) => t.priority === 'urgente' && t.status !== 'ferme' && t.status !== 'resolu').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-red-500" />
            Administration — Tickets
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{openCount}</p>
          <p className="text-xs text-blue-500 font-semibold">Ouverts</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{inProgressCount}</p>
          <p className="text-xs text-amber-500 font-semibold">En cours</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{urgentCount}</p>
          <p className="text-xs text-red-500 font-semibold">Urgents</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
          >
            <option value="all">Tous les statuts</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
          >
            <option value="all">Toutes priorités</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun ticket trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Sujet</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Créé par</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Priorité</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((ticket) => {
                const statusMeta = TICKET_STATUSES.find((s) => s.value === ticket.status) || TICKET_STATUSES[0]
                const priorityMeta = TICKET_PRIORITIES.find((p) => p.value === ticket.priority) || TICKET_PRIORITIES[1]

                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/tickets/${ticket.id}`} className="font-semibold text-gray-800 hover:text-indigo-600 transition">
                        {ticket.subject}
                      </Link>
                      {ticket.category && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">{ticket.createdByName}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                        className={`text-[10px] px-2 py-1 rounded-full font-bold border-0 ${statusMeta.color} cursor-pointer`}
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityMeta.color}`}>
                        {priorityMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
