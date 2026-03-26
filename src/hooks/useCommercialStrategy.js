import { useMemo } from 'react'
import { computeCommercialStrategy } from '../lib/commercial'

/**
 * Hook wrapping the shared commercial strategy computation.
 * Returns memoized results that update when inputs change.
 */
export function useCommercialStrategy({
  ceeEurosBase,
  ceePercentApplied,
  mprCategory,
  mprGrantTheorique,
  projectCost,
  maxEligibleCost = 12000,
}) {
  return useMemo(
    () =>
      computeCommercialStrategy({
        ceeEurosBase,
        ceePercentApplied,
        mprCategory,
        mprGrantTheorique,
        projectCost,
        maxEligibleCost,
      }),
    [ceeEurosBase, ceePercentApplied, mprCategory, mprGrantTheorique, projectCost, maxEligibleCost]
  )
}
