/**
 * MaPrimeAdapt' — Aide a l'adaptation du logement a la perte d'autonomie
 * Donnees basees sur le guide ANAH (pages 57-60)
 */

// Types d'occupation
export const OCCUPATION_TYPES = [
  { value: 'proprietaire', label: 'Proprietaire occupant' },
  { value: 'locataire', label: 'Locataire du parc prive' },
  { value: 'bailleur', label: 'Bailleur / SCI', eligible: false },
]

// Criteres d'eligibilite (situation du beneficiaire)
export const ELIGIBILITY_PROFILES = [
  { value: '70plus', label: '70 ans et plus', description: 'Eligible sans justificatif GIR', icon: 'user' },
  { value: '60_69_gir', label: '60-69 ans (GIR 1 a 6)', description: 'Perte d\'autonomie constatee', icon: 'heart' },
  { value: 'handicap', label: 'Handicap (taux >= 50% ou PCH)', description: 'Reconnaissance MDPH ou PCH', icon: 'shield' },
]

// Niveaux GIR (pour 60-69 ans)
export const GIR_LEVELS = [
  { value: 'gir1', label: 'GIR 1 - Dependance totale', severity: 'high', description: 'Confinement au lit, fonctions mentales tres alterees' },
  { value: 'gir2', label: 'GIR 2 - Dependance forte', severity: 'high', description: 'Fonctions mentales alterees OU grabataire lucide' },
  { value: 'gir3', label: 'GIR 3 - Dependance moyenne', severity: 'medium', description: 'Autonomie mentale, dependance corporelle partielle' },
  { value: 'gir4', label: 'GIR 4 - Dependance legere', severity: 'medium', description: 'Aide pour transferts, repas, toilette' },
  { value: 'gir5', label: 'GIR 5 - Aide ponctuelle', severity: 'low', description: 'Aide ponctuelle (repas, menage, toilette)' },
  { value: 'gir6', label: 'GIR 6 - Autonome', severity: 'low', description: 'Personne autonome pour les actes essentiels' },
]

// Types de handicap
export const HANDICAP_TYPES = [
  { value: 'taux_50_80', label: 'Taux 50-79% (MDPH)', description: 'Incapacite reconnue entre 50 et 79%' },
  { value: 'taux_80plus', label: 'Taux >= 80% (MDPH)', description: 'Incapacite reconnue 80% et plus' },
  { value: 'pch', label: 'Beneficiaire PCH', description: 'Prestation de Compensation du Handicap' },
]

// Profils de revenus eligibles
export const REVENUE_PROFILES = [
  { value: 'Bleu', label: 'Bleu - Tres modestes', rate: 0.70, eligible: true, color: 'blue' },
  { value: 'Jaune', label: 'Jaune - Modestes', rate: 0.50, eligible: true, color: 'yellow' },
  { value: 'Violet', label: 'Violet - Intermediaires', rate: 0, eligible: false, color: 'violet' },
  { value: 'Rose', label: 'Rose - Superieurs', rate: 0, eligible: false, color: 'rose' },
]

// Taux de financement par profil
export const FUNDING_RATES = {
  Bleu: 0.70,   // 70%
  Jaune: 0.50,  // 50%
  Violet: 0,
  Rose: 0,
}

// Plafond de depenses eligibles
export const EXPENSE_CEILING = 22000 // euros HT

// Accompagnement AMO (obligatoire, pris en charge par l'ANAH)
export const AMO_OPTIONS = [
  { value: 'complet', label: 'Complet', cost: 600, description: 'Accompagnement complet' },
  { value: 'complet_ergo', label: 'Complet + Ergotherapie', cost: 800, description: 'Accompagnement complet avec rapport d\'ergotherapie' },
]

// Tags pour le filtrage des travaux
// 'all' = visible pour tous les profils
// 'gir_high' = GIR 1-2 (dependance forte)
// 'gir_medium' = GIR 3-4
// 'gir_low' = GIR 5-6
// 'handicap_heavy' = handicap >= 80% ou PCH
// 'handicap_light' = handicap 50-79%
// 'senior' = 70+

