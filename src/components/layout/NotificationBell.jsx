import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Trash2, AlertTriangle, Calendar, X } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { useLeads } from '../../hooks/useLeads'
import { useProjects } from '../../hooks/useProjects'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const {
    notifications, getUnreadCount, getRecent, markAsRead, markAllRead, deleteNotification, scanReminders,
  } = useNotifications()
  const { leads } = useLeads()
  const { projects } = useProjects()

  const unread = getUnreadCount()
  const recent = getRecent(15)

  // Scan au montage
  useEffect(() => {
    scanReminders(leads, projects)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucune notification</p>
            )}
            {recent.map((notif) => {
              const isOverdue = notif.type === 'reminder' && notif.dueAt && new Date(notif.dueAt) < new Date()
              const linkTo = notif.entityType === 'lead'
                ? `/leads/${notif.entityId}`
                : notif.entityType === 'project'
                ? `/projets/${notif.entityId}`
                : null

              const content = (
                <div className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition ${
                  !notif.read ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                }`}>
                  <div className="mt-0.5 shrink-0">
                    {isOverdue ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : notif.type === 'reminder' ? (
                      <Calendar className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Bell className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notif.id) }}
                        className="p-1 text-gray-300 hover:text-green-500 transition"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(notif.id) }}
                      className="p-1 text-gray-300 hover:text-red-500 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )

              if (linkTo) {
                return (
                  <Link key={notif.id} to={linkTo} onClick={() => { markAsRead(notif.id); setOpen(false) }}>
                    {content}
                  </Link>
                )
              }
              return <div key={notif.id}>{content}</div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
