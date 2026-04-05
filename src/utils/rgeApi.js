// API ADEME Open Data — Liste des entreprises RGE
const RGE_URL = 'https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2'

const SELECTED_FIELDS = [
  'siret', 'nom_entreprise', 'adresse', 'code_postal', 'commune',
  'telephone', 'email', 'site_internet',
  'code_qualification', 'nom_qualification', 'url_qualification', 'nom_certificat',
  'domaine', 'meta_domaine', 'organisme', 'particulier',
  'lien_date_debut', 'lien_date_fin',
].join(',')

/**
 * Recherche d'entreprises RGE avec filtres et pagination
 */
export async function searchRGE({
  postalCode, departement, commune, domaine, organisme, particulier,
  query, sort = 'nom_entreprise', page = 1, size = 25,
}) {
  const filters = []

  if (postalCode) filters.push(`code_postal:"${postalCode}"`)
  else if (departement) {
    const dep = departement.trim()
    if (dep.length === 2) filters.push(`code_postal:[${dep}000 TO ${dep}999]`)
    else if (dep.length === 3) filters.push(`code_postal:[${dep}00 TO ${dep}99]`)
  }
  if (commune) filters.push(`commune:"${commune}"`)
  if (domaine) filters.push(`domaine:"${domaine}"`)
  if (organisme) filters.push(`organisme:"${organisme}"`)
  if (particulier) filters.push('particulier:true')

  const params = new URLSearchParams({
    select: SELECTED_FIELDS,
    size: String(size),
    page: String(page),
    sort,
  })

  if (filters.length) params.set('qs', filters.join(' AND '))
  if (query) {
    params.set('q', query)
    params.set('q_fields', 'nom_entreprise,adresse,commune')
  }

  const res = await fetch(`${RGE_URL}/lines?${params}`)
  if (!res.ok) throw new Error(`Erreur API RGE: ${res.status}`)

  const data = await res.json()
  const formatted = (data.results || []).map(formatRGE)
  const grouped = groupBySiret(formatted)
  return {
    results: grouped,
    total: data.total || 0,
    totalGrouped: grouped.length,
    page,
    size,
  }
}

/**
 * Statistiques RGE d'une zone — répartition par domaine
 */
export async function getRGEStats(postalCode) {
  if (!postalCode) throw new Error('Code postal requis')

  const params = new URLSearchParams({
    qs: `code_postal:"${postalCode}"`,
    size: '0',
    field: 'domaine',
  })

  const res = await fetch(`${RGE_URL}/values_agg?${params}`)
  if (!res.ok) throw new Error(`Erreur API RGE: ${res.status}`)

  const data = await res.json()
  return {
    total: data.total || 0,
    distribution: (data.aggs || []).map((a) => ({
      domaine: a.value,
      count: a.total,
    })).sort((a, b) => b.count - a.count),
  }
}

/**
 * Récupère les valeurs distinctes d'un champ
 */
export async function getRGEFilterValues(field) {
  const params = new URLSearchParams({ size: '0', field })
  const res = await fetch(`${RGE_URL}/values_agg?${params}`)
  if (!res.ok) throw new Error(`Erreur API RGE: ${res.status}`)

  const data = await res.json()
  return (data.aggs || []).map((a) => a.value).filter(Boolean).sort()
}

function formatRGE(raw) {
  return {
    siret: raw.siret,
    nom: raw.nom_entreprise,
    adresse: raw.adresse,
    codePostal: raw.code_postal,
    commune: raw.commune,
    telephone: raw.telephone,
    email: raw.email,
    siteInternet: raw.site_internet,
    codeQualification: raw.code_qualification,
    nomQualification: raw.nom_qualification,
    urlQualification: raw.url_qualification,
    nomCertificat: raw.nom_certificat,
    domaine: raw.domaine,
    metaDomaine: raw.meta_domaine,
    organisme: raw.organisme,
    particulier: raw.particulier,
    dateDebut: raw.lien_date_debut,
    dateFin: raw.lien_date_fin,
  }
}

function groupBySiret(rows) {
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.siret)) {
      map.set(r.siret, {
        siret: r.siret,
        nom: r.nom,
        adresse: r.adresse,
        codePostal: r.codePostal,
        commune: r.commune,
        telephone: r.telephone,
        email: r.email,
        siteInternet: r.siteInternet,
        particulier: r.particulier,
        qualifications: [],
      })
    }
    const entry = map.get(r.siret)
    if (!entry.telephone && r.telephone) entry.telephone = r.telephone
    if (!entry.email && r.email) entry.email = r.email
    if (!entry.siteInternet && r.siteInternet) entry.siteInternet = r.siteInternet

    const qualKey = `${r.codeQualification}-${r.organisme}`
    if (!entry.qualifications.some((q) => `${q.code}-${q.organisme}` === qualKey)) {
      entry.qualifications.push({
        code: r.codeQualification,
        nom: r.nomQualification,
        url: r.urlQualification,
        certificat: r.nomCertificat,
        domaine: r.domaine,
        metaDomaine: r.metaDomaine,
        organisme: r.organisme,
        dateDebut: r.dateDebut,
        dateFin: r.dateFin,
      })
    }
  }
  return Array.from(map.values())
}

