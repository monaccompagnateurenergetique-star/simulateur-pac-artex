import { useState } from 'react'
import {
  Search, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronDown,
  Phone, Mail, Globe, Building2, Shield, Bookmark, BookmarkCheck,
  BarChart3, Award, FileText, ExternalLink, X, Filter,
  LayoutGrid, List, Compass, Plus, Check
} from 'lucide-react'
import { searchRGE, getRGEStats, getMetaDomaineColor, getStatusInfo, PROSPECT_STATUSES, PRIORITY_LEVELS } from '../utils/rgeApi'
import { useRgeProspection } from '../hooks/useRgeProspection'
import ProspectKanban from '../components/prospection/ProspectKanban'
import ProspectCard from '../components/prospection/ProspectCard'
import ProspectDetail from '../components/prospection/ProspectDetail'
import PipelineKPIs from '../components/prospection/PipelineKPIs'
import FollowUpBadge from '../components/prospection/FollowUpBadge'

const TABS = [
  { id: 'pipeline', label: 'Pipeline', icon: LayoutGrid },
  { id: 'liste', label: 'Liste', icon: List },
  { id: 'recherche', label: 'Recherche ADEME', icon: Compass },
]

const SORT_OPTIONS = [
  { value: 'nom_entreprise', label: 'Nom A→Z' },
  { value: '-nom_entreprise', label: 'Nom Z→A' },
  { value: '-lien_date_debut', label: 'Qualification récente' },
  { value: 'code_postal', label: 'Code postal' },
]

const DOMAINE_OPTIONS = [
  'Pompe à chaleur : chauffage',
  'Chauffe-Eau Thermodynamique',
  'Chauffage et/ou eau chaude solaire',
  'Panneaux solaires photovoltaïques',
  'Chaudière bois',
  'Poêle ou insert bois',
  'Chaudière condensation ou micro-cogénération gaz ou fioul',
  'Isolation des combles perdus',
  'Isolation par l\'intérieur des murs ou rampants de toitures  ou plafonds',
  'Isolation des murs par l\'extérieur',
  'Isolation des planchers bas',
  'Isolation des toitures terrasses ou des toitures par l\'extérieur',
  'Fenêtres, volets, portes donnant sur l\'extérieur',
  'Fenêtres de toit',
  'Ventilation mécanique',
  'Radiateurs électriques, dont régulation.',
  'Audit énergétique Maison individuelle',
  'Audit énergétique Logement collectif',
  'Etude thermique reglementaire',
  'Architecte',
]

const ORGANISME_OPTIONS = [
  { value: 'qualibat', label: 'Qualibat' },
  { value: 'qualitenr', label: 'Qualit\'EnR' },
  { value: 'qualifelec', label: 'Qualifelec' },
  { value: 'certibat', label: 'Certibat' },
  { value: 'opqibi', label: 'OPQIBI' },
  { value: 'cerqual', label: 'Cerqual' },
  { value: 'afnor', label: 'AFNOR' },
  { value: 'cnoa', label: 'CNOA' },
  { value: 'opqtecc', label: 'OPQTECC' },
  { value: 'lne', label: 'LNE' },
]

const LIST_FILTERS = [
  { value: '', label: 'Tous les statuts' },
  ...PROSPECT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
]

const LIST_PRIORITY_FILTERS = [
  { value: '', label: 'Toutes priorités' },
  ...PRIORITY_LEVELS.map((p) => ({ value: p.value, label: p.label })),
]

