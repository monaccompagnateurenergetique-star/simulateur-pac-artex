import { useOrgDoc } from './useOrgCollection'

/**
 * useCeeDeals — Gestion des deals CEE (oblige/delegataire)
 * Stocke dans organizations/{orgId}/settings/config sous la cle ceeDeals
 */
export function useCeeDeals() {
  const { data: settings, save, synced, isOnline } = useOrgDoc(
    'settings/config',
    'artex360-org-settings',
    { ceeDeals: [] }
  )

  const deals = settings.ceeDeals || []

  function addDeal(deal) {
    const newDeal = {
      id: crypto.randomUUID(),
      obligeName: '',
      delegataireName: '',
      contractRef: '',
      validFrom: '',
      validTo: '',
      pricePerMWhc: { tresModeste: 12, modeste: 10, classique: 7, aise: 5 },
      isDefault: deals.length === 0,
      ...deal,
      createdAt: new Date().toISOString(),
    }
    save({ ...settings, ceeDeals: [...deals, newDeal] })
    return newDeal
  }

  function updateDeal(id, data) {
    save({
      ...settings,
      ceeDeals: deals.map((d) =>
        d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
      ),
    })
  }

  function deleteDeal(id) {
    const remaining = deals.filter((d) => d.id !== id)
    // Si on supprime le deal par defaut, mettre le premier restant comme defaut
    if (remaining.length > 0 && !remaining.some((d) => d.isDefault)) {
      remaining[0].isDefault = true
    }
    save({ ...settings, ceeDeals: remaining })
  }

  function setDefaultDeal(id) {
    save({
      ...settings,
      ceeDeals: deals.map((d) => ({ ...d, isDefault: d.id === id })),
    })
  }

  function getDefaultDeal() {
    return deals.find((d) => d.isDefault) || deals[0] || null
  }

  function getActiveDeal() {
    const now = new Date().toISOString().slice(0, 10)
    const active = deals.find(
      (d) => d.isDefault && (!d.validTo || d.validTo >= now)
    )
    return active || getDefaultDeal()
  }

  return {
    deals,
    addDeal,
    updateDeal,
    deleteDeal,
    setDefaultDeal,
    getDefaultDeal,
    getActiveDeal,
    synced,
    isOnline,
  }
}
