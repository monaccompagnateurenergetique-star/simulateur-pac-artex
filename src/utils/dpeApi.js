// API BAN (Base Adresse Nationale) — Géocodage
const BAN_URL = 'https://api-adresse.data.gouv.fr/search'

// API ADEME Open Data — DPE Logements existants (depuis juillet 2021)
const ADEME_URL = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant'

// API ADEME — Audits energetiques logement existants (depuis sept. 2023)
const AUDIT_URL = 'https://data.ademe.fr/data-fair/api/v1/datasets/audit-opendata'

const AUDIT_FIELDS = [
  'n_audit', 'numero_dpe', 'identifiant_ban',
  'categorie_scenario', 'id_etape', 'etape_travaux', 'travaux_realises',
  'classe_bilan_dpe', 'etiquette_ges',
  'ep_conso_5_usages_m2', 'emission_ges_5_usages_m2',
  'cout_travaux', 'couts_cumules_travaux',
  'gain_conso_5_usages_m2_ep', 'gain_emission_ges_5_usages_m2',
  'gain_financier_travaux', 'gain_financier_cumule',
  'adresse_ban', 'code_postal_ban', 'nom_commune_ban',
  'surface_habitable_logement',
].join(',')

const SELECTED_FIELDS = [
  'numero_dpe',
  'identifiant_ban',
  'etiquette_dpe',
  'etiquette_ges',
  'periode_construction',
  'annee_construction',
  'surface_habitable_logement',
  'surface_habitable_immeuble',
  'type_batiment',
  'nombre_appartement',
  'nombre_niveau_immeuble',
  'type_installation_chauffage',
  'type_energie_principale_chauffage',
  'type_generateur_chauffage_principal',
  'type_installation_ecs',
  'type_energie_principale_ecs',
  'type_ventilation',
  'date_etablissement_dpe',
  'date_fin_validite_dpe',
  'conso_5_usages_par_m2_ep',
  'emission_ges_5_usages',
  'cout_total_5_usages',
  'cout_chauffage',
  'qualite_isolation_enveloppe',
  'qualite_isolation_murs',
  'qualite_isolation_plancher_bas',
  'qualite_isolation_menuiseries',
  'adresse_ban',
  'code_postal_ban',
  'nom_commune_ban',
].join(',')

/**
 * Étape 1 : Géocode l'adresse via la BAN pour obtenir l'identifiant_ban exact
 */
export async function geocodeAddress(address) {
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
    count: 'false',
  })

  const res = await fetch(`${ADEME_URL}/lines?${params}`)
  if (!res.ok) throw new Error(`Erreur API ADEME: ${res.status}`)

  const data = await res.json()
  return (data.results || []).map(formatDPE)
}

/**
 * Recherche audits energetiques par identifiant_ban
 */
export async function searchAuditByBanId(banId) {
  const params = new URLSearchParams({
    select: AUDIT_FIELDS,
    size: '50',
    sort: '-n_audit',
    qs: `identifiant_ban:"${banId}"`,
    count: 'false',
  })

  const res = await fetch(`${AUDIT_URL}/lines?${params}`)
  if (!res.ok) return [] // silencieux si pas dispo
  const data = await res.json()
  return groupAuditRows(data.results || [])
}

/**
 * Recherche audits par code postal (fallback)
 */
