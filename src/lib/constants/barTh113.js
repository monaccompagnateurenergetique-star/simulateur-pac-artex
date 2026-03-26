export const BAR_TH_113 = {
  code: 'BAR-TH-113',
  title: 'Chaudière biomasse individuelle',
  description: 'Calcul CEE pour l\'installation d\'une chaudière biomasse individuelle',

  BASE_VALUES: {
    precarite: 727300, // kWhc - ménages en précarité énergétique
    standard: 454500,  // kWhc - autres ménages
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