// ─── Couleurs par meta_domaine ───
export const META_DOMAINE_COLORS = {
  'Chauffage': 'bg-orange-100 text-orange-700',
  'Isolation': 'bg-blue-100 text-blue-700',
  'EnR': 'bg-green-100 text-green-700',
  'Ventilation': 'bg-cyan-100 text-cyan-700',
  'Audit': 'bg-purple-100 text-purple-700',
  'RGE Offre Globale': 'bg-indigo-100 text-indigo-700',
}

export function getMetaDomaineColor(meta) {
  return META_DOMAINE_COLORS[meta] || 'bg-gray-100 text-gray-700'
}

// ─── Pipeline de prospection (7 statuts) ───
export const PROSPECT_STATUSES = [
  { value: 'a_contacter',     label: 'À contacter',        color: 'bg-gray-100 text-gray-600',    hex: '#9ca3af', icon: 'UserPlus',    order: 1 },
  { value: 'premier_contact', label: 'Premier contact',    color: 'bg-blue-100 text-blue-700',    hex: '#2563eb', icon: 'PhoneCall',   order: 2 },
  { value: 'interesse',       label: 'Intéressé',          color: 'bg-emerald-100 text-emerald-700', hex: '#059669', icon: 'ThumbsUp', order: 3 },
  { value: 'demo_planifiee',  label: 'Démo planifiée',     color: 'bg-violet-100 text-violet-700', hex: '#7c3aed', icon: 'Calendar',   order: 4 },
  { value: 'proposition',     label: 'Proposition envoyée', color: 'bg-amber-100 text-amber-700',  hex: '#d97706', icon: 'FileText',   order: 5 },
  { value: 'gagne',           label: 'Gagné',              color: 'bg-indigo-100 text-indigo-700', hex: '#4f46e5', icon: 'Trophy',     order: 6 },
  { value: 'perdu',           label: 'Perdu',              color: 'bg-red-100 text-red-600',       hex: '#dc2626', icon: 'XCircle',    order: 7 },
]

export function getStatusInfo(status) {
  return PROSPECT_STATUSES.find((s) => s.value === status) || PROSPECT_STATUSES[0]
}

export function getActiveStatuses() {
  return PROSPECT_STATUSES.filter((s) => s.value !== 'gagne' && s.value !== 'perdu')
}

// ─── Types d'activités ───
export const ACTIVITY_TYPES = [
  { value: 'appel',       label: 'Appel',           icon: 'Phone',       color: 'text-blue-600' },
  { value: 'email',       label: 'Email',           icon: 'Mail',        color: 'text-amber-600' },
  { value: 'reunion',     label: 'Réunion',         icon: 'Users',       color: 'text-violet-600' },
  { value: 'demo',        label: 'Démo',            icon: 'Monitor',     color: 'text-indigo-600' },
  { value: 'note',        label: 'Note',            icon: 'FileText',    color: 'text-gray-600' },
  { value: 'relance',     label: 'Relance',         icon: 'RefreshCw',   color: 'text-orange-600' },
  { value: 'proposition', label: 'Proposition',     icon: 'Send',        color: 'text-emerald-600' },
]

export function getActivityTypeInfo(type) {
  return ACTIVITY_TYPES.find((t) => t.value === type) || ACTIVITY_TYPES[4]
}

// ─── Résultats d'activité ───
export const ACTIVITY_OUTCOMES = [
  { value: 'positif',     label: 'Positif',       color: 'bg-emerald-100 text-emerald-700' },
  { value: 'neutre',      label: 'Neutre',        color: 'bg-gray-100 text-gray-600' },
  { value: 'negatif',     label: 'Négatif',       color: 'bg-red-100 text-red-600' },
  { value: 'sans_reponse', label: 'Sans réponse', color: 'bg-amber-100 text-amber-700' },
]

// ─── Raisons de perte ───
export const LOSS_REASONS = [
  { value: 'trop_cher',     label: 'Trop cher' },
  { value: 'pas_le_moment', label: 'Pas le bon moment' },
  { value: 'concurrent',    label: 'A choisi un concurrent' },
  { value: 'pas_besoin',    label: 'Pas de besoin identifié' },
  { value: 'injoignable',   label: 'Injoignable' },
  { value: 'autre',         label: 'Autre' },
]

// ─── Niveaux de priorité ───
export const PRIORITY_LEVELS = [
  { value: 'haute',   label: 'Haute',   color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  { value: 'moyenne', label: 'Moyenne', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'basse',   label: 'Basse',   color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
]

export function getPriorityInfo(priority) {
  return PRIORITY_LEVELS.find((p) => p.value === priority) || PRIORITY_LEVELS[2]
}

/**
 * Calcule la priorité auto en fonction du statut, relance et dernière activité
 */
export function computePriority(prospect) {
  const { status, nextFollowUp, updatedAt } = prospect
  const now = Date.now()
  const followUpOverdue = nextFollowUp && new Date(nextFollowUp).getTime() < now
  const daysSinceUpdate = updatedAt ? (now - new Date(updatedAt).getTime()) / 86400000 : 999

  if ((status === 'interesse' || status === 'demo_planifiee') && (followUpOverdue || daysSinceUpdate > 5)) return 'haute'
  if ((status === 'premier_contact' || status === 'proposition') && nextFollowUp) return 'moyenne'
  return 'basse'
}

/**
 * Migration : ancien statut → nouveau
 */
export function migrateStatus(oldStatus) {
  const map = { contacte: 'premier_contact', pas_interesse: 'perdu', client: 'gagne' }
  return map[oldStatus] || oldStatus
}