export default function RgeProspectionPage() {
  const {
    prospects,
    getAllProspects, getProspectStatus, getStatusCounts, getOverdueProspects,
    addProspect, setProspectStatus, setPriority,
    setFollowUp, clearFollowUp,
    addActivity, useActivities, deleteActivity,
    savedSearches, saveSearch, deleteSavedSearch,
  } = useRgeProspection()

  // Tabs
  const [activeTab, setActiveTab] = useState('pipeline')

  // Detail panel
  const [selectedProspect, setSelectedProspect] = useState(null)
  const { activities, loading: activitiesLoading } = useActivities(selectedProspect?.siret)

  // Search (ADEME tab)
  const [zone, setZone] = useState('')
  const [commune, setCommune] = useState('')
  const [query, setQuery] = useState('')
  const [domaineFilter, setDomaineFilter] = useState('')
  const [organismeFilter, setOrganismeFilter] = useState('')
  const [particulierOnly, setParticulierOnly] = useState(false)
  const [sort, setSort] = useState('nom_entreprise')
  const [results, setResults] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [expandedCard, setExpandedCard] = useState(null)
  const [saveName, setSaveName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)

  // List tab filters
  const [listStatusFilter, setListStatusFilter] = useState('')
  const [listPriorityFilter, setListPriorityFilter] = useState('')
  const [listSpecialFilter, setListSpecialFilter] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [listSort, setListSort] = useState('updatedAt')

  // ─── Helpers ───

  function parseZone(val) {
    const v = val.trim()
    if (/^\d{5}$/.test(v)) return { postalCode: v, departement: '' }
    if (/^\d{2,3}$/.test(v) || /^[12][AB]$/i.test(v)) return { postalCode: '', departement: v }
    return { postalCode: '', departement: '' }
  }

  const hasSearchCriteria = zone.trim() || query.trim() || commune.trim()

  // ─── Search handlers ───

  async function doSearch(newPage = 1, newSort = sort, overrides = {}) {
    const z = overrides.zone ?? zone
    const c = overrides.commune ?? commune
    const q = overrides.query ?? query
    const dom = overrides.domaine ?? domaineFilter
    const org = overrides.organisme ?? organismeFilter
    const part = overrides.particulier ?? particulierOnly

    const { postalCode, departement } = parseZone(z)
    if (!postalCode && !departement && !q.trim() && !c.trim()) return

    setLoading(true)
    setError(null)
    setPage(newPage)

    try {
      const data = await searchRGE({
        postalCode, departement,
        commune: c.trim() || undefined,
        domaine: dom || undefined,
        organisme: org || undefined,
        particulier: part || undefined,
        query: q.trim() || undefined,
        sort: newSort,
        page: newPage,
        size: 50,
      })
      setResults(data)

      if (newPage === 1 && (postalCode || departement)) {
        try {
          const statsData = await getRGEStats(postalCode || departement)
          setStats(statsData)
        } catch { /* stats optionnelles */ }
      }
    } catch (err) {
      setError(err.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    doSearch(1, sort)
  }

  function handleSort(newSort) {
    setSort(newSort)
    doSearch(1, newSort)
  }

  function handleSavedSearch(search) {
    const f = search.filters || {}
    const z = f.zone || f.postalCode || f.departement || ''
    setZone(z)
    setCommune(f.commune || '')
    setQuery(f.query || '')
    setDomaineFilter(f.domaine || '')
    setOrganismeFilter(f.organisme || '')
    setParticulierOnly(f.particulier ?? false)
    setActiveTab('recherche')
    setTimeout(() => doSearch(1, sort, {
      zone: z, commune: f.commune || '', query: f.query || '',
      domaine: f.domaine || '', organisme: f.organisme || '', particulier: f.particulier ?? false,
    }), 50)
  }

  function handleSaveSearch() {
    if (!saveName.trim()) return
    saveSearch(saveName.trim(), {
      zone, commune, query,
      domaine: domaineFilter, organisme: organismeFilter, particulier: particulierOnly,
    }, results?.total || 0)
    setSaveName('')
    setShowSaveModal(false)
  }

  function handleResetFilters() {
    setZone('')
    setCommune('')
    setQuery('')
    setDomaineFilter('')
    setOrganismeFilter('')
    setParticulierOnly(false)
  }

  async function handleAddToPipeline(rge) {
    await addProspect(rge, { zone, domaine: domaineFilter })
  }

  // ─── Detail panel handlers ───

  function handleProspectClick(prospect) {
    setSelectedProspect(prospect)
  }

  function handleDetailClose() {
    setSelectedProspect(null)
  }

  // ─── Computed data ───

  const allProspects = getAllProspects()
  const statusCounts = getStatusCounts()
  const overdueProspects = getOverdueProspects()
  const totalPages = results ? Math.ceil(results.total / results.size) : 0

  // List tab: filtered & sorted prospects
  const filteredListProspects = allProspects.filter((p) => {
    if (listStatusFilter && p.status !== listStatusFilter) return false
    if (listPriorityFilter && p.priority !== listPriorityFilter) return false
    if (listSpecialFilter === 'overdue') {
      if (!p.nextFollowUp || p.nextFollowUp >= new Date().toISOString() || p.status === 'gagne' || p.status === 'perdu') return false
    }
    if (listSpecialFilter === 'dormant') {
      const daysSince = p.lastActivityAt ? (Date.now() - new Date(p.lastActivityAt).getTime()) / 86400000 : 999
      if (daysSince <= 14) return false
    }
    if (listSearch) {
      const s = listSearch.toLowerCase()
      if (!p.nom?.toLowerCase().includes(s) && !p.commune?.toLowerCase().includes(s) && !p.codePostal?.includes(s)) return false
    }
    return true
  }).sort((a, b) => {
    if (listSort === 'nom') return (a.nom || '').localeCompare(b.nom || '')
    if (listSort === 'priority') {
      const order = { haute: 0, moyenne: 1, basse: 2 }
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2)
    }
    if (listSort === 'followUp') return (a.nextFollowUp || 'z').localeCompare(b.nextFollowUp || 'z')
    // default: updatedAt desc
    return (b.updatedAt || '').localeCompare(a.updatedAt || '')
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Prospection RGE
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pipeline de prospection des entreprises certifiées RGE
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ═══════════ TAB: PIPELINE ═══════════ */}
      {activeTab === 'pipeline' && (
        <div>
          <PipelineKPIs
            statusCounts={statusCounts}
            overdueCount={overdueProspects.length}
            totalProspects={allProspects.filter((p) => p.status !== 'gagne' && p.status !== 'perdu').length}
          />

          {allProspects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun prospect dans le pipeline</p>
              <p className="text-sm text-gray-400 mt-1">
                Utilisez l'onglet "Recherche ADEME" pour trouver et ajouter des entreprises
              </p>
              <button
                onClick={() => setActiveTab('recherche')}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                <Search className="w-4 h-4 inline mr-1.5" />
                Rechercher des entreprises
              </button>
            </div>
          ) : (
            <ProspectKanban
              prospects={allProspects}
              onProspectClick={handleProspectClick}
            />
          )}
        </div>
      )}

      {/* ═══════════ TAB: LISTE ═══════════ */}
      {activeTab === 'liste' && (
        <div>
          {/* Filtres liste */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Recherche</label>
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Nom, ville, code postal..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="w-40">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Statut</label>
                <select
                  value={listStatusFilter}
                  onChange={(e) => setListStatusFilter(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"
                >
                  {LIST_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-36">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Priorité</label>
                <select
                  value={listPriorityFilter}
                  onChange={(e) => setListPriorityFilter(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"
                >
                  {LIST_PRIORITY_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setListSpecialFilter(listSpecialFilter === 'overdue' ? '' : 'overdue')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    listSpecialFilter === 'overdue' ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  En retard
                </button>
                <button
                  onClick={() => setListSpecialFilter(listSpecialFilter === 'dormant' ? '' : 'dormant')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    listSpecialFilter === 'dormant' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Dormant
                </button>
              </div>
              <div className="w-36">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Tri</label>
                <select
                  value={listSort}
                  onChange={(e) => setListSort(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"
                >
                  <option value="updatedAt">Dernière MAJ</option>
                  <option value="nom">Nom A→Z</option>
                  <option value="priority">Priorité</option>
                  <option value="followUp">Prochaine relance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Résultats liste */}
          <p className="text-xs text-gray-500 mb-3">
            <strong>{filteredListProspects.length}</strong> prospect{filteredListProspects.length > 1 ? 's' : ''}
          </p>

          {filteredListProspects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun prospect trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Modifiez vos filtres ou ajoutez des prospects via la recherche</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Entreprise</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Statut</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Priorité</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Domaines</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Relance</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Activité</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListProspects.map((p) => {
                    const statusInfo = getStatusInfo(p.status)
                    const daysSince = p.lastActivityAt
                      ? Math.floor((Date.now() - new Date(p.lastActivityAt).getTime()) / 86400000)
                      : null

                    return (
                      <tr
                        key={p.siret}
                        onClick={() => handleProspectClick(p)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                        style={{ borderLeftWidth: '3px', borderLeftColor: statusInfo.hex }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 text-sm">{p.nom}</p>
                          <p className="text-[11px] text-gray-400">{p.codePostal} {p.commune}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={p.priority || 'basse'}
                            onChange={(e) => { e.stopPropagation(); setPriority(p.siret, e.target.value) }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] px-1.5 py-1 rounded border border-gray-200 bg-white font-semibold outline-none"
                          >
                            {PRIORITY_LEVELS.map((pr) => (
                              <option key={pr.value} value={pr.value}>{pr.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(p.domaines || []).slice(0, 2).map((d) => (
                              <span key={d} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                {d.length > 20 ? d.slice(0, 18) + '...' : d}
                              </span>
                            ))}
                            {(p.domaines || []).length > 2 && (
                              <span className="text-[9px] text-gray-400">+{p.domaines.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <FollowUpBadge date={p.nextFollowUp} type={p.followUpType} compact />
                        </td>
                        <td className="px-3 py-3">
                          {daysSince !== null ? (
                            <span className={`text-[10px] font-medium ${daysSince > 14 ? 'text-red-500' : daysSince > 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                              {daysSince === 0 ? "Aujourd'hui" : `il y a ${daysSince}j`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB: RECHERCHE ADEME ═══════════ */}
      {activeTab === 'recherche' && (
        <div>
          {/* Recherches sauvegardees */}
          {savedSearches.length > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <Bookmark className="w-4 h-4 text-gray-400 shrink-0" />
              {savedSearches.map((s) => (
                <div key={s.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleSavedSearch(s)}
                    className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition"
                  >
                    {s.name} ({s.resultCount})
                  </button>
                  <button onClick={() => deleteSavedSearch(s.id)} className="text-gray-300 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Département ou code postal</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ex: 57 ou 57000"
                  maxLength={5}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ville</label>
                <input
                  type="text"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Ex: METZ"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Recherche libre</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, adresse..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-end gap-3 mt-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Domaine</label>
                <select
                  value={domaineFilter}
                  onChange={(e) => setDomaineFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">Tous les domaines</option>
                  {DOMAINE_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Organisme</label>
                <select
                  value={organismeFilter}
                  onChange={(e) => setOrganismeFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">Tous</option>
                  {ORGANISME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer pb-1">
                <input
                  type="checkbox"
                  checked={particulierOnly}
                  onChange={(e) => setParticulierOnly(e.target.checked)}
                  className="accent-emerald-600 w-4 h-4"
                />
                <span className="font-medium text-gray-600 text-xs whitespace-nowrap">Particuliers</span>
              </label>
              <button
                type="submit"
                disabled={loading || !hasSearchCriteria}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Rechercher
              </button>
              {(zone || commune || query || domaineFilter || organismeFilter || particulierOnly) && (
                <button type="button" onClick={handleResetFilters} className="text-xs text-gray-400 hover:text-red-500 pb-1">
                  Effacer
                </button>
              )}
            </div>
          </form>

          {/* Save search modal */}
          {showSaveModal && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom de la recherche</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: PAC Moselle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
                  autoFocus
                />
              </div>
              <button onClick={handleSaveSearch} disabled={!saveName.trim()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40">
                Sauvegarder
              </button>
              <button onClick={() => setShowSaveModal(false)} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                Annuler
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">{error}</div>
          )}

          {/* Stats distribution */}
          {stats && stats.distribution.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                {stats.total} qualifications — {zone}
              </h2>
              <div className="flex flex-wrap gap-2">
                {stats.distribution.slice(0, 15).map((d) => (
                  <button
                    key={d.domaine}
                    onClick={() => { setDomaineFilter(d.domaine); doSearch(1, sort, { domaine: d.domaine }) }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      domaineFilter === d.domaine
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {d.domaine} ({d.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar résultats */}
          {results && (
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-gray-600">
                <strong>{results.totalGrouped}</strong> entreprise{results.totalGrouped > 1 ? 's' : ''}
                <span className="text-gray-400 ml-1">({results.total} qualif.)</span>
                {domaineFilter && <span className="text-emerald-600 ml-1">— {domaineFilter}</span>}
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => handleSort(e.target.value)}
                  className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" /> Sauvegarder
                </button>
              </div>
            </div>
          )}

          {/* Résultats ADEME */}
          {results?.results?.length > 0 && (
            <div className="space-y-2">
              {results.results.map((rge) => {
                const existingProspect = getProspectStatus(rge.siret)
                const allExpired = rge.qualifications.every((q) => q.dateFin && new Date(q.dateFin) < new Date())
                const isExpanded = expandedCard === rge.siret
                const domainesUniques = [...new Set(rge.qualifications.map((q) => q.domaine).filter(Boolean))]

                return (
                  <div
                    key={rge.siret}
                    className={`bg-white rounded-xl border transition hover:shadow-md ${
                      allExpired ? 'opacity-40 border-gray-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Action: ajouter au pipeline */}
                        <div className="shrink-0">
                          {existingProspect ? (
                            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <Check className="w-3 h-3" /> Suivi
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddToPipeline(rge)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                            >
                              <Plus className="w-3 h-3" /> Pipeline
                            </button>
                          )}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-800 text-sm">{rge.nom}</h3>
                            {rge.siteInternet ? (
                              <a
                                href={rge.siteInternet.startsWith('http') ? rge.siteInternet : `https://${rge.siteInternet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-0.5 hover:bg-emerald-100 transition"
                              >
                                <Globe className="w-2.5 h-2.5" /> Site web
                              </a>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 font-medium">
                                Pas de site
                              </span>
                            )}
                            {allExpired && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold uppercase">Expiré</span>
                            )}
                            {existingProspect && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusInfo(existingProspect.status).color}`}>
                                {getStatusInfo(existingProspect.status).label}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {rge.adresse}, {rge.codePostal} {rge.commune}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-400">{rge.siret}</span>
                          </div>

                          <div className="flex flex-wrap gap-4 mt-1.5 text-xs">
                            {rge.telephone && (
                              <a href={`tel:${rge.telephone}`} className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 font-medium">
                                <Phone className="w-3 h-3" /> {rge.telephone}
                              </a>
                            )}
                            {rge.email && (
                              <a href={`mailto:${rge.email}`} className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 font-medium">
                                <Mail className="w-3 h-3" /> {rge.email}
                              </a>
                            )}
                            {rge.siteInternet && (
                              <a
                                href={rge.siteInternet.startsWith('http') ? rge.siteInternet : `https://${rge.siteInternet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 font-medium"
                              >
                                <Globe className="w-3 h-3" /> {rge.siteInternet.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </a>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {domainesUniques.map((d) => {
                              const meta = rge.qualifications.find((q) => q.domaine === d)?.metaDomaine
                              return (
                                <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getMetaDomaineColor(meta)}`}>
                                  {d}
                                </span>
                              )
                            })}
                            <span className="text-[10px] text-gray-400 px-1 py-0.5">
                              {rge.qualifications.length} qualif.
                            </span>
                          </div>
                        </div>

                        {/* Expand */}
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : rge.siret)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
                          title="Voir les qualifications"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Qualifications détaillées */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                        <div className="p-4 space-y-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Qualifications ({rge.qualifications.length})
                          </p>
                          {rge.qualifications.map((q, i) => {
                            const isQExpired = q.dateFin && new Date(q.dateFin) < new Date()
                            return (
                              <div
                                key={i}
                                className={`flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white border border-gray-100 ${isQExpired ? 'opacity-40' : ''}`}
                              >
                                {q.domaine && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getMetaDomaineColor(q.metaDomaine)}`}>
                                    {q.domaine}
                                  </span>
                                )}
                                {q.organisme && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                                    {q.organisme}
                                  </span>
                                )}
                                {q.certificat && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold flex items-center gap-0.5">
                                    <Award className="w-2.5 h-2.5" /> {q.certificat}
                                  </span>
                                )}
                                {q.nom && (
                                  q.url ? (
                                    <a
                                      href={q.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold flex items-center gap-0.5 hover:bg-sky-100 transition"
                                    >
                                      <FileText className="w-2.5 h-2.5" /> {q.nom} <ExternalLink className="w-2 h-2 ml-0.5" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold flex items-center gap-0.5">
                                      <FileText className="w-2.5 h-2.5" /> {q.nom}
                                    </span>
                                  )
                                )}
                                <span className="text-[10px] text-gray-400 ml-auto">
                                  {q.dateDebut && new Date(q.dateDebut).toLocaleDateString('fr-FR')}
                                  {q.dateFin && ` → ${new Date(q.dateFin).toLocaleDateString('fr-FR')}`}
                                  {isQExpired && <span className="text-red-500 ml-1">(expiré)</span>}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty states */}
          {results && results.results.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucune entreprise RGE trouvée</p>
              <p className="text-sm text-gray-400 mt-1">Essayez un autre code postal ou élargissez vos filtres</p>
            </div>
          )}

          {!results && !loading && !error && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Recherchez des entreprises RGE</p>
              <p className="text-sm text-gray-400 mt-1">Saisissez un département ou code postal pour commencer</p>
            </div>
          )}

          {/* Pagination */}
          {results && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => doSearch(page - 1, sort)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
              <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
              <button
                onClick={() => doSearch(page + 1, sort)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ DETAIL PANEL ═══════════ */}
      {selectedProspect && (
        <ProspectDetail
          prospect={selectedProspect}
          activities={activities}
          activitiesLoading={activitiesLoading}
          onClose={handleDetailClose}
          onStatusChange={(siret, status, lossReason) => setProspectStatus(siret, status, lossReason)}
          onPriorityChange={(siret, priority) => setPriority(siret, priority)}
          onFollowUpChange={(siret, date, type) => setFollowUp(siret, date, type)}
          onClearFollowUp={(siret) => clearFollowUp(siret)}
          onAddActivity={(siret, data) => addActivity(siret, data)}
          onDeleteActivity={(siret, id) => deleteActivity(siret, id)}
        />
      )}
    </div>
  )
}
