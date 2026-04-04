import { useState } from 'react'
import { usePublicLeads } from '../../hooks/usePublicLeads'
import {
  Zap, Home, Euro, Send, CheckCircle, AlertCircle,
  Flame, Wind, Sun, Droplets
} from 'lucide-react'

const TRAVAUX_OPTIONS = [
  { id: 'isolation_combles', label: 'Isolation des combles', icon: Home },
  { id: 'isolation_murs', label: 'Isolation des murs', icon: Home },
  { id: 'pompe_chaleur', label: 'Pompe à chaleur', icon: Wind },
  { id: 'chaudiere', label: 'Chaudière performante', icon: Flame },
  { id: 'chauffe_eau_thermo', label: 'Chauffe-eau thermodynamique', icon: Droplets },
  { id: 'panneaux_solaires', label: 'Panneaux solaires', icon: Sun },
  { id: 'fenêtres', label: 'Fenêtres / menuiseries', icon: Home },
  { id: 'ventilation', label: 'VMC double flux', icon: Wind },
]

export default function PublicSimulatorPage() {
  const { submitLead } = usePublicLeads()
  const [step, setStep] = useState(1)
  const [selectedTravaux, setSelectedTravaux] = useState([])
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', postalCode: '', city: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function toggleTravaux(id) {
    setSelectedTravaux((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.email.trim()) {
      setError('Le prénom et l\'email sont obligatoires')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const travauxLabels = selectedTravaux.map((id) =>
        TRAVAUX_OPTIONS.find((t) => t.id === id)?.label || id
      ).join(', ')

      await submitLead({
        ...form,
        message: `Travaux souhaités : ${travauxLabels}`,
        source: 'simulateur_public',
      })
      setSubmitted(true)
    } catch (err) {
      setError('Erreur lors de l\'envoi')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Merci !</h2>
        <p className="text-gray-500 mt-2">
          Votre demande a été enregistrée. Un professionnel vous contactera rapidement pour une estimation personnalisée.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 text-lime-700 text-sm font-semibold rounded-full mb-4">
          <Zap className="w-4 h-4" />
          Estimation gratuite
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Estimez vos aides à la rénovation
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          CEE, MaPrimeRénov', Éco-PTZ... découvrez les aides disponibles pour votre projet.
        </p>
      </div>

      {/* Progression */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full transition ${step >= s ? 'bg-lime-500' : 'bg-gray-200'}`} />
            <p className={`text-[10px] mt-1 font-semibold ${step >= s ? 'text-lime-600' : 'text-gray-400'}`}>
              {s === 1 ? 'Vos travaux' : 'Vos coordonnées'}
            </p>
          </div>
        ))}
      </div>

      {/* Step 1: Choix des travaux */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Quels travaux souhaitez-vous réaliser ?
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {TRAVAUX_OPTIONS.map(({ id, label, icon: Icon }) => {
              const selected = selectedTravaux.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => toggleTravaux(id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition ${
                    selected
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${selected ? 'text-lime-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${selected ? 'text-lime-700' : 'text-gray-700'}`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={selectedTravaux.length === 0}
            className="w-full py-3 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition"
          >
            Continuer
          </button>
        </div>
      )}

      {/* Step 2: Coordonnees */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Vos coordonnées
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ville</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CP</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-lime-600 hover:bg-lime-700 disabled:bg-lime-400 text-white font-semibold rounded-xl transition"
            >
              {submitting ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Recevoir mon estimation
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-gray-400 mt-4 text-center">
            Estimation à titre indicatif. Un professionnel vous contactera pour affiner votre projet.
          </p>
        </form>
      )}
    </div>
  )
}
