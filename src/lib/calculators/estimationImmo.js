import { calculateBarTh171 } from './barTh171'
import { calculateBarTh112 } from './barTh112'
import { calculateBarTh113 } from './barTh113'
import { calculateBarEn101 } from './barEn101'
import { calculateBarEn102 } from './barEn102'
import { calculateBarEn103 } from './barEn103'
import { calculateRenovationGlobale } from './renovationGlobale'
import { MPR_GRANTS, MAX_AID_PERCENTAGE } from '../constants/mpr'
import { BONUS_PRECARITE, PRIX_CEE_DEFAUT } from '../constants/renovationGlobale'

const CATEGORIES = ['Bleu', 'Jaune', 'Violet', 'Rose']

function getPriceMWh(category) {
  return category === 'Bleu' ? PRIX_CEE_DEFAUT.precaire : PRIX_CEE_DEFAUT.classique
}

function computeCeeForItem(item, params, category) {
  const { ficheCode } = item
  if (!ficheCode) return { volumeCEE: 0, ceeEuros: 0 }

  const priceMWh = getPriceMWh(category)

  if (ficheCode === 'bar-th-171') {
    const type = params.typeLogement === 'appartement' ? 'Appartement' : 'Maison'
    const result = calculateBarTh171({
      type,
      surface: params.surface || 100,
      etas: 'high',
      zone: params.zone || 'H2',
      priceMWh,
    })
    return { volumeCEE: Math.round(result.volumeCEE), ceeEuros: Math.round(result.ceeEuros) }
  }

  if (ficheCode === 'bar-en-101') {
    const result = calculateBarEn101({
      surface: item.quantite || params.surface || 50,
      zone: params.zone || 'H2',
      priceMWh,
    })
    return { volumeCEE: Math.round(result.volumeCEE), ceeEuros: Math.round(result.ceeEuros) }
  }

  if (ficheCode === 'bar-en-102') {
    const result = calculateBarEn102({
      surface: item.quantite || params.surface || 80,
      zone: params.zone || 'H2',
      priceMWh,
    })
    return { volumeCEE: Math.round(result.volumeCEE), ceeEuros: Math.round(result.ceeEuros) }
  }

  if (ficheCode === 'bar-en-103') {
    const result = calculateBarEn103({
      surface: item.quantite || params.surface || 60,
      zone: params.zone || 'H2',
      priceMWh,
    })
    return { volumeCEE: Math.round(result.volumeCEE), ceeEuros: Math.round(result.ceeEuros) }
  }

  return { volumeCEE: 0, ceeEuros: 0 }
}

function computeMprForItem(item, category) {
  const { ficheCode } = item
  if (!ficheCode) return 0
  const grants = MPR_GRANTS[ficheCode]
  if (!grants) return 0

  const amount = grants[category] || 0
  if (ficheCode === 'bar-en-102' && item.quantite) {
    return Math.round(amount * item.quantite)
  }
  return amount
}

export function computeEstimationSynthese({ travaux, totalTravauxTTC, params }) {
  const synthese = {}

  for (const cat of CATEGORIES) {
    let totalCEE = 0
    let totalMPR = 0
    const detailParPoste = []

    for (const item of travaux) {
      const cee = computeCeeForItem(item, params, cat)
      const mpr = computeMprForItem(item, cat)
      totalCEE += cee.ceeEuros
      totalMPR += mpr
      detailParPoste.push({
        code: item.code,
        label: item.label,
        prixTTC: item.prixTTC * (item.quantite || 1),
        cee: cee.ceeEuros,
        mpr,
      })
    }

    const maxAid = MAX_AID_PERCENTAGE[cat] * totalTravauxTTC
    let totalAides = Math.round(totalCEE + totalMPR)
    if (totalAides > maxAid) totalAides = Math.round(maxAid)

    const resteACharge = Math.max(0, Math.round(totalTravauxTTC - totalAides))
    const tauxCouverture = totalTravauxTTC > 0 ? Math.round((totalAides / totalTravauxTTC) * 100) : 0

    synthese[cat.toLowerCase()] = {
      cee: Math.round(totalCEE),
      mpr: Math.round(totalMPR),
      totalAides,
      resteACharge,
      tauxCouverture,
      detail: detailParPoste,
    }
  }

  return synthese
}

