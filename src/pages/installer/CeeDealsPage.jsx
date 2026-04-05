import { useState, useRef } from 'react'
import { useCeeDeals } from '../../hooks/useCeeDeals'
import { CATALOG } from '../../lib/constants/catalog'
import {
  Handshake, Plus, Trash2, Star, StarOff, Edit3, Save, X, AlertCircle,
  Upload, Image, Building2, FileText, Percent, ChevronDown, ChevronUp, Search
} from 'lucide-react'

const ACTIVE_FICHES = CATALOG.flatMap((cat) =>
  cat.items.filter((i) => i.active && i.route && i.code.startsWith('BAR'))
)

const PRICE_PROFILES = [
  { key: 'tresModeste', label: 'Très modeste', color: 'border-blue-300', bg: 'bg-blue-50 text-blue-700' },
  { key: 'modeste', label: 'Modeste', color: 'border-yellow-300', bg: 'bg-yellow-50 text-yellow-700' },
  { key: 'classique', label: 'Classique', color: 'border-purple-300', bg: 'bg-purple-50 text-purple-700' },
  { key: 'aise', label: 'Aisé', color: 'border-pink-300', bg: 'bg-pink-50 text-pink-700' },
]

const EMPTY_DELEGATAIRE = {
  siren: '', raisonSociale: '', civilite: '', prenom: '', nom: '',
  adresse: '', ville: '', codePostal: '', email: '', telephone: '',
  siteWeb: '', isFavori: false, logo: null, tampon: null,
}

const EMPTY_DEAL = {
  obligeName: '',
  contractRef: '',
  validFrom: '',
  validTo: '',
  pricePerMWhc: { tresModeste: 12, modeste: 10, classique: 7, aise: 5 },
  delegataire: { ...EMPTY_DELEGATAIRE },
  useFicheOverrides: false,
  ficheOverrides: {},
  minCeePercent: 0,
}

