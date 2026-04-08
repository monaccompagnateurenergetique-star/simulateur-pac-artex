/**
 * BAR-TH-179 — Pompe à chaleur collective de type air/eau
 * Installation d'une PAC collective en remplacement d'un système collectif existant
 * Source : fiche BAR-TH-179 vA75-1 à compter du 01/01/2026
 * Durée de vie conventionnelle : 22 ans
 * Puissance PAC ≤ 400 kW
 */
export const BAR_TH_179 = {
  code: 'BAR-TH-179',
  title: 'PAC collective air/eau',
  description: 'Pompe à chaleur collective en résidentiel existant',
  dureeVie: 22,

  // ─── Montants forfaitaires par logement (kWhc cumac) ───
  // Clé : usage → classe ETAS → zone
  FORFAITS: {
    chauffage: {
      '111-126': { H1: 100000, H2: 84000, H3: 60000 },
      '126-150': { H1: 107000, H2: 89000, H3: 64000 },
      '150-175': { H1: 112000, H2: 93000, H3: 67000 },
      '175-190': { H1: 115000, H2: 96000, H3: 69000 },
      '190+':    { H1: 117000, H2: 97000, H3: 70000 },
    },
    chauffage_ecs: {
      '111-126': { H1: 146000, H2: 127000, H3: 100000 },
      '126-150': { H1: 155000, H2: 135000, H3: 107000 },
      '150-175': { H1: 163000, H2: 142000, H3: 112000 },
      '175-190': { H1: 167000, H2: 146000, H3: 115000 },
      '190+':    { H1: 170000, H2: 148000, H3: 117000 },
    },
  },

  // ─── Classes ETAS ───
  ETAS_OPTIONS: [
    { value: '190+',    label: 'ETAS ≥ 190%' },
    { value: '175-190', label: '175% ≤ ETAS < 190%' },
    { value: '150-175', label: '150% ≤ ETAS < 175%' },
    { value: '126-150', label: '126% ≤ ETAS < 150%' },
    { value: '111-126', label: '111% ≤ ETAS < 126%' },
  ],

  // ─── Usage de la PAC ───
  USAGE_OPTIONS: [
    { value: 'chauffage_ecs', label: 'Chauffage + ECS' },
    { value: 'chauffage', label: 'Chauffage seul' },
  ],

  // ─── Coup de Pouce Chauffage collectif résidentiel ───
  // x3 sur le volume CEE quand on remplace une chaudière fossile
  COUP_DE_POUCE: {
    eligible: ['gaz', 'fioul', 'charbon'],
    multiplicateur: 3,
  },

  // ─── Prix CEE par type de ménage (€/MWhc cumac) ───
  // La précarité se traduit par un prix de rachat plus élevé, pas un volume doublé
  PRIX_MWHC: {
    classique: 7,   // €/MWhc pour ménages classiques
    precaire: 12,   // €/MWhc pour ménages précaires (modestes/très modestes)
  },

  // Types de chauffage existant (pour coup de pouce)
  CHAUFFAGE_EXISTANT_OPTIONS: [
    { value: 'gaz', label: 'Chaudière gaz collective', coupDePouce: true },
    { value: 'fioul', label: 'Chaudière fioul collective', coupDePouce: true },
    { value: 'charbon', label: 'Chauffage charbon collectif', coupDePouce: true },
    { value: 'electrique', label: 'Chauffage électrique collectif', coupDePouce: false },
    { value: 'reseau', label: 'Réseau de chaleur', coupDePouce: false },
    { value: 'autre', label: 'Autre', coupDePouce: false },
  ],
}