async function searchAuditByPostalCode(postalCode, address) {
  const params = new URLSearchParams({
    select: AUDIT_FIELDS,
    size: '50',
    sort: '-n_audit',
    qs: `code_postal_ban:"${postalCode}"`,
  })
  if (address) {
    params.set('q', address)
    params.set('q_fields', 'adresse_ban')
  }

  const res = await fetch(`${AUDIT_URL}/lines?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return groupAuditRows(data.results || [])
}

/**
 * Regroupe les lignes brutes d'audit par n_audit puis par scenario
 * Retourne un tableau d'audits structures
 */
function groupAuditRows(rows) {
  const byAudit = {}
  for (const row of rows) {
    const id = row.n_audit
    if (!id) continue
    if (!byAudit[id]) byAudit[id] = { id, rows: [] }
    byAudit[id].rows.push(row)
  }

  return Object.values(byAudit).map(({ id, rows: auditRows }) => {
    const first = auditRows[0]
    const etatInitial = auditRows.find((r) => (r.categorie_scenario || '').includes('initial'))
    const scenarioRows = auditRows.filter((r) => !(r.categorie_scenario || '').includes('initial'))

    // Grouper par categorie_scenario
    const byScenario = {}
    for (const r of scenarioRows) {
      const cat = r.categorie_scenario || 'autre'
      if (!byScenario[cat]) byScenario[cat] = []
      byScenario[cat].push(r)
    }

    const scenarios = Object.entries(byScenario).map(([categorie, steps]) => ({
      categorie,
      etapes: steps
        .sort((a, b) => {
          const order = { 'étape première': 0, 'étape intermediaire': 1, 'étape finale': 2 }
          return (order[(a.id_etape || '').toLowerCase()] ?? 1) - (order[(b.id_etape || '').toLowerCase()] ?? 1)
        })
        .map((s) => ({
          id: s.id_etape || s.etape_travaux || '',
          travaux: (s.travaux_realises || '').split(',').map((t) => t.trim()).filter(Boolean),
          classeDpe: s.classe_bilan_dpe,
          classeGes: s.etiquette_ges,
          consoM2: s.ep_conso_5_usages_m2 ? Math.round(Number(s.ep_conso_5_usages_m2)) : null,
          emissionGes: s.emission_ges_5_usages_m2 ? Math.round(Number(s.emission_ges_5_usages_m2)) : null,
          coutTravaux: s.cout_travaux ? Math.round(Number(s.cout_travaux)) : null,
          coutsCumules: s.couts_cumules_travaux ? Math.round(Number(s.couts_cumules_travaux)) : null,
          gainConso: s.gain_conso_5_usages_m2_ep ? Math.round(Number(s.gain_conso_5_usages_m2_ep) * 10) / 10 : null,
          gainGes: s.gain_emission_ges_5_usages_m2 ? Math.round(Number(s.gain_emission_ges_5_usages_m2) * 10) / 10 : null,
        })),
    }))

    return {
      numeroAudit: id,
      numeroDpe: first.numero_dpe || null,
      adresse: first.adresse_ban,
      codePostal: first.code_postal_ban,
      commune: first.nom_commune_ban,
      surface: first.surface_habitable_logement ? Number(first.surface_habitable_logement) : null,
      etatInitial: etatInitial
        ? {
            classeDpe: etatInitial.classe_bilan_dpe,
            classeGes: etatInitial.etiquette_ges,
            consoM2: etatInitial.ep_conso_5_usages_m2 ? Math.round(Number(etatInitial.ep_conso_5_usages_m2)) : null,
            emissionGes: etatInitial.emission_ges_5_usages_m2 ? Math.round(Number(etatInitial.emission_ges_5_usages_m2)) : null,
          }
        : null,
      scenarios,
      observatoireUrl: `https://observatoire-dpe-audit.ademe.fr/afficher-audit/${id}`,
    }
  })
}

/**
 * Recherche DPE + Audits en 2 etapes : BAN → ADEME
 * Toujours via geocodage BAN (la recherche par code postal ADEME est instable)
 */
export async function searchDPE(address, postalCode, city) {
  const fullAddress = [address, postalCode, city].filter(Boolean).join(' ')
  if (!fullAddress.trim()) throw new Error('Adresse requise')

  // Étape 1 : Géocodage BAN (essai avec adresse complete, puis code postal seul)
  let geo = await geocodeAddress(fullAddress)

  // Fallback : si score trop bas et qu'on a un code postal, retenter avec CP + ville
  if ((!geo || geo.score < 0.4) && postalCode) {
    const fallbackQuery = [postalCode, city].filter(Boolean).join(' ')
    if (fallbackQuery !== fullAddress) {
      const geo2 = await geocodeAddress(fallbackQuery)
      if (geo2 && (!geo || geo2.score > geo.score)) geo = geo2
    }
  }

  if (!geo || geo.score < 0.3) {
    throw new Error('Adresse introuvable. Verifiez l\'adresse ou ajoutez le code postal et la ville.')
  }

  // Étape 2 : Recherche par identifiant_ban exact (DPE + Audit en parallele)
  const [results, audits] = await Promise.all([
    searchDPEByBanId(geo.banId),
    searchAuditByBanId(geo.banId).catch(() => []),
  ])

  return {
    results,
    audits,
    geocoding: geo,
    method: 'ban_exact',
  }
}

