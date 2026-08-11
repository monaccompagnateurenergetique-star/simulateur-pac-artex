import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Building2, Wrench, Euro, BarChart3,
  ChevronLeft, ChevronRight, Save, Download,
  Plus, Trash2, Check, Home, ArrowRight,
} from 'lucide-react'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { useAgencesImmo } from '../../hooks/useAgencesImmo'
import { useEstimationsImmo } from '../../hooks/useEstimationsImmo'
import { PRIX_TRAVAUX_DEFAUT, ESTIMATION_STATUSES } from '../../lib/constants/prixTravaux'
import { WORK_GROUPS_MAISON, WORK_GROUPS_APPART, ENERGY_CLASSES, TARGET_CLASSES, TVA_RATES } from '../../lib/constants/renovationGlobale'
import { computeEstimationSynthese } from '../../lib/calculators/estimationImmo'
import { getZoneFromPostalCode } from '../../lib/constants/zones'

const STEPS = [
  { key: 'adresse', label: 'Adresse', icon: MapPin },
  { key: 'bien', label: 'Bien', icon: Home },
  { key: 'travaux', label: 'Travaux', icon: Wrench },
  { key: 'prix', label: 'Prix', icon: Euro },
  { key: 'synthese', label: 'Synthèse', icon: BarChart3 },
]

const DPE_COLORS = { A: '#319834', B: '#33a357', C: '#51b84b', D: '#f2e500', E: '#f0b400', F: '#eb8235', G: '#d7221f' }

function DpeBadge({ letter }) {
  if (!letter) return null
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: DPE_COLORS[letter] || '#999' }}>
      {letter}
    </span>
  )
}

const eur = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v || 0)

