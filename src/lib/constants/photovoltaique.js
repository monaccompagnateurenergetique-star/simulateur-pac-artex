/* ════════════════════════════════════════════════════════════════
   Photovoltaïque — Constantes (production + finance)
   Modèle de production LOCAL (PVGIS = CORS bloqué côté navigateur).
   Toutes les valeurs financières sont des DÉFAUTS ÉDITABLES dans le
   simulateur (tarifs et coûts évoluent souvent).
   ════════════════════════════════════════════════════════════════ */

/* ── Régions : productible de référence (kWh/kWc/an) pour une
      installation Sud, inclinaison ~30° (PR déjà inclus). ── */
export const PV_REGIONS = [
  { value: 'nord',   label: 'Nord',                 examples: 'Hauts-de-France, Normandie, Bretagne, Grand Est nord', productible: 950 },
  { value: 'centre', label: 'Centre / Île-de-France', examples: 'IDF, Centre-Val de Loire, Pays de la Loire, Bourgogne', productible: 1100 },
  { value: 'sudouest', label: 'Sud-Ouest / Vallée du Rhône', examples: 'Nouvelle-Aquitaine, vallée du Rhône, Drôme', productible: 1280 },
  { value: 'sud',    label: 'Sud méditerranéen',    examples: 'Occitanie, PACA, Corse', productible: 1400 },
]

/* ── Orientation (facteur relatif, 1.0 = plein Sud) ── */
export const PV_ORIENTATIONS = [
  { value: 'sud',   label: 'Sud',              factor: 1.00 },
  { value: 'sudest', label: 'Sud-Est / Sud-Ouest', factor: 0.96 },
  { value: 'estouest', label: 'Est / Ouest',  factor: 0.86 },
  { value: 'nordest', label: 'Nord-Est / Nord-Ouest', factor: 0.72 },
  { value: 'nord',  label: 'Nord',             factor: 0.58 },
]

/* ── Facteur d'inclinaison (relatif, 1.0 = ~30°) ── */
const TILT_TABLE = [
  [0, 0.90], [10, 0.94], [20, 0.98], [30, 1.00],
  [40, 0.99], [45, 0.98], [60, 0.93], [75, 0.85], [90, 0.75],
]
export function tiltFactor(deg) {
  const d = Math.max(0, Math.min(90, Number(deg) || 0))
  for (let i = 0; i < TILT_TABLE.length - 1; i++) {
    const [a, fa] = TILT_TABLE[i]
    const [b, fb] = TILT_TABLE[i + 1]
    if (d >= a && d <= b) return fa + (fb - fa) * ((d - a) / (b - a))
  }
  return 1.0
}

/* ── Répartition mensuelle de la production (France, somme = 1) ── */
export const PV_MONTHLY_PROFILE = [
  0.037, 0.052, 0.083, 0.103, 0.118, 0.123,
  0.128, 0.116, 0.095, 0.068, 0.043, 0.034,
]
export const PV_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

/* ── Panneau standard ── */
export const PV_PANEL = {
  puissanceWc: 500,   // panneau moderne ~500 Wc
  surfaceM2: 2.0,     // ~2 m² par panneau
}

/* ── Coût clé en main TTC (€/kWc) par taille — éditable ── */
export function coutParKwc(kwc) {
  if (kwc <= 3) return 2900
  if (kwc <= 6) return 2450
  if (kwc <= 9) return 2150
  return 1900
}

/* ── Tailles d'installation standard (kWc) ── */
export const PV_SIZES = [3, 4, 5, 6, 7, 8, 9]

/* ── Hypothèses financières par défaut (éditables) ── */
export const PV_DEFAULTS = {
  prixElecKwh: 0.25,        // €/kWh TTC payé au fournisseur
  inflationElec: 0.03,      // +3 %/an (hypothèse hausse du prix élec)
  tarifOAKwh: 0.04,         // €/kWh — rachat du surplus (Obligation d'Achat, ≤ 9 kWc)
  dureeContratOA: 20,       // ans — durée du contrat de rachat
  primeParKwc: 100,         // €/kWc — prime à l'autoconsommation (≤ 9 kWc)
  degradationAnnuelle: 0.0045, // -0.45 %/an de production
  dureeVieAnnees: 30,       // durée de vie des panneaux
  anneeRemplacementOnduleur: 15,
  coutRemplacementOnduleur: 1200, // €
}

/* ── Taux d'autoconsommation : base + bonus selon profil ── */
export const PV_AUTOCONSO = {
  base: 0.30,
  bonusPresenceJour: 0.15,
  bonusBallonEcs: 0.12,
  bonusVoitureElec: 0.10,
  max: 0.75,
}

/* ── Batterie : options de stockage résidentiel ── */
export const PV_BATTERY_SIZES = [0, 5, 10, 15] // kWh
export const PV_BATTERY_DEFAULTS = {
  coutParKwh: 600,           // €/kWh installé (tendance 2024-2025)
  efficienceRoundTrip: 0.90, // rendement charge/décharge
  cyclesJournaliers: 1,      // 1 cycle/jour typique
  dureeVieAnnees: 15,        // garantie constructeur
  degradationAnnuelle: 0.02, // -2%/an capacité
}

