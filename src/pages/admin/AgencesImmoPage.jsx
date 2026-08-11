import { useState } from 'react'
import { useAgencesImmo } from '../../hooks/useAgencesImmo'
import { useEstimationsImmo } from '../../hooks/useEstimationsImmo'
import {
  Building2, Plus, X, Trash2, Pencil, Phone, Mail, MapPin, Search,
} from 'lucide-react'

const EMPTY = { nom: '', adresse: '', ville: '', codePostal: '', telephone: '', email: '', contact: '', notes: '' }

export default function AgencesImmoPage() {
  const { agences, addAgence, updateAgence, deleteAgence } = useAgencesImmo()
  const { estimations } = useEstimationsImmo()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? agences.filter((a) => [a.nom, a.ville, a.contact].join(' ').toLowerCase().includes(search.toLowerCase()))
    : agences

  function openNew() { setForm(EMPTY); setEditing('new') }
  function openEdit(a) { setForm({ nom: a.nom, adresse: a.adresse, ville: a.ville, codePostal: a.codePostal, telephone: a.telephone, email: a.email, contact: a.contact, notes: a.notes || '' }); setEditing(a.id) }
  function close() { setEditing(null); setForm(EMPTY) }

  function save() {
    if (!form.nom.trim()) return
    if (editing === 'new') addAgence(form)
    else updateAgence(editing, form)
    close()
  }

  function handleDelete(id) {
    if (window.confirm('Supprimer cette agence ?')) deleteAgence(id)
  }

  function countEstimations(agenceId) {
    return estimations.filter((e) => e.agenceId === agenceId).length
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agences immobilières</h1>
          <p className="text-sm text-gray-500 mt-1">{agences.length} agence{agences.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm">
          <Plus className="w-4 h-4" /> Nouvelle agence
        </button>
      </div>

      {agences.length > 3 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Rechercher une agence..." />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucune agence</p>
          <p className="text-gray-400 text-sm mt-1">Créez votre première agence immobilière pour commencer.</p>
          <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> Créer une agence
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 hover:border-gray-200 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{a.nom}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                  {a.ville && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.ville}{a.codePostal && ` (${a.codePostal})`}</span>}
                  {a.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.telephone}</span>}
                  {a.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{a.email}</span>}
                  {a.contact && <span>Contact : {a.contact}</span>}
                </div>
                <p className="text-xs text-indigo-500 mt-1">{countEstimations(a.id)} estimation(s)</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{editing === 'new' ? 'Nouvelle agence' : 'Modifier l\'agence'}</h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agence *</label>
                <input type="text" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Ex: Agence Centrale" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input type="text" value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input type="text" value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input type="text" value={form.codePostal} onChange={(e) => setForm((f) => ({ ...f, codePostal: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="text" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact principal</label>
                  <input type="text" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={close} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition">Annuler</button>
              <button onClick={save} disabled={!form.nom.trim()} className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-40">
                {editing === 'new' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
