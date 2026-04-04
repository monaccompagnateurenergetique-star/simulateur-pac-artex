import { initializeApp, deleteApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'

/**
 * Configuration Firebase — Artex360
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA9oCZwxN5TWECx5v30UxwSCNSmf64vndU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'artex-360.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'artex-360',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'artex-360.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '29722921486',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:29722921486:web:bde23677820bee00d4ca5f',
}

// Firebase est activé seulement si la config est renseignée
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId)

let app = null
let db = null
let auth = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
}

/**
 * Cree un compte Firebase Auth pour un autre utilisateur
 * sans deconnecter l'admin courant (utilise une app temporaire)
 */
export async function createAccountForUser(email, password) {
  const tempApp = initializeApp(firebaseConfig, 'temp_' + Date.now())
  try {
    const tempAuth = getAuth(tempApp)
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password)
    const uid = cred.user.uid
    await signOut(tempAuth)
    return uid
  } finally {
    await deleteApp(tempApp)
  }
}

export { db, auth, firebaseConfig }
export default app
