import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { hasPermission, getPermissions, ROLES } from '../lib/permissions'

let firestoreDoc, firestoreOnSnapshot

if (isFirebaseConfigured) {
  const mod = await import('firebase/firestore')
  firestoreDoc = mod.doc
  firestoreOnSnapshot = mod.onSnapshot
}

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [roleData, setRoleData] = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)

  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      setRoleData(null)
      setRoleLoading(false)
      return
    }

    setRoleLoading(true)
    const roleRef = firestoreDoc(db, 'roles', user.uid)
    const unsubscribe = firestoreOnSnapshot(roleRef, (snap) => {
      if (snap.exists()) {
        setRoleData({ uid: user.uid, ...snap.data() })
      } else {
        // Pas de role encore — utilisateur en attente
        setRoleData({ uid: user.uid, role: null, orgId: null, status: 'pending_approval' })
      }
      setRoleLoading(false)
    }, (err) => {
      console.warn('RoleContext: erreur lecture role:', err)
      setRoleData({ uid: user.uid, role: null, orgId: null, status: 'pending_approval' })
      setRoleLoading(false)
    })

    return unsubscribe
  }, [user])

  const role = roleData?.role || null
  const orgId = roleData?.orgId || null
  const status = roleData?.status || null

  const value = {
    role,
    orgId,
    status,
    roleData,
    roleLoading: authLoading || roleLoading,
    isSuperAdmin: () => role === ROLES.SUPER_ADMIN,
    isInstallerAdmin: () => role === ROLES.INSTALLER_ADMIN,
    isOrgMember: () => role === ROLES.INSTALLER_ADMIN || role === ROLES.INSTALLER_MEMBER,
    isBeneficiary: () => role === ROLES.BENEFICIARY,
    canAccess: (permission) => hasPermission(role, permission),
    permissions: role ? getPermissions(role) : {},
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
