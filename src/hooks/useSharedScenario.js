import { useState, useEffect, useCallback } from 'react'
import {
  doc,
  setDoc,
  getDoc,
  collection,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * useShareScenario — Partager un scenario via lien unique
 * Stocke dans shared_scenarios/{token}
 */
export function useShareScenario() {
  const { user } = useAuth()
  const { orgId } = useRole()

  const shareScenario = useCallback(
    async ({ projectId, projectName, scenarioId, scenarioName, simulations, totals, clientInfo }) => {
      if (!isFirebaseConfigured || !db || !user) return null

      const token = crypto.randomUUID()
      const sharedData = {
        token,
        projectId,
        projectName: projectName || '',
        scenarioId,
        scenarioName: scenarioName || '',
        simulations: simulations || [],
        totals: totals || {},
        clientInfo: clientInfo || {},
        sharedBy: user.uid,
        orgId: orgId || null,
        beneficiaryUid: null,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        viewCount: 0,
      }

      await setDoc(doc(db, 'shared_scenarios', token), sharedData)
      return token
    },
    [user, orgId]
  )

  return { shareScenario }
}

/**
 * useSharedScenarioView — Lire un scenario partage (public, pas besoin d'auth)
 */
export function useSharedScenarioView(token) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token || !isFirebaseConfigured || !db) {
      setLoading(false)
      setError('Lien invalide')
      return
    }

    async function load() {
      try {
        const docRef = doc(db, 'shared_scenarios', token)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          setData({ id: snap.id, ...snap.data() })
          // Incrementer le compteur de vues
          setDoc(docRef, { viewCount: (snap.data().viewCount || 0) + 1 }, { merge: true }).catch(() => {})
        } else {
          setError('Scénario introuvable ou expiré')
        }
      } catch (err) {
        setError('Erreur de chargement')
        console.warn('useSharedScenarioView:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  return { data, loading, error }
}
