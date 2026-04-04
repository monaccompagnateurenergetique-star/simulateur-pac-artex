import { useState, useEffect, useCallback } from 'react'
import { db, isFirebaseConfigured, createAccountForUser } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'
import { generateTempPassword } from '../lib/passwordUtils'

let firestoreCollection, firestoreDoc, firestoreOnSnapshot, firestoreSetDoc,
  firestoreDeleteDoc, firestoreGetDoc, firestoreGetDocs, firestoreQuery

if (isFirebaseConfigured) {
  const mod = await import('firebase/firestore')
  firestoreCollection = mod.collection
  firestoreDoc = mod.doc
  firestoreOnSnapshot = mod.onSnapshot
  firestoreSetDoc = mod.setDoc
  firestoreDeleteDoc = mod.deleteDoc
  firestoreGetDoc = mod.getDoc
  firestoreGetDocs = mod.getDocs
  firestoreQuery = mod.query
}

async function hashEmail(email) {
  const data = new TextEncoder().encode(email.toLowerCase().trim())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * useTeamMembers(targetOrgId?)
 * - Sans argument : utilise l'orgId du role courant (pour l'admin org)
 * - Avec argument : utilise l'orgId fourni (pour le super admin)
 */
export function useTeamMembers(targetOrgId) {
  const { user } = useAuth()
  const { orgId: myOrgId } = useRole()
  const effectiveOrgId = targetOrgId || myOrgId
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !effectiveOrgId || !isFirebaseConfigured || !db) {
      setMembers([])
      return
    }

    setLoading(true)
    const membersRef = firestoreCollection(db, 'organizations', effectiveOrgId, 'members')
    const unsubscribe = firestoreOnSnapshot(membersRef, async (snapshot) => {
      const items = []
      for (const docSnap of snapshot.docs) {
        const memberData = docSnap.data()
        // Essayer de charger le profil complet, sinon utiliser les donnees du membre
        let profile = null
        try {
          const profileSnap = await firestoreGetDocs(
            firestoreQuery(firestoreCollection(db, 'users', docSnap.id, 'profile'))
          )
          profileSnap.forEach((d) => { profile = d.data() })
        } catch { /* permission denied — fallback aux donnees du membre */ }

        // Fallback : utiliser les infos stockees dans le doc membre
        if (!profile) {
          profile = {
            firstName: memberData.firstName || '',
            lastName: memberData.lastName || '',
            email: memberData.email || '',
          }
        }

        items.push({ uid: docSnap.id, ...memberData, profile })
      }
      setMembers(items)
      setLoading(false)
    })

    return unsubscribe
  }, [user, effectiveOrgId])

  const createMember = useCallback(async ({ email, firstName, lastName, memberRole = 'member' }) => {
    if (!effectiveOrgId || !isFirebaseConfigured) throw new Error('Organisation non configurée')
    if (!email?.trim()) throw new Error('Email obligatoire')

    const emailLower = email.toLowerCase().trim()
    const firestoreRole = memberRole === 'admin' ? 'installer_admin' : 'installer_member'
    let uid
    let tempPassword = null
    let isExisting = false

    const emailHash = await hashEmail(emailLower)
    const emailSnap = await firestoreGetDoc(firestoreDoc(db, 'email_to_uid', emailHash))

    if (emailSnap.exists()) {
      uid = emailSnap.data().uid
      isExisting = true
      if (members.some((m) => m.uid === uid)) {
        throw new Error('Cet utilisateur est déjà membre de l\'organisation.')
      }
    } else {
      tempPassword = generateTempPassword()
      uid = await createAccountForUser(emailLower, tempPassword)

      await firestoreSetDoc(firestoreDoc(db, 'users', uid, 'profile', 'info'), {
        email: emailLower,
        firstName: firstName || '',
        lastName: lastName || '',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      })

      await firestoreSetDoc(firestoreDoc(db, 'email_to_uid', emailHash), { uid, email: emailLower })
    }

    await firestoreSetDoc(firestoreDoc(db, 'roles', uid), {
      role: firestoreRole,
      orgId: effectiveOrgId,
      status: 'active',
      [isExisting ? 'updatedBy' : 'createdBy']: user.uid,
      [isExisting ? 'updatedAt' : 'createdAt']: new Date().toISOString(),
    }, { merge: true })

    await firestoreSetDoc(firestoreDoc(db, 'organizations', effectiveOrgId, 'members', uid), {
      role: memberRole,
      firstName: firstName || '',
      lastName: lastName || '',
      email: emailLower,
      joinedAt: new Date().toISOString(),
      invitedBy: user.uid,
    })

    return { uid, tempPassword, isExisting }
  }, [user, effectiveOrgId, members])

  const removeMember = useCallback(async (uid) => {
    if (!effectiveOrgId || !isFirebaseConfigured) return
    if (uid === user.uid) throw new Error('Vous ne pouvez pas vous retirer vous-même.')

    await firestoreDeleteDoc(firestoreDoc(db, 'organizations', effectiveOrgId, 'members', uid))
    await firestoreSetDoc(firestoreDoc(db, 'roles', uid), {
      role: null, orgId: null, status: 'pending_approval',
      updatedBy: user.uid, updatedAt: new Date().toISOString(),
    }, { merge: true })
  }, [user, effectiveOrgId])

  const updateMemberRole = useCallback(async (uid, newRole) => {
    if (!effectiveOrgId || !isFirebaseConfigured) return

    await firestoreSetDoc(firestoreDoc(db, 'organizations', effectiveOrgId, 'members', uid), { role: newRole }, { merge: true })
    await firestoreSetDoc(firestoreDoc(db, 'roles', uid), {
      role: newRole === 'admin' ? 'installer_admin' : 'installer_member',
      updatedBy: user.uid, updatedAt: new Date().toISOString(),
    }, { merge: true })
  }, [user, effectiveOrgId])

  return { members, loading, createMember, removeMember, updateMemberRole }
}
