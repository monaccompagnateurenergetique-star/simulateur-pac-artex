import { useOrgCollection } from './useOrgCollection'

export function useEstimationsImmo() {
  const orgStore = useOrgCollection('estimations_immo', 'artex360-estimations-immo', [])

  const estimations = orgStore.data

  const setEstimations = (updater) => {
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

  function addEstimation(data) {
    const estimation = {
      id: crypto.randomUUID(),
      agenceId: null,
      agenceNom: '',
      dossier: '',
      addressLabel: '',
      coordinates: null,
      codePostal: '',
      ville: '',
      typeLogement: 'maison',
      surface: null,
      dpeActuel: null,
      dpeVise: null,
      ageBatiment: '',
      travaux: [],
      totalTravauxTTC: 0,
      totalTravauxHT: 0,
      synthese: null,
      status: 'brouillon',
      notes: '',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setEstimations((prev) => [estimation, ...prev])
    return estimation
  }

  function updateEstimation(id, data) {
    setEstimations((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
      )
    )
  }

  function deleteEstimation(id) {
    setEstimations((prev) => prev.filter((e) => e.id !== id))
  }

  function getEstimation(id) {
    return estimations.find((e) => e.id === id)
  }

  function getEstimationsByAgence(agenceId) {
    return estimations.filter((e) => e.agenceId === agenceId)
  }

  function duplicateEstimation(id) {
    const source = estimations.find((e) => e.id === id)
    if (!source) return null
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = source
    return addEstimation({ ...rest, dossier: `${rest.dossier || ''} (copie)`.trim(), status: 'brouillon' })
  }

  function addSimulation(estimationId, simulation) {
    const sim = { id: crypto.randomUUID(), ...simulation, createdAt: new Date().toISOString() }
    setEstimations((prev) =>
      prev.map((e) =>
        e.id === estimationId
          ? { ...e, simulations: [...(e.simulations || []), sim], updatedAt: new Date().toISOString() }
          : e
      )
    )
    return sim
  }

  function updateSimulation(estimationId, simId, data) {
    setEstimations((prev) =>
      prev.map((e) =>
        e.id === estimationId
          ? { ...e, simulations: (e.simulations || []).map((s) => s.id === simId ? { ...s, ...data } : s), updatedAt: new Date().toISOString() }
          : e
      )
    )
  }

  function deleteSimulation(estimationId, simId) {
    setEstimations((prev) =>
      prev.map((e) =>
        e.id === estimationId
          ? { ...e, simulations: (e.simulations || []).filter((s) => s.id !== simId), updatedAt: new Date().toISOString() }
          : e
      )
    )
  }

  return {
    estimations,
    addEstimation,
    updateEstimation,
    deleteEstimation,
    getEstimation,
    getEstimationsByAgence,
    duplicateEstimation,
    addSimulation,
    updateSimulation,
    deleteSimulation,
  }
}
