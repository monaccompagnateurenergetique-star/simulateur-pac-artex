import { useState, useEffect, useCallback } from 'react'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db, storage, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * useDocumentStorage — Upload / download / gestion des documents projet
 *
 * Storage path : organizations/{orgId}/projects/{projectId}/{docType}_{filename}
 * Firestore :    organizations/{orgId}/projectDocuments (filtré par projectId)
 *
 * Chaque document stocké a :
 *  - projectId, docType, fileName, fileUrl, fileSize, mimeType
 *  - status : 'en_attente' | 'valide' | 'refuse'
 *  - uploadedBy, uploadedAt, updatedAt
 */

const STATUSES = {
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  valide:     { label: 'Validé',     color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  refuse:     { label: 'Refusé',     color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
}

export { STATUSES as DOC_UPLOAD_STATUSES }

export function useDocumentStorage(projectId) {
  const { user } = useAuth()
  const { orgId } = useRole()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // ── Ecoute temps réel des documents du projet ──
  useEffect(() => {
    if (!user || !orgId || !projectId || !isFirebaseConfigured || !db) {
      setDocuments([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'organizations', orgId, 'projectDocuments'),
      where('projectId', '==', projectId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.docType || '').localeCompare(b.docType || ''))
        setDocuments(docs)
        setLoading(false)
      },
      (err) => {
        console.warn('useDocumentStorage:', err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, orgId, projectId])

  /**
   * Upload un fichier vers Firebase Storage + enregistre les metadata dans Firestore
   *
   * @param {File}   file     - Fichier à uploader
   * @param {string} docType  - Type de document (ex: 'avis_imposition')
   * @param {string} [label]  - Label affiché (ex: "Avis d'imposition")
   * @returns {Promise<Object>} Le document créé
   */
  const uploadDocument = useCallback(async (file, docType, label = '') => {
    if (!user || !orgId || !projectId || !isFirebaseConfigured || !storage || !db) {
      throw new Error('Firebase non configuré ou utilisateur non connecté')
    }

    // Validation
    const maxSize = 10 * 1024 * 1024 // 10 Mo
    if (file.size > maxSize) {
      throw new Error('Le fichier ne doit pas dépasser 10 Mo')
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non accepté. Formats autorisés : PDF, JPG, PNG, DOCX')
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Nettoyer le nom de fichier
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `organizations/${orgId}/projects/${projectId}/${docType}_${Date.now()}_${cleanName}`
      const storageRef = ref(storage, storagePath)

      // Upload avec progression
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      })

      const fileUrl = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            setUploadProgress(progress)
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            resolve(url)
          }
        )
      })

      // Metadata Firestore
      const docId = `${projectId}_${docType}_${Date.now()}`
      const docData = {
        projectId,
        docType,
        label: label || docType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl,
        storagePath,
        status: 'en_attente',
        uploadedBy: user.uid,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(
        doc(db, 'organizations', orgId, 'projectDocuments', docId),
        docData
      )

      setUploading(false)
      setUploadProgress(0)
      return { id: docId, ...docData }
    } catch (err) {
      setUploading(false)
      setUploadProgress(0)
      throw err
    }
  }, [user, orgId, projectId])

  /**
   * Met a jour le statut d'un document
   */
  const updateStatus = useCallback(async (docId, status, note = '') => {
    if (!orgId || !isFirebaseConfigured || !db) return
    await setDoc(
      doc(db, 'organizations', orgId, 'projectDocuments', docId),
      { status, statusNote: note, updatedAt: new Date().toISOString() },
      { merge: true }
    )
  }, [orgId])

  /**
   * Supprime un document (Storage + Firestore)
   */
  const removeDocument = useCallback(async (docId, storagePath) => {
    if (!orgId || !isFirebaseConfigured || !db) return

    // Supprimer de Storage
    if (storagePath && storage) {
      try {
        await deleteObject(ref(storage, storagePath))
      } catch (e) {
        console.warn('Could not delete from storage:', e)
      }
    }

    // Supprimer de Firestore
    await deleteDoc(doc(db, 'organizations', orgId, 'projectDocuments', docId))
  }, [orgId])

  return {
    documents,
    loading,
    uploading,
    uploadProgress,
    uploadDocument,
    updateStatus,
    removeDocument,
  }
}
