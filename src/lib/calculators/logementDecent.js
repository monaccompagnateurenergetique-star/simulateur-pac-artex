/**
 * Calculateur — Ma Prime Logement Décent
 * Source : Guide des aides financières ANAH — Février 2026 (pages 64-66)
 *
 * ═══ Propriétaire occupant ═══
 * Mode principal (classe E atteignable) :
 *   aide = min(coûtHT, 70 000) × taux (80% Bleu / 60% Jaune)
 *   + prime sortie passoire (+10% si DPE initial F/G)
 *   écrêtement : aide ≤ TTC × (100% Bleu / 90% Jaune)
 *
 * Mode dérogatoire (classe E non atteignable) :
 *   aide = min(coûtHT, 50 000) × 50%
 *   écrêtement idem
 *
 * ═══ Propriétaire bailleur ═══
 *   plafond = prixM2 × min(surface, 80)
 *   aide = min(coûtHT, plafond) × taux (35% ou 25%)
 *   + prime sortie passoire (1 500 € ou 2 000 € si passoire)
 *   écrêtement : aide ≤ TTC × 90%
 */
import {
  OCCUPANT_FUNDING,
  BAILLEUR_CATEGORIES,
  CLASSES_PASSOIRE,
  CLASS_ORDER,
  AMO,
} from '../constants/logementDecent'

// ─── Helpers ───

export function getClassJump(classInitiale, classCible) {
  return CLASS_ORDER.indexOf(classCible) - CLASS_ORDER.indexOf(classInitiale)
}

function isPassoire(classInitiale) {
  return CLASSES_PASSOIRE.includes(classInitiale)
}

function isSortiePassoire(classInitiale, classCible) {
  return isPassoire(classInitiale) && !CLASSES_PASSOIRE.includes(classCible)
}

// ═══════════════════════════════════════════════════════════════════
// PROPRIÉTAIRE OCCUPANT
// ═══════════════════════════════════════════════════════════════════

export function calculateOccupant({
  classInitiale,
  classCible,
  incomeProfile,
  projectCostHT,
  projectCostTTC,
  classeEAtteignable = true,
  marCostTTC = 2000,
}) {
  const mode = classeEAtteignable ? 'principal' : 'derogatoire'
  const funding = OCCUPANT_FUNDING[mode]

  const taux = funding.taux[incomeProfile] || 0
  const plafondHT = funding.plafondHT
  const ecretementRate = funding.ecretement[incomeProfile] || 1

  const depenseEligible = Math.min(projectCostHT, plafondHT)
  let aideBase = Math.round(depenseEligible * taux)

  // Prime sortie passoire : +10% sur la dépense éligible (mode principal uniquement)
  const sortiePassoire = isSortiePassoire(classInitiale, classCible)
  const primeSortiePassoire = sortiePassoire && funding.primeSortiePassoire > 0
    ? Math.round(depenseEligible * funding.primeSortiePassoire)
    : 0

  const aideAvantEcretement = aideBase + primeSortiePassoire

  // Écrêtement : total aides ≤ TTC × taux écrêtement
  const plafondEcretement = Math.round(projectCostTTC * ecretementRate)
  const aideFinale = Math.min(aideAvantEcretement, plafondEcretement)

  // AMO — Mon Accompagnateur Rénov'
  const amoTaux = AMO.taux[incomeProfile] || 0
  const amoDepenseEligible = Math.min(marCostTTC, AMO.plafondTTC)
  const amoMontant = Math.round(amoDepenseEligible * amoTaux)

  // Totaux séparés
  const aideTravaux = aideFinale
  const aideMar = amoMontant
  const totalAides = aideTravaux + aideMar

  const resteAChargeTravaux = Math.max(0, projectCostTTC - aideTravaux)
  const resteAChargeMar = Math.max(0, marCostTTC - aideMar)
  const resteACharge = resteAChargeTravaux + resteAChargeMar

  // Marge sous le plafond
  const margeResiduelle = Math.max(0, plafondHT - projectCostHT)
  const aidePotentielle = Math.round(margeResiduelle * taux)

  const jumps = getClassJump(classInitiale, classCible)

  return {
    mode,
    modeLabel: funding.label,
    beneficiaryType: 'pp_occupant',
    incomeProfile,
    classInitiale,
    classCible,
    jumps,
    plafondHT,
    taux,
    ecretementRate,
    depenseEligible,
    aideBase,
    sortiePassoire,
    primeSortiePassoire,
    aideAvantEcretement,
    plafondEcretement,
    aideFinale,
    // MAR séparé
    marCostTTC,
    amoTaux,
    amoMontant,
    // Totaux séparés
    aideTravaux,
    aideMar,
    totalAides,
    resteAChargeTravaux,
    resteAChargeMar,
    resteACharge,
    margeResiduelle,
    aidePotentielle,
    projectCostHT,
    projectCostTTC,
    classeEAtteignable,
  }
}