export function computeSimulationForAllCategories(ficheCode, inputs, estimation) {
  const results = {}
  for (const cat of CATEGORIES) {
    const priceMWh = cat === 'Bleu' ? PRIX_CEE_DEFAUT.precaire : PRIX_CEE_DEFAUT.classique

    let cee = 0, mpr = 0, volumeCEE = 0

    if (ficheCode === 'BAR-TH-171') {
      const r = calculateBarTh171({ ...inputs, priceMWh })
      volumeCEE = r.volumeCEE
      cee = Math.round(r.ceeEuros)
      const grants = MPR_GRANTS['bar-th-171']
      mpr = grants?.[cat] || 0
    }

    if (ficheCode === 'BAR-TH-112') {
      const r = calculateBarTh112({ ...inputs, mprCategory: cat, priceMWh })
      volumeCEE = r.volumeCEE
      cee = Math.round(r.ceeEuros)
      const grants = MPR_GRANTS['bar-th-112']
      mpr = grants?.[cat] || 0
    }

    if (ficheCode === 'BAR-TH-113') {
      const r = calculateBarTh113({ ...inputs, mprCategory: cat, priceMWh })
      volumeCEE = r.volumeCEE
      cee = Math.round(r.ceeEuros)
      const grants = MPR_GRANTS['bar-th-113']
      mpr = grants?.[cat] || 0
    }

    if (ficheCode === 'BAR-EN-101') {
      const r = calculateBarEn101({ ...inputs, priceMWh })
      volumeCEE = r.volumeCEE
      cee = Math.round(r.ceeEuros)
      const grants = MPR_GRANTS['bar-en-101']
      if (grants) mpr = Math.round((grants[cat] || 0) * (inputs.surface || 0))
    }

    if (ficheCode === 'BAR-EN-102') {
      const r = calculateBarEn102({ ...inputs, priceMWh })
      volumeCEE = r.volumeCEE
      cee = Math.round(r.ceeEuros)
      const grants = MPR_GRANTS['bar-en-102']
      if (grants) mpr = Math.round((grants[cat] || 0) * (inputs.surface || 0))
    }

    if (ficheCode === 'BAR-EN-103') {
      const r = calculateBarEn103({ ...inputs, priceMWh })
      volumeCEE = r.volumeCEE
      cee = Math.round(r.ceeEuros)
    }

    if (ficheCode === 'BAR-TH-174' || ficheCode === 'BAR-TH-175') {
      const projectCostTTC = Math.round((inputs.projectCostHT || 30000) * 1.055)
      const r = calculateRenovationGlobale({
        classInitiale: inputs.classInitiale,
        classCible: inputs.classCible,
        surface: inputs.surface,
        mprCategory: cat,
        projectCostHT: inputs.projectCostHT || 30000,
        projectCostTTC,
      })
      cee = r.mode === 'cee' ? Math.round(r.ceeEuros || 0) : 0
      mpr = r.mode === 'anah' ? Math.round(r.mprAmount || 0) : 0
      volumeCEE = r.volumeCEE || 0
    }

    results[cat] = { cee, mpr, volumeCEE }
  }
  return results
}

export function computeRenovationGlobaleSynthese({ classInitiale, classCible, surface, projectCostTTC }) {
  const projectCostHT = Math.round(projectCostTTC / 1.055)
  const synthese = {}

  for (const cat of CATEGORIES) {
    const result = calculateRenovationGlobale({
      classInitiale,
      classCible,
      surface,
      mprCategory: cat,
      projectCostHT,
      projectCostTTC,
    })

    synthese[cat.toLowerCase()] = {
      mode: result.mode,
      cee: result.mode === 'cee' ? Math.round(result.ceeEuros || 0) : 0,
      mpr: result.mode === 'anah' ? Math.round(result.mprAmount || 0) : 0,
      totalAides: Math.round(result.totalAides || 0),
      resteACharge: Math.round(result.resteACharge || 0),
      tauxCouverture: projectCostTTC > 0 ? Math.round((result.totalAides / projectCostTTC) * 100) : 0,
      jumps: result.jumps,
    }
  }

  return synthese
}
