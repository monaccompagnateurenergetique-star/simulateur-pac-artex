// MaPrimeRénov' grants for PAC Air/Eau (2024/2025)
export const MPR_GRANTS = {
  'bar-th-171': { Bleu: 5000, Jaune: 4000, Violet: 3000, Rose: 0 },
  'bar-th-113': { Bleu: 5000, Jaune: 4000, Violet: 3000, Rose: 0 },
  'bar-en-101': { Bleu: 0, Jaune: 0, Violet: 0, Rose: 0 },
  'bar-en-102': { Bleu: 75, Jaune: 60, Violet: 40, Rose: 0 }, // per m²
  'bar-en-103': { Bleu: 0, Jaune: 0, Violet: 0, Rose: 0 },
}

export const MAX_AID_PERCENTAGE = {
  Bleu: 0.90,
  Jaune: 0.75,
  Violet: 0.60,
  Rose: 0.00,
}

export const MPR_INCOME_OPTIONS = [
  { value: 'Bleu', label: 'Bleu - Très modestes (90% max)' },
  { value: 'Jaune', label: 'Jaune - Modestes (75% max)' },
  { value: 'Violet', label: 'Violet - Intermédiaires (60% max)' },
  { value: 'Rose', label: 'Rose - Supérieurs (0% max)' },
]

export const MAX_MPR_ELIGIBLE_COST = 12000
