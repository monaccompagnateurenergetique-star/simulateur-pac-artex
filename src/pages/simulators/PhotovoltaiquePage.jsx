import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Sun, MapPin, Zap, Home as HomeIcon, Users, Target, Euro, TrendingUp,
  Battery, Leaf, ChevronLeft, ChevronRight, RefreshCw, Sliders, PiggyBank,
  CalendarClock, Gauge, BadgePercent, Wallet, BatteryCharging, Ruler,
  Star, Check, AlertTriangle, ArrowRight, Download, CreditCard, BarChart3, Layers,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Legend,
  Tooltip as RTooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import InputField from '../../components/ui/InputField'
import Slider from '../../components/ui/Slider'
import ToggleGroup from '../../components/ui/ToggleGroup'
import AlertBox from '../../components/ui/AlertBox'
import Button from '../../components/ui/Button'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import {
  PV_REGIONS, PV_ORIENTATIONS, PV_DEFAULTS, PV_PANEL,
  PV_PRESENCE_OPTIONS, PV_MOTIVATIONS, coutParKwc,
  PV_BATTERY_SIZES, PV_BATTERY_DEFAULTS, regionFromLatitude, optimizeBattery,
} from '../../lib/constants/photovoltaique'
import { estimateAnnualProduction, monthlyProduction, monthlyProductionVsConso, computeFinancing } from '../../lib/services/pvProduction'
import { recommendSizing, selfConsumptionRate, computeFinancials } from '../../lib/calculators/photovoltaique'
import { geocodeAddress } from '../../utils/dpeApi'
import { generatePvPdf } from '../../lib/pvPdfGenerator'

/* ── Fix Leaflet default marker icon (Vite breaks asset paths) ── */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const eur = (v) => `${Math.round(Number(v) || 0).toLocaleString('fr-FR')} €`
const kwh = (v) => `${Math.round(Number(v) || 0).toLocaleString('fr-FR')} kWh`
const STEPS = ['Localisation', 'Consommation', 'Toiture', 'Profil', 'Objectif']
const MOTIV_ICON = { Euro, Battery, Leaf, TrendingUp }

/* ── Map recenter helper ── */
function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, zoom || 18, { duration: 1.2 }) }, [center, zoom, map])
  return null
}

