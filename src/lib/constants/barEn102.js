export const BAR_EN_102 = {
  code: 'BAR-EN-102',
  title: 'Isolation des murs',
  description: 'Calcul CEE pour l\'isolation des murs par l\'intérieur ou l\'extérieur',

  // kWhc per m² by zone (fiche officielle BAR-EN-102 vA65.4 à compter du 01-01-2025)
  RATES_PER_M2: {
    H1: 1600,
    H2: 1300,
    H3: 880,
  },

  INSULATION_METHODS: [
    { value: 'interieur', label: 'Isolation par l\'intérieur (ITI)' },
    { value: 'exterieur', label: 'Isolation par l\'extérieur (ITE)' },
  ],

  R_THRESHOLD: 3.7, // m².K/W minimum

  DUREE_VIE: 30, // ans
  // Pas de bonification — la fiche donne directement les kWhc cumac/m²
}
