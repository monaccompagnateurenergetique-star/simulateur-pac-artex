import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { FirebaseUserContext } from '../hooks/useLocalStorage'

let onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, firebaseSignOut, updateFirebaseProfile, firebaseUpdatePassword
let firestoreDoc, firestoreGetDoc, firestoreSetDoc, firestoreOnSnapshot, firestoreCollection, firestoreAddDoc, firestoreServerTimestamp, firestoreQuery, firestoreOrderBy, firestoreLimit, firestoreGetDocs, firestoreDeleteDoc

// Import dynamique conditionnel - évite le crash si Firebase n'est pas configuré
if (isFirebaseConfigured) {
  const authModule = await import('firebase/auth')
  onAuthStateChanged = authModule.onAuthStateChanged
  signInWithEmailAndPassword = authModule.signInWithEmailAndPassword
  createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword
  firebaseSignOut = authModule.signOut
  updateFirebaseProfile = authModule.updateProfile
  firebaseUpdatePassword = authModule.updatePassword

  const fsModule = await import('firebase/firestore')
  firestoreDoc = fsModule.doc
  firestoreGetDoc = fsModule.getDoc
  firestoreSetDoc = fsModule.setDoc
  firestoreOnSnapshot = fsModule.onSnapshot
  firestoreCollection = fsModule.collection
  firestoreAddDoc = fsModule.addDoc
  firestoreServerTimestamp = fsModule.serverTimestamp
  firestoreQuery = fsModule.query
  firestoreOrderBy = fsModule.orderBy
  firestoreLimit = fsModule.limit
  firestoreGetDocs = fsModule.getDocs
  firestoreDeleteDoc = fsModule.deleteDoc
}

