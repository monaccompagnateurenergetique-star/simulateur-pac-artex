import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserPlus, Save, ArrowLeft, MapPin, Check, AlertTriangle, Thermometer, Search, Loader2, X } from 'lucide-react'
import InputField from '../components/ui/InputField'
import SelectField from '../components/ui/SelectField'
import CompletionGauge from '../components/ui/CompletionGauge'
import { useLeads } from '../hooks/useLeads'
import { getRevenueCategory } from '../lib/revenueCategory'
import { getLocationInfo } from '../utils/postalCode'
import { getCompletion } from '../lib/completionGauge'
import { searchDPE, getDpeColor } from '../utils/dpeApi'

const TYPE_LOGEMENT = [
  { value: '', label: '— Non renseigné —' },
  { value: 'maison', label: 'Maison individuelle' },
  { value: 'appartement', label: 'Appartement' },
]

export default function LeadFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { leads, addLead, updateLead } = useLeads()
  const isEdit = !!id
  const existing = isEdit ? leads.find((l) => l.id === id) : null

  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    personnes: '',
    rfr: '',
    typeLogement: '',
    surface: '',
  })

  const [validationError, setValidationError] = useState('')

  // DPE states
  const [dpeResults, setDpeResults] = useState(null)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [dpeError, setDpeError] = useState(null)
  const [showDpeResults, setShowDpeResults] = useState(false)
  const [selectedDpe, setSelectedDpe] = useState(null)

  useEffect(() => {
    if (existing) {
      setForm({
        lastName: existing.lastName || '',
        firstName: existing.firstName || '',
        phone: existing.phone || '',
        email: existing.email || '',
        address: existing.address || '',
        city: existing.city || '',
        postalCode: existing.postalCode || '',
        personnes: existing.personnes || '',
        rfr: existing.rfr || '',
        typeLogement: existing.typeLogement || '',
        surface: existing.surface || '',
      })
      if (existing.dpe) {
        setSelectedDpe(existing.dpe)
      }
    }
  }, [existing])

  // Auto-recherche DPE quand adresse + code postal sont remplis
  useEffect(() => {
    if (form.address && form.postalCode && form.postalCode.length === 5 && !selectedDpe && !dpeLoading) {
      const timer = setTimeout(() => {
        handleSearchDPEAuto()
      }, 800) // Délai pour éviter trop de requêtes
      return () => clearTimeout(timer)
    }
  }, [form.address, form.postalCode])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setValidationError('')
  }

  // Auto-detect location
  const locationInfo = useMemo(
    () => (form.postalCode.length >= 5 ? getLocationInfo(form.postalCode) : null),
    [form.postalCode]
  )

  // Auto-calculate revenue category
  const revenueInfo = useMemo(() => {
    if (!form.rfr || !form.personnes) return null
    const isIDF = locationInfo?.isIDF || false
    return getRevenueCategory(Number(form.rfr), Number(form.personnes), isIDF)
  }, [form.rfr, form.personnes, locationInfo])

  // Completion gauge
  const completion = useMemo(() => getCompletion(form), [form])

  async function handleSearchDPEAuto() {
    if (!form.postalCode || !form.address) return
    setDpeLoading(true)
    setDpeError(null)
    try {
      const { results } = await searchDPE(form.address, form.postalCode, form.city)
      if (results && results.length > 0) {
        setDpeResults(results)
        // Auto-sélectionner le premier résultat si un seul trouvé
        if (results.length === 1) {
          handleSelectDPE(results[0])
        } else {
          setShowDpeResults(true)
        }
      }
    } catch (err) {
      // Silencieusement échouer pour la recherche auto
    } finally {
      setDpeLoading(false)
    }
  }

  async function handleSearchDPE() {
    if (!form.postalCode || !form.address) {
      setDpeError('Veuillez remplir l\'adresse et le code postal.')
      return
    }
    setDpeLoading(true)
    setDpeError(null)
    setDpeResults(null)
    try {
      const { results } = await searchDPE(form.address, form.postalCode, form.city)
      setDpeResults(results)
      setShowDpeResults(true)
    } catch (err) {
      setDpeError(err.message || 'Erreur lors de la recherche DPE.')
    } finally {
      setDpeLoading(false)
    }
  }

  function handleSelectDPE(dpe) {
    setSelectedDpe({
      numeroDpe: dpe.numeroDpe,
      etiquetteDpe: dpe.etiquetteDpe,
      etiquetteGes: dpe.etiquetteGes,
      periodeConstruction: dpe.periodeConstruction,
      anneeConstruction: dpe.anneeConstruction,
      surface: dpe.surface,
      consoM2: dpe.consoM2,
      emissionGes: dpe.emissionGes,
      energieChauffage: dpe.energieChauffage,
      isolationEnveloppe: dpe.isolationEnveloppe,
      isolationMurs: dpe.isolationMurs,
      isolationMenuiseries: dpe.isolationMenuiseries,
      dateEtablissement: dpe.dateEtablissement,
      dateFinValidite: dpe.dateFinValidite,
      adresse: dpe.adresse,
      observatoireUrl: dpe.observatoireUrl,
    })
    setShowDpeResults(false)
  }

  function handleRemoveDPE() {
    setSelectedDpe(null)
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Validation : au moins phone, email ou firstName
    if (!form.phone && !form.email && !form.firstName) {
      setValidationError('Renseignez au moins un téléphone, un email ou un prénom.')
      return
    }

    const data = {
      ...form,
      rfr: form.rfr ? Number(form.rfr) : null,
      personnes: form.personnes ? Number(form.personnes) : null,
      surface: form.surface ? Number(form.surface) : null,
      typeLogement: form.typeLogement || null,
      region: locationInfo?.region || null,
      departement: locationInfo?.departement || null,
      zoneClimatique: locationInfo?.zoneClimatique || null,
      zone: locationInfo?.zoneSimplifiee || null,
      isIDF: locationInfo?.isIDF || false,
      category: revenueInfo?.category || null,
      categoryLabel: revenueInfo?.label || null,
      dpe: selectedDpe || null,
    }

    if (isEdit) {
      updateLead(id, data)
      navigate(`/leads/${id}`)
    } else {
      const lead = addLead(data)
      navigate(`/leads/${lead.id}`)
    }
  }

  const CATEGORY_COLORS = {
    Bleu: 'bg-blue-100 text-blue-800 border-blue-300',
    Jaune: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Violet: 'bg-purple-100 text-purple-800 border-purple-300',
    Rose: 'bg-pink-100 text-pink-800 border-pink-300',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-emerald-600" />
          {isEdit ? 'Modifier le lead' : 'Nouveau lead'}
        </h1>
        <CompletionGauge percent={completion.percent} size="md" variant="circle" />
      </div>

      {/* Info : champ minimum */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-sm text-emerald-700">
        <strong>Minimum requis :</strong> un téléphone, un email ou un prénom. Le reste peut être complété plus tard.
      </div>

      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identité */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Identité</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Prénom" id="firstName" value={form.firstName} onChange={(v) => set('firstName', v)} placeholder="Jean" />
            <InputField label="Nom" id="lastName" value={form.lastName} onChange={(v) => set('lastName', v)} placeholder="Dupont" />
            <InputField label="Téléphone" id="phone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="06 12 34 56 78" />
            <InputField label="Email" id="email" value={form.email} onChange={(v) => set('email', v)} placeholder="jean@email.fr" />
          </div>
        </fieldset>

        {/* Adresse */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Adresse des travaux</legend>
          <div className="space-y-4">
            <InputField label="Adresse" id="address" value={form.address} onChange={(v) => set('address', v)} placeholder="123 rue des Travaux" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Code postal" id="postalCode" value={form.postalCode} onChange={(v) => set('postalCode', v)} placeholder="38000" />
              <InputField label="Ville" id="city" value={form.city} onChange={(v) => set('city', v)} placeholder="Grenoble" />
            </div>
            {locationInfo && (
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  <MapPin className="w-3 h-3" /> {locationInfo.region}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Zone {locationInfo.zoneClimatique}</span>
                {locationInfo.isIDF && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    <Check className="w-3 h-3" /> Île-de-France
                  </span>
                )}
              </div>
            )}
          </div>
        </fieldset>

        {/* Situation fiscale */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Situation fiscale</legend>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Personnes au foyer" id="personnes" type="number" value={form.personnes} onChange={(v) => set('personnes', v)} min={1} max={20} />
              <InputField label="Revenu fiscal (RFR)" id="rfr" type="number" value={form.rfr} onChange={(v) => set('rfr', v)} suffix="€" placeholder="25000" />
            </div>
            {revenueInfo && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${CATEGORY_COLORS[revenueInfo.category]}`}>
                <div className="text-3xl font-black">{revenueInfo.category}</div>
                <div>
                  <p className="font-bold text-sm">Profil {revenueInfo.category} — {revenueInfo.label}</p>
                  <p className="text-xs opacity-75">
                    Calculé selon plafonds {locationInfo?.isIDF ? 'IDF' : 'hors IDF'} 2026
                  </p>
                </div>
              </div>
            )}
          </div>
        </fieldset>

        {/* Logement */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Logement</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Type de logement" id="typeLogement" value={form.typeLogement} onChange={(v) => set('typeLogement', v)} options={TYPE_LOGEMENT} />
            <InputField label="Surface habitable" id="surface" type="number" value={form.surface} onChange={(v) => set('surface', v)} suffix="m²" placeholder="100" />
          </div>
        </fieldset>

        {/* Diagnostic DPE */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Diagnostic énergétique (DPE)
          </legend>

          <div className="space-y-3">
            {dpeLoading && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-blue-700">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Recherche du DPE en cours...</span>
              </div>
            )}

            {!selectedDpe && !dpeLoading && form.address && form.postalCode && (
              <div className="p-2 rounded-lg bg-emerald-50 text-xs text-emerald-600 text-center">
                ℹ️ Recherche automatique du DPE
              </div>
            )}

            <button
              type="button"
              onClick={handleSearchDPE}
              disabled={!form.postalCode || !form.address}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-300 rounded-lg font-semibold text-sm hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              {selectedDpe ? 'Actualiser le DPE' : 'Rechercher manuellement'}
            </button>

            {/* DPE sélectionné */}
            {selectedDpe && (
              <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-black shrink-0 flex-col"
                    style={{ backgroundColor: getDpeColor(selectedDpe.etiquetteDpe)?.bg, color: getDpeColor(selectedDpe.etiquetteDpe)?.text }}
                  >
                    <span className="leading-tight">{selectedDpe.etiquetteDpe}</span>
                    <span className="text-[8px] leading-none">DPE</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">
                      DPE {selectedDpe.etiquetteDpe}
                      {selectedDpe.consoM2 ? ` — ${selectedDpe.consoM2} kWh/m²/an` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedDpe.periodeConstruction || selectedDpe.anneeConstruction ? `Construction : ${selectedDpe.periodeConstruction || selectedDpe.anneeConstruction}` : ''}
                      {selectedDpe.surface ? ` — ${selectedDpe.surface} m²` : ''}
                      {selectedDpe.energieChauffage ? ` — ${selectedDpe.energieChauffage}` : ''}
                    </p>
                    {selectedDpe.dateEtablissement && (
                      <p className="text-xs text-gray-400 mt-0.5">Diagnostic : {new Date(selectedDpe.dateEtablissement).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDPE}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Résultats de recherche */}
            {showDpeResults && dpeResults && dpeResults.length > 0 && (
              <div className="border border-emerald-200 rounded-lg overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-700">{dpeResults.length} diagnostic{dpeResults.length > 1 ? 's' : ''} trouvé{dpeResults.length > 1 ? 's' : ''}</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {dpeResults.slice(0, 5).map((dpe, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDPE(dpe)}
                      className="w-full text-left p-3 hover:bg-emerald-50 transition flex items-center gap-3"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 flex-col"
                        style={{ backgroundColor: getDpeColor(dpe.etiquetteDpe)?.bg, color: getDpeColor(dpe.etiquetteDpe)?.text }}
                      >
                        <span className="leading-tight">{dpe.etiquetteDpe}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">DPE {dpe.etiquetteDpe} — {dpe.consoM2 || '?'} kWh/m²</p>
                        <p className="text-xs text-gray-500 truncate">{dpe.adresse || 'Adresse non disponible'}</p>
                        {dpe.dateEtablissement && <p className="text-xs text-gray-400">{new Date(dpe.dateEtablissement).toLocaleDateString('fr-FR')}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages d'erreur/info */}
            {dpeError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                {dpeError}
              </div>
            )}
            {showDpeResults && dpeResults && dpeResults.length === 0 && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
                Aucun DPE trouvé pour cette adresse.
              </div>
            )}
          </div>
        </fieldset>

        {/* Complétion */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <CompletionGauge percent={completion.percent} variant="bar" label={`Complétion du profil — ${completion.filledCount}/${completion.totalCount} champs renseignés`} />
          {completion.missingFields.length > 0 && completion.percent < 100 && (
            <div className="mt-2 text-xs text-gray-400">
              Manquant : {completion.missingFields.map((f) => f.label).join(', ')}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 transition"
          >
            <Save className="w-5 h-5" />
            {isEdit ? 'Enregistrer' : 'Créer le lead'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
