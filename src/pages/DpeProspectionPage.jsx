import { useState, useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Loader2, Thermometer, MapPin, Filter, ArrowUpDown,
  ChevronLeft, ChevronRight, ExternalLink, UserPlus, BarChart3, Home, Building2,
  Download, Flame, X, Eye, Map as MapIcon, List, Target, Droplets
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { searchDPE, prospectDPE, getDPEStats, getDpeColor, searchAuditByBanId, computeRenoScore, computePacScore } from '../utils/dpeApi'
import DpeDetailCard from '../components/dpe/DpeDetailCard'

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
  { value: 'gaz_fioul', label: 'Gaz + Fioul (cibles PAC)' },
  { value: 'Gaz naturel', label: 'Gaz naturel' },
  { value: 'Fioul domestique', label: 'Fioul domestique' },
  { value: 'GPL', label: 'GPL' },
  { value: 'Propane', label: 'Propane' },
  { value: 'Butane', label: 'Butane' },
  { value: 'Électricité', label: 'Électricité' },
  { value: 'Bois – Bûches', label: 'Bois – Bûches' },
  { value: 'Bois – Granulés (pellets)', label: 'Bois – Granulés' },
]

const PERIODE_FILTERS = [
  { value: '', label: 'Toutes périodes' },
  { value: 'avant 1948', label: 'Avant 1948' },
  { value: '1948-1974', label: '1948–1974' },
  { value: '1975-1977', label: '1975–1977' },
  { value: '1978-1982', label: '1978–1982' },
  { value: '1983-1988', label: '1983–1988' },
  { value: '1989-2000', label: '1989–2000' },
  { value: '2001-2005', label: '2001–2005' },
  { value: '2006-2012', label: '2006–2012' },
  { value: '2013-2021', label: '2013–2021' },
  { value: 'après 2021', label: 'Après 2021' },
]

const ISOLATION_FILTERS = [
  { value: '', label: 'Toutes isolations' },
  { value: 'insuffisante', label: 'Insuffisante' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'bonne', label: 'Bonne' },
  { value: 'très bonne', label: 'Très bonne' },
]

function exportCSV(items, filename) {
  const headers = [
    'Adresse', 'Code postal', 'Commune', 'Type', 'Surface m²',
    'DPE', 'GES', 'Conso kWh/m²/an', 'Chauffage',
    'Période construction', 'Année', 'Isolation enveloppe',
    'Isolation murs', 'Isolation menuiseries', 'Date DPE',
    'N° DPE', 'Lien observatoire',
    'Score Réno', 'Cible Réno Globale', 'Gestes isolation'
  ]
  const rows = items.map((d) => {
    const reno = computeRenoScore(d)
    return [
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
      reno.score,
      reno.cibleRenoGlobale ? 'OUI' : 'non',
      reno.gestesIsolation.join(' + '),
    ]
  })

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

/* ── Map & detail helpers ───────────────────────────────────────── */

const DPE_MARKER_COLORS = {
  A: '#319834', B: '#33cc33', C: '#cbfc34', D: '#fbef36',
  E: '#fccc2f', F: '#f48e1f', G: '#ee1d23',
}

function parseGeopoint(geopoint) {
  if (!geopoint) return null
  const parts = geopoint.split(',')
  if (parts.length !== 2) return null
  const lat = parseFloat(parts[0])
  const lon = parseFloat(parts[1])
  if (isNaN(lat) || isNaN(lon)) return null
  return [lat, lon]
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30], maxZoom: 16 })
    }
  }, [positions, map])
  return null
}

function RenoScoreBadge({ dpe }) {
  const reno = useMemo(() => computeRenoScore(dpe), [dpe])
  const pac = useMemo(() => computePacScore(dpe), [dpe])

  const renoColors = {
    excellent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bon: 'bg-lime-100 text-lime-700 border-lime-200',
    moyen: 'bg-orange-100 text-orange-700 border-orange-200',
    faible: 'bg-gray-100 text-gray-500 border-gray-200',
  }

  const pacColors = {
    excellent: 'bg-blue-100 text-blue-700 border-blue-200',
    bon: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    moyen: 'bg-sky-100 text-sky-600 border-sky-200',
    faible: 'bg-gray-100 text-gray-500 border-gray-200',
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${renoColors[reno.niveau]}`}>
        {reno.score}
      </span>
      {reno.cibleRenoGlobale && (
        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-red-100 text-red-700 rounded-md text-[9px] font-bold border border-red-200" title="Cible rénovation globale : E/F/G + 2+ gestes isolation + remplacement chauffage">
          <Target className="w-2.5 h-2.5" />
          Réno
        </span>
      )}
      {pac.eligible && (
        <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[9px] font-bold border ${pacColors[pac.niveau]}`} title={pac.raisons.join(' · ')}>
          <Droplets className="w-2.5 h-2.5" />
          PAC {pac.score}
        </span>
      )}
    </div>
  )
}

