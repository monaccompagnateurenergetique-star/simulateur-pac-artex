/**
 * Constantes partagées BAR-TH-174 (maison) et BAR-TH-175 (appartement)
 * Source : Fiches CEE vA80-3 à compter du 17/01/2026
 * Source : Guide ANAH aides financières février 2026
 */

// ─── Montants unitaires CEE par nombre de sauts de classes DPE ───
export const MONTANT_UNITAIRE = {
  2: 360200,  // kWh cumac
  3: 447900,
  4: 568600,  // 4 sauts ou plus
}

// ─── Facteurs correctifs de surface habitable (Shab) ───
export const SURFACE_FACTORS = [
  { max: 35,  factor: 0.4 },
  { max: 60,  factor: 0.5 },
  { max: 90,  factor: 0.8 },
  { max: 110, factor: 1.0 },
  { max: 130, factor: 1.2 },
  { max: Infinity, factor: 1.3 },
]

// ─── Bonus précarité (x2 pour TMO en résidence principale) ───
export const BONUS_PRECARITE = {
  Bleu: 2,    // Très modestes → x2
  Jaune: 1,
  Violet: 1,
  Rose: 1,
}

// ─── Prix de valorisation CEE par défaut (€/MWh cumac) ───
export const PRIX_CEE_DEFAUT = {
  precaire: 12,   // Ménages très modestes
  classique: 7,   // Autres ménages
}

// ─── Ordre des classes DPE (pour calculer les sauts) ───
export const CLASS_ORDER = ['G', 'F', 'E', 'D', 'C', 'B', 'A']

// ─── Classes DPE initiales ───
export const ENERGY_CLASSES = [
  { value: 'G', label: 'G (≥ 420 kWh/m².an)' },
  { value: 'F', label: 'F (331-420 kWh/m².an)' },
  { value: 'E', label: 'E (231-330 kWh/m².an)' },
  { value: 'D', label: 'D (151-230 kWh/m².an)' },
  { value: 'C', label: 'C (91-150 kWh/m².an)' },
]

// ─── Classes DPE cibles ───
export const TARGET_CLASSES = [
  { value: 'A', label: 'A (≤ 50 kWh/m².an)' },
  { value: 'B', label: 'B (51-90 kWh/m².an)' },
  { value: 'C', label: 'C (91-150 kWh/m².an)' },
  { value: 'D', label: 'D (151-230 kWh/m².an)' },
]

// ─── Catégories de travaux (min 2 requises) ───
export const WORK_CATEGORIES_MAISON = [
  { value: 'murs_iti', label: 'Isolation des murs (ITI) — R ≥ 3.7' },
  { value: 'murs_ite', label: 'Isolation des murs (ITE) — R ≥ 4.4' },
  { value: 'plancher', label: 'Isolation du plancher bas — R ≥ 3' },
  { value: 'combles', label: 'Isolation combles perdus — R ≥ 7' },
  { value: 'rampants', label: 'Isolation rampants de toiture — R ≥ 6' },
  { value: 'toiture_terrasse', label: 'Isolation toiture-terrasse — R ≥ 6.5' },
  { value: 'menuiseries', label: 'Remplacement des menuiseries' },
]

export const WORK_CATEGORIES_APPART = [
  { value: 'murs_iti', label: 'Isolation des murs (ITI) — R ≥ 3.7' },
  { value: 'murs_ite', label: 'Isolation des murs (ITE) — R ≥ 4.4' },
  { value: 'plancher', label: 'Isolation du plancher bas — R ≥ 3' },
  { value: 'combles', label: 'Isolation des combles — R ≥ 7' },
  { value: 'menuiseries', label: 'Remplacement des menuiseries' },
]

export const MIN_CLASS_JUMP = 2

// ═══════════════════════════════════════════════════════════════════
// MaPrimeRénov' Parcours Accompagné (DPE E, F, G uniquement)
// Source : Guide ANAH février 2026, page 24
// ═══════════════════════════════════════════════════════════════════

// Classes éligibles au Parcours Accompagné
export const CLASSES_ANAH = ['E', 'F', 'G']

// Taux de financement MPR Parcours Accompagné (% du montant HT éligible)
export const MPR_PARCOURS_TAUX = {
  Bleu: 0.80,   // Très modestes
  Jaune: 0.60,  // Modestes
  Violet: 0.45, // Intermédiaires
  Rose: 0.10,   // Supérieurs
}

// Plafonds de dépenses éligibles HT selon le nombre de sauts
export const MPR_PARCOURS_PLAFOND = {
  2: 30000,   // 2 sauts → 30 000 € HT max
  3: 40000,   // 3 sauts ou plus → 40 000 € HT max
  4: 40000,
}

// Écrêtement : plafond cumul de toutes les aides (% du TTC éligible)
export const ECRETEMENT = {
  Bleu: 1.00,   // 100%
  Jaune: 0.90,  // 90%
  Violet: 0.80, // 80%
  Rose: 0.50,   // 50%
}

// Profils revenus pour le select
export const MPR_INCOME_OPTIONS = [
  { value: 'Bleu', label: 'Bleu — Très modestes' },
  { value: 'Jaune', label: 'Jaune — Modestes' },
  { value: 'Violet', label: 'Violet — Intermédiaires' },
  { value: 'Rose', label: 'Rose — Supérieurs' },
]