// ── Helper : hash email pour lookup ──
async function hashEmail(email) {
  const data = new TextEncoder().encode(email.toLowerCase().trim())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Helpers pour détecter l'appareil ──
function getDeviceInfo() {
  const ua = navigator.userAgent || ''
  let device = 'Desktop'
  if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile'
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablette'

  let browser = 'Inconnu'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'

  return { device, browser }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  // Écoute de l'état d'auth
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setUserProfile(null)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  // Écoute du profil Firestore en temps réel
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) return

    const profileRef = firestoreDoc(db, 'users', user.uid, 'profile', 'info')
    const unsubscribe = firestoreOnSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data())
      } else {
        // Créer un profil par défaut depuis les infos Firebase Auth
        const defaultProfile = {
          email: user.email || '',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          phone: '',
          company: '',
          createdAt: new Date().toISOString(),
        }
        firestoreSetDoc(profileRef, defaultProfile).catch(console.warn)
        setUserProfile(defaultProfile)
      }
      setLoading(false)
    }, () => {
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  // ── Tracking de présence et sessions ──
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) return

    const { device, browser } = getDeviceInfo()
    const sessionStart = new Date().toISOString()

    // 1. Enregistrer la session de connexion
    const sessionsRef = firestoreCollection(db, 'users', user.uid, 'sessions')
    firestoreAddDoc(sessionsRef, {
      loginAt: sessionStart,
      logoutAt: null,
      device,
      browser,
      userAgent: navigator.userAgent?.substring(0, 150) || '',
    }).catch(console.warn)

    // 2. Mettre à jour le statut "en ligne"
    const presenceRef = firestoreDoc(db, 'presence', user.uid)
    const updatePresence = () => {
      firestoreSetDoc(presenceRef, {
        online: true,
        lastSeen: new Date().toISOString(),
        email: user.email || '',
        displayName: user.displayName || '',
        device,
        browser,
      }, { merge: true }).catch(console.warn)
    }

    updatePresence()

    // Heartbeat toutes les 60 secondes pour garder le statut "en ligne"
    const heartbeat = setInterval(updatePresence, 60000)

    // 3. Marquer "hors ligne" quand l'utilisateur quitte
    const markOffline = () => {
      const data = JSON.stringify({
        online: false,
        lastSeen: new Date().toISOString(),
        email: user.email || '',
        displayName: user.displayName || '',
        device,
        browser,
      })
      // Utiliser sendBeacon pour garantir l'envoi même en fermant l'onglet
      // Fallback: on met à jour via setDoc
      firestoreSetDoc(presenceRef, {
        online: false,
        lastSeen: new Date().toISOString(),
      }, { merge: true }).catch(() => {})
    }

    window.addEventListener('beforeunload', markOffline)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        firestoreSetDoc(presenceRef, {
          online: false,
          lastSeen: new Date().toISOString(),
        }, { merge: true }).catch(() => {})
      } else {
        updatePresence()
      }
    })

    return () => {
      clearInterval(heartbeat)
      window.removeEventListener('beforeunload', markOffline)
      markOffline()
    }
  }, [user])

  const signIn = (email, password) => {
    if (!isFirebaseConfigured) throw new Error('Firebase non configuré')
    return signInWithEmailAndPassword(auth, email, password)
  }

  /**
   * signUp — Inscription d'un utilisateur
   * options.role + options.orgId = auto-activation (beneficiaire depuis lien partage)
   * Sans options = pending_approval (inscription classique)
   */
  const signUp = async (email, password, profile = {}, options = {}) => {
    if (!isFirebaseConfigured) throw new Error('Firebase non configuré')
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    if (displayName) {
      await updateFirebaseProfile(cred.user, { displayName })
    }

    const profileRef = firestoreDoc(db, 'users', cred.user.uid, 'profile', 'info')
    await firestoreSetDoc(profileRef, {
      email,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      company: profile.company || '',
      createdAt: new Date().toISOString(),
    })

    // Role : auto-active si role+orgId fournis (beneficiaire), sinon pending
    const roleRef = firestoreDoc(db, 'roles', cred.user.uid)
    if (options.role && options.orgId) {
      await firestoreSetDoc(roleRef, {
        role: options.role,
        orgId: options.orgId,
        status: 'active',
        createdAt: new Date().toISOString(),
      }).catch(console.warn)
    } else {
      await firestoreSetDoc(roleRef, {
        role: null,
        orgId: null,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
      }).catch(console.warn)
    }

    // Index email → uid
    const emailHash = await hashEmail(email)
    await firestoreSetDoc(firestoreDoc(db, 'email_to_uid', emailHash), {
      uid: cred.user.uid,
      email: email.toLowerCase(),
    }).catch(console.warn)

    return cred
  }

  const signOut = () => {
    if (!isFirebaseConfigured) return
    setUserProfile(null)
    return firebaseSignOut(auth)
  }

  const updateUserProfile = async (data) => {
    if (!user || !isFirebaseConfigured || !db) return
    const profileRef = firestoreDoc(db, 'users', user.uid, 'profile', 'info')
    const updated = { ...userProfile, ...data, updatedAt: new Date().toISOString() }
    await firestoreSetDoc(profileRef, updated, { merge: true })

    // Mettre à jour displayName si nom/prénom changent
    const displayName = [updated.firstName, updated.lastName].filter(Boolean).join(' ')
    if (displayName && auth.currentUser) {
      await updateFirebaseProfile(auth.currentUser, { displayName }).catch(console.warn)
    }
  }

  // Changer le mot de passe + retirer le flag mustChangePassword
  const changePassword = async (newPassword) => {
    if (!auth.currentUser) throw new Error('Non connecté')
    await firebaseUpdatePassword(auth.currentUser, newPassword)
    // Retirer le flag mustChangePassword
    if (user && isFirebaseConfigured) {
      const profileRef = firestoreDoc(db, 'users', user.uid, 'profile', 'info')
      await firestoreSetDoc(profileRef, { mustChangePassword: false }, { merge: true })
      setUserProfile((prev) => prev ? { ...prev, mustChangePassword: false } : prev)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signIn,
      signUp,
      signOut,
      changePassword,
      updateUserProfile,
      isFirebaseConfigured,
    }}>
      <FirebaseUserContext.Provider value={user}>
        {children}
      </FirebaseUserContext.Provider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
