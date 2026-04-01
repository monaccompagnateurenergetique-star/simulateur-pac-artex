import { LOC_AVANTAGE } from '../constants/locAvantage'

export function calculateLocAvantage({
  surface = 80,
  zone = 'B1',
  rentalLevel = 'Loc2',
  workAmount = 10000,
  hasIntermediationAgent = false,
  actorType = 'individual',
}) {
  const { coeff: surfaceCoeff } = getSurfaceCoefficient(surface)
  const baseMonthlyRent = LOC_AVANTAGE.LOYERS_REGULES[zone] || 8.5
  const monthlyRentPerM2 = baseMonthlyRent * surfaceCoeff
  const zoneData = LOC_AVANTAGE.ZONES.find((z) => z.value === zone)
  const zoneCoeff = zoneData?.coeff || 0.8
  const adjustedMonthlyRentPerM2 = monthlyRentPerM2 * zoneCoeff
  const regulatedMonthlyRent = adjustedMonthlyRentPerM2 * surface
  const rentalData = LOC_AVANTAGE.RENTAL_LEVELS.find((r) => r.value === rentalLevel)
  const rentalDiscount = rentalData?.discount || 0.8
  const estimatedMonthlyRent = regulatedMonthlyRent * rentalDiscount
  const annualRent = Math.round(estimatedMonthlyRent * 12 * 100) / 100
  const anahSubsidyAmount = Math.min(
    Math.round((workAmount * LOC_AVANTAGE.ANAH_AIDS.rate) * 100) / 100,
    LOC_AVANTAGE.ANAH_AIDS.ceiling
  )
  const taxReductionRate = LOC_AVANTAGE.TAX_REDUCTION.ratios[rentalLevel] || 60
  const annualTaxReduction = Math.round((annualRent * taxReductionRate) / 100 * 100) / 100
  const engagementYears = LOC_AVANTAGE.TAX_REDUCTION.dureeEngagement
  const totalTaxReductionOver9Years = Math.round(annualTaxReduction * engagementYears * 100) / 100
  const intermediationRate = hasIntermediationAgent ? 0.15 : 0
  const intermediationAmount = Math.round(annualRent * intermediationRate * 100) / 100

  return {
    surface, zone, rentalLevel, workAmount, hasIntermediationAgent, actorType,
    surfaceCoeff, zoneCoeff, baseMonthlyRent, monthlyRentPerM2, adjustedMonthlyRentPerM2,
    regulatedMonthlyRent, rentalDiscount,
    estimatedMonthlyRent: Math.round(estimatedMonthlyRent * 100) / 100,
    annualRent,
    anahSubsidyAmount,
    anahSubsidyRate: LOC_AVANTAGE.ANAH_AIDS.rate,
    taxReductionRate,
    annualTaxReduction,
    totalTaxReductionOver9Years,
    engagementYears,
    intermediationRate,
    intermediationAmount,
    totalFinancialBenefit: Math.round((anahSubsidyAmount + totalTaxReductionOver9Years) * 100) / 100,
  }
}

function getSurfaceCoefficient(surface) {
  const bands = Object.values(LOC_AVANTAGE.SURFACE_COEFFICIENTS)
  for (const band of bands) {
    if (surface >= band.min && surface < band.max) {
      return band
    }
  }
  return LOC_AVANTAGE.SURFACE_COEFFICIENTS.xlarge
}

export function getZoneLabel(zoneValue) {
  const zone = LOC_AVANTAGE.ZONES.find((z) => z.value === zoneValue)
  return zone?.label || zoneValue
}

export function getRentalLevelLabel(levelValue) {
  const level = LOC_AVANTAGE.RENTAL_LEVELS.find((l) => l.value === levelValue)
  return level?.label || levelValue
}

export function formatEuro(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}