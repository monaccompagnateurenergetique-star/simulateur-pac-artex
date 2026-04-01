import { LOC_AVANTAGE } from '../constants/locAvantage'

/**
 * Calcul Loc'Avantages — Aides ANAH + Réduction d'impôt
 *
 * 1. Subvention ANAH travaux :
 *    - Taux (25% ou 35%) × min(montant travaux, plafond)
 *    - Plafond = min(surface × plafond/m², plafond total)
 *
 * 2. Réduction d'impôt :
 *    - Calculée sur les revenus bruts fonciers (loyer annuel)
 *    - Taux dépend du niveau Loc et de l'intermédiation
 *
 * 3. Prime d'intermédiation locative :
 *    - 1 000€ (mandat gestion) ou 3 000€ (location/sous-location)
 */
export function calculateLocAvantage({
  surface = 80,
  zone = 'B1',
  rentalLevel = 'Loc2',
  workAmount = 15000,
  workType = 'amelioration',
  hasIntermediation = false,
  intermediationType = 'mandatGestion',
  loyerActuel = 0,
  nbLogements = 1,
}) {
  // ── 1. Loyers plafonds et estimation ──
  const loyerPlafondM2 = LOC_AVANTAGE.LOYERS_PLAFONDS[rentalLevel]?.[zone] || 10
  const loyerMarcheM2 = LOC_AVANTAGE.LOYERS_MARCHE[zone] || 12

  // Surface pondérée (formule ANAH)
  const seuil = LOC_AVANTAGE.SURFACE_PONDEREE_SEUIL
  const surfacePonderee = surface <= seuil
    ? surface
    : seuil + (surface - seuil) * 0.5

  const loyerMensuelPlafond = Math.round(loyerPlafondM2 * surfacePonderee * 100) / 100
  const loyerMensuelMarche = Math.round(loyerMarcheM2 * surfacePonderee * 100) / 100
  const loyerAnnuelPlafond = Math.round(loyerMensuelPlafond * 12 * 100) / 100
  const decoteVsMarche = loyerMensuelMarche > 0
    ? Math.round((1 - loyerMensuelPlafond / loyerMensuelMarche) * 100)
    : 0

  // ── 2. Subvention ANAH travaux ──
  const workTypeData = LOC_AVANTAGE.WORK_TYPES.find(w => w.value === workType)
    || LOC_AVANTAGE.WORK_TYPES[0]

  const plafondTravaux = Math.min(
    surface * workTypeData.plafondM2,
    workTypeData.plafondTotal
  )
  const travauxEligibles = Math.min(workAmount, plafondTravaux)
  const subventionAnah = Math.round(travauxEligibles * workTypeData.tauxSubvention * 100) / 100
  const travauxDepasses = workAmount > plafondTravaux

  // ── 3. Réduction d'impôt ──
  const rentalData = LOC_AVANTAGE.RENTAL_LEVELS.find(r => r.value === rentalLevel)
  const intermediationObligatoire = rentalData?.intermediationObligatoire || false

  // Forcer l'intermédiation si Loc3
  const intermediationEffective = intermediationObligatoire || hasIntermediation

  let tauxReduction
  if (intermediationEffective) {
    tauxReduction = LOC_AVANTAGE.TAX_REDUCTION.avecIntermediation[rentalLevel] || 15
  } else {
    tauxReduction = LOC_AVANTAGE.TAX_REDUCTION.sansIntermediation[rentalLevel]
    if (tauxReduction === null) {
      // Loc3 sans intermédiation = pas de réduction
      tauxReduction = 0
    }
  }

  const reductionImpotAnnuelle = Math.round(loyerAnnuelPlafond * tauxReduction / 100 * 100) / 100
  const dureeEngagement = LOC_AVANTAGE.TAX_REDUCTION.dureeEngagement
  const reductionImpotTotale = Math.round(reductionImpotAnnuelle * dureeEngagement * 100) / 100

  // ── 4. Prime d'intermédiation ──
  let primeIntermediation = 0
  if (intermediationEffective) {
    primeIntermediation = intermediationType === 'locationSousLocation'
      ? LOC_AVANTAGE.PRIME_INTERMEDIATION.locationSousLocation
      : LOC_AVANTAGE.PRIME_INTERMEDIATION.mandatGestion
    primeIntermediation *= nbLogements
  }

  // ── 5. Totaux ──
  const totalAides = Math.round((subventionAnah + reductionImpotTotale + primeIntermediation) * 100) / 100
  const resteACharge = Math.max(0, Math.round((workAmount - subventionAnah) * 100) / 100)

  return {
    // Loyers
    loyerPlafondM2,
    loyerMarcheM2,
    surfacePonderee: Math.round(surfacePonderee * 100) / 100,
    loyerMensuelPlafond,
    loyerMensuelMarche,
    loyerAnnuelPlafond,
    decoteVsMarche,

    // Subvention travaux
    workTypeLabel: workTypeData.label,
    tauxSubvention: workTypeData.tauxSubvention,
    plafondTravaux,
    travauxEligibles,
    subventionAnah,
    travauxDepasses,

    // Réduction d'impôt
    intermediationEffective,
    intermediationObligatoire,
    tauxReduction,
    reductionImpotAnnuelle,
    reductionImpotTotale,
    dureeEngagement,

    // Prime intermédiation
    primeIntermediation,

    // Totaux
    totalAides,
    resteACharge,
  }
}
