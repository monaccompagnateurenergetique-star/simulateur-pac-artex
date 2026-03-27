import { useLocalStorage } from './useLocalStorage'

const DEFAULT_SETTINGS = {
  // Infos société
  company: {
    name: '',
    logo: '', // base64 ou URL
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    siret: '',
    rge: '',
  },
  // Prix CEE par profil de revenus (€/MWhc)
  ceePrices: {
    tresModeste: 12,  // Bleu
    modeste: 10,      // Jaune
    classique: 7,     // Violet
    aise: 5,          // Rose
  },
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage('artex360-settings', DEFAULT_SETTINGS)

  function updateCompany(field, value) {
    setSettings(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }))
  }

  function updateCeePrice(profile, value) {
    setSettings(prev => ({
      ...prev,
      ceePrices: { ...prev.ceePrices, [profile]: Number(value) },
    }))
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
  }

  // Retourne le prix CEE en fonction du profil MPR
  function getCeePrice(mprCategory) {
    const map = {
      Bleu: settings.ceePrices.tresModeste,
      Jaune: settings.ceePrices.modeste,
      Violet: settings.ceePrices.classique,
      Rose: settings.ceePrices.aise,
    }
    return map[mprCategory] ?? settings.ceePrices.classique
  }

  return {
    settings,
    setSettings,
    updateCompany,
    updateCeePrice,
    resetSettings,
    getCeePrice,
    DEFAULT_SETTINGS,
  }
}
