import { useLocalStorage } from './useLocalStorage'

export function useNotifications() {
  const [notifications, setNotifications] = useLocalStorage('artex360-notifications', [])

  function addNotification({ type = 'system', title, message, entityType = null, entityId = null, dueAt = null }) {
    const notif = {
      id: crypto.randomUUID(),
      type, // 'reminder' | 'lead_followup' | 'project_update' | 'system'
      title,
      message,
      entityType, // 'lead' | 'project' | null
      entityId,
      read: false,
      dueAt,
      createdAt: new Date().toISOString(),
    }
    setNotifications((prev) => [notif, ...prev])
    return notif
  }

  function markAsRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function deleteNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  function clearAll() {
    setNotifications([])
  }

  function getUnreadCount() {
    return notifications.filter((n) => !n.read).length
  }

  function getUnread() {
    return notifications.filter((n) => !n.read)
  }

  function getRecent(count = 20) {
    return notifications.slice(0, count)
  }

  /**
   * Retourne les notifications en retard (dueAt passé et non lue)
   */
  function getOverdue() {
    const now = new Date().toISOString()
    return notifications.filter((n) => !n.read && n.dueAt && n.dueAt < now)
  }

  /**
   * Scan les rappels des leads et projets pour créer des notifications si nécessaire
   * Appelé au montage de l'app
   */
  function scanReminders(leads = [], projects = []) {
    const now = new Date()
    const existingIds = new Set(notifications.map((n) => n.entityId + '_' + n.dueAt))

    const newNotifs = []

    // Scan rappels leads
    for (const lead of leads) {
      for (const reminder of lead.reminders || []) {
        if (reminder.done) continue
        if (!reminder.dueAt) continue
        const key = lead.id + '_' + reminder.dueAt
        if (existingIds.has(key)) continue
        if (new Date(reminder.dueAt) <= now) {
          newNotifs.push({
            type: 'reminder',
            title: `Rappel lead : ${lead.firstName || lead.phone || lead.email || 'Sans nom'}`,
            message: reminder.text,
            entityType: 'lead',
            entityId: lead.id,
            dueAt: reminder.dueAt,
          })
        }
      }
    }

    // Scan rappels projets
    for (const project of projects) {
      for (const reminder of project.reminders || []) {
        if (reminder.done) continue
        if (!reminder.dueAt) continue
        const key = project.id + '_' + reminder.dueAt
        if (existingIds.has(key)) continue
        if (new Date(reminder.dueAt) <= now) {
          newNotifs.push({
            type: 'reminder',
            title: `Rappel projet : ${project.firstName || ''} ${project.lastName || ''}`.trim() || 'Projet sans nom',
            message: reminder.text,
            entityType: 'project',
            entityId: project.id,
            dueAt: reminder.dueAt,
          })
        }
      }
    }

    // Scan leads non contactés depuis 48h
    const _48h = 48 * 60 * 60 * 1000
    for (const lead of leads) {
      if (lead.status !== 'a_contacter') continue
      const age = now - new Date(lead.createdAt)
      if (age < _48h) continue
      const key = lead.id + '_followup_48h'
      if (existingIds.has(key)) continue
      newNotifs.push({
        type: 'lead_followup',
        title: `Lead non contacté depuis 48h`,
        message: `${lead.firstName || lead.phone || lead.email || 'Sans nom'} attend d'être contacté`,
        entityType: 'lead',
        entityId: lead.id,
        dueAt: null,
      })
    }

    // Ajouter les nouvelles notifications
    if (newNotifs.length > 0) {
      setNotifications((prev) => [
        ...newNotifs.map((n) => ({
          id: crypto.randomUUID(),
          ...n,
          read: false,
          createdAt: new Date().toISOString(),
        })),
        ...prev,
      ])
    }
  }

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAll,
    getUnreadCount,
    getUnread,
    getRecent,
    getOverdue,
    scanReminders,
  }
}
