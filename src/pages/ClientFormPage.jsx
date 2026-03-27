import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserPlus, Save, ArrowLeft } from 'lucide-react'
import InputField from '../components/ui/InputField'
import SelectField from '../components/ui/SelectField'
import { useClients } from '../hooks/useClients'
import { getRevenueCategory } from '../lib/revenueCategory'

const ZONE_OPTIONS = [
  { value: 'H1', label: 'H1 — Nord / Est / Montagne' },
  { value: 'H2', label: 'H2 — Ouest / Sud-Ouest' },
  { value: 'H3', label: 'H3 — Méditerranée' },
]

const TYPE_LOGEMENT = [
  { value: 'maison', label: 'Maison individuelle' },
  { value: 'appartement', label: 'Appartement' },
]

export default function ClientFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clients, addClient, updateClient } = useClients()
  const isEdit = id && id !== 'nouveau'
  const existing = isEdit ? clients.find((c) => c.id === id) : null

  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    personnes: 1,
    rfr: '',
    isIDF: false,
    typeLogement: 'maison',
    surface: '',
    anneeConstruction: '',
    zone: 'H1',
  })

  useEffect(() => {
    if (existing) {
      setForm((prev) => ({ ...prev, ...existing }))
    }
  }, [existing])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const revenueInfo = useMemo(() => {
    if (!form.rfr || !form.personnes) return null
    return getRevenueCategory(Number(form.rfr), Number(form.personnes), form.isIDF)
  }, [form.rfr, form.personnes, form.isIDF])

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      ...form,
      rfr: form.rfr ? Number(form.rfr) : null,
      personnes: Number(form.personnes),
      surface: form.surface ? Number(form.surface) : null,
      anneeConstruction: form.anneeConstruction ? Number(form.anneeConstruction) : null,
      category: revenueInfo?.category || null,
      categoryLabel: revenueInfo?.label || null,
    }

    if (isEdit) {
      updateClient(id, data)
      navigate(`/clients/${id}`)
    } else {
      const client = addClient(data)
      navigate(`/clients/${client.id}`)
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
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-8">
        <UserPlus className="w-6 h-6 text-indigo-600" />
        {isEdit ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identité */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Identité</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nom"
              id="lastName"
              value={form.lastName}
              onChange={(v) => set('lastName', v)}
              placeholder="Dupont"
            />
            <InputField
              label="Prénom"
              id="firstName"
              value={form.firstName}
              onChange={(v) => set('firstName', v)}
              placeholder="Jean"
            />
            <InputField
              label="Téléphone"
              id="phone"
              value={form.phone}
              onChange={(v) => set('phone', v)}
              placeholder="06 12 34 56 78"
            />
            <InputField
              label="Email"
              id="email"
              value={form.email}
              onChange={(v) => set('email', v)}
              placeholder="jean.dupont@email.fr"
            />
          </div>
        </fieldset>

        {/* Adresse des travaux */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Adresse des travaux</legend>
          <div className="space-y-4">
            <InputField
              label="Adresse"
              id="address"
              value={form.address}
              onChange={(v) => set('address', v)}
              placeholder="123 rue des Travaux"
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Code postal"
                id="postalCode"
                value={form.postalCode}
                onChange={(v) => set('postalCode', v)}
                placeholder="38000"
              />
              <InputField
                label="Ville"
                id="city"
                value={form.city}
                onChange={(v) => set('city', v)}
                placeholder="Grenoble"
              />
            </div>
          </div>
        </fieldset>

        {/* Revenus */}
        <fieldset>
          <legend className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Situation fiscale</legend>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Nombre de personnes au foyer"
                id="personnes"
                type="number"
                value={form.personnes}
                onChange={(v) => set('personnes', v)}
                min={1}
                max={20}
              />
              <InputField
                label="Revenu fiscal de référence (RFR)"
                id="rfr"
                type="number"
                value={form.rfr}
                onChange={(v) => set('rfr', v)}
                suffix="€"
                placeholder="25000"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Région :</label>
              <button
                type="button"
                onClick={() => set('isIDF', false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  !form.isIDF ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Hors Île-de-France
              </button>
              <button
                type="button"
                onClick={() => set('isIDF', true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  form.isIDF ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Île-de-France
              </button>
            </div>

            {/* Catégorie auto-calculée */}
            {revenueInfo && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${CATEGORY_COLORS[revenueInfo.category]}`}>
                <div className="text-3xl font-black">{revenueInfo.category}</div>
                <div>
                  <p className="font-bold text-sm">Profil {revenueInfo.category} — {revenueInfo.label}</p>
                  <p className="text-xs opacity-75">
                    Calculé automatiquement selon les plafonds {form.isIDF ? 'IDF' : 'hors IDF'} 2026
                    pour {form.personnes} personne{form.personnes > 1 ? 's' : ''}
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
            <SelectField
              label="Type de logement"
              id="typeLogement"
              value={form.typeLogement}
              onChange={(v) => set('typeLogement', v)}
              options={TYPE_LOGEMENT}
            />
            <SelectField
              label="Zone climatique"
              id="zone"
              value={form.zone}
              onChange={(v) => set('zone', v)}
              options={ZONE_OPTIONS}
            />
            <InputField
              label="Surface habitable"
              id="surface"
              type="number"
              value={form.surface}
              onChange={(v) => set('surface', v)}
              suffix="m²"
              placeholder="100"
            />
            <InputField
              label="Année de construction"
              id="anneeConstruction"
              type="number"
              value={form.anneeConstruction}
              onChange={(v) => set('anneeConstruction', v)}
              placeholder="1985"
            />
          </div>
        </fieldset>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!form.lastName || !form.firstName}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isEdit ? 'Enregistrer' : 'Créer le bénéficiaire'}
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
