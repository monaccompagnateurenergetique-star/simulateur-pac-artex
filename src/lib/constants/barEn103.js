export const BAR_EN_103 = {
  code: 'BAR-EN-103',
  title: 'Isolation d\'un plancher bas',
  description: 'Calcul CEE pour l\'isolation du plancher bas sur local non chauffé',

  // kWhc per m² by zone (fiche officielle BAR-EN-103 mod A29-2)
  RATES_PER_M2: {
    H1: 1600,
    H2: 1300,
    H3: 900,
  },

  R_THRESHOLD: 3, // m².K/W minimum

  DUREE_VIE: 30, // ans
  // Pas de bonification — la fiche donne directement les kWhc cumac/m²
}