export default function CeeDealsPage() {
  const { deals, addDeal, updateDeal, deleteDeal, setDefaultDeal } = useCeeDeals()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_DEAL })
  const [error, setError] = useState('')
  const [expandedSection, setExpandedSection] = useState('contrat')

  function handleOpen(deal = null) {
    if (deal) {
      setForm({
        ...EMPTY_DEAL,
        ...deal,
        delegataire: { ...EMPTY_DELEGATAIRE, ...(deal.delegataire || {}) },
        ficheOverrides: deal.ficheOverrides || {},
      })
      setEditingId(deal.id)
    } else {
      setForm({ ...EMPTY_DEAL, delegataire: { ...EMPTY_DELEGATAIRE } })
      setEditingId(null)
    }
    setShowForm(true)
    setError('')
    setExpandedSection('contrat')
  }

  function handleClose() {
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  function handleSave() {
    if (!form.obligeName.trim() && !form.delegataire?.raisonSociale?.trim()) {
      setError("Renseignez au moins l'obligé ou la raison sociale du délégataire")
      return
    }
    if (editingId) {
      updateDeal(editingId, form)
    } else {
      addDeal(form)
    }
    handleClose()
  }

  function handleDelete(id, name) {
    if (!confirm(`Supprimer le deal "${name}" ?`)) return
    deleteDeal(id)
  }

  function setPrice(profile, value) {
    setForm((prev) => ({
      ...prev,
      pricePerMWhc: { ...prev.pricePerMWhc, [profile]: Number(value) || 0 },
    }))
  }

  function setFichePrice(ficheCode, profile, value) {
    setForm((prev) => ({
      ...prev,
      ficheOverrides: {
        ...prev.ficheOverrides,
        [ficheCode]: {
          ...(prev.ficheOverrides[ficheCode] || prev.pricePerMWhc),
          [profile]: Number(value) || 0,
        },
      },
    }))
  }

  function setDeleg(field, value) {
    setForm((prev) => ({
      ...prev,
      delegataire: { ...prev.delegataire, [field]: value },
    }))
  }

  function toggleSection(name) {
    setExpandedSection(expandedSection === name ? null : name)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Handshake className="w-6 h-6 text-lime-600" />
            Deals CEE
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos contrats obligés/délégataires, valorisations et stratégie commerciale
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau deal
        </button>
      </div>

      {/* ─── FORMULAIRE ─── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {editingId ? 'Modifier le deal' : 'Nouveau deal CEE'}
            </h2>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ─ Section 1: Contrat ─ */}
          <SectionHeader
            icon={<FileText className="w-4 h-4" />}
            title="Informations contrat"
            expanded={expandedSection === 'contrat'}
            onToggle={() => toggleSection('contrat')}
          />
          {expandedSection === 'contrat' && (
            <div className="px-6 pb-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Obligé" value={form.obligeName} onChange={(v) => setForm({ ...form, obligeName: v })} placeholder="Ex: EDF" />
                <FormField label="Référence contrat" value={form.contractRef} onChange={(v) => setForm({ ...form, contractRef: v })} placeholder="C-2024-1234" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Début validité" value={form.validFrom} onChange={(v) => setForm({ ...form, validFrom: v })} type="date" />
                <FormField label="Fin validité" value={form.validTo} onChange={(v) => setForm({ ...form, validTo: v })} type="date" />
              </div>
            </div>
          )}

          {/* ─ Section 2: Délégataire ─ */}
          <SectionHeader
            icon={<Building2 className="w-4 h-4" />}
            title="Délégataire"
            expanded={expandedSection === 'delegataire'}
            onToggle={() => toggleSection('delegataire')}
          />
          {expandedSection === 'delegataire' && (
            <DelegataireSection deleg={form.delegataire} setDeleg={setDeleg} />
          )}

          {/* ─ Section 3: Valorisation CEE ─ */}
          <SectionHeader
            icon={<Handshake className="w-4 h-4" />}
            title="Valorisation & Ratios (€/MWh CUMAC)"
            expanded={expandedSection === 'valorisation'}
            onToggle={() => toggleSection('valorisation')}
          />
          {expandedSection === 'valorisation' && (
            <div className="px-6 pb-5 space-y-4">
              {/* Prix global */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Prix global par précarité</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRICE_PROFILES.map(({ key, label, color }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.pricePerMWhc[key] ?? ''}
                        onChange={(e) => setPrice(key, e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border-2 ${color} focus:ring-2 focus:ring-lime-200 outline-none text-sm font-semibold text-center`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggle par fiche */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.useFicheOverrides}
                    onChange={(e) => setForm({ ...form, useFicheOverrides: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-lime-300 rounded-full peer peer-checked:bg-lime-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm font-medium text-gray-700">Personnaliser par fiche</span>
              </div>

              {/* Tableau par fiche */}
              {form.useFicheOverrides && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-3 text-xs font-bold text-gray-500 uppercase">Fiche</th>
                        {PRICE_PROFILES.map(({ key, label }) => (
                          <th key={key} className="text-center py-2 px-2 text-xs font-bold text-gray-500 uppercase">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ACTIVE_FICHES.map((fiche) => (
                        <tr key={fiche.code} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 pr-3">
                            <span className="text-xs font-semibold text-gray-700">{fiche.code}</span>
                            <span className="text-xs text-gray-400 ml-1 hidden sm:inline">— {fiche.title}</span>
                          </td>
                          {PRICE_PROFILES.map(({ key, color }) => (
                            <td key={key} className="py-2 px-1">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={form.ficheOverrides[fiche.code]?.[key] ?? form.pricePerMWhc[key] ?? ''}
                                onChange={(e) => setFichePrice(fiche.code, key, e.target.value)}
                                className={`w-full px-2 py-1.5 rounded border ${color} text-center text-xs font-semibold focus:ring-2 focus:ring-lime-200 outline-none`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─ Section 4: Stratégie commerciale ─ */}
          <SectionHeader
            icon={<Percent className="w-4 h-4" />}
            title="Stratégie commerciale"
            expanded={expandedSection === 'strategie'}
            onToggle={() => toggleSection('strategie')}
          />
          {expandedSection === 'strategie' && (
            <div className="px-6 pb-5">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between items-center">
                <span>Minimum % CEE appliqué sur le devis</span>
                <span className="text-xl font-extrabold text-lime-600">{form.minCeePercent}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={form.minCeePercent}
                onChange={(e) => setForm({ ...form, minCeePercent: Number(e.target.value) })}
                className="w-full h-2 bg-lime-200 rounded-lg appearance-none cursor-pointer accent-lime-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0% (Pas de minimum)</span>
                <span>100% (Tout reversé au client)</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Les simulateurs ne pourront pas descendre en dessous de ce pourcentage.
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 bg-lime-600 hover:bg-lime-700 text-white text-sm font-semibold rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* ─── LISTE DES DEALS ─── */}
      {deals.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun deal CEE configuré</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajoutez vos contrats obligés/délégataires pour personnaliser vos simulations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const isExpired = deal.validTo && deal.validTo < new Date().toISOString().slice(0, 10)
            const delegName = deal.delegataire?.raisonSociale || deal.delegataireName || ''
            return (
              <div
                key={deal.id}
                className={`bg-white rounded-2xl border p-5 transition ${
                  deal.isDefault ? 'border-lime-300 ring-1 ring-lime-200' : 'border-gray-200'
                } ${isExpired ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Logo délégataire */}
                      {deal.delegataire?.logo && (
                        <img src={deal.delegataire.logo} alt="" className="h-8 w-auto rounded" />
                      )}
                      <span className="font-bold text-gray-800">
                        {deal.obligeName || 'Sans obligé'}
                      </span>
                      {delegName && (
                        <>
                          <span className="text-gray-400">via</span>
                          <span className="font-semibold text-gray-700">{delegName}</span>
                        </>
                      )}
                      {deal.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-100 text-lime-700 font-bold uppercase">
                          Par défaut
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold uppercase">
                          Expiré
                        </span>
                      )}
                    </div>
                    {deal.contractRef && (
                      <p className="text-xs text-gray-400 mt-0.5">Réf: {deal.contractRef}</p>
                    )}
                    {(deal.validFrom || deal.validTo) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {deal.validFrom && `Du ${new Date(deal.validFrom).toLocaleDateString('fr-FR')}`}
                        {deal.validTo && ` au ${new Date(deal.validTo).toLocaleDateString('fr-FR')}`}
                      </p>
                    )}

                    {/* Prix + min% */}
                    <div className="flex gap-3 mt-3 flex-wrap items-center">
                      {PRICE_PROFILES.map(({ key, label, bg }) => (
                        <div key={key} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${bg}`}>
                          {label}: {deal.pricePerMWhc?.[key] ?? '—'} €
                        </div>
                      ))}
                      {(deal.minCeePercent || 0) > 0 && (
                        <div className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-lime-50 text-lime-700">
                          Min: {deal.minCeePercent}%
                        </div>
                      )}
                      {deal.useFicheOverrides && Object.keys(deal.ficheOverrides || {}).length > 0 && (
                        <div className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                          {Object.keys(deal.ficheOverrides).length} fiches personnalisées
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!deal.isDefault && (
                      <button
                        onClick={() => setDefaultDeal(deal.id)}
                        className="p-2 rounded-lg hover:bg-lime-50 transition"
                        title="Définir par défaut"
                      >
                        <StarOff className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    {deal.isDefault && (
                      <span className="p-2">
                        <Star className="w-4 h-4 text-lime-500 fill-lime-500" />
                      </span>
                    )}
                    <button
                      onClick={() => handleOpen(deal)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id, deal.obligeName || delegName)}
                      className="p-2 rounded-lg hover:bg-red-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Sub-components ─── */

function SectionHeader({ icon, title, expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-3 border-t border-gray-100 hover:bg-gray-50 transition"
    >
      <span className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
        {icon} {title}
      </span>
      {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
      />
    </div>
  )
}

function DelegataireSection({ deleg, setDeleg }) {
  const logoRef = useRef(null)
  const tamponRef = useRef(null)

  function handleImageUpload(field, e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 200 * 1024) {
      alert('Image trop volumineuse (max 200 Ko)')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setDeleg(field, ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="px-6 pb-5 space-y-4">
      {/* SIREN + Raison sociale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">SIREN</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={deleg.siren || ''}
              onChange={(e) => setDeleg('siren', e.target.value)}
              placeholder="315871640"
              maxLength={9}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
            />
            <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition" title="Rechercher">
              <Search className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <FormField label="Raison sociale" value={deleg.raisonSociale} onChange={(v) => setDeleg('raisonSociale', v)} placeholder="IDEX ENERGIES" />
      </div>

      {/* Civilité + Favori */}
      <div className="flex items-center gap-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Civilité</label>
          <div className="flex gap-3">
            {['Mme', 'M'].map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="delegCivilite"
                  checked={deleg.civilite === c}
                  onChange={() => setDeleg('civilite', c)}
                  className="accent-lime-600"
                />
                {c === 'M' ? 'Monsieur' : 'Madame'}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
          <input
            type="checkbox"
            checked={deleg.isFavori}
            onChange={(e) => setDeleg('isFavori', e.target.checked)}
            className="accent-lime-600 w-4 h-4"
          />
          <span className="font-medium text-gray-700">Délégataire favori ?</span>
        </label>
      </div>

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Prénom" value={deleg.prenom} onChange={(v) => setDeleg('prenom', v)} placeholder="Florian" />
        <FormField label="Nom" value={deleg.nom} onChange={(v) => setDeleg('nom', v)} placeholder="Dulong" />
      </div>

      {/* Adresse */}
      <FormField label="Adresse postale" value={deleg.adresse} onChange={(v) => setDeleg('adresse', v)} placeholder="72 Avenue Jean Baptiste Clément" />

      {/* Ville + CP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Ville" value={deleg.ville} onChange={(v) => setDeleg('ville', v)} placeholder="Boulogne-Billancourt" />
        <FormField label="Code postal" value={deleg.codePostal} onChange={(v) => setDeleg('codePostal', v)} placeholder="92100" />
      </div>

      {/* Email + Tel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Email" value={deleg.email} onChange={(v) => setDeleg('email', v)} type="email" placeholder="contact@exemple.fr" />
        <FormField label="Téléphone" value={deleg.telephone} onChange={(v) => setDeleg('telephone', v)} type="tel" placeholder="07.89.23.02.20" />
      </div>

      {/* Site web */}
      <FormField label="Site" value={deleg.siteWeb} onChange={(v) => setDeleg('siteWeb', v)} placeholder="www.exemple.fr" />

      {/* Logo + Tampon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Logo</label>
          <div className="flex items-center gap-3">
            {deleg.logo ? (
              <img src={deleg.logo} alt="Logo" className="h-12 w-auto rounded border border-gray-200 bg-white p-1" />
            ) : (
              <div className="h-12 w-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                150×60
              </div>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('logo', e)} />
            <button
              onClick={() => logoRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-600 transition"
            >
              <Upload className="w-3 h-3" /> Choisir
            </button>
            {deleg.logo && (
              <button onClick={() => setDeleg('logo', null)} className="text-xs text-red-500 hover:underline">Supprimer</button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tampon avec signature</label>
          <div className="flex items-center gap-3">
            {deleg.tampon ? (
              <img src={deleg.tampon} alt="Tampon" className="h-12 w-auto rounded border border-gray-200 bg-white p-1" />
            ) : (
              <div className="h-12 w-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                Aucun
              </div>
            )}
            <input ref={tamponRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('tampon', e)} />
            <button
              onClick={() => tamponRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-600 transition"
            >
              <Upload className="w-3 h-3" /> Choisir
            </button>
            {deleg.tampon && (
              <button onClick={() => setDeleg('tampon', null)} className="text-xs text-red-500 hover:underline">Supprimer</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
