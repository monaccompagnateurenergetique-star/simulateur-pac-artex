import { useOrgDoc } from './useOrgCollection'

const DEFAULT_ORG_SETTINGS = {
  company: {
    name: '',
    logo: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    siret: '',
    rge: '',
  },
  ceePrices: {
    tresModeste: 12,
    modeste: 10,
    classique: 7,
    aise: 5,
  },
  ceeDeals: [],
}

export function useOrgSettings() {
  const { data: rawSettings, save, synced, isOnline } = useOrgDoc(
    'settings/config',
    'artex360-org-settings',
    DEFAULT_ORG_SETTINGS
  )

  // Toujours merger avec les defaults pour éviter les undefined
  // (le doc Firestore peut être partiel si mis à jour par useCeeDeals)
  const settings = {
    ...DEFAULT_ORG_SETTINGS,
    ...rawSettings,
    company: { ...DEFAULT_ORG_SETTINGS.company, ...(rawSettings?.company || {}) },
    ceePrices: { ...DEFAULT_ORG_SETTINGS.ceePrices, ...(rawSettings?.ceePrices || {}) },
  }

  function updateCompany(field, value) {
    save({
      ...rawSettings,
      company: { ...settings.company, [field]: value },
    })
  }

  function updateCeePrice(profile, value) {
    save({
      ...rawSettings,
      ceePrices: { ...settings.ceePrices, [profile]: Number(value) },
    })
  }

  function getCeePrice(mprCategory) {
    const map = {
      Bleu: settings.ceePrices.tresModeste,
      Jaune: settings.ceePrices.modeste,
      Violet: settings.ceePrices.classique,
      Rose: settings.ceePrices.aise,
    }
    return map[mprCategory] ?? settings.ceePrices.classique ?? 7
  }

  function resetSettings() {
    save(DEFAULT_ORG_SETTINGS)
  }

  return {
    settings,
    setSettings: save,
    updateCompany,
    updateCeePrice,
    resetSettings,
    getCeePrice,
    synced,
    isOnline,
    DEFAULT_SETTINGS: DEFAULT_ORG_SETTINGS,
  }
}
