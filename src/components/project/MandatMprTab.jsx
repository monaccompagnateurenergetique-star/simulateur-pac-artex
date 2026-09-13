import { useState, useMemo } from 'react'
import { FileDown, FileSignature, Check } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import { generateMandatMprPdf } from '../../lib/mandatMprPdf'

const MANDAT_TYPES = [
  { value: 'administratif', label: 'Administratif uniquement', desc: "Constitution du dossier et demande de paiement" },
  { value: 'les_deux', label: 'Administratif et Financier', desc: "Constitution du dossier + perception de la prime" },
  { value: 'financier', label: 'Financier uniquement', desc: "Perception de la prime sur le compte du mandataire" },
]

export default function MandatMprTab({ project, onUpdate }) {
  const { settings } = useSettings()
  const company = settings.company || {}

  const [mandatType, setMandatType] = useState(project.mandatMpr?.type || 'les_deux')
  const [numeroDossier, setNumeroDossier] = useState(project.mandatMpr?.numeroDossier || '')
  const [lieu, setLieu] = useState(project.mandatMpr?.lieu || project.city || '')
  const [generated, setGenerated] = useState(false)

  const mandant = useMemo(() => ({
    civilite: project.civilite || '',
    nom: project.lastName || '',
    prenom: project.firstName || '',
    adresse: project.address || '',
    codePostal: project.postalCode || '',
    commune: project.city || '',
    email: project.email || '',
    telephone: project.phone || '',
  }), [project])

  const mandataire = useMemo(() => ({
    civilite: company.representantCivilite || 'M.',
    nom: company.representantNom || '',
    prenom: company.representantPrenom || '',
    raisonSociale: company.name || '',
    adresse: company.address || '',
    codePostal: company.postalCode || '',
    commune: company.city || '',
    email: company.email || '',
    telephone: company.phone || '',
  }), [company])

  const missingMandant = !mandant.nom || !mandant.adresse || !mandant.codePostal
  const missingMandataire = !mandataire.raisonSociale && !mandataire.nom

  function handleGenerate() {
    const today = new Date()
    const dateStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

    if (onUpdate) {
      onUpdate({ mandatMpr: { type: mandatType, numeroDossier, lieu, lastGenerated: new Date().toISOString() } })
    }

    generateMandatMprPdf({
      mandant,
      mandataire,
      mandatType,
      lieu: lieu || project.city || '',
      date: dateStr,
      numeroDossier,
    })

    setGenerated(true)
    setTimeout(() => setGenerated(false), 3000)
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <FileSignature className="w-4 h-4 text-indigo-600" />
          </div>
          Mandat MaPrimeRénov'
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Type de mandat */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Type de mandat</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MANDAT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setMandatType(t.value)}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  mandatType === t.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    mandatType === t.value ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                  }`}>
                    {mandatType === t.value && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={`text-xs font-bold ${mandatType === t.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {t.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-6">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* N° dossier + Lieu */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">N° dossier MPR</label>
            <div className="flex items-center">
              <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs font-mono text-slate-500">MPR-</span>
              <input
                type="text"
                value={numeroDossier}
                onChange={(e) => setNumeroDossier(e.target.value)}
                placeholder="2024-12345"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fait à</label>
            <input
              type="text"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder={project.city || 'Ville'}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Recap Mandant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Mandant (propriétaire)</p>
            {missingMandant ? (
              <p className="text-xs text-red-500">Informations incomplètes — modifiez la fiche projet</p>
            ) : (
              <div className="space-y-1 text-xs text-blue-900">
                <p className="font-semibold">{mandant.civilite} {mandant.prenom} {mandant.nom}</p>
                <p>{mandant.adresse}</p>
                <p>{mandant.codePostal} {mandant.commune}</p>
                {mandant.email && <p>{mandant.email}</p>}
                {mandant.telephone && <p>{mandant.telephone}</p>}
              </div>
            )}
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">Mandataire (entreprise)</p>
            {missingMandataire ? (
              <p className="text-xs text-red-500">Configurez votre société dans les paramètres</p>
            ) : (
              <div className="space-y-1 text-xs text-indigo-900">
                <p className="font-semibold">{mandataire.raisonSociale}</p>
                {mandataire.nom && <p>{mandataire.civilite} {mandataire.prenom} {mandataire.nom}</p>}
                <p>{mandataire.adresse}</p>
                <p>{mandataire.codePostal} {mandataire.commune}</p>
                {mandataire.email && <p>{mandataire.email}</p>}
                {mandataire.telephone && <p>{mandataire.telephone}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleGenerate}
            disabled={missingMandant || missingMandataire}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition shadow-sm ${
              generated
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {generated ? (
              <><Check className="w-5 h-5" /> Mandat téléchargé !</>
            ) : (
              <><FileDown className="w-5 h-5" /> Générer le mandat CERFA</>
            )}
          </button>
        </div>

        {project.mandatMpr?.lastGenerated && (
          <p className="text-center text-[10px] text-slate-400">
            Dernier mandat généré le {new Date(project.mandatMpr.lastGenerated).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </section>
  )
}
