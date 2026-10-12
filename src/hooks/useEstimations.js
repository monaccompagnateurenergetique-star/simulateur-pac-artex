import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { calculateBarTh174 } from '../lib/calculators/barTh174'
import { calculateBarTh171 } from '../lib/calculators/barTh171'
import { MPR_GRANTS } from '../lib/constants/mpr'
import {
  MONTANT_UNITAIRE,
  SURFACE_FACTORS,
  BONUS_PRECARITE,
  CLASS_ORDER,
  MPR_PARCOURS_TAUX,
  MPR_PARCOURS_PLAFOND,
  AMO_PLAFOND,
  AMO_TAUX,
  ECRETEMENT,
} from '../lib/constants/renovationGlobale'
import { ZONE_FACTORS } from '../lib/constants/zones'

const CATEGORIES = ['Bleu', 'Jaune', 'Violet', 'Rose']

function getSurfaceFactor(surface) {
  for (const { max, factor } of SURFACE_FACTORS) {
    if (surface <= max) return factor
  }
  return 1.3
}

function getClassJump(initiale, cible) {
  const i = CLASS_ORDER.indexOf(initiale)
  const c = CLASS_ORDER.indexOf(cible)
  if (i < 0 || c < 0) return 0
  return c - i
}

/**
 * Calcule la synthèse financière pour les 4 catégories de revenus
 */
export function computeMultiCategorySynthesis({
  typeLogement,
  surface,
  classInitiale,
  classeCible,
  zone,
  travaux,
  projectCostHT,
  projectCostTTC,
  priceMWh = 7,
  ceePercent = 100,
  includePAC = false,
  pacParams = {},
}) {
  const jump = getClassJump(classInitiale, classeCible)
  const isRenoGlobale = jump >= 2
  const isDpeEFG = ['E', 'F', 'G'].includes(classInitiale)
  const surfaceFactor = getSurfaceFactor(surface)
  const clampedJump = Math.min(jump, 4)

  const results = {}

  for (const cat of CATEGORIES) {
    let ceeTh174 = 0
    let ceeTh171 = 0
    let mprAmount = 0
    let amoAmount = 0

    // --- CEE BAR-TH-174/175 (rénovation globale) ---
    if (isRenoGlobale) {
      const montantUnitaire = MONTANT_UNITAIRE[clampedJump] || MONTANT_UNITAIRE[2]
      const bonus = BONUS_PRECARITE[cat] || 1
      const volumeCEE = montantUnitaire * surfaceFactor * bonus
      ceeTh174 = Math.round((volumeCEE / 1000) * priceMWh * 100) / 100
    }

    // --- CEE BAR-TH-171 (PAC air/eau) ---
    if (includePAC && pacParams.type && pacParams.etas) {
      const pacResult = calculateBarTh171({
        type: pacParams.type,
        surface,
        etas: pacParams.etas,
        zone: zone || 'H1',
        priceMWh,
      })
      ceeTh171 = pacResult.ceeEuros || 0
    }

    const ceeTotal = ceeTh174 + ceeTh171
    const ceeApplied = Math.round(ceeTotal * (ceePercent / 100) * 100) / 100

    // --- MPR Parcours Accompagné (DPE E/F/G uniquement) ---
    if (isDpeEFG && isRenoGlobale) {
      const taux = MPR_PARCOURS_TAUX[clampedJump]?.[cat] || 0
      const plafond = MPR_PARCOURS_PLAFOND[clampedJump] || 30000
      const depenseEligible = Math.min(projectCostHT, plafond)
      mprAmount = Math.round(depenseEligible * taux)

      // AMO
      const amoTaux = AMO_TAUX[cat] || 0
      amoAmount = Math.round(AMO_PLAFOND * amoTaux)

      // Écrêtement
      const ecretement = ECRETEMENT[cat] || 1
      const plafondTotal = Math.round(projectCostTTC * ecretement)
      const totalBrut = ceeApplied + mprAmount + amoAmount
      if (totalBrut > plafondTotal) {
        const excess = totalBrut - plafondTotal
        mprAmount = Math.max(0, mprAmount - excess)
      }
    }

    // --- MPR geste seul (PAC) si pas réno globale ---
    if (!isRenoGlobale && includePAC) {
      mprAmount = MPR_GRANTS['bar-th-171']?.[cat] || 0
    }

    const totalAides = ceeApplied + mprAmount + amoAmount
    const resteACharge = Math.max(0, projectCostTTC - totalAides)
    const tauxCouverture = projectCostTTC > 0
      ? Math.round((totalAides / projectCostTTC) * 100)
      : 0

    results[cat] = {
      ceeRenoGlobale: ceeTh174,
      ceePAC: ceeTh171,
      ceeTotal,
      ceeApplied,
      mprAmount,
      amoAmount,
      totalAides,
      resteACharge,
      tauxCouverture,
      jump,
    }
  }

  return results
}

export function useEstimations(agencyId) {
  const { user } = useAuth()
  const [estimations, setEstimations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !db || !agencyId) {
      setEstimations([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'agencies', agencyId, 'estimations'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEstimations(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (error) => {
        console.warn('Estimations sync error:', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, agencyId])

  const addEstimation = useCallback(
    async (data) => {
      if (!user || !db || !agencyId) return null
      const id = `est_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const estimation = {
        ...data,
        id,
        agencyId,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        updatedAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'agencies', agencyId, 'estimations', id), estimation)
      return id
    },
    [user, agencyId]
  )

  const updateEstimation = useCallback(
    async (id, data) => {
      if (!user || !db || !agencyId) return
      await setDoc(
        doc(db, 'agencies', agencyId, 'estimations', id),
        { ...data, updatedAt: new Date().toISOString() },
        { merge: true }
      )
    },
    [user, agencyId]
  )

  const deleteEstimation = useCallback(
    async (id) => {
      if (!user || !db || !agencyId) return
      await deleteDoc(doc(db, 'agencies', agencyId, 'estimations', id))
    },
    [user, agencyId]
  )

  const getEstimation = useCallback(
    (id) => estimations.find((e) => e.id === id) || null,
    [estimations]
  )

  return {
    estimations,
    loading,
    addEstimation,
    updateEstimation,
    deleteEstimation,
    getEstimation,
  }
}
