/**
 * Constantes — Ma Prime Logement Décent
 * Source : Guide des aides financières ANAH — Février 2026 (pages 64-66)
 *
 * ═══════════════════════════════════════════════════════════════════
 * PROPRIÉTAIRES OCCUPANTS — Rénovation globale logement très dégradé
 * ═══════════════════════════════════════════════════════════════════
 *  - Plafond : 70 000 € HT
 *  - Taux : 80% (très modestes) / 60% (modestes)
 *  - Écrêtement : 100% TTC (très modestes) / 90% TTC (modestes)
 *  - Prime sortie passoire : +10%
 *  - Classe éligible : G → A, sortie minimum E
 *  - NB : si classe E non atteignable → 50% de 50 000 € HT max
 *
 * ═══════════════════════════════════════════════════════════════════
 * PROPRIÉTAIRES BAILLEURS — 3 sous-catégories (Loc'Avantage requis)
 * ═══════════════════════════════════════════════════════════════════
 *  1. Logement indigne / très dégradé : 1 000 €/m² (max 80m²), 35%, sortie D
 *  2. Sécurité & salubrité :            750 €/m² (max 80m²), 35%, sortie D
 *  3. Logement moyennement dégradé :    750 €/m² (max 80m²), 25%, sortie D
 *
 * Éligibilité : revenus très modestes ou modestes, logement > 15 ans,
 * résidence principale, audit énergétique obligatoire.
 */

// ─── Ordre des classes DPE ───
export const CLASS_ORDER = ['G', 'F', 'E', 'D', 'C', 'B', 'A']

// ─── Classes DPE ───
export const ENERGY_CLASSES = [
  { value: 'G', label: 'G (≥ 420 kWh/m².an)' },
  { value: 'F', label: 'F (331-420 kWh/m².an)' },
  { value: 'E', label: 'E (231-330 kWh/m².an)' },
  { value: 'D', label: 'D (151-230 kWh/m².an)' },
  { value: 'C', label: 'C (91-150 kWh/m².an)' },
]

export const TARGET_CLASSES = [
  { value: 'A', label: 'A (≤ 50 kWh/m².an)' },
  { value: 'B', label: 'B (51-90 kWh/m².an)' },
  { value: 'C', label: 'C (91-150 kWh/m².an)' },
  { value: 'D', label: 'D (151-230 kWh/m².an)' },
  { value: 'E', label: 'E (231-330 kWh/m².an)' },
]

// ═══════════════════════════════════════════════════════════════════
// PROPRIÉTAIRES OCCUPANTS
// ═══════════════════════════════════════════════════════════════════

export const OCCUPANT_FUNDING = {
  // Mode principal : rénovation globale logement très dégradé (classe E atteignable)
  principal: {
    label: 'Rénovation globale — Logement très dégradé',
    plafondHT: 70000,
    taux: { Bleu: 0.80, Jaune: 0.60 },
    ecretement: { Bleu: 1.00, Jaune: 0.90 },
    primeSortiePassoire: 0.10, // +10% si sortie de passoire énergétique
    classeSortieMin: 'E',
  },
  // Mode dérogatoire : si classe E non atteignable
  derogatoire: {
    label: 'Mode dérogatoire — Classe E non atteignable',
    plafondHT: 50000,
    taux: { Bleu: 0.50, Jaune: 0.50 },
    ecretement: { Bleu: 1.00, Jaune: 0.90 },
    primeSortiePassoire: 0,
    classeSortieMin: null,
  },
}

// ═══════════════════════════════════════════════════════════════════
// PROPRIÉTAIRES BAILLEURS (Loc'Avantage requis)
// ═══════════════════════════════════════════════════════════════════

