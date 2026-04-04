import { useState, useEffect, useRef } from 'react'
import {
  collection, query, where, getDocs, doc, getDoc, onSnapshot
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * useBeneficiaryData — Donnees du beneficiaire connecte
 */
export function useBeneficiaryData() {
  const { user } = useAuth()
  const { roleData, roleLoading } = useRole()
  const [scenarios, setScenarios] = useState([])
  const [docRequests, setDocRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  // Token depuis roleData ou sessionStorage
  const scenarioToken = roleData?.scenarioToken
    || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('artex360_scenarioToken') : null)
  const projectId = roleData?.projectId
    || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('artex360_projectId') : null)
    || null

  // Timeout de securite
  useEffect(() => {
    const timer = setTimeout(() => { if (loading) setLoading(false) }, 5000)
    return () => clearTimeout(timer)
  }, [loading])

  // Charger les scenarios (une seule fois)
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) { setLoading(false); return }
    if (roleLoading && !scenarioToken) return
    if (!scenarioToken) { setLoading(false); return }
    if (loadedRef.current) return
    loadedRef.current = true

    async function load() {
      const scenarioMap = new Map()

      // 1. Charger le scenario du token
      try {
        const snap = await getDoc(doc(db, 'shared_scenarios', scenarioToken))
        if (snap.exists()) {
          scenarioMap.set(snap.id, { id: snap.id, ...snap.data() })
        }
      } catch { /* ignore */ }

      // 2. Charger tous les scenarios du meme projet (deduplication par Map)
      const pId = projectId || scenarioMap.values().next().value?.projectId
      if (pId) {
        try {
          const q = query(collection(db, 'shared_scenarios'), where('projectId', '==', pId))
          const snap = await getDocs(q)
          snap.docs.forEach((d) => {
            if (!scenarioMap.has(d.id)) {
              scenarioMap.set(d.id, { id: d.id, ...d.data() })
            }
          })
        } catch { /* index manquant → on a deja le scenario du token */ }
      }

      const items = Array.from(scenarioMap.values())
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setScenarios(items)
      setLoading(false)
    }

    load()
  }, [user, scenarioToken, projectId, roleLoading])

  // Charger les documents (temps reel)
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) return

    const q = query(collection(db, 'document_requests'), where('beneficiaryUid', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setDocRequests(items)
    }, () => setDocRequests([]))

    return unsubscribe
  }, [user])

  const first = scenarios[0] || null
  const projectInfo = first ? {
    firstName: first.clientInfo?.firstName || '',
    lastName: first.clientInfo?.lastName || '',
    phone: first.clientInfo?.phone || '',
    email: first.clientInfo?.email || '',
    address: first.clientInfo?.address || '',
    postalCode: first.clientInfo?.postalCode || '',
    city: first.clientInfo?.city || '',
    projectName: first.projectName || '',
    category: first.clientInfo?.category || null,
    categoryLabel: first.clientInfo?.categoryLabel || null,
    dpe: first.clientInfo?.dpe || null,
  } : null

  return {
    scenarios,
    projectInfo,
    docRequests,
    loading,
    pendingDocs: docRequests.filter((d) => d.status === 'en_attente'),
    completedDocs: docRequests.filter((d) => d.status === 'fourni'),
  }
}
