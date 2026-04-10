import { useState, useMemo } from 'react'
import {
  FileText, Plus, Pencil, Trash2, X, Save, RotateCcw,
  CheckCircle2, Circle, AlertCircle, Search,
} from 'lucide-react'
import { useDocumentLibrary } from '../hooks/useDocumentLibrary'
import { TAG_LABELS, TAG_COLORS, PHASES, SOURCE_LABELS, PRECARITY_LABELS } from '../lib/constants/documentLibrary'

const PHASE_TABS = [
  { value: 'all', label: 'Toutes les phases' },
  { value: 'avant', label: 'Avant travaux' },
  { value: 'apres', label: 'Après travaux' },
]

const TAG_TABS = [
  { value: 'all', label: 'Toutes les étiquettes' },
  { value: 'CEE', label: 'CEE' },
  { value: 'MPR', label: "MaPrimeRénov'" },
  { value: 'ANAH', label: 'Anah' },
  { value: 'RENO_AMPLEUR', label: 'Rénov. Ampleur' },
]

const SOURCE_OPTIONS = [
  { value: 'client', label: 'À fournir par le client' },
  { value: 'pro', label: "À fournir par l'installateur" },
  { value: 'generated', label: 'Généré par la plateforme' },
]

const PHASE_OPTIONS = [
  { value: 'avant', label: 'Avant travaux' },
  { value: 'apres', label: 'Après travaux' },
  { value: 'both', label: 'Les deux phases' },
]

const ALL_TAGS = ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR']

export default function DocumentLibraryPage() {
  const {
    documents,
    toggleEnabled,
    updateDocument,
    addDocument,
    removeDocument,
    resetLibrary,
  } = useDocumentLibrary()

  const [phaseFilter, setPhaseFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editingDoc, setEditingDoc] = useState(null) // doc en cours d'edition (ou 'new')

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      // Phase
      if (phaseFilter !== 'all' && doc.phase !== phaseFilter && doc.phase !== 'both') return false
      // Tag
      if (tagFilter !== 'all' && !doc.tags?.includes(tagFilter)) return false
      // Search
      if (search) {
        const q = search.toLowerCase()
        const hay = `${doc.label} ${doc.description || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [documents, phaseFilter, tagFilter, search])

  const stats = useMemo(() => ({
    total: documents.length,
    enabled: documents.filter((d) => d.enabled).length,
    custom: documents.filter((d) => !d.isDefault).length,
  }), [documents])

  function handleReset() {
    if (confirm('Réinitialiser la bibliothèque ? Toutes les modifications et documents personnalisés seront perdus.')) {
      resetLibrary()
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bibliothèque de Documents</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Gérez la liste maîtresse de tous les documents justificatifs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-slate-600 text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
          <button
            onClick={() => setEditingDoc('new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter un document
          </button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="Actifs" value={stats.enabled} color="emerald" />
        <StatCard label="Personnalisés" value={stats.custom} color="sky" />
      </div>

      {/* ─── Filtres ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Liste des documents</h2>

          {/* Phase tabs */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PHASE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPhaseFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  phaseFilter === tab.value
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tag tabs */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {TAG_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTagFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  tagFilter === tab.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Aucun document trouvé avec ces filtres</p>
            </div>
          ) : (
            filtered.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onToggle={() => toggleEnabled(doc.id)}
                onEdit={() => setEditingDoc(doc)}
                onDelete={() => {
                  if (confirm(`Supprimer définitivement « ${doc.label} » ?`)) {
                    removeDocument(doc.id)
                  }
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── Modal édition ─── */}
      {editingDoc && (
        <DocumentEditModal
          doc={editingDoc === 'new' ? null : editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={(data) => {
            if (editingDoc === 'new') {
              addDocument(data)
            } else {
              updateDocument(editingDoc.id, data)
            }
            setEditingDoc(null)
          }}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  Sous-composants
// ════════════════════════════════════════════════════════════

function StatCard({ label, value, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  }
  return (
    <div className={`rounded-xl border ${colorMap[color]} p-4`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

function DocumentRow({ doc, onToggle, onEdit, onDelete }) {
  return (
    <div className={`flex items-start gap-3 px-5 py-4 transition ${doc.enabled ? '' : 'opacity-50'}`}>
      {/* Toggle */}
      <button
        onClick={onToggle}
        className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition ${
          doc.enabled ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition my-0.5 ${
            doc.enabled ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="text-sm font-bold text-slate-800 truncate">{doc.label}</h3>
          {!doc.isDefault && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 shrink-0">
              Custom
            </span>
          )}
        </div>
        {doc.description && (
          <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {/* Phase */}
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {PHASES[doc.phase]?.short || doc.phase}
          </span>

          {/* Tags */}
          {doc.tags?.map((tag) => (
            <span
              key={tag}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
            >
              {TAG_LABELS[tag] || tag}
            </span>
          ))}

          {/* Source */}
          <span className="text-[9px] text-slate-400 italic">
            • {SOURCE_LABELS[doc.source] || doc.source}
          </span>

          {/* Mandatory */}
          {doc.mandatory && (
            <span className="text-[9px] font-bold text-red-600">• Obligatoire</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
          title="Modifier"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {!doc.isDefault && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function DocumentEditModal({ doc, onClose, onSave }) {
  const isNew = !doc
  const [form, setForm] = useState({
    label: doc?.label || '',
    description: doc?.description || '',
    phase: doc?.phase || 'avant',
    tags: doc?.tags || ['CEE'],
    source: doc?.source || 'client',
    mandatory: doc?.mandatory !== false,
    expirable: doc?.expirable === true,
  })

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  function handleSave() {
    if (!form.label.trim()) {
      alert('Le nom du document est obligatoire.')
      return
    }
    if (form.tags.length === 0) {
      alert('Sélectionnez au moins une étiquette.')
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isNew ? 'Nouveau document' : 'Modifier le document'}
            </h2>
            {!isNew && doc?.isDefault && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Document par défaut — vos modifications seront sauvegardées comme surcharges
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Nom du document *
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ex : Avis d'imposition"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Aide pour le client / contexte d'utilisation"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          {/* Phase */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Phase
            </label>
            <div className="flex gap-2">
              {PHASE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, phase: opt.value })}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                    form.phase === opt.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Dispositif(s) concerné(s) *
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => {
                const active = form.tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Source du document
            </label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-200 outline-none"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Flags */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.mandatory}
                onChange={(e) => setForm({ ...form, mandatory: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              <span className="text-xs text-slate-700">Document obligatoire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.expirable}
                onChange={(e) => setForm({ ...form, expirable: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              <span className="text-xs text-slate-700">Document avec date d'expiration (avis impôts, RGE...)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Save className="w-3.5 h-3.5" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
