import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Home,
  ChevronRight, MessageSquare, Send, Trash2, Calculator, FileText, Plus, ExternalLink,
  Search, Loader2, Thermometer,
  Bell, Check, Calendar, AlertTriangle, CheckCircle, Layers, User, Zap
} from 'lucide-react'
import { useProjects, PROJECT_STATUSES } from '../hooks/useProjects'
import { useDocumentRequests, DOC_TYPES, DOC_REQUEST_STATUSES } from '../hooks/useDocumentRequests'
import { useProjectBeneficiary } from '../hooks/useProjectBeneficiary'
import { useSimulationHistory } from '../hooks/useSimulationHistory'
import { CATALOG } from '../lib/constants/catalog'
import { getLocationInfo } from '../utils/postalCode'
import { searchDPE, getDpeColor } from '../utils/dpeApi'
import { getCompletion } from '../lib/completionGauge'

const CAT = {
  Bleu: 'bg-blue-500 text-white', Jaune: 'bg-yellow-500 text-white',
  Violet: 'bg-purple-500 text-white', Rose: 'bg-pink-500 text-white',
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, updateProject, updateProjectStatus, addNote, deleteNote, addScenario, getScenarioTotals, addReminder, toggleReminder, deleteReminder } = useProjects()
  const { history } = useSimulationHistory()
  const [noteText, setNoteText] = useState('')
  const [showNewSim, setShowNewSim] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [showAddScenario, setShowAddScenario] = useState(false)
  const [reminderText, setReminderText] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const { beneficiary, sharedScenarios: projectSharedScenarios } = useProjectBeneficiary(id)
  const { requests: docRequests, createRequest: createDocRequest, updateRequestStatus } = useDocumentRequests(id)
  const [showDocForm, setShowDocForm] = useState(false)
  const [docType, setDocType] = useState('autre')
  const [docMessage, setDocMessage] = useState('')
  const [dpeResults, setDpeResults] = useState(null)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [showDpe, setShowDpe] = useState(false)

  const project = projects.find((c) => c.id === id)
  if (!project) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Projet introuvable</p></div>

  const st = PROJECT_STATUSES.find((s) => s.value === project.status)
  const linkedSims = (project.simulations || []).map((sid) => history.find((h) => h.id === sid)).filter(Boolean)
  const loc = project.postalCode ? getLocationInfo(project.postalCode) : null
  const dpe = project.dpe
  const fmt = (v) => v ? Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '0'

  function handleAddNote() { if (!noteText.trim()) return; addNote(id, noteText.trim()); setNoteText('') }
  function handleAddScenario(e) { e.preventDefault(); addScenario(id, newScenarioName.trim() || undefined); setNewScenarioName(''); setShowAddScenario(false) }
  function handleAddReminder(e) { e.preventDefault(); if (!reminderText.trim() || !reminderDate) return; addReminder(id, { text: reminderText.trim(), dueAt: reminderDate }); setReminderText(''); setReminderDate('') }
  async function searchDpe() { if (!project.postalCode) return; setDpeLoading(true); setDpeResults(null); setShowDpe(true); try { const { results } = await searchDPE(project.address||'', project.postalCode||'', project.city||''); setDpeResults(results) } catch {} finally { setDpeLoading(false) } }
  function selectDpe(d) { updateProject(id, { dpe: { numeroDpe:d.numeroDpe,etiquetteDpe:d.etiquetteDpe,etiquetteGes:d.etiquetteGes,periodeConstruction:d.periodeConstruction,anneeConstruction:d.anneeConstruction,surface:d.surface,consoM2:d.consoM2,emissionGes:d.emissionGes,energieChauffage:d.energieChauffage,isolationEnveloppe:d.isolationEnveloppe,isolationMurs:d.isolationMurs,isolationMenuiseries:d.isolationMenuiseries,dateEtablissement:d.dateEtablissement,dateFinValidite:d.dateFinValidite,adresse:d.adresse,observatoireUrl:d.observatoireUrl } }); setShowDpe(false) }

  const I = ({ label, val, href }) => { if (!val) return null; return <div className="py-1.5"><p className="text-[10px] text-slate-400 mb-0.5">{label}</p>{href ? <a href={href} className="text-[13px] text-slate-700 hover:text-indigo-600">{val}</a> : <p className="text-[13px] text-slate-700">{val}</p>}</div> }

  return (
    <div className="animate-fade-in">
      {/* ═══ HEADER ═══ */}
      <div className="bg-[#1a1f2e] border-b border-[#2a3040]">
        <div className="max-w-[1400px] mx-auto px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/projets')} className="p-1.5 rounded hover:bg-white/5"><ArrowLeft className="w-4 h-4 text-gray-500" /></button>
            <h1 className="text-sm font-semibold text-white">{project.firstName} {project.lastName}</h1>
            {project.category && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${CAT[project.category]}`}>{project.categoryLabel}</span>}
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-400 font-medium">{st?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/projets/${id}/modifier`} className="px-3 py-1.5 text-[11px] text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Modifier</Link>
            <select value={project.status} onChange={(e) => updateProjectStatus(id, e.target.value)} className="px-3 py-1.5 text-[11px] bg-indigo-600 hover:bg-indigo-500 rounded-lg border-0 text-white cursor-pointer">
              {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ BLOCS INFOS ═══ */}
      <div className="bg-slate-100 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Client */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><User className="w-3 h-3 text-indigo-500" /> Informations Client</h3>
              <Link to={`/projets/${id}/modifier`} className="text-slate-400 hover:text-indigo-600"><Edit className="w-3 h-3" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-x-5">
              <I label="Nom" val={`${project.civilite?project.civilite+'. ':''}${project.firstName} ${project.lastName}`} />
              <I label="Occupation" val={project.occupation?.replace(/_/g,' ')} />
              <I label="Email" val={project.email} href={`mailto:${project.email}`} />
              <I label="Téléphone" val={project.phone} href={`tel:${project.phone}`} />
              <I label="RFR" val={project.rfr?`${Number(project.rfr).toLocaleString('fr-FR')} € — ${project.personnes} pers.`:null} />
              {project.category && <div className="py-1.5"><p className="text-[10px] text-slate-400 mb-1">Précarité</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${CAT[project.category]}`}>{project.categoryLabel}</span></div>}
            </div>
          </div>
          {/* Logement + DPE */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Home className="w-3 h-3 text-indigo-500" /> Informations Logement</h3>
              <div className="flex items-center gap-2">
                <button onClick={searchDpe} disabled={!project.postalCode||dpeLoading} className="text-[10px] text-indigo-500 hover:text-indigo-700 disabled:opacity-30 flex items-center gap-0.5">{dpeLoading?<Loader2 className="w-3 h-3 animate-spin"/>:<Thermometer className="w-3 h-3"/>} DPE</button>
                <Link to={`/projets/${id}/modifier`} className="text-slate-400 hover:text-indigo-600"><Edit className="w-3 h-3" /></Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-5">
              {(project.address||project.city) && <div className="col-span-2 py-1.5"><p className="text-[10px] text-slate-400 mb-0.5">Adresse</p><p className="text-[13px] text-slate-700">{[project.address,project.postalCode,project.city].filter(Boolean).join(', ')}</p></div>}
              <I label="Surface chauffée" val={project.surface?`${project.surface} m²`:null} />
              <I label="Surface habitable" val={project.surfaceHabitable?`${project.surfaceHabitable} m²`:null} />
              <I label="Type" val={project.typeLogement==='maison'?'Maison individuelle':project.typeLogement==='appartement'?'Appartement':null} />
              <I label="Âge" val={project.ageBatiment==='plus_15'?'Plus de 15 ans':project.ageBatiment==='plus_2'?'Plus de 2 ans':project.ageBatiment==='moins_2'?'Moins de 2 ans':null} />
              <I label="Chauffage" val={project.chauffageActuel} />
              {loc && <I label="Zone" val={`${loc.zoneClimatique} — ${loc.region}`} />}
            </div>
            {dpe && <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-black shrink-0" style={{backgroundColor:getDpeColor(dpe.etiquetteDpe)?.bg,color:getDpeColor(dpe.etiquetteDpe)?.text}}>{dpe.etiquetteDpe}</div>
              <div><p className="text-[12px] font-semibold text-slate-800">DPE {dpe.etiquetteDpe} — {dpe.consoM2} kWh/m²/an</p><p className="text-[10px] text-slate-500">{dpe.periodeConstruction} — {dpe.surface} m² — {dpe.energieChauffage}</p>{dpe.observatoireUrl&&<a href={dpe.observatoireUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline inline-flex items-center gap-0.5 mt-0.5"><ExternalLink className="w-2.5 h-2.5"/>ADEME</a>}</div>
            </div>}
            {showDpe&&dpeResults?.length>0&&<div className="mt-3 pt-3 border-t border-slate-100 space-y-1 max-h-32 overflow-y-auto">{dpeResults.map(d=><button key={d.numeroDpe} onClick={()=>selectDpe(d)} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 text-left text-[11px] text-slate-600"><div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[9px]" style={{backgroundColor:getDpeColor(d.etiquetteDpe)?.bg}}>{d.etiquetteDpe}</div>{d.consoM2} kWh/m² — {d.surface} m²</button>)}</div>}
          </div>
        </div>
      </div>

      {/* ═══ CONTENU ═══ */}
      <div className="bg-gray-50 min-h-[60vh]">
        <div className="max-w-[1400px] mx-auto px-5 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-5">
            {/* Scénarios */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500"/>Scénarios <span className="text-gray-400 font-normal text-xs">({(project.scenarios||[]).length})</span></h2>
                <button onClick={()=>setShowAddScenario(!showAddScenario)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/>Nouveau</button>
              </div>
              <div className="p-5 space-y-3">
                {showAddScenario&&<form onSubmit={handleAddScenario} className="flex gap-2 mb-2"><input type="text" value={newScenarioName} onChange={e=>setNewScenarioName(e.target.value)} placeholder="Nom (optionnel)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"/><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Créer</button></form>}
                {(project.scenarios||[]).length===0&&!showAddScenario&&<p className="text-sm text-gray-400 text-center py-4">Aucun scénario</p>}
                {(project.scenarios||[]).map(sc=>{const t=getScenarioTotals(sc);return(
                  <Link key={sc.id} to={`/projets/${id}/scenario/${sc.id}`} className="block rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow transition group overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3"><div><h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-400"/>{sc.name}</h3><p className="text-[11px] text-gray-400 ml-6">{sc.simulations.length} sim.{sc.ptz?' + PTZ':''} — {new Date(sc.createdAt).toLocaleDateString('fr-FR')}</p></div><ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500"/></div>
                    {sc.simulations.length>0&&<div className="px-4 pb-2 space-y-1">{sc.simulations.map(sim=>{const r=sim.results||{};return<div key={sim.id} className="flex items-center justify-between py-1 px-3 bg-gray-50 rounded text-[11px]"><div className="flex items-center gap-1.5">{sim.type&&<span className="font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[9px]">{sim.type}</span>}<span className="text-gray-600">{sim.title||'Simulation'}</span></div><div className="flex gap-2">{(r.ceeCommerciale||r.ceeFinal||r.ceeEuros||0)>0&&<span className="text-emerald-600 font-semibold">{(r.ceeCommerciale||r.ceeFinal||r.ceeEuros).toLocaleString('fr-FR')} €</span>}{(r.mprFinal||r.mprAmount||r.primeAmount||0)>0&&<span className="text-blue-600 font-semibold">{(r.mprFinal||r.mprAmount||r.primeAmount).toLocaleString('fr-FR')} €</span>}</div></div>})}</div>}
                    {t.totalCost>0&&<div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100"><div className="py-2 text-center"><p className="text-[9px] uppercase text-gray-400 font-semibold">Coût</p><p className="text-xs font-bold text-gray-700">{fmt(t.totalCost)} €</p></div><div className="py-2 text-center"><p className="text-[9px] uppercase text-emerald-500 font-semibold">CEE</p><p className="text-xs font-bold text-emerald-600">{fmt(t.totalCee)} €</p></div><div className="py-2 text-center"><p className="text-[9px] uppercase text-blue-500 font-semibold">MPR</p><p className="text-xs font-bold text-blue-600">{fmt(t.totalMpr)} €</p></div><div className="py-2 text-center bg-orange-50/50"><p className="text-[9px] uppercase text-orange-500 font-semibold">RAC</p><p className="text-xs font-bold text-orange-600">{fmt(t.resteACharge)} €</p></div></div>}
                  </Link>)})}
              </div>
            </section>

            {/* Simulations */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Calculator className="w-4 h-4 text-gray-400"/>Simulations <span className="text-gray-400 font-normal text-xs">({linkedSims.length})</span></h2></div>
              <div className="p-5">
                <button onClick={()=>setShowNewSim(!showNewSim)} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-sm hover:border-indigo-300 hover:text-indigo-600 transition mb-3"><Plus className="w-4 h-4 inline mr-1"/>Nouvelle simulation</button>
                {showNewSim&&<div className="mb-3 p-4 bg-gray-50 rounded-xl space-y-2">{CATALOG.map(cat=><div key={cat.category}><p className="text-[10px] text-gray-500 font-semibold mb-1">{cat.emoji} {cat.category}</p><div className="grid grid-cols-2 gap-1">{cat.items.filter(i=>i.active).map(item=><Link key={item.code} to={`${item.route}?clientId=${id}`} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 text-xs"><span className="text-gray-700">{item.title}</span><ChevronRight className="w-3 h-3 text-gray-300"/></Link>)}</div></div>)}</div>}
                {linkedSims.length===0&&!showNewSim&&<p className="text-xs text-gray-400 text-center">Aucune</p>}
              </div>
            </section>

            {/* Documents */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500"/>Documents <span className="text-gray-400 font-normal text-xs">({docRequests.length})</span></h2>
                <button onClick={()=>setShowDocForm(!showDocForm)} disabled={!beneficiary} className={`text-[11px] px-2.5 py-1 rounded-lg ${beneficiary?'bg-indigo-600 hover:bg-indigo-700 text-white':'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><Plus className="w-3 h-3 inline mr-0.5"/>Demander</button>
              </div>
              <div className="p-5">
                {showDocForm&&<div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200"><div className="grid grid-cols-2 gap-3 mb-3"><div><label className="block text-[10px] font-semibold text-gray-500 mb-1">Type</label><select value={docType} onChange={e=>setDocType(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs">{DOC_TYPES.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></div><div><label className="block text-[10px] font-semibold text-gray-500 mb-1">Message</label><input type="text" value={docMessage} onChange={e=>setDocMessage(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs"/></div></div><div className="flex justify-end gap-2"><button onClick={()=>setShowDocForm(false)} className="px-2.5 py-1 text-[11px] text-gray-500">Annuler</button><button onClick={async()=>{await createDocRequest({projectId:id,beneficiaryUid:beneficiary?.uid||'',docType,label:DOC_TYPES.find(d=>d.value===docType)?.label||docType,message:docMessage});setShowDocForm(false);setDocType('autre');setDocMessage('')}} className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] rounded-lg"><Send className="w-3 h-3 inline mr-0.5"/>Envoyer</button></div></div>}
                {docRequests.length===0?<p className="text-xs text-gray-400 text-center py-3">Aucun document</p>:<div className="space-y-2">{docRequests.map(req=>{const sm=DOC_REQUEST_STATUSES.find(s=>s.value===req.status)||DOC_REQUEST_STATUSES[0];return<div key={req.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg"><div><div className="flex items-center gap-1.5"><span className="text-xs font-medium text-gray-700">{req.label}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${sm.color}`}>{sm.label}</span></div>{req.message&&<p className="text-[10px] text-gray-400 mt-0.5">{req.message}</p>}</div>{req.status==='en_attente'&&<button onClick={()=>updateRequestStatus(req.id,'fourni')} className="p-1 rounded hover:bg-emerald-50"><Check className="w-3.5 h-3.5 text-emerald-500"/></button>}</div>})}</div>}
              </div>
            </section>
          </div>

          {/* SIDEBAR DROITE */}
          <div className="space-y-5">
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4"><Zap className="w-3.5 h-3.5 text-amber-500"/>Suivi & Actions</h2>
              {beneficiary?<div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-700 flex items-center gap-1.5 mb-4"><CheckCircle className="w-3.5 h-3.5"/>{beneficiary.name||beneficiary.email}</div>
              :projectSharedScenarios.length>0?<div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-600 mb-4">En attente d'inscription</div>
              :<div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-400 mb-4">Partagez un scénario</div>}
              <div className="space-y-0.5">{PROJECT_STATUSES.map(s=>{const act=project.status===s.value;const idx=PROJECT_STATUSES.findIndex(x=>x.value===project.status);const si=PROJECT_STATUSES.findIndex(x=>x.value===s.value);const past=si<idx;return<button key={s.value} onClick={()=>updateProjectStatus(id,s.value)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-left transition ${act?'bg-indigo-50 text-indigo-700 font-semibold':past?'text-emerald-600':'text-gray-400 hover:bg-gray-50'}`}>{past?<CheckCircle className="w-3 h-3 text-emerald-400 shrink-0"/>:act?<div className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0 ring-2 ring-offset-1 ring-indigo-200`}/>:<div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0"/>}{s.label}</button>})}</div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3"><MessageSquare className="w-3.5 h-3.5"/>Notes ({(project.notes||[]).length})</h2>
              <div className="flex gap-1.5 mb-3"><input type="text" value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddNote()} placeholder="Note..." className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"/><button onClick={handleAddNote} disabled={!noteText.trim()} className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-30"><Send className="w-3 h-3"/></button></div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">{(project.notes||[]).length===0&&<p className="text-[11px] text-gray-400 text-center py-2">Aucune</p>}{(project.notes||[]).map(n=><div key={n.id} className="p-2 bg-gray-50 rounded-lg group"><div className="flex justify-between"><p className="text-[12px] text-gray-700">{n.text}</p><button onClick={()=>deleteNote(id,n.id)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0 ml-2"><Trash2 className="w-3 h-3"/></button></div><p className="text-[9px] text-gray-400 mt-0.5">{new Date(n.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p></div>)}</div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3"><Bell className="w-3.5 h-3.5 text-indigo-500"/>Rappels</h2>
              <form onSubmit={handleAddReminder} className="space-y-1.5 mb-3"><input type="text" value={reminderText} onChange={e=>setReminderText(e.target.value)} placeholder="Rappel..." className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"/><div className="flex gap-1.5"><input type="datetime-local" value={reminderDate} onChange={e=>setReminderDate(e.target.value)} className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-[10px]"/><button type="submit" disabled={!reminderText.trim()||!reminderDate} className="px-2 py-1 bg-indigo-600 text-white rounded-lg disabled:opacity-30"><Plus className="w-3 h-3"/></button></div></form>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">{(project.reminders||[]).length===0&&<p className="text-[11px] text-gray-400 text-center py-2">Aucun</p>}{(project.reminders||[]).map(r=>{const od=!r.done&&r.dueAt&&new Date(r.dueAt)<new Date();return<div key={r.id} className={`flex items-start gap-1.5 p-2 rounded-lg text-[11px] group ${od?'bg-red-50':'bg-gray-50'}`}><button onClick={()=>toggleReminder(id,r.id)} className={`mt-0.5 shrink-0 ${r.done?'text-emerald-500':'text-gray-300 hover:text-indigo-500'}`}>{r.done?<CheckCircle className="w-3.5 h-3.5"/>:<Check className="w-3.5 h-3.5"/>}</button><div className="flex-1 min-w-0"><p className={`text-gray-700 ${r.done?'line-through opacity-40':''}`}>{r.text}</p><p className={`text-[9px] mt-0.5 ${od?'text-red-500 font-bold':'text-gray-400'}`}>{new Date(r.dueAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p></div><button onClick={()=>deleteReminder(id,r.id)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0"><Trash2 className="w-3 h-3"/></button></div>})}</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
