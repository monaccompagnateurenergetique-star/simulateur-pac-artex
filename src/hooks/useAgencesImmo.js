import { useOrgCollection } from './useOrgCollection'

export function useAgencesImmo() {
  const orgStore = useOrgCollection('agences_immo', 'artex360-agences-immo', [])

  const agences = orgStore.data

  const setAgences = (updater) => {
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

  function addAgence(data) {
    const agence = {
      id: crypto.randomUUID(),
      nom: '',
      adresse: '',
      ville: '',
      codePostal: '',
      telephone: '',
      email: '',
      contact: '',
      notes: '',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setAgences((prev) => [agence, ...prev])
    return agence
  }

  function updateAgence(id, data) {
    setAgences((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      )
    )
  }

  function deleteAgence(id) {
    setAgences((prev) => prev.filter((a) => a.id !== id))
  }

  function getAgence(id) {
    return agences.find((a) => a.id === id)
  }

  return { agences, addAgence, updateAgence, deleteAgence, getAgence }
}
