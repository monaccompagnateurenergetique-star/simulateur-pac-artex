import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Loader2, Thermometer, MapPin, Filter, ArrowUpDown,
  ChevronLeft, ChevronRight, ExternalLink, UserPlus, BarChart3,
  Home, Building2, Flame, Droplets, Wind, ChevronDown, ChevronUp
} from 'lucide-react'
import { searchDPE, prospectDPE, getDPEStats, getDpeColor, DPE_COLORS } from '../utils/dpeApi'

const SORT_OPTIONS = [
  { value: '-date_etablissement_dpe', label: 'Plus recent' },
  { value: 'date_etablissement_dpe', label: 'Plus ancien' },
  { value: 'etiquette_dpe', label: 'DPE A → G' },
  { value: '-etiquette_dpe', label: 'DPE G → A' },
  { value: '-conso_5_usages_par_m2_ep', label: 'Conso haute → basse' },
  { value: 'conso_5_usages_par_m2_ep', label: 'Conso basse → haute' },
]

const ETIQUETTE_FILTERS = [
  { value: '', label: 'Tous', seuil: '' },
  { value: 'A', label: 'A', seuil: '≤ 70' },
  { value: 'B', label: 'B', seuil: '71–110' },
  { value: 'C', label: 'C', seuil: '111–180' },
  { value: 'D', label: 'D', seuil: '181–250' },
  { value: 'E', label: 'E', seuil: '251–330' },
  { value: 'F', label: 'F', seuil: '331–420' },
  { value: 'G', label: 'G', seuil: '> 420' },
]

const TYPE_FILTERS = [
  { value: '', label: 'Tous types' },
  { value: 'maison', label: 'Maison' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'immeuble', label: 'Immeuble' },
]

const CHAUFFAGE_INSTALL_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'collectif', label: 'Collectif' },
  { value: 'individuel', label: 'Individuel' },
]

const ENERGIE_CHAUFFAGE_FILTERS = [
  { value: '', label: 'Toutes energies' },
  { value: 'Gaz naturel', label: 'Gaz naturel' },
  { value: 'Fioul domestique', label: 'Fioul' },
  { value: "Electricite d'origine renouvelable utilisee dans le batiment", label: 'Electricite renouv.' },
  { value: 'Electricite', label: 'Electricite' },
  { value: 'Bois – Buches', label: 'Bois buches' },
  { value: 'Bois – Granules (pellets) ou briquettes', label: 'Granules' },
  { value: 'Bois – Plaquettes forestieres', label: 'Plaquettes' },
  { value: 'Reseau de chaleur', label: 'Reseau de chaleur' },
  { value: 'GPL', label: 'GPL' },
  { value: 'Propane', label: 'Propane' },
  { value: 'Charbon', label: 'Charbon' },
]

const ECS_INSTALL_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'collectif', label: 'Collectif' },
  { value: 'individuel', label: 'Individuel' },
]

