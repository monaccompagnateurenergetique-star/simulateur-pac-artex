import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db, isFirebaseConfigured } from '../lib/firebase'
import {
  Users, Wifi, WifiOff, Clock, Monitor, Smartphone, Tablet,
  ChevronDown, ChevronUp, Activity, Calendar, Shield
} from 'lucide-react'

let firestoreCollection, firestoreOnSnapshot, firestoreQuery, firestoreOrderBy, firestoreLimit, firestoreGetDocs, firestoreDoc

if (isFirebaseConfigured) {
  const mod = await import('firebase/firestore')
  firestoreCollection = mod.collection
  firestoreOnSnapshot = mod.onSnapshot
  firestoreQuery = mod.query
  firestoreOrderBy = mod.orderBy
  firestoreLimit = mod.limit
  firestoreGetDocs = mod.getDocs
  firestoreDoc = mod.doc
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "A l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

function DeviceIcon({ device }) {
  if (device === 'Mobile') return <Smartphone className="w-4 h-4" />
  if (device === 'Tablette') return <Tablet className="w-4 h-4" />
  return <Monitor className="w-4 h-4" />
}

export default function AdminPage() {
  const { user } = useAuth()
  const [presenceList, setPresenceList] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Écouter la collection "presence" en temps réel
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return

    const presenceRef = firestoreCollection(db, 'presence')
    const unsubscribe = firestoreOnSnapshot(presenceRef, (snapshot) => {
      const items = []
      snapshot.forEach((doc) => {
        items.push({ uid: doc.id, ...doc.data() })
      })
      // Trier : en ligne d'abord, puis par dernière connexion
      items.sort((a, b) => {
        if (a.online && !b.online) return -1
        if (!a.online && b.online) return 1
        return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0)
      })
      setPresenceList(items)

      // Charger les profils pour chaque utilisateur
      items.forEach((item) => {
        if (!userProfiles[item.uid]) {
          const profileRef = firestoreDoc(db, 'users', item.uid, 'profile', 'info')
          firestoreGetDocs(firestoreQuery(firestoreCollection(db, 'users', item.uid, 'profile'))).then((snap) => {
            snap.forEach((doc) => {
              setUserProfiles((prev) => ({ ...prev, [item.uid]: doc.data() }))
            })
          }).catch(() => {})
        }
      })
    })

    return unsubscribe
  }, [])

  // Charger les sessions d'un utilisateur
  const loadSessions = async (uid) => {
    if (selectedUser === uid) {
      setSelectedUser(null)
      return
    }
    setSelectedUser(uid)
    setLoadingSessions(true)
    try {
      const sessionsRef = firestoreCollection(db, 'users', uid, 'sessions')
      const q = firestoreQuery(sessionsRef, firestoreOrderBy('loginAt', 'desc'), firestoreLimit(20))
      const snapshot = await firestoreGetDocs(q)
      const items = []
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }))
      setSessions(items)
    } catch (err) {
      console.warn('Erreur chargement sessions:', err)
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }

  const onlineCount = presenceList.filter((p) => p.online).length
  const totalUsers = presenceList.length

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Accès réservé</h2>
        <p className="text-gray-500 mt-2">Connectez-vous pour accéder à cette page</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-500" />
          Suivi des utilisateurs
        </h1>
        <p className="text-sm text-gray-500 mt-1">Connexions en temps réel et historique des sessions</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{onlineCount}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Wifi className="w-3 h-3" /> En ligne
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Total utilisateurs
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{totalUsers - onlineCount}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <WifiOff className="w-3 h-3" /> Hors ligne
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Utilisateurs</h2>
        </div>

        {presenceList.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Aucun utilisateur enregistré
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {presenceList.map((p) => {
              const profile = userProfiles[p.uid]
              const fullName = profile
                ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
                : p.displayName || ''
              const initials = fullName
                ? fullName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('').substring(0, 2)
                : (p.email?.charAt(0) || '?').toUpperCase()
              const isExpanded = selectedUser === p.uid

              return (
                <div key={p.uid}>
                  <button
                    onClick={() => loadSessions(p.uid)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left"
                  >
                    {/* Avatar + statut */}
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        p.online ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {initials}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        p.online ? 'bg-emerald-500' : 'bg-gray-300'
                      }`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800 truncate">
                          {fullName || p.email || 'Utilisateur'}
                        </span>
                        {profile?.company && (
                          <span className="text-xs text-gray-400 truncate hidden sm:inline">
                            — {profile.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{p.email}</span>
                        <span className="text-xs text-gray-300 hidden sm:inline">|</span>
                        <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                          <DeviceIcon device={p.device} />
                          {p.browser}
                        </span>
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="text-right shrink-0">
                      {p.online ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          En ligne
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(p.lastSeen)}
                        </span>
                      )}
                    </div>

                    {/* Chevron */}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Sessions dépliées */}
                  {isExpanded && (
                    <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 animate-fade-in">
                      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Dernières sessions ({sessions.length})
                      </h3>

                      {loadingSessions ? (
                        <div className="text-center py-4">
                          <span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        </div>
                      ) : sessions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">Aucune session enregistrée</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {sessions.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs"
                            >
                              <DeviceIcon device={s.device} />
                              <div className="flex-1">
                                <span className="font-medium text-gray-700">{s.browser || 'Inconnu'}</span>
                                <span className="text-gray-400 ml-1">sur {s.device || 'Inconnu'}</span>
                              </div>
                              <div className="text-right text-gray-400">
                                <div>
                                  {s.loginAt
                                    ? new Date(s.loginAt).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : '—'}
                                </div>
                                <div>
                                  {s.loginAt
                                    ? new Date(s.loginAt).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
