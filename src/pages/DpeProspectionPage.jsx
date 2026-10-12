import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Loader2, Thermometer, MapPin, Filter, ArrowUpDown,
  ChevronLeft, ChevronRight, ExternalLink, UserPlus, BarChart3, Home, Building2,
  Download, Flame, Zap
} from 'lucide-react'
import { searchDPE, prospectDPE, getDPEStats, getDpeColor } from '../utils/dpeApi'

const SORT_OPTIONS = [
  { value: '-date_etablissement_dpe', label: 'Plus récent' },
  { value: 'date_etablissement_dpe', label: 'Plus ancien' },
  { value: 'etiquette_dpe', label: 'DPE A → G' },
  { value: '-etiquette_dpe', label: 'DPE G → A' },
  { value: '-surface_habitable_logement', label: 'Surface grande → petite' },
  { value: 'surface_habitable_logement', label: 'Surface petite → grande' },
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

const CHAUFFAGE_FILTERS = [
  { value: '', label: 'Tous chauffages' },
  { value: 'gaz_fioul', label: 'Gaz + Fioul (cibles PAC)', icon: '🎯' },
  { value: 'Gaz naturel', label: 'Gaz naturel' },
  { value: 'Fioul domestique', label: 'Fioul domestique' },
  { value: 'GPL', label: 'GPL' },
  { value: 'Propane', label: 'Propane' },
  { value: 'Butane', label: 'Butane' },
  { value: 'Électricité', label: 'Électricité' },
  { value: 'Bois – Bûches', label: 'Bois – Bûches' },
  { value: 'Bois – Granulés (pellets)', label: 'Bois – Granulés' },
]

function exportCSV(items, filename) {
  const headers = [
    'Adresse', 'Code postal', 'Commune', 'Type', 'Surface m²',
    'DPE', 'GES', 'Conso kWh/m²/an', 'Chauffage',
    'Période construction', 'Année', 'Isolation enveloppe',
    'Isolation murs', 'Isolation menuiseries', 'Date DPE',
    'N° DPE', 'Lien observatoire'
  ]
  const rows = items.map((d) => [
    d.adresse || '',
    d.codePostal || '',
    d.commune || '',
    d.typeBatiment || '',
    d.surface || '',
    d.etiquetteDpe || '',
    d.etiquetteGes || '',
    d.consoM2 || '',
    d.energieChauffage || '',
    d.periodeConstruction || '',
    d.anneeConstruction || '',
    d.isolationEnveloppe || '',
    d.isolationMurs || '',
    d.isolationMenuiseries || '',
    d.dateEtablissement ? new Date(d.dateEtablissement).toLocaleDateString('fr-FR') : '',
    d.numeroDpe || '',
    d.observatoireUrl || '',
  ])

  const BOM = '﻿'
  const csv = BOM + [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DpeProspectionPage() {
  const [mode, setMode] = useState('prospect')
  const [query, setQuery] = useState('')
  const [etiquetteFilter, setEtiquetteFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [chauffageFilter, setChauffageFilter] = useState('')
  const [sort, setSort] = useState('-date_etablissement_dpe')
  const [results, setResults] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
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
        const isPostal = /^\d{5}$/.test(query.trim())
        const params = {
          postalCode: isPostal ? query.trim() : '',
          city: isPostal ? '' : query.trim(),
          etiquette: etiquetteFilter,
          typeBatiment: typeFilter,
          chauffage: chauffageFilter,
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
  }, [query, mode, etiquetteFilter, typeFilter, chauffageFilter, sort, stats])

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

  async function handleExportAll() {
    if (!query.trim()) return
    setExporting(true)
    try {
      const isPostal = /^\d{5}$/.test(query.trim())
      const allItems = []
      let p = 1
      const maxPages = 20
      while (p <= maxPages) {
        const data = await prospectDPE({
          postalCode: isPostal ? query.trim() : '',
          city: isPostal ? '' : query.trim(),
          etiquette: etiquetteFilter,
          typeBatiment: typeFilter,
          chauffage: chauffageFilter,
          sort,
          page: p,
          size: 100,
        })
        allItems.push(...data.results)
        if (allItems.length >= data.total || data.results.length === 0) break
        p++
      }
      const label = query.trim().replace(/\s+/g, '_')
      const filters = [typeFilter, chauffageFilter ? chauffageFilter.replace(/\s+/g, '_') : '', etiquetteFilter].filter(Boolean).join('_')
      exportCSV(allItems, `prospection_DPE_${label}${filters ? '_' + filters : ''}.csv`)
    } catch (err) {
      setError('Export échoué : ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = results ? Math.ceil(results.total / 50) : 0

  const activeFiltersCount = [etiquetteFilter, typeFilter, chauffageFilter].filter(Boolean).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prospection DPE</h1>
            <p className="text-sm text-gray-500">
              Trouvez les DPE par adresse ou explorez une ville entière pour identifier vos prospects
            </p>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('address'); setResults(null); setStats(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            mode === 'address'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Recherche par adresse
        </button>
        <button
          onClick={() => { setMode('prospect'); setResults(null); setStats(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            mode === 'prospect'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'address'
                ? 'Entrez une adresse complète (ex: 16 rue du bourg 57510 Ernesviller)'
                : 'Entrez un code postal (ex: 57490) ou une ville (ex: CARLING)'
              }
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold text-sm hover:bg-orange-700 transition disabled:opacity-40 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </div>
      </form>

      {/* Filters (prospect mode) */}
      {mode === 'prospect' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </span>
            </div>

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
                    } ${active ? 'ring-2 ring-offset-1 ring-orange-500' : 'opacity-60 hover:opacity-100'}`}
                    style={color
                      ? { backgroundColor: color.bg, color: color.text }
                      : { backgroundColor: active ? '#ea580c' : '#f3f4f6', color: active ? 'white' : '#6b7280' }
                    }
                    title={f.seuil ? `${f.value} : ${f.seuil} kWh/m²/an` : 'Toutes étiquettes'}
                  >
                    <span className="text-sm font-black leading-none">{f.value || '∀'}</span>
                    {f.seuil && <span className="text-[7px] font-semibold leading-tight mt-0.5 opacity-90">{f.seuil}</span>}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); if (results) handleSearch(1) }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={chauffageFilter}
              onChange={(e) => { setChauffageFilter(e.target.value); if (results) handleSearch(1) }}
              className={`px-3 py-2 border rounded-lg text-xs font-medium transition ${
                chauffageFilter === 'gaz_fioul'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : chauffageFilter
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              {CHAUFFAGE_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon ? `${c.icon} ${c.label}` : c.label}
                </option>
              ))}
            </select>

            {chauffageFilter === 'gaz_fioul' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                <Zap className="w-3.5 h-3.5" />
                Prospects PAC Air/Eau
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {stats && stats.distribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">
              Répartition DPE — {results?.total?.toLocaleString('fr-FR') || stats.total.toLocaleString('fr-FR')} diagnostics
            </h3>
          </div>
          <div className="flex rounded-xl overflow-hidden h-10 mb-3">
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
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
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

      {/* Geocoding */}
      {geocoding && mode === 'address' && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
          <MapPin className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700">
            <span className="font-semibold">Adresse trouvée :</span> {geocoding.label}
            <span className="text-green-500 ml-2">(score: {(geocoding.score * 100).toFixed(0)}%)</span>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Results header + export */}
      {results && !loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-700">
            {results.total.toLocaleString('fr-FR')} DPE trouvé{results.total > 1 ? 's' : ''}
            {totalPages > 1 && (
              <span className="text-xs text-gray-400 font-normal ml-2">
                Page {page} / {totalPages.toLocaleString('fr-FR')}
              </span>
            )}
          </p>
          {mode === 'prospect' && results.total > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCSV(results.items, `prospection_DPE_page${page}.csv`)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Page ({results.items.length})
              </button>
              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Tout exporter CSV ({Math.min(results.total, 2000).toLocaleString('fr-FR')})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results table */}
      {results && results.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">DPE</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Adresse</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Surface</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Chauffage</span>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Conso</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Isolation</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date DPE</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.items.map((dpe, idx) => {
                  const color = getDpeColor(dpe.etiquetteDpe)
                  const gesColor = getDpeColor(dpe.etiquetteGes)
                  const isGazFioul = dpe.energieChauffage && /gaz|fioul|propane|butane|gpl/i.test(dpe.energieChauffage)
                  return (
                    <tr key={dpe.numeroDpe || idx} className={`hover:bg-gray-50 transition ${isGazFioul ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                            style={{ backgroundColor: color.bg, color: color.text }}
                          >
                            {dpe.etiquetteDpe || '?'}
                          </div>
                          {dpe.etiquetteGes && (
                            <div
                              className="w-6 h-6 rounded flex flex-col items-center justify-center shrink-0"
                              style={{ backgroundColor: gesColor.bg, color: gesColor.text }}
                            >
                              <span className="text-[9px] font-black leading-none">{dpe.etiquetteGes}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 max-w-[220px] truncate">{dpe.adresse || '—'}</p>
                        <p className="text-[10px] text-gray-400">{dpe.codePostal} {dpe.commune}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-600 capitalize">
                          {dpe.typeBatiment === 'maison' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {dpe.typeBatiment || '—'}
                        </span>
                        {dpe.periodeConstruction && (
                          <span className="text-[10px] text-gray-400">{dpe.periodeConstruction}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {dpe.surface ? `${dpe.surface} m²` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                          isGazFioul
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isGazFioul && <Flame className="w-3 h-3" />}
                          {dpe.energieChauffage || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {dpe.consoM2 ? `${dpe.consoM2} kWh/m²` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-gray-500">{dpe.isolationEnveloppe || '—'}</span>
                        {dpe.isolationMurs && <span className="block text-[10px] text-gray-400">Murs: {dpe.isolationMurs}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {dpe.dateEtablissement ? new Date(dpe.dateEtablissement).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {dpe.observatoireUrl && (
                            <a
                              href={dpe.observatoireUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              DPE
                            </a>
                          )}
                          <Link
                            to={`/leads/nouveau?address=${encodeURIComponent(dpe.adresse || '')}&postalCode=${dpe.codePostal || ''}&city=${encodeURIComponent(dpe.commune || '')}&chauffage=${encodeURIComponent(dpe.energieChauffage || '')}&surface=${dpe.surface || ''}&dpe=${dpe.etiquetteDpe || ''}`}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                          >
                            <UserPlus className="w-3 h-3" />
                            Lead
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && results.items.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Thermometer className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">Aucun DPE trouvé pour cette recherche.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>
          <span className="px-4 py-2.5 text-sm font-bold text-gray-700">
            {page} / {totalPages > 200 ? '200+' : totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || page >= 200}
            className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      )}
    </div>
  )
}
