import { useOrgSettings } from './useOrgSettings'

export function useSettings() {
  // useOrgSettings gere deja le fallback localStorage via useOrgDoc
  const orgSettings = useOrgSettings()

  return {
    settings: orgSettings.settings,
    setSettings: orgSettings.setSettings,
    updateCompany: orgSettings.updateCompany,
    updateCeePrice: orgSettings.updateCeePrice,
    resetSettings: orgSettings.resetSettings,
    getCeePrice: orgSettings.getCeePrice,
    DEFAULT_SETTINGS: orgSettings.DEFAULT_SETTINGS,
  }
}
