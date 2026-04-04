import { useState, useEffect } from 'react'
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

/**
 * useMinisite — Charge le profil et la config minisite d'un installateur via son slug
 * Lit: slugs/{slug} → orgId, puis organizations/{orgId}/profile/info + organizations/{orgId}/minisite/config
 */
export function useMinisite(slug) {
  const [orgData, setOrgData] = useState(null)
  const [minisiteConfig, setMinisiteConfig] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug || !isFirebaseConfigured || !db) {
      setLoading(false)
      setError('Lien invalide')
      return
    }

    async function load() {
      try {
        // 1. Resoudre le slug → orgId
        const slugSnap = await getDoc(doc(db, 'slugs', slug))
        if (!slugSnap.exists()) {
          setError('Installateur introuvable')
          setLoading(false)
          return
        }
        const resolvedOrgId = slugSnap.data().orgId

        // 2. Charger le profil de l'org
        const profileSnap = await getDoc(doc(db, 'organizations', resolvedOrgId, 'profile', 'info'))
        const profile = profileSnap.exists() ? profileSnap.data() : {}

        // 3. Charger la config minisite
        const msSnap = await getDoc(doc(db, 'organizations', resolvedOrgId, 'minisite', 'config'))
        const msConfig = msSnap.exists() ? msSnap.data() : {}

        setOrgId(resolvedOrgId)
        setOrgData(profile)
        setMinisiteConfig(msConfig)
      } catch (err) {
        console.warn('useMinisite:', err)
        setError('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug])

  return { orgData, minisiteConfig, orgId, loading, error }
}