function formatDPE(raw) {
  const surface = raw.surface_habitable_logement ? Number(raw.surface_habitable_logement) : null
  const consoM2 = raw.conso_5_usages_par_m2_ep ? Math.round(Number(raw.conso_5_usages_par_m2_ep)) : null
  return {
    numeroDpe: raw.numero_dpe,
    identifiantBan: raw.identifiant_ban || null,
    etiquetteDpe: raw.etiquette_dpe,
    etiquetteGes: raw.etiquette_ges,
    periodeConstruction: raw.periode_construction,
    anneeConstruction: raw.annee_construction,
    surface,
    surfaceImmeuble: raw.surface_habitable_immeuble ? Number(raw.surface_habitable_immeuble) : null,
    typeBatiment: raw.type_batiment,
    nombreAppartements: raw.nombre_appartement ? Number(raw.nombre_appartement) : null,
    nombreNiveaux: raw.nombre_niveau_immeuble ? Number(raw.nombre_niveau_immeuble) : null,
    installationChauffage: raw.type_installation_chauffage,
    energieChauffage: raw.type_energie_principale_chauffage,
    generateurChauffage: raw.type_generateur_chauffage_principal,
    installationEcs: raw.type_installation_ecs,
    energieEcs: raw.type_energie_principale_ecs,
    typeVentilation: raw.type_ventilation,
    consoM2,
    emissionGes: raw.emission_ges_5_usages ? Math.round(Number(raw.emission_ges_5_usages)) : null,
    coutTotal: raw.cout_total_5_usages ? Math.round(Number(raw.cout_total_5_usages)) : null,
    coutChauffage: raw.cout_chauffage ? Math.round(Number(raw.cout_chauffage)) : null,
    isolationEnveloppe: raw.qualite_isolation_enveloppe,
    isolationMurs: raw.qualite_isolation_murs,
    isolationPlancherBas: raw.qualite_isolation_plancher_bas,
    isolationMenuiseries: raw.qualite_isolation_menuiseries,
    dateEtablissement: raw.date_etablissement_dpe,
    dateFinValidite: raw.date_fin_validite_dpe,
    adresse: raw.adresse_ban,
    codePostal: raw.code_postal_ban,
    commune: raw.nom_commune_ban,
    observatoireUrl: raw.numero_dpe
      ? `https://observatoire-dpe-audit.ademe.fr/afficher-dpe/${raw.numero_dpe}`
      : null,
  }
}

/**
 * Prospection : recherche tous les DPE d'une ville ou code postal
 * Avec pagination et filtres (étiquette, type de bâtiment)
 */
export async function prospectDPE({
  postalCode, city, etiquette, typeBatiment,
  installationChauffage, energieChauffage, installationEcs,
  sort = '-date_etablissement_dpe', page = 1, size = 50,
}) {
  const filters = []

  if (postalCode) filters.push(`code_postal_ban:"${postalCode}"`)
  if (city) filters.push(`nom_commune_ban:"${city}"`)
  if (etiquette) filters.push(`etiquette_dpe:"${etiquette}"`)
  if (typeBatiment) filters.push(`type_batiment:"${typeBatiment}"`)
  if (installationChauffage) filters.push(`type_installation_chauffage:"${installationChauffage}"`)
  if (energieChauffage) filters.push(`type_energie_principale_chauffage:"${energieChauffage}"`)
  if (installationEcs) filters.push(`type_installation_ecs:"${installationEcs}"`)

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
  const items = (data.results || []).map(formatDPE)
  return {
    results: items,
    total: data.total || items.length,
    page,
    size,
  }
}

/**
 * Statistiques DPE d'une zone (répartition par étiquette)
 */
export async function getDPEStats({ city, postalCode } = {}) {
  if (!city && !postalCode) throw new Error('Ville ou code postal requis')

  // Prefer nom_commune_ban (code_postal_ban returns 403 on ADEME API)
  const qs = city
    ? `nom_commune_ban:"${city}"`
    : `code_postal_ban:"${postalCode}"`

  const params = new URLSearchParams({
    qs,
    size: '0',
    field: 'etiquette_dpe',
    count: 'false',
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
