import { BAR_TH_113 } from '../constants/barTh113'

export function calculateBarTh113({ isPrecarite, priceMWh }) {
  const baseValue = isPrecarite ? BAR_TH_113.BASE_VALUES.precarite : BAR_TH_113.BASE_VALUES.standard
  const volumeCEE = baseValue
  // Pas de bonification x5 sur BAR-TH-113 (uniquement sur BAR-TH-171)
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return { volumeCEE, ceeEuros }
}
