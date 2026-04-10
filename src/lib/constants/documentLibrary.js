/**
 * BIBLIOTHEQUE DE DOCUMENTS — Source de verite
 *
 * Liste maitresse de tous les documents justificatifs utilises
 * dans les dossiers CEE / MaPrimeRenov' / Anah Reno Ampleur.
 *
 * Chaque document a :
 *  - id           : identifiant technique unique
 *  - label        : nom affiche
 *  - description  : aide / contexte
 *  - phase        : 'avant' | 'apres' | 'both'
 *  - tags         : ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR']
 *  - source       : 'client' (a fournir par le beneficiaire)
 *                 | 'pro'    (a fournir par l'installateur)
 *                 | 'generated' (genere automatiquement par l'app)
 *  - mandatory    : true si obligatoire pour ce dispositif
 *  - precarity    : null | ['tres_modeste','modeste','intermediaire','superieur']
 *                   (si non null, document requis uniquement pour ces categories)
 *  - expirable    : true si le document a une date d'expiration (RGE, avis impots...)
 */

export const DOCUMENT_LIBRARY = [
  // ─── PIECES BENEFICIAIRE (avant travaux) ─────────────────────
  {
    id: 'identite_demandeur',
    label: "Pièce d'identité du demandeur",
    description: 'Recto/verso, en cours de validité (CNI, passeport, titre de séjour)',
    phase: 'avant',
    tags: ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'identite_conjoint',
    label: "Pièce d'identité du conjoint",
    description: 'Recto/verso si couple marié ou pacsé sur l\'avis d\'imposition',
    phase: 'avant',
    tags: ['MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: false,
    precarity: null,
    expirable: false,
  },
  {
    id: 'avis_imposition',
    label: "Avis d'imposition N-1",
    description: 'Toutes les pages, même vierges. Avis de l\'année dernière sur revenus N-2',
    phase: 'avant',
    tags: ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: true,
    precarity: ['tres_modeste', 'modeste', 'intermediaire', 'superieur'],
    expirable: true,
  },
  {
    id: 'taxe_fonciere',
    label: 'Taxe foncière ou acte notarié',
    description: 'Justificatif de propriété. Si acquisition récente, attestation notariée',
    phase: 'avant',
    tags: ['MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'justificatif_domicile',
    label: 'Justificatif de domicile',
    description: 'Facture de moins de 3 mois (énergie, eau, télécom)',
    phase: 'avant',
    tags: ['CEE'],
    source: 'client',
    mandatory: true,
    precarity: null,
    expirable: true,
  },
  {
    id: 'rib',
    label: 'RIB du bénéficiaire',
    description: 'Pour le versement de l\'aide. Au nom du demandeur',
    phase: 'avant',
    tags: ['MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'dpe_audit',
    label: 'DPE ou Audit énergétique',
    description: 'Diagnostic existant ou audit réglementaire (obligatoire pour Anah/Reno Ampleur)',
    phase: 'avant',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: true,
    precarity: null,
    expirable: true,
  },

  // ─── DOCUMENTS PROJET / CHANTIER (avant travaux) ─────────────
  {
    id: 'devis_signe',
    label: 'Devis signé',
    description: 'Devis détaillé signé par le bénéficiaire avec mentions CEE obligatoires',
    phase: 'avant',
    tags: ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'pro',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'cadre_contribution',
    label: 'Cadre de contribution CEE',
    description: 'Document signé en amont du devis (date antérieure obligatoire). Généré par la plateforme',
    phase: 'avant',
    tags: ['CEE'],
    source: 'generated',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'mandat_mpr',
    label: 'Mandat MaPrimeRénov\'',
    description: 'Mandat de représentation signé pour le dépôt MPR / Anah',
    phase: 'avant',
    tags: ['MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'generated',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'contrat_mar',
    label: 'Contrat MAR (Mon Accompagnateur Rénov\')',
    description: 'Contrat signé avec l\'accompagnateur agréé Anah',
    phase: 'avant',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'plan_financement',
    label: 'Plan de financement',
    description: 'Détail CEE + MPR + reste à charge + apport personnel + prêt éventuel',
    phase: 'avant',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'generated',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'demande_avance',
    label: 'Demande d\'avance Anah',
    description: 'Document signé pour percevoir une avance sur l\'aide Anah',
    phase: 'avant',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'generated',
    mandatory: false,
    precarity: ['tres_modeste', 'modeste'],
    expirable: false,
  },
  {
    id: 'engagement_complementaire',
    label: 'Engagement complémentaire bénéficiaire',
    description: 'Engagements spécifiques Anah (non revente, occupation principale...)',
    phase: 'avant',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'certificat_rge',
    label: 'Certificat RGE entreprise',
    description: 'Valide à la date de signature du devis (QualiPAC, QualiSol, QualiVentil...)',
    phase: 'avant',
    tags: ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'pro',
    mandatory: true,
    precarity: null,
    expirable: true,
  },
  {
    id: 'devis_sous_traitant',
    label: 'Devis sous-traitant (multi-lots)',
    description: 'Devis des entreprises partenaires pour les lots non réalisés en interne',
    phase: 'avant',
    tags: ['RENO_AMPLEUR'],
    source: 'pro',
    mandatory: false,
    precarity: null,
    expirable: false,
  },

  // ─── PHOTOS ET PREUVES (avant + après) ───────────────────────
  {
    id: 'photo_avant',
    label: 'Photos avant travaux',
    description: 'Vues d\'ensemble + détails de l\'existant à remplacer',
    phase: 'avant',
    tags: ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'pro',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'photo_apres',
    label: 'Photos après travaux',
    description: 'Vues d\'ensemble + détails de l\'installation finalisée',
    phase: 'apres',
    tags: ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'pro',
    mandatory: true,
    precarity: null,
    expirable: false,
  },

  // ─── APRES TRAVAUX ───────────────────────────────────────────
  {
    id: 'facture_acquittee',
    label: 'Facture acquittée',
    description: 'Facture détaillée des travaux réalisés, mention "acquittée le ..."',
    phase: 'apres',
    tags: ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR'],
    source: 'pro',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'pv_reception',
    label: 'PV de réception des travaux',
    description: 'Procès-verbal signé bénéficiaire + installateur',
    phase: 'apres',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'pro',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'attestation_honneur_cee',
    label: "Attestation sur l'honneur CEE",
    description: 'Document généré par la plateforme, à signer après travaux par bénéficiaire et installateur',
    phase: 'apres',
    tags: ['CEE'],
    source: 'generated',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'dpe_apres',
    label: 'DPE après travaux',
    description: 'Nouveau DPE post-travaux (obligatoire pour Reno Ampleur, justifie le saut de classe)',
    phase: 'apres',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'pro',
    mandatory: true,
    precarity: null,
    expirable: false,
  },
  {
    id: 'notification_anah',
    label: 'Notification d\'octroi Anah',
    description: 'Lettre d\'acceptation reçue après dépôt du dossier sur monprojet.anah.gouv.fr',
    phase: 'apres',
    tags: ['ANAH', 'RENO_AMPLEUR'],
    source: 'client',
    mandatory: false,
    precarity: null,
    expirable: false,
  },
]

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

export const PHASES = {
  avant: { label: 'Avant travaux', short: 'Avant' },
  apres: { label: 'Après travaux', short: 'Après' },
  both: { label: 'Toutes les phases', short: 'Les deux' },
}

export const TAG_LABELS = {
  CEE: 'CEE',
  MPR: 'MaPrimeRénov\'',
  ANAH: 'Anah',
  RENO_AMPLEUR: 'Rénov. Ampleur',
}

export const TAG_COLORS = {
  CEE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MPR: 'bg-sky-100 text-sky-700 border-sky-200',
  ANAH: 'bg-violet-100 text-violet-700 border-violet-200',
  RENO_AMPLEUR: 'bg-amber-100 text-amber-700 border-amber-200',
}

export const PRECARITY_LABELS = {
  tres_modeste: 'Très modestes',
  modeste: 'Modestes',
  intermediaire: 'Intermédiaires',
  superieur: 'Supérieurs',
}

export const SOURCE_LABELS = {
  client: 'À fournir par le client',
  pro: 'À fournir par l\'installateur',
  generated: 'Généré par la plateforme',
}

/**
 * Retourne les documents requis pour un dispositif donné, filtres par phase et precarite
 *
 * @param {Object} options
 * @param {string[]} options.tags     - Dispositifs concernes : ['CEE', 'MPR', 'ANAH']
 * @param {string}   [options.phase]  - 'avant' | 'apres' (optionnel : tous si omis)
 * @param {string}   [options.precarity] - Categorie revenus si applicable
 * @param {boolean}  [options.onlyMandatory] - Ne renvoyer que les obligatoires
 */
export function getRequiredDocuments({ tags = [], phase = null, precarity = null, onlyMandatory = false } = {}) {
  return DOCUMENT_LIBRARY.filter((doc) => {
    // Filtre par tag (au moins un tag commun)
    const hasMatchingTag = doc.tags.some((t) => tags.includes(t))
    if (!hasMatchingTag) return false

    // Filtre par phase
    if (phase && doc.phase !== phase && doc.phase !== 'both') return false

    // Filtre par precarite
    if (precarity && doc.precarity && !doc.precarity.includes(precarity)) return false

    // Filtre obligatoires
    if (onlyMandatory && !doc.mandatory) return false

    return true
  })
}

/**
 * Retourne les documents groupes par phase pour un dispositif
 */
export function getDocumentsByPhase({ tags = [], precarity = null } = {}) {
  const all = getRequiredDocuments({ tags, precarity })
  return {
    avant: all.filter((d) => d.phase === 'avant' || d.phase === 'both'),
    apres: all.filter((d) => d.phase === 'apres' || d.phase === 'both'),
  }
}

/**
 * Retrouve un document par son id
 */
export function getDocumentById(id) {
  return DOCUMENT_LIBRARY.find((d) => d.id === id) || null
}
