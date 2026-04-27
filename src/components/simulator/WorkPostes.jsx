import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { TVA_RATES } from '../../lib/constants/renovationGlobale'

const fmt = (v) => v ? Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '0'

/**
 * Construit la liste plate d'options pour le select, groupées par catégorie
 */
function buildOptions(workGroups) {
  const opts = []
  for (const grp of workGroups) {
    if (grp.freeInput) continue
    for (const item of grp.items) {
      opts.push({
        value: item.value,
        label: item.label + (item.r ? ` (${item.r})` : ''),
        group: grp.label,
        groupIcon: grp.icon,
      })
    }
  }
  return opts
}

/**
 * WorkPostes — Postes de travaux avec prix HT / TVA / TTC par ligne
 *
 * Mode "rapide" : checkboxes simples + coût global manuel
 * Mode "détaillé" : lignes dynamiques avec prix par poste
 *
 * @param {Array} workGroups - WORK_GROUPS_MAISON ou WORK_GROUPS_APPART
 * @param {Array} workItems - [{ id, type, label, prixHT, tva, custom }]
 * @param {Function} onChange - (newWorkItems) => void
 * @param {string} mode - 'rapide' | 'detaille'
 * @param {Function} onModeChange - (newMode) => void
 * @param {number} projectCostHT - coût global HT (mode rapide)
 * @param {Function} onProjectCostHTChange
 * @param {number} projectCostTTC - coût global TTC (mode rapide)
 * @param {Function} onProjectCostTTCChange
 */
const CHAUFFAGE_OPTIONS = [
  { value: '', label: '— Type de chauffage actuel —' },
  { value: 'fioul', label: 'Fioul' },
  { value: 'gaz', label: 'Gaz' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'bois', label: 'Bois / Bûches' },
  { value: 'granules', label: 'Granulés / Pellets' },
  { value: 'charbon', label: 'Charbon' },
  { value: 'gpl', label: 'GPL / Propane' },
  { value: 'pac', label: 'Pompe à chaleur' },
  { value: 'autre', label: 'Autre' },
]

