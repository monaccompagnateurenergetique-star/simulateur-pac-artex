/**
 * Barèmes MaPrimeRénov' 2024-2026
 * Détermine la catégorie de précarité (Bleu/Jaune/Violet/Rose)
 * à partir du nombre de personnes et du RFR.
 */

const PLAFONDS_IDF = [
  { personnes: 1, bleu: 23541, jaune: 28657, violet: 40018 },
  { personnes: 2, bleu: 34551, jaune: 42058, violet: 58827 },
  { personnes: 3, bleu: 41493, jaune: 50513, violet: 70382 },
  { personnes: 4, bleu: 48447, jaune: 58981, violet: 82839 },
  { personnes: 5, bleu: 55427, jaune: 67473, violet: 94844 },
]

const PLAFONDS_PROVINCE = [
  { personnes: 1, bleu: 17009, jaune: 21805, violet: 30549 },
  { personnes: 2, bleu: 24875, jaune: 31889, violet: 44907 },
  { personnes: 3, bleu: 29917, jaune: 38349, violet: 54071 },
  { personnes: 4, bleu: 34948, jaune: 44802, violet: 63235 },
  { personnes: 5, bleu: 40002, jaune: 51281, violet: 72400 },
]

// Par personne supplémentaire au-delà de 5
const SUPPLEMENT_IDF = { bleu: 6970, jaune: 8486, violet: 12006 }
const SUPPLEMENT_PROVINCE = { bleu: 5045, jaune: 6462, violet: 9165 }

export function getPrecariteFromRFR(nbPersonnes, rfr, isIdf = false) {
  const table = isIdf ? PLAFONDS_IDF : PLAFONDS_PROVINCE
  const supplement = isIdf ? SUPPLEMENT_IDF : SUPPLEMENT_PROVINCE

  let plafonds
  if (nbPersonnes <= 5) {
    plafonds = table[nbPersonnes - 1]
  } else {
    const base = table[4] // 5 personnes
    const extra = nbPersonnes - 5
    plafonds = {
      bleu: base.bleu + extra * supplement.bleu,
      jaune: base.jaune + extra * supplement.jaune,
      violet: base.violet + extra * supplement.violet,
    }
  }

  if (rfr <= plafonds.bleu) return 'Bleu'
  if (rfr <= plafonds.jaune) return 'Jaune'
  if (rfr <= plafonds.violet) return 'Violet'
  return 'Rose'
}

export const PRECARITE_LABELS = {
  Bleu: { label: 'Très modestes', color: '#3b82f6', bg: '#eff6ff' },
  Jaune: { label: 'Modestes', color: '#eab308', bg: '#fefce8' },
  Violet: { label: 'Intermédiaires', color: '#8b5cf6', bg: '#f5f3ff' },
  Rose: { label: 'Supérieurs', color: '#ec4899', bg: '#fdf2f8' },
}