export default function PhotovoltaiquePage() {
  const [view, setView] = useState('wizard')
  const [step, setStep] = useState(1)

  // ── Localisation ──
  const [addressLabel, setAddressLabel] = useState('')
  const [coordinates, setCoordinates] = useState(null) // [lat, lon]
  const [region, setRegion] = useState('centre')
  const [geocoding, setGeocoding] = useState(false)

  // ── Consommation ──
  const [consoMode, setConsoMode] = useState('facture')
  const [factureMensuelle, setFactureMensuelle] = useState(120)
  const [consoKwh, setConsoKwh] = useState(6000)

  // ── Toiture ──
  const [orientation, setOrientation] = useState('sud')
  const [inclinaison, setInclinaison] = useState(30)
  const [toitMode, setToitMode] = useState('surface') // 'surface' | 'kwc'
  const [surfaceToit, setSurfaceToit] = useState(30)
  const [kwcDirect, setKwcDirect] = useState(6)

  // ── Profil ──
  const [presence, setPresence] = useState('partiel')
  const [ballonEcs, setBallonEcs] = useState(true)
  const [voitureElec, setVoitureElec] = useState(false)
  const [motivation, setMotivation] = useState('facture')

  // ── Batterie ──
  const [batteryKwh, setBatteryKwh] = useState(0)

  // ── Coût projet ──
  const [coutProjet, setCoutProjet] = useState('')

  // ── Financement ──
  const [showFinancing, setShowFinancing] = useState(false)
  const [loanRate, setLoanRate] = useState(3.5)
  const [loanDuration, setLoanDuration] = useState(15)

  // ── Ajustements ──
  const [kwcOverride, setKwcOverride] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoconsoOverride, setAutoconsoOverride] = useState(null)
  const [coutKwcOverride, setCoutKwcOverride] = useState(null)
  const [a, setA] = useState({ ...PV_DEFAULTS })

  const num = (v, d = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : d)

  // ── Handle address selection ──
  async function handleAddressSelect({ address, postalCode, city, label, coordinates: coords }) {
    setAddressLabel(label || '')
    if (!label) { setCoordinates(null); return }

    // Use coordinates directly from autocomplete (BAN already provides them)
    if (coords && coords.length === 2) {
      const [lon, lat] = coords
      setCoordinates([lat, lon])
      setRegion(regionFromLatitude(lat))
      return
    }

    // Fallback: geocode if no coordinates from autocomplete
    setGeocoding(true)
    try {
      const geo = await geocodeAddress(label)
      if (geo?.coordinates) {
        const [lon, lat] = geo.coordinates
        setCoordinates([lat, lon])
        setRegion(regionFromLatitude(lat))
      }
    } catch { /* silent */ }
    setGeocoding(false)
  }

  // ── Derived ──
  const consoAnnuelle = useMemo(() => {
    if (consoMode === 'kwh') return Math.max(0, num(consoKwh))
    return Math.round((num(factureMensuelle) * 12) / Math.max(0.05, a.prixElecKwh))
  }, [consoMode, consoKwh, factureMensuelle, a.prixElecKwh])

  const prodPerKwc = useMemo(
    () => estimateAnnualProduction({ kwc: 1, region, orientation, tilt: inclinaison }).productiblePerKwc,
    [region, orientation, inclinaison],
  )

  const reco = useMemo(
    () => recommendSizing({ consoAnnuelle, surfaceToit: toitMode === 'surface' ? num(surfaceToit) : 999, productiblePerKwc: prodPerKwc }),
    [consoAnnuelle, surfaceToit, prodPerKwc, toitMode],
  )

  const kwc = kwcOverride ?? (toitMode === 'kwc' ? kwcDirect : reco.kwc)
  const nbPanneaux = Math.round((kwc * 1000) / PV_PANEL.puissanceWc)

  const production = useMemo(
    () => estimateAnnualProduction({ kwc, region, orientation, tilt: inclinaison }),
    [kwc, region, orientation, inclinaison],
  )

  const autoconsoRateAuto = useMemo(
    () => selfConsumptionRate({ presence, ballonEcs, voitureElec }),
    [presence, ballonEcs, voitureElec],
  )
  const autoconsoRate = autoconsoOverride != null ? autoconsoOverride / 100 : autoconsoRateAuto

  // ── Battery optimizer ──
  const batteryAnalysis = useMemo(() => optimizeBattery({
    annualProductionKwh: production.annualKwh,
    consoAnnuelle,
    autoconsoRate,
    prixElecKwh: a.prixElecKwh,
    inflationElec: a.inflationElec,
  }), [production.annualKwh, consoAnnuelle, autoconsoRate, a.prixElecKwh, a.inflationElec])

  const optimalBattery = batteryAnalysis.find(b => b.optimal)

  const coutProjetNum = coutProjet !== '' ? Number(coutProjet) : null

  const fin = useMemo(() => computeFinancials({
    kwc,
    productionAnnuelle: production.annualKwh,
    consoAnnuelle,
    autoconsoRate,
    params: { ...a, coutParKwc: coutKwcOverride ?? coutParKwc(kwc) },
    batteryKwh,
    coutProjetOverride: coutProjetNum && coutProjetNum > 0 ? coutProjetNum : null,
  }), [kwc, production.annualKwh, consoAnnuelle, autoconsoRate, a, coutKwcOverride, batteryKwh, coutProjetNum])

  const cashflowData = useMemo(
    () => [{ annee: 0, cumul: -fin.coutNet }, ...fin.projection.map(r => ({ annee: r.annee, cumul: r.cumul }))],
    [fin],
  )
  const monthly = useMemo(() => monthlyProduction(production.annualKwh), [production.annualKwh])

  // ── Conso vs Production mensuelle ──
  const monthlyVsConso = useMemo(
    () => monthlyProductionVsConso(production.annualKwh, consoAnnuelle, autoconsoRate),
    [production.annualKwh, consoAnnuelle, autoconsoRate],
  )

  // ── Comparateur de scénarios ──
  const scenarios = useMemo(() => {
    const base = { ...a, coutParKwc: coutKwcOverride ?? coutParKwc(kwc) }
    const s1 = computeFinancials({ kwc, productionAnnuelle: production.annualKwh, consoAnnuelle, autoconsoRate, params: base, batteryKwh: 0 })
    const optBatt = optimalBattery?.size || 0
    const s2 = optBatt > 0
      ? computeFinancials({ kwc, productionAnnuelle: production.annualKwh, consoAnnuelle, autoconsoRate, params: base, batteryKwh: optBatt })
      : null
    const altKwc = kwc <= 6 ? 9 : 6
    const altProd = estimateAnnualProduction({ kwc: altKwc, region, orientation, tilt: inclinaison })
    const s3 = computeFinancials({ kwc: altKwc, productionAnnuelle: altProd.annualKwh, consoAnnuelle, autoconsoRate, params: { ...a, coutParKwc: coutParKwc(altKwc) }, batteryKwh: batteryKwh })
    return [
      { label: `${kwc} kWc sans batterie`, kwc, batt: 0, fin: s1 },
      ...(s2 ? [{ label: `${kwc} kWc + ${optBatt} kWh`, kwc, batt: optBatt, fin: s2 }] : []),
      { label: `${altKwc} kWc${batteryKwh ? ` + ${batteryKwh} kWh` : ''}`, kwc: altKwc, batt: batteryKwh, fin: s3 },
    ]
  }, [kwc, production.annualKwh, consoAnnuelle, autoconsoRate, a, coutKwcOverride, batteryKwh, optimalBattery, region, orientation, inclinaison])

  // ── Financement ──
  const financing = useMemo(
    () => computeFinancing({ montant: fin.coutNet, tauxAnnuel: loanRate / 100, dureeAnnees: loanDuration, economieAn1: fin.economieAn1, inflationElec: a.inflationElec }),
    [fin.coutNet, loanRate, loanDuration, fin.economieAn1, a.inflationElec],
  )

  // ── Navigation ──
  const next = () => (step < STEPS.length ? setStep(step + 1) : setView('results'))
  const prev = () => setStep(Math.max(1, step - 1))

  const regionLabel = PV_REGIONS.find(r => r.value === region)?.label || region

  /* ════════ WIZARD ════════ */
  if (view === 'wizard') {
    return (
      <SimulatorLayout code="PHOTOVOLTAÏQUE" title="Simulateur photovoltaïque" description="Production, économies & rentabilité — comprendre votre investissement">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-700">Étape {step} / {STEPS.length} — {STEPS[step - 1]}</p>
            <span className="text-xs text-gray-400">{Math.round((step / STEPS.length) * 100)} %</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* STEP 1 — Localisation */}
        {step === 1 && (
          <div className="space-y-4">
            <StepHeader icon={MapPin} title="Où se situe le logement ?" subtitle="L'adresse détermine l'ensoleillement et affiche la vue satellite." />

            <AddressAutocomplete
              value={addressLabel}
              onChange={handleAddressSelect}
              placeholder="Saisissez l'adresse du projet..."
            />

            {geocoding && (
              <p className="text-xs text-indigo-500 animate-pulse">Géolocalisation en cours...</p>
            )}

            {/* Satellite map */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 280, position: 'relative', zIndex: 0 }}>
              <MapContainer
                center={coordinates || [46.6, 2.5]}
                zoom={coordinates ? 18 : 6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={false}
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri World Imagery"
                  maxZoom={19}
                />
                {coordinates && (
                  <>
                    <FlyTo center={coordinates} zoom={18} />
                    <Marker position={coordinates} />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Detected region + manual override */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-indigo-700">
                  <Sun className="w-4 h-4 inline mr-1" />
                  Région détectée : {regionLabel}
                </p>
                <span className="text-xs text-indigo-500">{PV_REGIONS.find(r => r.value === region)?.productible} kWh/kWc/an</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PV_REGIONS.map(r => (
                  <button key={r.value} type="button" onClick={() => setRegion(r.value)}
                    className={`text-center py-2 px-2 rounded-lg border text-xs font-bold transition ${region === r.value ? 'border-indigo-600 bg-white text-indigo-700 shadow-sm' : 'border-transparent text-indigo-400 hover:bg-white/60'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Consommation */}
        {step === 2 && (
          <div className="space-y-4">
            <StepHeader icon={Zap} title="Quelle est votre consommation d'électricité ?" subtitle="Pour dimensionner l'installation au plus juste." />
            <ToggleGroup
              label="Je renseigne…"
              options={[{ value: 'facture', label: 'Ma facture mensuelle' }, { value: 'kwh', label: 'Ma conso annuelle' }]}
              value={consoMode} onChange={setConsoMode}
            />
            {consoMode === 'facture' ? (
              <InputField label="Facture d'électricité moyenne" id="facture" type="number" suffix="€/mois"
                value={factureMensuelle} onChange={setFactureMensuelle} min={0}
                helper={`≈ ${kwh(consoAnnuelle)} / an (au prix de ${a.prixElecKwh} €/kWh)`} />
            ) : (
              <InputField label="Consommation annuelle" id="conso" type="number" suffix="kWh/an"
                value={consoKwh} onChange={setConsoKwh} min={0}
                helper="Indiquée sur votre facture annuelle de régularisation." />
            )}
            <AlertBox type="info">
              Un foyer français consomme en moyenne <strong>4 500 à 9 000 kWh/an</strong> selon le chauffage et la taille.
            </AlertBox>
          </div>
        )}

        {/* STEP 3 — Toiture */}
        {step === 3 && (
          <div className="space-y-4">
            <StepHeader icon={HomeIcon} title="Caractéristiques de la toiture" subtitle="Orientation, inclinaison et dimensionnement." />

            {/* Orientation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Orientation de la toiture</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PV_ORIENTATIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setOrientation(o.value)}
                    className={`py-2.5 px-2 rounded-lg border-2 text-sm font-bold transition ${orientation === o.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                    {o.label}
                    <span className="block text-[10px] font-normal text-gray-400">{Math.round(o.factor * 100)} % rendement</span>
                  </button>
                ))}
              </div>
            </div>

            <Slider label="Inclinaison du toit" id="tilt" value={inclinaison} onChange={setInclinaison}
              min={0} max={60} step={5} unit="°" leftLabel="Plat (0°)" rightLabel="Pentu (60°)" />

            {/* Surface vs kWc toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dimensionnement</label>
              <ToggleGroup
                options={[
                  { value: 'surface', label: 'Surface disponible' },
                  { value: 'kwc', label: 'Puissance souhaitée' },
                ]}
                value={toitMode} onChange={setToitMode}
              />
            </div>

            {toitMode === 'surface' ? (
              <InputField label="Surface de toiture disponible" id="surface" type="number" suffix="m²"
                value={surfaceToit} onChange={setSurfaceToit} min={0}
                helper={`≈ ${PV_PANEL.surfaceM2} m² par panneau (${PV_PANEL.puissanceWc} Wc) → recommandation : ${reco.kwc} kWc`} />
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                  <span>Puissance à installer</span>
                  <span className="text-xl font-extrabold text-indigo-600">{kwcDirect} kWc</span>
                </label>
                <input type="range" min={3} max={9} step={1} value={kwcDirect}
                  onChange={(e) => setKwcDirect(parseInt(e.target.value))}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3 kWc ({Math.round((3000 / PV_PANEL.puissanceWc) * PV_PANEL.surfaceM2)} m²)</span>
                  <span>6 kWc</span>
                  <span>9 kWc ({Math.round((9000 / PV_PANEL.puissanceWc) * PV_PANEL.surfaceM2)} m²)</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {kwcDirect} kWc = {Math.round((kwcDirect * 1000) / PV_PANEL.puissanceWc)} panneaux • {Math.round((kwcDirect * 1000) / PV_PANEL.puissanceWc * PV_PANEL.surfaceM2)} m² de toiture nécessaire
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Profil */}
        {step === 4 && (
          <div className="space-y-4">
            <StepHeader icon={Users} title="Votre profil de consommation" subtitle="Détermine le taux d'autoconsommation." />
            <ToggleGroup label="Présence au domicile en journée"
              options={PV_PRESENCE_OPTIONS} value={presence} onChange={setPresence} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleGroup label="Ballon d'eau chaude électrique" activeColor="green"
                options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]}
                value={ballonEcs ? 'oui' : 'non'} onChange={(v) => setBallonEcs(v === 'oui')} />
              <ToggleGroup label="Voiture électrique" activeColor="green"
                options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]}
                value={voitureElec ? 'oui' : 'non'} onChange={(v) => setVoitureElec(v === 'oui')} />
            </div>

            {/* Battery optimizer */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <BatteryCharging className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-800">Batterie de stockage</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Le simulateur analyse votre surplus solaire et recommande la batterie optimale.
              </p>

              {/* Choix sans batterie */}
              <button type="button" onClick={() => setBatteryKwh(0)}
                className={`w-full mb-3 p-3 rounded-lg border-2 text-left transition ${batteryKwh === 0
                  ? 'border-emerald-600 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700">Sans batterie</span>
                  <span className="text-xs text-gray-400">Autoconso {Math.round(autoconsoRateAuto * 100)}%</span>
                </div>
              </button>

              {/* Battery options with optimizer */}
              <div className="space-y-2">
                {batteryAnalysis.map(ba => (
                  <button key={ba.size} type="button" onClick={() => setBatteryKwh(ba.size)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition relative ${
                      batteryKwh === ba.size
                        ? 'border-emerald-600 bg-white shadow-md ring-1 ring-emerald-200'
                        : ba.optimal
                          ? 'border-emerald-300 bg-white hover:border-emerald-500'
                          : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}>
                    {/* Badge recommandé */}
                    {ba.optimal && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3" /> RECOMMANDÉ
                      </div>
                    )}
                    {ba.surdimensionne && !ba.optimal && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Surdimensionné
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-gray-800">{ba.size} kWh</span>
                        <span className="text-xs text-gray-400">{eur(ba.cout)}</span>
                      </div>
                      <span className={`text-sm font-extrabold ${ba.gainNet > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {ba.gainNet > 0 ? '+' : ''}{eur(ba.gainNet)}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">/{PV_BATTERY_DEFAULTS.dureeVieAnnees} ans</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-gray-400">Autoconso</p>
                        <p className="text-sm font-extrabold text-gray-700">{ba.autoconsoAvec}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Capté/jour</p>
                        <p className="text-sm font-extrabold text-gray-700">{ba.capturedKwhJour} kWh</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Capture surplus</p>
                        <p className="text-sm font-extrabold text-gray-700">{ba.captureRate}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Amorti</p>
                        <p className="text-sm font-extrabold text-gray-700">{ba.payback ? `${ba.payback} ans` : '—'}</p>
                      </div>
                    </div>

                    {/* Visual surplus bar */}
                    <div className="mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                        <span>Surplus capté</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${ba.captureRate}%` }} />
                        </div>
                        <span className="font-bold">{ba.captureRate}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Recommendation insight */}
              {optimalBattery && (
                <div className="mt-3 bg-emerald-600/10 rounded-lg p-3 text-xs text-emerald-800">
                  <strong className="flex items-center gap-1 mb-1"><Star className="w-3 h-3" /> Pourquoi {optimalBattery.size} kWh ?</strong>
                  <p>
                    Votre surplus quotidien est d'environ {Math.round((production.annualKwh / 365) * (1 - autoconsoRate) * 10) / 10} kWh.
                    {' '}La batterie de {optimalBattery.size} kWh en capte <strong>{optimalBattery.captureRate}%</strong> (soit {optimalBattery.capturedKwhJour} kWh/jour).
                    {optimalBattery.surdimensionne
                      ? " C'est déjà au-delà de votre surplus — une plus petite suffirait."
                      : ` C'est le meilleur ratio investissement/gain : ROI de ${optimalBattery.roi}% sur ${PV_BATTERY_DEFAULTS.dureeVieAnnees} ans.`}
                    {batteryAnalysis.find(b => b.size > optimalBattery.size && b.surdimensionne) &&
                      ' Une batterie plus grande serait surdimensionnée par rapport à votre surplus.'}
                  </p>
                </div>
              )}
              {!optimalBattery && (
                <div className="mt-3 bg-amber-100 rounded-lg p-3 text-xs text-amber-800">
                  <strong className="flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> Batterie non rentable</strong>
                  <p>Avec votre profil actuel, aucune taille de batterie ne s'amortit sur {PV_BATTERY_DEFAULTS.dureeVieAnnees} ans. Privilégiez l'autoconsommation directe.</p>
                </div>
              )}
            </div>

            <AlertBox type="success" title={`Autoconsommation estimée : ${Math.round(autoconsoRateAuto * 100)}%${batteryKwh > 0 ? ` → ${batteryAnalysis.find(b => b.size === batteryKwh)?.autoconsoAvec || '?'}% avec batterie` : ''}`}>
              Plus vous consommez l'électricité au moment où elle est produite (journée), plus le solaire est rentable.
            </AlertBox>
          </div>
        )}

        {/* STEP 5 — Objectif + Coût */}
        {step === 5 && (
          <div className="space-y-4">
            <StepHeader icon={Target} title="Objectif & budget" subtitle="Pour adapter notre recommandation et intégrer votre devis." />
            <div className="grid grid-cols-2 gap-3">
              {PV_MOTIVATIONS.map(m => {
                const Ic = MOTIV_ICON[m.icon] || Target
                return (
                  <button key={m.value} type="button" onClick={() => setMotivation(m.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${motivation === m.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                    <Ic className={`w-5 h-5 ${motivation === m.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className="font-bold text-gray-800 text-sm">{m.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Coût projet */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-800">Coût du projet (optionnel)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Si vous avez un devis, renseignez le montant TTC. Sinon, le simulateur utilisera un coût estimé.
              </p>
              <InputField id="coutProjet" type="number" suffix="€ TTC"
                placeholder={`Estimé : ${eur(coutParKwc(toitMode === 'kwc' ? kwcDirect : reco.kwc) * (toitMode === 'kwc' ? kwcDirect : reco.kwc) + batteryKwh * PV_BATTERY_DEFAULTS.coutParKwh)}`}
                value={coutProjet} onChange={setCoutProjet} min={0} />
              <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                <p>Coût estimé PV : {eur(coutParKwc(toitMode === 'kwc' ? kwcDirect : reco.kwc) * (toitMode === 'kwc' ? kwcDirect : reco.kwc))} ({toitMode === 'kwc' ? kwcDirect : reco.kwc} kWc × {eur(coutParKwc(toitMode === 'kwc' ? kwcDirect : reco.kwc))}/kWc)</p>
                {batteryKwh > 0 && <p>Coût batterie : {eur(batteryKwh * PV_BATTERY_DEFAULTS.coutParKwh)} ({batteryKwh} kWh × {eur(PV_BATTERY_DEFAULTS.coutParKwh)}/kWh)</p>}
              </div>
            </div>

            <AlertBox type="info">
              Sur la base de vos réponses, nous recommandons <strong>{toitMode === 'kwc' ? kwcDirect : reco.kwc} kWc</strong>
              {' '}({toitMode === 'kwc' ? Math.round((kwcDirect * 1000) / PV_PANEL.puissanceWc) : reco.nbPanneaux} panneaux)
              {batteryKwh > 0 && <> + batterie <strong>{batteryKwh} kWh</strong></>}.
            </AlertBox>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={prev} disabled={step === 1}>
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button variant="primary" onClick={next}>
            {step < STEPS.length ? <>Suivant <ChevronRight className="w-4 h-4" /></> : <>Calculer ma rentabilité <Sun className="w-4 h-4" /></>}
          </Button>
        </div>
      </SimulatorLayout>
    )
  }

  /* ════════ RESULTS ════════ */
  const payback = fin.paybackAnnee
  return (
    <SimulatorLayout code="PHOTOVOLTAÏQUE" title="Votre projet photovoltaïque" description="Production, économies & rentabilité estimées">

      <div className="flex items-center justify-between">
        <button onClick={() => setView('wizard')} className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold">
          <ChevronLeft className="w-4 h-4" /> Modifier mes réponses
        </button>
        <button
          onClick={() => {
            const orientLabel = PV_ORIENTATIONS.find(o => o.value === orientation)?.label || orientation
            const doc = generatePvPdf({
              kwc, nbPanneaux, production, consoAnnuelle, fin, batteryKwh, autoconsoRate,
              addressLabel, regionLabel, orientation: orientLabel, inclinaison,
              scenarios, financing, loanRate, loanDuration, monthlyVsConso,
            })
            doc.save(`etude-pv-${kwc}kwc${batteryKwh ? `-${batteryKwh}kwh` : ''}.pdf`)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
        >
          <Download className="w-4 h-4" /> Exporter PDF
        </button>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white">
        {/* Address if available */}
        {addressLabel && (
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/20">
            <MapPin className="w-4 h-4 text-indigo-200" />
            <span className="text-sm text-indigo-100">{addressLabel}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider">Installation</p>
            <p className="text-4xl font-extrabold mt-1">{kwc} kWc</p>
            <p className="text-indigo-200 text-sm mt-1">
              {nbPanneaux} panneaux · ≈ {Math.round(nbPanneaux * PV_PANEL.surfaceM2)} m²
              {batteryKwh > 0 && <> · batterie {batteryKwh} kWh</>}
            </p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider">Production estimée</p>
            <p className="text-4xl font-extrabold mt-1">{kwh(production.annualKwh)}</p>
            <p className="text-indigo-200 text-sm mt-1">par an · {production.regionLabel}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider">Couverture besoins</p>
            <p className="text-4xl font-extrabold mt-1">{fin.tauxCouvertureProd} %</p>
            <p className="text-indigo-200 text-sm mt-1">autoconso {fin.autoconsoEffective}%{batteryKwh > 0 && ' (avec batterie)'}</p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-white/20">
          <label className="text-xs text-indigo-200 uppercase tracking-wider">Ajuster la puissance</label>
          <input type="range" min={3} max={9} step={1} value={kwc}
            onChange={(e) => setKwcOverride(parseInt(e.target.value))}
            className="w-full mt-2 accent-lime-400" />
          <div className="flex justify-between text-xs text-indigo-200"><span>3 kWc</span><span>6 kWc</span><span>9 kWc</span></div>
        </div>
      </div>

      {/* Satellite mini-map (if coordinates available) */}
      {coordinates && (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 200 }}>
          <MapContainer center={coordinates} zoom={18} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} zoomControl={false} dragging={false}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} />
            <Marker position={coordinates} />
          </MapContainer>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={PiggyBank} color="indigo" label="Coût net (après prime)"
          value={eur(fin.coutNet)}
          sub={coutProjetNum ? `Devis : ${eur(coutProjetNum)} − ${eur(fin.prime)} prime` : `${eur(fin.coutBrut)} − ${eur(fin.prime)} prime`} />
        <KpiCard icon={Euro} color="green" label="Économie 1ʳᵉ année" value={eur(fin.economieAn1)} sub={`${fin.tauxAutoproduction}% d'autoproduction`} />
        <KpiCard icon={CalendarClock} color="amber" label="Amortissement" value={payback != null ? `${payback.toFixed(1)} ans` : '> durée de vie'} sub="Retour sur investissement" />
        <KpiCard icon={TrendingUp} color="indigo" label={`Gain net sur ${a.dureeVieAnnees} ans`} value={eur(fin.gainNetFinal)} sub={`ROI ${fin.roi} %`} />
      </div>

      {/* Battery impact summary */}
      {batteryKwh > 0 && (() => {
        const selectedBa = batteryAnalysis.find(b => b.size === batteryKwh)
        return (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BatteryCharging className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-800">Batterie {batteryKwh} kWh</h3>
                {selectedBa?.optimal && (
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Optimal
                  </span>
                )}
              </div>
              {selectedBa && (
                <span className={`text-sm font-extrabold ${selectedBa.gainNet > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {selectedBa.gainNet > 0 ? '+' : ''}{eur(selectedBa.gainNet)} net
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400">Coût</p>
                <p className="text-lg font-extrabold text-gray-800">{eur(fin.coutBatterie)}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400">Autoconso</p>
                <p className="text-lg font-extrabold text-emerald-600">{fin.autoconsoEffective}%</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400">Capture surplus</p>
                <p className="text-lg font-extrabold text-gray-800">{selectedBa?.captureRate || 0}%</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400">Amorti en</p>
                <p className="text-lg font-extrabold text-gray-800">{selectedBa?.payback ? `${selectedBa.payback} ans` : '—'}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400">ROI batterie</p>
                <p className={`text-lg font-extrabold ${(selectedBa?.roi || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{selectedBa?.roi || 0}%</p>
              </div>
            </div>
            {selectedBa?.surdimensionne && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 rounded-lg p-2.5 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Cette batterie est surdimensionnée par rapport à votre surplus. {optimalBattery && <>La taille optimale est <strong>{optimalBattery.size} kWh</strong>.</>}</span>
              </div>
            )}
          </div>
        )
      })()}

      {/* Cashflow chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-800">Trésorerie cumulée — point d'amortissement</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">La courbe part de l'investissement (négatif) et croise zéro le jour où l'installation est remboursée.</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cashflowData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="annee" tick={{ fontSize: 11 }} label={{ value: 'années', position: 'insideBottomRight', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <RTooltip formatter={(v) => [eur(v), 'Trésorerie cumulée']} labelFormatter={(l) => `Année ${l}`} />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            {payback != null && <ReferenceLine x={Math.round(payback)} stroke="#22c55e" strokeDasharray="4 4" label={{ value: `Amorti an ${payback.toFixed(0)}`, fontSize: 10, fill: '#16a34a', position: 'top' }} />}
            <Area type="monotone" dataKey="cumul" stroke="#6366f1" strokeWidth={2.5} fill="url(#cf)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Production vs Consommation mensuelle ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-800">Production vs Consommation mensuelle</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Le surplus estival est revendu ou stocké. Le déficit hivernal est acheté au réseau.</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthlyVsConso} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit=" kWh" />
            <RTooltip formatter={(v, name) => [kwh(v), name === 'prod' ? 'Production' : name === 'conso' ? 'Consommation' : name === 'autoconso' ? 'Autoconsommé' : name]} />
            <Legend formatter={(v) => v === 'prod' ? 'Production' : v === 'conso' ? 'Consommation' : 'Autoconsommé'} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="prod" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Bar dataKey="autoconso" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Line type="monotone" dataKey="conso" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Répartition production + KPIs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4"><BadgePercent className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-800">Répartition (an 1)</h3></div>
          <div className="space-y-4">
            <SplitBar label="Autoconsommée" sub="économie directe" value={fin.autoconsoKwhAn1} total={production.annualKwh} color="bg-indigo-500" />
            <SplitBar label="Surplus revendu" sub={`${a.tarifOAKwh} €/kWh`} value={fin.surplusKwhAn1} total={production.annualKwh} color="bg-lime-500" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">TRI</p><p className="text-lg font-extrabold text-gray-800">{fin.tri != null ? `${fin.tri} %` : '—'}</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">LCOE</p><p className="text-lg font-extrabold text-gray-800">{fin.lcoe.toFixed(2).replace('.', ',')} €/kWh</p></div>
          </div>
        </div>

        {/* ── Simulation de financement ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-800">Financement</h3></div>
            <button onClick={() => setShowFinancing(!showFinancing)} className="text-xs text-indigo-600 font-bold hover:underline">
              {showFinancing ? 'Masquer' : 'Simuler un prêt'}
            </button>
          </div>
          {!showFinancing ? (
            <div className="text-center py-6">
              <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Simulez un prêt solaire pour voir si l'installation se paie toute seule.</p>
              <button onClick={() => setShowFinancing(true)} className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition">
                Simuler le financement
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <InputField label="Taux" id="loanRate" type="number" suffix="%" step={0.1} value={loanRate} onChange={(v) => setLoanRate(num(v, 3.5))} />
                <InputField label="Durée" id="loanDur" type="number" suffix="ans" step={1} value={loanDuration} onChange={(v) => setLoanDuration(Math.max(1, Math.min(25, num(v, 15))))} />
              </div>
              {financing && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400">Mensualité prêt</p>
                      <p className="text-lg font-extrabold text-gray-800">{eur(financing.mensualite)}/mois</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400">Économie moyenne</p>
                      <p className="text-lg font-extrabold text-emerald-600">{eur(financing.ecoMoyenneMensuelle)}/mois</p>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${financing.autoFinance ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                    {financing.autoFinance ? (
                      <p className="text-sm font-bold text-emerald-700"><Check className="w-4 h-4 inline mr-1" />Le solaire se paie tout seul ! Reste <strong>{eur(Math.abs(financing.resteACharge))}/mois</strong> de gain</p>
                    ) : (
                      <p className="text-sm font-bold text-amber-700">Reste à charge : <strong>{eur(financing.resteACharge)}/mois</strong> pendant {loanDuration} ans</p>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">Coût total crédit : {eur(financing.coutTotal)} (dont {eur(financing.interets)} d'intérêts)</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Comparateur de scénarios ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-800">Comparateur de scénarios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs text-gray-400 font-semibold">Scénario</th>
                <th className="text-right py-2 text-xs text-gray-400 font-semibold">Coût net</th>
                <th className="text-right py-2 text-xs text-gray-400 font-semibold">Éco. an 1</th>
                <th className="text-right py-2 text-xs text-gray-400 font-semibold">Amorti</th>
                <th className="text-right py-2 text-xs text-gray-400 font-semibold">Gain {a.dureeVieAnnees}a</th>
                <th className="text-right py-2 text-xs text-gray-400 font-semibold">ROI</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => {
                const isCurrent = s.kwc === kwc && s.batt === batteryKwh
                return (
                  <tr key={i} className={`border-b border-gray-100 ${isCurrent ? 'bg-indigo-50' : ''}`}>
                    <td className="py-3 font-bold text-gray-700">
                      {s.label}
                      {isCurrent && <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded-full">Actuel</span>}
                    </td>
                    <td className="py-3 text-right font-semibold">{eur(s.fin.coutNet)}</td>
                    <td className="py-3 text-right font-semibold text-emerald-600">{eur(s.fin.economieAn1)}</td>
                    <td className="py-3 text-right font-semibold">{s.fin.paybackAnnee ? `${s.fin.paybackAnnee.toFixed(1)} ans` : '—'}</td>
                    <td className="py-3 text-right font-extrabold text-emerald-600">{eur(s.fin.gainNetFinal)}</td>
                    <td className="py-3 text-right font-extrabold">{s.fin.roi}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Narrative */}
      <AlertBox type="success" title="Ce que cela signifie pour vous">
        Pour un investissement net de <strong>{eur(fin.coutNet)}</strong>
        {coutProjetNum ? ' (devis renseigné)' : ''}, votre installation de {kwc} kWc
        {batteryKwh > 0 && <> + batterie {batteryKwh} kWh</>}
        {' '}produit <strong>{kwh(production.annualKwh)}/an</strong>, couvre <strong>{fin.tauxAutoproduction}%</strong> de votre
        consommation et vous fait économiser <strong>{eur(fin.economieAn1)}</strong> dès la 1ʳᵉ année.
        {payback != null && <> Elle est <strong>remboursée en {payback.toFixed(1)} ans</strong>, puis génère du gain net</>}
        {' '}— soit <strong>{eur(fin.gainNetFinal)}</strong> sur {a.dureeVieAnnees} ans.
      </AlertBox>

      {/* Advanced parameters */}
      <div className="bg-white rounded-xl border border-gray-200">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-4">
          <span className="flex items-center gap-2 font-bold text-gray-700"><Sliders className="w-4 h-4 text-indigo-600" /> Ajuster les hypothèses</span>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition ${showAdvanced ? 'rotate-90' : ''}`} />
        </button>
        {showAdvanced && (
          <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InputField label="Prix électricité" id="px" type="number" suffix="€/kWh" step={0.01} value={a.prixElecKwh} onChange={(v) => setA({ ...a, prixElecKwh: num(v) })} />
            <InputField label="Inflation élec." id="inf" type="number" suffix="%/an" step={0.5} value={+(a.inflationElec * 100).toFixed(1)} onChange={(v) => setA({ ...a, inflationElec: num(v) / 100 })} />
            <InputField label="Rachat surplus" id="oa" type="number" suffix="€/kWh" step={0.01} value={a.tarifOAKwh} onChange={(v) => setA({ ...a, tarifOAKwh: num(v) })} />
            <InputField label="Prime / kWc" id="prime" type="number" suffix="€/kWc" step={10} value={a.primeParKwc} onChange={(v) => setA({ ...a, primeParKwc: num(v) })} />
            <InputField label="Coût installation" id="cout" type="number" suffix="€/kWc" step={50} value={coutKwcOverride ?? coutParKwc(kwc)} onChange={(v) => setCoutKwcOverride(num(v))} />
            <InputField label="Taux autoconso." id="ac" type="number" suffix="%" step={5} value={Math.round(autoconsoRate * 100)} onChange={(v) => setAutoconsoOverride(num(v))} />
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
        Estimation indicative (modèle de productible régional). Tarifs et coûts par défaut, à ajuster selon le devis réel. Document non contractuel.
      </p>

      <div className="flex justify-center pt-2">
        <Button variant="secondary" onClick={() => { setView('wizard'); setStep(1) }}>
          <RefreshCw className="w-4 h-4" /> Nouvelle simulation
        </Button>
      </div>
    </SimulatorLayout>
  )
}

/* ── Sub-components ── */
function StepHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const c = {
    indigo: 'text-indigo-600 bg-indigo-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
  }[color]
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c}`}><Icon className="w-4 h-4" /></div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-extrabold text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function SplitBar({ label, sub, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-semibold text-gray-700">{label} <span className="text-gray-400 font-normal">· {sub}</span></span>
        <span className="font-bold text-gray-800">{kwh(value)} ({pct}%)</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
