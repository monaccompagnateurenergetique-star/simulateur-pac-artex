// API BAN (Base Adresse Nationale) — Géocodage
const BAN_URL = 'https://api-adresse.data.gouv.fr/search'

// API ADEME Open Data — DPE Logements existants (depuis juillet 2021)
const ADEME_URL = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant'

const SELECTED_FIELDS = [
  'numero_dpe',
  'identifiant_ban',
  'etiquette_dpe',
  'etiquette_ges',
  'periode_construction',
  'annee_construction',
  'surface_habitable_logement',
  'type_batiment',
  'type_energie_principale_chauffage',
  'date_etablissement_dpe',
  'date_fin_validite_dpe',
  'conso_5_usages_par_m2_ep',
  'emission_ges_5_usages',
  'qualite_isolation_enveloppe',
  'qualite_isolation_murs',
  'qualite_isolation_menuiseries',
  'adresse_ban',
  'code_postal_ban',
  'nom_commune_ban',
].join(',')

/**
 * Étape 1 : Géocode l'adresse via la BAN pour obtenir l'identifiant_ban exact
 */
async function geocodeAddress(address) {
  const params = new URLSearchParams({ q: address, limit: '1' })
  const res = await fetch(`${BAN_URL}/?${params}`)
  if (!res.ok) throw new Error(`Erreur géocodage BAN: ${res.status}`)

  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) return null

  return {
    banId: feature.properties.id,        // ex: "57197_0005_00016"
    label: feature.properties.label,
    score: feature.properties.score,
    postcode: feature.properties.postcode,
    city: feature.properties.city,
    coordinates: feature.geometry.coordinates, // [lon, lat]
  }
}

/**
 * Étape 2 : Recherche les DPE par identifiant_ban exact
 */
async function searchDPEByBanId(banId) {
  const params = new URLSearchParams({
    select: SELECTED_FIELDS,
    size: '20',
    sort: '-date_etablissement_dpe',
    qs: `identifiant_ban:"${banId}"`,
  })

  const res = await fetch(`${ADEME_URL}/lines?${params}`)
  if (!res.ok) throw new Error(`Erreur API ADEME: ${res.status}`)

  const data = await res.json()
  return (data.results || []).map(formatDPE)
}

/**
 * Recherche DPE précise en 2 étapes : BAN → ADEME
 * Retourne les DPE exactement à cette adresse
 */
export async function searchDPE(address, postalCode, city) {
  const fullAddress = [address, postalCode, city].filter(Boolean).join(' ')
  if (!fullAddress.trim()) throw new Error('Adresse requise')

  // Étape 1 : Géocodage BAN
  const geo = await geocodeAddress(fullAddress)

  if (geo && geo.score >= 0.5) {
    // Étape 2 : Recherche par identifiant_ban exact
    const results = await searchDPEByBanId(geo.banId)
    return {
      results,
      geocoding: geo,
      method: 'ban_exact',
    }
  }

  // Fallback : recherche par code postal + texte (moins précis)
  const params = new URLSearchParams({
    select: SELECTED_FIELDS,
    size: '20',
    sort: '-date_etablissement_dpe',
  })
  if (postalCode) {
    params.set('qs', `code_postal_ban:"${postalCode}"`)
  }
  if (address) {
    params.set('q', address)
    params.set('q_fields', 'adresse_ban')
  }

  const res = await fetch(`${ADEME_URL}/lines?${params}`)
  if (!res.ok) throw new Error(`Erreur API ADEME: ${res.status}`)

  const data = await res.json()
  return {
    results: (data.results || []).map(formatDPE),
    geocoding: null,
    method: 'fallback_text',
  }
}

function formatDPE(raw) {
  const surface = raw.surface_habitable_logement ? Number(raw.surface_habitable_logement) : null
  const consoM2 = raw.conso_5_usages_par_m2_ep ? Math.round(Number(raw.conso_5_usages_par_m2_ep)) : null
  return {
    numeroDpe: raw.numero_dpe,
    etiquetteDpe: raw.etiquette_dpe,
    etiquetteGes: raw.etiquette_ges,
    periodeConstruction: raw.periode_construction,
    anneeConstruction: raw.annee_construction,
    surface,
    typeBatiment: raw.type_batiment,
    energieChauffage: raw.type_energie_principale_chauffage,
    consoM2,
    emissionGes: raw.emission_ges_5_usages ? Math.round(Number(raw.emission_ges_5_usages)) : null,
    isolationEnveloppe: raw.qualite_isolation_enveloppe,
    isolationMurs: raw.qualite_isolation_murs,
    isolationMenuiseries: raw.qualite_isolation_menuiseries,
    dateEtablissement: raw.date_etablissement_dpe,
    dateFinValidite: raw.date_fin_validite_dpe,
    adresse: raw.adresse_ban,
    codePostal: raw.code_postal_ban,
    commune: raw.nom_commune_ban,
    // Lien vers l'observatoire ADEME (consultable dans le navigateur)
    observatoireUrl: raw.numero_dpe
      ? `https://observatoire-dpe-audit.ademe.fr/afficher-dpe/${raw.numero_dpe}`
      : null,
  }
}

/**
 * Prospection : recherche tous les DPE d'une ville ou code postal
 * Avec pagination et filtres (étiquette, type de bâtiment)
 */
export async function prospectDPE({ postalCode, city, etiquette, typeBatiment, sort = '-date_etablissement_dpe', page = 1, size = 50 }) {
  const filters = []

  if (postalCode) filters.push(`code_postal_ban:"${postalCode}"`)
  if (city) filters.push(`nom_commune_ban:"${city}"`)
  if (etiquette) filters.push(`etiquette_dpe:"${etiquette}"`)
  if (typeBatiment) filters.push(`type_batiment:"${typeBatiment}"`)

  if (filters.length === 0) throw new Error('Ville ou code postal requis')

  const params = new URLSearchParams({
    select: SELECTED_FIELDS,
    size: String(size),
    page: String(page),
    sort,
    qs: filters.join(' AND '),
  })

  const res = await fetch(`${ADEME_URL}/lines?${params}`)
  if (!res.ok) throw new Error(`Erreur API ADEME: ${res.status}`)

  const data = await res.json()
  return {
    results: (data.results || []).map(formatDPE),
    total: data.total || 0,
    page,
    size,
  }
}

/**
 * Statistiques DPE d'une zone (répartition par étiquette)
 */
export async function getDPEStats(postalCode) {
  if (!postalCode) throw new Error('Code postal requis')

  const params = new URLSearchParams({
    qs: `code_postal_ban:"${postalCode}"`,
    size: '0',
    field: 'etiquette_dpe',
  })

  const res = await fetch(`${ADEME_URL}/values_agg?${params}`)
  if (!res.ok) throw new Error(`Erreur API ADEME: ${res.status}`)

  const data = await res.json()
  return {
    total: data.total || 0,
    distribution: (data.aggs || []).map((a) => ({
      etiquette: a.value,
      count: a.total,
    })),
  }
}

export const DPE_COLORS = {
  A: { bg: '#319834', text: 'white' },
  B: { bg: '#33cc33', text: 'white' },
  C: { bg: '#cbfc34', text: '#1a1a1a' },
  D: { bg: '#fbef36', text: '#1a1a1a' },
  E: { bg: '#fccc2f', text: '#1a1a1a' },
  F: { bg: '#f48e1f', text: 'white' },
  G: { bg: '#ee1d23', text: 'white' },
}

export function getDpeColor(letter) {
  const c = DPE_COLORS[letter]
  if (!c) return { bg: '#9ca3af', text: 'white' }
  return c
}
