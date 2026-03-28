import { BAR_TH_112 } from '../constants/barTh112'

/**
 * Calcul CEE BAR-TH-112 — Appareil indépendant de chauffage au bois
 *
 * Volume = montant_zone × bonus_précarité
 * Euros  = (volume / 1000) × prixMWh
 */
export function calculateBarTh112({ zone, mprCategory, priceMWh }) {
  const baseValue = BAR_TH_112.BASE_VALUES[zone] || BAR_TH_112.BASE_VALUES.H1
  const bonusPrecarite = BAR_TH_112.BONUS_PRECARITE[mprCategory] || 1

  const volumeCEE = baseValue * bonusPrecarite
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return {
    volumeCEE: Math.round(volumeCEE),
    ceeEuros: Math.round(ceeEuros * 100) / 100,
    baseValue,
    bonusPrecarite,
    priceMWh,
  }
}
