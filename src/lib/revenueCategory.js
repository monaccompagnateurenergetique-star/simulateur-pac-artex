/**
 * Calcul automatique de la catégorie de revenus MaPrimeRénov'
 * Source : Guide ANAH février 2026 — page 8
 */

const PLAFONDS_IDF = [
  { personnes: 1, tresModeste: 24031, modeste: 29253, intermediaire: 40018 },
  { personnes: 2, tresModeste: 35270, modeste: 42923, intermediaire: 58827 },
  { personnes: 3, tresModeste: 42357, modeste: 51539, intermediaire: 70382 },
  { personnes: 4, tresModeste: 49455, modeste: 60168, intermediaire: 82839 },
  { personnes: 5, tresModeste: 56580, modeste: 68821, intermediaire: 94844 },
]
const SUPPLEMENT_IDF = { tresModeste: 7116, modeste: 8656, intermediaire: 12006 }

const PLAFONDS_AUTRES = [
  { personnes: 1, tresModeste: 17363, modeste: 22256, intermediaire: 30549 },
  { personnes: 2, tresModeste: 25393, modeste: 32565, intermediaire: 44907 },
  { personnes: 3, tresModeste: 30540, modeste: 39147, intermediaire: 54071 },
  { personnes: 4, tresModeste: 35676, modeste: 45727, intermediaire: 63235 },
  { personnes: 5, tresModeste: 40835, modeste: 52338, intermediaire: 72400 },
]
const SUPPLEMENT_AUTRES = { tresModeste: 5148, modeste: 6594, intermediaire: 9165 }

function getPlafonds(personnes, isIDF) {
  const table = isIDF ? PLAFONDS_IDF : PLAFONDS_AUTRES
  const supplement = isIDF ? SUPPLEMENT_IDF : SUPPLEMENT_AUTRES

  if (personnes <= 5) {
    return table[personnes - 1]
  }

  const base = table[4] // 5 personnes
  const extra = personnes - 5
  return {
    tresModeste: base.tresModeste + extra * supplement.tresModeste,
    modeste: base.modeste + extra * supplement.modeste,
    intermediaire: base.intermediaire + extra * supplement.intermediaire,
  }
}

/**
 * Détermine la catégorie de revenus MPR
 * @param {number} rfr - Revenu fiscal de référence
 * @param {number} personnes - Nombre de personnes au foyer
 * @param {boolean} isIDF - true si Île-de-France
 * @returns {{ category: string, label: string, color: string }}
 */
export function getRevenueCategory(rfr, personnes, isIDF) {
  if (!rfr || !personnes || personnes < 1) return null

  const plafonds = getPlafonds(personnes, isIDF)

  if (rfr <= plafonds.tresModeste) {
    return { category: 'Bleu', label: 'Très modestes', color: 'blue' }
  }
  if (rfr <= plafonds.modeste) {
    return { category: 'Jaune', label: 'Modestes', color: 'yellow' }
  }
  if (rfr <= plafonds.intermediaire) {
    return { category: 'Violet', label: 'Intermédiaires', color: 'purple' }
  }
  return { category: 'Rose', label: 'Supérieurs', color: 'pink' }
}
