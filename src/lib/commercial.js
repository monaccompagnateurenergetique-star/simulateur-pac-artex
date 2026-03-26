import { MAX_AID_PERCENTAGE } from './constants/mpr'

/**
 * Compute the commercial strategy: CEE applied, MPR ceiling, margin, RAC.
 * This logic is shared across ALL simulators.
 */
export function computeCommercialStrategy({
  ceeEurosBase,
  ceePercentApplied,
  mprCategory,
  mprGrantTheorique,
  projectCost,
  maxEligibleCost = 12000,
}) {
  const ceeCommerciale = ceeEurosBase * (ceePercentApplied / 100)
  const maxAidPercentage = MAX_AID_PERCENTAGE[mprCategory] || 0

  let mprFinal = mprGrantTheorique
  let isCeilingExceeded = false
  let totalAid = 0

  if (mprCategory !== 'Rose' && maxAidPercentage > 0) {
    const eligibleExpense = Math.min(projectCost, maxEligibleCost)
    const maxTotalAid = eligibleExpense * maxAidPercentage
    const totalTheorique = ceeCommerciale + mprGrantTheorique

    if (totalTheorique > maxTotalAid) {
      mprFinal = Math.max(0, maxTotalAid - ceeCommerciale)
      totalAid = maxTotalAid
      isCeilingExceeded = true
    } else {
      mprFinal = mprGrantTheorique
      totalAid = totalTheorique
    }
  } else {
    totalAid = ceeCommerciale + mprFinal
  }

  const resteACharge = Math.max(0, projectCost - totalAid)
  const ceeMargin = ceeEurosBase - ceeCommerciale
  const ceeMarginPercent = ceeEurosBase > 0 ? (ceeMargin / ceeEurosBase) * 100 : 0

  return {
    ceeCommerciale,
    mprFinal,
    totalAid,
    resteACharge,
    ceeMargin,
    ceeMarginPercent,
    maxAidPercentage,
    isCeilingExceeded,
  }
}
