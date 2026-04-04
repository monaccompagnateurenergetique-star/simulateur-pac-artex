import { useMemo } from 'react'
import { useOrgCollection } from './useOrgCollection'
import { getCompletion } from '../lib/completionGauge'

export const PROJECT_STATUSES = [
  { value: 'etude', label: 'En étude', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { value: 'visite', label: 'Visite technique', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'devis_envoye', label: 'Devis envoyé', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'devis_signe', label: 'Devis signé', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { value: 'dossier_depose', label: 'Dossier CEE déposé', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { value: 'travaux_cours', label: 'Travaux en cours', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'travaux_termines', label: 'Travaux terminés', color: 'bg-lime-100 text-lime-700', dot: 'bg-lime-500' },
  { value: 'prime_versee', label: 'Prime versée', color: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  { value: 'perdu', label: 'Perdu', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
]

/**
 * Migration transparente des anciens clients vers le nouveau schéma projet
 */
function migrateProject(project) {
  let migrated = { ...project }
  let changed = false

  // Ajouter scenarios si absent
  if (!Array.isArray(migrated.scenarios)) {
    migrated.scenarios = []
    changed = true
  }

  // Ajouter reminders si absent
  if (!Array.isArray(migrated.reminders)) {
    migrated.reminders = []
    changed = true
  }

  // Ajouter leadId si absent
  if (migrated.leadId === undefined) {
    migrated.leadId = null
    changed = true
  }

  // Migrer status 'prospect' → 'etude'
  if (migrated.status === 'prospect') {
    migrated.status = 'etude'
    changed = true
  }

  // Si des simulations liées existent mais pas de scénarios → créer un scénario initial
  if (
    Array.isArray(migrated.simulations) &&
    migrated.simulations.length > 0 &&
    migrated.scenarios.length === 0
  ) {
    migrated.scenarios = [{
      id: crypto.randomUUID(),
      name: 'Scénario initial',
      simulations: migrated.simulations.map((simId) => ({
        id: simId,
        type: null,
        title: 'Simulation importée',
        inputs: {},
        results: {},
        date: migrated.createdAt || new Date().toISOString(),
      })),
      ptz: null,
      createdAt: migrated.createdAt || new Date().toISOString(),
    }]
    changed = true
  }

  return { migrated, changed }
}

export function useProjects() {
  // useOrgCollection gere deja le fallback localStorage quand pas d'orgId
  const orgStore = useOrgCollection('projects', 'artex-clients', [])

  const rawProjects = orgStore.data
  const setProjects = (updater) => {
    const newVal = typeof updater === 'function' ? updater(orgStore.data) : updater
    if (Array.isArray(newVal) && orgStore.isOnline) {
      newVal.forEach((item) => {
        const existing = orgStore.data.find((d) => d.id === item.id)
        if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
          orgStore.setItem(item)
        }
      })
      orgStore.data.forEach((item) => {
        if (!newVal.find((d) => d.id === item.id)) {
          orgStore.removeItem(item.id)
        }
      })
    }
    orgStore.setData(newVal)
  }

  // Migration transparente au chargement
  const projects = useMemo(() => {
    let needsSave = false
    const migrated = rawProjects.map((p) => {
      const { migrated: m, changed } = migrateProject(p)
      if (changed) needsSave = true
      return m
    })
    // Sauvegarder si migration nécessaire
    if (needsSave) {
      try {
        window.localStorage.setItem('artex-clients', JSON.stringify(migrated))
      } catch (e) { /* ignore */ }
    }
    return migrated
  }, [rawProjects])

  // ─── CRUD de base ───

  function addProject(data) {
    const project = {
      id: crypto.randomUUID(),
      civilite: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      occupation: '',
      address: '',
      postalCode: '',
      city: '',
      personnes: null,
      rfr: null,
      typeLogement: null,
      surface: null,
      ageBatiment: null,
      chauffageActuel: null,
      region: null,
      departement: null,
      zoneClimatique: null,
      zone: null,
      isIDF: false,
      category: null,
      categoryLabel: null,
      leadId: null,
      dpe: null,
      ...data,
      status: 'etude',
      notes: [],
      simulations: [],
      scenarios: [],
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProjects((prev) => [project, ...prev])
    return project
  }

  function updateProject(id, data) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      )
    )
  }

  function deleteProject(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  function updateProjectStatus(id, status) {
    updateProject(id, { status })
  }

  function getProject(id) {
    return projects.find((p) => p.id === id)
  }

  function getByStatus(status) {
    return projects.filter((p) => p.status === status)
  }

  function getStatusCounts() {
    const counts = {}
    PROJECT_STATUSES.forEach((s) => { counts[s.value] = 0 })
    projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1 })
    return counts
  }

  function getProjectCompletion(id) {
    const project = projects.find((p) => p.id === id)
    return getCompletion(project)
  }

  // ─── Notes (compat avec useClients) ───

  function addNote(id, text) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const note = { id: crypto.randomUUID(), text, date: new Date().toISOString() }
        return { ...p, notes: [note, ...(p.notes || [])], updatedAt: new Date().toISOString() }
      })
    )
  }

  function deleteNote(projectId, noteId) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return { ...p, notes: (p.notes || []).filter((n) => n.id !== noteId), updatedAt: new Date().toISOString() }
      })
    )
  }

  // ─── Simulations (compat legacy) ───

  function linkSimulation(projectId, simulationId) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const sims = p.simulations || []
        if (sims.includes(simulationId)) return p
        return { ...p, simulations: [...sims, simulationId], updatedAt: new Date().toISOString() }
      })
    )
  }

  // ─── Scénarios ───

  function addScenario(projectId, name) {
    const scenario = {
      id: crypto.randomUUID(),
      name: name || `Scénario ${(getProject(projectId)?.scenarios?.length || 0) + 1}`,
      simulations: [],
      ptz: null,
      createdAt: new Date().toISOString(),
    }
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return { ...p, scenarios: [...(p.scenarios || []), scenario], updatedAt: new Date().toISOString() }
      })
    )
    return scenario
  }

  function updateScenario(projectId, scenarioId, data) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          scenarios: (p.scenarios || []).map((s) =>
            s.id === scenarioId ? { ...s, ...data } : s
          ),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function deleteScenario(projectId, scenarioId) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          scenarios: (p.scenarios || []).filter((s) => s.id !== scenarioId),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function addSimToScenario(projectId, scenarioId, simulation) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          scenarios: (p.scenarios || []).map((s) => {
            if (s.id !== scenarioId) return s
            return { ...s, simulations: [...s.simulations, simulation] }
          }),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function updateSimInScenario(projectId, scenarioId, simulationId, updatedSim) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          scenarios: (p.scenarios || []).map((s) => {
            if (s.id !== scenarioId) return s
            return {
              ...s,
              simulations: s.simulations.map((sim) =>
                sim.id === simulationId ? { ...sim, ...updatedSim, id: simulationId } : sim
              ),
            }
          }),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function removeSimFromScenario(projectId, scenarioId, simulationId) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          scenarios: (p.scenarios || []).map((s) => {
            if (s.id !== scenarioId) return s
            return { ...s, simulations: s.simulations.filter((sim) => sim.id !== simulationId) }
          }),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function setPtzForScenario(projectId, scenarioId, ptzResult) {
    updateScenario(projectId, scenarioId, { ptz: ptzResult })
  }

  /**
   * Recalcule les totaux d'un scénario (appelé après ajout/suppression de simulation)
   */
  function getScenarioTotals(scenario) {
    if (!scenario) return { totalCee: 0, totalMpr: 0, totalCost: 0, totalAides: 0, resteACharge: 0, ptzMontant: 0 }

    let totalCee = 0
    let totalMpr = 0
    let totalCost = 0

    for (const sim of scenario.simulations || []) {
      const r = sim.results || {}
      const inp = sim.inputs || {}
      totalCee += r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
      totalMpr += r.mprFinal || r.mprAmount || r.primeAmount || 0
      totalCost += r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
    }

    const ptzMontant = scenario.ptz?.montantPTZ || 0
    const totalAides = totalCee + totalMpr
    const resteACharge = Math.max(0, totalCost - totalAides)

    return { totalCee, totalMpr, totalCost, totalAides, resteACharge, ptzMontant }
  }

  // ─── Rappels ───

  function addReminder(projectId, { text, dueAt }) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const reminder = {
          id: crypto.randomUUID(),
          text,
          dueAt,
          done: false,
          createdAt: new Date().toISOString(),
        }
        return { ...p, reminders: [reminder, ...(p.reminders || [])], updatedAt: new Date().toISOString() }
      })
    )
  }

  function toggleReminder(projectId, reminderId) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          reminders: (p.reminders || []).map((r) =>
            r.id === reminderId ? { ...r, done: !r.done } : r
          ),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function deleteReminder(projectId, reminderId) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          reminders: (p.reminders || []).filter((r) => r.id !== reminderId),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  return {
    // Compat useClients (les pages existantes continuent de fonctionner)
    clients: projects,
    projects,
    addClient: addProject,
    addProject,
    updateClient: updateProject,
    updateProject,
    deleteClient: deleteProject,
    deleteProject,
    updateStatus: updateProjectStatus,
    updateProjectStatus,
    addNote,
    deleteNote,
    linkSimulation,
    getClient: getProject,
    getProject,
    getByStatus,
    getStatusCounts,
    getProjectCompletion,

    // Scénarios
    addScenario,
    updateScenario,
    deleteScenario,
    addSimToScenario,
    updateSimInScenario,
    removeSimFromScenario,
    setPtzForScenario,
    getScenarioTotals,

    // Rappels
    addReminder,
    toggleReminder,
    deleteReminder,
  }
}

// Compat : exporter aussi STATUSES pour les pages qui importent depuis useClients
export const STATUSES = PROJECT_STATUSES
