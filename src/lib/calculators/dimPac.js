import { PAC_SIZING } from '../constants/dimPac'
import { ZONE_BASE_TEMPERATURES_DETAIL, ZONE_BASE_TEMPERATURES } from '../constants/zones'
import { getTBaseNfP52612 } from '../services/tBaseLookup'

/**
 * Calculateur DIM-PAC — méthode G pondérée par poste d'isolation.
 * Modèle Artex360 : intersection CEE BAR-TH-171 ∩ DTU 68.16.
 *
 *   CEE   : 60 à 130 % de la cible (déperditions+intermittence+ECS) — appoint élec. implicite
 *   DTU   : 70 à 100 % des déperditions × marge 1,2 — PAC seule
 *   PAC idéale = centre de l'intersection des deux plages, arrondi au kW.
 */

/** Arrondi au kW entier le plus proche. */
function roundToNearestKw(value) {
  if (value <= 0) return 0
  return Math.round(value)
}

/** Résout le T_base selon zone (sous-zone précise ou zone principale). */
function resolveTBase(zone) {
  if (zone in ZONE_BASE_TEMPERATURES_DETAIL) return ZONE_BASE_TEMPERATURES_DETAIL[zone]
  if (zone in ZONE_BASE_TEMPERATURES) return ZONE_BASE_TEMPERATURES[zone]
  return -4 // fallback H2
}

/** Détermine le mode émetteur (BT / MT_HT / mixte) à partir de la sélection. */
function detectEmitterMode(emitters) {
  if (!emitters || emitters.length === 0) return 'none'
  const hasBT = emitters.some(e =>
    e === 'plancher_chauffant' || e === 'mur_chauffant' || e === 'plafond_chauffant',
  )
  const hasHT = emitters.some(e =>
    e === 'radiateur_fonte' || e === 'radiateur_acier_alu',
  )
  if (hasBT && hasHT) return 'mixte'
  if (hasBT) return 'BT'
  return 'MT_HT'
}