export default function DpeProspectionPage() {
  const [mode, setMode] = useState('prospect')
  const [query, setQuery] = useState('')
  const [etiquetteFilter, setEtiquetteFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [chauffageFilter, setChauffageFilter] = useState('')
  const [periodeFilter, setPeriodeFilter] = useState('')
  const [isolationFilter, setIsolationFilter] = useState('')
  const [sort, setSort] = useState('-date_etablissement_dpe')
  const [results, setResults] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [geocoding, setGeocoding] = useState(null)
  const [selectedDpe, setSelectedDpe] = useState(null)
  const [selectedAudits, setSelectedAudits] = useState(null)
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [viewMode, setViewMode] = useState('list')

  const handleOpenDetail = useCallback(async (dpe) => {
    setSelectedDpe(dpe)
    setSelectedAudits(null)
    if (dpe.identifiantBan) {
      setLoadingAudits(true)
      try {
        const audits = await searchAuditByBanId(dpe.identifiantBan)
        setSelectedAudits(audits)
      } catch {
        setSelectedAudits([])
      } finally {
        setLoadingAudits(false)
      }
    }
  }, [])

  const mapItems = useMemo(() => {
    if (!results?.items) return []
    return results.items
      .map(dpe => ({ dpe, pos: parseGeopoint(dpe.geopoint) }))
      .filter(item => item.pos !== null)
  }, [results?.items])

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
          periodeConstruction: periodeFilter,
          isolationEnveloppe: isolationFilter,
          sort: newSort,
          page: newPage,
          size: 50,
        }
        const [data, statsData] = await Promise.all([
          prospectDPE(params),
          newPage === 1 ? getDPEStats({ postalCode: isPostal ? query.trim() : '', city: isPostal ? '' : query.trim() }).catch(() => null) : Promise.resolve(stats),
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
  }, [query, mode, etiquetteFilter, typeFilter, chauffageFilter, periodeFilter, isolationFilter, sort, stats])

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
          periodeConstruction: periodeFilter,
          isolationEnveloppe: isolationFilter,
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

  const activeFiltersCount = [etiquetteFilter, typeFilter, chauffageFilter, periodeFilter, isolationFilter].filter(Boolean).length

  const renoStats = useMemo(() => {
    if (!results?.items?.length) return null
    let cibles = 0
    for (const d of results.items) {
      if (computeRenoScore(d).cibleRenoGlobale) cibles++
    }
    return { cibles }
  }, [results])

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Prospection DPE</h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              Trouvez les DPE par adresse ou explorez une ville entière pour identifier vos prospects
            </p>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => { setMode('address'); setResults(null); setStats(null) }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'address'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Recherche par</span> adresse
        </button>
        <button
          onClick={() => { setMode('prospect'); setResults(null); setStats(null) }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'prospect'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Explorer <span className="hidden sm:inline">une ville</span>
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'address'
                ? 'Adresse complète...'
                : 'Code postal ou ville...'
              }
              className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-xl font-semibold text-sm hover:bg-orange-700 transition disabled:opacity-40 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </div>
      </form>

      {/* Filters (prospect mode) */}
      {mode === 'prospect' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </span>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
              {ETIQUETTE_FILTERS.map((f) => {
                const color = f.value ? getDpeColor(f.value) : null
                const active = etiquetteFilter === f.value
                return (
                  <button
                    key={f.value || 'all'}
                    onClick={() => { setEtiquetteFilter(f.value); if (results) handleSearch(1) }}
                    className={`flex flex-col items-center justify-center rounded-lg transition shrink-0 ${
                      f.value ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-10 sm:h-10'
                    } ${active ? 'ring-2 ring-offset-1 ring-orange-500' : 'opacity-60 hover:opacity-100'}`}
                    style={color
                      ? { backgroundColor: color.bg, color: color.text }
                      : { backgroundColor: active ? '#ea580c' : '#f3f4f6', color: active ? 'white' : '#6b7280' }
                    }
                    title={f.seuil ? `${f.value} : ${f.seuil} kWh/m²/an` : 'Toutes étiquettes'}
                  >
                    <span className="text-xs sm:text-sm font-black leading-none">{f.value || '∀'}</span>
                    {f.seuil && <span className="text-[7px] font-semibold leading-tight mt-0.5 opacity-90 hidden sm:block">{f.seuil}</span>}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] sm:text-xs font-medium text-gray-700"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); if (results) handleSearch(1) }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] sm:text-xs font-medium text-gray-700"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={chauffageFilter}
              onChange={(e) => { setChauffageFilter(e.target.value); if (results) handleSearch(1) }}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-[11px] sm:text-xs font-medium transition ${
                chauffageFilter === 'gaz_fioul'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : chauffageFilter
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              {CHAUFFAGE_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={periodeFilter}
              onChange={(e) => { setPeriodeFilter(e.target.value); if (results) handleSearch(1) }}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-[11px] sm:text-xs font-medium transition ${
                periodeFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              {PERIODE_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <select
              value={isolationFilter}
              onChange={(e) => { setIsolationFilter(e.target.value); if (results) handleSearch(1) }}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-[11px] sm:text-xs font-medium transition ${
                isolationFilter === 'insuffisante' ? 'bg-red-50 border-red-200 text-red-700'
                  : isolationFilter ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              {ISOLATION_FILTERS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>

            {chauffageFilter === 'gaz_fioul' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                <Droplets className="w-3.5 h-3.5" />
                Prospects PAC Air/Eau
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {stats && stats.distribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-5 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-700">
              Répartition DPE — {results?.total?.toLocaleString('fr-FR') || stats.total.toLocaleString('fr-FR')} diagnostics
            </h3>
            {renoStats && renoStats.cibles > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700">
                <Target className="w-3.5 h-3.5" />
                {renoStats.cibles} cible{renoStats.cibles > 1 ? 's' : ''} réno globale
              </span>
            )}
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

      {/* Results header + view toggle + export */}
      {results && !loading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <p className="text-sm font-bold text-gray-700">
            {results.total.toLocaleString('fr-FR')} DPE trouvé{results.total > 1 ? 's' : ''}
            {totalPages > 1 && (
              <span className="text-xs text-gray-400 font-normal ml-2">
                Page {page} / {totalPages.toLocaleString('fr-FR')}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Liste
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'map' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Carte
              </button>
            </div>
            {mode === 'prospect' && results.total > 0 && (
              <>
                <button
                  onClick={() => exportCSV(results.items, `prospection_DPE_page${page}.csv`)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Page ({results.items.length})
                </button>
                <button
                  onClick={handleExportAll}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50 shrink-0"
                >
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Tout exporter</span> CSV
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results — Mobile cards */}
      {results && results.items.length > 0 && viewMode === 'list' && (
        <>
          <div className="sm:hidden flex flex-col gap-3 mb-6">
            {results.items.map((dpe, idx) => {
              const color = getDpeColor(dpe.etiquetteDpe)
              const isGazFioul = dpe.energieChauffage && /gaz|fioul|propane|butane|gpl/i.test(dpe.energieChauffage)
              const reno = computeRenoScore(dpe)
              const pac = computePacScore(dpe)
              return (
                <div
                  key={dpe.numeroDpe || idx}
                  className={`bg-white rounded-xl border border-gray-200 p-3 shadow-sm active:bg-gray-50 transition ${reno.cibleRenoGlobale ? 'border-l-4 border-l-red-500' : ''} ${isGazFioul ? 'bg-red-50/20' : ''}`}
                  onClick={() => handleOpenDetail(dpe)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {dpe.etiquetteDpe || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{dpe.adresse || '—'}</p>
                      <p className="text-[11px] text-gray-400">{dpe.codePostal} {dpe.commune}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                          {dpe.typeBatiment === 'maison' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {dpe.surface ? `${dpe.surface} m²` : dpe.typeBatiment || '—'}
                        </span>
                        {dpe.energieChauffage && (
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isGazFioul ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isGazFioul && <Flame className="w-2.5 h-2.5" />}
                            {dpe.energieChauffage}
                          </span>
                        )}
                        {dpe.consoM2 && <span className="text-[10px] text-gray-400">{dpe.consoM2} kWh/m²</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <RenoScoreBadge dpe={dpe} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenDetail(dpe) }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-orange-600 bg-orange-50 rounded-lg"
                    >
                      <Eye className="w-3 h-3" /> Fiche
                    </button>
                    <Link
                      to={`/leads/nouveau?address=${encodeURIComponent(dpe.adresse || '')}&postalCode=${dpe.codePostal || ''}&city=${encodeURIComponent(dpe.commune || '')}&chauffage=${encodeURIComponent(dpe.energieChauffage || '')}&surface=${dpe.surface || ''}&dpe=${dpe.etiquetteDpe || ''}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-green-600 bg-green-50 rounded-lg"
                    >
                      <UserPlus className="w-3 h-3" /> Lead
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
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
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scores</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.items.map((dpe, idx) => {
                    const color = getDpeColor(dpe.etiquetteDpe)
                    const gesColor = getDpeColor(dpe.etiquetteGes)
                    const isGazFioul = dpe.energieChauffage && /gaz|fioul|propane|butane|gpl/i.test(dpe.energieChauffage)
                    const reno = computeRenoScore(dpe)
                    return (
                      <tr
                        key={dpe.numeroDpe || idx}
                        className={`hover:bg-gray-50 transition cursor-pointer ${isGazFioul ? 'bg-red-50/30' : ''} ${reno.cibleRenoGlobale ? 'border-l-4 border-l-red-500' : ''}`}
                        onClick={() => handleOpenDetail(dpe)}
                      >
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
                          <RenoScoreBadge dpe={dpe} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleOpenDetail(dpe)}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                            >
                              <Eye className="w-3 h-3" />
                              Fiche DPE
                            </button>
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
        </>
      )}

      {/* Map view */}
      {results && results.items.length > 0 && viewMode === 'map' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm" style={{ height: 'calc(100vh - 200px)', minHeight: '400px', maxHeight: '700px' }}>
          {mapItems.length > 0 ? (
            <MapContainer
              center={mapItems[0].pos}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <FitBounds positions={mapItems.map(i => i.pos)} />
              {mapItems.map(({ dpe, pos }, idx) => {
                const fillColor = DPE_MARKER_COLORS[dpe.etiquetteDpe] || '#9ca3af'
                const reno = computeRenoScore(dpe)
                const pac = computePacScore(dpe)
                return (
                  <CircleMarker
                    key={dpe.numeroDpe || idx}
                    center={pos}
                    radius={reno.cibleRenoGlobale ? 10 : pac.eligible ? 9 : 7}
                    pathOptions={{
                      fillColor,
                      color: reno.cibleRenoGlobale ? '#991b1b' : pac.eligible ? '#1d4ed8' : '#fff',
                      weight: reno.cibleRenoGlobale ? 3 : pac.eligible ? 2.5 : 2,
                      opacity: 1,
                      fillOpacity: 0.85,
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1.5 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black shrink-0"
                            style={{ backgroundColor: getDpeColor(dpe.etiquetteDpe).bg, color: getDpeColor(dpe.etiquetteDpe).text }}
                          >
                            {dpe.etiquetteDpe}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{dpe.adresse}</p>
                            <p className="text-[10px] text-gray-400">{dpe.codePostal} {dpe.commune}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          {dpe.surface && <span>{dpe.surface} m2</span>}
                          {dpe.energieChauffage && <span>{dpe.energieChauffage}</span>}
                        </div>
                        {dpe.consoM2 && <p className="text-gray-500">{dpe.consoM2} kWh/m²/an</p>}
                        {reno.cibleRenoGlobale && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                            <Target className="w-3 h-3 text-red-600" />
                            <span className="font-bold text-red-700 text-[10px]">Cible réno globale</span>
                          </div>
                        )}
                        {pac.eligible && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                            <Droplets className="w-3 h-3 text-blue-600" />
                            <span className="font-bold text-blue-700 text-[10px]">PAC {pac.score}/100 — {pac.niveau}</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleOpenDetail(dpe)}
                          className="w-full mt-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                        >
                          <Eye className="w-3 h-3" />
                          Voir fiche
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Aucun DPE avec coordonnées géographiques sur cette page.
            </div>
          )}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-4 text-[10px] text-gray-500">
            <span className="font-semibold">{mapItems.length} DPE géolocalisés</span>
            <div className="flex items-center gap-2">
              {['A','B','C','D','E','F','G'].map(e => (
                <span key={e} className="flex items-center gap-0.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DPE_MARKER_COLORS[e] }} />
                  {e}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 ml-auto">
              <span className="w-3 h-3 rounded-full border-2 border-red-800 bg-red-400/50" />
              Cible réno globale
            </span>
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

      {/* DPE Detail slide-over */}
      {selectedDpe && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedDpe(null)} />
          <div className="relative w-full max-w-full sm:max-w-2xl bg-white shadow-2xl overflow-y-auto" style={{ animation: 'slideInRight 0.25s ease-out' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-white/95 backdrop-blur border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg font-black shrink-0"
                  style={{ backgroundColor: getDpeColor(selectedDpe.etiquetteDpe).bg, color: getDpeColor(selectedDpe.etiquetteDpe).text }}
                >
                  {selectedDpe.etiquetteDpe}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{selectedDpe.adresse || 'DPE'}</p>
                  <p className="text-[10px] text-gray-400">{selectedDpe.codePostal} {selectedDpe.commune}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {selectedDpe.observatoireUrl && (
                  <a
                    href={selectedDpe.observatoireUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Observatoire
                  </a>
                )}
                <button
                  onClick={() => setSelectedDpe(null)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div>
              {loadingAudits && (
                <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 border-b border-blue-100">
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  <span className="text-xs text-blue-600 font-medium">Chargement des audits...</span>
                </div>
              )}
              <DpeDetailCard dpe={selectedDpe} audits={selectedAudits} />
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

