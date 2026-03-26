export const BAR_TH_171 = {
  code: 'BAR-TH-171',
  title: 'Pompe à chaleur air/eau',
  description: 'Calcul CEE + Stratégie de Déduction et Plafond',

  BASE_RATES: {
    Maison: { standard: 90900, high: 109200 },
    Appartement: { standard: 48700, high: 58900 },
  },

  SURFACE_FACTORS: {
    Maison: [
      { max: 70, factor: 0.5 },
      { max: 90, factor: 0.7 },
      { max: Infinity, factor: 1.0 },
    ],
    Appartement: [
      { max: 35, factor: 0.5 },
      { max: 60, factor: 0.7 },
      { max: Infinity, factor: 1.0 },
    ],
  },

  BONUS_FACTOR: 5,

  ETAS_OPTIONS: [
    { value: 'high', label: 'Etas ≥ 140%' },
    { value: 'standard', label: '111% ≤ Etas < 140%' },
  ],
}
