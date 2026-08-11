import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Plus, Trash2, Edit, Download, Search, Loader2,
  BarChart3, Building2, MapPin, Home, Zap, X, Check, RefreshCw,
  ChevronRight, ChevronDown, ChevronUp, Thermometer, Layers,
  TrendingDown, TrendingUp, Euro, Flame,
} from 'lucide-react'
import { useEstimationsImmo } from '../../hooks/useEstimationsImmo'
import { useAgencesImmo } from '../../hooks/useAgencesImmo'
import { CATALOG } from '../../lib/constants/catalog'
import { MAX_AID_PERCENTAGE } from '../../lib/constants/mpr'
import { ESTIMATION_STATUSES } from '../../lib/constants/prixTravaux'
import { computeSimulationForAllCategories } from '../../lib/calculators/estimationImmo'
import { generateEstimationImmoPdf } from '../../lib/estimationImmoPdf'
import { searchDPE, getDpeColor } from '../../utils/dpeApi'
import DpeDetailCard from '../../components/dpe/DpeDetailCard'

const IMMO_FICHES = CATALOG
  .flatMap((cat) => cat.items.map((i) => ({ ...i, category: cat.category, emoji: cat.emoji })))
  .filter((i) => i.active && ['BAR-TH-171', 'BAR-TH-112', 'BAR-TH-113', 'BAR-EN-101', 'BAR-EN-102', 'BAR-EN-103', 'BAR-TH-174', 'BAR-TH-175'].includes(i.code))

const fmt = (v) => Math.round(Number(v) || 0).toLocaleString('fr-FR')
const fmtEur = (v) => `${fmt(v)} €`
const fmtKWh = (v) => `${fmt(v)} kWh`

const FICHE_ICONS = {
  'BAR-TH-171': Flame, 'BAR-TH-112': Flame, 'BAR-TH-113': Flame,
  'BAR-EN-101': Home, 'BAR-EN-102': Home, 'BAR-EN-103': Home,
  'BAR-TH-174': Layers, 'BAR-TH-175': Layers,
}

