import { useState, useRef } from 'react'
import {
  FileText, Upload, Trash2, Check, X, Download, Eye,
  Loader2, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react'
import { useDocumentStorage, DOC_UPLOAD_STATUSES } from '../../hooks/useDocumentStorage'
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary'
import { PHASES, TAG_LABELS, TAG_COLORS } from '../../lib/constants/documentLibrary'

const PHASE_TABS = [
  { value: 'avant', label: 'Avant Travaux' },
  { value: 'apres', label: 'Après Travaux' },
]

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const TAG_OPTIONS = [
  { value: 'CEE', label: 'CEE' },
  { value: 'MPR', label: "MaPrimeRénov'" },
  { value: 'ANAH', label: 'Anah' },
  { value: 'RENO_AMPLEUR', label: "Rénov. d'Ampleur" },
]

/**
 * ProjectDocuments — Section documents du projet avec upload Cloud Storage
 * Affiche une checklist par phase (avant/après travaux)
 * avec statut, upload drag & drop, et gestion des fichiers.
 */
export default function ProjectDocuments({ projectId, initialTags = ['CEE'], precarity = '' }) {
  const {
    documents: uploadedDocs,
    loading,
    uploading,
    uploadProgress,
    uploadDocument,
    updateStatus,
    removeDocument,
  } = useDocumentStorage(projectId)

  const { documents: libraryDocs } = useDocumentLibrary()
  const [phase, setPhase] = useState('avant')
  const [selectedTags, setSelectedTags] = useState(initialTags)
  const [dragOver, setDragOver] = useState(null) // docType en cours de drag
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const [activeUploadType, setActiveUploadType] = useState(null)

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Docs requis pour la phase et les tags sélectionnés (uniquement actifs)
  const requiredDocs = libraryDocs.filter((doc) => {
    if (!doc.enabled) return false
    if (doc.phase !== phase && doc.phase !== 'both') return false
    const hasTag = doc.tags.some((t) => selectedTags.includes(t))
    if (!hasTag) return false
    if (precarity && doc.precarity && !doc.precarity.includes(precarity)) return false
    return true
  })

  // Matcher les documents uploadés avec la checklist
  function getUploadedForType(docType) {
    return uploadedDocs.filter((d) => d.docType === docType)
  }

  async function handleUpload(file, docType, label) {
    if (!file) return
    setError('')
    try {
      await uploadDocument(file, docType, label)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload')
    }
  }

  function handleDrop(e, docType, label) {
    e.preventDefault()
    setDragOver(null)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleUpload(file, docType, label)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file && activeUploadType) {
      handleUpload(file, activeUploadType.docType, activeUploadType.label)
    }
    setActiveUploadType(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openFilePicker(docType, label) {
    setActiveUploadType({ docType, label })
    fileInputRef.current?.click()
  }

  async function handleRemove(doc) {
    if (!confirm(`Supprimer « ${doc.fileName} » ?`)) return
    try {
      await removeDocument(doc.id, doc.storagePath)
    } catch (err) {
      setError(err.message)
    }
  }

  const totalRequired = requiredDocs.length
  const totalFilled = requiredDocs.filter((d) => getUploadedForType(d.id).length > 0).length
  const completion = totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            Documents du dossier
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">
              {totalFilled}/{totalRequired}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              completion === 100 ? 'bg-emerald-100 text-emerald-700' :
              completion >= 50 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {completion}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completion === 100 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-500' : 'bg-red-400'
            }`}
            style={{ width: `${completion}%` }}
          />
        </div>

        {/* Dispositifs */}
        <div className="mb-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Dispositif(s) du dossier
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TAG_OPTIONS.map((opt) => {
              const active = selectedTags.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTag(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Phase tabs */}
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Phase du dossier
        </label>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {PHASE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPhase(tab.value)}
              className={`flex-1 px-4 py-2 text-xs font-semibold transition ${
                phase === tab.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-3 h-3 text-red-400" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Checklist */}
      <div className="p-5 space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-5 h-5 text-slate-300 mx-auto animate-spin" />
          </div>
        ) : requiredDocs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-6 h-6 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Aucun document requis pour cette phase</p>
          </div>
        ) : (
          requiredDocs.map((libDoc) => {
            const uploaded = getUploadedForType(libDoc.id)
            const hasFile = uploaded.length > 0
            const isDragTarget = dragOver === libDoc.id

            return (
              <div
                key={libDoc.id}
                className={`rounded-xl border transition ${
                  isDragTarget
                    ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                    : hasFile
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-white'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(libDoc.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, libDoc.id, libDoc.label)}
              >
                {/* Doc header */}
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {hasFile ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-slate-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{libDoc.label}</h4>
                      {libDoc.mandatory && (
                        <span className="text-[8px] font-bold text-red-600 px-1 py-0.5 bg-red-50 rounded">REQUIS</span>
                      )}
                      {libDoc.source === 'generated' && (
                        <span className="text-[8px] font-bold text-sky-600 px-1 py-0.5 bg-sky-50 rounded">AUTO</span>
                      )}
                    </div>
                    {libDoc.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{libDoc.description}</p>
                    )}

                    {/* Fichiers uploadés */}
                    {uploaded.map((file) => {
                      const st = DOC_UPLOAD_STATUSES[file.status] || DOC_UPLOAD_STATUSES.en_attente
                      return (
                        <div key={file.id} className="flex items-center gap-2 mt-2 p-2 bg-white rounded-lg border border-slate-100">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-slate-700 truncate">{file.fileName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-slate-400">{formatFileSize(file.fileSize)}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Valider / Refuser */}
                            {file.status === 'en_attente' && (
                              <>
                                <button
                                  onClick={() => updateStatus(file.id, 'valide')}
                                  className="p-1 rounded hover:bg-emerald-50 transition" title="Valider"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  onClick={() => updateStatus(file.id, 'refuse')}
                                  className="p-1 rounded hover:bg-red-50 transition" title="Refuser"
                                >
                                  <X className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </>
                            )}
                            {/* Télécharger */}
                            {file.fileUrl && (
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded hover:bg-slate-100 transition" title="Voir"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                              </a>
                            )}
                            {/* Supprimer */}
                            <button
                              onClick={() => handleRemove(file)}
                              className="p-1 rounded hover:bg-red-50 transition" title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={() => openFilePicker(libDoc.id, libDoc.label)}
                    disabled={uploading}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition ${
                      uploading
                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                        : hasFile
                          ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    {hasFile ? 'Remplacer' : 'Téléverser'}
                  </button>
                </div>

                {/* Upload progress */}
                {uploading && activeUploadType?.docType === libDoc.id && (
                  <div className="px-4 pb-3">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">Upload en cours... {uploadProgress}%</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function Circle(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}
