import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Loader2, Thermometer, MapPin, Filter, ArrowUpDown,
  ChevronLeft, ChevronRight, ExternalLink, UserPlus, BarChart3, Home, Building2
} from 'lucide-react'
import { searchDPE, prospectDPE, getDPEStats, getDpeColor, DPE_COLORS } from '../utils/dpeApi'

const SORT_OPTIONS = [
  { value: '-date_etablissement_dpe', label: 'Plus récent' },
  { value: 'date_etablissement_dpe', label: 'Plus ancien' },
  { value: 'etiquette_dpe', label: 'DPE A → G' },
  { value: '-etiquette_dpe', label: 'DPE G → A' },
  { value: '-conso_5_usages_par_m2_ep', label: 'Conso haute → basse' },
  { value: 'conso_5_usages_par_m2_ep', label: 'Conso basse → haute' },
]

// Seuils DPE énergie primaire (kWh EP/m²/an) — réforme 2021
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
  { value: '', label: 'Tous' },
  { value: 'maison', label: 'Maison' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'immeuble', label: 'Immeuble' },
]

export default function DpeProspectionPage() {
  // Search mode
  const [mode, setMode] = useState('prospect') // 'address' | 'prospect'
  const [query, setQuery] = useState('')

  // Prospect filters
  const [etiquetteFilter, setEtiquetteFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState('-date_etablissement_dpe')

  // Results
  const [results, setResults] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [geocoding, setGeocoding] = useState(null)

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
        // Detect if query is postal code or city name
        const isPostal = /^\d{5}$/.test(query.trim())
        const params = {
          postalCode: isPostal ? query.trim() : '',
          city: isPostal ? '' : query.trim(),
          etiquette: etiquetteFilter,
          typeBatiment: typeFilter,
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
  }, [query, mode, etiquetteFilter, typeFilter, sort, stats])

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

  const totalPages = results ? Math.ceil(results.total / 50) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl mb-3">
          <Thermometer className="w-7 h-7 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Prospection DPE</h1>
        <p className="text-gray-500 text-sm mt-1">
          Trouvez les DPE par adresse ou explorez une ville entière pour identifier vos prospects
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
                ? 'Entrez une adresse complète (ex: 16 rue du bourg 57510 Ernesviller)'
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
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">Filtres :</span>
          </div>

          {/* DPE filter — énergie primaire kWh EP/m²/an */}
          <div className="flex gap-1">
            {ETIQUETTE_FILTERS.map((f) => {
              const color = f.value ? getDpeColor(f.value) : null
              const active = etiquetteFilter === f.value
              return (
                <button
                  key={f.value || 'all'}
                  onClick={() => { setEtiquetteFilter(f.value); if (results) handleSearch(1) }}
                  className={`flex flex-col items-center justify-center rounded-lg transition ${
                    f.value ? 'w-12 h-12' : 'w-10 h-10'
                  } ${active ? 'ring-2 ring-offset-1 ring-indigo-500' : 'opacity-60 hover:opacity-100'}`}
                  style={color
                    ? { backgroundColor: color.bg, color: color.text }
                    : { backgroundColor: active ? '#6366f1' : '#f3f4f6', color: active ? 'white' : '#6b7280' }
                  }
                  title={f.seuil ? `${f.value} : ${f.seuil} kWh/m²/an` : 'Toutes étiquettes'}
                >
                  <span className="text-sm font-black leading-none">{f.value || '∀'}</span>
                  {f.seuil && <span className="text-[7px] font-semibold leading-tight mt-0.5 opacity-90">{f.seuil}</span>}
                </button>
              )
            })}
          </div>

          {/* Type filter */}
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
      )}

      {/* Stats bar */}
      {stats && stats.distribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">
              Répartition DPE — {results?.total?.toLocaleString('fr-FR') || stats.total.toLocaleString('fr-FR')} diagnostics
            </h3>
          </div>
          {/* Horizontal bar */}
          <div className="flex rounded-lg overflow-hidden h-8 mb-3">
            {stats.distribution
              .sort((a, b) => {
                const order = 'ABCDEFG'
                return order.indexOf(a.etiquette) - order.indexOf(b.etiquette)
              })
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
              .sort((a, b) => {
                const order = 'ABCDEFG'
                return order.indexOf(a.etiquette) - order.indexOf(b.etiquette)
              })
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
            <span className="font-semibold">Adresse trouvée :</span> {geocoding.label}
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
            {results.total.toLocaleString('fr-FR')} DPE trouvé{results.total > 1 ? 's' : ''}
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
            return (
              <div
                key={dpe.numeroDpe || idx}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition group"
              >
                {/* DPE badge */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0"
                  style={{ backgroundColor: color.bg, color: color.text }}
                >
                  {dpe.etiquetteDpe || '?'}
                </div>
                {/* GES mini */}
                {dpe.etiquetteGes && (
                  <div
                    className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0"
                    style={{ backgroundColor: gesColor.bg, color: gesColor.text }}
                  >
                    <span className="text-sm font-black leading-none">{dpe.etiquetteGes}</span>
                    <span className="text-[6px] font-bold leading-none">GES</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {dpe.adresse || 'Adresse non renseignée'}
                    {dpe.commune ? `, ${dpe.commune}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {dpe.consoM2 && (
                      <span className="text-xs text-gray-500">{dpe.consoM2} kWh/m²/an</span>
                    )}
                    {dpe.surface && (
                      <span className="text-xs text-gray-500">{dpe.surface} m²</span>
                    )}
                    {dpe.typeBatiment && (
                      <span className="text-xs text-gray-500 capitalize">
                        {dpe.typeBatiment === 'maison' && <Home className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                        {dpe.typeBatiment === 'appartement' && <Building2 className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                        {dpe.typeBatiment === 'immeuble' && <Building2 className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                        {dpe.typeBatiment}
                      </span>
                    )}
                    {dpe.periodeConstruction && (
                      <span className="text-xs text-gray-400">{dpe.periodeConstruction}</span>
                    )}
                    {dpe.energieChauffage && (
                      <span className="text-xs text-gray-400">{dpe.energieChauffage}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {dpe.dateEtablissement && new Date(dpe.dateEtablissement).toLocaleDateString('fr-FR')}
                    {dpe.isolationEnveloppe && ` — Isolation : ${dpe.isolationEnveloppe}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  {dpe.observatoireUrl && (
                    <a
                      href={dpe.observatoireUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                      title="Voir sur l'observatoire ADEME"
                    >
                      <ExternalLink className="w-3 h-3" />
                      ADEME
                    </a>
                  )}
                  <Link
                    to={`/clients/nouveau?address=${encodeURIComponent(dpe.adresse || '')}&postalCode=${dpe.codePostal || ''}&city=${encodeURIComponent(dpe.commune || '')}`}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                    title="Créer un bénéficiaire avec cette adresse"
                  >
                    <UserPlus className="w-3 h-3" />
                    Client
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
          <p className="text-gray-400">Aucun DPE trouvé pour cette recherche.</p>
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
            Précédent
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

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}
    </div>
  )
}
