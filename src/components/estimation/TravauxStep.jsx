import { useState } from 'react'
import { Hammer, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { PRIX_VENTE_DEFAUT, CATEGORIES_LABELS, calculerTTC } from '../../lib/constants/prixVente'
import { BAR_TH_171 } from '../../lib/constants/barTh171'

export default function TravauxStep({ data, onChange }) {
  const [mode, setMode] = useState(data.workMode || 'rapide')
  const type = data.typeLogement === 'Appartement' ? 'appartement' : 'maison'
  const prixDefaut = PRIX_VENTE_DEFAUT[type] || {}

  function handleModeChange(newMode) {
    setMode(newMode)
    onChange({ workMode: newMode })
  }

  // --- Mode Rapide ---
  function handleRapideChange(field, value) {
    onChange({ [field]: Number(value) || 0 })
  }

  // --- Mode Détaillé ---
  function addTravail(key) {
    const def = prixDefaut[key]
    if (!def) return
    const current = data.travaux || []
    const exists = current.some((t) => t.key === key)
    if (exists) return
    onChange({
      travaux: [...current, { key, label: def.label, prixHT: def.prixHT, tva: def.tva, categorie: def.categorie }],
    })
  }

  function removeTravail(key) {
    onChange({ travaux: (data.travaux || []).filter((t) => t.key !== key) })
  }

  function updateTravailPrix(key, prixHT) {
    onChange({
      travaux: (data.travaux || []).map((t) =>
        t.key === key ? { ...t, prixHT: Number(prixHT) || 0 } : t
      ),
    })
  }

  const travaux = data.travaux || []
  const totalHT = travaux.reduce((s, t) => s + (t.prixHT || 0), 0)
  const totalTTC = travaux.reduce((s, t) => s + calculerTTC(t.prixHT || 0, t.tva || 5.5), 0)

  // Grouper par catégorie
  const categories = {}
  for (const [key, val] of Object.entries(prixDefaut)) {
    const cat = val.categorie || 'autre'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push({ key, ...val })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Hammer className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Postes de travaux</h3>
            <p className="text-sm text-gray-400">Définissez les travaux et le budget</p>
          </div>
        </div>
        <button
          onClick={() => handleModeChange(mode === 'rapide' ? 'detaille' : 'rapide')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-all"
        >
          {mode === 'rapide' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4 text-amber-400" />}
          {mode === 'rapide' ? 'Mode rapide' : 'Mode détaillé'}
        </button>
      </div>

      {mode === 'rapide' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Coût total HT (€)</label>
              <input
                type="number"
                value={data.projectCostHT || ''}
                onChange={(e) => handleRapideChange('projectCostHT', e.target.value)}
                placeholder="30000"
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Coût total TTC (€)</label>
              <input
                type="number"
                value={data.projectCostTTC || ''}
                onChange={(e) => handleRapideChange('projectCostTTC', e.target.value)}
                placeholder="31650"
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sélection des postes */}
          {Object.entries(categories).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {CATEGORIES_LABELS[cat] || cat}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const selected = travaux.some((t) => t.key === item.key)
                  return (
                    <button
                      key={item.key}
                      onClick={() => selected ? removeTravail(item.key) : addTravail(item.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-gray-700 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}{item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Tableau des travaux sélectionnés */}
          {travaux.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
                    <th className="text-left py-2 px-3">Poste</th>
                    <th className="text-right py-2 px-3">Prix HT</th>
                    <th className="text-right py-2 px-3">TVA</th>
                    <th className="text-right py-2 px-3">Prix TTC</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {travaux.map((t) => (
                    <tr key={t.key} className="border-b border-gray-800">
                      <td className="py-2.5 px-3 text-white">{t.label}</td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          value={t.prixHT}
                          onChange={(e) => updateTravailPrix(t.key, e.target.value)}
                          className="w-24 text-right px-2 py-1 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{t.tva}%</td>
                      <td className="py-2.5 px-3 text-right text-white font-medium">
                        {calculerTTC(t.prixHT, t.tva).toLocaleString('fr-FR')} €
                      </td>
                      <td className="py-2.5 px-1">
                        <button onClick={() => removeTravail(t.key)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-600">
                    <td className="py-3 px-3 text-white font-bold">Total</td>
                    <td className="py-3 px-3 text-right text-white font-bold">
                      {totalHT.toLocaleString('fr-FR')} €
                    </td>
                    <td></td>
                    <td className="py-3 px-3 text-right text-amber-400 font-bold">
                      {Math.round(totalTTC).toLocaleString('fr-FR')} €
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PAC Air/Eau option */}
      <div className="border-t border-gray-700 pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.includePAC || false}
            onChange={(e) => onChange({ includePAC: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-gray-300">Inclure BAR-TH-171 (PAC Air/Eau)</span>
        </label>

        {data.includePAC && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Performance ETAS</label>
              <select
                value={data.pacEtas || 'high'}
                onChange={(e) => onChange({ pacEtas: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {BAR_TH_171.ETAS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Paramètres CEE */}
      <div className="border-t border-gray-700 pt-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Paramètres CEE</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Prix CEE (€/MWh cumac)</label>
            <input
              type="number"
              value={data.priceMWh ?? 7}
              onChange={(e) => onChange({ priceMWh: Number(e.target.value) || 0 })}
              step={0.5}
              min={0}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">% CEE déduit au client</label>
            <input
              type="number"
              value={data.ceePercent ?? 100}
              onChange={(e) => onChange({ ceePercent: Number(e.target.value) || 0 })}
              min={0}
              max={100}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Recap en mode détaillé */}
      {mode === 'detaille' && travaux.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-sm text-gray-400">
            Les montants HT/TTC seront automatiquement utilisés pour la synthèse financière.
          </p>
          <p className="text-amber-400 font-bold mt-1">
            Budget total : {totalHT.toLocaleString('fr-FR')} € HT — {Math.round(totalTTC).toLocaleString('fr-FR')} € TTC
          </p>
        </div>
      )}
    </div>
  )
}