export const BAILLEUR_CATEGORIES = [
  {
    value: 'indigne',
    label: 'Logement indigne ou très dégradé',
    description: 'Arrêté de mise en sécurité/insalubrité ou grille d\'évaluation ≥ 0.35 (dégradation) / ≥ 0.4 (insalubrité)',
    prixM2: 1000,
    surfaceMax: 80,
    taux: 0.35,
    ecretement: 0.90,
    primeSortiePassoire: { standard: 1500, passoire: 2000 },
    classeSortieMin: 'D',
  },
  {
    value: 'securite_salubrite',
    label: 'Sécurité et salubrité de l\'habitat',
    description: 'Arrêté, notification saturnisme, constat plomb',
    prixM2: 750,
    surfaceMax: 80,
    taux: 0.35,
    ecretement: 0.90,
    primeSortiePassoire: { standard: 1500, passoire: 2000 },
    classeSortieMin: 'D',
  },
  {
    value: 'moyennement_degrade',
    label: 'Logement moyennement dégradé',
    description: 'Dégradation "moyenne", non-conformité RSD, contrôle CAF/CMSA',
    prixM2: 750,
    surfaceMax: 80,
    taux: 0.25,
    ecretement: 0.90,
    primeSortiePassoire: { standard: 1500, passoire: 2000 },
    classeSortieMin: 'D',
  },
]

// ─── AMO (Mon Accompagnateur Rénov') ───
export const AMO = {
  plafondTTC: 2000,
  taux: { Bleu: 1.00, Jaune: 0.80 },
}

// ─── Profils de revenus ───
export const INCOME_PROFILES = [
  { value: 'Bleu', label: 'Très modestes', eligible: true },
  { value: 'Jaune', label: 'Modestes', eligible: true },
  { value: 'Violet', label: 'Intermédiaires', eligible: false },
  { value: 'Rose', label: 'Supérieurs', eligible: false },
]

// ─── Type de bénéficiaire ───
export const BENEFICIARY_TYPES = [
  { value: 'pp_occupant', label: 'Propriétaire occupant' },
  { value: 'pp_bailleur', label: 'Propriétaire bailleur (Loc\'Avantage)' },
]

// ─── Occupation du logement ───
export const OCCUPATION_TYPES = [
  { value: 'principale', label: 'Résidence principale' },
  { value: 'secondaire', label: 'Résidence secondaire' },
]

// ─── Classes considérées "passoire énergétique" (F, G) ───
export const CLASSES_PASSOIRE = ['F', 'G']

