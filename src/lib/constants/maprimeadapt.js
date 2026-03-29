/**
 * MaPrimeAdapt' — Aide a l'adaptation du logement a la perte d'autonomie
 * Donnees basees sur le guide ANAH (pages 57-60)
 */

// Criteres d'eligibilite
export const ELIGIBILITY_PROFILES = [
  { value: '70plus', label: '70 ans et plus' },
  { value: '60_69_gir', label: '60-69 ans avec GIR (perte d\'autonomie)' },
  { value: 'handicap', label: 'Handicap (taux >= 50% ou PCH)' },
]

// Profils de revenus eligibles
export const REVENUE_PROFILES = [
  { value: 'Bleu', label: 'Bleu - Tres modestes', rate: 0.70, eligible: true },
  { value: 'Jaune', label: 'Jaune - Modestes', rate: 0.50, eligible: true },
  { value: 'Violet', label: 'Violet - Intermediaires', rate: 0, eligible: false },
  { value: 'Rose', label: 'Rose - Superieurs', rate: 0, eligible: false },
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

// Categories de travaux eligibles
export const WORK_CATEGORIES = [
  {
    id: 'salle_de_bain',
    title: 'Adaptation salle de bain',
    icon: 'Bath',
    color: 'blue',
    works: [
      { id: 'douche_plain_pied', label: 'Douche de plain-pied (remplacement baignoire/douche non adaptee)' },
      { id: 'rehaussement_wc', label: 'Rehaussement des toilettes' },
      { id: 'carrelage_antiderapant', label: 'Carrelage/revetement antiderapant' },
      { id: 'barres_appui', label: 'Barres d\'appui et mains courantes' },
    ],
  },
  {
    id: 'accessibilite',
    title: 'Accessibilite du logement',
    icon: 'DoorOpen',
    color: 'teal',
    works: [
      { id: 'rampe_acces', label: 'Rampe d\'acces' },
      { id: 'monte_escalier', label: 'Monte-escalier' },
      { id: 'ascenseur', label: 'Ascenseur' },
      { id: 'monte_personne', label: 'Monte-personne / plateforme elevatrice' },
      { id: 'circulation_interieure', label: 'Amelioration circulation interieure / elargissement passages' },
      { id: 'amenagement_piece', label: 'Amenagement d\'une piece' },
    ],
  },
  {
    id: 'autres_travaux',
    title: 'Autres travaux (y compris exterieurs)',
    icon: 'Wrench',
    color: 'emerald',
    works: [
      { id: 'piece_supplementaire', label: 'Creation piece supplementaire (limite 20 m\u00B2)' },
      { id: 'unite_vie', label: 'Creation unite de vie' },
      { id: 'meubles_pmr', label: 'Meubles pour personnes a mobilite reduite' },
      { id: 'parking', label: 'Elargissement/amenagement parking' },
      { id: 'cheminement_ext', label: 'Amenagement cheminement exterieur' },
      { id: 'volets_electriques', label: 'Installation volets roulants electriques' },
      { id: 'motorisation_volets', label: 'Motorisation volets roulants' },
    ],
  },
]

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
