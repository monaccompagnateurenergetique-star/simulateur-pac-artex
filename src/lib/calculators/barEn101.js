import { BAR_EN_101 } from '../constants/barEn101'

export function calculateBarEn101({ surface, zone, priceMWh }) {
  const ratePerM2 = BAR_EN_101.RATES_PER_M2[zone] || 0
  // Formule fiche BAR-EN-101 : Volume = kWhc/m² × Surface
  const volumeCEE = ratePerM2 * surface
  // Pas de bonification x5 sur les fiches isolation (contrairement aux PAC)
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return { volumeCEE, ceeEuros, ratePerM2 }
}
