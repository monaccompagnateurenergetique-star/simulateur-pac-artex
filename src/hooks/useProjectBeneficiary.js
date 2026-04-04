import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, onSnapshot, doc, setDoc
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * useProjectBeneficiary(projectId)
 * Detecte automatiquement le beneficiaire lie a un projet
 * en ecoutant shared_scenarios ou projectId == projectId && beneficiaryUid != null
 * Puis synchronise le beneficiaryUid dans le projet org-scoped
 */
export function useProjectBeneficiary(projectId) {
  const { user } = useAuth()
  const { orgId } = useRole()
  const [beneficiary, setBeneficiary] = useState(null)
  const [sharedScenarios, setSharedScenarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId || !isFirebaseConfigured || !db) {
      setLoading(false)
      return
    }

    // Ecouter tous les scenarios partages pour ce projet
    const q = query(
      collection(db, 'shared_scenarios'),
      where('projectId', '==', projectId)
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setSharedScenarios(items)

      // Trouver le beneficiaire qui s'est inscrit
      const linked = items.find((s) => s.beneficiaryUid)
      if (linked) {
        setBeneficiary({
          uid: linked.beneficiaryUid,
          name: linked.beneficiaryName || '',
          email: linked.beneficiaryEmail || '',
        })

        // Auto-sync dans le projet org si pas encore fait
        if (orgId) {
          setDoc(doc(db, 'organizations', orgId, 'projects', projectId), {
            beneficiaryUid: linked.beneficiaryUid,
            beneficiaryName: linked.beneficiaryName || '',
            beneficiaryEmail: linked.beneficiaryEmail || '',
          }, { merge: true }).catch(() => {})
        }
      } else {
        setBeneficiary(null)
      }
      setLoading(false)
    }, () => setLoading(false))

    return unsubscribe
  }, [projectId, orgId])

  return { beneficiary, sharedScenarios, loading }
}
