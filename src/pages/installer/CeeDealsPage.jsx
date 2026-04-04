import { useState } from 'react'
import { useCeeDeals } from '../../hooks/useCeeDeals'
import {
  Handshake, Plus, Trash2, Star, StarOff, Edit3, Save, X, AlertCircle
} from 'lucide-react'

const EMPTY_DEAL = {
  obligeName: '',
  delegataireName: '',
  contractRef: '',
  validFrom: '',
  validTo: '',
  pricePerMWhc: { tresModeste: 12, modeste: 10, classique: 7, aise: 5 },
}

export default function CeeDealsPage() {
  const { deals, addDeal, updateDeal, deleteDeal, setDefaultDeal } = useCeeDeals()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_DEAL })
  const [error, setError] = useState('')

  function handleOpen(deal = null) {
    if (deal) {
      setForm({ ...deal })
      setEditingId(deal.id)
    } else {
      setForm({ ...EMPTY_DEAL })
      setEditingId(null)
    }
    setShowForm(true)
    setError('')
  }

  function handleClose() {
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  function handleSave() {
    if (!form.obligeName.trim() && !form.delegataireName.trim()) {
      setError("Renseignez au moins l'obligé ou le délégataire")
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Handshake className="w-6 h-6 text-lime-600" />
            Deals CEE
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos contrats obligés/délégataires et les prix par précarité
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

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 animate-fade-in">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            {editingId ? 'Modifier le deal' : 'Nouveau deal CEE'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Obligé</label>
              <input
                type="text"
                value={form.obligeName}
                onChange={(e) => setForm({ ...form, obligeName: e.target.value })}
                placeholder="Ex: EDF"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Délégataire</label>
              <input
                type="text"
                value={form.delegataireName}
                onChange={(e) => setForm({ ...form, delegataireName: e.target.value })}
                placeholder="Ex: EFFY"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Référence contrat</label>
              <input
                type="text"
                value={form.contractRef}
                onChange={(e) => setForm({ ...form, contractRef: e.target.value })}
                placeholder="C-2024-1234"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Début validité</label>
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fin validité</label>
                <input
                  type="date"
                  value={form.validTo}
                  onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Prix par precarite */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Prix par MWhc cumac (€)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'tresModeste', label: 'Très modeste', color: 'border-blue-300' },
                { key: 'modeste', label: 'Modeste', color: 'border-yellow-300' },
                { key: 'classique', label: 'Classique', color: 'border-purple-300' },
                { key: 'aise', label: 'Aisé', color: 'border-pink-300' },
              ].map(({ key, label, color }) => (
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

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white text-sm font-semibold rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des deals */}
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
                      <span className="font-bold text-gray-800">
                        {deal.obligeName || 'Sans obligé'}
                      </span>
                      {deal.delegataireName && (
                        <>
                          <span className="text-gray-400">via</span>
                          <span className="font-semibold text-gray-700">{deal.delegataireName}</span>
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

                    {/* Prix */}
                    <div className="flex gap-3 mt-3 flex-wrap">
                      {[
                        { key: 'tresModeste', label: 'T.Modeste', color: 'bg-blue-50 text-blue-700' },
                        { key: 'modeste', label: 'Modeste', color: 'bg-yellow-50 text-yellow-700' },
                        { key: 'classique', label: 'Classique', color: 'bg-purple-50 text-purple-700' },
                        { key: 'aise', label: 'Aisé', color: 'bg-pink-50 text-pink-700' },
                      ].map(({ key, label, color }) => (
                        <div key={key} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${color}`}>
                          {label}: {deal.pricePerMWhc?.[key] ?? '—'} €/MWhc
                        </div>
                      ))}
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
                      onClick={() => handleDelete(deal.id, deal.obligeName || deal.delegataireName)}
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
