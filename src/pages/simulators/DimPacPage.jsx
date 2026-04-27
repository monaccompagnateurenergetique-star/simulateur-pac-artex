import { useState, useMemo } from 'react'
import {
  Home, Building, Flame, Droplet, Cog, Zap, HelpCircle,
  Thermometer, MapPin, Hammer, ThermometerSnowflake, Wrench,
  Check, X, CheckCircle2, XCircle, AlertTriangle, Info, Bolt, Gauge,
  Leaf, Sprout, Castle, Warehouse, Factory, Building2, HousePlus,
  Triangle, Square, Layers, RectangleVertical, DoorClosed, ArrowDownUp, Fan,
  Minus, Grid3x3, SquareDashed, FlaskConical,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'
import { PAC_SIZING, DEFAULT_INSULATION } from '../../lib/constants/dimPac'
import {
  ZONE_DETAIL_OPTIONS, getZoneFromPostalCode,
} from '../../lib/constants/zones'
import { calculatePacSizing } from '../../lib/calculators/dimPac'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { searchAddress, fetchAltitude } from '../../lib/services/geolocation'
import { deptFromPostalCode } from '../../lib/services/tBaseLookup'

/* ─── Icon mapping (Lucide) ─── */
const LUCIDE_ICONS = {
  Home, Building, Flame, Droplet, Cog, Zap, HelpCircle,
  Thermometer, MapPin, Hammer, ThermometerSnowflake, Wrench,
  Check, X, CheckCircle2, XCircle, AlertTriangle, Info, Bolt, Gauge,
  Leaf, Sprout, Castle, Warehouse, Factory, Building2, HousePlus,
  Triangle, Square, Layers, RectangleVertical, DoorClosed, ArrowDownUp, Fan,
  Minus, Grid3x3, SquareDashed, FlaskConical,
}
function LucideByName({ name, className, style }) {
  const C = LUCIDE_ICONS[name] ?? HelpCircle
  return <C className={className} style={style} />
}

/* ─── Composants UI (Tailwind) ─── */
function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--color-surface)] rounded-[var(--radius)] border border-[var(--color-border)] shadow-[var(--shadow-xs)] p-5 md:p-6 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ iconEl, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-brand-50)] flex items-center justify-center shrink-0 text-[var(--color-brand-600)]">
        {iconEl}
      </div>
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
      </div>
    </div>
  )
}

function FieldLabel({ children }) {
  return <span className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">{children}</span>
}

function NumberInput({ value, onChange, suffix, min, max, step = 1, placeholder }) {
  return (
    <div className="relative">
      <input
        type="number"
        min={min} max={max} step={step}
        value={value}
        placeholder={placeholder}
        onChange={e => {
          const v = e.target.value
          onChange(v === '' ? '' : (parseFloat(v) || 0))
        }}
        className={`w-full pl-3 ${suffix ? 'pr-14' : 'pr-3'} py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-artex-green)]/30 focus:border-[var(--color-brand-600)] transition`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-muted)]">{suffix}</span>
      )}
    </div>
  )
}