export default function DpeProspectionPage() {
  const [mode, setMode] = useState('prospect')
  const [query, setQuery] = useState('')

  // Filtres
  const [etiquetteFilter, setEtiquetteFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [installChauffageFilter, setInstallChauffageFilter] = useState('')
  const [energieChauffageFilter, setEnergieChauffageFilter] = useState('')
  const [installEcsFilter, setInstallEcsFilter] = useState('')
  const [sort, setSort] = useState('-date_etablissement_dpe')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Results
  const [results, setResults] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [geocoding, setGeocoding] = useState(null)

  const activeFilterCount = [installChauffageFilter, energieChauffageFilter, installEcsFilter].filter(Boolean).length

  // ─── URL params auto-fill (from simulator CTA) ───
  const [searchParams] = useSearchParams()
  const autoSearchDone = useRef(false)

  useEffect(() => {
    if (autoSearchDone.current) return
    const cp = searchParams.get('cp')
    if (!cp) return
    autoSearchDone.current = true

    setQuery(cp)
    setMode('prospect')
    const chauffage = searchParams.get('chauffage') || ''
    const energie = searchParams.get('energie') || ''
    const type = searchParams.get('type') || ''
    const ecs = searchParams.get('ecs') || ''
    if (chauffage) { setInstallChauffageFilter(chauffage); setShowAdvanced(true) }
    if (energie) { setEnergieChauffageFilter(energie); setShowAdvanced(true) }
    if (type) setTypeFilter(type)
    if (ecs) { setInstallEcsFilter(ecs); setShowAdvanced(true) }

    // Trigger search after state updates
    setTimeout(async () => {
      try {
        setLoading(true)
        const params = {
          postalCode: cp,
          typeBatiment: type || '',
          installationChauffage: chauffage || '',
          energieChauffage: energie || '',
          installationEcs: ecs || '',
          sort: '-date_etablissement_dpe',
          page: 1,
          size: 50,
        }
        const [data, statsData] = await Promise.all([
          prospectDPE(params),
          getDPEStats(cp).catch(() => null),
        ])
        setResults({ items: data.results, total: data.total })
        if (statsData) setStats(statsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 50)
  }, [searchParams])

  const handleSearch = useCallback(async (newPage = 1, newSort = sort) => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setPage(newPage)

    try {
      if (mode === 'address') {
        const data = await searchDPE(query, '', '')
        setResults({ items: data.results, total: data.results.length })
        setGeocoding(data.geocoding)
        setStats(null)
      } else {
        const isPostal = /^\d{5}$/.test(query.trim())
        const params = {
          postalCode: isPostal ? query.trim() : '',
          city: isPostal ? '' : query.trim(),
          etiquette: etiquetteFilter,
          typeBatiment: typeFilter,
          installationChauffage: installChauffageFilter,
          energieChauffage: energieChauffageFilter,
          installationEcs: installEcsFilter,
          sort: newSort,
          page: newPage,
          size: 50,
        }
        const [data, statsData] = await Promise.all([
          prospectDPE(params),
          newPage === 1 && isPostal ? getDPEStats(query.trim()).catch(() => null) : Promise.resolve(stats),
        ])
        setResults({ items: data.results, total: data.total })
        if (statsData && statsData !== stats) setStats(statsData)
        setGeocoding(null)
      }
    } catch (err) {
      setError(err.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [query, mode, etiquetteFilter, typeFilter, installChauffageFilter, energieChauffageFilter, installEcsFilter, sort, stats])

  function handleSubmit(e) {
    e.preventDefault()
    handleSearch(1)
  }

  function handleSortChange(newSort) {
    setSort(newSort)
    if (results) handleSearch(1, newSort)
  }

  function handlePageChange(newPage) {
    handleSearch(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetAdvancedFilters() {
    setInstallChauffageFilter('')
    setEnergieChauffageFilter('')
    setInstallEcsFilter('')
  }

  const totalPages = results ? Math.ceil(results.total / 50) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl mb-3">
          <Thermometer className="w-7 h-7 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Prospection DPE</h1>
        <p className="text-gray-500 text-sm mt-1">
          Identifiez les immeubles et logements par type de chauffage, energie, DPE
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => { setMode('address'); setResults(null); setStats(null) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'address'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Recherche par adresse
        </button>
        <button
          onClick={() => { setMode('prospect'); setResults(null); setStats(null) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'prospect'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Explorer une ville
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'address'
                ? 'Entrez une adresse complete (ex: 16 rue du bourg 57510 Ernesviller)'
                : 'Entrez un code postal (ex: 57510) ou une ville (ex: Metz)'
              }
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </div>
      </form>

      {/* Filters (prospect mode only) */}
      {mode === 'prospect' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 space-y-3">
          {/* Ligne 1 : DPE + Type + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">Filtres :</span>
            </div>

            {/* DPE badges */}
            <div className="flex gap-1">
              {ETIQUETTE_FILTERS.map((f) => {
                const color = f.value ? getDpeColor(f.value) : null
                const active = etiquetteFilter === f.value
                return (
                  <button
                    key={f.value || 'all'}
                    onClick={() => { setEtiquetteFilter(f.value); if (results) handleSearch(1) }}
                    className={`flex flex-col items-center justify-center rounded-lg transition ${
                      f.value ? 'w-11 h-11' : 'w-9 h-9'
                    } ${active ? 'ring-2 ring-offset-1 ring-indigo-500' : 'opacity-60 hover:opacity-100'}`}
                    style={color
                      ? { backgroundColor: color.bg, color: color.text }
                      : { backgroundColor: active ? '#6366f1' : '#f3f4f6', color: active ? 'white' : '#6b7280' }
                    }
                    title={f.seuil ? `${f.value} : ${f.seuil} kWh/m2/an` : 'Toutes etiquettes'}
                  >
                    <span className="text-sm font-black leading-none">{f.value || '∀'}</span>
                    {f.seuil && <span className="text-[7px] font-semibold leading-tight mt-0.5 opacity-90">{f.seuil}</span>}
                  </button>
                )
              })}
            </div>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); if (results) handleSearch(1) }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle filtres avances */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Filtres avances
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Ligne 2 : Filtres avances */}
          {showAdvanced && (
            <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-gray-100">
              {/* Chauffage type */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Chauffage
                </label>
                <select
                  value={installChauffageFilter}
                  onChange={(e) => { setInstallChauffageFilter(e.target.value); if (results) handleSearch(1) }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 min-w-[120px]"
                >
                  {CHAUFFAGE_INSTALL_FILTERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Energie chauffage */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <Flame className="w-3 h-3 text-red-500" />
                  Energie
                </label>
                <select
                  value={energieChauffageFilter}
                  onChange={(e) => { setEnergieChauffageFilter(e.target.value); if (results) handleSearch(1) }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 min-w-[150px]"
                >
                  {ENERGIE_CHAUFFAGE_FILTERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* ECS */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  ECS
                </label>
                <select
                  value={installEcsFilter}
                  onChange={(e) => { setInstallEcsFilter(e.target.value); if (results) handleSearch(1) }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 min-w-[120px]"
                >
                  {ECS_INSTALL_FILTERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => { resetAdvancedFilters(); if (results) handleSearch(1) }}
                  className="px-2 py-1.5 text-[10px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                >
                  Reinitialiser
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      {stats && stats.distribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">
              Repartition DPE — {results?.total?.toLocaleString('fr-FR') || stats.total.toLocaleString('fr-FR')} diagnostics
            </h3>
          </div>
          <div className="flex rounded-lg overflow-hidden h-8 mb-3">
            {stats.distribution
              .sort((a, b) => 'ABCDEFG'.indexOf(a.etiquette) - 'ABCDEFG'.indexOf(b.etiquette))
              .map((d) => {
                const color = getDpeColor(d.etiquette)
                const pct = stats.total > 0 ? (d.count / stats.total) * 100 : 0
                if (pct < 1) return null
                return (
                  <div
                    key={d.etiquette}
                    className="flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color.bg,
                      color: color.text,
                      minWidth: pct > 3 ? undefined : '24px',
                    }}
                    title={`${d.etiquette} : ${d.count.toLocaleString('fr-FR')} (${pct.toFixed(1)}%)`}
                  >
                    {pct > 4 ? `${d.etiquette} ${pct.toFixed(0)}%` : d.etiquette}
                  </div>
                )
              })}
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.distribution
              .sort((a, b) => 'ABCDEFG'.indexOf(a.etiquette) - 'ABCDEFG'.indexOf(b.etiquette))
              .map((d) => {
                const color = getDpeColor(d.etiquette)
                return (
                  <button
                    key={d.etiquette}
                    onClick={() => { setEtiquetteFilter(d.etiquette); handleSearch(1) }}
                    className="flex items-center gap-1.5 text-xs hover:underline"
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {d.etiquette}
                    </div>
                    <span className="text-gray-600 font-medium">{d.count.toLocaleString('fr-FR')}</span>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* Geocoding info */}
      {geocoding && mode === 'address' && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700">
            <span className="font-semibold">Adresse trouvee :</span> {geocoding.label}
            <span className="text-green-500 ml-2">(score: {(geocoding.score * 100).toFixed(0)}%)</span>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Results header */}
      {results && !loading && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">
            {results.total.toLocaleString('fr-FR')} DPE trouve{results.total > 1 ? 's' : ''}
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-gray-400">
              Page {page} / {totalPages.toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      )}

      {/* Results list */}
      {results && results.items.length > 0 && (
        <div className="space-y-2 mb-6">
          {results.items.map((dpe, idx) => {
            const color = getDpeColor(dpe.etiquetteDpe)
            const gesColor = getDpeColor(dpe.etiquetteGes)
            const isCollectif = dpe.installationChauffage === 'collectif'
            const isImmeuble = dpe.typeBatiment === 'immeuble'
            return (
              <div
                key={dpe.numeroDpe || idx}
                className={`flex items-start gap-3 p-4 bg-white rounded-xl border transition group ${
                  isCollectif || isImmeuble
                    ? 'border-orange-200 hover:border-orange-300 hover:shadow-sm'
                    : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
                }`}
              >
                {/* DPE badge */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {dpe.etiquetteDpe || '?'}
                  </div>
                  {dpe.etiquetteGes && (
                    <div
                      className="w-8 h-6 rounded flex flex-col items-center justify-center"
                      style={{ backgroundColor: gesColor.bg, color: gesColor.text }}
                    >
                      <span className="text-[10px] font-black leading-none">{dpe.etiquetteGes}</span>
                      <span className="text-[5px] font-bold leading-none">GES</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {dpe.adresse || 'Adresse non renseignee'}
                    {dpe.commune ? `, ${dpe.commune}` : ''}
                  </p>

                  {/* Tags principaux */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {/* Type batiment */}
                    {dpe.typeBatiment && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isImmeuble ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {dpe.typeBatiment === 'maison' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {dpe.typeBatiment}
                        {dpe.nombreAppartements > 0 && ` (${dpe.nombreAppartements} logts)`}
                      </span>
                    )}

                    {/* Chauffage */}
                    {dpe.installationChauffage && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isCollectif ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Flame className="w-3 h-3" />
                        {dpe.installationChauffage}
                      </span>
                    )}

                    {/* Energie */}
                    {dpe.energieChauffage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                        {dpe.energieChauffage}
                      </span>
                    )}

                    {/* ECS */}
                    {dpe.installationEcs && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        <Droplets className="w-3 h-3" />
                        ECS {dpe.installationEcs}
                      </span>
                    )}

                    {/* Ventilation */}
                    {dpe.typeVentilation && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700">
                        <Wind className="w-3 h-3" />
                        {dpe.typeVentilation.length > 30 ? dpe.typeVentilation.slice(0, 30) + '...' : dpe.typeVentilation}
                      </span>
                    )}
                  </div>

                  {/* Details secondaires */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                    {dpe.consoM2 != null && <span>{dpe.consoM2} kWh/m2/an</span>}
                    {dpe.surface > 0 && <span>{dpe.surface} m2</span>}
                    {dpe.surfaceImmeuble > 0 && <span className="text-orange-600 font-medium">Imm. {dpe.surfaceImmeuble} m2</span>}
                    {dpe.nombreNiveaux > 0 && <span>{dpe.nombreNiveaux} niveaux</span>}
                    {dpe.periodeConstruction && <span>{dpe.periodeConstruction}</span>}
                    {dpe.generateurChauffage && (
                      <span className="text-gray-400" title={dpe.generateurChauffage}>
                        {dpe.generateurChauffage.length > 40 ? dpe.generateurChauffage.slice(0, 40) + '...' : dpe.generateurChauffage}
                      </span>
                    )}
                  </div>

                  {/* Isolation + dates */}
                  <div className="flex flex-wrap gap-x-3 mt-1 text-[10px] text-gray-400">
                    {dpe.dateEtablissement && <span>DPE du {new Date(dpe.dateEtablissement).toLocaleDateString('fr-FR')}</span>}
                    {dpe.isolationEnveloppe && <span>Enveloppe : {dpe.isolationEnveloppe}</span>}
                    {dpe.isolationMurs && <span>Murs : {dpe.isolationMurs}</span>}
                    {dpe.isolationMenuiseries && <span>Menuiseries : {dpe.isolationMenuiseries}</span>}
                    {dpe.isolationPlancherBas && <span>Plancher : {dpe.isolationPlancherBas}</span>}
                    {dpe.coutChauffage > 0 && <span className="text-amber-600 font-semibold">Cout chauffage : {dpe.coutChauffage} euros/an</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  {dpe.observatoireUrl && (
                    <a
                      href={dpe.observatoireUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      ADEME
                    </a>
                  )}
                  <Link
                    to={`/projets/nouveau?address=${encodeURIComponent(dpe.adresse || '')}&postalCode=${dpe.codePostal || ''}&city=${encodeURIComponent(dpe.commune || '')}`}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                  >
                    <UserPlus className="w-3 h-3" />
                    Projet
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {results && results.items.length === 0 && !loading && (
        <div className="text-center py-12">
          <Thermometer className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Aucun DPE trouve pour cette recherche.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Precedent
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-gray-700">
            {page} / {totalPages > 200 ? '200+' : totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || page >= 200}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}
    </div>
  )
}
