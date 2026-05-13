import {
  Building2,
  Flame,
  Droplets,
  Wind,
  ShieldCheck,
  TrendingDown,
  ExternalLink,
  Unlink,
  Link2,
  Calendar,
  Ruler,
  Layers,
  AlertTriangle,
  Lightbulb,
  Euro,
  CheckCircle,
  XCircle,
  Zap,
  Home,
  Gauge,
  ChevronDown,
  ChevronUp,
  Hammer,
  ArrowDown,
  ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import { getDpeColor } from '../../utils/dpeApi'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DPE_SCALE = [
  { letter: 'A', max: 70, label: '≤ 70 kWh/m²' },
  { letter: 'B', max: 110, label: '71 à 110 kWh/m²' },
  { letter: 'C', max: 180, label: '111 à 180 kWh/m²' },
  { letter: 'D', max: 250, label: '181 à 250 kWh/m²' },
  { letter: 'E', max: 330, label: '251 à 330 kWh/m²' },
  { letter: 'F', max: 420, label: '331 à 420 kWh/m²' },
  { letter: 'G', max: Infinity, label: '> 420 kWh/m²' },
]

const GES_SCALE = [
  { letter: 'A', max: 6, label: '≤ 6 kg CO₂/m²' },
  { letter: 'B', max: 11, label: '7 à 11 kg CO₂/m²' },
  { letter: 'C', max: 30, label: '12 à 30 kg CO₂/m²' },
  { letter: 'D', max: 50, label: '31 à 50 kg CO₂/m²' },
  { letter: 'E', max: 70, label: '51 à 70 kg CO₂/m²' },
  { letter: 'F', max: 100, label: '71 à 100 kg CO₂/m²' },
  { letter: 'G', max: Infinity, label: '> 100 kg CO₂/m²' },
]

const BAR_WIDTHS = [30, 40, 50, 60, 70, 82, 100]

function isolationBadge(value) {
  if (!value) return { label: '—', cls: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300' }
  const v = value.toLowerCase()
  if (v.includes('insuffisante'))
    return { label: 'Insuffisante', cls: 'bg-red-50 text-red-600 border border-red-200', dot: 'bg-red-500' }
  if (v.includes('moyenne'))
    return { label: 'Moyenne', cls: 'bg-amber-50 text-amber-600 border border-amber-200', dot: 'bg-amber-500' }
  if (v.includes('très bonne') || v.includes('tres bonne'))
    return { label: 'Très bonne', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-500' }
  if (v.includes('bonne'))
    return { label: 'Bonne', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-500' }
  return { label: value, cls: 'bg-gray-50 text-gray-500 border border-gray-200', dot: 'bg-gray-400' }
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function isExpired(dateFinValidite) {
  if (!dateFinValidite) return false
  try { return new Date(dateFinValidite) < new Date() } catch { return false }
}

function estimateGainClass(etiquette) {
  const map = { G: 'C-D', F: 'B-C', E: 'B-C', D: 'B', C: 'A-B' }
  return map[etiquette] || null
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DpeBadge({ letter, size = 'lg', sub }) {
  const color = getDpeColor(letter)
  const dims = {
    lg: 'w-14 h-14 text-2xl',
    md: 'w-10 h-10 text-base',
    sm: 'w-8 h-8 text-sm',
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`${dims[size]} rounded-xl font-black flex items-center justify-center shrink-0 shadow-sm`}
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {letter || '?'}
      </span>
      {sub && <span className="text-[8px] font-bold text-gray-400 uppercase">{sub}</span>}
    </div>
  )
}

function ScaleBar({ scale, current, value, unit }) {
  return (
    <div className="space-y-[3px]">
      {scale.map(({ letter, label }, i) => {
        const color = getDpeColor(letter)
        const active = letter === current
        const w = BAR_WIDTHS[i]
        return (
          <div key={letter} className="flex items-center gap-1.5">
            <div
              className={`h-[26px] rounded-r-full flex items-center px-2.5 text-[11px] font-bold transition-all relative ${
                active
                  ? 'ring-2 ring-gray-900/20 ring-offset-1 shadow-md z-10 scale-y-110'
                  : 'opacity-75'
              }`}
              style={{ width: `${w}%`, backgroundColor: color.bg, color: color.text }}
            >
              <span>{letter}</span>
              <span className="ml-auto text-[9px] font-semibold opacity-80">{label}</span>
            </div>
            {active && value != null && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-extrabold text-gray-800">{value}</span>
                <span className="text-[9px] text-gray-400">{unit}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ValueBox({ label, value, unit, color = 'text-gray-800' }) {
  if (value == null) return null
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xl font-extrabold ${color}`}>
        {value} <span className="text-xs font-semibold text-gray-400">{unit}</span>
      </p>
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
      {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
      {children}
    </h4>
  )
}

/* ------------------------------------------------------------------ */
/*  Scenarios de travaux (from ADEME audit)                            */
/* ------------------------------------------------------------------ */

function ScenarioLabel(name) {
  if (!name) return name
  if (name.includes('une étape') || name.includes('une etape')) return 'Scenario en une etape'
  if (name.includes('multi')) return 'Scenario multi etapes'
  if (name.includes('complémentaire') || name.includes('complementaire')) return 'Scenario complementaire'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function EtiquetteMini({ letter, size = 'sm' }) {
  if (!letter) return null
  const c = getDpeColor(letter)
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
  return (
    <span
      className={`${dim} rounded-md font-black flex items-center justify-center shrink-0`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {letter}
    </span>
  )
}

function AuditScenarios({ audits }) {
  if (!audits || audits.length === 0) return null

  // Take the most recent audit
  const audit = audits[0]
  if (!audit.scenarios || audit.scenarios.length === 0) return null

  const fmt = (v) => v != null ? Number(v).toLocaleString('fr-FR') : '—'
  const pct = (gain, initial) => {
    if (gain == null || !initial) return null
    return Math.round((gain / initial) * 100)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Hammer}>Scenarios de travaux</SectionTitle>
        {audit.observatoireUrl && (
          <a
            href={audit.observatoireUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-indigo-500 hover:text-indigo-700 hover:underline flex items-center gap-0.5"
          >
            Audit n°{audit.numeroAudit} <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      <div className="space-y-4">
        {audit.scenarios.map((scenario, si) => (
          <div key={si} className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Scenario header */}
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">{si + 1}</span>
              <span className="text-sm font-semibold text-gray-700">{ScenarioLabel(scenario.categorie)}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-semibold">Postes</th>
                    <th className="px-3 py-2 text-center font-semibold">Performance</th>
                    <th className="px-3 py-2 text-center font-semibold">Gain energie</th>
                    <th className="px-3 py-2 text-right font-semibold">Cout travaux</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Etat initial */}
                  {audit.etatInitial && (
                    <tr className="border-b border-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">Avant travaux</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-gray-500 font-medium">{fmt(audit.etatInitial.consoM2)}</span>
                          <span className="text-gray-500 font-medium">{fmt(audit.etatInitial.emissionGes)}</span>
                          <EtiquetteMini letter={audit.etatInitial.classeDpe} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-300">—</td>
                      <td className="px-3 py-2.5 text-right text-gray-300">—</td>
                    </tr>
                  )}

                  {/* Etapes */}
                  {scenario.etapes.map((etape, ei) => {
                    const gainPct = pct(etape.gainConso, audit.etatInitial?.consoM2)
                    const isUuid = /^[0-9a-f-]{20,}$/i.test(etape.id)
                    const stepLabel = isUuid ? `Étape ${ei + 1}` : etape.id
                    return (
                      <tr key={ei} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-700 mb-1 capitalize">{stepLabel}</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs">
                            {etape.travaux.join(', ')}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-gray-600 font-medium">{fmt(etape.consoM2)}</span>
                            <span className="text-gray-600 font-medium">{fmt(etape.emissionGes)}</span>
                            <EtiquetteMini letter={etape.classeDpe} />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {gainPct != null && (
                            <div>
                              <span className="text-lg font-extrabold text-emerald-600">{gainPct} %</span>
                              {etape.gainConso != null && (
                                <p className="text-[10px] text-gray-400">{etape.gainConso > 0 ? '+' : ''}{etape.gainConso} kWh/m²/an</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {etape.coutTravaux != null && (
                            <div>
                              <span className="font-bold text-gray-700">~ {fmt(etape.coutTravaux)} €</span>
                              {etape.coutsCumules != null && etape.coutsCumules !== etape.coutTravaux && (
                                <p className="text-[10px] text-gray-400">cumul: {fmt(etape.coutsCumules)} €</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Insights commercial                                                */
/* ------------------------------------------------------------------ */

function InsightsCommercial({ dpe }) {
  const insights = []

  if (dpe.etiquetteDpe === 'F' || dpe.etiquetteDpe === 'G') {
    insights.push({
      icon: AlertTriangle,
      title: 'Passoire energetique',
      desc: 'Obligation de renovation, fort potentiel commercial',
      color: 'border-red-200 bg-red-50',
      iconColor: 'text-red-500',
    })
  }

  const isoChecks = [
    { key: 'isolationMurs', label: 'murs' },
    { key: 'isolationPlancherBas', label: 'plancher bas' },
    { key: 'isolationMenuiseries', label: 'menuiseries' },
  ]
  isoChecks.forEach(({ key, label }) => {
    if (dpe[key] && dpe[key].toLowerCase().includes('insuffisante')) {
      insights.push({
        icon: ShieldCheck,
        title: `Isolation ${label} insuffisante`,
        desc: 'Poste prioritaire de renovation',
        color: 'border-amber-200 bg-amber-50',
        iconColor: 'text-amber-500',
      })
    }
  })

  const energie = (dpe.energieChauffage || '').toLowerCase()
  if (energie.includes('fioul') || energie.includes('gaz')) {
    insights.push({
      icon: Zap,
      title: `Remplacement ${dpe.energieChauffage} par PAC`,
      desc: 'Eligible CEE + MaPrimeRenov',
      color: 'border-emerald-200 bg-emerald-50',
      iconColor: 'text-emerald-500',
    })
  }

  if (dpe.coutChauffage && dpe.coutChauffage > 1500) {
    insights.push({
      icon: Euro,
      title: `Facture chauffage ${dpe.coutChauffage}€/an`,
      desc: 'Argument commercial fort pour le client',
      color: 'border-blue-200 bg-blue-50',
      iconColor: 'text-blue-500',
    })
  }

  const gain = estimateGainClass(dpe.etiquetteDpe)
  if (gain) {
    insights.push({
      icon: TrendingDown,
      title: `Objectif apres travaux : classe ${gain}`,
      desc: 'Estimation du gain energetique atteignable',
      color: 'border-indigo-200 bg-indigo-50',
      iconColor: 'text-indigo-500',
    })
  }

  if (insights.length === 0) return null

  return (
    <div>
      <SectionTitle icon={Lightbulb}>Insights commercial</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2 mt-3">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${ins.color}`}
          >
            <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${ins.iconColor}`} />
            <div>
              <p className="text-sm font-semibold text-gray-800">{ins.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{ins.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Compact mode (for lists & search results)                          */
/* ------------------------------------------------------------------ */

function CompactCard({ dpe, onDetach, onAttach }) {
  const isoItems = [
    { label: 'Murs', value: dpe.isolationMurs },
    { label: 'Plancher', value: dpe.isolationPlancherBas },
    { label: 'Menuiseries', value: dpe.isolationMenuiseries },
    { label: 'Enveloppe', value: dpe.isolationEnveloppe },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-4 hover:border-indigo-200 hover:shadow-md transition">
      {/* Badges */}
      <div className="flex items-center gap-2">
        <DpeBadge letter={dpe.etiquetteDpe} size="sm" sub="DPE" />
        <DpeBadge letter={dpe.etiquetteGes} size="sm" sub="GES" />
      </div>

      {/* Address */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {dpe.adresse || '—'}
        </p>
        <p className="text-xs text-gray-400">
          {dpe.codePostal} {dpe.commune}
        </p>
      </div>

      {/* Key stats */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        {dpe.surface && <span className="font-medium">{dpe.surface} m²</span>}
        {dpe.consoM2 != null && (
          <span className="font-semibold">{dpe.consoM2} <span className="text-gray-400 font-normal">kWh/m²/an</span></span>
        )}
        {dpe.emissionGes != null && (
          <span className="font-semibold">{dpe.emissionGes} <span className="text-gray-400 font-normal">kg CO₂/m²/an</span></span>
        )}
      </div>

      {/* Isolation badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {isoItems.map(({ label, value }) => {
          const b = isolationBadge(value)
          return (
            <span
              key={label}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.cls}`}
              title={label}
            >
              {label}
            </span>
          )
        })}
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1.5">
        {onDetach && (
          <button
            onClick={onDetach}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            <Unlink className="w-3.5 h-3.5" /> Detacher
          </button>
        )}
        {onAttach && (
          <button
            onClick={onAttach}
            className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition shadow-sm"
          >
            <Link2 className="w-3.5 h-3.5" /> Attacher
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Full card (default)                                                */
/* ------------------------------------------------------------------ */

export default function DpeDetailCard({ dpe, audits, onDetach, onAttach, compact }) {
  if (!dpe) return null
  if (compact) return <CompactCard dpe={dpe} onDetach={onDetach} onAttach={onAttach} />

  const [showTechnical, setShowTechnical] = useState(false)
  const expired = isExpired(dpe.dateFinValidite)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ═══ 1. HEADER ═══ */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
        <div className="flex items-start gap-4">
          {/* Big DPE + GES badges */}
          <div className="flex items-center gap-2">
            <DpeBadge letter={dpe.etiquetteDpe} size="lg" sub="DPE" />
            {dpe.etiquetteGes && <DpeBadge letter={dpe.etiquetteGes} size="md" sub="GES" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900 leading-tight">
              {dpe.adresse || 'Adresse inconnue'}
            </p>
            <p className="text-sm text-gray-500">
              {dpe.codePostal} {dpe.commune}
            </p>

            {dpe.numeroDpe && (
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                DPE n°{' '}
                {dpe.observatoireUrl ? (
                  <a
                    href={dpe.observatoireUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-500 hover:text-indigo-700 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    {dpe.numeroDpe}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-medium text-gray-500">{dpe.numeroDpe}</span>
                )}
              </p>
            )}
          </div>

          {/* Status + Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {expired ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                <XCircle className="w-3 h-3" /> Expire
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="w-3 h-3" /> Actif
              </span>
            )}
            {onDetach && (
              <button
                onClick={onDetach}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors hover:bg-red-50"
              >
                <Unlink className="w-3.5 h-3.5" /> Detacher
              </button>
            )}
            {onAttach && (
              <button
                onClick={onAttach}
                className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 flex items-center gap-1 transition font-semibold shadow-sm"
              >
                <Link2 className="w-3.5 h-3.5" /> Attacher
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ 2. SUMMARY CARDS (3 colonnes) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100">
        {/* Caracteristiques */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Caracteristiques</span>
          </div>
          <div className="space-y-1.5 text-sm">
            {dpe.typeBatiment && (
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="font-medium text-gray-700">{dpe.typeBatiment}</span>
              </div>
            )}
            {dpe.surface && (
              <div className="flex justify-between">
                <span className="text-gray-400">Surface</span>
                <span className="font-medium text-gray-700">{dpe.surface} m²</span>
              </div>
            )}
            {dpe.periodeConstruction && (
              <div className="flex justify-between">
                <span className="text-gray-400">Periode</span>
                <span className="font-medium text-gray-700">{dpe.periodeConstruction}</span>
              </div>
            )}
            {dpe.nombreNiveaux && (
              <div className="flex justify-between">
                <span className="text-gray-400">Niveaux</span>
                <span className="font-medium text-gray-700">{dpe.nombreNiveaux}</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance logement */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Performance</span>
          </div>
          <div className="space-y-1.5 text-sm">
            {dpe.consoM2 != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Conso. energie</span>
                <span className="font-semibold text-gray-800">{dpe.consoM2} kWh<sub>ep</sub>/m²/an</span>
              </div>
            )}
            {dpe.emissionGes != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Emissions GES</span>
                <span className="font-semibold text-gray-800">{dpe.emissionGes} kg CO₂/m²/an</span>
              </div>
            )}
            {dpe.coutTotal != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Cout total/an</span>
                <span className="font-semibold text-orange-600">{dpe.coutTotal} €</span>
              </div>
            )}
            {dpe.coutChauffage != null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Cout chauffage/an</span>
                <span className="font-semibold text-orange-600">{dpe.coutChauffage} €</span>
              </div>
            )}
          </div>
        </div>

        {/* DPE - Statut & validite */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Statut & Validite</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Statut</span>
              {expired ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Expire</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Actif</span>
              )}
            </div>
            {dpe.dateEtablissement && (
              <div className="flex justify-between">
                <span className="text-gray-400">Etabli le</span>
                <span className="font-medium text-gray-700">{formatDate(dpe.dateEtablissement)}</span>
              </div>
            )}
            {dpe.dateFinValidite && (
              <div className="flex justify-between">
                <span className="text-gray-400">Valable jusqu'au</span>
                <span className={`font-medium ${expired ? 'text-red-500' : 'text-gray-700'}`}>{formatDate(dpe.dateFinValidite)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Source</span>
              {dpe.observatoireUrl ? (
                <a href={dpe.observatoireUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-medium text-indigo-500 hover:text-indigo-700 hover:underline flex items-center gap-0.5">
                  API ADEME <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-xs text-gray-500">ADEME</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 3. PERFORMANCE ENERGETIQUE & CLIMATIQUE ═══ */}
      <div className="px-6 py-5 border-b border-gray-100">
        <SectionTitle icon={Flame}>Performance energetique & climatique</SectionTitle>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          {/* DPE Scale */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">
              Consommation energie primaire
            </p>
            <ScaleBar
              scale={DPE_SCALE}
              current={dpe.etiquetteDpe}
              value={dpe.consoM2}
              unit="kWh/m²/an"
            />
          </div>

          {/* GES Scale */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">
              Emissions de gaz a effet de serre
            </p>
            <ScaleBar
              scale={GES_SCALE}
              current={dpe.etiquetteGes}
              value={dpe.emissionGes}
              unit="kg CO₂/m²/an"
            />
          </div>
        </div>

        {/* Value boxes */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <ValueBox label="Energie primaire" value={dpe.consoM2} unit="kWhep/m²/an" />
          <ValueBox label="Emissions GES" value={dpe.emissionGes} unit="kg CO₂/m²/an" />
        </div>
      </div>

      {/* ═══ 4. PERFORMANCE DE L'ISOLATION ═══ */}
      <div className="px-6 py-5 border-b border-gray-100">
        <SectionTitle icon={ShieldCheck}>Performance de l'isolation</SectionTitle>

        <div className="mt-3 divide-y divide-gray-50">
          {[
            { icon: Building2, label: 'Murs', value: dpe.isolationMurs },
            { icon: Layers, label: 'Plancher bas', value: dpe.isolationPlancherBas },
            { icon: Home, label: 'Toiture / plafond', value: dpe.isolationEnveloppe },
            { icon: Wind, label: 'Menuiseries', value: dpe.isolationMenuiseries },
            { icon: ShieldCheck, label: 'Enveloppe globale', value: dpe.isolationEnveloppe },
          ].map(({ icon: Icon, label, value }) => {
            const b = isolationBadge(value)
            return (
              <div key={label} className="flex items-center gap-3 py-2.5">
                <Icon className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-sm text-gray-600 flex-1">{label}</span>
                <span className="text-sm text-gray-500 hidden sm:block">{value || '—'}</span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${b.cls}`}>
                  {b.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ 5. SCENARIOS DE TRAVAUX (audit ADEME) ═══ */}
      {audits && audits.length > 0 && (
        <div className="px-6 py-5 border-b border-gray-100">
          <AuditScenarios audits={audits} />
        </div>
      )}

      {/* ═══ 6. EQUIPEMENTS (collapsible) ═══ */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
        >
          <SectionTitle icon={Flame}>Equipements & Fiche technique</SectionTitle>
          {showTechnical ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showTechnical && (
          <div className="px-6 pb-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 animate-fade-in">
            {/* Chauffage */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Chauffage</p>
              <div className="space-y-1.5 text-sm">
                {dpe.installationChauffage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Installation</span>
                    <span className="font-medium text-gray-700 text-right max-w-[60%]">{dpe.installationChauffage}</span>
                  </div>
                )}
                {dpe.energieChauffage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Energie</span>
                    <span className="font-medium text-gray-700">{dpe.energieChauffage}</span>
                  </div>
                )}
                {dpe.generateurChauffage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Generateur</span>
                    <span className="font-medium text-gray-700 text-right max-w-[60%]">{dpe.generateurChauffage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ECS + Ventilation */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ECS & Ventilation</p>
              <div className="space-y-1.5 text-sm">
                {dpe.installationEcs && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Installation ECS</span>
                    <span className="font-medium text-gray-700 text-right max-w-[60%]">{dpe.installationEcs}</span>
                  </div>
                )}
                {dpe.energieEcs && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Energie ECS</span>
                    <span className="font-medium text-gray-700">{dpe.energieEcs}</span>
                  </div>
                )}
                {dpe.typeVentilation && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ventilation</span>
                    <span className="font-medium text-gray-700 text-right max-w-[60%]">{dpe.typeVentilation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Batiment details */}
            <div className="md:col-span-2 mt-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Generalites</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {dpe.surface && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-gray-400">Surface</p>
                    <p className="font-semibold text-gray-700">{dpe.surface} m²</p>
                  </div>
                )}
                {dpe.nombreNiveaux && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-gray-400">Niveaux</p>
                    <p className="font-semibold text-gray-700">{dpe.nombreNiveaux}</p>
                  </div>
                )}
                {dpe.nombreAppartements && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-gray-400">Appartements</p>
                    <p className="font-semibold text-gray-700">{dpe.nombreAppartements}</p>
                  </div>
                )}
                {dpe.surfaceImmeuble && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-gray-400">Surf. immeuble</p>
                    <p className="font-semibold text-gray-700">{dpe.surfaceImmeuble} m²</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 6. INSIGHTS COMMERCIAL ═══ */}
      <div className="px-6 py-5">
        <InsightsCommercial dpe={dpe} />
      </div>
    </div>
  )
}
