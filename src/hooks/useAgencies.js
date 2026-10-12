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

const COLLECTION = 'agencies'

export function useAgencies() {
  const { user } = useAuth()
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !db) {
      setLoading(false)
      return
    }

    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAgencies(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (error) => {
        console.warn('Agencies sync error:', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user])

  const addAgency = useCallback(
    async (data) => {
      if (!user || !db) return null
      const id = `ag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const agency = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        updatedAt: new Date().toISOString(),
      }
      await setDoc(doc(db, COLLECTION, id), agency)
      return id
    },
    [user]
  )

  const updateAgency = useCallback(
    async (id, data) => {
      if (!user || !db) return
      await setDoc(
        doc(db, COLLECTION, id),
        { ...data, updatedAt: new Date().toISOString() },
        { merge: true }
      )
    },
    [user]
  )

  const deleteAgency = useCallback(
    async (id) => {
      if (!user || !db) return
      await deleteDoc(doc(db, COLLECTION, id))
    },
    [user]
  )

  const getAgency = useCallback(
    (id) => agencies.find((a) => a.id === id) || null,
    [agencies]
  )

  return {
    agencies,
    loading,
    addAgency,
    updateAgency,
    deleteAgency,
    getAgency,
  }
}
