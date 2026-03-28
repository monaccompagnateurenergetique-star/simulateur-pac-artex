import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { UserPlus, Save, ArrowLeft, MapPin, Check } from 'lucide-react'
import InputField from '../components/ui/InputField'
import SelectField from '../components/ui/SelectField'
import { useClients } from '../hooks/useClients'
import { getRevenueCategory } from '../lib/revenueCategory'
import { getLocationInfo } from '../utils/postalCode'

const TYPE_LOGEMENT = [
  { value: 'maison', label: 'Maison individuelle' },
  { value: 'appartement', label: 'Appartement' },
]

export default function ClientFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { clients, addClient, updateClient } = useClients()
  const isEdit = id && id !== 'nouveau'
  const existing = isEdit ? clients.find((c) => c.id === id) : null

  const [form, setForm] = useState(() => {
    // Pre-fill from URL params (e.g. from DPE prospection)
    const fromUrl = {
      address: searchParams.get('address') || '',
      postalCode: searchParams.get('postalCode') || '',
      city: searchParams.get('city') || '',
    }
    return {
      lastName: '',
      firstName: '',
      phone: '',
      email: '',
      address: fromUrl.address,
      city: fromUrl.city,
      postalCode: fromUrl.postalCode,
      personnes: 1,
      rfr: '',
      typeLogement: 'maison',
      surface: '',
    }
  })

  useEffect(() => {
    if (existing) {
      setForm((prev) => ({
        ...prev,
        lastName: existing.lastName || '',
        firstName: existing.firstName || '',
        phone: existing.phone || '',
        email: existing.email || '',
        address: existing.address || '',
        city: existing.city || '',
        postalCode: existing.postalCode || '',
        personnes: existing.personnes || 1,
        rfr: existing.rfr || '',
        typeLogement: existing.typeLogement || 'maison',
        surface: existing.surface || '',
      }))
    }
  }, [existing])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Auto-detect location from postal code
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

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      ...form,
      rfr: form.rfr ? Number(form.rfr) : null,
      personnes: Number(form.personnes),
      surface: form.surface ? Number(form.surface) : null,
      // Auto-detected from postal code
      region: locationInfo?.region || null,
      departement: locationInfo?.departement || null,
      zoneClimatique: locationInfo?.zoneClimatique || null,
      zone: locationInfo?.zoneSimplifiee || null,
      isIDF: locationInfo?.isIDF || false,
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
                maxLength={5}
              />
              <InputField
                label="Ville"
                id="city"
                value={form.city}
                onChange={(v) => set('city', v)}
                placeholder="Grenoble"
              />
            </div>

            {/* Auto-detected info from postal code */}
            {locationInfo && (
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                  <MapPin className="w-3 h-3" />
                  {locationInfo.region}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Zone {locationInfo.zoneClimatique}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Dept. {locationInfo.departement}
                </span>
                {locationInfo.isIDF && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    <Check className="w-3 h-3" />
                    Île-de-France
                  </span>
                )}
              </div>
            )}
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

            {/* Catégorie auto-calculée */}
            {revenueInfo && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${CATEGORY_COLORS[revenueInfo.category]}`}>
                <div className="text-3xl font-black">{revenueInfo.category}</div>
                <div>
                  <p className="font-bold text-sm">Profil {revenueInfo.category} — {revenueInfo.label}</p>
                  <p className="text-xs opacity-75">
                    Calculé automatiquement selon les plafonds {locationInfo?.isIDF ? 'IDF' : 'hors IDF'} 2026
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
            <InputField
              label="Surface habitable"
              id="surface"
              type="number"
              value={form.surface}
              onChange={(v) => set('surface', v)}
              suffix="m²"
              placeholder="100"
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
