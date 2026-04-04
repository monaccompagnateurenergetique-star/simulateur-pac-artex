import { useState } from 'react'
import { useDocumentRequests, DOC_REQUEST_STATUSES, DOC_TYPES } from '../../hooks/useDocumentRequests'
import { useRole } from '../../contexts/RoleContext'
import {
  FileText, Plus, Clock, CheckCircle, X, Send, AlertCircle
} from 'lucide-react'

export default function DocumentRequestsPage() {
  const { requests, loading, createRequest, updateRequestStatus } = useDocumentRequests()
  const { isSuperAdmin, isOrgMember } = useRole()
  const isInstaller = isSuperAdmin() || isOrgMember()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    beneficiaryUid: '',
    projectId: '',
    docType: 'autre',
    label: '',
    message: '',
  })

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.beneficiaryUid.trim()) return
    await createRequest(form)
    setForm({ beneficiaryUid: '', projectId: '', docType: 'autre', label: '', message: '' })
    setShowForm(false)
  }

  const pendingCount = requests.filter((r) => r.status === 'en_attente').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Demandes de documents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} en attente sur {requests.length} demande{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isInstaller && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle demande
          </button>
        )}
      </div>

      {/* Formulaire de demande (installateur) */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 animate-fade-in">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Demander un document au bénéficiaire
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">UID du bénéficiaire *</label>
              <input
                type="text"
                value={form.beneficiaryUid}
                onChange={(e) => setForm({ ...form, beneficiaryUid: e.target.value })}
                placeholder="UID Firebase du bénéficiaire"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Type de document</label>
              <select
                value={form.docType}
                onChange={(e) => setForm({ ...form, docType: e.target.value, label: DOC_TYPES.find((d) => d.value === e.target.value)?.label || '' })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Message (optionnel)</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Précisions sur le document demandé..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Annuler
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
              <Send className="w-4 h-4" />
              Envoyer la demande
            </button>
          </div>
        </form>
      )}

      {/* Liste des demandes */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune demande de document</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusMeta = DOC_REQUEST_STATUSES.find((s) => s.value === req.status) || DOC_REQUEST_STATUSES[0]
            return (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{req.label}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${statusMeta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>
                    </div>
                    {req.message && <p className="text-xs text-gray-400 mt-1">{req.message}</p>}
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {isInstaller && req.status === 'en_attente' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => updateRequestStatus(req.id, 'fourni')}
                        className="p-2 rounded-lg hover:bg-emerald-50 transition"
                        title="Marquer comme fourni"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </button>
                      <button
                        onClick={() => updateRequestStatus(req.id, 'refuse')}
                        className="p-2 rounded-lg hover:bg-red-50 transition"
                        title="Refuser"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
