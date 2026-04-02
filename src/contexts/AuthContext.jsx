import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { FirebaseUserContext } from '../hooks/useLocalStorage'

let onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, firebaseSignOut, updateFirebaseProfile
let firestoreDoc, firestoreGetDoc, firestoreSetDoc, firestoreOnSnapshot

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
