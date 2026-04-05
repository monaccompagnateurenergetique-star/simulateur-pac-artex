import { useOrgDoc } from './useOrgCollection'

const EMPTY_DELEGATAIRE = {
  siren: '',
  raisonSociale: '',
  civilite: '',
  prenom: '',
  nom: '',
  adresse: '',
  ville: '',
  codePostal: '',
  email: '',
  telephone: '',
  siteWeb: '',
  isFavori: false,
  logo: null,
  tampon: null,
}

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
      contractRef: '',
      validFrom: '',
      validTo: '',
      pricePerMWhc: { tresModeste: 12, modeste: 10, classique: 7, aise: 5 },
      delegataire: { ...EMPTY_DELEGATAIRE },
      useFicheOverrides: false,
      ficheOverrides: {},
      minCeePercent: 0,
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

  /**
   * Résout le prix CEE pour une fiche et une catégorie donnée.
   * Priorité : ficheOverrides > pricePerMWhc global > fallback
   */
  function getPriceForFiche(deal, ficheCode, categoryKey) {
    if (!deal) return null
    if (deal.useFicheOverrides && deal.ficheOverrides?.[ficheCode]) {
      const override = deal.ficheOverrides[ficheCode][categoryKey]
      if (override !== undefined && override !== null) return override
    }
    return deal.pricePerMWhc?.[categoryKey] ?? null
  }

  return {
    deals,
    addDeal,
    updateDeal,
    deleteDeal,
    setDefaultDeal,
    getDefaultDeal,
    getActiveDeal,
    getPriceForFiche,
    synced,
    isOnline,
    EMPTY_DELEGATAIRE,
  }
}
