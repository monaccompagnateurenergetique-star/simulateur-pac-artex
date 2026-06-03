import { PV_PANEL, PV_SIZES, PV_AUTOCONSO } from '../constants/photovoltaique'

/** Arrondit une puissance kWc vers la taille standard la plus proche (3..9). */
function snapToStandard(kwc) {
  let best = PV_SIZES[0]
  let bestDiff = Infinity
  for (const s of PV_SIZES) {
    const d = Math.abs(s - kwc)
    if (d < bestDiff) { bestDiff = d; best = s }
  }
  return best
}

/**
 * Dimensionnement recommandé à partir des besoins.
 * Vise à couvrir ~90 % de la conso (autoconsommation maximale sans surplus excessif),
 * borné par la surface de toit disponible et la plage 3–9 kWc résidentielle.
 */
export function recommendSizing({ consoAnnuelle, surfaceToit, productiblePerKwc }) {
  const coverageTarget = 0.9
  const prod = productiblePerKwc > 0 ? productiblePerKwc : 1100
  const kwcFromConso = (Number(consoAnnuelle) || 0) * coverageTarget / prod
  // 1 kWc ≈ 2 panneaux de 2 m² ≈ 4 m² + espacement → ~4.5 m²/kWc
  const surfacePerKwc = (1000 / PV_PANEL.puissanceWc) * PV_PANEL.surfaceM2 * 1.12
  const kwcFromRoof = surfaceToit > 0 ? surfaceToit / surfacePerKwc : Infinity
  let kwc = Math.min(kwcFromConso || 3, kwcFromRoof, 9)
  kwc = Math.max(3, kwc)
  const kwcStd = snapToStandard(kwc)
  const nbPanneaux = Math.round((kwcStd * 1000) / PV_PANEL.puissanceWc)
  return {
    kwc: kwcStd,
    nbPanneaux,
    surfaceNecessaire: Math.round(nbPanneaux * PV_PANEL.surfaceM2),
  }
}

/** Taux d'autoconsommation estimé selon le profil de vie. */
export function selfConsumptionRate({ presence, ballonEcs, voitureElec }) {
  let rate = PV_AUTOCONSO.base
  if (presence === 'present') rate += PV_AUTOCONSO.bonusPresenceJour
  else if (presence === 'partiel') rate += PV_AUTOCONSO.bonusPresenceJour / 2
  if (ballonEcs) rate += PV_AUTOCONSO.bonusBallonEcs
  if (voitureElec) rate += PV_AUTOCONSO.bonusVoitureElec
  return Math.min(PV_AUTOCONSO.max, rate)
}

/** Valeur actuelle nette d'une série de flux. */
function npv(rate, cashflows) {
  return cashflows.reduce((s, c, t) => s + c / Math.pow(1 + rate, t), 0)
}

/** TRI (taux de rendement interne) par bisection. Retourne null si non trouvé. */
export function irr(cashflows) {
  let lo = -0.9, hi = 1.0
  const nLo = npv(lo, cashflows), nHi = npv(hi, cashflows)
  if (nLo * nHi > 0) return null
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const v = npv(mid, cashflows)
    if (Math.abs(v) < 0.5) return mid
    if (npv(lo, cashflows) * v < 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/**
 * Analyse financière complète sur la durée de vie.
 * @returns projection année par année + KPI (payback, ROI, TRI, LCOE, etc.)
 */
export function computeFinancials({ kwc, productionAnnuelle, consoAnnuelle, autoconsoRate, params }) {
  const p = params
  const coutBrut = Math.round(kwc * p.coutParKwc)
  const prime = Math.round(Math.min(kwc, 9) * p.primeParKwc)
  const coutNet = Math.max(0, coutBrut - prime)

  const projection = []
  const cashflows = [-coutNet]
  let cumul = -coutNet
  let totalProduction = 0
  let gainAn1 = 0
  let autoconsoKwhAn1 = 0
  let surplusKwhAn1 = 0
  let economie25 = null
  let economie30 = null
  let paybackAnnee = null

  for (let y = 1; y <= p.dureeVieAnnees; y++) {
    const prodY = productionAnnuelle * Math.pow(1 - p.degradationAnnuelle, y - 1)
    const autoconsoY = Math.min(prodY * autoconsoRate, consoAnnuelle)
    const surplusY = Math.max(0, prodY - autoconsoY)
    const prixElecY = p.prixElecKwh * Math.pow(1 + p.inflationElec, y - 1)
    const ecoAutoconso = autoconsoY * prixElecY
    const tarifSurplus = y <= p.dureeContratOA ? p.tarifOAKwh : 0.06
    const revenuSurplus = surplusY * tarifSurplus
    const remplacement = y === p.anneeRemplacementOnduleur ? p.coutRemplacementOnduleur : 0
    const gainY = ecoAutoconso + revenuSurplus - remplacement

    const cumulPrev = cumul
    cumul += gainY
    cashflows.push(gainY)
    totalProduction += prodY

    if (paybackAnnee === null && cumul >= 0) {
      // interpolation linéaire de l'année de remboursement
      const frac = gainY !== 0 ? (-cumulPrev) / gainY : 0
      paybackAnnee = (y - 1) + Math.max(0, Math.min(1, frac))
    }

    if (y === 1) { gainAn1 = gainY; autoconsoKwhAn1 = autoconsoY; surplusKwhAn1 = surplusY }
    if (y === 25) economie25 = cumul
    if (y === 30) economie30 = cumul

    projection.push({
      annee: y,
      production: Math.round(prodY),
      autoconso: Math.round(autoconsoY),
      surplus: Math.round(surplusY),
      gain: Math.round(gainY),
      cumul: Math.round(cumul),
    })
  }

  const gainNetFinal = cumul
  const tri = irr(cashflows)
  const lcoe = totalProduction > 0
    ? (coutNet + p.coutRemplacementOnduleur) / totalProduction
    : 0

  return {
    coutBrut,
    prime,
    coutNet,
    economieAn1: Math.round(gainAn1),
    paybackAnnee,
    gainNet25: economie25 !== null ? Math.round(economie25) : null,
    gainNet30: economie30 !== null ? Math.round(economie30) : null,
    gainNetFinal: Math.round(gainNetFinal),
    roi: coutNet > 0 ? Math.round((gainNetFinal / coutNet) * 100) : 0,
    tri: tri !== null ? +(tri * 100).toFixed(1) : null,
    lcoe: +lcoe.toFixed(3),
    autoconsoKwhAn1: Math.round(autoconsoKwhAn1),
    surplusKwhAn1: Math.round(surplusKwhAn1),
    tauxAutoproduction: consoAnnuelle > 0 ? Math.round((autoconsoKwhAn1 / consoAnnuelle) * 100) : 0,
    tauxCouvertureProd: consoAnnuelle > 0 ? Math.round((productionAnnuelle / consoAnnuelle) * 100) : 0,
    projection,
  }
}
