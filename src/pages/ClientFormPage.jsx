import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Save, ArrowLeft, Check, AlertTriangle,
  Loader2, X, Upload, FileText, User, Home, MapPin, Edit3, Trash2, Users as UsersIcon
} from 'lucide-react'
import InputField from '../components/ui/InputField'
import SelectField from '../components/ui/SelectField'
import AddressAutocomplete from '../components/ui/AddressAutocomplete'
import CompletionGauge from '../components/ui/CompletionGauge'
import { useProjects } from '../hooks/useProjects'
import { getRevenueCategory } from '../lib/revenueCategory'
import { getLocationInfo } from '../utils/postalCode'
import { getCompletion } from '../lib/completionGauge'
import { searchDPE, getDpeColor } from '../utils/dpeApi'
import { extractAvisImposition } from '../lib/ocrAvisImposition'
import { cumulerAvis, partsToPersonnes } from '../lib/partsFiscales'

const CIVILITES = [
  { value: '', label: '— Civilité —' },
  { value: 'M', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
]
const OCCUPATIONS = [
  { value: '', label: '— Occupation —' },
  { value: 'proprietaire_occupant', label: 'Propriétaire occupant' },
  { value: 'locataire', label: 'Locataire' },
  { value: 'proprietaire_bailleur', label: 'Propriétaire bailleur' },
]
const TYPE_LOGEMENT = [
  { value: '', label: '— Type —' },
  { value: 'maison', label: 'Maison individuelle' },
  { value: 'appartement', label: 'Appartement' },
]
const AGES_BATIMENT = [
  { value: '', label: '— Âge —' },
  { value: 'plus_15', label: 'Plus de 15 ans' },
  { value: 'plus_2', label: 'Plus de 2 ans' },
  { value: 'moins_2', label: 'Moins de 2 ans' },
]
const CHAUFFAGES = [
  { value: '', label: '— Chauffage —' },
  { value: 'fioul', label: 'Fioul' },
  { value: 'gaz', label: 'Gaz' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'bois', label: 'Bois / Bûches' },
  { value: 'granules', label: 'Granulés / Pellets' },
  { value: 'charbon', label: 'Charbon' },
  { value: 'gpl', label: 'GPL / Propane' },
  { value: 'pac', label: 'Pompe à chaleur' },
  { value: 'autre', label: 'Autre' },
]

export default function ClientFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { projects, addProject, updateProject } = useProjects()
  const isEdit = id && id !== 'nouveau'
  const existing = isEdit ? projects.find((c) => c.id === id) : null

  const [form, setForm] = useState(() => ({
    civilite: '', lastName: '', firstName: '', phone: '', email: '', occupation: '',
    address: searchParams.get('address') || '', city: searchParams.get('city') || '',
    postalCode: searchParams.get('postalCode') || '',
    personnes: '', rfr: '', typeLogement: '', surface: '', surfaceHabitable: '',
    ageBatiment: '', chauffageActuel: '',
  }))
  const [validationError, setValidationError] = useState('')

  // Avis d'imposition
  const [avisList, setAvisList] = useState([])
  const [showAvisModal, setShowAvisModal] = useState(false)
  const [editingAvisIndex, setEditingAvisIndex] = useState(-1)
  const [avisEditForm, setAvisEditForm] = useState({
    numeroFiscal: '', referenceAvis: '', rfr: '', parts: '',
    nom1: '', prenom1: '', nom2: '', prenom2: '',
    personnesCharge: '', adresse: '', codePostal: '', ville: '',
  })
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState('')
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null)
  const [uploadedFileType, setUploadedFileType] = useState(null)
  const fileInputRef = useRef(null)

  // DPE
  const [dpeResults, setDpeResults] = useState(null)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [showDpeResults, setShowDpeResults] = useState(false)
  const [selectedDpe, setSelectedDpe] = useState(null)

  // Charger existant
  useEffect(() => {
    if (existing) {
      setForm({
        civilite: existing.civilite || '', lastName: existing.lastName || '',
        firstName: existing.firstName || '', phone: existing.phone || '',
        email: existing.email || '', occupation: existing.occupation || '',
        address: existing.address || '', city: existing.city || '',
        postalCode: existing.postalCode || '', personnes: existing.personnes || '',
        rfr: existing.rfr || '', typeLogement: existing.typeLogement || '',
        surface: existing.surface || '', surfaceHabitable: existing.surfaceHabitable || '',
        ageBatiment: existing.ageBatiment || '', chauffageActuel: existing.chauffageActuel || '',
      })
      if (existing.dpe) setSelectedDpe(existing.dpe)
      if (existing.avisImposition) {
        const avis = Array.isArray(existing.avisImposition) ? existing.avisImposition : [existing.avisImposition]
        setAvisList(avis)
      }
    }
  }, [existing])

  // Auto-recherche DPE
  useEffect(() => {
    if (form.address && form.postalCode?.length === 5 && !selectedDpe && !dpeLoading) {
      const t = setTimeout(async () => {
        setDpeLoading(true)
        try {
          const results = await searchDPE(form.address, form.postalCode, form.city)
          setDpeResults(results)
          if (results?.length === 1) setSelectedDpe(results[0])
          else if (results?.length > 1) setShowDpeResults(true)
        } catch { /* ignore */ }
        finally { setDpeLoading(false) }
      }, 800)
      return () => clearTimeout(t)
    }
  }, [form.address, form.postalCode])

  // Cumul avis
  const avisCumul = useMemo(() => avisList.length > 0 ? cumulerAvis(avisList) : null, [avisList])
  useEffect(() => {
    if (avisCumul) {
      setForm((p) => ({ ...p, rfr: avisCumul.totalRfr || p.rfr, personnes: avisCumul.totalPersonnes || p.personnes }))
    }
  }, [avisCumul])

  // Calculs derives
  const locationInfo = useMemo(() => form.postalCode?.length === 5 ? getLocationInfo(form.postalCode) : null, [form.postalCode])
  const categoryInfo = useMemo(() => {
    if (form.rfr && form.personnes) return getRevenueCategory(Number(form.rfr), Number(form.personnes), locationInfo?.isIDF || false)
    return null
  }, [form.rfr, form.personnes, locationInfo])
  const completion = useMemo(() => getCompletion(form), [form])

  function setField(key, value) { setForm((p) => ({ ...p, [key]: value })) }

  // ── OCR ──
  async function handleOcrUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFileUrl(URL.createObjectURL(file))
    setUploadedFileType(file.type === 'application/pdf' ? 'pdf' : 'image')
    setOcrLoading(true); setOcrProgress(0); setOcrError('')
    try {
      const result = await extractAvisImposition(file, setOcrProgress)
      const extracted = {
        numeroFiscal: String(result.numeroFiscal || ''),
        referenceAvis: String(result.referenceAvis || ''),
        rfr: result.rfr != null ? String(result.rfr) : '',
        parts: result.parts != null ? String(result.parts) : '',
        nom1: String(result.nom || ''), prenom1: String(result.prenom || ''),
        nom2: '', prenom2: '',
        personnesCharge: result.personnesCharge != null ? String(result.personnesCharge) : '',
        adresse: String(result.adresse || ''),
        codePostal: String(result.codePostal || ''),
        ville: String(result.ville || ''),
      }
      if (result.error && !result.rfr && !result.nom && !result.numeroFiscal) setOcrError(result.error)
      setAvisEditForm(extracted)
      setEditingAvisIndex(-1)
      setShowAvisModal(true)
    } catch { setOcrError('Erreur lors de l\'analyse') }
    finally { setOcrLoading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  // ── Avis CRUD ──
  function saveAvisEdit() {
    if (editingAvisIndex >= 0) {
      setAvisList((prev) => prev.map((a, i) => i === editingAvisIndex ? avisEditForm : a))
    } else {
      setAvisList((prev) => [...prev, avisEditForm])
    }
    const isFirst = editingAvisIndex === 0 || (editingAvisIndex < 0 && avisList.length === 0)
    if (isFirst) {
      if (avisEditForm.nom1) setField('lastName', avisEditForm.nom1)
      if (avisEditForm.prenom1) setField('firstName', avisEditForm.prenom1)
      if (avisEditForm.adresse) setField('address', avisEditForm.adresse)
      if (avisEditForm.codePostal) setField('postalCode', avisEditForm.codePostal)
      if (avisEditForm.ville) setField('city', avisEditForm.ville)
    }
    setShowAvisModal(false); setEditingAvisIndex(-1)
  }
  function deleteAvis(i) { setAvisList((prev) => prev.filter((_, idx) => idx !== i)) }
  function editAvis(i) { setEditingAvisIndex(i); setAvisEditForm({ ...avisList[i] }); setShowAvisModal(true) }

  // ── Adresse ──
  function handleAddressSelect({ address, postalCode, city }) {
    setForm((p) => ({ ...p, address: address || p.address, postalCode: postalCode || p.postalCode, city: city || p.city }))
    setSelectedDpe(null); setDpeResults(null)
  }

  // ── Sauvegarde ──
  function handleSubmit() {
    if (!form.firstName && !form.lastName && !form.phone && !form.email) {
      setValidationError('Renseignez au moins un nom, un téléphone ou un email')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setValidationError('')
    const data = {
      ...form,
      personnes: form.personnes ? Number(form.personnes) : null,
      rfr: form.rfr ? Number(form.rfr) : null,
      surface: form.surface ? Number(form.surface) : null,
      surfaceHabitable: form.surfaceHabitable ? Number(form.surfaceHabitable) : null,
      region: locationInfo?.region || null, departement: locationInfo?.departement || null,
      zoneClimatique: locationInfo?.zoneClimatique || null, zone: locationInfo?.zone || null,
      isIDF: locationInfo?.isIDF || false,
      category: categoryInfo?.category || null, categoryLabel: categoryInfo?.label || null,
      dpe: selectedDpe || null, avisImposition: avisList.length > 0 ? avisList : null,
    }
    if (isEdit) { updateProject(id, data); navigate(`/projets/${id}`) }
    else { const p = addProject(data); navigate(`/projets/${p.id}`) }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(isEdit ? `/projets/${id}` : '/projets')}
            className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Modifier le dossier' : 'Nouveau dossier'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <CompletionGauge percent={completion.percent} size="sm" variant="circle" />
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition">
            <Save className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />{validationError}
        </div>
      )}

      {/* ═══ SECTION 1 : Informations Fiscales ═══ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" /> Informations Fiscales du Foyer
        </h2>
        <p className="text-xs text-gray-400 mb-4">Saisissez manuellement ou analysez un ou plusieurs avis d'imposition.</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <InputField label="Revenu fiscal de référence (€)" value={form.rfr} onChange={(v) => setField('rfr', v)} type="number" placeholder="15000" />
          <InputField label="Nombre de personnes dans le foyer" value={form.personnes} onChange={(v) => setField('personnes', v)} type="number" placeholder="2" />
        </div>

        {categoryInfo && (
          <div className={`flex items-center justify-between p-3 rounded-lg border mb-4 ${
            categoryInfo.category === 'Bleu' ? 'bg-blue-50 border-blue-200' :
            categoryInfo.category === 'Jaune' ? 'bg-yellow-50 border-yellow-200' :
            categoryInfo.category === 'Violet' ? 'bg-purple-50 border-purple-200' : 'bg-pink-50 border-pink-200'
          }`}>
            <span className="text-sm text-gray-700">Catégorie de revenus estimée</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
              categoryInfo.category === 'Bleu' ? 'bg-blue-500' : categoryInfo.category === 'Jaune' ? 'bg-yellow-500' :
              categoryInfo.category === 'Violet' ? 'bg-purple-500' : 'bg-pink-500'
            }`}>{categoryInfo.label}</span>
          </div>
        )}

        {/* Upload avis */}
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleOcrUpload} className="hidden" id="ocr-upload" />
        {ocrLoading ? (
          <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-500">Analyse en cours... {ocrProgress}%</p>
            <div className="w-48 mx-auto mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${ocrProgress}%` }} />
            </div>
          </div>
        ) : (
          <label htmlFor="ocr-upload"
            className="flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">Analyser et ajouter un avis d'imposition</span>
          </label>
        )}
        {ocrError && <p className="text-xs text-red-500 mt-2">{ocrError}</p>}

        {/* Liste des avis */}
        {avisList.length > 0 && (
          <div className="mt-4 space-y-3">
            {avisList.map((avis, idx) => (
              <div key={idx} className="border border-emerald-200 rounded-xl p-4 bg-emerald-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Avis {idx + 1}</p>
                    <p className="text-sm text-gray-700">{avis.nom1} {avis.prenom1}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => editAvis(idx)} className="p-1.5 rounded-lg hover:bg-emerald-100 transition"><Edit3 className="w-4 h-4 text-emerald-600" /></button>
                    <button onClick={() => deleteAvis(idx)} className="p-1.5 rounded-lg hover:bg-red-100 transition"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div><span className="text-gray-400">Revenu</span><p className="font-bold text-gray-800">{Number(avis.rfr || 0).toLocaleString('fr-FR')} €</p></div>
                  <div><span className="text-gray-400">Parts</span><p className="font-bold text-gray-800">{avis.parts || '—'}</p></div>
                  <div><span className="text-gray-400">Personnes</span><p className="font-bold text-gray-800 flex items-center gap-1"><UsersIcon className="w-3 h-3" /> {avis.parts ? partsToPersonnes(Number(avis.parts)) : '—'}</p></div>
                  <div><span className="text-gray-400">N° fiscal</span><p className="font-bold text-gray-800 text-[10px]">{avis.numeroFiscal || '—'}</p></div>
                </div>
              </div>
            ))}
            {avisList.length > 1 && avisCumul && (
              <div className="border-2 border-indigo-300 rounded-xl p-4 bg-indigo-50">
                <p className="text-sm font-bold text-indigo-700 mb-2">Cumul du foyer ({avisList.length} avis)</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><span className="text-indigo-400">RFR total</span><p className="font-bold text-indigo-800 text-lg">{avisCumul.totalRfr.toLocaleString('fr-FR')} €</p></div>
                  <div><span className="text-indigo-400">Parts totales</span><p className="font-bold text-indigo-800 text-lg">{avisCumul.totalParts}</p></div>
                  <div><span className="text-indigo-400">Personnes</span><p className="font-bold text-indigo-800 text-lg flex items-center gap-1"><UsersIcon className="w-4 h-4" /> {avisCumul.totalPersonnes}</p></div>
                </div>
              </div>
            )}
            {avisList.length === 1 && avisCumul && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <UsersIcon className="w-3.5 h-3.5" />
                {avisCumul.totalParts} part{avisCumul.totalParts > 1 ? 's' : ''} → {avisCumul.totalPersonnes} personne{avisCumul.totalPersonnes > 1 ? 's' : ''} dans le foyer
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ SECTION 2 : Identité ═══ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" /> Identité du bénéficiaire
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <SelectField label="Civilité" value={form.civilite} onChange={(v) => setField('civilite', v)} options={CIVILITES} />
          <InputField label="Nom" value={form.lastName} onChange={(v) => setField('lastName', v)} placeholder="ex: Dupont" />
          <InputField label="Prénom" value={form.firstName} onChange={(v) => setField('firstName', v)} placeholder="ex: Jean" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <SelectField label="Occupation" value={form.occupation} onChange={(v) => setField('occupation', v)} options={OCCUPATIONS} />
          <InputField label="Téléphone mobile" value={form.phone} onChange={(v) => setField('phone', v)} type="tel" placeholder="ex: 0612345678" />
        </div>
        <InputField label="Email" value={form.email} onChange={(v) => setField('email', v)} type="email" placeholder="ex: jean.dupont@email.com" />
      </div>

      {/* ═══ SECTION 3 : Logement ═══ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Home className="w-4 h-4 text-indigo-500" /> Logement
        </h2>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adresse des travaux</label>
          <AddressAutocomplete
            value={form.address ? `${form.address}${form.postalCode ? ', ' + form.postalCode : ''}${form.city ? ' ' + form.city : ''}` : ''}
            onChange={handleAddressSelect}
            placeholder="Saisissez l'adresse complète..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <InputField label="Code postal" value={form.postalCode} onChange={(v) => setField('postalCode', v)} placeholder="57000" />
          <InputField label="Ville" value={form.city} onChange={(v) => setField('city', v)} placeholder="Metz" />
        </div>

        {locationInfo && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">{locationInfo.region}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">Zone {locationInfo.zoneClimatique}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-bold">Dept. {locationInfo.departement}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <InputField label="Surface chauffée (m²)" value={form.surface} onChange={(v) => setField('surface', v)} type="number" placeholder="100" />
          <InputField label="Surface habitable (m²)" value={form.surfaceHabitable} onChange={(v) => setField('surfaceHabitable', v)} type="number" placeholder="100" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type de logement</label>
            <div className="flex gap-4">
              {[{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="typeLogement" value={opt.value} checked={form.typeLogement === opt.value}
                    onChange={() => setField('typeLogement', opt.value)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Âge du bâtiment</label>
            <div className="flex flex-col gap-1">
              {[{ value: 'plus_15', label: 'Plus de 15 ans' }, { value: 'plus_2', label: 'Plus de 2 ans' }, { value: 'moins_2', label: 'Moins de 2 ans' }].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ageBatiment" value={opt.value} checked={form.ageBatiment === opt.value}
                    onChange={() => setField('ageBatiment', opt.value)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <SelectField label="Type de chauffage actuel" value={form.chauffageActuel} onChange={(v) => setField('chauffageActuel', v)} options={CHAUFFAGES} />

        {/* DPE */}
        {dpeLoading && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600 mt-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Recherche DPE en cours...
          </div>
        )}
        {selectedDpe && (
          <div className="mt-4 p-4 rounded-xl border-2" style={{ borderColor: getDpeColor(selectedDpe.etiquetteDpe) }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: getDpeColor(selectedDpe.etiquetteDpe) }}>{selectedDpe.etiquetteDpe}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">DPE {selectedDpe.etiquetteDpe} — {selectedDpe.consoM2} kWh/m²/an</p>
                <p className="text-xs text-gray-500">{selectedDpe.surface} m² — {selectedDpe.periodeConstruction}</p>
              </div>
              <button onClick={() => { setSelectedDpe(null); setShowDpeResults(true) }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        {showDpeResults && !selectedDpe && dpeResults?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500">{dpeResults.length} DPE trouvé{dpeResults.length > 1 ? 's' : ''}</p>
            {dpeResults.slice(0, 5).map((dpe, i) => (
              <button key={i} onClick={() => { setSelectedDpe(dpe); setShowDpeResults(false) }}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition text-left">
                <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: getDpeColor(dpe.etiquetteDpe) }}>{dpe.etiquetteDpe}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{dpe.consoM2} kWh/m²/an — {dpe.surface} m²</p>
                  <p className="text-xs text-gray-400">{dpe.periodeConstruction} — {dpe.energieChauffage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bouton Enregistrer bas de page */}
      <div className="flex justify-end">
        <button onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition">
          <Save className="w-4 h-4" /> {isEdit ? 'Enregistrer les modifications' : 'Créer le dossier'}
        </button>
      </div>

      {/* ═══ MODAL : Vérifier un avis d'imposition ═══ */}
      {showAvisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAvisModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg">Vérifier un avis d'imposition</h3>
              <button onClick={() => setShowAvisModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Formulaire */}
              <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-100">
                {ocrError && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" /><span>Veuillez remplir les champs manquants</span>
                  </div>
                )}
                <div className="space-y-3">
                  {[
                    { key: 'nom1', label: 'Nom du déclarant' },
                    { key: 'prenom1', label: 'Prénom du déclarant' },
                    { key: 'adresse', label: 'Adresse' },
                  ].map(({ key, label }) => (
                    <InputField key={key} label={label} value={avisEditForm[key] ?? ''} onChange={(v) => setAvisEditForm((p) => ({ ...p, [key]: v }))} />
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Code postal" value={avisEditForm.codePostal ?? ''} onChange={(v) => setAvisEditForm((p) => ({ ...p, codePostal: v }))} />
                    <InputField label="Ville" value={avisEditForm.ville ?? ''} onChange={(v) => setAvisEditForm((p) => ({ ...p, ville: v }))} />
                  </div>
                  {[
                    { key: 'numeroFiscal', label: 'Numéro Fiscal' },
                    { key: 'referenceAvis', label: 'Référence avis' },
                    { key: 'rfr', label: 'Revenu fiscal de référence' },
                  ].map(({ key, label }) => (
                    <InputField key={key} label={label} value={avisEditForm[key] ?? ''} onChange={(v) => setAvisEditForm((p) => ({ ...p, [key]: v }))} />
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Nombre de parts" value={avisEditForm.parts ?? ''} onChange={(v) => setAvisEditForm((p) => ({ ...p, parts: v }))} />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de personnes</label>
                      <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-base font-bold text-indigo-700 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        {avisEditForm.parts ? partsToPersonnes(Number(avisEditForm.parts)) : '—'}
                      </div>
                    </div>
                  </div>
                  {avisEditForm.parts && (
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700">
                      <UsersIcon className="w-3.5 h-3.5 shrink-0" />
                      {avisEditForm.parts} part{Number(avisEditForm.parts) > 1 ? 's' : ''} → <strong>{partsToPersonnes(Number(avisEditForm.parts))} personne{partsToPersonnes(Number(avisEditForm.parts)) > 1 ? 's' : ''}</strong> dans le foyer
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Nom Déclarant 2" value={avisEditForm.nom2 ?? ''} onChange={(v) => setAvisEditForm((p) => ({ ...p, nom2: v }))} placeholder="(optionnel)" />
                    <InputField label="Prénom Déclarant 2" value={avisEditForm.prenom2 ?? ''} onChange={(v) => setAvisEditForm((p) => ({ ...p, prenom2: v }))} placeholder="(optionnel)" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">Merci de vérifier l'exactitude des données renseignées.</p>
                <button onClick={saveAvisEdit}
                  className="w-full mt-4 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition">
                  Insérer les informations
                </button>
              </div>
              {/* Preview */}
              <div className="w-1/2 bg-gray-50 p-4 overflow-auto flex items-start justify-center">
                {uploadedFileUrl ? (
                  uploadedFileType === 'pdf' ? (
                    <iframe src={uploadedFileUrl} className="w-full h-full min-h-[500px] rounded-lg border border-gray-200" />
                  ) : (
                    <img src={uploadedFileUrl} alt="Avis" className="max-w-full rounded-lg border border-gray-200 shadow-sm" />
                  )
                ) : (
                  <div className="text-center text-gray-400 py-20">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Aucun document</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
