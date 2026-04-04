import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'
import { db, isFirebaseConfigured, createAccountForUser } from '../lib/firebase'
import { generateTempPassword } from '../lib/passwordUtils'
import { useTeamMembers } from '../hooks/useTeamMembers'
import { ROLES, ROLE_LABELS, ROLE_COLORS, STATUS_LABELS, STATUS_COLORS } from '../lib/permissions'
import {
  Users, Wifi, Clock, Monitor, Smartphone, Tablet,
  ChevronDown, ChevronUp, Activity, Calendar, Shield, Check,
  Building2, UserCog, Plus, Copy, Eye, EyeOff, AlertCircle,
  ArrowLeft, Trash2, Edit3, Save, UserPlus, ShieldCheck, X
} from 'lucide-react'

let firestoreCollection, firestoreOnSnapshot, firestoreQuery, firestoreOrderBy,
  firestoreLimit, firestoreGetDoc, firestoreGetDocs, firestoreDoc, firestoreSetDoc, firestoreDeleteDoc

if (isFirebaseConfigured) {
  const mod = await import('firebase/firestore')
  firestoreCollection = mod.collection
  firestoreOnSnapshot = mod.onSnapshot
  firestoreQuery = mod.query
  firestoreOrderBy = mod.orderBy
  firestoreLimit = mod.limit
  firestoreGetDoc = mod.getDoc
  firestoreGetDocs = mod.getDocs
  firestoreDoc = mod.doc
  firestoreSetDoc = mod.setDoc
  firestoreDeleteDoc = mod.deleteDoc
}

async function hashEmail(email) {
  const data = new TextEncoder().encode(email.toLowerCase().trim())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "A l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${Math.floor(hours / 24)}j`
}

function DeviceIcon({ device }) {
  if (device === 'Mobile') return <Smartphone className="w-4 h-4" />
  if (device === 'Tablette') return <Tablet className="w-4 h-4" />
  return <Monitor className="w-4 h-4" />
}

