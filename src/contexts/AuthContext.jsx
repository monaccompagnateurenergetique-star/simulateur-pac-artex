import { createContext, useContext, useState, useEffect } from 'react'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { FirebaseUserContext } from '../hooks/useLocalStorage'

let onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, firebaseSignOut

// Import dynamique conditionnel - évite le crash si Firebase n'est pas configuré
if (isFirebaseConfigured) {
  const authModule = await import('firebase/auth')
  onAuthStateChanged = authModule.onAuthStateChanged
  signInWithEmailAndPassword = authModule.signInWithEmailAndPassword
  createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword
  firebaseSignOut = authModule.signOut
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = (email, password) => {
    if (!isFirebaseConfigured) throw new Error('Firebase non configuré')
    return signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = (email, password) => {
    if (!isFirebaseConfigured) throw new Error('Firebase non configuré')
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const signOut = () => {
    if (!isFirebaseConfigured) return
    return firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isFirebaseConfigured }}>
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