// ═══════════════════════════════════════════════════════════════════
// PROPRIÉTAIRE BAILLEUR
// ═══════════════════════════════════════════════════════════════════

export function calculateBailleur({
  classInitiale,
  classCible,
  bailleurCategory, // 'indigne' | 'securite_salubrite' | 'moyennement_degrade'
  surface,
  projectCostHT,
  projectCostTTC,
  incomeProfile = 'Bleu',
  marCostTTC = 2000,
}) {
  const cat = BAILLEUR_CATEGORIES.find((c) => c.value === bailleurCategory)
  if (!cat) {
    return { totalAides: 0, resteACharge: projectCostTTC, resteAChargeTravaux: projectCostTTC, resteAChargeMar: 0 }
  }

  const surfaceEligible = Math.min(surface, cat.surfaceMax)
  const plafondHT = cat.prixM2 * surfaceEligible
  const depenseEligible = Math.min(projectCostHT, plafondHT)
  const aideBase = Math.round(depenseEligible * cat.taux)

  // Prime sortie passoire
  const sortiePassoire = isSortiePassoire(classInitiale, classCible)
  const primePassoire = sortiePassoire
    ? (isPassoire(classInitiale) ? cat.primeSortiePassoire.passoire : cat.primeSortiePassoire.standard)
    : 0

  const aideAvantEcretement = aideBase + primePassoire

  // Écrêtement
  const plafondEcretement = Math.round(projectCostTTC * cat.ecretement)
  const aideFinale = Math.min(aideAvantEcretement, plafondEcretement)

  // AMO — Mon Accompagnateur Rénov'
  const amoTaux = AMO.taux[incomeProfile] || 0
  const amoDepenseEligible = Math.min(marCostTTC, AMO.plafondTTC)
  const amoMontant = Math.round(amoDepenseEligible * amoTaux)

  // Totaux séparés
  const aideTravaux = aideFinale
  const aideMar = amoMontant
  const totalAides = aideTravaux + aideMar

  const resteAChargeTravaux = Math.max(0, projectCostTTC - aideTravaux)
  const resteAChargeMar = Math.max(0, marCostTTC - aideMar)
  const resteACharge = resteAChargeTravaux + resteAChargeMar

  const jumps = getClassJump(classInitiale, classCible)

  return {
    mode: 'bailleur',
    modeLabel: cat.label,
    beneficiaryType: 'pp_bailleur',
    bailleurCategory,
    classInitiale,
    classCible,
    jumps,
    surface,
    surfaceEligible,
    prixM2: cat.prixM2,
    plafondHT,
    taux: cat.taux,
    ecretementRate: cat.ecretement,
    depenseEligible,
    aideBase,
    sortiePassoire,
    primePassoire,
    aideAvantEcretement,
    plafondEcretement,
    aideFinale,
    // MAR séparé
    marCostTTC,
    amoTaux,
    amoMontant,
    // Totaux séparés
    aideTravaux,
    aideMar,
    totalAides,
    resteAChargeTravaux,
    resteAChargeMar,
    resteACharge,
    projectCostHT,
    projectCostTTC,
    classeSortieMin: cat.classeSortieMin,
  }
}
