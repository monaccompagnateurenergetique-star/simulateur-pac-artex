import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Building2, ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useAgencies } from '../../hooks/useAgencies'

export default function AgencyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { agencies, addAgency, updateAgency } = useAgencies()
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '',
    contact: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEdit) {
      const agency = agencies.find((a) => a.id === id)
      if (agency) {
        setForm({
          name: agency.name || '',
          contact: agency.contact || '',
          address: agency.address || '',
          postalCode: agency.postalCode || '',
          city: agency.city || '',
          phone: agency.phone || '',
          email: agency.email || '',
        })
      }
    }
  }, [isEdit, id, agencies])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await updateAgency(id, form)
        navigate(`/admin/agences/${id}`)
      } else {
        const newId = await addAgency(form)
        navigate(`/admin/agences/${newId}`)
      }
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Nom de l\'agence *', placeholder: 'Agence Century 21 Metz', colSpan: 2 },
    { key: 'contact', label: 'Nom du contact', placeholder: 'Jean Dupont' },
    { key: 'phone', label: 'Téléphone', placeholder: '06 12 34 56 78' },
    { key: 'email', label: 'Email', placeholder: 'contact@agence.fr', type: 'email' },
    { key: 'address', label: 'Adresse', placeholder: '12 rue de la Paix' },
    { key: 'postalCode', label: 'Code postal', placeholder: '57000', maxLength: 5 },
    { key: 'city', label: 'Ville', placeholder: 'Metz' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to={isEdit ? `/admin/agences/${id}` : '/admin/agences'}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Modifier l\'agence' : 'Nouvelle agence'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.colSpan === 2 ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                maxLength={f.maxLength}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-medium transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Enregistrer' : 'Créer l\'agence'}
          </button>
        </div>
      </form>
    </div>
  )
}
