import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

/**
 * useFirestore — Remplace useLocalStorage avec sync Firestore temps réel
 *
 * Structure Firestore :
 *   users/{uid}/{collectionName}/{docId}
 *
 * Fallback localStorage si pas connecté (mode hors-ligne)
 *
 * @param {string} collectionName - Nom de la collection ('projects', 'leads', etc.)
 * @param {string} localStorageKey - Clé localStorage pour fallback
 * @param {any} initialValue - Valeur par défaut
 */
export function useFirestore(collectionName, localStorageKey, initialValue = []) {
  const { user } = useAuth()
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

  // ── Sync FROM Firestore (temps réel) ──
  useEffect(() => {
    if (!user) {
      setSynced(false)
      return
    }

    const colRef = collection(db, 'users', user.uid, collectionName)
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

        if (Array.isArray(initialValue)) {
          skipNextLocalSync.current = true
          setData(docs)
          // Sync to localStorage as cache
          try {
            window.localStorage.setItem(localStorageKey, JSON.stringify(docs))
          } catch { /* quota exceeded */ }
        }
        setSynced(true)
      },
      (error) => {
        console.warn(`Firestore sync error (${collectionName}):`, error)
        setSynced(false)
      }
    )

    return unsubscribe
  }, [user, collectionName, localStorageKey])

  // ── Sync TO localStorage quand pas connecté ──
  useEffect(() => {
    if (skipNextLocalSync.current) {
      skipNextLocalSync.current = false
      return
    }
    if (!user) {
      try {
        window.localStorage.setItem(localStorageKey, JSON.stringify(data))
      } catch { /* quota exceeded */ }
    }
  }, [data, user, localStorageKey])

  // ── Écriture : sauvegarde dans Firestore + state local ──
  const setItem = useCallback(
    async (item) => {
      if (!item.id) return

      // Update local state immédiatement
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

      // Push to Firestore si connecté
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid, collectionName, item.id)
          await setDoc(docRef, item, { merge: true })
        } catch (error) {
          console.warn(`Firestore write error (${collectionName}):`, error)
        }
      }
    },
    [user, collectionName]
  )

  // ── Suppression ──
  const removeItem = useCallback(
    async (id) => {
      setData((prev) => (Array.isArray(prev) ? prev.filter((d) => d.id !== id) : prev))

      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, collectionName, id))
        } catch (error) {
          console.warn(`Firestore delete error (${collectionName}):`, error)
        }
      }
    },
    [user, collectionName]
  )

  // ── Bulk set (pour migration initiale localStorage → Firestore) ──
  const bulkSet = useCallback(
    async (items) => {
      if (!user || !Array.isArray(items) || items.length === 0) return

      try {
        const batch = writeBatch(db)
        items.forEach((item) => {
          if (item.id) {
            const docRef = doc(db, 'users', user.uid, collectionName, item.id)
            batch.set(docRef, item, { merge: true })
          }
        })
        await batch.commit()
      } catch (error) {
        console.warn(`Firestore bulk write error (${collectionName}):`, error)
      }
    },
    [user, collectionName]
  )

  return {
    data,
    setData,       // Pour compatibilité directe avec les hooks existants
    setItem,       // Ajouter / mettre à jour un document
    removeItem,    // Supprimer un document
    bulkSet,       // Migration bulk
    synced,        // true si connecté et synchro Firestore active
    isOnline: !!user,
  }
}

/**
 * useFirestoreDoc — Pour un document unique (settings)
 */
export function useFirestoreDoc(docPath, localStorageKey, initialValue = {}) {
  const { user } = useAuth()
  const [data, setData] = useState(() => {
    try {
      const stored = window.localStorage.getItem(localStorageKey)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })
  const [synced, setSynced] = useState(false)

  // Sync FROM Firestore
  useEffect(() => {
    if (!user) {
      setSynced(false)
      return
    }

    const docRef = doc(db, 'users', user.uid, docPath)
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
        console.warn(`Firestore doc sync error (${docPath}):`, error)
        setSynced(false)
      }
    )

    return unsubscribe
  }, [user, docPath, localStorageKey])

  // Save
  const save = useCallback(
    async (newData) => {
      setData(newData)
      try {
        window.localStorage.setItem(localStorageKey, JSON.stringify(newData))
      } catch { /* */ }

      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, docPath), newData, { merge: true })
        } catch (error) {
          console.warn(`Firestore doc write error (${docPath}):`, error)
        }
      }
    },
    [user, docPath, localStorageKey]
  )

  return { data, save, synced, isOnline: !!user }
}
