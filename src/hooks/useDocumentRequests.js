import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  addDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

export const DOC_REQUEST_STATUSES = [
  { value: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'fourni', label: 'Fourni', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'refuse', label: 'Refusé', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
]

export const DOC_TYPES = [
  { value: 'avis_imposition', label: "Avis d'imposition" },
  { value: 'devis', label: 'Devis signé' },
  { value: 'attestation_honneur', label: "Attestation sur l'honneur" },
  { value: 'photo_avant', label: 'Photo avant travaux' },
  { value: 'photo_apres', label: 'Photo après travaux' },
  { value: 'facture', label: 'Facture' },
  { value: 'dpe', label: 'DPE / Audit énergétique' },
  { value: 'identite', label: "Pièce d'identité" },
  { value: 'rib', label: 'RIB' },
  { value: 'autre', label: 'Autre document' },
]

/**
 * useDocumentRequests — Demandes de documents entre installateur et beneficiaire
 */
export function useDocumentRequests(projectId) {
  const { user } = useAuth()
  const { orgId, isSuperAdmin } = useRole()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      setRequests([])
      setLoading(false)
      return
    }

    let q
    if (projectId) {
      q = query(
        collection(db, 'document_requests'),
        where('projectId', '==', projectId)
      )
    } else if (isSuperAdmin()) {
      q = query(collection(db, 'document_requests'))
    } else {
      // Beneficiaire voit ses propres demandes
      q = query(
        collection(db, 'document_requests'),
        where('beneficiaryUid', '==', user.uid)
      )
    }

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        // Tri cote client au lieu de Firestore (evite les index composites)
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        setRequests(items)
        setLoading(false)
      },
      (err) => {
        console.warn('useDocumentRequests:', err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, projectId, isSuperAdmin])

  const createRequest = useCallback(
    async ({ projectId: pId, beneficiaryUid, docType, label, message }) => {
      if (!user || !isFirebaseConfigured || !db) return null

      const reqData = {
        projectId: pId,
        beneficiaryUid,
        orgId: orgId || null,
        requestedBy: user.uid,
        docType: docType || 'autre',
        label: label || DOC_TYPES.find((d) => d.value === docType)?.label || 'Document',
        message: message || '',
        status: 'en_attente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const ref = await addDoc(collection(db, 'document_requests'), reqData)
      return { id: ref.id, ...reqData }
    },
    [user, orgId]
  )

  const updateRequestStatus = useCallback(
    async (reqId, status, note = '') => {
      if (!isFirebaseConfigured || !db) return
      await setDoc(
        doc(db, 'document_requests', reqId),
        { status, statusNote: note, updatedAt: new Date().toISOString() },
        { merge: true }
      )
    },
    []
  )

  return { requests, loading, createRequest, updateRequestStatus }
}
