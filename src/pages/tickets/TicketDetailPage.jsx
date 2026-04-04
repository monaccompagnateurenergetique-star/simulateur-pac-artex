import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTickets, useTicketMessages, TICKET_STATUSES, TICKET_PRIORITIES } from '../../hooks/useTickets'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../contexts/RoleContext'
import {
  MessageSquare, ArrowLeft, Send, Clock, Shield, User, Trash2
} from 'lucide-react'

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isSuperAdmin } = useRole()
  const { tickets, updateTicketStatus, deleteTicket } = useTickets()
  const { messages, loading: msgsLoading, sendMessage } = useTicketMessages(id)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const ticket = tickets.find((t) => t.id === id)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(newMessage.trim())
      setNewMessage('')
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(status) {
    await updateTicketStatus(id, status)
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce ticket définitivement ?')) return
    await deleteTicket(id)
    navigate('/tickets')
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Ticket introuvable</p>
        <Link to="/tickets" className="text-indigo-500 text-sm mt-2 inline-block hover:underline">
          Retour aux tickets
        </Link>
      </div>
    )
  }

  const statusMeta = TICKET_STATUSES.find((s) => s.value === ticket.status) || TICKET_STATUSES[0]
  const priorityMeta = TICKET_PRIORITIES.find((p) => p.value === ticket.priority) || TICKET_PRIORITIES[1]
  const isClosed = ticket.status === 'ferme' || ticket.status === 'resolu'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/tickets"
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 truncate">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${statusMeta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityMeta.color}`}>
              {priorityMeta.label}
            </span>
            <span className="text-xs text-gray-400">
              par {ticket.createdByName} — {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      {/* Actions admin */}
      {(isSuperAdmin() || ticket.createdBy === user?.uid) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {isSuperAdmin() && (
            <>
              <label className="text-xs font-semibold text-gray-500">Statut :</label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </>
          )}
          {(isSuperAdmin() || ticket.createdBy === user?.uid) && (
            <button
              onClick={handleDelete}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
        </div>
      )}

      {/* Messages thread */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Conversation
          </h2>
        </div>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {msgsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Aucun message</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.authorUid === user?.uid
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.isAdmin
                      ? 'bg-indigo-50 border border-indigo-200'
                      : isMe
                        ? 'bg-lime-50 border border-lime-200'
                        : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.isAdmin ? (
                        <Shield className="w-3 h-3 text-indigo-500" />
                      ) : (
                        <User className="w-3 h-3 text-gray-400" />
                      )}
                      <span className={`text-xs font-bold ${msg.isAdmin ? 'text-indigo-600' : 'text-gray-600'}`}>
                        {msg.authorName}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input message */}
        {!isClosed ? (
          <form onSubmit={handleSend} className="border-t border-gray-100 p-4 flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition flex items-center gap-2 text-sm font-semibold"
            >
              {sending ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        ) : (
          <div className="border-t border-gray-100 p-4 text-center text-sm text-gray-400">
            Ce ticket est {ticket.status === 'resolu' ? 'résolu' : 'fermé'}
          </div>
        )}
      </div>
    </div>
  )
}