const CAT = [
  { key: 'Bleu', label: 'Bleu', sub: 'Très modestes', max: '90%', ceeColor: 'text-emerald-400', mprColor: 'text-sky-400', totalColor: 'text-emerald-400', barCee: 'bg-emerald-500', barMpr: 'bg-sky-400', barRac: 'bg-orange-400', dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600', headerBg: 'bg-blue-600' },
  { key: 'Jaune', label: 'Jaune', sub: 'Modestes', max: '75%', ceeColor: 'text-emerald-400', mprColor: 'text-sky-400', totalColor: 'text-emerald-400', barCee: 'bg-emerald-500', barMpr: 'bg-sky-400', barRac: 'bg-orange-400', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-400 to-amber-500', headerBg: 'bg-amber-500' },
  { key: 'Violet', label: 'Violet', sub: 'Intermédiaires', max: '60%', ceeColor: 'text-emerald-400', mprColor: 'text-sky-400', totalColor: 'text-emerald-400', barCee: 'bg-emerald-500', barMpr: 'bg-sky-400', barRac: 'bg-orange-400', dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', gradient: 'from-purple-500 to-purple-600', headerBg: 'bg-purple-600' },
  { key: 'Rose', label: 'Rose', sub: 'Supérieurs', max: '0%', ceeColor: 'text-emerald-400', mprColor: 'text-sky-400', totalColor: 'text-emerald-400', barCee: 'bg-emerald-500', barMpr: 'bg-sky-400', barRac: 'bg-orange-400', dot: 'bg-pink-500', text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200', gradient: 'from-pink-400 to-pink-500', headerBg: 'bg-pink-500' },
]

export default function EstimationImmoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { estimations, updateEstimation, addSimulation, updateSimulation, deleteSimulation } = useEstimationsImmo()
  const { agences } = useAgencesImmo()

  const estimation = estimations.find((e) => e.id === id)
  const [mainTab, setMainTab] = useState('simulations')
  const [contextExpanded, setContextExpanded] = useState(true)
  const [showCatalog, setShowCatalog] = useState(false)
  const [simForm, setSimForm] = useState(null)
  const [editingSimId, setEditingSimId] = useState(null)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [dpeResults, setDpeResults] = useState(null)

  if (!estimation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Estimation introuvable.</p>
        <button onClick={() => navigate('/admin/estimations-immo')} className="mt-4 text-indigo-600 hover:underline text-sm">Retour</button>
      </div>
    )
  }

  const simulations = estimation.simulations || []
  const agenceNom = agences.find((a) => a.id === estimation.agenceId)?.nom || estimation.agenceNom || ''
  const dpe = estimation.dpe
  const dpeClass = dpe?.etiquetteDpe || null
  const dpeColor = dpeClass ? getDpeColor(dpeClass) : null
  const st = ESTIMATION_STATUSES.find((s) => s.value === estimation.status) || ESTIMATION_STATUSES[0]

  const synthese = useMemo(() => {
    if (!simulations.length) return null
    const result = {}
    for (const cat of CAT) {
      let totalCee = 0, totalMpr = 0, totalCout = 0, totalVolume = 0
      const details = []
      for (const sim of simulations) {
        const d = sim.results?.[cat.key]
        if (d) { totalCee += d.cee || 0; totalMpr += d.mpr || 0; totalVolume += d.volumeCEE || 0 }
        totalCout += sim.prixTravaux || 0
        details.push({ label: sim.title, ficheCode: sim.ficheCode, cout: sim.prixTravaux || 0, cee: d?.cee || 0, mpr: d?.mpr || 0, volume: d?.volumeCEE || 0 })
      }
      const maxAid = (MAX_AID_PERCENTAGE[cat.key] || 0) * totalCout
      let totalAides = Math.round(totalCee + totalMpr)
      if (maxAid > 0 && totalAides > maxAid) totalAides = Math.round(maxAid)
      const resteACharge = Math.max(0, Math.round(totalCout - totalAides))
      const tauxCouverture = totalCout > 0 ? Math.round((totalAides / totalCout) * 100) : 0
      result[cat.key] = { cee: Math.round(totalCee), mpr: Math.round(totalMpr), totalAides, resteACharge, tauxCouverture, totalCout: Math.round(totalCout), totalVolume: Math.round(totalVolume), details }
    }
    return result
  }, [simulations])

  const totalCout = synthese?.Bleu?.totalCout || 0

  const liveResults = useMemo(() => {
    if (!simForm) return null
    try { return computeSimulationForAllCategories(simForm.ficheCode, simForm.inputs, estimation) }
    catch { return null }
  }, [simForm, estimation])

  function handleSelectFiche(fiche) {
    setShowCatalog(false)
    setEditingSimId(null)
    setSimForm({ ficheCode: fiche.code, title: fiche.title, description: fiche.description, prixTravaux: getDefaultPrice(fiche.code), inputs: getDefaultInputs(fiche.code, estimation) })
  }

  function handleEditSim(sim) {
    setEditingSimId(sim.id)
    setShowCatalog(false)
    setSimForm({ ficheCode: sim.ficheCode, title: sim.title, description: '', prixTravaux: sim.prixTravaux, inputs: { ...sim.inputs } })
  }

  function handleSaveSimulation() {
    if (!simForm) return
    const results = computeSimulationForAllCategories(simForm.ficheCode, simForm.inputs, estimation)
    const data = { ficheCode: simForm.ficheCode, title: simForm.title, prixTravaux: Number(simForm.prixTravaux) || 0, inputs: simForm.inputs, results }
    if (editingSimId) updateSimulation(id, editingSimId, data)
    else addSimulation(id, data)
    setSimForm(null)
    setEditingSimId(null)
  }

  function handleDeleteSim(simId) { if (window.confirm('Supprimer cette simulation ?')) deleteSimulation(id, simId) }

  function handleRecalcAll() {
    for (const sim of simulations) {
      const results = computeSimulationForAllCategories(sim.ficheCode, sim.inputs, estimation)
      updateSimulation(id, sim.id, { results })
    }
  }

  async function handleSearchDpe() {
    if (!estimation.codePostal) return
    setDpeLoading(true)
    try {
      const { results, audits } = await searchDPE(estimation.addressLabel || '', estimation.codePostal, estimation.ville || '')
      setDpeResults(results || [])
      if (audits?.length) updateEstimation(id, { audits })
    } catch { /* ignore */ }
    finally { setDpeLoading(false) }
  }

  function handleSelectDpe(d) {
    updateEstimation(id, { dpe: { numeroDpe: d.numeroDpe, etiquetteDpe: d.etiquetteDpe, etiquetteGes: d.etiquetteGes, periodeConstruction: d.periodeConstruction, anneeConstruction: d.anneeConstruction, surface: d.surface, typeBatiment: d.typeBatiment, consoM2: d.consoM2, emissionGes: d.emissionGes, installationChauffage: d.installationChauffage, energieChauffage: d.energieChauffage, isolationEnveloppe: d.isolationEnveloppe, isolationMurs: d.isolationMurs, isolationPlancherBas: d.isolationPlancherBas, isolationMenuiseries: d.isolationMenuiseries, dateEtablissement: d.dateEtablissement, observatoireUrl: d.observatoireUrl, adresse: d.adresse, codePostal: d.codePostal, commune: d.commune } })
    setDpeResults(null)
  }

  function handleExportPdf() { generateEstimationImmoPdf({ ...estimation, synthese, agenceNom }) }

  return (
    <div className="animate-fade-in bg-slate-50 min-h-screen">
      {/* ═══ HEADER ═══ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-1.5 py-2 text-xs text-slate-400">
            <Link to="/admin/estimations-immo" className="hover:text-indigo-600 transition">Estimations Immo</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium truncate max-w-[300px]">{estimation.addressLabel || 'Sans adresse'}</span>
          </div>
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900">{estimation.addressLabel || 'Estimation'}</h1>
                  {dpeClass && <span className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shadow-sm" style={{ backgroundColor: dpeColor?.bg, color: dpeColor?.text }}>{dpeClass}</span>}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {agenceNom && <span className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{agenceNom}</span>}
                  {estimation.dossier && <span className="text-xs text-slate-400">{estimation.dossier}</span>}
                  {estimation.ville && <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{estimation.codePostal} {estimation.ville}</span>}
                  {estimation.zone && <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">Zone {estimation.zone}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {synthese && <button onClick={handleExportPdf} className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />PDF</button>}
              <Link to={`/admin/estimations-immo/${id}/modifier`} className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"><Edit className="w-3.5 h-3.5" />Modifier</Link>
              <select value={estimation.status} onChange={(e) => updateEstimation(id, { status: e.target.value })} className="px-3 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg border-0 text-white cursor-pointer transition">
                {ESTIMATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BARRE CONTEXTE ═══ */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6">
          <button onClick={() => setContextExpanded(!contextExpanded)} className="w-full flex items-center justify-between py-2.5 text-left group">
            <div className="flex items-center gap-5 flex-wrap text-xs text-slate-500">
              {estimation.typeLogement && <span className="flex items-center gap-1"><Home className="w-3 h-3 text-slate-400" />{estimation.typeLogement === 'maison' ? 'Maison' : 'Appartement'}</span>}
              {estimation.surface && <span className="font-medium">{estimation.surface} m²</span>}
              {estimation.chauffageActuel && <span className="capitalize">{estimation.chauffageActuel}</span>}
              {synthese && <>
                <div className="w-px h-4 bg-slate-200" />
                <span className="font-bold text-slate-700">{fmtEur(totalCout)} de travaux</span>
              </>}
            </div>
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-500 transition shrink-0 ml-4">
              <span className="text-[10px] font-medium">{contextExpanded ? 'Masquer' : 'Détails'}</span>
              {contextExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          {contextExpanded && (
            <div className="pb-4 pt-1 border-t border-slate-100 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <InfoBlock label="Type" value={estimation.typeLogement === 'maison' ? 'Maison individuelle' : estimation.typeLogement === 'appartement' ? 'Appartement' : '—'} />
                <InfoBlock label="Surface" value={estimation.surface ? `${estimation.surface} m²` : '—'} />
                <InfoBlock label="Zone climatique" value={estimation.zone || '—'} />
                <InfoBlock label="Chauffage actuel" value={estimation.chauffageActuel || '—'} />
              </div>
              {synthese && (
                <div className="grid grid-cols-4 gap-3">
                  {CAT.map((cat) => {
                    const d = synthese[cat.key]
                    if (!d) return null
                    return (
                      <div key={cat.key} className={`rounded-xl ${cat.bg} border ${cat.border} px-3 py-2.5`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${cat.dot}`} /><span className={`text-xs font-bold ${cat.text}`}>{cat.label}</span></div>
                          <span className={`text-[10px] font-semibold ${cat.text}`}>{d.tauxCouverture}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${cat.gradient} transition-all`} style={{ width: `${Math.min(100, d.tauxCouverture)}%` }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[10px] text-slate-500">Aides {fmtEur(d.totalAides)}</span>
                          <span className={`text-[10px] font-bold ${cat.text}`}>RAC {fmtEur(d.resteACharge)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-5">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 flex gap-1">
              {[
                { id: 'simulations', label: 'Simulations', icon: Zap, count: simulations.length },
                { id: 'synthese', label: 'Synthèse', icon: BarChart3 },
                { id: 'dpe', label: 'DPE & Diagnostic', icon: Thermometer, badge: dpeClass },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setMainTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${mainTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                  {tab.count != null && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${mainTab === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>{tab.count}</span>}
                  {tab.badge && tab.id === 'dpe' && <span className="w-5 h-5 rounded text-[10px] font-black flex items-center justify-center" style={{ backgroundColor: getDpeColor(tab.badge)?.bg, color: getDpeColor(tab.badge)?.text }}>{tab.badge}</span>}
                </button>
              ))}
            </div>

            {/* ══ TAB: Simulations ══ */}
            {mainTab === 'simulations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded-lg"><Zap className="w-4 h-4 text-indigo-600" /></div>
                    Simulations CEE <span className="text-slate-400 font-normal">({simulations.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    {simulations.length > 0 && (
                      <button onClick={handleRecalcAll} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"><RefreshCw className="w-3.5 h-3.5" />Recalculer</button>
                    )}
                    <button onClick={() => setShowCatalog(!showCatalog)} className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 px-3 py-2 rounded-lg transition shadow-sm">
                      <Plus className="w-3.5 h-3.5" />Ajouter une fiche
                    </button>
                  </div>
                </div>

                {/* Catalogue */}
                {showCatalog && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">Sélectionnez une fiche CEE :</p>
                      <button onClick={() => setShowCatalog(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                    </div>
                    {['Chauffage & EnR', 'Rénovation Globale', 'Isolation'].map((catName) => {
                      const items = IMMO_FICHES.filter((f) => f.category === catName)
                      if (!items.length) return null
                      return (
                        <div key={catName}>
                          <p className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase tracking-wider">{items[0]?.emoji} {catName}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {items.map((fiche) => {
                              const Icon = FICHE_ICONS[fiche.code] || Zap
                              return (
                                <button key={fiche.code} onClick={() => handleSelectFiche(fiche)}
                                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md text-xs transition text-left group">
                                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition"><Icon className="w-4 h-4 text-indigo-600" /></div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-slate-700 font-semibold block">{fiche.title}</span>
                                    <span className="text-[10px] text-indigo-500 font-bold">{fiche.code}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition shrink-0" />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Empty state */}
                {simulations.length === 0 && !showCatalog && !simForm && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-14 px-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Zap className="w-8 h-8 text-slate-300" /></div>
                    <p className="text-sm font-semibold text-slate-600">Aucune simulation</p>
                    <p className="text-xs text-slate-400 mt-1">Ajoutez des fiches CEE pour simuler les aides</p>
                    <button onClick={() => setShowCatalog(true)} className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"><Plus className="w-4 h-4" />Ajouter une fiche CEE</button>
                  </div>
                )}

                {/* ── Simulation cards (same style as simulator pages) ── */}
                {simulations.map((sim) => {
                  const Icon = FICHE_ICONS[sim.ficheCode] || Zap
                  return (
                    <div key={sim.id} className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      {/* Header code fiche */}
                      <div className="bg-[#1a1f2e] px-5 py-3">
                        <p className="text-slate-500 text-[11px] font-mono uppercase tracking-[0.15em] mb-0.5">{sim.ficheCode}</p>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white">{sim.title}</h3>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleEditSim(sim)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition" title="Modifier"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteSim(sim.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Coût TTC : {fmtEur(sim.prixTravaux)} {sim.results?.Bleu?.volumeCEE > 0 ? `— ${fmtKWh(sim.results.Bleu.volumeCEE)} cumac` : ''}</p>
                      </div>

                      {/* Params résumé */}
                      <div className="px-5 py-2 bg-[#1e2433] flex items-center gap-3 flex-wrap text-[10px] text-slate-500">
                        {Object.entries(sim.inputs || {}).filter(([k]) => k !== 'priceMWh').map(([k, v]) => (
                          <span key={k}>{formatInputLabel(k)} : <span className="text-slate-300 font-medium">{typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : String(v)}</span></span>
                        ))}
                      </div>

                      {/* ── Synthèse 4 catégories (dark block like simulator) ── */}
                      <div className="bg-[#1a1f2e] px-5 py-4">
                        <div className="grid grid-cols-4 gap-3">
                          {CAT.map((cat) => {
                            const cee = sim.results?.[cat.key]?.cee || 0
                            const mpr = sim.results?.[cat.key]?.mpr || 0
                            const maxAid = (MAX_AID_PERCENTAGE[cat.key] || 0) * (sim.prixTravaux || 0)
                            let total = cee + mpr
                            const capped = maxAid > 0 && total > maxAid
                            if (capped) total = Math.round(maxAid)
                            const rac = Math.max(0, (sim.prixTravaux || 0) - total)
                            const pctCee = sim.prixTravaux > 0 ? (cee / sim.prixTravaux) * 100 : 0
                            const pctMpr = sim.prixTravaux > 0 ? (mpr / sim.prixTravaux) * 100 : 0

                            return (
                              <div key={cat.key} className="text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                  <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                                  <span className={`text-xs font-bold ${cat.text}`}>{cat.label}</span>
                                </div>

                                <div className="space-y-1.5 mb-3">
                                  <div><p className="text-[9px] text-emerald-500/60 uppercase font-medium">CEE</p><p className="text-sm font-extrabold text-emerald-400">{fmtEur(cee)}</p></div>
                                  <div><p className="text-[9px] text-sky-400/60 uppercase font-medium">MPR</p><p className="text-sm font-extrabold text-sky-400">{fmtEur(mpr)}</p></div>
                                </div>

                                <div className="h-px bg-white/10 my-2" />

                                <div className="mb-2">
                                  <p className="text-[9px] text-white/40 uppercase font-medium">Total aides</p>
                                  <p className="text-lg font-extrabold text-emerald-400">{fmtEur(total)}</p>
                                  {capped && <p className="text-[8px] text-orange-400">Plafonné {cat.max}</p>}
                                </div>

                                <div className="mb-2">
                                  <p className="text-[9px] text-white/40 uppercase font-medium">Reste à charge</p>
                                  <p className="text-base font-extrabold text-white">{fmtEur(rac)}</p>
                                </div>

                                {/* Barre répartition */}
                                <div className="h-2 rounded-full overflow-hidden bg-white/10 flex">
                                  {cee > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pctCee}%` }} />}
                                  {mpr > 0 && <div className="h-full bg-sky-400 transition-all" style={{ width: `${pctMpr}%` }} />}
                                  {rac > 0 && <div className="h-full bg-orange-400 flex-1" />}
                                </div>
                                <div className="flex justify-between mt-1 text-[8px]">
                                  {cee > 0 && <span className="text-emerald-500">{Math.round(pctCee)}%</span>}
                                  {mpr > 0 && <span className="text-sky-400">{Math.round(pctMpr)}%</span>}
                                  {rac > 0 && <span className="text-orange-400 ml-auto">{Math.round((rac / sim.prixTravaux) * 100)}%</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Totaux globaux si plusieurs simulations */}
                {simulations.length > 1 && synthese && (
                  <div className="rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-[#1a1f2e] px-5 py-3 border-b border-white/5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" />Récapitulatif global — {simulations.length} postes — {fmtEur(totalCout)}</h3>
                    </div>
                    <div className="bg-[#1a1f2e] px-5 py-4">
                      <div className="grid grid-cols-4 gap-3">
                        {CAT.map((cat) => {
                          const d = synthese[cat.key]
                          return (
                            <div key={cat.key} className="text-center">
                              <div className="flex items-center justify-center gap-1.5 mb-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`} />
                                <span className={`text-sm font-bold ${cat.text}`}>{cat.label}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center mb-3">
                                <div><p className="text-[9px] text-emerald-500/60 uppercase">CEE</p><p className="text-base font-extrabold text-emerald-400">{fmtEur(d.cee)}</p></div>
                                <div><p className="text-[9px] text-sky-400/60 uppercase">MPR</p><p className="text-base font-extrabold text-sky-400">{fmtEur(d.mpr)}</p></div>
                              </div>
                              <div className="h-px bg-white/10 my-2" />
                              <div>
                                <p className="text-[9px] text-white/40 uppercase">Total aides</p>
                                <p className="text-2xl font-extrabold text-emerald-400">{fmtEur(d.totalAides)}</p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <p className="text-[9px] text-white/40 uppercase">Reste à charge</p>
                                <p className="text-xl font-extrabold text-white">{fmtEur(d.resteACharge)}</p>
                              </div>
                              <div className="h-2.5 rounded-full overflow-hidden bg-white/10 flex mt-3">
                                {d.cee > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(d.cee / d.totalCout) * 100}%` }} />}
                                {d.mpr > 0 && <div className="h-full bg-sky-400" style={{ width: `${(d.mpr / d.totalCout) * 100}%` }} />}
                                <div className="h-full bg-orange-400 flex-1" />
                              </div>
                              <div className="flex justify-between mt-1 text-[8px]">
                                <span className="text-emerald-500">CEE</span>
                                <span className="text-sky-400">MPR</span>
                                <span className="text-orange-400">RAC {d.tauxCouverture < 100 ? `${100 - d.tauxCouverture}%` : ''}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB: Synthèse ══ */}
            {mainTab === 'synthese' && (
              <div className="space-y-5">
                {!synthese ? (
                  <EmptyState icon={BarChart3} title="Aucune donnée" desc="Ajoutez des simulations CEE pour voir la synthèse" />
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Détail par poste de travaux</h3>
                      <span className="text-[10px] text-slate-400">{simulations.length} poste{simulations.length > 1 ? 's' : ''} — {fmtEur(totalCout)}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2.5">Fiche</th>
                            <th className="text-left text-[10px] font-bold text-slate-500 uppercase px-3 py-2.5">Poste</th>
                            <th className="text-right text-[10px] font-bold text-slate-500 uppercase px-3 py-2.5">Coût</th>
                            {CAT.map((c) => (
                              <th key={c.key} className="text-right px-3 py-2.5">
                                <div className="flex items-center justify-end gap-1"><span className={`w-2 h-2 rounded-full ${c.dot}`} /><span className={`text-[10px] font-bold uppercase ${c.text}`}>{c.label}</span></div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {simulations.map((sim, i) => (
                            <tr key={sim.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5"><span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px]">{sim.ficheCode}</span></td>
                              <td className="px-3 py-2.5 font-medium text-slate-900 text-xs">{sim.title}</td>
                              <td className="px-3 py-2.5 text-right text-slate-600 text-xs">{fmtEur(sim.prixTravaux)}</td>
                              {CAT.map((cat) => {
                                const d = synthese[cat.key]?.details?.[i]
                                const aide = (d?.cee || 0) + (d?.mpr || 0)
                                return (
                                  <td key={cat.key} className="px-3 py-2.5 text-right">
                                    {aide > 0 ? <><span className={`font-bold text-xs ${cat.text}`}>{fmtEur(aide)}</span><span className="block text-[9px] text-slate-400">CEE {fmt(d.cee)} · MPR {fmt(d.mpr)}</span></> : <span className="text-slate-300">—</span>}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                            <td className="px-4 py-3 text-xs" colSpan={2}>Total</td>
                            <td className="px-3 py-3 text-right text-xs text-slate-900">{fmtEur(totalCout)}</td>
                            {CAT.map((cat) => <td key={cat.key} className={`px-3 py-3 text-right text-xs ${cat.text}`}>{fmtEur(synthese[cat.key]?.totalAides)}</td>)}
                          </tr>
                          <tr className="bg-orange-50/50 font-bold">
                            <td className="px-4 py-3 text-xs text-orange-700" colSpan={2}>Reste à charge</td>
                            <td className="px-3 py-3" />
                            {CAT.map((cat) => <td key={cat.key} className="px-3 py-3 text-right text-xs text-orange-600 font-bold">{fmtEur(synthese[cat.key]?.resteACharge)}</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB: DPE ══ */}
            {mainTab === 'dpe' && (
              <div className="space-y-5">
                {dpe ? (
                  <DpeDetailCard dpe={dpe} audits={estimation.audits} onDetach={() => updateEstimation(id, { dpe: null, audits: null })} />
                ) : (
                  <EmptyState icon={Thermometer} title="Aucun DPE rattaché" desc="Recherchez le diagnostic énergétique pour ce logement">
                    <button onClick={handleSearchDpe} disabled={!estimation.codePostal || dpeLoading} className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-40">
                      {dpeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}Rechercher le DPE
                    </button>
                  </EmptyState>
                )}
                {dpeResults?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">{dpeResults.length} DPE trouvé{dpeResults.length > 1 ? 's' : ''} :</p>
                    {dpeResults.map((d) => <DpeDetailCard key={d.numeroDpe} dpe={d} compact onAttach={() => handleSelectDpe(d)} />)}
                  </div>
                )}
                {dpe && <div className="flex justify-center"><button onClick={handleSearchDpe} disabled={!estimation.codePostal || dpeLoading} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition disabled:opacity-40">{dpeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}Rechercher un autre DPE</button></div>}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Statut</h3>
              <div className="space-y-1">
                {ESTIMATION_STATUSES.map((s) => {
                  const active = estimation.status === s.value
                  return <button key={s.value} onClick={() => updateEstimation(id, { status: s.value })} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${active ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}><span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label}{active && <Check className="w-3 h-3 ml-auto text-indigo-600" />}</button>
                })}
              </div>
            </div>
            {synthese && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Résumé</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Coût travaux</span><span className="font-bold text-slate-800">{fmtEur(totalCout)}</span></div>
                  <div className="h-px bg-slate-100" />
                  {CAT.map((cat) => <div key={cat.key} className="flex justify-between text-xs"><span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${cat.dot}`} /><span className="text-slate-500">{cat.label}</span></span><span className={`font-bold ${cat.text}`}>{fmtEur(synthese[cat.key]?.resteACharge)}</span></div>)}
                </div>
              </div>
            )}
            {dpe && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">DPE</h3>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl text-lg font-black flex items-center justify-center shadow-sm" style={{ backgroundColor: dpeColor?.bg, color: dpeColor?.text }}>{dpeClass}</span>
                  <div className="text-xs"><p className="font-semibold text-slate-700">{dpe.consoM2 ? `${Math.round(dpe.consoM2)} kWh/m².an` : '—'}</p><p className="text-slate-400">{dpe.periodeConstruction || '—'}</p></div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</h3>
              <textarea value={estimation.notes || ''} onChange={(e) => updateEstimation(id, { notes: e.target.value })} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none" placeholder="Notes internes..." />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL ═══ */}
      {simForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto" onClick={() => { setSimForm(null); setEditingSimId(null) }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header dark */}
            <div className="bg-[#1a1f2e] rounded-t-2xl px-6 py-4">
              <p className="text-slate-500 text-[11px] font-mono uppercase tracking-[0.15em] mb-0.5">{simForm.ficheCode}</p>
              <h2 className="text-base font-bold text-white">{simForm.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{editingSimId ? 'Modifier la simulation' : 'Nouvelle simulation'} — CEE + MaPrimeRénov'</p>
            </div>

            <div className="px-6 py-5">
              <SimFormFields ficheCode={simForm.ficheCode} inputs={simForm.inputs} prixTravaux={simForm.prixTravaux} estimation={estimation}
                onChange={(inputs) => setSimForm((f) => ({ ...f, inputs }))} onChangePrix={(v) => setSimForm((f) => ({ ...f, prixTravaux: v }))} />
            </div>

            {/* Live preview dark */}
            {liveResults && (
              <div className="bg-[#1a1f2e] px-6 py-5">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-4 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-emerald-400" />Aperçu des aides</p>
                <div className="grid grid-cols-4 gap-3">
                  {CAT.map((cat) => {
                    const d = liveResults[cat.key]
                    const cee = d?.cee || 0, mpr = d?.mpr || 0
                    const prix = Number(simForm.prixTravaux) || 0
                    const maxAid = (MAX_AID_PERCENTAGE[cat.key] || 0) * prix
                    let total = cee + mpr
                    const capped = maxAid > 0 && total > maxAid
                    if (capped) total = Math.round(maxAid)
                    const rac = Math.max(0, prix - total)
                    return (
                      <div key={cat.key} className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-2"><span className={`w-2 h-2 rounded-full ${cat.dot}`} /><span className={`text-xs font-bold ${cat.text}`}>{cat.label}</span></div>
                        <p className="text-[9px] text-emerald-500/60 uppercase">CEE</p>
                        <p className="text-sm font-extrabold text-emerald-400">{fmtEur(cee)}</p>
                        <p className="text-[9px] text-sky-400/60 uppercase mt-1">MPR</p>
                        <p className="text-sm font-extrabold text-sky-400">{fmtEur(mpr)}</p>
                        <div className="h-px bg-white/10 my-2" />
                        <p className="text-[9px] text-white/40 uppercase">Total</p>
                        <p className="text-lg font-extrabold text-emerald-400">{fmtEur(total)}</p>
                        {capped && <p className="text-[8px] text-orange-400">Plafonné {cat.max}</p>}
                        <p className="text-[9px] text-white/40 uppercase mt-1">RAC</p>
                        <p className="text-base font-extrabold text-white">{fmtEur(rac)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={() => { setSimForm(null); setEditingSimId(null) }} className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-200 rounded-xl transition">Annuler</button>
              <button onClick={handleSaveSimulation} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm flex items-center gap-1.5 shadow-sm"><Check className="w-4 h-4" />{editingSimId ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBlock({ label, value }) {
  return <div className="text-xs"><p className="text-slate-400 font-medium">{label}</p><p className="text-slate-700 font-semibold mt-0.5 capitalize">{value}</p></div>
}

function EmptyState({ icon: Icon, title, desc, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon className="w-8 h-8 text-slate-300" /></div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
      {children}
    </div>
  )
}

function formatInputLabel(key) {
  return { type: 'Type', surface: 'Surface', etas: 'ETAS', zone: 'Zone', remplaceCharbon: 'Charbon', classInitiale: 'DPE initial', classCible: 'DPE visé', projectCostHT: 'Coût HT' }[key] || key
}

function getDefaultPrice(ficheCode) {
  return { 'BAR-TH-171': 14000, 'BAR-TH-112': 6000, 'BAR-TH-113': 18000, 'BAR-EN-101': 4000, 'BAR-EN-102': 12000, 'BAR-EN-103': 5000, 'BAR-TH-174': 45000, 'BAR-TH-175': 35000 }[ficheCode] || 10000
}

function getDefaultInputs(ficheCode, estimation) {
  const zone = estimation.zone || 'H2', surface = Number(estimation.surface) || 100
  const type = estimation.typeLogement === 'appartement' ? 'Appartement' : 'Maison'
  switch (ficheCode) {
    case 'BAR-TH-171': return { type, surface, etas: 'high', zone, priceMWh: 7 }
    case 'BAR-TH-112': return { etas: 'high', zone, remplaceCharbon: estimation.chauffageActuel === 'charbon', priceMWh: 7 }
    case 'BAR-TH-113': return { zone, priceMWh: 7 }
    case 'BAR-EN-101': return { surface: Math.round(surface * 0.8), zone, priceMWh: 7 }
    case 'BAR-EN-102': return { surface: Math.round(surface * 1.2), zone, priceMWh: 7 }
    case 'BAR-EN-103': return { surface: Math.round(surface * 0.9), zone, priceMWh: 7 }
    case 'BAR-TH-174': case 'BAR-TH-175': return { classInitiale: estimation.dpe?.etiquetteDpe || 'F', classCible: 'C', surface, priceMWh: 7, projectCostHT: 35000 }
    default: return { zone, surface, priceMWh: 7 }
  }
}

function SimFormFields({ ficheCode, inputs, prixTravaux, onChange, onChangePrix }) {
  function set(field, value) { onChange({ ...inputs, [field]: value }) }
  const fc = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
  const Label = ({ children }) => <label className="block text-xs font-medium text-slate-500 mb-1.5">{children}</label>

  const priceField = (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <Label>Prix de vente TTC (€)</Label>
      <div className="relative"><input type="number" value={prixTravaux} onChange={(e) => onChangePrix(Number(e.target.value) || 0)} className={fc + ' pr-8'} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span></div>
    </div>
  )

  const zoneField = <div><Label>Zone climatique</Label><select value={inputs.zone} onChange={(e) => set('zone', e.target.value)} className={fc}><option value="H1">H1 — Nord</option><option value="H2">H2 — Centre / Ouest</option><option value="H3">H3 — Méditerranée</option></select></div>

  if (ficheCode === 'BAR-TH-171') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Type de logement</Label><select value={inputs.type} onChange={(e) => set('type', e.target.value)} className={fc}><option value="Maison">Maison individuelle</option><option value="Appartement">Appartement</option></select></div>
        <div><Label>Surface chauffée (m²)</Label><input type="number" value={inputs.surface} onChange={(e) => set('surface', Number(e.target.value))} className={fc} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Efficacité ETAS</Label><select value={inputs.etas} onChange={(e) => set('etas', e.target.value)} className={fc}><option value="high">≥ 140% (haute perf.)</option><option value="standard">111% — 139%</option></select></div>
        {zoneField}
      </div>
      {priceField}
    </div>
  )

  if (ficheCode === 'BAR-TH-112') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Efficacité ETAS</Label><select value={inputs.etas} onChange={(e) => set('etas', e.target.value)} className={fc}><option value="high">≥ 80%</option><option value="medium">72% — 79%</option><option value="low">66% — 71%</option></select></div>
        {zoneField}
      </div>
      <label className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 cursor-pointer">
        <input type="checkbox" checked={inputs.remplaceCharbon} onChange={(e) => set('remplaceCharbon', e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
        Remplace un chauffage charbon <span className="text-emerald-600 text-xs font-medium">(bonus)</span>
      </label>
      {priceField}
    </div>
  )

  if (ficheCode === 'BAR-TH-113') return <div className="space-y-4">{zoneField}{priceField}</div>

  if (['BAR-EN-101', 'BAR-EN-102', 'BAR-EN-103'].includes(ficheCode)) {
    const lbl = ficheCode === 'BAR-EN-101' ? 'Surface combles (m²)' : ficheCode === 'BAR-EN-102' ? 'Surface murs isolés (m²)' : 'Surface plancher bas (m²)'
    return <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><Label>{lbl}</Label><input type="number" value={inputs.surface} onChange={(e) => set('surface', Number(e.target.value))} className={fc} /></div>{zoneField}</div>{priceField}</div>
  }

  if (ficheCode === 'BAR-TH-174' || ficheCode === 'BAR-TH-175') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>DPE initial</Label><select value={inputs.classInitiale} onChange={(e) => set('classInitiale', e.target.value)} className={fc}>{['G','F','E','D','C'].map((c) => <option key={c} value={c}>Classe {c}</option>)}</select></div>
        <div><Label>DPE visé</Label><select value={inputs.classCible} onChange={(e) => set('classCible', e.target.value)} className={fc}>{['A','B','C','D'].map((c) => <option key={c} value={c}>Classe {c}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Surface (m²)</Label><input type="number" value={inputs.surface} onChange={(e) => set('surface', Number(e.target.value))} className={fc} /></div>
        <div><Label>Coût travaux HT (€)</Label><input type="number" value={inputs.projectCostHT} onChange={(e) => set('projectCostHT', Number(e.target.value))} className={fc} /></div>
      </div>
      {priceField}
    </div>
  )

  return <div>{priceField}</div>
}
