import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, collection, onSnapshot, deleteDoc, addDoc, query, orderBy, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { migrateStatus, computePriority } from '../utils/rgeApi'

/**
 * useRgeProspection — CRM prospection RGE complet
 * Collections Firestore :
 *   - prospection_rge/{siret} → données prospect + pipeline
 *   - prospection_rge/{siret}/activites/{id} → historique d'activités
 *   - users/{uid}/saved_rge_searches → recherches sauvegardées
 */
export function useRgeProspection() {
  const { user } = useAuth()
  const [prospects, setProspects] = useState({})
  const [savedSearches, setSavedSearches] = useState([])
  const [loadingSearches, setLoadingSearches] = useState(true)

  // ─── Charger tous les prospects (temps réel) ───
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) return

    const colRef = collection(db, 'prospection_rge')
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const map = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        // Migration auto des anciens statuts
        if (data.status && ['contacte', 'pas_interesse', 'client'].includes(data.status)) {
          data.status = migrateStatus(data.status)
        }
        map[d.id] = data
      })
      setProspects(map)
    })

    return unsubscribe
  }, [user])

  // ─── Charger les recherches sauvegardées ───
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      setLoadingSearches(false)
      return
    }

    const colRef = collection(db, 'users', user.uid, 'saved_rge_searches')
    const unsubscribe = onSnapshot(colRef, (snap) => {
      setSavedSearches(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      )
      setLoadingSearches(false)
    }, () => setLoadingSearches(false))

    return unsubscribe
  }, [user])

  // ─── Getters ───

  function getProspectStatus(siret) {
    return prospects[siret] || null
  }

  function getStatusCounts() {
    const counts = {}
    Object.values(prospects).forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1
    })
    return counts
  }

  function getAllProspects() {
    return Object.entries(prospects).map(([siret, data]) => ({ siret, ...data }))
  }

  function getOverdueProspects() {
    const now = new Date().toISOString()
    return Object.entries(prospects)
      .filter(([, p]) => p.nextFollowUp && p.nextFollowUp < now && p.status !== 'gagne' && p.status !== 'perdu')
      .map(([siret, data]) => ({ siret, ...data }))
  }

  function getProspectsByStatus(status) {
    return Object.entries(prospects)
      .filter(([, p]) => p.status === status)
      .map(([siret, data]) => ({ siret, ...data }))
  }

  // ─── Actions prospect ───

  /**
   * Ajouter un prospect au pipeline depuis une recherche ADEME
   */
  async function addProspect(rgeData, sourceSearch) {
    if (!user || !isFirebaseConfigured || !db) return
    if (prospects[rgeData.siret]) return // déjà dans le pipeline

    const now = new Date().toISOString()
    const domaines = [...new Set((rgeData.qualifications || []).map((q) => q.domaine).filter(Boolean))]

    const ref = doc(db, 'prospection_rge', rgeData.siret)
    await setDoc(ref, {
      // Identité
      nom: rgeData.nom || '',
      adresse: rgeData.adresse || '',
      codePostal: rgeData.codePostal || '',
      commune: rgeData.commune || '',
      telephone: rgeData.telephone || '',
      email: rgeData.email || '',
      siteInternet: rgeData.siteInternet || '',
      // Pipeline
      status: 'a_contacter',
      statusChangedAt: now,
      stageHistory: [{ status: 'a_contacter', enteredAt: now }],
      priority: 'basse',
      // RGE
      domaines,
      qualificationCount: (rgeData.qualifications || []).length,
      // Source
      sourceSearch: sourceSearch ? {
        zone: sourceSearch.zone || '',
        domaine: sourceSearch.domaine || '',
        searchDate: now,
      } : null,
      // Meta
      createdAt: now,
      updatedAt: now,
      updatedBy: user.uid,
    })
  }

  /**
   * Changer le statut d'un prospect (avec historique)
   */
  async function setProspectStatusValue(siret, newStatus, lossReason) {
    if (!user || !isFirebaseConfigured || !db) return

    const now = new Date().toISOString()
    const ref = doc(db, 'prospection_rge', siret)

    const update = {
      status: newStatus,
      statusChangedAt: now,
      updatedAt: now,
      updatedBy: user.uid,
      stageHistory: arrayUnion({ status: newStatus, enteredAt: now }),
      priority: computePriority({ ...prospects[siret], status: newStatus }),
    }

    if (newStatus === 'perdu' && lossReason) {
      update.lossReason = lossReason
    }

    await updateDoc(ref, update)
  }

  /**
   * Mettre à jour les données d'un prospect
   */
  async function updateProspect(siret, data) {
    if (!user || !isFirebaseConfigured || !db) return
    const ref = doc(db, 'prospection_rge', siret)
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    })
  }

  /**
   * Définir la priorité manuellement
   */
  async function setPriority(siret, priority) {
    await updateProspect(siret, { priority })
  }

  // ─── Relances ───

  async function setFollowUp(siret, date, type) {
    if (!user || !isFirebaseConfigured || !db) return
    await updateProspect(siret, {
      nextFollowUp: date,
      followUpType: type || 'appel',
    })
  }

  async function clearFollowUp(siret) {
    if (!user || !isFirebaseConfigured || !db) return
    const ref = doc(db, 'prospection_rge', siret)
    await updateDoc(ref, {
      nextFollowUp: null,
      followUpType: null,
      updatedAt: new Date().toISOString(),
    })
  }

  // ─── Activités ───

  async function addActivity(siret, activityData) {
    if (!user || !isFirebaseConfigured || !db) return

    const now = new Date().toISOString()
    const colRef = collection(db, 'prospection_rge', siret, 'activites')

    await addDoc(colRef, {
      type: activityData.type || 'note',
      date: activityData.date || now,
      description: activityData.description || '',
      outcome: activityData.outcome || null,
      duration: activityData.duration || null,
      triggeredStatusChange: activityData.triggeredStatusChange || null,
      createdBy: user.uid,
      createdAt: now,
    })

    // Mettre à jour le prospect
    await updateProspect(siret, { lastActivityAt: now })

    // Si l'activité change le statut
    if (activityData.triggeredStatusChange) {
      await setProspectStatusValue(siret, activityData.triggeredStatusChange, activityData.lossReason)
    }

    // Si relance planifiée dans l'activité
    if (activityData.nextFollowUp) {
      await setFollowUp(siret, activityData.nextFollowUp, activityData.followUpType)
    }
  }

  /**
   * Hook pour écouter les activités d'un prospect spécifique
   */
  function useActivities(siret) {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      if (!siret || !user || !isFirebaseConfigured || !db) {
        setLoading(false)
        return
      }

      const colRef = collection(db, 'prospection_rge', siret, 'activites')
      const q = query(colRef, orderBy('date', 'desc'))

      const unsubscribe = onSnapshot(q, (snap) => {
        setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }, () => setLoading(false))

      return unsubscribe
    }, [siret, user])

    return { activities, loading }
  }

  async function deleteActivity(siret, activityId) {
    if (!user || !isFirebaseConfigured || !db) return
    await deleteDoc(doc(db, 'prospection_rge', siret, 'activites', activityId))
  }

  // ─── Recherches sauvegardées ───

  async function saveSearch(name, filters, resultCount) {
    if (!user || !isFirebaseConfigured || !db) return
    const id = crypto.randomUUID()
    const ref = doc(db, 'users', user.uid, 'saved_rge_searches', id)
    await setDoc(ref, {
      name,
      filters,
      resultCount: resultCount || 0,
      createdAt: new Date().toISOString(),
    })
  }

  async function deleteSavedSearch(id) {
    if (!user || !isFirebaseConfigured || !db) return
    await deleteDoc(doc(db, 'users', user.uid, 'saved_rge_searches', id))
  }

  return {
    // Données
    prospects,
    getAllProspects,
    getProspectStatus,
    getStatusCounts,
    getOverdueProspects,
    getProspectsByStatus,
    // Actions prospect
    addProspect,
    setProspectStatus: setProspectStatusValue,
    updateProspect,
    setPriority,
    // Relances
    setFollowUp,
    clearFollowUp,
    // Activités
    addActivity,
    useActivities,
    deleteActivity,
    // Recherches
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    loadingSearches,
  }
}
