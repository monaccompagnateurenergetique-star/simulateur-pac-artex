import { useLocalStorage } from './useLocalStorage'

const STATUSES = [
  { value: 'prospect', label: 'Prospect', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  { value: 'visite', label: 'Visite technique', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'devis_envoye', label: 'Devis envoyé', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'devis_signe', label: 'Devis signé', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { value: 'dossier_depose', label: 'Dossier CEE déposé', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { value: 'travaux_cours', label: 'Travaux en cours', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'travaux_termines', label: 'Travaux terminés', color: 'bg-lime-100 text-lime-700', dot: 'bg-lime-500' },
  { value: 'prime_versee', label: 'Prime versée', color: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  { value: 'perdu', label: 'Perdu', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
]

export { STATUSES }

export function useClients() {
  const [clients, setClients] = useLocalStorage('artex-clients', [])

  function addClient(data) {
    const client = {
      id: crypto.randomUUID(),
      ...data,
      status: 'prospect',
      notes: [],
      simulations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setClients((prev) => [client, ...prev])
    return client
  }

  function updateClient(id, data) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      )
    )
  }

  function deleteClient(id) {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  function updateStatus(id, status) {
    updateClient(id, { status })
  }

  function addNote(id, text) {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const note = {
          id: crypto.randomUUID(),
          text,
          date: new Date().toISOString(),
        }
        return { ...c, notes: [note, ...(c.notes || [])], updatedAt: new Date().toISOString() }
      })
    )
  }

  function deleteNote(clientId, noteId) {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c
        return { ...c, notes: (c.notes || []).filter((n) => n.id !== noteId), updatedAt: new Date().toISOString() }
      })
    )
  }

  function linkSimulation(clientId, simulationId) {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c
        const sims = c.simulations || []
        if (sims.includes(simulationId)) return c
        return { ...c, simulations: [...sims, simulationId], updatedAt: new Date().toISOString() }
      })
    )
  }

  function getClient(id) {
    return clients.find((c) => c.id === id)
  }

  function getByStatus(status) {
    return clients.filter((c) => c.status === status)
  }

  function getStatusCounts() {
    const counts = {}
    STATUSES.forEach((s) => { counts[s.value] = 0 })
    clients.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1 })
    return counts
  }

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    updateStatus,
    addNote,
    deleteNote,
    linkSimulation,
    getClient,
    getByStatus,
    getStatusCounts,
  }
}
