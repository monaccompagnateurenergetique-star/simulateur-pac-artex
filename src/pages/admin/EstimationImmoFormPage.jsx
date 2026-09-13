import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Loader2, Search, Building2, MapPin, Home } from 'lucide-react'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { useEstimationsImmo } from '../../hooks/useEstimationsImmo'
import { useAgencesImmo } from '../../hooks/useAgencesImmo'
import { searchDPE, getDpeColor } from '../../utils/dpeApi'
import DpeDetailCard from '../../components/dpe/DpeDetailCard'
import { getZoneFromPostalCode } from '../../lib/constants/zones'

const TYPE_LOGEMENT = [
  { value: '', label: '— Type —' },
  { value: 'maison', label: 'Maison individuelle' },
  { value: 'appartement', label: 'Appartement' },
]
const AGES = [
  { value: '', label: '— Âge —' },
  { value: 'avant_1975', label: 'Avant 1975' },
  { value: '1975_1990', label: '1975 – 1990' },
  { value: '1990_2005', label: '1990 – 2005' },
  { value: '2005_2012', label: '2005 – 2012' },
  { value: 'apres_2012', label: 'Après 2012' },
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

export default function EstimationImmoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { estimations, addEstimation, updateEstimation } = useEstimationsImmo()
  const { agences } = useAgencesImmo()
  const isEdit = !!id
  const existing = isEdit ? estimations.find((e) => e.id === id) : null

  const [form, setForm] = useState({
    agenceId: '', dossier: '',
    addressLabel: '', codePostal: '', ville: '', coordinates: null,
    typeLogement: '', surface: '', ageBatiment: '', chauffageActuel: '',
  })

  const [dpeLoading, setDpeLoading] = useState(false)
  const [dpeResults, setDpeResults] = useState(null)
  const [selectedDpe, setSelectedDpe] = useState(null)
  const [audits, setAudits] = useState(null)
  const dpeSearched = useRef(false)

  useEffect(() => {
    if (!existing) return
    setForm({
      agenceId: existing.agenceId || '',
      dossier: existing.dossier || '',
      addressLabel: existing.addressLabel || '',
      codePostal: existing.codePostal || '',
      ville: existing.ville || '',
      coordinates: existing.coordinates || null,
      typeLogement: existing.typeLogement || '',
      surface: existing.surface || '',
      ageBatiment: existing.ageBatiment || '',
      chauffageActuel: existing.chauffageActuel || '',
    })
    if (existing.dpe) setSelectedDpe(existing.dpe)
    if (existing.audits) setAudits(existing.audits)
  }, [existing])

  const zone = useMemo(() => {
    if (!form.codePostal) return 'H2'
    try { return getZoneFromPostalCode(form.codePostal)?.zoneClimatique || 'H2' }
    catch { return 'H2' }
  }, [form.codePostal])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target ? e.target.value : e }))
  }

  function handleAddressChange({ address, postalCode, city, label, coordinates: coords }) {
    setForm((f) => ({
      ...f,
      addressLabel: label || address || '',
      codePostal: postalCode || '',
      ville: city || '',
      coordinates: coords || null,
    }))
    dpeSearched.current = false
  }

  async function handleSearchDpe() {
    if (!form.codePostal || dpeLoading) return
    setDpeLoading(true)
    setDpeResults(null)
    try {
      const { results, audits: a } = await searchDPE(form.addressLabel || '', form.codePostal, form.ville || '')
      setDpeResults(results || [])
      setAudits(a || [])
    } catch { /* ignore */ }
    finally { setDpeLoading(false) }
  }

  useEffect(() => {
    if (form.codePostal && form.addressLabel && !dpeSearched.current && !isEdit) {
      dpeSearched.current = true
      const t = setTimeout(handleSearchDpe, 800)
      return () => clearTimeout(t)
    }
  }, [form.codePostal, form.addressLabel])

  function selectDpe(d) {
    setSelectedDpe({
      numeroDpe: d.numeroDpe, etiquetteDpe: d.etiquetteDpe, etiquetteGes: d.etiquetteGes,
      periodeConstruction: d.periodeConstruction, anneeConstruction: d.anneeConstruction,
      surface: d.surface, surfaceImmeuble: d.surfaceImmeuble,
      typeBatiment: d.typeBatiment, nombreAppartements: d.nombreAppartements,
      nombreNiveaux: d.nombreNiveaux,
      consoM2: d.consoM2, emissionGes: d.emissionGes,
      coutTotal: d.coutTotal, coutChauffage: d.coutChauffage,
      installationChauffage: d.installationChauffage,
      energieChauffage: d.energieChauffage, generateurChauffage: d.generateurChauffage,
      installationEcs: d.installationEcs, energieEcs: d.energieEcs,
      typeVentilation: d.typeVentilation,
      isolationEnveloppe: d.isolationEnveloppe, isolationMurs: d.isolationMurs,
      isolationPlancherBas: d.isolationPlancherBas, isolationMenuiseries: d.isolationMenuiseries,
      dateEtablissement: d.dateEtablissement, dateFinValidite: d.dateFinValidite,
      adresse: d.adresse, codePostal: d.codePostal, commune: d.commune,
      observatoireUrl: d.observatoireUrl,
    })
    setDpeResults(null)
    if (d.surface && !form.surface) setForm((f) => ({ ...f, surface: String(Math.round(d.surface)) }))
    if (d.typeBatiment && !form.typeLogement) {
      const t = d.typeBatiment.toLowerCase().includes('maison') ? 'maison' : 'appartement'
      setForm((f) => ({ ...f, typeLogement: t }))
    }
  }

  function handleSave() {
    if (!form.addressLabel) return
    const agenceNom = agences.find((a) => a.id === form.agenceId)?.nom || ''
    const data = {
      ...form,
      surface: Number(form.surface) || null,
      agenceNom,
      zone,
      dpe: selectedDpe || null,
      audits: audits || null,
      status: 'brouillon',
    }
    if (isEdit) {
      updateEstimation(id, data)
      navigate(`/admin/estimations-immo/${id}`)
    } else {
      const est = addEstimation(data)
      navigate(`/admin/estimations-immo/${est.id}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/estimations-immo')} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier l\'estimation' : 'Nouvelle estimation'}</h1>
      </div>

      <div className="space-y-6">
        {/* Adresse */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-indigo-500" /> Adresse du bien</h2>
          <AddressAutocomplete value={form.addressLabel} onChange={handleAddressChange} placeholder="Saisissez l'adresse du bien..." />
          {form.codePostal && (
            <p className="text-xs text-gray-400 mt-2">Zone climatique : <span className="font-medium text-gray-600">{zone}</span></p>
          )}
        </section>

        {/* DPE */}
        {(selectedDpe || dpeResults || dpeLoading) && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">DPE & Diagnostic</h2>
              {!dpeLoading && (
                <button onClick={handleSearchDpe} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <Search className="w-3 h-3" /> Rechercher DPE
                </button>
              )}
            </div>
            {dpeLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Recherche DPE en cours...
              </div>
            )}
            {selectedDpe && <DpeDetailCard dpe={selectedDpe} compact onDetach={() => setSelectedDpe(null)} />}
            {!selectedDpe && dpeResults && dpeResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">{dpeResults.length} DPE trouvé{dpeResults.length > 1 ? 's' : ''} :</p>
                {dpeResults.map((d) => (
                  <DpeDetailCard key={d.numeroDpe} dpe={d} compact onAttach={() => selectDpe(d)} />
                ))}
              </div>
            )}
            {!selectedDpe && dpeResults && dpeResults.length === 0 && (
              <p className="text-sm text-gray-400 py-2">Aucun DPE trouvé pour cette adresse. Renseignez les informations manuellement.</p>
            )}
          </section>
        )}

        {/* Agence & Dossier */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4"><Building2 className="w-4 h-4 text-indigo-500" /> Agence & Dossier</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Agence immobilière</label>
              <select value={form.agenceId} onChange={set('agenceId')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white">
                <option value="">— Sélectionner —</option>
                {agences.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Référence dossier</label>
              <input type="text" value={form.dossier} onChange={set('dossier')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Ex: BTB-2024-001" />
            </div>
          </div>
        </section>

        {/* Caractéristiques du bien */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4"><Home className="w-4 h-4 text-indigo-500" /> Caractéristiques du bien</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type de logement</label>
              <select value={form.typeLogement} onChange={set('typeLogement')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white">
                {TYPE_LOGEMENT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Surface habitable (m²)</label>
              <input type="number" value={form.surface} onChange={set('surface')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Ex: 100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Âge du bâtiment</label>
              <select value={form.ageBatiment} onChange={set('ageBatiment')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white">
                {AGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Chauffage actuel</label>
              <select value={form.chauffageActuel} onChange={set('chauffageActuel')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white">
                {CHAUFFAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8">
        <button onClick={() => navigate('/admin/estimations-immo')} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">
          Annuler
        </button>
        <button onClick={handleSave} disabled={!form.addressLabel}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-40">
          <Save className="w-4 h-4" /> {isEdit ? 'Enregistrer' : 'Créer l\'estimation'}
        </button>
      </div>
    </div>
  )
}
