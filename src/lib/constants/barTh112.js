/**
 * Constantes BAR-TH-112 — Appareil indépendant de chauffage au bois
 * Source : Fiche CEE BAR-TH-112 à compter du 01/01/2026
 * Maisons individuelles existantes > 2 ans
 * Durée de vie conventionnelle : 15 ans
 *
 * Bonification Coup de Pouce Chauffage 2026 :
 * - Revenus modestes / précaires (Bleu, Jaune) : ×5
 * - Revenus classiques (Violet, Rose) : ×4
 */

export const BAR_TH_112 = {
  code: 'BAR-TH-112',
  title: 'Appareil indépendant de chauffage au bois',
  description: 'Poêle, insert, foyer fermé ou cuisinière au bois',

  // Montants de base en kWh cumac par Etas et zone climatique
  BASE_VALUES: {
    low: {    // 66% ≤ Etas < 72%
      H1: 9400,
      H2: 7700,
      H3: 5100,
    },
    medium: { // 72% ≤ Etas < 80%
      H1: 23500,
      H2: 19300,
      H3: 12800,
    },
    high: {   // Etas ≥ 80%
      H1: 35300,
      H2: 28900,
      H3: 19200,
    },
  },

  // Options Etas pour le select
  ETAS_OPTIONS: [
    { value: 'high', label: 'Etas ≥ 80%' },
    { value: 'medium', label: '72% ≤ Etas < 80%' },
    { value: 'low', label: '66% ≤ Etas < 72%' },
  ],

  // Bonification Coup de Pouce Chauffage 2026
  BONUS_PRECARITE: {
    Bleu: 5,    // Très modestes → ×5
    Jaune: 5,   // Modestes → ×5
    Violet: 4,  // Intermédiaires → ×4
    Rose: 4,    // Supérieurs → ×4
  },

  // Types d'appareils éligibles
  APPAREIL_TYPES: [
    { value: 'poele_buches', label: 'Poêle à bûches' },
    { value: 'poele_granules', label: 'Poêle à granulés (pellets)' },
    { value: 'insert', label: 'Insert / Foyer fermé' },
    { value: 'cuisiniere', label: 'Cuisinière bois' },
  ],

  // Conditions techniques par type de combustible
  CONDITIONS: {
    buches: {
      label: 'Bois (bûches)',
      rendement: '≥ 75%',
      particules: '< 40 mg/Nm³',
      co: '< 1 500 mg/Nm³ (0,12%)',
      nox: '< 200 mg/Nm³',
    },
    granules: {
      label: 'Granulés (pellets)',
      rendement: '≥ 87%',
      particules: '< 30 mg/Nm³',
      co: '< 300 mg/Nm³ (0,02%)',
      nox: '< 200 mg/Nm³',
    },
  },

  // Normes de mesure
  NORMES: [
    'NF EN 13240 / NF EN 14785 / NF EN 15250 (poêles)',
    'NF EN 13229 (foyers fermés, inserts)',
    'NF EN 12815 (cuisinières)',
  ],
}

// MaPrimeRénov' par type d'appareil (€ forfaitaire)
export const MPR_BAR_TH_112 = {
  poele_buches:   { Bleu: 1250, Jaune: 1000, Violet: 500, Rose: 0 },
  poele_granules: { Bleu: 1250, Jaune: 1000, Violet: 500, Rose: 0 },
  insert:         { Bleu: 1250, Jaune: 750, Violet: 750, Rose: 0 },
  cuisiniere:     { Bleu: 1250, Jaune: 1000, Violet: 500, Rose: 0 },
}