function TextInput({ value, onChange, suffix, maxLength, placeholder, suffixIcon }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full pl-3 ${suffix || suffixIcon ? 'pr-10' : 'pr-3'} py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-artex-green)]/30 focus:border-[var(--color-brand-600)] transition`}
      />
      {suffixIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{suffixIcon}</span>
      )}
      {suffix && !suffixIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-muted)]">{suffix}</span>
      )}
    </div>
  )
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-artex-green)]/30 focus:border-[var(--color-brand-600)] transition appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
  return (
    <div className="inline-flex p-1 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-sm)] gap-0.5">
      {options.map(o => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`${pad} rounded-[6px] font-semibold transition-all ${
            value === o.value
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-xs)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AlertBox({ variant = 'info', children }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    danger:  'bg-red-50 border-red-200 text-red-900',
  }
  const icons = {
    info: <Info className="w-4 h-4 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
    danger: <XCircle className="w-4 h-4 shrink-0 mt-0.5" />,
  }
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-[var(--radius-sm)] border text-xs ${styles[variant]}`}>
      {icons[variant]}
      <div className="flex-1">{children}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Page principale
   ══════════════════════════════════════════════════════════════ */
export default function DimPacPage() {
  // ─── Carte 1 : Localisation & Logement ──────────────────
  const [housingType, setHousingType] = useState('Maison')
  const [surface, setSurface] = useState(100)
  const [ceilingHeight, setCeilingHeight] = useState(2.5)
  const [nbEtages, setNbEtages] = useState(1)
  const [postalCode, setPostalCode] = useState('')
  const [zone, setZone] = useState('H1b')
  const [altitudeRange, setAltitudeRange] = useState('0_200')

  // Adresse + altitude auto-remplie (flux BAN → Open-Meteo)
  const [addressLabel, setAddressLabel] = useState('')
  const [altitudeM, setAltitudeM] = useState(100)
  const [altitudeSource, setAltitudeSource] = useState('default') // 'default' | 'auto' | 'manual'
  const [geoLoading, setGeoLoading] = useState(false)

  /** Met à jour le code postal + auto-détecte la zone climatique */
  const handlePostalCodeChange = (raw) => {
    const cleaned = raw.replace(/\D/g, '')
    setPostalCode(cleaned)
    if (cleaned.length === 5) {
      const detected = getZoneFromPostalCode(cleaned)
      if (detected) setZone(detected)
    }
  }

  /** Sélection depuis l'autocomplete BAN : déclenche altitude auto + CP + zone */
  const handleAddressSelected = async (addr) => {
    setAddressLabel(addr.label || '')
    if (addr.postalCode) handlePostalCodeChange(addr.postalCode)
    try {
      const results = await searchAddress(addr.label || `${addr.address} ${addr.postalCode} ${addr.city}`)
      const match = results[0]
      if (!match) return
      setGeoLoading(true)
      const alt = await fetchAltitude(match.lat, match.lon)
      setAltitudeM(alt.altitude)
      setAltitudeSource('auto')
    } catch (e) {
      console.warn('Altitude auto KO :', e)
    } finally {
      setGeoLoading(false)
    }
  }

  // ─── Carte 2 : Installation actuelle ────────────────────
  const [heatingSystem, setHeatingSystem] = useState('fioul')
  const [emitters, setEmitters] = useState(['radiateur_acier_alu'])
  const [includeEcs, setIncludeEcs] = useState(true)

  // ─── Carte 3 : Période de construction ──────────────────
  const [construction, setConstruction] = useState('1989_2000')

  // ─── Carte 4 : Rénovation + Isolation détaillée ─────────
  const [hasRenovation, setHasRenovation] = useState(null)
  const [insulation, setInsulation] = useState(DEFAULT_INSULATION)

  const toggleEmitter = (e) => {
    setEmitters(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }
  const setInsulationLevel = (key, value) => {
    setInsulation(prev => ({ ...prev, [key]: value }))
  }

  const effectiveInsulation = hasRenovation === 'oui' ? insulation : DEFAULT_INSULATION
  const dept = deptFromPostalCode(postalCode)

  const result = useMemo(
    () => calculatePacSizing({
      housingType,
      surface: typeof surface === 'number' ? surface : 100,
      ceilingHeight: typeof ceilingHeight === 'number' ? ceilingHeight : 2.5,
      nbEtages, zone,
      altitude: altitudeM,
      dept,
      indoorTemp: PAC_SIZING.DEFAULT_INDOOR_TEMP,
      construction, insulation: effectiveInsulation,
      heatingSystem, emitters, includeEcs,
    }),
    [housingType, surface, ceilingHeight, nbEtages, zone, altitudeM, dept, construction, effectiveInsulation, heatingSystem, emitters, includeEcs],
  )

  const zoneDetail = ZONE_DETAIL_OPTIONS.find(z => z.value === zone)
  const periodDef = PAC_SIZING.CONSTRUCTION_PERIODS.find(p => p.value === construction)
  const heatingDef = PAC_SIZING.HEATING_SYSTEMS.find(h => h.value === heatingSystem)

  // Pie chart data
  const pieData = result.deperditionsByCategory.map(c => ({
    name: c.label,
    value: +(c.watts / 1000).toFixed(2),
    color: c.color,
  }))

  return (
    <SimulatorLayout
      code="DIM-PAC"
      title="Dimensionnement PAC air/eau"
      description="Estimation de puissance par la méthode G améliorée"
    >

      {/* ══════════════════════════════════════════════════════════
           CARTE 1 : Localisation & Logement
           ══════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeader iconEl={<Home className="w-[18px] h-[18px]" />} title="Localisation & Logement" subtitle="Caractéristiques physiques du bâtiment" />

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Surface chauffée</FieldLabel>
              <NumberInput value={surface} onChange={setSurface} suffix="m²" min={10} />
            </div>
            <div>
              <FieldLabel>Hauteur sous plafond</FieldLabel>
              <NumberInput value={ceilingHeight} onChange={setCeilingHeight} suffix="m" min={2} max={5} step={0.1} />
            </div>
          </div>

          <div>
            <FieldLabel>Nombre d'étages</FieldLabel>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNbEtages(n)}
                  className={`flex-1 py-2.5 rounded-[var(--radius-sm)] border text-sm font-semibold transition ${
                    nbEtages === n
                      ? 'bg-[var(--color-brand-600)] border-[var(--color-brand-600)] text-white'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-600)]/40'
                  }`}
                >
                  {n === 5 ? '5+' : n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Adresse <span className="text-[11px] text-[var(--color-muted)] font-normal">(pré-remplit CP, altitude, T° base — optionnel)</span></FieldLabel>
            <AddressAutocomplete
              value={addressLabel}
              placeholder="ex: 16 rue du Bourg, 57510 Ernestviller"
              onChange={(a) => {
                if (a && a.label) handleAddressSelected(a)
                else { setAddressLabel(''); }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>
                Code postal
                {postalCode.length === 5 && !getZoneFromPostalCode(postalCode) && (
                  <span className="text-[11px] text-amber-600 font-normal ml-2">— CP non reconnu</span>
                )}
              </FieldLabel>
              <TextInput
                value={postalCode}
                onChange={handlePostalCodeChange}
                maxLength={5}
                placeholder="ex: 57510"
                suffixIcon={<MapPin className="w-4 h-4" />}
              />
            </div>
            <div>
              <FieldLabel>
                Altitude
                {altitudeSource === 'auto' && !geoLoading && (
                  <span className="text-[11px] text-green-700 font-normal ml-2">✓ auto</span>
                )}
                {geoLoading && (
                  <span className="text-[11px] text-blue-600 font-normal ml-2">… récupération</span>
                )}
              </FieldLabel>
              <NumberInput
                value={altitudeM}
                onChange={(v) => { setAltitudeM(typeof v === 'number' ? v : 0); setAltitudeSource('manual') }}
                suffix="m"
                min={0}
                max={3000}
                step={1}
              />
            </div>
          </div>

          {/* Badge T_base — source NF P 52-612 quand département connu */}
          <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-[var(--radius-sm)] bg-blue-50 border border-blue-200">
            <ThermometerSnowflake className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-blue-700">
                Température extérieure de base
                {result.tBaseSource?.standard && (
                  <span className="ml-1 normal-case text-blue-600/70">· {result.tBaseSource.standard}</span>
                )}
              </p>
              <p className="text-lg font-bold text-blue-700">{result.tBaseCorrigee.toFixed(1)}°C</p>
            </div>

            {result.tBaseSource?.standard === 'NF P 52-612' ? (
              <div className="flex flex-col px-3 border-x border-blue-200">
                <span className="text-[10px] uppercase tracking-wider text-blue-700">Département</span>
                <strong className="text-blue-700 text-sm">{result.tBaseSource.dept}</strong>
                <span className="text-[10px] text-blue-600/70 truncate max-w-[140px]">{result.tBaseSource.deptName}</span>
              </div>
            ) : zoneDetail && (
              <div className="flex flex-col items-center px-3 border-x border-blue-200">
                <span className="text-[10px] uppercase tracking-wider text-blue-700">Zone</span>
                <strong className="text-blue-700">{zoneDetail.value}</strong>
                <span className="text-[10px] text-blue-600/70">{zoneDetail.label.split(' — ')[1] ?? ''}</span>
              </div>
            )}

            {result.tBaseSource?.standard === 'NF P 52-612' && altitudeM > 0 && (
              <span className="text-[11px] text-blue-600/70 italic ml-auto">
                Base mer {result.tBaseSource.tBaseMer}°C · {altitudeM} m ({result.tBaseSource.bracket}) · correction −{Math.abs(result.altitudeCorrection).toFixed(0)}°C
              </span>
            )}
            {result.tBaseSource?.standard !== 'NF P 52-612' && altitudeM > 0 && (
              <span className="text-[11px] text-blue-600/70 italic ml-auto">
                Base {zoneDetail?.tBase}°C − altitude {result.altitudeCorrection.toFixed(1)}°C
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════
           CARTE 2 : Installation actuelle
           ══════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeader iconEl={<Flame className="w-[18px] h-[18px]" />} title="Installation actuelle" subtitle="Chauffage à déposer + émetteurs existants" />

        <div className="space-y-4">
          <div>
            <FieldLabel>Chauffage principal (à déposer)</FieldLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {PAC_SIZING.HEATING_SYSTEMS.map(h => {
                const active = heatingSystem === h.value
                return (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => setHeatingSystem(h.value)}
                    className={`relative flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border-2 transition text-left ${
                      active
                        ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-600)]/40'
                    }`}
                  >
                    <LucideByName name={h.iconName} className={`w-5 h-5 ${active ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-muted)]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{h.label}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">{h.subLabel}</p>
                    </div>
                    {h.eligibleBarTh171 && (
                      <span className="w-4 h-4 rounded-full bg-[var(--color-brand-600)] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <AlertBox variant={result.eligibleBarTh171 ? 'success' : 'warning'}>
            {result.barTh171Reason}
          </AlertBox>

          <div>
            <FieldLabel>Émetteurs de chaleur <span className="text-[11px] text-[var(--color-muted)] font-normal">(sélection multiple)</span></FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PAC_SIZING.EMITTERS.map(em => {
                const active = emitters.includes(em.value)
                return (
                  <button
                    key={em.value}
                    type="button"
                    onClick={() => toggleEmitter(em.value)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-[var(--radius-sm)] border-2 transition text-left ${
                      active
                        ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-600)]/40'
                    }`}
                  >
                    <LucideByName name={em.iconName} className={`w-4 h-4 ${active ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-muted)]'}`} />
                    <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">{em.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      em.mode === 'BT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {em.mode === 'BT' ? 'BT' : 'MT/HT'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <FieldLabel>ECS intégrée (eau chaude)</FieldLabel>
            <Toggle
              size="sm"
              options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]}
              value={includeEcs}
              onChange={setIncludeEcs}
            />
          </div>

          <AlertBox variant="info">
            {result.emitterMode === 'none'
              ? <>Sélectionnez au moins un émetteur.</>
              : <>Application <strong>{result.emitterMode === 'BT' ? 'basse température' : result.emitterMode === 'mixte' ? 'mixte' : 'moyenne/haute température'}</strong> — ETAS requise ≥ <strong>{Math.round(result.etasRequired * 100)}%</strong> @ {result.etasTempRef}°C</>
            }
          </AlertBox>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════
           CARTE 3 : Période de construction
           ══════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeader iconEl={<Hammer className="w-[18px] h-[18px]" />} title="Période de construction" subtitle="Détermine le G de base du bâtiment à l'époque" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PAC_SIZING.CONSTRUCTION_PERIODS.map(p => {
            const active = construction === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setConstruction(p.value)}
                className={`flex flex-col items-center gap-1.5 p-3.5 rounded-[var(--radius)] border-2 transition text-center ${
                  active
                    ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)] shadow-[0_2px_8px_rgba(132,204,22,0.2)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-600)]/40 hover:-translate-y-0.5'
                }`}
              >
                <LucideByName name={p.iconName} className={`w-7 h-7 ${active ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-muted)]'}`} />
                <p className="text-sm font-bold text-[var(--color-text)]">{p.label}</p>
                <p className="text-[11px] text-[var(--color-muted)] leading-tight">{p.subLabel}</p>
                <span className={`mt-0.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  active ? 'bg-[var(--color-brand-600)] text-white' : 'bg-blue-100 text-blue-700'
                }`}>
                  G = {p.gBase}
                </span>
              </button>
            )
          })}
        </div>

        {periodDef && (
          <div className="mt-4">
            <AlertBox variant="info">
              <strong>{periodDef.label}</strong> — {periodDef.subLabel}.
              G de base = <strong>{periodDef.gBase} W/m³·K</strong>. Intermittence ×{periodDef.intermittence}.
            </AlertBox>
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════════
           CARTE 4 : Rénovation + Isolation détaillée
           ══════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeader iconEl={<ThermometerSnowflake className="w-[18px] h-[18px]" />} title="Isolation détaillée par poste" subtitle="Ajustez l'état réel de chaque élément (le client a-t-il rénové ?)" />

        {/* Question initiale */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-[var(--radius)] bg-[var(--color-brand-50)] border border-[var(--color-brand-600)]/30">
          <div className="flex items-center gap-3 flex-1">
            <Wrench className="w-7 h-7 text-[var(--color-brand-600)] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">Le logement a-t-il été rénové depuis sa construction ?</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Isolation, fenêtres, VMC, portes… travaux réalisés par le client</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setHasRenovation('non')}
              className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] border-2 font-semibold text-sm transition ${
                hasRenovation === 'non'
                  ? 'bg-[var(--color-muted)] border-[var(--color-muted)] text-white'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-600)]/40'
              }`}
            >
              <X className="w-4 h-4" /> Non
            </button>
            <button
              type="button"
              onClick={() => setHasRenovation('oui')}
              className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] border-2 font-semibold text-sm transition ${
                hasRenovation === 'oui'
                  ? 'bg-[var(--color-brand-600)] border-[var(--color-brand-600)] text-white'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-600)]/40'
              }`}
            >
              <Check className="w-4 h-4" /> Oui
            </button>
          </div>
        </div>

        {hasRenovation === 'non' && (
          <div className="mt-4">
            <AlertBox variant="info">
              Aucune rénovation — calcul basé sur l'<strong>état d'origine</strong> de la période de construction
              (niveaux d'isolation moyens d'époque).
            </AlertBox>
          </div>
        )}

        {hasRenovation === null && (
          <div className="mt-4">
            <AlertBox variant="warning">
              Répondez à la question pour affiner le dimensionnement.
              La rénovation peut réduire les déperditions de 30 à 60%.
            </AlertBox>
          </div>
        )}

        {hasRenovation === 'oui' && (
          <>
            <div className="mt-4 space-y-2.5">
              {PAC_SIZING.INSULATION_CATEGORIES.map(cat => {
                const currentValue = insulation[cat.key]
                return (
                  <div key={cat.key} className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)]">
                    <div className="flex items-center gap-2.5">
                      <LucideByName name={cat.iconName} className="w-5 h-5 shrink-0" style={{ color: cat.color }} />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">{cat.label}</p>
                        <p className="text-[11px] text-[var(--color-muted)]">{(cat.share * 100).toFixed(0)}% des déperditions</p>
                      </div>
                    </div>
                    <div className="flex border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-border)]">
                      {cat.levels.map((level, idx) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setInsulationLevel(cat.key, level.value)}
                          title={level.subLabel || ''}
                          className={`flex-1 py-2 px-1.5 text-center transition ${
                            idx > 0 ? 'border-l border-[var(--color-border)]' : ''
                          } ${
                            currentValue === level.value
                              ? 'bg-[var(--color-brand-600)] text-white'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-50)]'
                          }`}
                        >
                          <span className="block text-[11px] font-semibold leading-tight">{level.label}</span>
                          {level.subLabel && (
                            <span className={`block text-[9px] leading-tight mt-0.5 font-normal ${
                              currentValue === level.value ? 'text-white/80' : 'text-[var(--color-muted)]'
                            }`}>
                              {level.subLabel}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* G summary */}
            <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)]">
              <div className="flex justify-between items-center px-3.5 py-2 bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)]">
                <span>G de base (période)</span>
                <strong className="text-sm text-[var(--color-text)]">{result.gBase.toFixed(2)} W/m³·K</strong>
              </div>
              <div className="flex justify-between items-center px-3.5 py-2 bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)]">
                <span>Ratio global isolation</span>
                <strong className={`text-sm ${result.ratioGlobal < 1 ? 'text-[var(--color-brand-600)]' : result.ratioGlobal > 1 ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
                  ×{result.ratioGlobal.toFixed(2)}
                </strong>
              </div>
              {housingType === 'Appartement' && (
                <div className="flex justify-between items-center px-3.5 py-2 bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)]">
                  <span>Correction appartement (×0.80)</span>
                  <em className="text-xs text-[var(--color-muted)]">appliquée</em>
                </div>
              )}
              <div className="flex justify-between items-center px-3.5 py-2 bg-blue-50 text-xs text-[var(--color-text-secondary)]">
                <span>G effectif</span>
                <strong className="text-base text-blue-700">{result.gEffectif.toFixed(2)} W/m³·K</strong>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════════
           CARTE 5 : Résultat du dimensionnement (dark)
           ══════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--color-artex-dark,#121212)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
          <Bolt className="w-5 h-5 text-[var(--color-artex-green,#84cc16)]" />
          <h2 className="text-lg font-bold text-gray-200">Résultat du dimensionnement</h2>
        </div>

        <div className="p-6 space-y-6">

          {/* Pie chart + Puissance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 text-center mb-3">Répartition des déperditions</p>
              <div className="relative h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="40%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#1f2937"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RTooltip
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value, name) => [`${value.toFixed(2)} kW`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-3xl font-bold text-[var(--color-artex-green,#84cc16)] leading-none">{result.deperditionsKw.toFixed(1)}</p>
                  <p className="text-[10px] uppercase text-gray-400 mt-1">kW</p>
                </div>
              </div>
              {/* Legend custom (à droite sous lg) */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {result.deperditionsByCategory.map(c => (
                  <div key={c.key} className="flex items-center gap-2 text-[11px] text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
                    <span className="flex-1 truncate">{c.label}</span>
                    <span className="font-mono text-gray-400">{c.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[var(--radius)]">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 text-center">Puissance PAC recommandée</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-bold text-[var(--color-artex-green,#84cc16)] leading-none">{result.puissanceRecommandeeKw}</span>
                <span className="text-xl font-semibold text-gray-200">kW</span>
              </div>

              {/* Gauge plage BAR-TH-171 */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 text-center mb-2">Plage BAR-TH-171 éligible</p>
                <div className="relative h-5 rounded-full overflow-hidden flex bg-white/5">
                  <div className="w-1/4 bg-gradient-to-r from-red-600/40 to-red-600/20" />
                  <div className="w-1/2 bg-gradient-to-r from-green-500/40 via-[var(--color-artex-green,#84cc16)] to-green-500/40" />
                  <div className="w-1/4 bg-gradient-to-r from-red-600/20 to-red-600/50" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white text-[var(--color-artex-dark,#121212)] flex items-center justify-center text-[11px] font-bold shadow-[0_0_0_3px_rgba(255,255,255,0.2)]">
                    ★
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-gray-400">
                  <div className="text-left">
                    <strong className="block text-gray-200">{result.puissanceMinKw.toFixed(1)} kW</strong>
                    <span className="text-gray-500">60%<br/>sous-dim</span>
                  </div>
                  <div className="text-center">
                    <strong className="block text-[var(--color-artex-green,#84cc16)]">{result.puissanceCibleKw.toFixed(1)} kW</strong>
                    <span className="text-gray-500">100%<br/>cible</span>
                  </div>
                  <div className="text-right">
                    <strong className="block text-gray-200">{result.puissanceMaxKw.toFixed(1)} kW</strong>
                    <span className="text-gray-500">130%<br/>surdim</span>
                  </div>
                </div>
              </div>

              {includeEcs && (
                <p className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Droplet className="w-3 h-3 text-blue-500" /> Inclut l'appoint ECS de {PAC_SIZING.ECS_POWER_KW} kW
                </p>
              )}
            </div>
          </div>

          {/* ═══ DTU 65.16 — Règle de dimensionnement ═══ */}
          <div className={`p-4 rounded-[var(--radius)] border ${
            result.dtuConforme
              ? 'bg-[var(--color-artex-green,#84cc16)]/10 border-[var(--color-artex-green,#84cc16)]/30'
              : result.dtuVerdict === 'sous-dimensionnée'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className={`w-5 h-5 ${result.dtuConforme ? 'text-[var(--color-artex-green,#84cc16)]' : 'text-amber-400'}`} />
              <h3 className="text-sm font-bold text-gray-200">DTU 65.16 — Règle de dimensionnement</h3>
              <span className={`ml-auto text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                result.dtuConforme
                  ? 'bg-[var(--color-artex-green,#84cc16)]/20 text-[var(--color-artex-green,#84cc16)]'
                  : result.dtuVerdict === 'sous-dimensionnée'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {result.dtuVerdict}
              </span>
            </div>

            {/* Jauge DTU 80-120% */}
            <div className="mb-3">
              <div className="relative h-8 rounded-lg overflow-hidden flex bg-white/5">
                {/* Zones */}
                <div className="w-[26.7%] bg-gradient-to-r from-red-600/30 to-amber-500/30 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-red-400/80">{'< 80%'}</span>
                </div>
                <div className="w-[13.3%] bg-gradient-to-r from-[var(--color-artex-green,#84cc16)]/20 to-[var(--color-artex-green,#84cc16)]/40 flex items-center justify-center border-x border-[var(--color-artex-green,#84cc16)]/30">
                  <span className="text-[9px] font-bold text-[var(--color-artex-green,#84cc16)]">80%</span>
                </div>
                <div className="w-[13.3%] bg-[var(--color-artex-green,#84cc16)]/30 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[var(--color-artex-green,#84cc16)]">100%</span>
                </div>
                <div className="w-[13.3%] bg-gradient-to-r from-[var(--color-artex-green,#84cc16)]/40 to-[var(--color-artex-green,#84cc16)]/20 flex items-center justify-center border-x border-[var(--color-artex-green,#84cc16)]/30">
                  <span className="text-[9px] font-bold text-[var(--color-artex-green,#84cc16)]">120%</span>
                </div>
                <div className="w-[33.4%] bg-gradient-to-r from-amber-500/30 to-red-600/30 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-red-400/80">{'> 120%'}</span>
                </div>
                {/* Curseur position dynamique */}
                {(() => {
                  // Map ratio to percentage position: 0% → left, 80% → 26.7%, 100% → 46.6%, 120% → 53.3%, 200% → 100%
                  const ratio = result.dtuRatio * 100
                  let pos
                  if (ratio <= 80) pos = (ratio / 80) * 26.7
                  else if (ratio <= 120) pos = 26.7 + ((ratio - 80) / 40) * 26.6
                  else pos = Math.min(100, 53.3 + ((ratio - 120) / 80) * 46.7)
                  return (
                    <div
                      className="absolute top-0 bottom-0 flex items-center"
                      style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-lg ${
                        result.dtuConforme
                          ? 'bg-[var(--color-artex-green,#84cc16)] border-white text-[var(--color-artex-dark,#121212)]'
                          : 'bg-amber-500 border-white text-white'
                      }`}>
                        {Math.round(ratio)}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Détails chiffrés */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-[var(--radius-sm)] bg-white/5">
                <p className="text-[10px] uppercase text-gray-400">Min DTU (80%)</p>
                <p className="text-sm font-bold text-gray-200">{result.dtuMinKw} kW</p>
              </div>
              <div className="p-2 rounded-[var(--radius-sm)] bg-white/5">
                <p className="text-[10px] uppercase text-gray-400">Recommandée</p>
                <p className={`text-sm font-bold ${result.dtuConforme ? 'text-[var(--color-artex-green,#84cc16)]' : 'text-amber-400'}`}>{result.puissanceRecommandeeKw} kW</p>
                <p className="text-[10px] text-gray-500">ratio {(result.dtuRatio * 100).toFixed(0)}%</p>
              </div>
              <div className="p-2 rounded-[var(--radius-sm)] bg-white/5">
                <p className="text-[10px] uppercase text-gray-400">Max DTU (120%)</p>
                <p className="text-sm font-bold text-gray-200">{result.dtuMaxKw} kW</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              {result.dtuDetail}
            </p>
          </div>

          {/* Chips détail */}
          <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-[var(--radius-sm)]">
            <Chip label="G base" value={result.gBase.toFixed(2)} />
            <Chip label="G eff." value={result.gEffectif.toFixed(2)} />
            <Chip label="V" value={`${result.volume.toFixed(0)} m³`} />
            <Chip label="ΔT" value={`${result.deltaT.toFixed(0)}°C`} />
            <Chip label="T_base" value={`${result.tBaseCorrigee.toFixed(1)}°C`} />
            <Chip label="Intermittence" value={`×${result.intermittenceCoeff}`} />
            {includeEcs && <Chip label="ECS" value={`+${result.ecsKw.toFixed(1)} kW`} />}
            <Chip label="DTU ratio" value={`${(result.dtuRatio * 100).toFixed(0)}%`} />
          </div>

          {/* Compliance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <ComplianceBadge
              variant={result.dtuConforme ? 'ok' : 'ko'}
              iconEl={result.dtuConforme ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              title="DTU 65.16"
              subtitle={`${(result.dtuRatio * 100).toFixed(0)}% — ${result.dtuVerdict}`}
            />
            <ComplianceBadge
              variant={result.eligibleBarTh171 ? 'ok' : 'ko'}
              iconEl={result.eligibleBarTh171 ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              title="BAR-TH-171"
              subtitle={result.eligibleBarTh171 ? `Dépose ${heatingDef?.label.toLowerCase()} ✓` : 'Dépose fossile requise'}
            />
            <ComplianceBadge
              variant="info"
              iconEl={<Thermometer className="w-5 h-5" />}
              title="ETAS requise"
              subtitle={`≥ ${Math.round(result.etasRequired * 100)}% @ ${result.etasTempRef}°C (${result.emitterMode === 'BT' ? 'BT' : result.emitterMode === 'mixte' ? 'Mixte' : 'MT/HT'})`}
            />
            <ComplianceBadge
              variant="info"
              iconEl={<Gauge className="w-5 h-5" />}
              title="Couverture"
              subtitle={`BAR-TH-171 : ${Math.round(PAC_SIZING.MIN_COVERAGE * 100)}-${Math.round(PAC_SIZING.MAX_COVERAGE * 100)}%`}
            />
          </div>
        </div>
      </div>

    </SimulatorLayout>
  )
}

function Chip({ label, value }) {
  return (
    <div className="flex items-baseline gap-1.5 px-2.5 py-1 bg-white/5 rounded-full">
      <span className="text-[10px] uppercase tracking-wider text-gray-400">{label}</span>
      <strong className="text-[12px] font-mono font-bold text-gray-200">{value}</strong>
    </div>
  )
}

function ComplianceBadge({ variant, iconEl, title, subtitle }) {
  const styles = {
    ok: 'bg-[var(--color-artex-green,#84cc16)]/10 border-[var(--color-artex-green,#84cc16)]/30',
    ko: 'bg-amber-500/10 border-amber-500/30',
    info: 'bg-white/5 border-white/10',
  }
  const iconColor = {
    ok: 'text-[var(--color-artex-green,#84cc16)]',
    ko: 'text-amber-500',
    info: 'text-blue-400',
  }
  return (
    <div className={`flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border ${styles[variant]}`}>
      <span className={`shrink-0 ${iconColor[variant]}`}>{iconEl}</span>
      <div>
        <p className="text-sm font-semibold text-gray-200">{title}</p>
        <p className="text-[11px] text-gray-400 leading-tight">{subtitle}</p>
      </div>
    </div>
  )
}
