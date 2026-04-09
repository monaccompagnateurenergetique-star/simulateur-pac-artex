import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Users, Home, Zap, Euro, TrendingUp, ChevronDown, Eye, EyeOff,
  SlidersHorizontal, Info, AlertTriangle, Check, X, Gift
} from 'lucide-react'
import { BAR_TH_171 } from '../../lib/constants/barTh171'
import { ZONE_OPTIONS } from '../../lib/constants/zones'
import { MPR_GRANTS, MAX_AID_PERCENTAGE } from '../../lib/constants/mpr'
import { calculateBarTh171 } from '../../lib/calculators/barTh171'
import { computeCommercialStrategy } from '../../lib/commercial'
import { getPrecariteFromRFR, PRECARITE_LABELS } from '../../lib/precarite'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { formatCurrency, formatKWhc } from '../../utils/formatters'
import SimulationSaveBar from '../../components/simulator/SimulationSaveBar'

/* ─── Micro-composants v2 ─── */
function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--color-surface)] rounded-[var(--radius)] border border-[var(--color-border)] shadow-[var(--shadow-xs)] ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-brand-50)] flex items-center justify-center">
        <Icon className="w-[18px] h-[18px] text-[var(--color-brand-600)]" />
      </div>
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-text)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
      </div>
    </div>
  )
}

function FieldLabel({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">{children}</label>
}

function Input({ label, id, value, onChange, type = 'number', suffix, helper, ...rest }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          type={type} id={id} value={value}
          onChange={(e) => {
            const v = e.target.value
            if (type === 'number') { onChange(v === '' ? '' : parseFloat(v) || 0) }
            else onChange(v)
          }}
          className={`w-full pl-3 ${suffix ? 'pr-14' : 'pr-3'} py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-artex-green)]/30 focus:border-[var(--color-brand-600)] transition`}
          {...rest}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-muted)]">{suffix}</span>
        )}
      </div>
      {helper && <p className="text-[11px] text-[var(--color-muted)] mt-1">{helper}</p>}
    </div>
  )
}

function Select({ label, id, value, onChange, options, helper }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-artex-green)]/30 focus:border-[var(--color-brand-600)] transition appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {helper && <p className="text-[11px] text-[var(--color-muted)] mt-1">{helper}</p>}
    </div>
  )
}

function Toggle({ options, value, onChange, size = 'md', ariaLabel }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
  return (
    <div className="inline-flex p-1 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-sm)] gap-0.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map(o => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`${pad} rounded-[6px] font-semibold transition-all duration-200 ${
            value === o.value
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-xs)] scale-[1.02]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text-secondary)] active:scale-95'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function PrecariteBadge({ category }) {
  const info = PRECARITE_LABELS[category]
  if (!info) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-full)] text-xs font-bold"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
      {category} — {info.label}
    </span>
  )
}

