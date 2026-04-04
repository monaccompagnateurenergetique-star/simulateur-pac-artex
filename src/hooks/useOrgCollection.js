import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * useOrgCollection — Hook Firestore org-scoped
 *
 * Si l'utilisateur a un orgId : lit/ecrit dans organizations/{orgId}/{collectionName}
 * Sinon : fallback localStorage (mode hors-ligne ou pas encore assigne)
 *
 * Meme API que useFirestore pour faciliter la migration
 */
export function useOrgCollection(collectionName, localStorageKey, initialValue = []) {
  const { user } = useAuth()
  const { orgId } = useRole()
  const [data, setData] = useState(() => {
    try {
      const stored = window.localStorage.getItem(localStorageKey)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })
  const [synced, setSynced] = useState(false)
  const skipNextLocalSync = useRef(false)

  // ── Sync FROM Firestore (org-scoped, temps reel) ──
  useEffect(() => {
    if (!user || !orgId || !isFirebaseConfigured || !db) {
      setSynced(false)
      return
    }

    const colRef = collection(db, 'organizations', orgId, collectionName)
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        skipNextLocalSync.current = true
        setData(docs)
        // Cache local
        try {
          window.localStorage.setItem(localStorageKey, JSON.stringify(docs))
        } catch { /* quota exceeded */ }
        setSynced(true)
      },
      (error) => {
        console.warn(`OrgCollection sync error (${collectionName}):`, error)
        setSynced(false)
      }
    )

    return unsubscribe
  }, [user, orgId, collectionName, localStorageKey])

  // ── Sync localStorage quand pas connecte/pas d'org ──
  useEffect(() => {
    if (skipNextLocalSync.current) {
      skipNextLocalSync.current = false
      return
    }
    if (!user || !orgId) {
      try {
        window.localStorage.setItem(localStorageKey, JSON.stringify(data))
      } catch { /* quota exceeded */ }
    }
  }, [data, user, orgId, localStorageKey])

  // ── Ecriture ──
  const setItem = useCallback(
    async (item) => {
      if (!item.id) return

      setData((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        const idx = arr.findIndex((d) => d.id === item.id)
        if (idx >= 0) {
          const next = [...arr]
          next[idx] = item
          return next
        }
        return [...arr, item]
      })

      if (user && orgId && isFirebaseConfigured) {
        try {
          const docRef = doc(db, 'organizations', orgId, collectionName, item.id)
          await setDoc(docRef, item, { merge: true })
        } catch (error) {
          console.warn(`OrgCollection write error (${collectionName}):`, error)
        }
      }
    },
    [user, orgId, collectionName]
  )

  // ── Suppression ──
  const removeItem = useCallback(
    async (id) => {
      setData((prev) => (Array.isArray(prev) ? prev.filter((d) => d.id !== id) : prev))

      if (user && orgId && isFirebaseConfigured) {
        try {
          await deleteDoc(doc(db, 'organizations', orgId, collectionName, id))
        } catch (error) {
          console.warn(`OrgCollection delete error (${collectionName}):`, error)
        }
      }
    },
    [user, orgId, collectionName]
  )

  // ── Bulk set (migration) ──
  const bulkSet = useCallback(
    async (items) => {
      if (!user || !orgId || !isFirebaseConfigured || !Array.isArray(items) || items.length === 0) return

      try {
        const batch = writeBatch(db)
        items.forEach((item) => {
          if (item.id) {
            const docRef = doc(db, 'organizations', orgId, collectionName, item.id)
            batch.set(docRef, item, { merge: true })
          }
        })
        await batch.commit()
      } catch (error) {
        console.warn(`OrgCollection bulk write error (${collectionName}):`, error)
      }
    },
    [user, orgId, collectionName]
  )

  return {
    data,
    setData,
    setItem,
    removeItem,
    bulkSet,
    synced,
    isOnline: !!(user && orgId),
  }
}

/**
 * useOrgDoc — Pour un document unique org-scoped (settings)
 *
 * Lit/ecrit dans organizations/{orgId}/{docPath}
 */
export function useOrgDoc(docPath, localStorageKey, initialValue = {}) {
  const { user } = useAuth()
  const { orgId } = useRole()
  const [data, setData] = useState(() => {
    try {
      const stored = window.localStorage.getItem(localStorageKey)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!user || !orgId || !isFirebaseConfigured || !db) {
      setSynced(false)
      return
    }

    const docRef = doc(db, 'organizations', orgId, docPath)
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data()
          setData(docData)
          try {
            window.localStorage.setItem(localStorageKey, JSON.stringify(docData))
          } catch { /* */ }
        }
        setSynced(true)
      },
      (error) => {
        console.warn(`OrgDoc sync error (${docPath}):`, error)
        setSynced(false)
      }
    )

    return unsubscribe
  }, [user, orgId, docPath, localStorageKey])

  const save = useCallback(
    async (newData) => {
      setData(newData)
      try {
        window.localStorage.setItem(localStorageKey, JSON.stringify(newData))
      } catch { /* */ }

      if (user && orgId && isFirebaseConfigured) {
        try {
          await setDoc(doc(db, 'organizations', orgId, docPath), newData, { merge: true })
        } catch (error) {
          console.warn(`OrgDoc write error (${docPath}):`, error)
        }
      }
    },
    [user, orgId, docPath, localStorageKey]
  )

  return { data, save, synced, isOnline: !!(user && orgId) }
}
