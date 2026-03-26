import { BAR_TH_175 } from '../constants/barTh175'

export function calculateBarTh175({ classInitiale, classCible, surface, priceMWh }) {
  const cefInitial = BAR_TH_175.CEF_VALUES[classInitiale] || 0
  const cefCible = BAR_TH_175.CEF_VALUES[classCible] || 0

  if (cefCible >= cefInitial) return { volumeCEE: 0, ceeEuros: 0, gainCef: 0 }

  const gainCef = cefInitial - cefCible
  const volumeCEE = gainCef * surface
  // Pas de bonification x5 sur BAR-TH-175 (uniquement sur BAR-TH-171)
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return { volumeCEE, ceeEuros, gainCef }
}
