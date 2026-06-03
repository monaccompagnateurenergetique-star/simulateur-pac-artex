import { useState, useMemo } from 'react'
import {
  Sun, MapPin, Zap, Home as HomeIcon, Users, Target, Euro, TrendingUp,
  Battery, Leaf, ChevronLeft, ChevronRight, RefreshCw, Sliders, PiggyBank,
  CalendarClock, Gauge, BadgePercent,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import InputField from '../../components/ui/InputField'
import Slider from '../../components/ui/Slider'
import ToggleGroup from '../../components/ui/ToggleGroup'
import AlertBox from '../../components/ui/AlertBox'
import Button from '../../components/ui/Button'
import {
  PV_REGIONS, PV_ORIENTATIONS, PV_DEFAULTS, PV_PANEL,
  PV_PRESENCE_OPTIONS, PV_MOTIVATIONS, coutParKwc,
} from '../../lib/constants/photovoltaique'
import { estimateAnnualProduction, monthlyProduction } from '../../lib/services/pvProduction'
import { recommendSizing, selfConsumptionRate, computeFinancials } from '../../lib/calculators/photovoltaique'

const eur = (v) => `${Math.round(Number(v) || 0).toLocaleString('fr-FR')} €`
const kwh = (v) => `${Math.round(Number(v) || 0).toLocaleString('fr-FR')} kWh`
const STEPS = ['Localisation', 'Consommation', 'Toiture', 'Profil', 'Objectif']

const MOTIV_ICON = { Euro, Battery, Leaf, TrendingUp }

export default function PhotovoltaiquePage() {
  const [view, setView] = useState('wizard')   // 'wizard' | 'results'
  const [step, setStep] = useState(1)

  // ── Réponses ──
  const [region, setRegion] = useState('centre')
  const [consoMode, setConsoMode] = useState('facture') // 'facture' | 'kwh'
  const [factureMensuelle, setFactureMensuelle] = useState(120)
  const [consoKwh, setConsoKwh] = useState(6000)
  const [orientation, setOrientation] = useState('sud')
  const [inclinaison, setInclinaison] = useState(30)
  const [surfaceToit, setSurfaceToit] = useState(30)
  const [presence, setPresence] = useState('partiel')
  const [ballonEcs, setBallonEcs] = useState(true)
  const [voitureElec, setVoitureElec] = useState(false)
  const [motivation, setMotivation] = useState('facture')

  // ── Ajustements ──
  const [kwcOverride, setKwcOverride] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoconsoOverride, setAutoconsoOverride] = useState(null) // %
  const [coutKwcOverride, setCoutKwcOverride] = useState(null)
  const [a, setA] = useState({ ...PV_DEFAULTS })

  const num = (v, d = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : d)

  // ── Dérivés ──
  const consoAnnuelle = useMemo(() => {
    if (consoMode === 'kwh') return Math.max(0, num(consoKwh))
    return Math.round((num(factureMensuelle) * 12) / Math.max(0.05, a.prixElecKwh))
  }, [consoMode, consoKwh, factureMensuelle, a.prixElecKwh])

  const prodPerKwc = useMemo(
    () => estimateAnnualProduction({ kwc: 1, region, orientation, tilt: inclinaison }).productiblePerKwc,
    [region, orientation, inclinaison],
  )

  const reco = useMemo(
    () => recommendSizing({ consoAnnuelle, surfaceToit: num(surfaceToit), productiblePerKwc: prodPerKwc }),
    [consoAnnuelle, surfaceToit, prodPerKwc],
  )

  const kwc = kwcOverride ?? reco.kwc
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

  const fin = useMemo(() => computeFinancials({
    kwc,
    productionAnnuelle: production.annualKwh,
    consoAnnuelle,
    autoconsoRate,
    params: { ...a, coutParKwc: coutKwcOverride ?? coutParKwc(kwc) },
  }), [kwc, production.annualKwh, consoAnnuelle, autoconsoRate, a, coutKwcOverride])

  const cashflowData = useMemo(
    () => [{ annee: 0, cumul: -fin.coutNet }, ...fin.projection.map(r => ({ annee: r.annee, cumul: r.cumul }))],
    [fin],
  )
  const monthly = useMemo(() => monthlyProduction(production.annualKwh), [production.annualKwh])

  // ── Navigation wizard ──
  const next = () => (step < STEPS.length ? setStep(step + 1) : setView('results'))
  const prev = () => setStep(Math.max(1, step - 1))

  /* ════════ VUE WIZARD ════════ */
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

        {/* ÉTAPE 1 — Localisation */}
        {step === 1 && (
          <div className="space-y-4">
            <StepHeader icon={MapPin} title="Où se situe le logement ?" subtitle="La région détermine l'ensoleillement (productible kWh/kWc)." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PV_REGIONS.map(r => (
                <button key={r.value} type="button" onClick={() => setRegion(r.value)}
                  className={`text-left p-4 rounded-xl border-2 transition ${region === r.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800">{r.label}</p>
                    <span className="text-xs font-bold text-indigo-600">{r.productible} kWh/kWc</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.examples}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Consommation */}
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

        {/* ÉTAPE 3 — Toiture */}
        {step === 3 && (
          <div className="space-y-4">
            <StepHeader icon={HomeIcon} title="Caractéristiques de la toiture" subtitle="Orientation, inclinaison et surface disponible." />
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
            <InputField label="Surface de toiture disponible" id="surface" type="number" suffix="m²"
              value={surfaceToit} onChange={setSurfaceToit} min={0}
              helper={`≈ ${PV_PANEL.surfaceM2} m² par panneau (${PV_PANEL.puissanceWc} Wc)`} />
          </div>
        )}

        {/* ÉTAPE 4 — Profil */}
        {step === 4 && (
          <div className="space-y-4">
            <StepHeader icon={Users} title="Votre profil de consommation" subtitle="Détermine le taux d'autoconsommation (ce que vous consommez vous-même)." />
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
            <AlertBox type="success" title={`Autoconsommation estimée : ${Math.round(autoconsoRateAuto * 100)} %`}>
              Plus vous consommez l'électricité au moment où elle est produite (journée), plus le solaire est rentable.
            </AlertBox>
          </div>
        )}

        {/* ÉTAPE 5 — Objectif */}
        {step === 5 && (
          <div className="space-y-4">
            <StepHeader icon={Target} title="Votre objectif principal" subtitle="Pour adapter notre recommandation." />
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
            <AlertBox type="info">
              Sur la base de vos réponses, nous recommandons une installation de <strong>{reco.kwc} kWc</strong> ({reco.nbPanneaux} panneaux).
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

  /* ════════ VUE RÉSULTATS ════════ */
  const payback = fin.paybackAnnee
  return (
    <SimulatorLayout code="PHOTOVOLTAÏQUE" title="Votre projet photovoltaïque" description="Production, économies & rentabilité estimées">

      <button onClick={() => setView('wizard')} className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold">
        <ChevronLeft className="w-4 h-4" /> Modifier mes réponses
      </button>

      {/* ── Hero : dimensionnement + production ── */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider">Installation recommandée</p>
            <p className="text-4xl font-extrabold mt-1">{kwc} kWc</p>
            <p className="text-indigo-200 text-sm mt-1">{nbPanneaux} panneaux · ≈ {reco.surfaceNecessaire} m²</p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider">Production estimée</p>
            <p className="text-4xl font-extrabold mt-1">{kwh(production.annualKwh)}</p>
            <p className="text-indigo-200 text-sm mt-1">par an · {production.regionLabel}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider">Couverture de vos besoins</p>
            <p className="text-4xl font-extrabold mt-1">{fin.tauxCouvertureProd} %</p>
            <p className="text-indigo-200 text-sm mt-1">de votre conso annuelle</p>
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

      {/* ── KPI principaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={PiggyBank} color="indigo" label="Coût net (après prime)" value={eur(fin.coutNet)} sub={`${eur(fin.coutBrut)} − ${eur(fin.prime)} prime`} />
        <KpiCard icon={Euro} color="green" label="Économie 1ʳᵉ année" value={eur(fin.economieAn1)} sub={`${fin.tauxAutoproduction}% d'autoproduction`} />
        <KpiCard icon={CalendarClock} color="amber" label="Amortissement" value={payback != null ? `${payback.toFixed(1)} ans` : '> durée de vie'} sub="Retour sur investissement" />
        <KpiCard icon={TrendingUp} color="indigo" label={`Gain net sur ${a.dureeVieAnnees} ans`} value={eur(fin.gainNetFinal)} sub={`ROI ${fin.roi} %`} />
      </div>

      {/* ── Graphique : trésorerie cumulée (amortissement) ── */}
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

      {/* ── Production mensuelle + Autoconso/Surplus ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4"><Sun className="w-5 h-5 text-amber-500" /><h3 className="font-bold text-gray-800">Production mensuelle estimée</h3></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <RTooltip formatter={(v) => [kwh(v), 'Production']} />
              <Bar dataKey="kwh" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4"><BadgePercent className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-800">Répartition de la production (an 1)</h3></div>
          <div className="space-y-4 mt-6">
            <SplitBar label="Autoconsommée" sub="économie directe sur la facture" value={fin.autoconsoKwhAn1} total={production.annualKwh} color="bg-indigo-500" />
            <SplitBar label="Surplus revendu" sub={`rachat ${a.tarifOAKwh} €/kWh`} value={fin.surplusKwhAn1} total={production.annualKwh} color="bg-lime-500" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">TRI (rendement)</p><p className="text-lg font-extrabold text-gray-800">{fin.tri != null ? `${fin.tri} %` : '—'}</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">Coût du kWh produit</p><p className="text-lg font-extrabold text-gray-800">{fin.lcoe.toFixed(2).replace('.', ',')} €</p></div>
          </div>
        </div>
      </div>

      {/* ── Synthèse narrative ── */}
      <AlertBox type="success" title="Ce que cela signifie pour vous">
        Pour un investissement net de <strong>{eur(fin.coutNet)}</strong>, votre installation de {kwc} kWc produit
        <strong> {kwh(production.annualKwh)}/an</strong>, couvre <strong>{fin.tauxAutoproduction}%</strong> de votre
        consommation et vous fait économiser <strong>{eur(fin.economieAn1)}</strong> dès la 1ʳᵉ année.
        {payback != null && <> Elle est <strong>remboursée en {payback.toFixed(1)} ans</strong>, puis génère du gain net</>}
        {' '}— soit <strong>{eur(fin.gainNetFinal)}</strong> sur {a.dureeVieAnnees} ans.
      </AlertBox>

      {/* ── Hypothèses éditables ── */}
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
        Estimation indicative (modèle de productible régional — PVGIS non appelable depuis le navigateur).
        Tarifs et coûts par défaut, à ajuster selon le devis réel. Document non contractuel.
      </p>

      <div className="flex justify-center pt-2">
        <Button variant="secondary" onClick={() => { setView('wizard'); setStep(1) }}>
          <RefreshCw className="w-4 h-4" /> Nouvelle simulation
        </Button>
      </div>
    </SimulatorLayout>
  )
}

/* ── Sous-composants ── */
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
