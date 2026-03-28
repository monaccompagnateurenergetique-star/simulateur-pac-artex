/**
 * Constantes BAR-TH-112 — Appareil indépendant de chauffage au bois
 * Source : Fiche CEE BAR-TH-112 (v. A35.2)
 * Maisons individuelles existantes > 2 ans
 * Durée de vie conventionnelle : 15 ans
 */

export const BAR_TH_112 = {
  code: 'BAR-TH-112',
  title: 'Appareil indépendant de chauffage au bois',
  description: 'Poêle, insert, foyer fermé ou cuisinière au bois',

  // Montants forfaitaires en kWh cumac par zone climatique
  BASE_VALUES: {
    H1: 38200,
    H2: 31300,
    H3: 20900,
  },

  // Bonification précarité énergétique (appliquée au volume CEE)
  BONUS_PRECARITE: {
    Bleu: 2,    // Très modestes → ×2
    Jaune: 2,   // Modestes → ×2
    Violet: 1,  // Intermédiaires → ×1
    Rose: 1,    // Supérieurs → ×1
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