// Categories de travaux eligibles avec filtrage par profil
export const WORK_CATEGORIES = [
  {
    id: 'salle_de_bain',
    title: 'Adaptation salle de bain',
    icon: 'Bath',
    color: 'blue',
    works: [
      { id: 'douche_plain_pied', label: 'Douche de plain-pied (remplacement baignoire/douche non adaptee)', tags: ['all'] },
      { id: 'rehaussement_wc', label: 'Rehaussement des toilettes', tags: ['all'] },
      { id: 'carrelage_antiderapant', label: 'Carrelage/revetement antiderapant', tags: ['all'] },
      { id: 'barres_appui', label: 'Barres d\'appui et mains courantes', tags: ['all'] },
      { id: 'siege_douche', label: 'Siege de douche mural / rabattable', tags: ['gir_high', 'gir_medium', 'handicap_heavy'] },
      { id: 'lavabo_pmr', label: 'Lavabo PMR a hauteur reglable', tags: ['handicap_heavy', 'handicap_light', 'gir_high'] },
    ],
  },
  {
    id: 'accessibilite',
    title: 'Accessibilite du logement',
    icon: 'DoorOpen',
    color: 'teal',
    works: [
      { id: 'rampe_acces', label: 'Rampe d\'acces', tags: ['all'] },
      { id: 'monte_escalier', label: 'Monte-escalier', tags: ['gir_high', 'gir_medium', 'handicap_heavy', 'senior'] },
      { id: 'ascenseur', label: 'Ascenseur', tags: ['gir_high', 'gir_medium', 'handicap_heavy'] },
      { id: 'monte_personne', label: 'Monte-personne / plateforme elevatrice', tags: ['gir_high', 'handicap_heavy'] },
      { id: 'circulation_interieure', label: 'Elargissement portes / couloirs (> 90 cm)', tags: ['handicap_heavy', 'handicap_light', 'gir_high', 'gir_medium'] },
      { id: 'amenagement_piece', label: 'Amenagement d\'une piece (chambre en RDC, etc.)', tags: ['all'] },
      { id: 'seuils_portes', label: 'Suppression seuils de portes', tags: ['all'] },
      { id: 'eclairage_auto', label: 'Eclairage automatique (detecteur de mouvement)', tags: ['senior', 'gir_medium', 'gir_low'] },
    ],
  },
  {
    id: 'securite',
    title: 'Securite et confort',
    icon: 'ShieldCheck',
    color: 'amber',
    works: [
      { id: 'nez_marche', label: 'Nez de marche antiderapant', tags: ['all'] },
      { id: 'main_courante', label: 'Main courante d\'escalier renforcee', tags: ['all'] },
      { id: 'detecteur_chute', label: 'Systeme de detection de chute / teleassistance', tags: ['gir_high', 'gir_medium', 'senior'] },
      { id: 'chemin_lumineux', label: 'Chemin lumineux nocturne', tags: ['senior', 'gir_medium', 'gir_low'] },
      { id: 'robinetterie_thermo', label: 'Robinetterie thermostatique (anti-brulure)', tags: ['gir_high', 'gir_medium', 'senior'] },
    ],
  },
  {
    id: 'autres_travaux',
    title: 'Autres travaux (y compris exterieurs)',
    icon: 'Wrench',
    color: 'emerald',
    works: [
      { id: 'piece_supplementaire', label: 'Creation piece supplementaire (limite 20 m\u00B2)', tags: ['gir_high', 'gir_medium', 'handicap_heavy'] },
      { id: 'unite_vie', label: 'Creation unite de vie', tags: ['gir_high', 'gir_medium', 'handicap_heavy'] },
      { id: 'meubles_pmr', label: 'Meubles pour personnes a mobilite reduite', tags: ['handicap_heavy', 'handicap_light'] },
      { id: 'parking', label: 'Elargissement/amenagement parking', tags: ['handicap_heavy', 'handicap_light'] },
      { id: 'cheminement_ext', label: 'Amenagement cheminement exterieur', tags: ['all'] },
      { id: 'volets_electriques', label: 'Installation volets roulants electriques', tags: ['all'] },
      { id: 'motorisation_volets', label: 'Motorisation volets roulants', tags: ['all'] },
      { id: 'domotique', label: 'Domotique / commandes a distance', tags: ['gir_high', 'gir_medium', 'handicap_heavy'] },
    ],
  },
]

// Correspondance profil -> tags actifs
export function getActiveTags(eligibility, girLevel, handicapType) {
  const tags = new Set(['all'])

  if (eligibility === '70plus') {
    tags.add('senior')
    // Les 70+ ont aussi acces aux travaux GIR legers
    tags.add('gir_low')
    tags.add('gir_medium')
  }

  if (eligibility === '60_69_gir' && girLevel) {
    if (girLevel === 'gir1' || girLevel === 'gir2') {
      tags.add('gir_high')
      tags.add('gir_medium')
      tags.add('gir_low')
    } else if (girLevel === 'gir3' || girLevel === 'gir4') {
      tags.add('gir_medium')
      tags.add('gir_low')
    } else {
      tags.add('gir_low')
    }
  }

  if (eligibility === 'handicap' && handicapType) {
    if (handicapType === 'taux_80plus' || handicapType === 'pch') {
      tags.add('handicap_heavy')
      tags.add('handicap_light')
    } else {
      tags.add('handicap_light')
    }
  }

  return tags
}

// Filtre les travaux en fonction des tags actifs
export function filterWorks(categories, activeTags) {
  return categories.map(cat => ({
    ...cat,
    works: cat.works.filter(w =>
      w.tags.some(tag => activeTags.has(tag))
    ),
  })).filter(cat => cat.works.length > 0)
}

// Cumuls possibles
export const CUMUL_INFO = [
  'MaPrimeRenov\' (renovation energetique) - plafonds de depenses distincts',
  'Ma Prime Logement Decent - plafonds de depenses distincts',
]

// Beneficiaires eligibles
export const ELIGIBLE_OCCUPANTS = [
  'Proprietaires occupants',
  'Locataires du parc prive',
]
