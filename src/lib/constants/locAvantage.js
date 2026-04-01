/**
 * Constantes Loc'Avantages — Dispositif ANAH
 * Source : Guide ANAH Aides financières 2026
 *
 * Convention avec l'Anah : le bailleur s'engage à louer
 * à un loyer inférieur au marché pendant 6 ans minimum.
 *
 * 3 niveaux de convention :
 * - Loc 1 (intermédiaire) : décote faible
 * - Loc 2 (social) : décote moyenne
 * - Loc 3 (très social) : décote forte, intermédiation obligatoire
 */

export const LOC_AVANTAGE = {
  code: 'LOC-AVANTAGE',
  title: "Loc'Avantages — Convention ANAH",

  // ──────────────────────────────────────────────
  // RÉDUCTION D'IMPÔT sur les revenus bruts fonciers
  // ──────────────────────────────────────────────
  TAX_REDUCTION: {
    dureeEngagement: 6, // ans minimum
    // Sans intermédiation locative
    sansIntermediation: {
      Loc1: 15,
      Loc2: 35,
      Loc3: null, // Intermédiation OBLIGATOIRE pour Loc3
    },
    // Avec intermédiation locative (agence agréée / association)
    avecIntermediation: {
      Loc1: 20,
      Loc2: 40,
      Loc3: 65,
    },
  },

  // ──────────────────────────────────────────────
  // SUBVENTION ANAH POUR TRAVAUX
  // ──────────────────────────────────────────────
  WORK_TYPES: [
    {
      value: 'amelioration',
      label: "Travaux d'amélioration",
      description: 'Mise aux normes, confort, performance énergétique',
      tauxSubvention: 0.25,   // 25%
      plafondM2: 750,         // €/m²
      plafondTotal: 60000,    // € par logement
    },
    {
      value: 'lourds',
      label: 'Travaux lourds (dégradation importante)',
      description: 'Réhabilitation lourde, insalubrité, péril',
      tauxSubvention: 0.35,   // 35%
      plafondM2: 1000,        // €/m²
      plafondTotal: 80000,    // € par logement
    },
    {
      value: 'energie',
      label: "Performance énergétique seule",
      description: 'Travaux visant un gain énergétique de 35% min.',
      tauxSubvention: 0.25,   // 25%
      plafondM2: 500,         // €/m²
      plafondTotal: 30000,    // € par logement
    },
  ],

  // ──────────────────────────────────────────────
  // PRIME D'INTERMÉDIATION LOCATIVE
  // ──────────────────────────────────────────────
  PRIME_INTERMEDIATION: {
    mandatGestion: 1000,       // € par logement
    locationSousLocation: 3000, // € par logement
  },

  // ──────────────────────────────────────────────
  // NIVEAUX DE LOCATION (convention)
  // ──────────────────────────────────────────────
  RENTAL_LEVELS: [
    {
      value: 'Loc1',
      label: 'Loc 1 — Intermédiaire',
      description: 'Loyer inférieur au marché (décote faible)',
      decoteLabel: 'Décote modérée vs marché',
      intermediationObligatoire: false,
    },
    {
      value: 'Loc2',
      label: 'Loc 2 — Social',
      description: 'Loyer social (décote moyenne)',
      decoteLabel: 'Décote significative vs marché',
      intermediationObligatoire: false,
    },
    {
      value: 'Loc3',
      label: 'Loc 3 — Très social',
      description: 'Loyer très social (forte décote)',
      decoteLabel: 'Forte décote vs marché',
      intermediationObligatoire: true,
    },
  ],

  // ──────────────────────────────────────────────
  // LOYERS PLAFONDS par zone (€/m²/mois)
  // Valeurs indicatives 2026
  // ──────────────────────────────────────────────
  LOYERS_PLAFONDS: {
    Loc1: { Abis: 18.89, A: 14.03, B1: 11.31, B2: 9.83, C: 9.83 },
    Loc2: { Abis: 14.77, A: 10.97, B1: 9.49,  B2: 9.22, C: 9.22 },
    Loc3: { Abis: 9.57,  A: 7.30,  B1: 6.34,  B2: 6.17, C: 6.17 },
  },

  // Loyers de marché indicatifs (€/m²/mois) pour comparaison
  LOYERS_MARCHE: {
    Abis: 28.00, A: 17.00, B1: 12.50, B2: 10.50, C: 9.00,
  },

  // ──────────────────────────────────────────────
  // ZONES GÉOGRAPHIQUES
  // ──────────────────────────────────────────────
  ZONES: [
    { value: 'Abis', label: 'Zone Abis — Paris et communes limitrophes' },
    { value: 'A', label: 'Zone A — Grandes agglomérations (> 250 000 hab.)' },
    { value: 'B1', label: 'Zone B1 — Agglomérations de 50 000 à 250 000 hab.' },
    { value: 'B2', label: 'Zone B2 — Autres communes > 50 000 hab.' },
    { value: 'C', label: 'Zone C — Reste du territoire' },
  ],

  // Coefficient de pondération de surface
  // S pondérée = min(S, 38) + (S - 38) × 0.5 si S > 38
  SURFACE_PONDEREE_SEUIL: 38,

  // ──────────────────────────────────────────────
  // CATÉGORIES DE TRAVAUX ÉLIGIBLES (détail)
  // ──────────────────────────────────────────────
  ELIGIBLE_WORKS: [
    'Isolation thermique (murs, combles, toiture, planchers)',
    'Remplacement fenêtres / menuiseries',
    'Installation ou remplacement système de chauffage',
    'Installation ou remplacement production ECS',
    'Ventilation mécanique',
    'Mise aux normes électricité / plomberie',
    'Réfection toiture',
    'Traitement humidité / étanchéité',
    "Adaptation au handicap / perte d'autonomie",
    'Mise en sécurité (plomb, amiante)',
  ],

  // ──────────────────────────────────────────────
  // CONDITIONS D'ÉLIGIBILITÉ
  // ──────────────────────────────────────────────
  CONDITIONS: [
    'Logement de plus de 15 ans',
    'Convention signée avec l\'Anah (6 ans minimum)',
    'Loyer plafonné selon le niveau de convention',
    'Locataire sous conditions de ressources (Loc2, Loc3)',
    'Logement non meublé, résidence principale du locataire',
    'Pas de location à un ascendant/descendant',
  ],
}
