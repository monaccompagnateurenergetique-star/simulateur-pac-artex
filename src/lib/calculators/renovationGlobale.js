/**
 * Calculateur BAR-TH-174 / BAR-TH-175 — Rénovation d'ampleur
 *
 * Le mode (CEE vs ANAH) dépend du DPE ET du profil bénéficiaire :
 * - PP + DPE E/F/G → MaPrimeRénov' Parcours Accompagné
 * - PP + DPE C/D   → CEE BAR-TH-174/175
 * - Personne morale (SCI, bailleur social) → Toujours CEE (toutes classes)
 */
import {
  MONTANT_UNITAIRE,
  SURFACE_FACTORS,
  BONUS_PRECARITE,
  CLASS_ORDER,
  CLASSES_ANAH,
  MPR_PARCOURS_TAUX,
  MPR_PARCOURS_PLAFOND,
} from '../constants/renovationGlobale'

// ─── Helpers ───

function getSurfaceFactor(surface) {
  for (const { max, factor } of SURFACE_FACTORS) {
    if (surface < max) return factor
  }
  return 1.3
}

export function getClassJump(classInitiale, classCible) {
  return CLASS_ORDER.indexOf(classCible) - CLASS_ORDER.indexOf(classInitiale)
}

function clampJumps(jumps) {
  return jumps >= 4 ? 4 : jumps
}

// ─── Mode CEE (DPE C, D) ───

export function calculateCEE({ classInitiale, classCible, surface, mprCategory, priceMWhPrecaire = 12, priceMWhClassique = 7 }) {
  const jumps = getClassJump(classInitiale, classCible)
  if (jumps < 2) return { volumeCEE: 0, ceeEuros: 0, jumps, surfaceFactor: 0, bonusPrecarite: 1, montantUnitaire: 0, priceMWh: 0 }

  const clampedJumps = clampJumps(jumps)
  const montantUnitaire = MONTANT_UNITAIRE[clampedJumps]
  const surfaceFactor = getSurfaceFactor(surface)
  const bonusPrecarite = BONUS_PRECARITE[mprCategory] || 1

  const volumeCEE = montantUnitaire * surfaceFactor * bonusPrecarite
  const priceMWh = mprCategory === 'Bleu' ? priceMWhPrecaire : priceMWhClassique
  const ceeEuros = (volumeCEE / 1000) * priceMWh

  return {
    volumeCEE: Math.round(volumeCEE * 100) / 100,
    ceeEuros: Math.round(ceeEuros * 100) / 100,
    jumps,
    surfaceFactor,
    bonusPrecarite,
    montantUnitaire,
    priceMWh,
  }
}

// ─── Mode ANAH (DPE E, F, G) ───

export function calculateANAH({ classInitiale, classCible, mprCategory, projectCostHT }) {
  const jumps = getClassJump(classInitiale, classCible)
  if (jumps < 2) return { mprAmount: 0, plafondHT: 0, taux: 0, depenseEligible: 0, jumps }

  const clampedJumps = clampJumps(jumps)
  const tauxByJumps = MPR_PARCOURS_TAUX[clampedJumps] || MPR_PARCOURS_TAUX[2]
  const taux = tauxByJumps[mprCategory] || 0
  const plafondHT = MPR_PARCOURS_PLAFOND[clampedJumps] || 30000

  const depenseEligible = Math.min(projectCostHT, plafondHT)
  const mprAmount = Math.round(depenseEligible * taux)

  return { mprAmount, plafondHT, taux, depenseEligible, jumps }
}

// ─── Calcul complet ───

/**
 * @param {Object} params
 * @param {string} [params.forceMode] - 'cee' ou 'anah' — si fourni, ignore la logique DPE pour le choix du mode
 */
export function calculateRenovationGlobale({
  classInitiale,
  classCible,
  surface,
  mprCategory,
  projectCostHT,
  projectCostTTC,
  priceMWhPrecaire = 12,
  priceMWhClassique = 7,
  forceMode = null,
}) {
  const isAnah = forceMode ? forceMode === 'anah' : CLASSES_ANAH.includes(classInitiale)
  const jumps = getClassJump(classInitiale, classCible)

  if (isAnah) {
    // ── Mode MPR Parcours Accompagné ──
    const anah = calculateANAH({ classInitiale, classCible, mprCategory, projectCostHT })
    return {
      mode: 'anah',
      isAnah: true,
      jumps,
      ...anah,
      totalAides: anah.mprAmount,
      resteACharge: Math.max(0, projectCostTTC - anah.mprAmount),
    }
  }

  // ── Mode CEE ──
  const cee = calculateCEE({
    classInitiale, classCible, surface, mprCategory,
    priceMWhPrecaire, priceMWhClassique,
  })

  return {
    mode: 'cee',
    isAnah: false,
    jumps,
    ...cee,
    totalAides: Math.round(cee.ceeEuros),
    resteACharge: Math.max(0, projectCostTTC - Math.round(cee.ceeEuros)),
  }
}
