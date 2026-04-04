import { db, isFirebaseConfigured } from './firebase'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

/**
 * Migre les donnees per-user (users/{uid}/data/{key}) vers org-scoped (organizations/{orgId}/...)
 *
 * @param {string} uid - L'ID de l'utilisateur a migrer
 * @param {string} orgId - L'ID de l'organisation cible
 * @returns {Object} Resultat de la migration { migratedLeads, migratedProjects, migratedSettings }
 */
export async function migrateUserDataToOrg(uid, orgId) {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase non configuré')

  const results = { migratedLeads: 0, migratedProjects: 0, migratedSettings: false }

  // Lire les donnees per-user
  const dataRef = collection(db, 'users', uid, 'data')
  const dataSnap = await getDocs(dataRef)

  const userData = {}
  dataSnap.forEach((d) => { userData[d.id] = d.data() })

  // Migrer les leads
  const leads = userData['artex360-leads']?.value
  if (Array.isArray(leads) && leads.length > 0) {
    const batch = writeBatch(db)
    leads.forEach((lead) => {
      if (lead.id) {
        const docRef = doc(db, 'organizations', orgId, 'leads', lead.id)
        batch.set(docRef, lead, { merge: true })
        results.migratedLeads++
      }
    })
    await batch.commit()
  }

  // Migrer les projets (clients)
  const projects = userData['artex-clients']?.value
  if (Array.isArray(projects) && projects.length > 0) {
    const batch = writeBatch(db)
    projects.forEach((project) => {
      if (project.id) {
        const docRef = doc(db, 'organizations', orgId, 'projects', project.id)
        batch.set(docRef, project, { merge: true })
        results.migratedProjects++
      }
    })
    await batch.commit()
  }

  // Migrer les settings
  const settings = userData['artex360-settings']?.value
  if (settings && typeof settings === 'object') {
    const settingsRef = doc(db, 'organizations', orgId, 'settings', 'config')
    await setDoc(settingsRef, settings, { merge: true })
    results.migratedSettings = true
  }

  // Marquer la migration comme faite
  const migratedRef = doc(db, 'users', uid, 'data', '_migrated')
  await setDoc(migratedRef, {
    orgId,
    migratedAt: new Date().toISOString(),
    results,
  })

  return results
}
