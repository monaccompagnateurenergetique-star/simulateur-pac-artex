import { useState, useEffect, useRef, useContext, createContext } from 'react'
import { db, isFirebaseConfigured } from '../lib/firebase'

/**
 * Contexte Firebase partagé — injecté par AuthProvider
 */
export const FirebaseUserContext = createContext(null)

// Import Firestore functions seulement si configuré
let firestoreDoc, firestoreOnSnapshot, firestoreSetDoc
if (isFirebaseConfigured) {
  const mod = await import('firebase/firestore')
  firestoreDoc = mod.doc
  firestoreOnSnapshot = mod.onSnapshot
  firestoreSetDoc = mod.setDoc
}

/**
 * useLocalStorage — Avec sync Firestore automatique
 *
 * - Sans connexion / sans config Firebase : localStorage classique
 * - Avec connexion : localStorage + sync Firestore temps réel
 *
 * Structure Firestore : users/{uid}/data/{key}
 */
export function useLocalStorage(key, initialValue) {
  const user = useContext(FirebaseUserContext)

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Erreur lecture localStorage "${key}":`, error)
      return initialValue
    }
  })

  const isFromFirestore = useRef(false)
  const initialSyncDone = useRef(false)

  // ── Sync localStorage + push Firestore ──
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Erreur écriture localStorage "${key}":`, error)
    }

    if (user && isFirebaseConfigured && db && !isFromFirestore.current && initialSyncDone.current) {
      const docRef = firestoreDoc(db, 'users', user.uid, 'data', key)
      firestoreSetDoc(docRef, { value: storedValue }, { merge: false }).catch((err) => {
        console.warn(`Firestore write error (${key}):`, err)
      })
    }
    isFromFirestore.current = false
  }, [key, storedValue, user])

  // ── Listener Firestore temps réel ──
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      initialSyncDone.current = true
      return
    }

    const docRef = firestoreDoc(db, 'users', user.uid, 'data', key)

    const unsubscribe = firestoreOnSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const firestoreData = snapshot.data().value
          isFromFirestore.current = true
          setStoredValue(firestoreData)
        } else if (!initialSyncDone.current) {
          // Firestore vide → push localStorage vers cloud
          const localData = (() => {
            try {
              const item = window.localStorage.getItem(key)
              return item ? JSON.parse(item) : null
            } catch { return null }
          })()

          if (localData !== null) {
            const hasData = Array.isArray(localData)
              ? localData.length > 0
              : typeof localData === 'object' && Object.keys(localData).length > 0
            if (hasData) {
              firestoreSetDoc(docRef, { value: localData }, { merge: false }).catch((err) => {
                console.warn(`Firestore initial push error (${key}):`, err)
              })
            }
          }
        }
        initialSyncDone.current = true
      },
      (error) => {
        console.warn(`Firestore listener error (${key}):`, error)
        initialSyncDone.current = true
      }
    )

    return unsubscribe
  }, [user, key])

  return [storedValue, setStoredValue]
}