/**
 * Bonus d'autoconsommation apporté par une batterie.
 * Modèle simplifié : la batterie capte le surplus diurne et le restitue
 * la nuit. Le gain dépend du ratio stockage/production quotidienne.
 */
export function batteryAutoconsoBonus(batteryKwh, dailyProductionKwh, currentAutoconsoRate) {
  if (!batteryKwh || batteryKwh <= 0) return 0
  const surplusJour = dailyProductionKwh * (1 - currentAutoconsoRate)
  if (surplusJour <= 0) return 0
  const captured = Math.min(
    batteryKwh * PV_BATTERY_DEFAULTS.efficienceRoundTrip,
    surplusJour,
  )
  return dailyProductionKwh > 0 ? captured / dailyProductionKwh : 0
}

/**
 * Optimiseur de batterie : compare chaque taille et recommande la meilleure.
 * Critère : gain net maximal sur la durée de vie de la batterie.
 * Retourne un tableau d'analyses triées par pertinence, avec un flag `optimal`.
 */
export function optimizeBattery({ annualProductionKwh, consoAnnuelle, autoconsoRate, prixElecKwh, inflationElec }) {
  const dailyProd = annualProductionKwh / 365
  const surplusJour = dailyProd * (1 - autoconsoRate)
  const duree = PV_BATTERY_DEFAULTS.dureeVieAnnees

  const analyses = PV_BATTERY_SIZES.filter(s => s > 0).map(size => {
    const cout = size * PV_BATTERY_DEFAULTS.coutParKwh
    // Énergie captée par jour (limitée par le surplus réel)
    const captured = Math.min(size * PV_BATTERY_DEFAULTS.efficienceRoundTrip, surplusJour)
    // Surplus restant après batterie
    const surplusRestant = Math.max(0, surplusJour - captured)
    // % du surplus capté
    const captureRate = surplusJour > 0 ? Math.round((captured / surplusJour) * 100) : 0
    // Taux d'autoconsommation avec batterie
    const autoconsoAvec = Math.min(0.95, autoconsoRate + (dailyProd > 0 ? captured / dailyProd : 0))
    // Gains cumulés sur la durée de vie (avec inflation élec + dégradation batterie)
    let gainCumule = 0
    for (let y = 1; y <= duree; y++) {
      const prixY = prixElecKwh * Math.pow(1 + inflationElec, y - 1)
      const capDeg = captured * Math.pow(1 - PV_BATTERY_DEFAULTS.degradationAnnuelle, y - 1)
      gainCumule += capDeg * 365 * prixY
    }
    const gainNet = Math.round(gainCumule - cout)
    const payback = gainCumule > 0 ? +(cout / (gainCumule / duree)).toFixed(1) : null
    const roi = cout > 0 ? Math.round((gainNet / cout) * 100) : 0

    return {
      size,
      cout,
      capturedKwhJour: Math.round(captured * 10) / 10,
      captureRate,
      autoconsoAvec: Math.round(autoconsoAvec * 100),
      gainAnnuelMoyen: Math.round(gainCumule / duree),
      gainNet,
      payback,
      roi,
      surplusRestant: Math.round(surplusRestant * 10) / 10,
      surdimensionne: captured < size * PV_BATTERY_DEFAULTS.efficienceRoundTrip * 0.6,
    }
  })

  // Trouver l'optimal : meilleur gain net, en excluant les surdimensionnées
  const viable = analyses.filter(a => a.gainNet > 0)
  let bestIdx = -1
  if (viable.length > 0) {
    // Parmi les viables, prendre le meilleur ROI
    let bestRoi = -Infinity
    for (const v of viable) {
      if (v.roi > bestRoi && !v.surdimensionne) { bestRoi = v.roi; bestIdx = analyses.indexOf(v) }
    }
    // Fallback si toutes surdimensionnées mais rentables
    if (bestIdx === -1) {
      bestRoi = -Infinity
      for (const v of viable) {
        if (v.roi > bestRoi) { bestRoi = v.roi; bestIdx = analyses.indexOf(v) }
      }
    }
  }

  return analyses.map((a, i) => ({ ...a, optimal: i === bestIdx }))
}

/* ── Détection automatique de la région par latitude ── */
export function regionFromLatitude(lat) {
  if (lat >= 47.5) return 'nord'
  if (lat >= 45.5) return 'centre'
  if (lat >= 43.5) return 'sudouest'
  return 'sud'
}

/* ── Options du wizard ── */
export const PV_PRESENCE_OPTIONS = [
  { value: 'absent', label: 'Absent en journée' },
  { value: 'partiel', label: 'Présence partielle' },
  { value: 'present', label: 'Présent en journée' },
]
export const PV_MOTIVATIONS = [
  { value: 'facture', label: 'Réduire ma facture', icon: 'Euro' },
  { value: 'autonomie', label: 'Gagner en autonomie', icon: 'Battery' },
  { value: 'ecologie', label: 'Geste écologique', icon: 'Leaf' },
  { value: 'revente', label: 'Revente / rendement', icon: 'TrendingUp' },
]
