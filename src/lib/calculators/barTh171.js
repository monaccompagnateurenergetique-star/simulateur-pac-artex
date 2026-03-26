import { BAR_TH_171 } from '../constants/barTh171'
import { ZONE_FACTORS } from '../constants/zones'

function getSurfaceFactor(type, surface) {
  const factors = BAR_TH_171.SURFACE_FACTORS[type]
  for (const { max, factor } of factors) {
    if (surface < max) return factor
  }
  return 1.0
}

export function calculateBarTh171({ type, surface, etas, zone, priceMWh }) {
  const baseAmount = BAR_TH_171.BASE_RATES[type]?.[etas] || 0
  const surfaceFactor = getSurfaceFactor(type, surface)
  const zoneFactor = ZONE_FACTORS[zone] || 1.0

  const volumeCEE = baseAmount * surfaceFactor * zoneFactor
  const ceeEuros = (volumeCEE / 1000) * priceMWh * BAR_TH_171.BONUS_FACTOR

  return { volumeCEE, ceeEuros, surfaceFactor, zoneFactor }
}
