import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { FirebaseUserContext } from '../hooks/useLocalStorage'

let onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, firebaseSignOut, updateFirebaseProfile
let firestoreDoc, firestoreGetDoc, firestoreSetDoc, firestoreOnSnapshot, firestoreCollection, firestoreAddDoc, firestoreServerTimestamp, firestoreQuery, firestoreOrderBy, firestoreLimit, firestoreGetDocs, firestoreDeleteDoc

// Import dynamique conditionnel - évite le crash si Firebase n'est pas configuré
if (isFirebaseConfigured) {
  const authModule = await import('firebase/auth')
  onAuthStateChanged = authModule.onAuthStateChanged
  signInWithEmailAndPassword = authModule.signInWithEmailAndPassword
  createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword
  firebaseSignOut = authModule.signOut
  updateFirebaseProfile = authModule.updateProfile

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

  const signUp = async (email, password, profile = {}) => {
    if (!isFirebaseConfigured) throw new Error('Firebase non configuré')
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    // Mettre à jour le displayName dans Firebase Auth
    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    if (displayName) {
      await updateFirebaseProfile(cred.user, { displayName })
    }

    // Sauvegarder le profil complet dans Firestore
    const profileRef = firestoreDoc(db, 'users', cred.user.uid, 'profile', 'info')
    await firestoreSetDoc(profileRef, {
      email,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      company: profile.company || '',
      createdAt: new Date().toISOString(),
    })

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

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signIn,
      signUp,
      signOut,
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
