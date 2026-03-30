import { useLocalStorage } from './useLocalStorage'
import { getCompletion } from '../lib/completionGauge'

export const LEAD_STATUSES = [
  { value: 'a_contacter', label: 'À contacter', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { value: 'contacte', label: 'Contacté', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'qualifie', label: 'Qualifié', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'non_qualifie', label: 'Non qualifié', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'converti', label: 'Converti en projet', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { value: 'perdu', label: 'Perdu', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
]

export function useLeads() {
  const [leads, setLeads] = useLocalStorage('artex360-leads', [])

  function addLead(data) {
    const lead = {
      id: crypto.randomUUID(),
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      postalCode: '',
      city: '',
      personnes: null,
      rfr: null,
      typeLogement: null,
      surface: null,
      region: null,
      departement: null,
      zoneClimatique: null,
      zone: null,
      isIDF: false,
      category: null,
      categoryLabel: null,
      source: 'manuel',
      status: 'a_contacter',
      notes: [],
      reminders: [],
      convertedToProjectId: null,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setLeads((prev) => [lead, ...prev])
    return lead
  }

  function updateLead(id, data) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
      )
    )
  }

  function deleteLead(id) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  function updateLeadStatus(id, status) {
    updateLead(id, { status })
  }

  function addLeadNote(id, text) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const note = { id: crypto.randomUUID(), text, date: new Date().toISOString() }
        return { ...l, notes: [note, ...(l.notes || [])], updatedAt: new Date().toISOString() }
      })
    )
  }

  function deleteLeadNote(leadId, noteId) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l
        return { ...l, notes: (l.notes || []).filter((n) => n.id !== noteId), updatedAt: new Date().toISOString() }
      })
    )
  }

  function addLeadReminder(id, { text, dueAt }) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const reminder = {
          id: crypto.randomUUID(),
          text,
          dueAt,
          done: false,
          createdAt: new Date().toISOString(),
        }
        return { ...l, reminders: [reminder, ...(l.reminders || [])], updatedAt: new Date().toISOString() }
      })
    )
  }

  function toggleLeadReminder(leadId, reminderId) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l
        return {
          ...l,
          reminders: (l.reminders || []).map((r) =>
            r.id === reminderId ? { ...r, done: !r.done } : r
          ),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function deleteLeadReminder(leadId, reminderId) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l
        return {
          ...l,
          reminders: (l.reminders || []).filter((r) => r.id !== reminderId),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  /**
   * Convertit un lead qualifié en projet
   * @param {string} leadId
   * @param {Function} addProject - Fonction addProject du hook useProjects
   * @returns {Object|null} Le projet créé ou null
   */
  function convertToProject(leadId, addProject) {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return null

    const projectData = {
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      postalCode: lead.postalCode,
      city: lead.city,
      personnes: lead.personnes,
      rfr: lead.rfr,
      typeLogement: lead.typeLogement,
      surface: lead.surface,
      region: lead.region,
      departement: lead.departement,
      zoneClimatique: lead.zoneClimatique,
      zone: lead.zone,
      isIDF: lead.isIDF,
      category: lead.category,
      categoryLabel: lead.categoryLabel,
      leadId: lead.id,
    }

    const project = addProject(projectData)

    // Marquer le lead comme converti
    updateLead(leadId, {
      status: 'converti',
      convertedToProjectId: project.id,
    })

    return project
  }

  function getLead(id) {
    return leads.find((l) => l.id === id)
  }

  function getLeadCompletion(id) {
    const lead = leads.find((l) => l.id === id)
    return getCompletion(lead)
  }

  function getLeadsByStatus(status) {
    return leads.filter((l) => l.status === status)
  }

  function getLeadStatusCounts() {
    const counts = {}
    LEAD_STATUSES.forEach((s) => { counts[s.value] = 0 })
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1 })
    return counts
  }

  return {
    leads,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus,
    addLeadNote,
    deleteLeadNote,
    addLeadReminder,
    toggleLeadReminder,
    deleteLeadReminder,
    convertToProject,
    getLead,
    getLeadCompletion,
    getLeadsByStatus,
    getLeadStatusCounts,
  }
}
