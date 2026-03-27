import { useRef } from 'react'
import { Settings, Building2, Euro, Upload, RotateCcw, Save, Check } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import InputField from '../components/ui/InputField'

export default function SettingsPage() {
  const { settings, updateCompany, updateCeePrice, resetSettings } = useSettings()
  const fileInputRef = useRef(null)
  const { company, ceePrices } = settings

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) {
      alert('Le logo ne doit pas dépasser 500 Ko.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => updateCompany('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    updateCompany('logo', '')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramétrage</h1>
          <p className="text-sm text-gray-500">Configurez vos informations société et vos tarifs CEE</p>
        </div>
      </div>

      {/* ─── SOCIÉTÉ ─── */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Informations Société
          </h2>
          <p className="text-xs text-gray-500 mt-1">Ces informations apparaîtront sur les PDF de simulation</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo de l'entreprise</label>
            <div className="flex items-center gap-4">
              {company.logo ? (
                <div className="relative group">
                  <img
                    src={company.logo}
                    alt="Logo société"
                    className="h-16 w-auto object-contain rounded-lg border border-gray-200 bg-white p-2"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                  Aucun logo
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                {company.logo ? 'Changer' : 'Importer'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Nom */}
          <InputField
            label="Nom de l'entreprise"
            id="companyName"
            value={company.name}
            onChange={(v) => updateCompany('name', v)}
            placeholder="Ex : Artex360 SAS"
          />

          {/* Adresse */}
          <InputField
            label="Adresse"
            id="companyAddress"
            value={company.address}
            onChange={(v) => updateCompany('address', v)}
            placeholder="Ex : 12 rue de la Rénovation"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Code postal"
              id="companyPostalCode"
              value={company.postalCode}
              onChange={(v) => updateCompany('postalCode', v)}
              placeholder="Ex : 75001"
            />
            <InputField
              label="Ville"
              id="companyCity"
              value={company.city}
              onChange={(v) => updateCompany('city', v)}
              placeholder="Ex : Paris"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Téléphone"
              id="companyPhone"
              value={company.phone}
              onChange={(v) => updateCompany('phone', v)}
              placeholder="Ex : 01 23 45 67 89"
            />
            <InputField
              label="Email"
              id="companyEmail"
              value={company.email}
              onChange={(v) => updateCompany('email', v)}
              placeholder="Ex : contact@artex360.fr"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="N° SIRET"
              id="companySiret"
              value={company.siret}
              onChange={(v) => updateCompany('siret', v)}
              placeholder="Ex : 123 456 789 00012"
            />
            <InputField
              label="N° RGE"
              id="companyRge"
              value={company.rge}
              onChange={(v) => updateCompany('rge', v)}
              placeholder="Ex : E-12345"
            />
          </div>
        </div>
      </section>

      {/* ─── PRIX CEE ─── */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Euro className="w-5 h-5 text-green-600" />
            Prix CEE par profil de revenus
          </h2>
          <p className="text-xs text-gray-500 mt-1">Ces tarifs seront pré-remplis dans tous les simulateurs</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="font-bold text-blue-800 text-sm">Très modeste (Bleu)</span>
              </div>
              <InputField
                label="Prix CEE"
                id="priceTresModeste"
                type="number"
                value={ceePrices.tresModeste}
                onChange={(v) => updateCeePrice('tresModeste', v)}
                suffix="€/MWhc"
                step={0.5}
                min={0}
              />
            </div>

            <div className="p-4 rounded-xl border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="font-bold text-yellow-800 text-sm">Modeste (Jaune)</span>
              </div>
              <InputField
                label="Prix CEE"
                id="priceModeste"
                type="number"
                value={ceePrices.modeste}
                onChange={(v) => updateCeePrice('modeste', v)}
                suffix="€/MWhc"
                step={0.5}
                min={0}
              />
            </div>

            <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <span className="font-bold text-purple-800 text-sm">Classique (Violet)</span>
              </div>
              <InputField
                label="Prix CEE"
                id="priceClassique"
                type="number"
                value={ceePrices.classique}
                onChange={(v) => updateCeePrice('classique', v)}
                suffix="€/MWhc"
                step={0.5}
                min={0}
              />
            </div>

            <div className="p-4 rounded-xl border-2 border-pink-200 bg-pink-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-pink-500" />
                <span className="font-bold text-pink-800 text-sm">Aisé (Rose)</span>
              </div>
              <InputField
                label="Prix CEE"
                id="priceAise"
                type="number"
                value={ceePrices.aise}
                onChange={(v) => updateCeePrice('aise', v)}
                suffix="€/MWhc"
                step={0.5}
                min={0}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── ACTIONS ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={resetSettings}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>

        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          <span>Sauvegarde automatique</span>
        </div>
      </div>
    </div>
  )
}