export function calculatePacSizing(input) {
  const {
    housingType, surface, ceilingHeight, altitude, indoorTemp,
    construction, insulation,
    heatingSystem, emitters, includeEcs, zone,
    dept,
  } = input

  // ─── 1. Volume ─────────────────────────────────────────────
  const volume = Math.max(0, surface) * Math.max(2, ceilingHeight)

  // ─── 2. G de base (période construction) ──────────────────
  const periodDef = PAC_SIZING.CONSTRUCTION_PERIODS.find(p => p.value === construction)
    ?? PAC_SIZING.CONSTRUCTION_PERIODS[2]
  const gBase = periodDef.gBase
  const intermittenceCoeff = periodDef.intermittence

  // ─── 3. Ratio global pondéré par poste d'isolation ────────
  let ratioGlobal = 0
  const categoryRatios = {}
  for (const cat of PAC_SIZING.INSULATION_CATEGORIES) {
    const selected = insulation?.[cat.key] ?? cat.defaultValue
    const level = cat.levels.find(l => l.value === selected) ?? cat.levels.find(l => l.value === cat.defaultValue)
    ratioGlobal += cat.share * level.ratio
    categoryRatios[cat.key] = { ratio: level.ratio, levelLabel: level.label }
  }

  // ─── 4. G effectif ─────────────────────────────────────────
  let gEffectif = gBase * ratioGlobal
  if (housingType === 'Appartement') gEffectif *= PAC_SIZING.APARTMENT_G_REDUCTION
  gEffectif = Math.max(PAC_SIZING.G_MIN, gEffectif)

  // ─── 5. T_base NF P 52-612 ─────────────────────────────────
  let tBaseCorrigee
  let altitudeCorrection
  let tBaseSource
  const nfInfo = dept ? getTBaseNfP52612(dept, altitude) : null
  if (nfInfo) {
    tBaseCorrigee = nfInfo.tBase
    altitudeCorrection = -nfInfo.correction
    tBaseSource = {
      standard: 'NF P 52-612',
      dept: nfInfo.deptCode,
      deptName: nfInfo.deptName,
      tBaseMer: nfInfo.tBaseMer,
      bracket: nfInfo.bracketLabel,
    }
  } else {
    altitudeCorrection = Math.max(0, altitude) / 200 * PAC_SIZING.ALTITUDE_CORRECTION_PER_200M
    tBaseCorrigee = resolveTBase(zone) - altitudeCorrection
    tBaseSource = { standard: 'RT 2012 (fallback)', zone }
  }
  const deltaT = Math.max(0, indoorTemp - tBaseCorrigee)

  // ─── 6. Déperditions totales ──────────────────────────────
  const deperditionsW = gEffectif * volume * deltaT
  const deperditionsKw = deperditionsW / 1000

  // ─── 7. Répartition par poste ─────────────────────────────
  const deperditionsByCategory = []
  if (ratioGlobal > 0 && deperditionsW > 0) {
    for (const cat of PAC_SIZING.INSULATION_CATEGORIES) {
      const entry = categoryRatios[cat.key]
      const weight = cat.share * entry.ratio
      const share = weight / ratioGlobal
      const watts = share * deperditionsW
      deperditionsByCategory.push({
        key: cat.key,
        label: cat.label,
        watts,
        percentage: share * 100,
        color: cat.color,
        ratio: entry.ratio,
        levelLabel: entry.levelLabel,
      })
    }
    deperditionsByCategory.sort((a, b) => b.watts - a.watts)
  }

  // ─── 8. Intermittence + ECS ───────────────────────────────
  const deperditionsWithIntermittence = deperditionsKw * intermittenceCoeff
  const ecsKw = includeEcs ? PAC_SIZING.ECS_POWER_KW : 0

  // ─── 9. Plage CEE BAR-TH-171 (60-130 %) ───────────────────
  const puissanceCibleKw = deperditionsWithIntermittence + ecsKw
  const safetyMarginKw = puissanceCibleKw * PAC_SIZING.SAFETY_MARGIN
  const puissanceMinKw = puissanceCibleKw * PAC_SIZING.CEE_MIN_COVERAGE
  const puissanceMaxKw = puissanceCibleKw * PAC_SIZING.CEE_MAX_COVERAGE
  const ceePlage = { minKw: puissanceMinKw, maxKw: puissanceMaxKw }

  // ─── 10. Plage DTU 68.16 (PAC seule, marge ×1.2) ──────────
  const dtuBaseKw = deperditionsWithIntermittence
  const dtuPlage = {
    minKw: dtuBaseKw * PAC_SIZING.DTU_MIN_COVERAGE * PAC_SIZING.DTU_SAFETY_FACTOR,
    maxKw: dtuBaseKw * PAC_SIZING.DTU_MAX_COVERAGE * PAC_SIZING.DTU_SAFETY_FACTOR,
    coverageMinKw: dtuBaseKw * PAC_SIZING.DTU_MIN_COVERAGE,
    coverageMaxKw: dtuBaseKw * PAC_SIZING.DTU_MAX_COVERAGE,
  }

  // ─── 11. Intersection CEE ∩ DTU ───────────────────────────
  const interMin = Math.max(ceePlage.minKw, dtuPlage.minKw)
  const interMax = Math.min(ceePlage.maxKw, dtuPlage.maxKw)
  const intersection = { minKw: interMin, maxKw: interMax, valid: interMin <= interMax }

  // ─── 12. Puissance finale recommandée = centre intersection ─
  const recommandeeRaw = intersection.valid
    ? (intersection.minKw + intersection.maxKw) / 2
    : Math.min(dtuBaseKw * PAC_SIZING.DTU_SAFETY_FACTOR, ceePlage.maxKw)
  const puissanceRecommandeeKw = roundToNearestKw(recommandeeRaw)

  // ─── 13. Eligibilité BAR-TH-171 ───────────────────────────
  const heatingDef = PAC_SIZING.HEATING_SYSTEMS.find(h => h.value === heatingSystem)
  const eligibleBarTh171 = heatingDef?.eligibleBarTh171 ?? false
  const barTh171Reason = eligibleBarTh171
    ? `Dépose ${heatingDef?.label.toLowerCase()} — éligible prime CEE BAR-TH-171`
    : heatingSystem === 'electrique'
      ? 'Dépose de radiateurs électriques — NON éligible BAR-TH-171 (nécessite dépose chaudière fossile)'
      : 'Vérifier la nature du chauffage à déposer (fossile requis)'

  // ─── 14. ETAS requise selon émetteurs ─────────────────────
  const emitterMode = detectEmitterMode(emitters)
  const forceHT = includeEcs
  const etasRequired = (emitterMode === 'BT' && !forceHT)
    ? PAC_SIZING.ETAS_BT_REQUIRED
    : PAC_SIZING.ETAS_HT_REQUIRED
  const etasTempRef = (emitterMode === 'BT' && !forceHT) ? 35 : 55

  return {
    gBase,
    gEffectif,
    ratioGlobal,
    volume,
    deltaT,
    tBaseCorrigee,
    tBaseSource,
    altitudeCorrection,
    intermittenceCoeff,

    deperditionsW,
    deperditionsKw,
    deperditionsWithIntermittence,
    deperditionsByCategory,

    ecsKw,
    safetyMarginKw,

    puissanceMinKw,
    puissanceCibleKw,
    puissanceMaxKw,
    ceePlage,
    dtuPlage,
    intersection,
    puissanceRecommandeeKw,

    eligibleBarTh171,
    barTh171Reason,
    emitterMode,
    etasRequired,
    etasTempRef,
  }
}
