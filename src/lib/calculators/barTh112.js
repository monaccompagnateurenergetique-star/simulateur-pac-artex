import { BAR_TH_112 } from '../constants/barTh112'

/**
 * Calcul CEE BAR-TH-112 — Appareil indépendant de chauffage au bois
 *
 * Volume = montant_base(etas, zone) × bonus_coup_de_pouce(profil)
 * Euros  = (volume / 1000) × prixMWh
 *
 * Bonification Coup de Pouce 2026 (SEULEMENT SI REMPLACEMENT CHAUFFAGE AU CHARBON) :
 * - Modestes/précaires (Bleu, Jaune) : ×5
 * - Classiques (Violet, Rose) : ×4
 *
 * Sans remplacement : pas de bonification (×1)
 */
export function calculateBarTh112({ etas, zone, mprCategory, priceMWh, remplaceCharbon = false }) {
  const etasValues = BAR_TH_112.BASE_VALUES[etas] || BAR_TH_112.BASE_VALUES.high
  const baseValue = etasValues[zone] || etasValues.H1

  // Bonification appliquée SEULEMENT si c'est un remplacement de chauffage au charbon
  let bonusPrecarite = 1 // Sans bonification par défaut
  if (remplaceCharbon) {
    bonusPrecarite = BAR_TH_112.BONUS_PRECARITE[mprCategory] || 4
  }

  const volumeCEE = baseValue * bonusPrecarite
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return {
    volumeCEE: Math.round(volumeCEE),
    ceeEuros: Math.round(ceeEuros * 100) / 100,
    baseValue,
    bonusPrecarite,
    priceMWh,
    remplaceCharbon,
  }
}
