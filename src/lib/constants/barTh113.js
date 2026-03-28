/**
 * Constantes BAR-TH-113 — Chaudière biomasse individuelle
 * Source : Fiche CEE à compter du 01/01/2026
 * Bonification Coup de Pouce : ×5 pour tous les ménages
 * MPR : Exclue depuis le 01/01/2026
 */

export const BAR_TH_113 = {
  code: 'BAR-TH-113',
  title: 'Chaudière biomasse individuelle',
  description: 'Calcul CEE pour l\'installation d\'une chaudière biomasse individuelle',

  // Montants de base en kWh cumac par zone climatique (2026)
  BASE_VALUES: {
    H1: 41300,
    H2: 33800,
    H3: 26300,
  },

  // Bonification Coup de Pouce 2026 : ×5 pour tous les ménages
  BONUS_PRECARITE: {
    Bleu: 5,
    Jaune: 5,
    Violet: 5,
    Rose: 5,
  },

  FUEL_TYPES: [
    { value: 'buches', label: 'Bûches de bois' },
    { value: 'granules', label: 'Granulés (pellets)' },
    { value: 'plaquettes', label: 'Plaquettes forestières' },
  ],

  REPLACED_ENERGY: [
    { value: 'fioul', label: 'Chaudière fioul' },
    { value: 'gaz', label: 'Chaudière gaz (non condensation)' },
    { value: 'charbon', label: 'Chaudière charbon' },
  ],
}