export default function WorkPostes({
  workGroups,
  workItems,
  onChange,
  mode = 'rapide',
  onModeChange,
  chauffageActuel,
  onChauffageActuelChange,
  projectCostHT,
  onProjectCostHTChange,
  projectCostTTC,
  onProjectCostTTCChange,
  // Recap financier fusionné
  aideLabel,
  aideAmount,
  resteACharge,
  aideInfo, // message optionnel sur le potentiel d'aide restant
}) {
  const [customLabel, setCustomLabel] = useState('')
  const [detailInputMode, setDetailInputMode] = useState('ht') // 'ht' ou 'ttc'
  const options = buildOptions(workGroups)

  // Isolation check — compter les gestes distincts (combles, murs, fenetres, plancher)
  const isolationGroup = workGroups.find(g => g.group === 'isolation')
  const isolationItems = isolationGroup?.items || []
  const isolationValues = new Set(isolationItems.map(i => i.value))
  const isolationGestesMap = Object.fromEntries(isolationItems.map(i => [i.value, i.geste || i.value]))
  const isolationGestes = new Set(workItems.filter(w => isolationValues.has(w.type)).map(w => isolationGestesMap[w.type]))
  const isolationCount = isolationGestes.size
  const isolationMin = isolationGroup?.minRequired || 2

  // Chauffage fioul check
  const isFioul = chauffageActuel === 'fioul'
  const chauffageGroup = workGroups.find(g => g.group === 'chauffage')
  const chauffageValues = new Set((chauffageGroup?.items || []).map(i => i.value))
  const chauffageCount = workItems.filter(w => chauffageValues.has(w.type)).length
  const chauffageMissing = isFioul && chauffageCount === 0

  // Totaux mode détaillé
  const totalHT = workItems.reduce((s, w) => s + (Number(w.prixHT) || 0), 0)
  const totalTVA = workItems.reduce((s, w) => {
    const ht = Number(w.prixHT) || 0
    return s + Math.round(ht * (Number(w.tva) || 5.5) / 100)
  }, 0)
  const totalTTC = totalHT + totalTVA

  function addPoste() {
    const id = `poste_${Date.now()}`
    onChange([...workItems, { id, type: '', label: '', prixHT: 0, tva: 5.5, custom: false }])
  }

  function addCustomPoste() {
    if (!customLabel.trim()) return
    const id = `custom_${Date.now()}`
    onChange([...workItems, { id, type: `custom_${id}`, label: customLabel.trim(), prixHT: 0, tva: 5.5, custom: true }])
    setCustomLabel('')
  }

  function removePoste(id) {
    onChange(workItems.filter(w => w.id !== id))
  }

  function updatePoste(id, field, value) {
    onChange(workItems.map(w => {
      if (w.id !== id) return w
      const updated = { ...w, [field]: value }
      // Si on change le type, mettre à jour le label
      if (field === 'type') {
        const opt = options.find(o => o.value === value)
        updated.label = opt?.label || value
        updated.custom = false
      }
      // Si saisie en TTC → recalculer le HT
      if (field === 'prixTTC') {
        const ttc = Number(value) || 0
        const tva = Number(updated.tva) || 5.5
        updated.prixHT = Math.round(ttc / (1 + tva / 100))
        updated.prixTTC = ttc
      }
      // Si changement de TVA, recalculer selon le mode
      if (field === 'tva') {
        const tva = Number(value) || 5.5
        if (detailInputMode === 'ttc' && updated.prixTTC) {
          updated.prixHT = Math.round(Number(updated.prixTTC) / (1 + tva / 100))
        }
      }
      return updated
    }))
  }

  // Mode rapide : toggle simple
  function toggleWork(value) {
    const exists = workItems.find(w => w.type === value)
    if (exists) {
      onChange(workItems.filter(w => w.type !== value))
    } else {
      const opt = options.find(o => o.value === value)
      onChange([...workItems, { id: `poste_${Date.now()}`, type: value, label: opt?.label || value, prixHT: 0, tva: 5.5, custom: false }])
    }
  }

  // Grouper les options par catégorie pour le select
  const groupedOptions = {}
  for (const opt of options) {
    if (!groupedOptions[opt.group]) groupedOptions[opt.group] = { icon: opt.groupIcon, items: [] }
    groupedOptions[opt.group].items.push(opt)
  }

  return (
    <div className="space-y-4">
      {/* Toggle Rapide / Détaillé */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => onModeChange('rapide')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
            mode === 'rapide' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Rapide
        </button>
        <button
          onClick={() => onModeChange('detaille')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
            mode === 'detaille' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Détaillé
        </button>
      </div>

      {/* ═══ MODE RAPIDE ═══ */}
      {mode === 'rapide' && (
        <div className="space-y-3">
          {workGroups.filter(g => !g.freeInput).map((grp) => (
            <div key={grp.group}>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>{grp.icon}</span>{grp.label}
                {grp.group === 'isolation' && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isolationCount >= isolationMin ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                  }`}>{isolationCount}/{isolationMin} min.</span>
                )}
                {grp.group === 'chauffage' && isFioul && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    chauffageCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                  }`}>Obligatoire (fioul)</span>
                )}
                {grp.group === 'chauffage' && !isFioul && <span className="text-[10px] text-gray-400 font-medium normal-case">— Si fioul, obligatoire</span>}
                {grp.note && grp.group !== 'chauffage' && <span className="text-[10px] text-amber-600 font-medium normal-case">— {grp.note}</span>}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {grp.items.map(item => {
                  const isSelected = workItems.some(w => w.type === item.value)
                  return (
                    <label key={item.value} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition text-sm ${
                      isSelected ? 'bg-indigo-50 border-indigo-400 text-indigo-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleWork(item.value)} className="rounded text-indigo-600" />
                      <span>{item.label}{item.r ? ` (${item.r})` : ''}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Autres travaux en mode rapide */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🔧</span>Autres travaux
            </p>
            {workItems.filter(w => w.custom).map(w => (
              <div key={w.id} className="flex items-center gap-2 mb-1.5 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
                <span className="flex-1">{w.label}</span>
                <button onClick={() => removePoste(w.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPoste())}
                placeholder="Ex : Poêle à granulés..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              <button onClick={addCustomPoste} disabled={!customLabel.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-30 transition flex items-center gap-1">
                <Plus className="w-3 h-3" />Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODE DÉTAILLÉ ═══ */}
      {mode === 'detaille' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Postes de travaux envisagés</p>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button onClick={() => setDetailInputMode('ht')} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition ${detailInputMode === 'ht' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Saisir en HT</button>
              <button onClick={() => setDetailInputMode('ttc')} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition ${detailInputMode === 'ttc' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Saisir en TTC</button>
            </div>
          </div>

          {workItems.map((w) => {
            const ttcCalc = (Number(w.prixHT) || 0) * (1 + (Number(w.tva) || 5.5) / 100)
            const ttcDisplay = detailInputMode === 'ttc' ? (Number(w.prixTTC) || Math.round(ttcCalc)) : Math.round(ttcCalc * 100) / 100
            return (
              <div key={w.id} className="flex flex-wrap items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl">
                {/* Select type ou label custom */}
                {w.custom ? (
                  <div className="flex-1 min-w-[180px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                    {w.label}
                  </div>
                ) : (
                  <select
                    value={w.type}
                    onChange={(e) => updatePoste(w.id, 'type', e.target.value)}
                    className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                  >
                    <option value="">— Choisir un poste —</option>
                    {Object.entries(groupedOptions).map(([group, { icon, items }]) => (
                      <optgroup key={group} label={`${icon} ${group}`}>
                        {items.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}

                {/* Prix HT */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={detailInputMode === 'ht' ? (w.prixHT || '') : (w.prixHT || 0)}
                    onChange={(e) => updatePoste(w.id, 'prixHT', Number(e.target.value) || 0)}
                    placeholder="HT"
                    readOnly={detailInputMode === 'ttc'}
                    className={`w-28 px-3 py-2 border rounded-lg text-sm text-right ${detailInputMode === 'ttc' ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-indigo-200 outline-none'}`}
                  />
                  <span className="text-xs text-gray-400">€ HT</span>
                </div>

                {/* TVA */}
                <select
                  value={w.tva ?? 5.5}
                  onChange={(e) => updatePoste(w.id, 'tva', Number(e.target.value))}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                >
                  {TVA_RATES.map(r => (
                    <option key={r.value} value={r.value}>{r.value}%</option>
                  ))}
                </select>

                {/* TTC */}
                <div className="flex items-center gap-1">
                  {detailInputMode === 'ttc' ? (
                    <input
                      type="number"
                      value={w.prixTTC || ''}
                      onChange={(e) => updatePoste(w.id, 'prixTTC', Number(e.target.value) || 0)}
                      placeholder="TTC"
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none text-right"
                    />
                  ) : (
                    <div className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right font-semibold text-gray-700">
                      {fmt(ttcDisplay)}
                    </div>
                  )}
                  <span className="text-xs text-gray-400">€ TTC</span>
                </div>

                {/* Supprimer */}
                <button onClick={() => removePoste(w.id)} className="p-2 text-gray-300 hover:text-red-500 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}

          {/* Ajouter un poste standard */}
          <button onClick={addPoste}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" />Ajouter un poste
          </button>

          {/* Ajouter un poste libre */}
          <div className="flex gap-2">
            <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPoste())}
              placeholder="Autre : poêle à granulés, désembouage..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
            <button onClick={addCustomPoste} disabled={!customLabel.trim()}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-30 transition flex items-center gap-1">
              <Plus className="w-3 h-3" />Ajouter
            </button>
          </div>

          {/* Alertes avant le récapitulatif */}
          {isolationGroup && isolationCount < isolationMin && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              Minimum {isolationMin} gestes d'isolation requis — actuellement {isolationCount} sélectionné{isolationCount > 1 ? 's' : ''}
            </div>
          )}
          {chauffageGroup && chauffageMissing && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-300 rounded-xl text-xs text-orange-700 font-medium">
              🔥 Chauffage fioul détecté — le remplacement du système de chauffage est obligatoire. Sélectionnez un poste de chauffage.
            </div>
          )}

          {/* Récapitulatif financier */}
          {workItems.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden mt-4">
              <div className="bg-gray-50 divide-y divide-gray-200">
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-600">Total Travaux HT</span>
                  <span className="font-semibold text-gray-800">{fmt(totalHT)} €</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-600">Montant TVA</span>
                  <span className="font-semibold text-gray-800">{fmt(totalTVA)} €</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="font-bold text-gray-800">Total Travaux TTC</span>
                  <span className="font-bold text-gray-800 text-base">{fmt(totalTTC)} €</span>
                </div>
              </div>
              {aideAmount > 0 && (
                <div className="bg-emerald-50 divide-y divide-emerald-100">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-emerald-700">{aideLabel || 'Aide'}</span>
                    <span className="font-semibold text-emerald-700">- {fmt(aideAmount)} €</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="font-bold text-indigo-800">Reste à charge</span>
                    <span className="font-bold text-indigo-800 text-lg">{fmt(resteACharge ?? Math.max(0, totalTTC - aideAmount))} €</span>
                  </div>
                  {aideInfo && (
                    <div className="px-4 py-2.5 bg-blue-50 text-xs text-blue-700 flex items-start gap-1.5">
                      <span className="mt-0.5">💡</span>
                      <span>{aideInfo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alertes mode rapide */}
      {mode === 'rapide' && isolationGroup && isolationCount < isolationMin && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          Minimum {isolationMin} gestes d'isolation requis — actuellement {isolationCount} sélectionné{isolationCount > 1 ? 's' : ''}
        </div>
      )}
      {mode === 'rapide' && chauffageGroup && chauffageMissing && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-300 rounded-xl text-xs text-orange-700 font-medium">
          🔥 Chauffage fioul détecté — le remplacement du système de chauffage est obligatoire. Sélectionnez un poste de chauffage.
        </div>
      )}
    </div>
  )
}
