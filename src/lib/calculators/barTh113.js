import { BAR_TH_113 } from '../constants/barTh113'

/**
 * Calcul CEE BAR-TH-113 — Chaudière biomasse individuelle
 *
 * Volume = montant_base(zone) × bonus_coup_de_pouce(profil)
 * Euros  = (volume / 1000) × prixMWh
 *
 * Coup de Pouce 2026 : ×5 pour tous les ménages
 */
export function calculateBarTh113({ zone = 'H1', mprCategory = 'Bleu', priceMWh, isPrecarite }) {
  // Rétrocompatibilité : si zone n'est pas fourni, utiliser l'ancien mode
  const baseValue = BAR_TH_113.BASE_VALUES[zone] || BAR_TH_113.BASE_VALUES.H1
  const bonusPrecarite = BAR_TH_113.BONUS_PRECARITE[mprCategory] || 5

  const volumeCEE = baseValue * bonusPrecarite
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return {
    volumeCEE: Math.round(volumeCEE),
    ceeEuros: Math.round(ceeEuros * 100) / 100,
    baseValue,
    bonusPrecarite,
  }
}
