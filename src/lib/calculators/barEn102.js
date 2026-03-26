import { BAR_EN_102 } from '../constants/barEn102'

export function calculateBarEn102({ surface, zone, priceMWh }) {
  const ratePerM2 = BAR_EN_102.RATES_PER_M2[zone] || 0
  // Formule fiche BAR-EN-102 : Volume = kWhc/m² × Surface
  const volumeCEE = ratePerM2 * surface
  // Pas de bonification — la fiche donne directement les kWhc cumac/m²
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return { volumeCEE, ceeEuros, ratePerM2 }
}
