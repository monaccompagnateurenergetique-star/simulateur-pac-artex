import { useState, useMemo } from 'react'
import { X, Mail, Copy, Check, FileText, ExternalLink } from 'lucide-react'
import { generateDocumentRequestEmail, buildMailtoLink } from '../../lib/documentEmailGenerator'
import { TAG_LABELS } from '../../lib/constants/documentLibrary'

const TAG_OPTIONS = [
  { value: 'CEE', label: 'CEE' },
  { value: 'MPR', label: "MaPrimeRénov'" },
  { value: 'ANAH', label: 'Anah' },
  { value: 'RENO_AMPLEUR', label: "Rénov. d'Ampleur" },
]

const PRECARITY_OPTIONS = [
  { value: '', label: 'Toutes catégories' },
  { value: 'tres_modeste', label: 'Très modestes' },
  { value: 'modeste', label: 'Modestes' },
  { value: 'intermediaire', label: 'Intermédiaires' },
  { value: 'superieur', label: 'Supérieurs' },
]

const PHASE_OPTIONS = [
  { value: 'avant', label: 'Avant travaux' },
  { value: 'apres', label: 'Après travaux' },
]

/**
 * Modal — Demande de pieces aux beneficiaires
 * Genere un email pre-rempli avec la liste de documents requis
 * selon le dispositif, la phase et la categorie de precarite.
 */
export default function DocumentRequestModal({
  open,
  onClose,
  clientFirstName = '',
  clientLastName = '',
  clientEmail = '',
  initialTags = ['CEE'],
  initialPrecarity = '',
  company = {},
}) {
  const [selectedTags, setSelectedTags] = useState(initialTags)
  const [precarity, setPrecarity] = useState(initialPrecarity)
  const [phase, setPhase] = useState('avant')
  const [copied, setCopied] = useState(false)

  const email = useMemo(() => {
    return generateDocumentRequestEmail({
      clientFirstName,
      clientLastName,
      tags: selectedTags,
      precarity: precarity || null,
      phase,
      company,
      replyEmail: company?.email || '',
    })
  }, [clientFirstName, clientLastName, selectedTags, precarity, phase, company])

  const mailtoLink = useMemo(() => {
    return buildMailtoLink({
      to: clientEmail,
      subject: email.subject,
      plainText: email.plainText,
    })
  }, [clientEmail, email])

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email.plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Demander des pièces au client</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Génère automatiquement l'email de demande selon le dispositif et le profil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* ─── Body scrollable ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Filtres */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dispositifs */}
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Dispositif(s) concerné(s)
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((opt) => {
                  const active = selectedTags.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleTag(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Phase */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Phase du dossier
              </label>
              <div className="flex gap-2">
                {PHASE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPhase(opt.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                      phase === opt.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Précarité */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Catégorie de revenus
              </label>
              <select
                value={precarity}
                onChange={(e) => setPrecarity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-200 outline-none"
              >
                {PRECARITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Récap documents */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Documents demandés au client
              </h3>
              <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-white rounded-full border border-slate-200">
                {email.documentsCount} pièce{email.documentsCount > 1 ? 's' : ''}
              </span>
            </div>
            {email.documents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">
                Aucun document à demander avec ces filtres
              </p>
            ) : (
              <ul className="space-y-1.5">
                {email.documents.map((doc) => (
                  <li key={doc.id} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700">{doc.label}</span>
                      {doc.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{doc.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Aperçu email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Aperçu de l'email
            </label>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Objet</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{email.subject}</p>
              </div>
              <pre className="text-[11px] text-slate-700 font-sans p-4 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {email.plainText}
              </pre>
            </div>
          </div>
        </div>

        {/* ─── Footer actions ─── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2"
          >
            Fermer
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={email.documentsCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copier
                </>
              )}
            </button>
            <a
              href={mailtoLink}
              onClick={(e) => {
                if (email.documentsCount === 0) e.preventDefault()
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm ${
                email.documentsCount === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ouvrir dans la messagerie
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
