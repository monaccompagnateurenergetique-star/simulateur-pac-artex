/**
 * Constantes PTZ (Prêt à Taux Zéro) - Barème 2026
 */

// Plafonds selon le nombre de gestes de rénovation
export const PTZ_PLAFONDS = {
  1: 15000,
  2: 25000,
  3: 30000,
  4: 50000,
}

export const PTZ_DUREE_MAX = 20 // ans

// Conditions selon le profil de revenus
export const PTZ_CONDITIONS = {
  Bleu:   { differe: 5, dureeTotale: 20, eligible: true },
  Jaune:  { differe: 5, dureeTotale: 20, eligible: true },
  Violet: { differe: 2, dureeTotale: 15, eligible: true },
  Rose:   { eligible: false },
}

export const PTZ_GESTES_OPTIONS = [
  { value: 1, label: '1 geste' },
  { value: 2, label: '2 gestes' },
  { value: 3, label: '3 gestes' },
  { value: 4, label: '4 gestes ou plus' },
]