// ─── Catégories de travaux (checklist indicative) ───
export const WORK_CATEGORIES = [
  {
    group: 'securite',
    label: 'Sécurité',
    icon: '⚡',
    items: [
      { value: 'elec_mise_norme', label: 'Mise aux normes électriques', description: 'Tableau, disjoncteurs, prises, terre' },
      { value: 'gaz_securite', label: 'Sécurisation installation gaz', description: 'Conduits, raccordements, ventilation' },
      { value: 'garde_corps', label: 'Garde-corps / rambardes', description: 'Balcons, escaliers, terrasses' },
      { value: 'detecteurs', label: 'Détecteurs fumée / CO', description: 'Mise en conformité détection incendie' },
    ],
  },
  {
    group: 'salubrite',
    label: 'Salubrité',
    icon: '💧',
    items: [
      { value: 'humidite', label: 'Traitement humidité', description: 'Infiltrations, remontées capillaires, condensation' },
      { value: 'ventilation', label: 'Ventilation / aération', description: 'VMC, bouches d\'aération, déshumidification' },
      { value: 'plomb', label: 'Traitement plomb (peintures)', description: 'Décapage, recouvrement, remplacement' },
      { value: 'amiante', label: 'Désamiantage', description: 'Retrait ou encapsulage de matériaux amiantés' },
      { value: 'insalubrite', label: 'Remise en état (insalubrité)', description: 'Nettoyage, désinfection, mise en propreté' },
    ],
  },
  {
    group: 'structure',
    label: 'Structure & Gros oeuvre',
    icon: '🏗️',
    items: [
      { value: 'toiture', label: 'Réfection de toiture', description: 'Charpente, couverture, zinguerie, étanchéité' },
      { value: 'facade', label: 'Ravalement de façade', description: 'Enduit, bardage, traitement des fissures' },
      { value: 'fondations', label: 'Reprise de fondations', description: 'Consolidation, injection, micropieux' },
      { value: 'plancher', label: 'Reprise de plancher', description: 'Remplacement, renforcement structure porteuse' },
      { value: 'murs_porteurs', label: 'Consolidation murs porteurs', description: 'Reprise structurelle, chaînages' },
      { value: 'cheminee', label: 'Réparation conduit de cheminée', description: 'Tubage, étanchéité, ramonage sécuritaire' },
    ],
  },
  {
    group: 'energie',
    label: 'Rénovation énergétique',
    icon: '🔥',
    note: 'Entreprise RGE obligatoire',
    items: [
      { value: 'isolation_murs', label: 'Isolation des murs', description: 'ITE ou ITI' },
      { value: 'isolation_combles', label: 'Isolation combles / toiture', description: 'Combles perdus, rampants' },
      { value: 'isolation_plancher', label: 'Isolation plancher bas', description: 'Plancher sur local non chauffé' },
      { value: 'menuiseries', label: 'Remplacement menuiseries', description: 'Fenêtres, portes-fenêtres, volets' },
      { value: 'chauffage', label: 'Remplacement chauffage', description: 'PAC, chaudière biomasse (hors gaz depuis 2025)' },
      { value: 'vmc', label: 'Ventilation mécanique', description: 'VMC simple ou double flux' },
      { value: 'ecs', label: 'Eau chaude sanitaire', description: 'Ballon thermodynamique, solaire' },
    ],
  },
  {
    group: 'reseaux',
    label: 'Réseaux & Équipements',
    icon: '🔧',
    items: [
      { value: 'plomberie', label: 'Réfection plomberie', description: 'Canalisations, alimentation eau, évacuations' },
      { value: 'assainissement', label: 'Assainissement', description: 'Fosse septique, raccordement tout-à-l\'égout' },
      { value: 'eau_chaude_sanitaire', label: 'Production eau chaude', description: 'Ballon, cumulus, chauffe-eau' },
    ],
  },
  {
    group: 'autres',
    label: 'Autres travaux',
    icon: '📋',
    freeInput: true,
    items: [],
  },
]

// ─── Taux de TVA ───
export const TVA_RATES = [
  { value: 5.5, label: '5,5% (rénovation énergétique)' },
  { value: 10, label: '10% (travaux d\'amélioration)' },
  { value: 20, label: '20% (taux normal)' },
]

/**
 * Détermine l'éligibilité au programme Ma Prime Logement Décent
 */
export function getEligibility(beneficiaryType, occupation, incomeProfile) {
  const profile = INCOME_PROFILES.find((p) => p.value === incomeProfile)

  if (occupation === 'secondaire') {
    return {
      eligible: false,
      reason: 'Ma Prime Logement Décent est réservée aux résidences principales (occupation ≥ 3 ans après travaux).',
      alert: 'error',
    }
  }

  if (!profile?.eligible) {
    return {
      eligible: false,
      reason: `Le programme est réservé aux ménages très modestes (Bleu) et modestes (Jaune). Le profil « ${profile?.label || incomeProfile} » n'est pas éligible.`,
      alert: 'error',
    }
  }

  if (beneficiaryType === 'pp_bailleur') {
    return {
      eligible: true,
      reason: 'Propriétaire bailleur éligible sous réserve d\'un conventionnement Loc\'Avantage avec l\'ANAH (loyer plafonné, locataire aux revenus modestes, durée 6 ans minimum). Classe de sortie minimum : D.',
      alert: 'warning',
    }
  }

  return {
    eligible: true,
    reason: `Propriétaire occupant éligible — Profil ${profile.label}. Logement de + de 15 ans, résidence principale, audit énergétique obligatoire.`,
    alert: 'success',
  }
}
