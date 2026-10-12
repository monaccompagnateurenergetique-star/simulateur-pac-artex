import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save, Loader2, MapPin, Home, Hammer, BarChart3 } from 'lucide-react'
import { useAgencies } from '../../hooks/useAgencies'
import { useEstimations, computeMultiCategorySynthesis } from '../../hooks/useEstimations'
import { calculerTTC } from '../../lib/constants/prixVente'
import AddressStep from '../../components/estimation/AddressStep'
import LogementStep from '../../components/estimation/LogementStep'
import TravauxStep from '../../components/estimation/TravauxStep'
import SyntheseStep from '../../components/estimation/SyntheseStep'

const STEPS = [
  { key: 'adresse', label: 'Adresse', icon: MapPin },
  { key: 'logement', label: 'Logement', icon: Home },
  { key: 'travaux', label: 'Travaux', icon: Hammer },
  { key: 'synthese', label: 'Synthèse', icon: BarChart3 },
]

export default function EstimationFormPage() {
  const { id: agencyId } = useParams()
  const navigate = useNavigate()
  const { agencies } = useAgencies()
  const { addEstimation } = useEstimations(agencyId)

  const agency = agencies.find((a) => a.id === agencyId)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [data, setData] = useState({
    address: '',
    postalCode: '',
    city: '',
    zoneClimatique: '',
    departement: '',
    region: '',
    isIDF: false,
    typeLogement: 'Maison',
    surface: 100,
    classInitiale: '',
    classeCible: '',
    chauffageActuel: '',
    dpeData: null,
    travaux: [],
    workMode: 'rapide',
    projectCostHT: 30000,
    projectCostTTC: 31650,
    includePAC: false,
    pacEtas: 'high',
    priceMWh: 7,
    ceePercent: 100,
  })

  function handleChange(updates) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function handleSelectDpe(dpe) {
    const updates = {
      dpeData: dpe,
    }
    if (dpe.surface) updates.surface = dpe.surface
    if (dpe.etiquetteDpe) updates.classInitiale = dpe.etiquetteDpe
    if (dpe.typeBatiment) {
      updates.typeLogement = dpe.typeBatiment.toLowerCase().includes('maison') ? 'Maison' : 'Appartement'
    }
    if (dpe.adresse) updates.address = dpe.adresse
    if (dpe.codePostal) updates.postalCode = dpe.codePostal
    if (dpe.commune) updates.city = dpe.commune
    if (dpe.energieChauffage) {
      const e = dpe.energieChauffage.toLowerCase()
      if (e.includes('gaz')) updates.chauffageActuel = 'gaz'
      else if (e.includes('fioul')) updates.chauffageActuel = 'fioul'
      else if (e.includes('électr')) updates.chauffageActuel = 'electrique'
      else if (e.includes('bois')) updates.chauffageActuel = 'bois'
    }
    handleChange(updates)
    setStep(1)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const travaux = data.travaux || []
      const isDetaille = data.workMode === 'detaille' && travaux.length > 0
      const projectCostHT = isDetaille
        ? travaux.reduce((s, t) => s + (t.prixHT || 0), 0)
        : data.projectCostHT
      const projectCostTTC = isDetaille
        ? travaux.reduce((s, t) => s + calculerTTC(t.prixHT || 0, t.tva || 5.5), 0)
        : data.projectCostTTC

      const resultats = computeMultiCategorySynthesis({
        typeLogement: data.typeLogement,
        surface: data.surface,
        classInitiale: data.classInitiale,
        classeCible: data.classeCible,
        zone: data.zoneClimatique,
        travaux,
        projectCostHT,
        projectCostTTC,
        priceMWh: data.priceMWh,
        ceePercent: data.ceePercent,
        includePAC: data.includePAC,
        pacParams: { type: data.typeLogement, etas: data.pacEtas },
      })

      const estimationData = {
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        zoneClimatique: data.zoneClimatique,
        departement: data.departement,
        region: data.region,
        typeLogement: data.typeLogement,
        surface: data.surface,
        classInitiale: data.classInitiale,
        classeCible: data.classeCible,
        chauffageActuel: data.chauffageActuel,
        dpeData: data.dpeData,
        travaux: data.travaux,
        workMode: data.workMode,
        projectCostHT,
        projectCostTTC,
        includePAC: data.includePAC,
        pacEtas: data.pacEtas,
        priceMWh: data.priceMWh,
        ceePercent: data.ceePercent,
        resultats,
        status: 'brouillon',
      }

      const estId = await addEstimation(estimationData)
      navigate(`/admin/agences/${agencyId}/estimation/${estId}`)
    } catch (err) {
      console.error('Save estimation error:', err)
    } finally {
      setSaving(false)
    }
  }

  const canNext = (() => {
    if (step === 0) return !!(data.postalCode && data.postalCode.length >= 5)
    if (step === 1) return !!(data.typeLogement && data.surface > 0 && data.classInitiale && data.classeCible)
    if (step === 2) {
      if (data.workMode === 'rapide') return data.projectCostHT > 0 && data.projectCostTTC > 0
      return (data.travaux || []).length > 0
    }
    return true
  })()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to={`/admin/agences/${agencyId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {agency?.name || 'Retour'}
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Nouvelle estimation</h1>
      <p className="text-gray-400 text-sm mb-8">
        Agence : <span className="text-indigo-400 font-medium">{agency?.name}</span>
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active = i === step
          const done = i < step
          return (
            <button
              key={s.key}
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                  : done
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-pointer'
                    : 'bg-white/5 text-gray-500 border border-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-white/5 border border-gray-700 rounded-2xl p-6 mb-6">
        {step === 0 && <AddressStep data={data} onChange={handleChange} onSelectDpe={handleSelectDpe} />}
        {step === 1 && <LogementStep data={data} onChange={handleChange} />}
        {step === 2 && <TravauxStep data={data} onChange={handleChange} />}
        {step === 3 && <SyntheseStep data={data} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder l'estimation
          </button>
        )}
      </div>
    </div>
  )
}
