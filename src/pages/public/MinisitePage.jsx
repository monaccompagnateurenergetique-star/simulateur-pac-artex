import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMinisite } from '../../hooks/useMinisite'
import { usePublicLeads } from '../../hooks/usePublicLeads'
import {
  Building2, Phone, Mail, MapPin, Send, CheckCircle, AlertCircle, Zap
} from 'lucide-react'

export default function MinisitePage() {
  const { slug } = useParams()
  const { orgData, minisiteConfig, orgId, loading, error } = useMinisite(slug)
  const { submitLead } = usePublicLeads()

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', postalCode: '', city: '', message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.email.trim()) {
      setFormError('Le prénom et l\'email sont obligatoires')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      await submitLead({ ...form, orgId, slug, source: 'minisite' })
      setSubmitted(true)
    } catch (err) {
      setFormError('Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-lime-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !orgData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">{error || 'Page introuvable'}</h2>
        <p className="text-gray-500 mt-2 text-sm">Vérifiez le lien ou contactez l'installateur.</p>
      </div>
    )
  }

  const config = minisiteConfig || {}
  const primaryColor = config.primaryColor || 'lime'
  const companyName = orgData.name || 'Installateur'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-lime-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            {orgData.logo ? (
              <img src={orgData.logo} alt={companyName} className="w-14 h-14 rounded-xl object-cover bg-white/20" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{companyName}</h1>
              {orgData.slug && (
                <p className="text-lime-200 text-sm">Spécialiste en rénovation énergétique</p>
              )}
            </div>
          </div>

          <p className="text-lime-100 text-sm sm:text-base max-w-2xl">
            {config.heroText || 'Bénéficiez des aides CEE et MaPrimeRénov\' pour vos travaux de rénovation énergétique. Demandez votre estimation gratuite.'}
          </p>

          {/* Coordonnees */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-lime-100">
            {orgData.phone && (
              <a href={`tel:${orgData.phone}`} className="flex items-center gap-1.5 hover:text-white transition">
                <Phone className="w-4 h-4" /> {orgData.phone}
              </a>
            )}
            {orgData.email && (
              <a href={`mailto:${orgData.email}`} className="flex items-center gap-1.5 hover:text-white transition">
                <Mail className="w-4 h-4" /> {orgData.email}
              </a>
            )}
            {(orgData.city || orgData.address) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {[orgData.address, orgData.postalCode, orgData.city].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Avantages */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-lime-500" />
              Pourquoi nous choisir ?
            </h2>
            <div className="space-y-3">
              {(config.advantages || [
                'Estimation gratuite et sans engagement',
                'Accompagnement complet dans vos démarches CEE',
                'Artisan RGE certifié',
                'Prise en charge des dossiers MaPrimeRénov\'',
              ]).map((adv, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4.5 h-4.5 text-lime-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">{adv}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire de contact */}
          <div>
            {submitted ? (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8 text-center animate-fade-in">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-emerald-700">Demande envoyée !</h3>
                <p className="text-sm text-emerald-600 mt-2">
                  {companyName} vous recontactera dans les plus brefs délais.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Demander une estimation gratuite</h2>

                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom *</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Nom</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Ville</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">CP</label>
                      <input
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Votre projet</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Décrivez brièvement votre projet de rénovation..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-lime-600 hover:bg-lime-700 disabled:bg-lime-400 text-white font-semibold rounded-xl transition"
                >
                  {submitting ? (
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer ma demande
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-400 mt-3 text-center">
                  En soumettant ce formulaire, vous acceptez d'être contacté par {companyName}.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer minisite */}
      <div className="bg-gray-100 border-t border-gray-200 py-6 text-center">
        <p className="text-xs text-gray-400">
          Propulsé par <span className="font-semibold text-gray-500">Artex360</span>
        </p>
      </div>
    </div>
  )
}
