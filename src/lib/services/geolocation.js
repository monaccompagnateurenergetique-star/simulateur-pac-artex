/* ════════════════════════════════════════════════════════
   Géolocalisation — Adresse + Altitude

   Providers :
   • Adresses      : BAN (api-adresse.data.gouv.fr) — gratuit, sans clé
   • Altitude #1   : Open-Meteo (api.open-meteo.com) — gratuit, éprouvé Effy
   • Altitude #2   : IGN Géoplateforme (data.geopf.fr) — fallback officiel

   Tous les endpoints sont CORS-friendly et sans authentification.
   ════════════════════════════════════════════════════════ */

const BAN_ENDPOINT = 'https://api-adresse.data.gouv.fr/search/'
const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/elevation'
const IGN_ENDPOINT = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json'

/* ─── Cache mémoire (20 dernières recherches) ───────── */
const addressCache = new Map()
const altitudeCache = new Map()
const CACHE_MAX = 50

function cacheSet(cache, key, value) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value
    cache.delete(first)
  }
  cache.set(key, value)
}

/* ─── Autocomplete d'adresse via BAN ─────────────────── */
/**
 * Recherche d'adresse via la Base Adresse Nationale (BAN).
 * Debounce à gérer côté appelant (300ms recommandé).
 *
 * @param {string} query - Texte libre ("16 rue du bourg 57510")
 * @param {AbortSignal} [signal] - Pour annuler la requête
 * @returns {Promise<Array<{label, street, postcode, city, lat, lon, score, context}>>}
 */
export async function searchAddress(query, signal) {
  const cleaned = String(query || '').trim()
  if (cleaned.length < 3) return []

  if (addressCache.has(cleaned)) return addressCache.get(cleaned)

  const url = `${BAN_ENDPOINT}?q=${encodeURIComponent(cleaned)}&limit=5&autocomplete=1`
  try {
    const r = await fetch(url, { signal })
    if (!r.ok) return []
    const json = await r.json()
    const results = (json.features || []).map(f => ({
      label: f.properties.label,
      street: f.properties.name,
      postcode: f.properties.postcode,
      city: f.properties.city,
      context: f.properties.context, // ex. "57, Moselle, Grand Est"
      type: f.properties.type,        // "housenumber" | "street" | "municipality"
      score: f.properties.score,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    }))
    cacheSet(addressCache, cleaned, results)
    return results
  } catch (e) {
    if (e.name === 'AbortError') throw e
    return []
  }
}

/* ─── Altitude Open-Meteo (primaire) ─────────────────── */
async function fetchAltitudeOpenMeteo(lat, lon, signal) {
  const url = `${OPEN_METEO_ENDPOINT}?latitude=${lat}&longitude=${lon}`
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`)
  const json = await r.json()
  const alt = Array.isArray(json.elevation) ? json.elevation[0] : json.elevation
  if (typeof alt !== 'number' || Number.isNaN(alt)) throw new Error('Open-Meteo no elevation')
  return { altitude: Math.round(alt), source: 'open-meteo', precision: '~90m (SRTM)' }
}

/* ─── Altitude IGN RGE ALTI® (fallback) ──────────────── */
async function fetchAltitudeIGN(lat, lon, signal) {
  const url = `${IGN_ENDPOINT}?lon=${lon}&lat=${lat}&resource=ign_rge_alti_wld&zonly=true`
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`IGN ${r.status}`)
  const json = await r.json()
  // Deux formats possibles selon version API
  const alt = Array.isArray(json.elevations) ? json.elevations[0]
    : Array.isArray(json.altitudes) ? json.altitudes[0]
    : null
  const altValue = typeof alt === 'object' ? (alt?.z ?? alt?.altitude) : alt
  if (typeof altValue !== 'number' || Number.isNaN(altValue)) throw new Error('IGN no elevation')
  return { altitude: Math.round(altValue), source: 'ign', precision: '1m (RGE ALTI®)' }
}

/**
 * Récupère l'altitude d'un point (Open-Meteo → IGN en fallback).
 *
 * @param {number} lat
 * @param {number} lon
 * @param {AbortSignal} [signal]
 * @returns {Promise<{altitude: number, source: 'open-meteo'|'ign'|'cache', precision: string}>}
 */
export async function fetchAltitude(lat, lon, signal) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('fetchAltitude: lat/lon requis')
  }
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`
  if (altitudeCache.has(key)) return { ...altitudeCache.get(key), source: 'cache' }

  let result
  try {
    result = await fetchAltitudeOpenMeteo(lat, lon, signal)
  } catch (e) {
    if (e.name === 'AbortError') throw e
    // Fallback IGN
    try {
      result = await fetchAltitudeIGN(lat, lon, signal)
    } catch (e2) {
      if (e2.name === 'AbortError') throw e2
      throw new Error(`Altitude inaccessible (Open-Meteo + IGN KO)`)
    }
  }

  cacheSet(altitudeCache, key, result)
  return result
}

/**
 * Raccourci combiné : adresse complète → coords + altitude.
 * Pratique pour un pré-remplissage d'après un address picker.
 */
export async function enrichAddressWithAltitude(addressResult, signal) {
  if (!addressResult || typeof addressResult.lat !== 'number') {
    throw new Error('enrichAddressWithAltitude: address.lat/lon manquants')
  }
  const alt = await fetchAltitude(addressResult.lat, addressResult.lon, signal)
  return {
    ...addressResult,
    altitude: alt.altitude,
    altitudeSource: alt.source,
    altitudePrecision: alt.precision,
  }
}
