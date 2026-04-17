import { PAC_SIZING } from '../constants/dimPac'
import { ZONE_BASE_TEMPERATURES_DETAIL, ZONE_BASE_TEMPERATURES } from '../constants/zones'

/**
 * Calculateur DIM-PAC : méthode G pondérée par poste d'isolation.
 * Conforme Guide CEE BAR-TH-171 (10/2025)
 *
 * @param {Object} input
 * @param {'Maison'|'Appartement'} input.housingType
 * @param {number} input.surface              - m²
 * @param {number} input.ceilingHeight        - m
 * @param {number} input.nbEtages             - 1..5+
 * @param {string} input.zone                 - H1a/H1b/H1c/H2a/H2b/H2c/H2d/H3
 * @param {number} input.altitude             - m
 * @param {number} input.indoorTemp           - °C (défaut 19)
 * @param {string} input.construction         - période construction
 * @param {Object} input.insulation           - config par poste
 * @param {string} input.heatingSystem        - gaz/fioul/charbon/electrique/autre
 * @param {string[]} input.emitters           - types d'émetteurs (multi)
 * @param {boolean} input.includeEcs
 */
export function calculatePacSizing(input) {
  const {
    housingType, surface, ceilingHeight, zone, altitude, indoorTemp,
    construction, insulation,
    heatingSystem, emitters, includeEcs,
  } = input

  // ─── 1. Volume chauffé ─────────────────────────────────────
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
  if (housingType === 'Appartement') {
    gEffectif *= PAC_SIZING.APARTMENT_G_REDUCTION
  }
  gEffectif = Math.max(PAC_SIZING.G_MIN, gEffectif)

  // ─── 5. T_base + altitude ─────────────────────────────────
  const altitudeCorrection = Math.max(0, altitude) / 200 * PAC_SIZING.ALTITUDE_CORRECTION_PER_200M
  const tBaseZone = ZONE_BASE_TEMPERATURES_DETAIL[zone] ?? ZONE_BASE_TEMPERATURES[zone] ?? -4
  const tBaseCorrigee = tBaseZone - altitudeCorrection
  const deltaT = Math.max(0, indoorTemp - tBaseCorrigee)

  // ─── 6. Déperditions totales ──────────────────────────────
  const deperditionsW = gEffectif * volume * deltaT
  const deperditionsKw = deperditionsW / 1000

  // ─── 7. Répartition par poste (pour pie chart) ────────────
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
  const puissanceCibleKw = deperditionsWithIntermittence + ecsKw

  // ─── 9. Marges & plage BAR-TH-171 (60-130%) ──────────────
  const safetyMarginKw = puissanceCibleKw * PAC_SIZING.SAFETY_MARGIN
  const puissanceMinKw = puissanceCibleKw * PAC_SIZING.MIN_COVERAGE
  const puissanceMaxKw = puissanceCibleKw * PAC_SIZING.MAX_COVERAGE
  const puissanceRecommandeeKw = roundToEvenKw(puissanceCibleKw + safetyMarginKw)

  // ─── 10. Eligibilité BAR-TH-171 ───────────────────────────
  const heatingDef = PAC_SIZING.HEATING_SYSTEMS.find(h => h.value === heatingSystem)
  const eligibleBarTh171 = heatingDef?.eligibleBarTh171 ?? false
  const barTh171Reason = eligibleBarTh171
    ? `Dépose ${heatingDef?.label.toLowerCase()} — éligible prime CEE BAR-TH-171`
    : heatingSystem === 'electrique'
      ? 'Dépose de radiateurs électriques — NON éligible BAR-TH-171 (nécessite dépose chaudière fossile)'
      : 'Vérifier la nature du chauffage à déposer (fossile requis)'

  // ─── 11. ETAS requise selon émetteurs ─────────────────────
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
    puissanceRecommandeeKw,
    eligibleBarTh171,
    barTh171Reason,
    emitterMode,
    etasRequired,
    etasTempRef,
  }
}

/** Arrondi au kW pair supérieur (aligne les gammes commerciales PAC) */
function roundToEvenKw(value) {
  if (value <= 0) return 0
  return Math.ceil(value / 2) * 2
}

/** Détermine le mode émetteur (BT / MT_HT / mixte) à partir de la sélection */
function detectEmitterMode(emitters) {
  if (!emitters || emitters.length === 0) return 'none'
  const hasBT = emitters.some(e =>
    e === 'plancher_chauffant' || e === 'mur_chauffant' || e === 'plafond_chauffant'
  )
  const hasHT = emitters.some(e =>
    e === 'radiateur_fonte' || e === 'radiateur_acier_alu'
  )
  if (hasBT && hasHT) return 'mixte'
  if (hasBT) return 'BT'
  return 'MT_HT'
}