export default function EstimationImmoWizardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { agences } = useAgencesImmo()
  const { estimations, addEstimation, updateEstimation } = useEstimationsImmo()

  const [step, setStep] = useState(0)

  // Form state
  const [agenceId, setAgenceId] = useState('')
  const [dossier, setDossier] = useState('')
  const [addressLabel, setAddressLabel] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [codePostal, setCodePostal] = useState('')
  const [ville, setVille] = useState('')
  const [typeLogement, setTypeLogement] = useState('maison')
  const [surface, setSurface] = useState('')
  const [dpeActuel, setDpeActuel] = useState('')
  const [dpeVise, setDpeVise] = useState('')
  const [ageBatiment, setAgeBatiment] = useState('')
  const [selectedWorks, setSelectedWorks] = useState([])
  const [workPrices, setWorkPrices] = useState({})
  const [notes, setNotes] = useState('')

  // Load existing estimation for editing
  useEffect(() => {
    if (!id) return
    const est = estimations.find((e) => e.id === id)
    if (!est) return
    setAgenceId(est.agenceId || '')
    setDossier(est.dossier || '')
    setAddressLabel(est.addressLabel || '')
    setCoordinates(est.coordinates || null)
    setCodePostal(est.codePostal || '')
    setVille(est.ville || '')
    setTypeLogement(est.typeLogement || 'maison')
    setSurface(est.surface || '')
    setDpeActuel(est.dpeActuel || '')
    setDpeVise(est.dpeVise || '')
    setAgeBatiment(est.ageBatiment || '')
    setNotes(est.notes || '')
    if (est.travaux?.length) {
      setSelectedWorks(est.travaux.map((t) => t.code))
      const prices = {}
      est.travaux.forEach((t) => {
        prices[t.code] = { prixTTC: t.prixTTC, quantite: t.quantite || 1, tva: t.tva || 5.5 }
      })
      setWorkPrices(prices)
    }
  }, [id, estimations])

  const zone = useMemo(() => {
    if (!codePostal) return 'H2'
    try {
      const info = getZoneFromPostalCode(codePostal)
      return info?.zoneClimatique || 'H2'
    } catch { return 'H2' }
  }, [codePostal])

  const workGroups = typeLogement === 'appartement' ? WORK_GROUPS_APPART : WORK_GROUPS_MAISON

  const travaux = useMemo(() => {
    return selectedWorks.map((code) => {
      const defaults = PRIX_TRAVAUX_DEFAUT[code] || {}
      const custom = workPrices[code] || {}
      return {
        code,
        label: defaults.label || code,
        ficheCode: defaults.ficheCode || null,
        prixTTC: custom.prixTTC ?? defaults.prixTTC ?? 0,
        quantite: custom.quantite ?? 1,
        tva: custom.tva ?? defaults.tva ?? 5.5,
        unite: defaults.unite || null,
      }
    })
  }, [selectedWorks, workPrices])

  const totalTravauxTTC = useMemo(() => {
    return travaux.reduce((sum, t) => sum + (t.prixTTC * (t.quantite || 1)), 0)
  }, [travaux])

  const totalTravauxHT = useMemo(() => {
    return travaux.reduce((sum, t) => {
      const ttc = t.prixTTC * (t.quantite || 1)
      return sum + ttc / (1 + (t.tva || 5.5) / 100)
    }, 0)
  }, [travaux])

  const synthese = useMemo(() => {
    if (step < 4 || !travaux.length || !totalTravauxTTC) return null
    return computeEstimationSynthese({
      travaux,
      totalTravauxTTC,
      params: {
        typeLogement,
        surface: Number(surface) || 100,
        zone,
        dpeActuel,
        dpeVise,
      },
    })
  }, [step, travaux, totalTravauxTTC, typeLogement, surface, zone, dpeActuel, dpeVise])

  const agenceNom = agences.find((a) => a.id === agenceId)?.nom || ''

  function handleSave() {
    const data = {
      agenceId: agenceId || null,
      agenceNom,
      dossier,
      addressLabel,
      coordinates,
      codePostal,
      ville,
      typeLogement,
      surface: Number(surface) || null,
      dpeActuel,
      dpeVise,
      ageBatiment,
      travaux,
      totalTravauxTTC: Math.round(totalTravauxTTC),
      totalTravauxHT: Math.round(totalTravauxHT),
      synthese,
      status: synthese ? 'termine' : 'brouillon',
      notes,
    }
    if (id) {
      updateEstimation(id, data)
    } else {
      addEstimation(data)
    }
    navigate('/admin/estimations-immo')
  }

  function handleAddressChange({ address, postalCode, city, label, coordinates: coords }) {
    setAddressLabel(label || address || '')
    setCodePostal(postalCode || '')
    setVille(city || '')
    setCoordinates(coords || null)
  }

  function toggleWork(code) {
    setSelectedWorks((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  function updateWorkPrice(code, field, value) {
    setWorkPrices((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }))
  }

  const canNext = () => {
    if (step === 0) return !!addressLabel
    if (step === 1) return !!typeLogement && !!surface
    if (step === 2) return selectedWorks.length > 0
    if (step === 3) return totalTravauxTTC > 0
    return true
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/estimations-immo')} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {id ? 'Modifier l\'estimation' : 'Nouvelle estimation'}
          </h1>
          <p className="text-sm text-gray-500">{addressLabel || 'Estimation de rénovation énergétique'}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 bg-white rounded-2xl p-2 border border-gray-100">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active = i === step
          const done = i < step
          return (
            <button
              key={s.key}
              onClick={() => i <= step && setStep(i)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition
                ${active ? 'bg-indigo-600 text-white shadow-sm' : done ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-400'}`}
            >
              {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        {step === 0 && <StepAdresse
          addressLabel={addressLabel}
          onAddressChange={handleAddressChange}
          agenceId={agenceId}
          setAgenceId={setAgenceId}
          agences={agences}
          dossier={dossier}
          setDossier={setDossier}
        />}

        {step === 1 && <StepBien
          typeLogement={typeLogement}
          setTypeLogement={setTypeLogement}
          surface={surface}
          setSurface={setSurface}
          dpeActuel={dpeActuel}
          setDpeActuel={setDpeActuel}
          dpeVise={dpeVise}
          setDpeVise={setDpeVise}
          ageBatiment={ageBatiment}
          setAgeBatiment={setAgeBatiment}
        />}

        {step === 2 && <StepTravaux
          workGroups={workGroups}
          selectedWorks={selectedWorks}
          toggleWork={toggleWork}
        />}

        {step === 3 && <StepPrix
          travaux={travaux}
          workPrices={workPrices}
          updateWorkPrice={updateWorkPrice}
          totalTravauxTTC={totalTravauxTTC}
        />}

        {step === 4 && <StepSynthese
          synthese={synthese}
          totalTravauxTTC={totalTravauxTTC}
          travaux={travaux}
          addressLabel={addressLabel}
          dpeActuel={dpeActuel}
          dpeVise={dpeVise}
          agenceNom={agenceNom}
          notes={notes}
          setNotes={setNotes}
        />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>

        <div className="flex items-center gap-3">
          {step === 4 && (
            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm">
              <Save className="w-4 h-4" /> Sauvegarder
            </button>
          )}
          {step < 4 && (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-40"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Step 1 — Adresse & Agence
   ═══════════════════════════════════════════ */
function StepAdresse({ addressLabel, onAddressChange, agenceId, setAgenceId, agences, dossier, setDossier }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Adresse du bien</h2>
        <p className="text-sm text-gray-500 mb-4">Recherchez l'adresse pour localiser le bien immobilier</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <AddressAutocomplete
          value={addressLabel}
          onChange={onAddressChange}
          placeholder="Saisissez l'adresse du bien..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agence immobilière</label>
          <select
            value={agenceId}
            onChange={(e) => setAgenceId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
          >
            <option value="">— Sélectionner une agence —</option>
            {agences.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Référence dossier</label>
          <input
            type="text"
            value={dossier}
            onChange={(e) => setDossier(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            placeholder="Ex: BTB-2024-001"
          />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Step 2 — Caractéristiques du bien
   ═══════════════════════════════════════════ */
function StepBien({ typeLogement, setTypeLogement, surface, setSurface, dpeActuel, setDpeActuel, dpeVise, setDpeVise, ageBatiment, setAgeBatiment }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Caractéristiques du bien</h2>
        <p className="text-sm text-gray-500 mb-4">Décrivez le logement à rénover</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de logement</label>
          <div className="flex gap-2">
            {[['maison', 'Maison'], ['appartement', 'Appartement']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTypeLogement(v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition
                  ${typeLogement === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Surface habitable (m²)</label>
          <input
            type="number"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            placeholder="Ex: 100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">DPE actuel</label>
          <div className="flex gap-1.5">
            {ENERGY_CLASSES.map((c) => (
              <button
                key={c.value}
                onClick={() => setDpeActuel(c.value)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition
                  ${dpeActuel === c.value ? 'text-white ring-2 ring-offset-1 ring-indigo-500' : 'text-white opacity-60 hover:opacity-90'}`}
                style={{ backgroundColor: DPE_COLORS[c.value] }}
              >
                {c.value}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">DPE visé après travaux</label>
          <div className="flex gap-1.5">
            {TARGET_CLASSES.map((c) => (
              <button
                key={c.value}
                onClick={() => setDpeVise(c.value)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition
                  ${dpeVise === c.value ? 'text-white ring-2 ring-offset-1 ring-indigo-500' : 'text-white opacity-60 hover:opacity-90'}`}
                style={{ backgroundColor: DPE_COLORS[c.value] }}
              >
                {c.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Âge du bâtiment</label>
        <select
          value={ageBatiment}
          onChange={(e) => setAgeBatiment(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white max-w-xs"
        >
          <option value="">— Sélectionner —</option>
          <option value="avant_1975">Avant 1975</option>
          <option value="1975_1990">1975 – 1990</option>
          <option value="1990_2005">1990 – 2005</option>
          <option value="2005_2012">2005 – 2012</option>
          <option value="apres_2012">Après 2012</option>
        </select>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Step 3 — Sélection des travaux
   ═══════════════════════════════════════════ */
function StepTravaux({ workGroups, selectedWorks, toggleWork }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Travaux de rénovation</h2>
        <p className="text-sm text-gray-500 mb-4">Sélectionnez les postes de travaux prévus</p>
      </div>

      {workGroups.map((group) => (
        <div key={group.group}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>{group.icon}</span> {group.label}
            {group.note && <span className="text-xs font-normal text-amber-600">({group.note})</span>}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((item) => {
              const isSelected = selectedWorks.includes(item.value)
              const defaults = PRIX_TRAVAUX_DEFAUT[item.value]
              return (
                <button
                  key={item.value}
                  onClick={() => toggleWork(item.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition text-sm
                    ${isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition
                    ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium">{item.label}</span>
                    {item.r && <span className="text-xs text-gray-400 ml-1">({item.r})</span>}
                    {defaults?.unite && (
                      <span className="block text-xs text-gray-400">{defaults.prixTTC} {defaults.unite}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {selectedWorks.length > 0 && (
        <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-700 font-medium">
          {selectedWorks.length} poste(s) sélectionné(s)
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Step 4 — Prix de vente
   ═══════════════════════════════════════════ */
function StepPrix({ travaux, workPrices, updateWorkPrice, totalTravauxTTC }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Prix de vente des travaux</h2>
        <p className="text-sm text-gray-500 mb-4">Ajustez les prix TTC pour chaque poste</p>
      </div>

      <div className="space-y-3">
        {travaux.map((t) => (
          <div key={t.code} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{t.label}</p>
              {t.ficheCode && <p className="text-xs text-indigo-500 uppercase">{t.ficheCode}</p>}
            </div>

            {t.unite && (
              <div className="w-20">
                <label className="text-[10px] text-gray-400 uppercase">Qté</label>
                <input
                  type="number"
                  value={workPrices[t.code]?.quantite ?? t.quantite}
                  onChange={(e) => updateWorkPrice(t.code, 'quantite', Number(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                  min={1}
                />
              </div>
            )}

            <div className="w-28">
              <label className="text-[10px] text-gray-400 uppercase">Prix TTC{t.unite ? ` (${t.unite})` : ''}</label>
              <input
                type="number"
                value={workPrices[t.code]?.prixTTC ?? t.prixTTC}
                onChange={(e) => updateWorkPrice(t.code, 'prixTTC', Number(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right"
              />
            </div>

            <div className="w-24">
              <label className="text-[10px] text-gray-400 uppercase">TVA</label>
              <select
                value={workPrices[t.code]?.tva ?? t.tva}
                onChange={(e) => updateWorkPrice(t.code, 'tva', Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {TVA_RATES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="w-24 text-right">
              <label className="text-[10px] text-gray-400 uppercase">Total</label>
              <p className="text-sm font-bold text-gray-900">
                {eur(t.prixTTC * (t.quantite || 1))}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-5 py-4">
        <span className="text-sm font-semibold text-indigo-900">Total travaux TTC</span>
        <span className="text-xl font-bold text-indigo-700">{eur(totalTravauxTTC)}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Step 5 — Synthèse financière
   ═══════════════════════════════════════════ */
const CAT_CONFIG = [
  { key: 'bleu', label: 'Bleu', sub: 'Très modestes', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600' },
  { key: 'jaune', label: 'Jaune', sub: 'Modestes', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500' },
  { key: 'violet', label: 'Violet', sub: 'Intermédiaires', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600' },
  { key: 'rose', label: 'Rose', sub: 'Supérieurs', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-500' },
]

function StepSynthese({ synthese, totalTravauxTTC, travaux, addressLabel, dpeActuel, dpeVise, agenceNom, notes, setNotes }) {
  if (!synthese) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Complétez les étapes précédentes pour voir la synthèse</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Synthèse financière</h2>
        <p className="text-sm text-gray-500">
          Estimation des aides pour {addressLabel || 'le bien'}
          {dpeActuel && dpeVise && <> — DPE <DpeBadge letter={dpeActuel} /> <ArrowRight className="w-3 h-3 inline" /> <DpeBadge letter={dpeVise} /></>}
        </p>
      </div>

      {/* Recap travaux */}
      <div className="bg-gray-50 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Coût total des travaux TTC</span>
          <span className="text-lg font-bold text-gray-900">{eur(totalTravauxTTC)}</span>
        </div>
        <p className="text-xs text-gray-400">{travaux.length} poste(s) · {agenceNom && `Agence : ${agenceNom}`}</p>
      </div>

      {/* Comparative table - 4 columns */}
      <div className="grid grid-cols-4 gap-3">
        {CAT_CONFIG.map((cat) => {
          const data = synthese[cat.key]
          if (!data) return null
          return (
            <div key={cat.key} className={`rounded-2xl border ${cat.border} ${cat.bg} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${cat.badge}`} />
                <span className={`text-sm font-bold ${cat.text}`}>{cat.label}</span>
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{cat.sub}</p>

              <div className="space-y-2 mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CEE</span>
                  <span className="font-semibold text-gray-700">{eur(data.cee)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">MPR</span>
                  <span className="font-semibold text-gray-700">{eur(data.mpr)}</span>
                </div>
                <div className="h-px bg-gray-200 my-1" />
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Total aides</span>
                  <span className={`font-bold ${cat.text}`}>{eur(data.totalAides)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Couverture</span>
                  <span className="font-semibold text-gray-700">{data.tauxCouverture}%</span>
                </div>
              </div>

              <div className={`mt-3 pt-3 border-t ${cat.border}`}>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Reste à charge</p>
                <p className={`text-lg font-bold ${cat.text}`}>{eur(data.resteACharge)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">Poste</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">Coût TTC</th>
              <th className="text-right text-xs font-semibold text-blue-500 uppercase px-3 py-2.5">Bleu</th>
              <th className="text-right text-xs font-semibold text-amber-500 uppercase px-3 py-2.5">Jaune</th>
              <th className="text-right text-xs font-semibold text-purple-500 uppercase px-3 py-2.5">Violet</th>
              <th className="text-right text-xs font-semibold text-pink-500 uppercase px-3 py-2.5">Rose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {travaux.map((t, i) => {
              const total = t.prixTTC * (t.quantite || 1)
              return (
                <tr key={t.code} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{t.label}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{eur(total)}</td>
                  {CAT_CONFIG.map((cat) => {
                    const detail = synthese[cat.key]?.detail?.[i]
                    const aide = (detail?.cee || 0) + (detail?.mpr || 0)
                    return (
                      <td key={cat.key} className={`px-3 py-2.5 text-right font-medium ${cat.text}`}>
                        {aide > 0 ? eur(aide) : '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr className="bg-gray-50 font-bold">
              <td className="px-4 py-3 text-gray-900">Total</td>
              <td className="px-4 py-3 text-right text-gray-900">{eur(totalTravauxTTC)}</td>
              {CAT_CONFIG.map((cat) => (
                <td key={cat.key} className={`px-3 py-3 text-right ${cat.text}`}>
                  {eur(synthese[cat.key]?.totalAides)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
          placeholder="Notes internes sur cette estimation..."
        />
      </div>
    </div>
  )
}
