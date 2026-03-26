export const BAR_EN_101 = {
  code: 'BAR-EN-101',
  title: 'Isolation des combles ou de toitures',
  description: 'Calcul CEE pour l\'isolation des combles perdus ou rampants de toiture',

  // kWhc per m² by zone (fiche officielle BAR-EN-101)
  RATES_PER_M2: {
    H1: 1700,
    H2: 1400,
    H3: 900,
  },

  INSULATION_TYPES: [
    { value: 'combles', label: 'Combles perdus (R ≥ 7 m².K/W)' },
    { value: 'rampants', label: 'Rampants de toiture (R ≥ 6 m².K/W)' },
  ],

  R_THRESHOLDS: {
    combles: 7,
    rampants: 6,
  },

  // MaPrimeRénov' : uniquement pour les rampants de toiture / plafonds de combles
  // Combles perdus : NON éligibles MPR
  MPR_PER_M2: {
    rampants: { Bleu: 25, Jaune: 20, Violet: 15, Rose: 0 },
    combles: { Bleu: 0, Jaune: 0, Violet: 0, Rose: 0 },
  },

  // Dépense éligible plafonnée à 75 €/m² (guide ANAH février 2026)
  DEPENSE_ELIGIBLE_PER_M2: 75,

  DUREE_VIE: 30, // ans
}