// ─── Sous-composant : detail d'une organisation ───
function OrgDetailView({ org, roles, userProfiles, onBack, currentUser }) {
  const { members, loading: membersLoading, createMember, removeMember, updateMemberRole } = useTeamMembers(org.id)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', role: 'member' })
  const [createdInfo, setCreatedInfo] = useState(null)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingMember, setEditingMember] = useState(null) // uid du membre en cours d'edition
  const [memberEditForm, setMemberEditForm] = useState({ firstName: '', lastName: '', role: 'member' })

  // Edition org
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: org.name || '', slug: org.slug || '' })

  async function handleSaveOrg() {
    setSaving(true)
    try {
      await firestoreSetDoc(firestoreDoc(db, 'organizations', org.id), {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      await firestoreSetDoc(firestoreDoc(db, 'organizations', org.id, 'profile', 'info'), {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
      }, { merge: true })
      setEditing(false)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteOrg() {
    if (!confirm(`Supprimer définitivement "${org.name}" et tous ses membres ?`)) return
    setSaving(true)
    try {
      // Retirer les roles des membres
      for (const m of members) {
        await firestoreSetDoc(firestoreDoc(db, 'roles', m.uid), {
          role: null, orgId: null, status: 'disabled',
          updatedBy: currentUser.uid, updatedAt: new Date().toISOString(),
        }, { merge: true })
        await firestoreDeleteDoc(firestoreDoc(db, 'organizations', org.id, 'members', m.uid))
      }
      // Supprimer le slug
      if (org.slug) {
        await firestoreDeleteDoc(firestoreDoc(db, 'slugs', org.slug)).catch(() => {})
      }
      // Supprimer l'org
      await firestoreDeleteDoc(firestoreDoc(db, 'organizations', org.id))
      onBack()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleCreateMember(e) {
    e.preventDefault()
    if (!addForm.firstName.trim() || !addForm.email.trim()) {
      setError('Prénom et email obligatoires')
      return
    }
    setError('')
    setCreatedInfo(null)
    setSaving(true)
    try {
      const result = await createMember({
        email: addForm.email.trim(),
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        memberRole: addForm.role,
      })
      setCreatedInfo({ email: addForm.email.trim(), ...result })
      setAddForm({ firstName: '', lastName: '', email: '', role: 'member' })
      setShowAddForm(false)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleRemove(uid, name) {
    if (!confirm(`Retirer ${name || 'ce membre'} ?`)) return
    try { await removeMember(uid) } catch (err) { setError(err.message) }
  }

  async function handleToggleRole(uid, currentRole) {
    try { await updateMemberRole(uid, currentRole === 'admin' ? 'member' : 'admin') }
    catch (err) { setError(err.message) }
  }

  function startEditMember(m) {
    setEditingMember(m.uid)
    setMemberEditForm({
      firstName: m.profile?.firstName || '',
      lastName: m.profile?.lastName || '',
      role: m.role || 'member',
    })
  }

  async function handleSaveMember(uid) {
    setSaving(true)
    try {
      // Mettre a jour le profil utilisateur
      await firestoreSetDoc(firestoreDoc(db, 'users', uid, 'profile', 'info'), {
        firstName: memberEditForm.firstName.trim(),
        lastName: memberEditForm.lastName.trim(),
      }, { merge: true }).catch(() => {}) // ignore si pas permission

      // Mettre a jour les infos dans le doc membre (toujours accessible)
      await firestoreSetDoc(firestoreDoc(db, 'organizations', org.id, 'members', uid), {
        firstName: memberEditForm.firstName.trim(),
        lastName: memberEditForm.lastName.trim(),
      }, { merge: true })

      // Mettre a jour le role si change
      const currentMember = members.find((m) => m.uid === uid)
      if (currentMember && currentMember.role !== memberEditForm.role) {
        await updateMemberRole(uid, memberEditForm.role)
      }
      setEditingMember(null)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).catch(() => {})

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <Building2 className="w-6 h-6 text-indigo-500" />
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="px-2 py-1 rounded border border-gray-300 text-sm font-bold" />
              <input type="text" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                className="px-2 py-1 rounded border border-gray-300 text-sm text-gray-500" placeholder="slug" />
              <button onClick={handleSaveOrg} disabled={saving} className="p-1 rounded hover:bg-emerald-50"><Save className="w-4 h-4 text-emerald-600" /></button>
              <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800">{org.name || org.id}</h2>
              {org.slug && <p className="text-xs text-gray-400">/p/{org.slug}</p>}
            </>
          )}
        </div>
        {!editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Modifier">
              <Edit3 className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={handleDeleteOrg} disabled={saving} className="p-2 rounded-lg hover:bg-red-50 transition" title="Supprimer">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Resultat creation */}
      {createdInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-700">
              {createdInfo.isExisting ? 'Membre ajouté' : 'Compte créé'}
            </h3>
          </div>
          {createdInfo.isExisting ? (
            <p className="text-sm text-emerald-600"><strong>{createdInfo.email}</strong> a été ajouté avec ses identifiants existants.</p>
          ) : (
            <>
              <p className="text-sm text-emerald-600 mb-3">Identifiants de <strong>{createdInfo.email}</strong> :</p>
              <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Email :</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{createdInfo.email}</code>
                    <button onClick={() => copyToClipboard(createdInfo.email)} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Mot de passe :</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{showPwd ? createdInfo.tempPassword : '••••••••••••'}</code>
                    <button onClick={() => setShowPwd(!showPwd)} className="p-1 hover:bg-gray-100 rounded">{showPwd ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}</button>
                    <button onClick={() => copyToClipboard(createdInfo.tempPassword)} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-emerald-500 mt-2">Mot de passe à changer à la première connexion.</p>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Membres ({members.length})
        </h3>
        <button onClick={() => { setShowAddForm(!showAddForm); setCreatedInfo(null); setError('') }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition">
          <UserPlus className="w-3.5 h-3.5" /> Ajouter un membre
        </button>
      </div>

      {/* Formulaire ajout */}
      {showAddForm && (
        <form onSubmit={handleCreateMember} className="bg-white rounded-2xl border border-gray-200 p-5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom *</label>
              <input type="text" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nom</label>
              <input type="text" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Rôle</label>
              <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm">
                <option value="member">Membre</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition">
              {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <UserPlus className="w-4 h-4" />}
              Créer
            </button>
          </div>
        </form>
      )}

      {/* Liste membres */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {membersLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun membre</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m) => {
              const profile = m.profile
              const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : ''
              const initials = fullName ? fullName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('').substring(0, 2) : '?'
              const isAdmin = m.role === 'admin'
              const isEditing = editingMember === m.uid

              if (isEditing) {
                return (
                  <div key={m.uid} className="px-5 py-4 bg-indigo-50/50 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Prénom</label>
                        <input type="text" value={memberEditForm.firstName} onChange={(e) => setMemberEditForm({ ...memberEditForm, firstName: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Nom</label>
                        <input type="text" value={memberEditForm.lastName} onChange={(e) => setMemberEditForm({ ...memberEditForm, lastName: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Rôle</label>
                        <select value={memberEditForm.role} onChange={(e) => setMemberEditForm({ ...memberEditForm, role: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm">
                          <option value="member">Membre</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <button onClick={() => handleSaveMember(m.uid)} disabled={saving}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
                          <Save className="w-3.5 h-3.5" /> Enregistrer
                        </button>
                        <button onClick={() => setEditingMember(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Annuler</button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">{profile?.email || m.uid}</p>
                  </div>
                )
              }

              return (
                <div key={m.uid} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">{fullName || 'Sans nom'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isAdmin ? 'Admin' : 'Membre'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{profile?.email || ''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEditMember(m)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Modifier">
                      <Edit3 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleToggleRole(m.uid, m.role)} className="p-2 rounded-lg hover:bg-gray-100 transition"
                      title={isAdmin ? 'Rétrograder' : 'Promouvoir'}>
                      {isAdmin ? <Shield className="w-4 h-4 text-gray-400" /> : <ShieldCheck className="w-4 h-4 text-indigo-500" />}
                    </button>
                    <button onClick={() => handleRemove(m.uid, fullName)} className="p-2 rounded-lg hover:bg-red-50 transition" title="Retirer">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Composant principal ───
export default function AdminPage() {
  const { user } = useAuth()
  const { isSuperAdmin } = useRole()
  const [tab, setTab] = useState('orgs')
  const [presenceList, setPresenceList] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const [roles, setRoles] = useState({})
  const [orgs, setOrgs] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null) // org detail view

  // Presence
  const [selectedUser, setSelectedUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Creation org
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [orgForm, setOrgForm] = useState({ name: '', slug: '', adminEmail: '', adminFirstName: '', adminLastName: '' })
  const [createdOrgInfo, setCreatedOrgInfo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // ── Listeners ──
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    return firestoreOnSnapshot(firestoreCollection(db, 'roles'), (snap) => {
      const r = {}; snap.forEach((doc) => { r[doc.id] = doc.data() }); setRoles(r)
    })
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    return firestoreOnSnapshot(firestoreCollection(db, 'organizations'), (snap) => {
      setOrgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    return firestoreOnSnapshot(firestoreCollection(db, 'presence'), (snap) => {
      const items = []; snap.forEach((doc) => { items.push({ uid: doc.id, ...doc.data() }) })
      items.sort((a, b) => (a.online && !b.online ? -1 : !a.online && b.online ? 1 : new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0)))
      setPresenceList(items)
      items.forEach((item) => {
        if (!userProfiles[item.uid]) {
          firestoreGetDocs(firestoreQuery(firestoreCollection(db, 'users', item.uid, 'profile'))).then((s) => {
            s.forEach((doc) => { setUserProfiles((prev) => ({ ...prev, [item.uid]: doc.data() })) })
          }).catch(() => {})
        }
      })
    })
  }, [])

  useEffect(() => {
    Object.keys(roles).forEach((uid) => {
      if (!userProfiles[uid]) {
        firestoreGetDocs(firestoreQuery(firestoreCollection(db, 'users', uid, 'profile'))).then((s) => {
          s.forEach((doc) => { setUserProfiles((prev) => ({ ...prev, [uid]: doc.data() })) })
        }).catch(() => {})
      }
    })
  }, [roles])

  // ── Actions ──
  const loadSessions = async (uid) => {
    if (selectedUser === uid) { setSelectedUser(null); return }
    setSelectedUser(uid); setLoadingSessions(true)
    try {
      const q = firestoreQuery(firestoreCollection(db, 'users', uid, 'sessions'), firestoreOrderBy('loginAt', 'desc'), firestoreLimit(20))
      const snap = await firestoreGetDocs(q)
      const items = []; snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }))
      setSessions(items)
    } catch { setSessions([]) }
    finally { setLoadingSessions(false) }
  }

  const toggleUserStatus = async (uid, currentStatus) => {
    setSaving(true)
    try {
      await firestoreSetDoc(firestoreDoc(db, 'roles', uid), {
        status: currentStatus === 'active' ? 'disabled' : 'active',
        updatedBy: user.uid, updatedAt: new Date().toISOString(),
      }, { merge: true })
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const createOrganization = async () => {
    const { name, slug: rawSlug, adminEmail, adminFirstName, adminLastName } = orgForm
    if (!name.trim()) { setFormError('Nom obligatoire'); return }
    if (!adminEmail.trim()) { setFormError('Email admin obligatoire'); return }
    if (!adminFirstName.trim()) { setFormError('Prénom admin obligatoire'); return }

    setFormError(''); setSaving(true)
    try {
      const orgId = 'org_' + Date.now()
      const slug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const emailLower = adminEmail.toLowerCase().trim()
      let uid, tempPassword = null, isExisting = false

      const emailHash = await hashEmail(emailLower)
      const emailSnap = await firestoreGetDoc(firestoreDoc(db, 'email_to_uid', emailHash))

      if (emailSnap.exists()) {
        uid = emailSnap.data().uid
        isExisting = true
      } else {
        tempPassword = generateTempPassword()
        uid = await createAccountForUser(emailLower, tempPassword)
        await firestoreSetDoc(firestoreDoc(db, 'users', uid, 'profile', 'info'), {
          email: emailLower, firstName: adminFirstName.trim(), lastName: adminLastName.trim(),
          company: name.trim(), mustChangePassword: true, createdAt: new Date().toISOString(),
        })
        await firestoreSetDoc(firestoreDoc(db, 'email_to_uid', emailHash), { uid, email: emailLower })
      }

      await firestoreSetDoc(firestoreDoc(db, 'roles', uid), {
        role: ROLES.INSTALLER_ADMIN, orgId, status: 'active',
        createdBy: user.uid, createdAt: new Date().toISOString(),
      }, { merge: true })

      const orgData = { name: name.trim(), slug, createdAt: new Date().toISOString(), createdBy: user.uid }
      await firestoreSetDoc(firestoreDoc(db, 'organizations', orgId), orgData)
      await firestoreSetDoc(firestoreDoc(db, 'organizations', orgId, 'profile', 'info'), orgData)
      await firestoreSetDoc(firestoreDoc(db, 'organizations', orgId, 'members', uid), {
        role: 'admin', firstName: adminFirstName.trim(), lastName: adminLastName.trim(),
        email: emailLower, joinedAt: new Date().toISOString(), invitedBy: user.uid,
      })
      await firestoreSetDoc(firestoreDoc(db, 'slugs', slug), { orgId })

      setCreatedOrgInfo({ email: emailLower, tempPassword, orgName: name.trim(), isExisting })
      setOrgForm({ name: '', slug: '', adminEmail: '', adminFirstName: '', adminLastName: '' })
    } catch (err) { setFormError(err.message) }
    finally { setSaving(false) }
  }

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).catch(() => {})

  const onlineCount = presenceList.filter((p) => p.online).length
  const installerRoles = Object.entries(roles).filter(([, r]) => r.role !== ROLES.BENEFICIARY)
  const pendingCount = Object.values(roles).filter((r) => r.status === 'pending_approval').length

  if (!user) return null

  // ── Vue detail d'une org ──
  if (selectedOrg) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <OrgDetailView
          org={selectedOrg}
          roles={roles}
          userProfiles={userProfiles}
          currentUser={user}
          onBack={() => setSelectedOrg(null)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" /> Administration
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{orgs.length}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Building2 className="w-3 h-3" /> Entreprises</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{installerRoles.length}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Utilisateurs</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{onlineCount}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Wifi className="w-3 h-3" /> En ligne</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> En attente</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'orgs', label: 'Entreprises', icon: Building2 },
          { id: 'users', label: 'Utilisateurs', icon: UserCog, badge: pendingCount },
          { id: 'presence', label: 'Connexions', icon: Activity },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
              tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
            {t.badge > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Entreprises ═══ */}
      {tab === 'orgs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Entreprises</h2>
            <button onClick={() => { setShowNewOrg(!showNewOrg); setCreatedOrgInfo(null); setFormError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition">
              <Plus className="w-3.5 h-3.5" /> Nouvelle entreprise
            </button>
          </div>

          {/* Resultat creation */}
          {createdOrgInfo && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-700">Entreprise "{createdOrgInfo.orgName}" créée</h3>
              </div>
              {createdOrgInfo.isExisting ? (
                <p className="text-sm text-emerald-600"><strong>{createdOrgInfo.email}</strong> a été assigné comme administrateur avec ses identifiants existants.</p>
              ) : (
                <>
                  <p className="text-sm text-emerald-600 mb-3">Identifiants de l'administrateur :</p>
                  <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Email :</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{createdOrgInfo.email}</code>
                        <button onClick={() => copyToClipboard(createdOrgInfo.email)} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Mot de passe :</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{showPwd ? createdOrgInfo.tempPassword : '••••••••••••'}</code>
                        <button onClick={() => setShowPwd(!showPwd)} className="p-1 hover:bg-gray-100 rounded">{showPwd ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}</button>
                        <button onClick={() => copyToClipboard(createdOrgInfo.tempPassword)} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-500 mt-2">Mot de passe à changer à la première connexion.</p>
                </>
              )}
            </div>
          )}

          {/* Formulaire creation */}
          {showNewOrg && !createdOrgInfo && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Créer une entreprise + administrateur</h3>
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom entreprise *</label>
                  <input type="text" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="ACME Rénovation" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (mini-site)</label>
                  <input type="text" value={orgForm.slug} onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="acme-renovation" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Administrateur</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Prénom *</label>
                    <input type="text" value={orgForm.adminFirstName} onChange={(e) => setOrgForm({ ...orgForm, adminFirstName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nom</label>
                    <input type="text" value={orgForm.adminLastName} onChange={(e) => setOrgForm({ ...orgForm, adminLastName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                    <input type="email" value={orgForm.adminEmail} onChange={(e) => setOrgForm({ ...orgForm, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowNewOrg(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annuler</button>
                <button onClick={createOrganization} disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition">
                  {saving ? 'Création...' : 'Créer l\'entreprise'}
                </button>
              </div>
            </div>
          )}

          {/* Liste orgs — cliquable pour voir le detail */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {orgs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune entreprise</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orgs.map((org) => {
                  const orgMembers = Object.entries(roles).filter(([, r]) => r.orgId === org.id)
                  const admin = orgMembers.find(([, r]) => r.role === ROLES.INSTALLER_ADMIN)
                  const adminProfile = admin ? userProfiles[admin[0]] : null
                  const adminName = adminProfile ? [adminProfile.firstName, adminProfile.lastName].filter(Boolean).join(' ') : ''

                  return (
                    <button key={org.id} onClick={() => setSelectedOrg(org)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800">{org.name || org.id}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          {org.slug && <span>/p/{org.slug}</span>}
                          {adminName && <span>Admin : {adminName}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-700">{orgMembers.length}</p>
                        <p className="text-xs text-gray-400">membre{orgMembers.length !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 shrink-0 -rotate-90" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: Utilisateurs ═══ */}
      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tous les utilisateurs</h2>
          </div>
          {installerRoles.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun utilisateur</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {installerRoles.sort(([, a], [, b]) => {
                if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1
                if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1
                return 0
              }).map(([uid, roleData]) => {
                const profile = userProfiles[uid]
                const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : ''
                const email = profile?.email || ''
                const initials = fullName ? fullName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('').substring(0, 2) : (email?.charAt(0) || '?').toUpperCase()
                const isDisabled = roleData.status === 'disabled'
                const isSelf = uid === user.uid
                const orgName = orgs.find((o) => o.id === roleData.orgId)?.name

                return (
                  <div key={uid} className={`px-5 py-4 ${isDisabled ? 'bg-gray-50 opacity-60' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDisabled ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-700'}`}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-800">{fullName || 'Sans nom'}</span>
                          {roleData.role && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ROLE_COLORS[roleData.role]?.bg || 'bg-gray-100'} ${ROLE_COLORS[roleData.role]?.text || 'text-gray-600'}`}>
                              {ROLE_LABELS[roleData.role] || roleData.role}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[roleData.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[roleData.status]?.text || 'text-gray-600'}`}>
                            {STATUS_LABELS[roleData.status] || roleData.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{email}</p>
                        {orgName && <p className="text-xs text-indigo-400 mt-0.5">{orgName}</p>}
                      </div>
                      {!isSelf && roleData.status !== 'pending_approval' && (
                        <button onClick={() => toggleUserStatus(uid, roleData.status)} disabled={saving}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${isDisabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                          {isDisabled ? 'Réactiver' : 'Désactiver'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Connexions ═══ */}
      {tab === 'presence' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Connexions en temps réel</h2>
          </div>
          {presenceList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun utilisateur</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {presenceList.map((p) => {
                const profile = userProfiles[p.uid]
                const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : p.displayName || ''
                const initials = fullName ? fullName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('').substring(0, 2) : (p.email?.charAt(0) || '?').toUpperCase()
                const isExpanded = selectedUser === p.uid

                return (
                  <div key={p.uid}>
                    <button onClick={() => loadSessions(p.uid)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${p.online ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{initials}</div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${p.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-800 truncate">{fullName || p.email || 'Utilisateur'}</span>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{p.email}</span>
                          <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1"><DeviceIcon device={p.device} />{p.browser}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {p.online ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />En ligne
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(p.lastSeen)}</span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 animate-fade-in">
                        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />Sessions ({sessions.length})
                        </h3>
                        {loadingSessions ? (
                          <div className="text-center py-4"><span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
                        ) : sessions.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-2">Aucune session</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {sessions.map((s) => (
                              <div key={s.id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs">
                                <DeviceIcon device={s.device} />
                                <div className="flex-1"><span className="font-medium text-gray-700">{s.browser || 'Inconnu'}</span> <span className="text-gray-400">sur {s.device || 'Inconnu'}</span></div>
                                <div className="text-right text-gray-400">
                                  <div>{s.loginAt ? new Date(s.loginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                                  <div>{s.loginAt ? new Date(s.loginAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
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
      )}
    </div>
  )
}
