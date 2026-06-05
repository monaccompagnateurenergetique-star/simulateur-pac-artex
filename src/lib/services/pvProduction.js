import {
  PV_REGIONS, PV_ORIENTATIONS, tiltFactor,
  PV_MONTHLY_PROFILE, PV_MONTHS, PV_CONSO_MONTHLY_PROFILE,
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

/** Production + consommation mensuelle combinée pour graphique overlay. */
export function monthlyProductionVsConso(annualProdKwh, annualConsoKwh, autoconsoRate) {
  return PV_MONTHS.map((mois, i) => {
    const prod = Math.round(annualProdKwh * PV_MONTHLY_PROFILE[i])
    const conso = Math.round(annualConsoKwh * PV_CONSO_MONTHLY_PROFILE[i])
    const autoconso = Math.round(Math.min(prod * autoconsoRate, conso))
    const surplus = Math.max(0, prod - autoconso)
    const achatReseau = Math.max(0, conso - autoconso)
    return { mois, prod, conso, autoconso, surplus, achatReseau }
  })
}

/** Simulation de financement : prêt solaire. */
export function computeFinancing({ montant, tauxAnnuel, dureeAnnees, economieAn1, inflationElec = 0.03 }) {
  if (!montant || montant <= 0 || !dureeAnnees || dureeAnnees <= 0) return null
  const r = tauxAnnuel / 12
  const n = dureeAnnees * 12
  const mensualite = r > 0 ? montant * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : montant / n
  const coutTotal = mensualite * n
  const interets = coutTotal - montant

  // Économie mensuelle moyenne (avec inflation sur la durée du prêt)
  const projection = []
  let totalEco = 0
  for (let y = 1; y <= dureeAnnees; y++) {
    const ecoY = economieAn1 * Math.pow(1 + inflationElec, y - 1)
    const mensualiteAn = mensualite * 12
    totalEco += ecoY
    projection.push({
      annee: y,
      economie: Math.round(ecoY),
      remboursement: Math.round(mensualiteAn),
      solde: Math.round(ecoY - mensualiteAn),
    })
  }
  const ecoMoyenneMensuelle = totalEco / (dureeAnnees * 12)
  return {
    mensualite: Math.round(mensualite),
    coutTotal: Math.round(coutTotal),
    interets: Math.round(interets),
    ecoMoyenneMensuelle: Math.round(ecoMoyenneMensuelle),
    resteACharge: Math.round(mensualite - ecoMoyenneMensuelle),
    autoFinance: ecoMoyenneMensuelle >= mensualite,
    projection,
  }
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
