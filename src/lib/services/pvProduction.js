import {
  PV_REGIONS, PV_ORIENTATIONS, tiltFactor,
  PV_MONTHLY_PROFILE, PV_MONTHS,
} from '../constants/photovoltaique'

/**
 * Estimation de la production annuelle (kWh/an) — modèle régional local.
 *
 * NOTE PVGIS : l'API PVGIS (JRC) n'autorise PAS les appels navigateur (CORS
 * bloqué par politique JRC). Sur un hébergement statique (GitHub Pages), on
 * utilise donc un modèle local calé sur les productibles régionaux français.
 * Pour brancher PVGIS plus tard, passer par un proxy serverless (Cloudflare
 * Worker) qui ajoute les en-têtes CORS — voir fetchProductionPVGIS ci-dessous.
 *
 * production = kWc × productible_région × facteur_orientation × facteur_inclinaison
 */
export function estimateAnnualProduction({ kwc, region, orientation, tilt }) {
  const reg = PV_REGIONS.find(r => r.value === region) ?? PV_REGIONS[1]
  const ori = PV_ORIENTATIONS.find(o => o.value === orientation) ?? PV_ORIENTATIONS[0]
  const tFactor = tiltFactor(tilt)
  const annual = (Number(kwc) || 0) * reg.productible * ori.factor * tFactor
  return {
    annualKwh: Math.round(annual),
    productiblePerKwc: Math.round(reg.productible * ori.factor * tFactor), // kWh/kWc/an effectif
    regionLabel: reg.label,
    source: 'Modèle régional (PVGIS indisponible côté navigateur)',
  }
}

/** Répartition mensuelle de la production (kWh par mois). */
export function monthlyProduction(annualKwh) {
  return PV_MONTHLY_PROFILE.map((p, i) => ({
    mois: PV_MONTHS[i],
    kwh: Math.round(annualKwh * p),
  }))
}

/**
 * (Optionnel — non utilisé par défaut) Appel PVGIS via un proxy CORS.
 * À activer si vous déployez un Cloudflare Worker passe-plat.
 *   const url = `${proxyBase}?lat=${lat}&lon=${lon}&peakpower=${kwc}&loss=14&angle=${tilt}&aspect=${aspect}&outputformat=json`
 * Retourne outputs.totals.fixed.E_y (production annuelle).
 */
export async function fetchProductionPVGIS({ proxyBase, lat, lon, kwc, tilt = 30, aspect = 0, loss = 14 }) {
  if (!proxyBase) throw new Error('Proxy PVGIS non configuré')
  const url = `${proxyBase}?lat=${lat}&lon=${lon}&peakpower=${kwc}&loss=${loss}&angle=${tilt}&aspect=${aspect}&mountingplace=building&outputformat=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('PVGIS indisponible')
  const json = await res.json()
  const annual = json?.outputs?.totals?.fixed?.E_y
  if (!annual) throw new Error('Réponse PVGIS invalide')
  return { annualKwh: Math.round(annual), source: 'PVGIS' }
}