/* ─── Page BAR-TH-171 v2 ─── */
export default function BarTh171Page() {
  const { getDefault, getDealPrice, minCeePercent } = useSimulatorContext('BAR-TH-171')

  // Bénéficiaire
  const [precariteMode, setPrecariteMode] = useState('direct')
  const [mprCategoryDirect, setMprCategoryDirectRaw] = useState(() => getDefault('mprCategory', 'Bleu'))
  const [nbPersonnes, setNbPersonnes] = useState(3)
  const [rfr, setRfr] = useState(25000)
  const [isIdf, setIsIdf] = useState(false)
  const [isPrimaryResidence, setIsPrimaryResidence] = useState(true)

  // Sync deal price on MPR category change (v1 feature)
  function setMprCategoryDirect(cat) {
    setMprCategoryDirectRaw(cat)
    const price = getDealPrice(cat)
    if (price != null) setPriceMWh(price)
  }

  // Logement
  const [housingType, setHousingType] = useState(() => getDefault('housingType', 'Maison'))
  const [surface, setSurface] = useState(() => getDefault('surface', 100))
  const [zone, setZone] = useState(() => getDefault('zone', 'H1'))

  // Technique
  const [etas, setEtas] = useState(() => getDefault('etas', 'high'))
  const [priceMWh, setPriceMWh] = useState(() => getDefault('priceMWh', 7.5))

  // Financier
  const [projectCost, setProjectCost] = useState(() => getDefault('projectCost', 12000))
  const [ceePercent, setCeePercent] = useState(() => getDefault('ceePercent', 100))
  const [showInstallateur, setShowInstallateur] = useState(false)
  const [showEdfModal, setShowEdfModal] = useState(false)
  const [offreUnEuro, setOffreUnEuro] = useState(false)
  const savedCeePercent = useRef(null)

  // Calcul précarité
  const mprCategory = precariteMode === 'direct'
    ? mprCategoryDirect
    : getPrecariteFromRFR(nbPersonnes, rfr, isIdf)

  // CEE
  const ceeResult = useMemo(
    () => calculateBarTh171({ type: housingType, surface, etas, zone, priceMWh }),
    [housingType, surface, etas, zone, priceMWh]
  )

  const ceeEurosBase = isPrimaryResidence ? ceeResult.ceeEuros : 0
  const volumeCEE = isPrimaryResidence ? ceeResult.volumeCEE : 0

  // MPR
  const mprGrants = MPR_GRANTS['bar-th-171'] || {}
  const mprGrantTheorique = mprGrants[mprCategory] || 0

  // Prime EDF "Je passe à l'électrique" — 1 000 € forfait
  // Éligible si : profil Bleu/Jaune + remplacement gaz/fioul → PAC air/eau (BAR-TH-171 = toujours PAC air/eau)
  const isEdfEligible = isPrimaryResidence && (mprCategory === 'Bleu' || mprCategory === 'Jaune')
  const PRIME_EDF = 1000

  // Commercial
  const commercial = useMemo(() => computeCommercialStrategy({
    ceeEurosBase,
    ceePercentApplied: Math.max(ceePercent, minCeePercent || 0),
    mprCategory,
    mprGrantTheorique,
    projectCost,
    maxEligibleCost: 12000,
  }), [ceeEurosBase, ceePercent, mprCategory, mprGrantTheorique, projectCost, minCeePercent])

  // Offre à 1€ : optimise CEE/MPR puis l'installateur prend en charge le RAC restant
  const priseEnChargeRAC = offreUnEuro ? Math.max(commercial.resteACharge - 1, 0) : 0
  const racFinal = offreUnEuro ? Math.min(commercial.resteACharge, 1) : commercial.resteACharge
  const totalAidFinal = offreUnEuro ? commercial.totalAid + priseEnChargeRAC : commercial.totalAid

  function toggleOffreUnEuro() {
    if (!offreUnEuro) {
      // ON → sauvegarder le % actuel, puis optimiser CEE/MPR
      savedCeePercent.current = ceePercent
      if (optimalCeePercent !== null && optimalCeePercent < 100) {
        setCeePercent(optimalCeePercent)
      }
      setOffreUnEuro(true)
    } else {
      // OFF → restaurer le % précédent
      if (savedCeePercent.current !== null) {
        setCeePercent(savedCeePercent.current)
        savedCeePercent.current = null
      }
      setOffreUnEuro(false)
    }
  }

  const isIneligible = !isPrimaryResidence

  // Calcul du % CEE optimal
  const optimalCeePercent = useMemo(() => {
    if (!ceeEurosBase || !mprGrantTheorique || mprCategory === 'Rose') return null
    const maxAidPct = MAX_AID_PERCENTAGE[mprCategory] || 0
    const eligibleExpense = Math.min(projectCost, 12000)
    const maxTotalAid = eligibleExpense * maxAidPct
    const maxCee = maxTotalAid - mprGrantTheorique
    if (maxCee <= 0) return 0
    const pct = Math.floor((maxCee / ceeEurosBase) * 100)
    return Math.max(minCeePercent || 0, Math.min(100, pct))
  }, [ceeEurosBase, mprGrantTheorique, mprCategory, projectCost, minCeePercent])

  const optimizedResult = useMemo(() => {
    if (optimalCeePercent === null) return null
    return computeCommercialStrategy({
      ceeEurosBase,
      ceePercentApplied: optimalCeePercent,
      mprCategory,
      mprGrantTheorique,
      projectCost,
      maxEligibleCost: 12000,
    })
  }, [optimalCeePercent, ceeEurosBase, mprCategory, mprGrantTheorique, projectCost])

  function handleOptimize() {
    if (optimalCeePercent !== null) setCeePercent(optimalCeePercent)
  }

  const effectiveMin = minCeePercent || 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Nav retour */}
      <Link
        to="/simulations"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-brand-600)] transition mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour au catalogue
      </Link>

      {/* Header */}
      <div className="bg-[var(--color-artex-primary)] rounded-t-[var(--radius-lg)] px-6 py-5">
        <p className="text-[var(--color-muted)] text-[11px] font-mono uppercase tracking-[0.15em] mb-1">BAR-TH-171</p>
        <h1 className="text-xl font-bold text-white">Pompe à chaleur air/eau</h1>
        <p className="text-sm text-gray-400 mt-0.5">CEE + MaPrimeRénov' — Simulation rapide</p>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-surface)] rounded-b-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-t-0 border-[var(--color-border)]">
        <div className="p-6 space-y-6">

          {/* ─── ROW 1 : Bénéficiaire + Logement ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bénéficiaire */}
            <Card className="p-5">
              <SectionHeader icon={Users} title="Bénéficiaire" subtitle="Profil de revenus du ménage" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">Résidence principale</span>
                  <Toggle
                    options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]}
                    value={isPrimaryResidence}
                    onChange={setIsPrimaryResidence}
                    size="sm"
                  />
                </div>

                {!isPrimaryResidence && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Non éligible aux aides CEE et MaPrimeRénov'.</span>
                  </div>
                )}

                <div>
                  <FieldLabel>Mode de détermination</FieldLabel>
                  <Toggle
                    options={[
                      { value: 'direct', label: 'Choix direct' },
                      { value: 'auto', label: 'Revenus fiscaux' },
                    ]}
                    value={precariteMode}
                    onChange={setPrecariteMode}
                    size="sm"
                  />
                </div>

                {precariteMode === 'direct' ? (
                  <Select
                    label="Catégorie de revenus"
                    id="mprCategory"
                    value={mprCategoryDirect}
                    onChange={setMprCategoryDirect}
                    options={[
                      { value: 'Bleu', label: 'Bleu — Très modestes' },
                      { value: 'Jaune', label: 'Jaune — Modestes' },
                      { value: 'Violet', label: 'Violet — Intermédiaires' },
                      { value: 'Rose', label: 'Rose — Supérieurs' },
                    ]}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Personnes au foyer" id="nbPersonnes" value={nbPersonnes} onChange={setNbPersonnes} min={1} max={10} />
                      <Input label="RFR (€)" id="rfr" value={rfr} onChange={setRfr} min={0} suffix="€" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[var(--color-text-secondary)]">Île-de-France</span>
                      <Toggle
                        options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]}
                        value={isIdf}
                        onChange={setIsIdf}
                        size="sm"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PrecariteBadge category={mprCategory} />
                    {isEdfEligible && (
                      <button
                        onClick={() => setShowEdfModal(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        Prime EDF +{formatCurrency(PRIME_EDF)}
                      </button>
                    )}
                  </div>
                  {mprGrantTheorique > 0 && (
                    <p className="text-[11px] text-[var(--color-muted)] mt-1.5">
                      MPR forfaitaire : <span className="font-semibold text-[var(--color-text)]">{formatCurrency(mprGrantTheorique)}</span>
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Logement */}
            <Card className="p-5">
              <SectionHeader icon={Home} title="Logement" subtitle="Caractéristiques du bien" />

              <div className="space-y-4">
                <div>
                  <FieldLabel>Type de logement</FieldLabel>
                  <Toggle
                    options={[
                      { value: 'Maison', label: 'Maison' },
                      { value: 'Appartement', label: 'Appartement' },
                    ]}
                    value={housingType}
                    onChange={setHousingType}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Surface chauffée" id="surface" value={surface} onChange={setSurface} min={1} suffix="m²" />
                  <Select label="Zone climatique" id="zone" value={zone} onChange={setZone} options={ZONE_OPTIONS} />
                </div>

                <Select
                  label="Efficacité énergétique (Etas)"
                  id="etas"
                  value={etas}
                  onChange={setEtas}
                  options={BAR_TH_171.ETAS_OPTIONS}
                />
              </div>
            </Card>
          </div>

          {/* ─── Stratégie financière ─── */}
          {!isIneligible && (
            <Card className="p-5">
              <SectionHeader icon={Euro} title="Stratégie financière" subtitle="Coût projet et répartition des aides" />

              <div className="space-y-5">
                {/* CEE négociée */}
                <div className="flex items-center justify-between p-3 bg-[var(--color-brand-50)] rounded-[var(--radius-sm)] border border-[var(--color-brand-100)]">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-[var(--color-brand-600)]" />
                    <span className="text-sm font-semibold text-[var(--color-text)]">CEE négociée</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-extrabold text-[var(--color-brand-600)] tabular-nums">{formatCurrency(ceeEurosBase)}</span>
                    <span className="text-xs text-[var(--color-muted)] tabular-nums">{formatKWhc(volumeCEE)}</span>
                  </div>
                </div>

                {/* Inputs: Coût + Prix CEE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Coût total TTC du projet"
                    id="projectCost"
                    value={projectCost}
                    onChange={setProjectCost}
                    min={0}
                    suffix="€ TTC"
                    helper={`Plafond éligible : 12 000 € — Max aide ${Math.round((MAX_AID_PERCENTAGE[mprCategory] || 0) * 100)}%`}
                  />
                  <Input
                    label="Prix CEE négocié"
                    id="priceMWh"
                    value={priceMWh}
                    onChange={setPriceMWh}
                    step={0.1}
                    suffix="€/MWhc"
                    helper="Prix de rachat par MWhc cumac"
                  />
                </div>

                {/* Slider CEE % */}
                <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border border-[var(--color-border-light)]">
                  <div className="flex items-center justify-between mb-3">
                    <FieldLabel>CEE appliquée sur le devis</FieldLabel>
                    <span className="text-xl font-extrabold text-[var(--color-brand-600)] tabular-nums">{ceePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={effectiveMin} max={100}
                    value={Math.max(ceePercent, effectiveMin)}
                    onChange={(e) => setCeePercent(Math.max(parseInt(e.target.value), effectiveMin))}
                    disabled={offreUnEuro}
                    aria-label="Pourcentage CEE appliqué au devis"
                    className={`w-full h-2 rounded-full appearance-none ${offreUnEuro ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      background: (() => {
                        const pct = effectiveMin < 100 ? ((ceePercent - effectiveMin) / (100 - effectiveMin)) * 100 : 0
                        return `linear-gradient(to right, var(--color-artex-green) 0%, var(--color-artex-green) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`
                      })(),
                    }}
                  />
                  {offreUnEuro && (
                    <p className="text-[10px] text-[var(--color-brand-600)] font-medium mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Optimisé automatiquement par l'offre à 1 €
                    </p>
                  )}
                  <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1.5">
                    <span>{effectiveMin > 0 ? `${effectiveMin}% (Min contrat)` : '0% — Max marge'}</span>
                    {optimalCeePercent !== null && optimalCeePercent < 100 && (
                      <span className="text-[var(--color-warning)] font-semibold">▼ Optimal : {optimalCeePercent}%</span>
                    )}
                    <span>100% — Max aide client</span>
                  </div>

                  {/* Preview sous le slider */}
                  <div className="mt-4 pt-3 border-t border-[var(--color-border-light)]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                      <div className="flex flex-col">
                        <span className="text-[var(--color-muted)] text-[10px]">CEE client</span>
                        <span className="font-bold text-[var(--color-brand-600)]">{formatCurrency(commercial.ceeCommerciale)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[var(--color-muted)] text-[10px]">MPR</span>
                        <span className={`font-bold ${commercial.isCeilingExceeded ? 'text-[var(--color-warning)]' : 'text-sky-500'}`}>{formatCurrency(commercial.mprFinal)}</span>
                      </div>
                      {showInstallateur && (
                        <div className="flex flex-col">
                          <span className="text-[var(--color-muted)] text-[10px]">Marge installateur</span>
                          <span className="font-bold text-[var(--color-danger)]">{formatCurrency(commercial.ceeMargin)}</span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[var(--color-muted)] text-[10px]">Total aides</span>
                        <span className="font-bold text-[var(--color-text)]">{formatCurrency(commercial.totalAid)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInstallateur(!showInstallateur)}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-text-secondary)] transition"
                      title={showInstallateur ? 'Masquer part installateur' : 'Voir part installateur'}
                    >
                      {showInstallateur ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showInstallateur ? 'Masquer marge' : 'Voir marge installateur'}
                    </button>
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* ─── Bloc Actions : Plafond + Offre 1€ ─── */}
          {!isIneligible && (commercial.isCeilingExceeded || commercial.resteACharge > 1) && (
            <div className="rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">

              {/* Alerte plafond — compacte */}
              {commercial.isCeilingExceeded && optimalCeePercent !== null && optimalCeePercent !== ceePercent && optimizedResult && (() => {
                const gainTotal = (optimizedResult.mprFinal - commercial.mprFinal) + (optimizedResult.ceeMargin - commercial.ceeMargin)
                return (
                  <div className="p-4 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)]">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AlertTriangle className="w-5 h-5 text-[var(--color-warning)] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--color-text)]">
                            Vous perdez {formatCurrency(mprGrantTheorique - commercial.mprFinal)} de MPR
                          </p>
                          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                            Plafond {Math.round(commercial.maxAidPercentage * 100)}% dépassé — optimisez à {optimalCeePercent}% pour gagner <span className="font-bold text-[var(--color-brand-600)]">{formatCurrency(gainTotal)} de marge supplémentaire</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleOptimize}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700,#5fa313)] text-white text-xs font-bold rounded-[var(--radius-sm)] transition shadow-sm shrink-0"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{formatCurrency(gainTotal)} — Optimiser
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Bandeau confirmation optimisation */}
              {commercial.isCeilingExceeded && optimalCeePercent !== null && optimalCeePercent === ceePercent && (
                <div className="px-4 py-2.5 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
                  <span className="text-xs text-[var(--color-muted)]">Plafond {Math.round(commercial.maxAidPercentage * 100)}% — MPR réduite à {formatCurrency(commercial.mprFinal)}</span>
                </div>
              )}

              {!commercial.isCeilingExceeded && optimalCeePercent !== null && optimalCeePercent === ceePercent && (
                <div className="px-4 py-2.5 bg-[var(--color-brand-50)] border-b border-[var(--color-brand-100)] flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--color-brand-600)] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--color-brand-700,#4a7a0f)]">Répartition optimisée — CEE et MPR maximisés</span>
                </div>
              )}

              {/* Offre à 1€ */}
              {commercial.resteACharge > 1 && (
                <div className={`p-4 transition-colors ${offreUnEuro ? 'bg-[var(--color-brand-50)]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${offreUnEuro ? 'bg-[var(--color-brand-600)] text-white' : 'bg-[var(--color-surface-tertiary)] text-[var(--color-muted)]'}`}>
                        <Euro className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[13px] font-bold text-[var(--color-text)]">Offre à 1 €</span>
                        <p className="text-[11px] text-[var(--color-muted)]">
                          {offreUnEuro
                            ? <>CEE {ceePercent}% + installateur prend en charge <strong>{formatCurrency(priseEnChargeRAC)}</strong></>
                            : 'Optimise CEE/MPR + prise en charge du RAC'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleOffreUnEuro}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${offreUnEuro ? 'bg-[var(--color-brand-600)]' : 'bg-[var(--color-border)]'}`}
                      aria-label="Activer l'offre à 1 euro"
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${offreUnEuro ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Synthèse financière ─── */}
          {!isIneligible && (
            <>
              <div className="bg-[var(--color-artex-primary)] rounded-[var(--radius)] p-6 shadow-[var(--shadow-md)] animate-result-pop">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-artex-green)]/60 uppercase tracking-wider mb-1">CEE</p>
                    <p className="text-2xl font-extrabold text-[var(--color-artex-green)]">{formatCurrency(commercial.ceeCommerciale)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-sky-400/60 uppercase tracking-wider mb-1">MPR</p>
                    <p className="text-2xl font-extrabold text-sky-400">{formatCurrency(commercial.mprFinal)}</p>
                  </div>
                </div>

                <div className="h-px bg-white/10 my-5" />

                {/* TOTAL AIDES = CEE + MPR uniquement */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">TOTAL AIDES</span>
                    {isEdfEligible && (
                      <button
                        onClick={() => setShowEdfModal(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 transition-colors cursor-pointer"
                      >
                        <Gift className="w-3 h-3" />
                        +{formatCurrency(PRIME_EDF)} EDF
                      </button>
                    )}
                  </div>
                  <span className="text-3xl font-extrabold text-[var(--color-artex-green)]">{formatCurrency(commercial.totalAid)}</span>
                </div>

                {/* RESTE À CHARGE sans offre 1€ */}
                {!offreUnEuro && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                    <span className="text-sm font-medium text-gray-300">RESTE À CHARGE</span>
                    <span className="text-2xl font-extrabold text-white">{formatCurrency(commercial.resteACharge)}</span>
                  </div>
                )}

                {/* Bloc Offre à 1€ — séparé et clair */}
                {offreUnEuro && priseEnChargeRAC > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-3">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-artex-green)]">Offre à 1 €</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Coût du projet</span>
                          <span className="font-semibold text-white">{formatCurrency(projectCost)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Aides (CEE + MPR)</span>
                          <span className="font-semibold text-[var(--color-artex-green)]">− {formatCurrency(commercial.totalAid)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
                          <span className="text-gray-400">Reste à charge initial</span>
                          <span className="font-semibold text-orange-400">{formatCurrency(commercial.resteACharge)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Prise en charge installateur</span>
                          <span className="font-semibold text-amber-400">− {formatCurrency(priseEnChargeRAC)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-[var(--color-artex-green)]/30">
                        <span className="text-sm font-bold text-white">RESTE À CHARGE</span>
                        <span className="text-3xl font-black text-[var(--color-artex-green)]">1 €</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Barre de répartition */}
                <div className="mt-5">
                  <div className="h-2.5 rounded-full overflow-hidden bg-white/10 flex">
                    {commercial.ceeCommerciale > 0 && (
                      <div className="h-full bg-[var(--color-artex-green)] transition-all duration-500" style={{ width: `${(commercial.ceeCommerciale / projectCost) * 100}%` }} />
                    )}
                    {commercial.mprFinal > 0 && (
                      <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: `${(commercial.mprFinal / projectCost) * 100}%` }} />
                    )}
                    {offreUnEuro && priseEnChargeRAC > 0 && (
                      <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(priseEnChargeRAC / projectCost) * 100}%` }} />
                    )}
                    {racFinal > 0 && !offreUnEuro && (
                      <div className="h-full bg-orange-400 transition-all duration-500" style={{ width: `${(racFinal / projectCost) * 100}%` }} />
                    )}
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] font-medium">
                    <span className="text-[var(--color-artex-green)]">CEE {Math.round((commercial.ceeCommerciale / projectCost) * 100)}%</span>
                    {commercial.mprFinal > 0 && <span className="text-sky-300">MPR {Math.round((commercial.mprFinal / projectCost) * 100)}%</span>}
                    {offreUnEuro && priseEnChargeRAC > 0 && <span className="text-amber-300">Installateur {Math.round((priseEnChargeRAC / projectCost) * 100)}%</span>}
                    {!offreUnEuro && <span className="text-orange-300">RAC {Math.round((commercial.resteACharge / projectCost) * 100)}%</span>}
                    {offreUnEuro && <span className="text-white/70">RAC 1 €</span>}
                  </div>
                </div>
              </div>

              {/* Détail — collapsible */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-text-secondary)] transition select-none py-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Voir le détail de la répartition
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 ml-auto" />
                </summary>
                <Card className="p-4 mt-2">
                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden text-[13px]">
                    <div className="flex justify-between px-4 py-2.5 bg-[var(--color-surface-secondary)]">
                      <span className="text-[var(--color-text-secondary)]">CEE négociée (base)</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(ceeEurosBase)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 border-t border-[var(--color-border-light)]">
                      <span className="text-[var(--color-text-secondary)]">CEE client ({ceePercent}%)</span>
                      <span className="font-bold text-[var(--color-brand-600)] tabular-nums">{formatCurrency(commercial.ceeCommerciale)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 border-t border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
                      <span className="text-[var(--color-text-secondary)]">CEE installateur ({Math.round(commercial.ceeMarginPercent)}%)</span>
                      <span className="font-bold text-[var(--color-danger)] tabular-nums">{formatCurrency(commercial.ceeMargin)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 border-t border-[var(--color-border)]">
                      <span className="text-[var(--color-text-secondary)]">MaPrimeRénov'</span>
                      <span className="font-bold text-[var(--color-success)] tabular-nums">{formatCurrency(commercial.mprFinal)}</span>
                    </div>
                    {offreUnEuro && priseEnChargeRAC > 0 && (
                      <div className="flex justify-between px-4 py-2.5 border-t border-[var(--color-border-light)] bg-[var(--color-brand-50)]">
                        <span className="text-[var(--color-brand-700)] font-medium">Prise en charge installateur (offre 1 €)</span>
                        <span className="font-bold text-[var(--color-brand-600)] tabular-nums">{formatCurrency(priseEnChargeRAC)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface-tertiary)]">
                      <span className="font-bold text-[var(--color-text)]">Revenu total (aides + installateur)</span>
                      <span className="font-extrabold text-[var(--color-text)] tabular-nums">{formatCurrency(commercial.totalAid + commercial.ceeMargin)}</span>
                    </div>
                  </div>
                </Card>
              </details>
            </>
          )}

          {/* Save & PDF */}
          {!isIneligible && (
            <SimulationSaveBar
              type="BAR-TH-171"
              title={`PAC Air/Eau — ${housingType} ${surface}m² ${zone}`}
              inputs={{ housingType, surface, zone, etas, priceMWh, projectCost, mprCategory, ceePercent }}
              results={{ ceeEurosBase, volumeCEE, projectCost, ...commercial }}
              pdfData={{
                ficheCode: 'BAR-TH-171',
                ficheTitle: 'Simulateur Aides PAC Air/Eau',
                params: [
                  { label: 'Type de logement', value: housingType },
                  { label: 'Surface chauffée', value: `${surface} m²` },
                  { label: 'Zone climatique', value: zone },
                  { label: 'Efficacité (Etas)', value: etas === 'high' ? '≥ 140%' : '111% à 140%' },
                  { label: 'Prix CEE', value: `${priceMWh} €/MWhc` },
                  { label: 'Profil revenus', value: mprCategory },
                ],
                results: [
                  { label: 'Volume CEE', value: formatKWhc(volumeCEE) },
                  { label: 'Valeur CEE (Base 100%)', value: formatCurrency(ceeEurosBase) },
                  { label: 'MPR forfaitaire', value: formatCurrency(mprGrantTheorique) },
                ],
                summary: {
                  projectCost,
                  ceeCommerciale: commercial.ceeCommerciale,
                  mprFinal: commercial.mprFinal,
                  totalAid: commercial.totalAid,
                  resteACharge: commercial.resteACharge,
                },
                margin: {
                  ceeBase: ceeEurosBase,
                  ceeApplied: commercial.ceeCommerciale,
                  margin: commercial.ceeMargin,
                  marginPercent: commercial.ceeMarginPercent,
                  showOnPdf: false,
                },
              }}
            />
          )}

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-[var(--color-muted)] pt-2 border-t border-[var(--color-border-light)]">
            Simulation basée sur la fiche CEE BAR-TH-171 (Arrêté du 15/12/2025) et la réglementation MPR. Montants indicatifs.
          </p>
        </div>
      </div>

      {/* Modal Prime EDF */}
      {showEdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowEdfModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Prime EDF — « Je passe à l'électrique »</h3>
                  <p className="text-xs text-gray-500">Bonus cumulable avec CEE + MaPrimeRénov'</p>
                </div>
              </div>
              <button onClick={() => setShowEdfModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Montant */}
              <div className="text-center py-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-extrabold text-blue-700">{formatCurrency(PRIME_EDF)}</p>
                <p className="text-sm text-blue-600 mt-1">Forfait unique par logement</p>
              </div>

              {/* Conditions */}
              <div>
                <h4 className="text-[13px] font-semibold text-gray-900 mb-2">Conditions d'éligibilité</h4>
                <ul className="space-y-2 text-[13px] text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Ménage aux <strong>revenus modestes ou très modestes</strong> (profil Bleu ou Jaune MaPrimeRénov')</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Installation d'une <strong>PAC air/eau ou eau/eau</strong> (PAC air/air exclue)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>En remplacement d'une chaudière <strong>gaz ou fioul</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Logement en <strong>France métropolitaine</strong> continentale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Installation par un <strong>artisan RGE</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Accessible <strong>quel que soit votre fournisseur</strong> d'énergie</span>
                  </li>
                </ul>
              </div>

              {/* Calendrier */}
              <div>
                <h4 className="text-[13px] font-semibold text-gray-900 mb-2">Calendrier & limites</h4>
                <ul className="space-y-1.5 text-[13px] text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    Devis signé <strong>après le 8 avril 2026</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    Travaux terminés <strong>avant le 31 décembre 2027</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    Limité aux <strong>80 000 premiers dossiers</strong> (premiers arrivés, premiers servis)
                  </li>
                </ul>
              </div>

              {/* Note */}
              {/* Cumul */}
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-[12px] text-green-800">
                  <strong>Cumulable</strong> avec MaPrimeRénov' et la prime Coup de Pouce CEE. Plan EDF de 240 M€ pour accélérer le remplacement des chaudières fossiles.
                </p>
              </div>

              {/* Note */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[12px] text-amber-800">
                  Ce montant n'est <strong>pas intégré</strong> au calcul du simulateur — information purement indicative. Inscription sur <a href="https://www.jepassealelectrique.fr" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-900">jepassealelectrique.fr</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
