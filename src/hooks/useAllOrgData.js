import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, getDocs
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * useAllOrgData — Pour le super admin : charge une collection de TOUTES les organisations
 * Retourne les items avec orgId et orgName attaches
 */
export function useAllOrgData(collectionName) {
  const { user } = useAuth()
  const { isSuperAdmin } = useRole()
  const [allData, setAllData] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)

  // Charger la liste des orgs
  useEffect(() => {
    if (!user || !isSuperAdmin() || !isFirebaseConfigured || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(collection(db, 'organizations'), (snap) => {
      setOrgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.warn('[useAllOrgData] Erreur lecture orgs:', err.message)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  // Charger les donnees de chaque org
  useEffect(() => {
    if (!orgs.length || !isFirebaseConfigured || !db) {
      if (!orgs.length) setLoading(false)
      return
    }

    const unsubscribes = []
    const orgDataMap = {}

    orgs.forEach((org) => {
      const colRef = collection(db, 'organizations', org.id, collectionName)
      const unsub = onSnapshot(colRef, (snap) => {
        console.log(`[useAllOrgData] ${org.name}: ${snap.docs.length} ${collectionName}`)
        orgDataMap[org.id] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          _orgId: org.id,
          _orgName: org.name || org.id,
        }))
        // Combiner toutes les orgs
        const combined = Object.values(orgDataMap).flat()
        setAllData(combined)
        setLoading(false)
      })
      unsubscribes.push(unsub)
    })

    return () => unsubscribes.forEach((u) => u())
  }, [orgs, collectionName])

  return { allData, orgs, loading }
}
