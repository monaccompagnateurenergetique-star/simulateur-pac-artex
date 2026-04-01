export const LOC_AVANTAGE = {
  code: 'LOC-AVANTAGE',
  title: "Loc'Avantages — Logement Locatif Intermédiaire",
  description: 'Simulateur des aides ANAH pour la location intermédiaire',

  ZONES: [
    { value: 'Abis', label: 'Zone Abis — Île-de-France', coeff: 1.0 },
    { value: 'A', label: 'Zone A — Agglomérations > 250 000 hab.', coeff: 0.9 },
    { value: 'B1', label: 'Zone B1 — Villes 50 000-250 000 hab.', coeff: 0.8 },
    { value: 'B2', label: 'Zone B2 — Communes non-touristiques', coeff: 0.7 },
    { value: 'C', label: 'Zone C — Communes touristiques/montagne', coeff: 0.6 },
  ],

  RENTAL_LEVELS: [
    { value: 'Loc1', label: 'Loc 1 — Très social', description: '70% loyer régulé', discount: 0.70 },
    { value: 'Loc2', label: 'Loc 2 — Social', description: '80% loyer régulé', discount: 0.80 },
    { value: 'Loc3', label: 'Loc 3 — Intermédiaire', description: '100% loyer régulé', discount: 1.0 },
  ],

  LOYERS_REGULES: {
    Abis: 12.50, A: 10.50, B1: 8.50, B2: 7.00, C: 6.00,
  },

  SURFACE_COEFFICIENTS: {
    small: { min: 0, max: 50, coeff: 1.3 },
    medium: { min: 50, max: 80, coeff: 1.15 },
    large: { min: 80, max: 120, coeff: 1.0 },
    xlarge: { min: 120, max: Infinity, coeff: 0.9 },
  },

  TAX_REDUCTION: {
    dureeEngagement: 9,
    ratios: { Loc1: 85, Loc2: 60, Loc3: 50 },
  },

  ANAH_AIDS: {
    rate: 0.25,
    ceiling: 28000,
    minWorks: 1500,
  },

  ACTOR_TYPES: [
    { value: 'individual', label: 'Personne physique' },
    { value: 'sci', label: 'SCI' },
    { value: 'company', label: 'Société civile / Entreprise' },
  ],
}