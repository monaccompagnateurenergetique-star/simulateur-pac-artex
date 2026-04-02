import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

/**
 * Configuration Firebase — Artex360
 *
 * Pour activer la sync cloud :
 * 1. Va sur https://console.firebase.google.com
 * 2. Crée un projet "artex360"
 * 3. Ajoute une app Web (icône </>)
 * 4. Copie la config dans un fichier .env à la racine du projet
 * 5. Active Firestore (Cloud Firestore > Créer une base de données > mode test)
 * 6. Active Authentication > Email/mot de passe
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
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

export { db, auth }
export default app
