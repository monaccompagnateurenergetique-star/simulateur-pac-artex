import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, Zap, TrendingUp, Info, Settings2, ChevronDown, ChevronUp, Gauge, Search, Loader2, ExternalLink, Flame, Droplets } from 'lucide-react'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import AlertBox from '../../components/ui/AlertBox'
import { BAR_TH_179 } from '../../lib/constants/barTh179'
import { ZONE_OPTIONS } from '../../lib/constants/zones'
import { calculateBarTh179 } from '../../lib/calculators/barTh179'
import { useSimulatorContext } from '../../hooks/useSimulatorContext'
import { getZoneSimplifiee } from '../../utils/postalCode'
import { formatCurrency, formatKWhc, formatNumber } from '../../utils/formatters'
import { prospectDPE, getDpeColor } from '../../utils/dpeApi'

export default function BarTh179Page() {
  const { getDefault } = useSimulatorContext('BAR-TH-179')

  const [postalCode, setPostalCode] = useState(() => getDefault('postalCode', ''))
  const [zone, setZone] = useState(() => getDefault('zone', 'H1'))
  const [usage, setUsage] = useState(() => getDefault('usage', 'chauffage_ecs'))
  const [etasClass, setEtasClass] = useState(() => getDefault('etasClass', '126-150'))
  const [nbClassique, setNbClassique] = useState(() => getDefault('nbClassique', 10))
  const [nbPrecaire, setNbPrecaire] = useState(() => getDefault('nbPrecaire', 5))
  const [chauffageExistant, setChauffageExistant] = useState(() => getDefault('chauffageExistant', 'gaz'))
  const [prixClassique, setPrixClassique] = useState(() => getDefault('prixClassique', BAR_TH_179.PRIX_MWHC.classique))
  const [prixPrecaire, setPrixPrecaire] = useState(() => getDefault('prixPrecaire', BAR_TH_179.PRIX_MWHC.precaire))
  const [puissancePac, setPuissancePac] = useState(() => getDefault('puissancePac', 100))
  const [puissanceTotale, setPuissanceTotale] = useState(() => getDefault('puissanceTotale', 100))
  const [showDimensionnement, setShowDimensionnement] = useState(false)
  const [showProspectionModal, setShowProspectionModal] = useState(false)

  // ─── Prospection ADEME ───
  const [ademeData, setAdemeData] = useState(null)
  const [ademeLoading, setAdemeLoading] = useState(false)
  const ademeAbort = useRef(null)

  useEffect(() => {
    if (!postalCode || postalCode.length !== 5) {
      setAdemeData(null)
      return
    }

    ademeAbort.current?.abort()
    const ctrl = new AbortController()
    ademeAbort.current = ctrl

    const timer = setTimeout(async () => {
      setAdemeLoading(true)
      try {
        // Query ALL DPE with collectif heating (appartement + immeuble)
        // ADEME DPE are mostly per-logement (type "appartement"), not per-building
        const energies = ['Gaz naturel', 'Fioul domestique', 'Charbon']
        const [allCollectif, ...perEnergy] = await Promise.all([
          prospectDPE({ postalCode, installationChauffage: 'collectif', size: 1 }),
          ...energies.map(e =>
            prospectDPE({ postalCode, installationChauffage: 'collectif', energieChauffage: e, size: 3 })
          ),
        ])

        // ECS individuel
        const ecsIndiv = await prospectDPE({ postalCode, installationChauffage: 'collectif', installationEcs: 'individuel', size: 1 })

        if (!ctrl.signal.aborted) {
          const energieDetail = energies.map((e, i) => ({
            label: e === 'Gaz naturel' ? 'Gaz' : e === 'Fioul domestique' ? 'Fioul' : 'Charbon',
            total: perEnergy[i].total,
            topResults: perEnergy[i].results,
          }))
          const totalCoupDePouce = energieDetail.reduce((s, e) => s + e.total, 0)
          // Collect top sample results across all energies (max 3)
          const sampleResults = energieDetail
            .flatMap(e => e.topResults.map(r => ({ ...r, energieLabel: e.label })))
            .slice(0, 3)
          setAdemeData({
            totalCollectif: allCollectif.total,
            totalCoupDePouce,
            energieDetail,
            ecsIndividuel: ecsIndiv.total,
            sampleResults,
          })
        }
      } catch {
        if (!ctrl.signal.aborted) setAdemeData(null)
      } finally {
        if (!ctrl.signal.aborted) setAdemeLoading(false)
      }
    }, 600)

    return () => { clearTimeout(timer); ctrl.abort() }
  }, [postalCode])

  function handlePostalCodeChange(val) {
    setPostalCode(val)
    if (typeof val === 'string' && val.length === 5) {
      const detected = getZoneSimplifiee(val)
      if (detected) setZone(detected)
    }
  }

  const nbTotal = (Number(nbClassique) || 0) + (Number(nbPrecaire) || 0)

  const result = useMemo(
    () => calculateBarTh179({
      usage,
      etasClass,
      zone,
      nbClassique: Number(nbClassique) || 0,
      nbPrecaire: Number(nbPrecaire) || 0,
      chauffageExistant,
      prixClassique: Number(prixClassique) || 7,
      prixPrecaire: Number(prixPrecaire) || 12,
      puissancePac: Number(puissancePac) || 100,
      puissanceTotale: Number(puissanceTotale) || 100,
    }),
    [usage, etasClass, zone, nbClassique, nbPrecaire, chauffageExistant, prixClassique, prixPrecaire, puissancePac, puissanceTotale]
  )

  const chauffageInfo = BAR_TH_179.CHAUFFAGE_EXISTANT_OPTIONS.find((o) => o.value === chauffageExistant)
  const forfaitAffiche = BAR_TH_179.FORFAITS[usage]?.[etasClass]?.[zone] || 0

  return (
    <SimulatorLayout
      code="BAR-TH-179"
      title="Simulateur PAC Collective"
      description="Pompe à chaleur collective air/eau — CEE + Coup de Pouce (fiche vA75-1)"
    >
      {/* ─── SECTION 1 : L'immeuble ─── */}
      <section className="animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-brand-600" />
          <h2 className="text-[13px] font-semibold text-text">L'immeuble</h2>
        </div>

        <div className="bg-surface rounded-[var(--radius)] border border-border p-5 shadow-v2-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Code postal"
              id="postalCode"
              value={postalCode}
              onChange={handlePostalCodeChange}
              placeholder="75001"
              helper={postalCode.length === 5 && getZoneSimplifiee(postalCode)
                ? `Zone : ${getZoneSimplifiee(postalCode)}`
                : 'Auto-détection zone'}
            />
            <SelectField
              label="Zone climatique"
              id="zone"
              value={zone}
              onChange={setZone}
              options={ZONE_OPTIONS}
            />
            <SelectField
              label="Chauffage collectif remplacé"
              id="chauffageExistant"
              value={chauffageExistant}
              onChange={setChauffageExistant}
              options={BAR_TH_179.CHAUFFAGE_EXISTANT_OPTIONS}
            />
          </div>

          {/* Coup de Pouce */}
          {chauffageInfo?.coupDePouce ? (
            <div className="bg-brand-50 rounded-[var(--radius-sm)] px-4 py-2.5 border border-brand-100 flex items-center gap-3">
              <Zap className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-text">
                  Coup de Pouce x{BAR_TH_179.COUP_DE_POUCE.multiplicateur} activé
                </p>
                <p className="text-[11px] text-muted">Remplacement chaudière {chauffageExistant} — volume CEE triplé</p>
              </div>
            </div>
          ) : (
            <div className="bg-surface-tertiary rounded-[var(--radius-sm)] px-4 py-2 border border-border-light flex items-center gap-3">
              <Info className="w-4 h-4 text-muted shrink-0" />
              <p className="text-[11px] text-muted">
                Coup de Pouce non applicable — uniquement pour chaudière gaz, fioul ou charbon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Promo Prospection DPE — Bandeau discret ─── */}
      {postalCode.length === 5 && (ademeLoading || ademeData) && (
        <section className="animate-fade-in" style={{ animationDelay: '0.03s' }}>
          {ademeLoading ? (
            <div className="flex items-center gap-2 px-1 text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">Analyse du secteur...</span>
            </div>
          ) : ademeData && ademeData.totalCoupDePouce > 0 ? (
            <button
              type="button"
              onClick={() => setShowProspectionModal(true)}
              className="w-full flex items-center gap-3 bg-artex-primary/5 hover:bg-artex-primary/10 border border-brand-100 rounded-[var(--radius)] px-4 py-3 transition cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12px] font-semibold text-text">
                  <span className="text-brand-600">{ademeData.totalCoupDePouce}</span> immeubles éligibles Coup de Pouce détectés sur <span className="font-bold">{postalCode}</span>
                </p>
                <p className="text-[10px] text-muted mt-0.5">Potentiel clients PAC collective — Cliquez pour explorer</p>
              </div>
              <span className="text-[11px] font-semibold text-brand-600 group-hover:text-white bg-brand-600/10 group-hover:bg-brand-600 px-3 py-1.5 rounded-full transition shrink-0">
                Voir le potentiel
              </span>
            </button>
          ) : ademeData && ademeData.totalCollectif === 0 ? (
            <div className="flex items-center gap-2 px-1">
              <Info className="w-3.5 h-3.5 text-muted shrink-0" />
              <p className="text-[11px] text-muted">Aucun immeuble collectif fossile trouvé sur {postalCode}.</p>
            </div>
          ) : null}
        </section>
      )}

      {/* ─── Modal Prospection DPE ─── */}
      {showProspectionModal && ademeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowProspectionModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-surface rounded-[var(--radius-lg)] shadow-v2-md w-full max-w-lg max-h-[85vh] overflow-y-auto animate-result-pop"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-artex-primary rounded-t-[var(--radius-lg)] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-artex-green" />
                <div>
                  <p className="text-[13px] font-semibold text-white">Prospection DPE — {postalCode}</p>
                  <p className="text-[10px] text-white/50">Données ADEME — immeubles chauffage collectif fossile</p>
                </div>
              </div>
              <button
                onClick={() => setShowProspectionModal(false)}
                className="text-white/50 hover:text-white text-xl leading-none transition px-1"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-text tabular-nums">{ademeData.totalCollectif}</p>
                  <p className="text-[10px] text-muted leading-tight">Immeubles<br />collectifs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-brand-600 tabular-nums">{ademeData.totalCoupDePouce}</p>
                  <p className="text-[10px] text-muted leading-tight">Coup de<br />Pouce</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-text tabular-nums">{ademeData.ecsIndividuel}</p>
                  <p className="text-[10px] text-muted leading-tight">ECS<br />individuelle</p>
                </div>
                <div className="text-center bg-brand-50 rounded-[var(--radius-sm)] py-2">
                  <p className="text-xl font-extrabold text-brand-600 tabular-nums">{ademeData.totalCoupDePouce}</p>
                  <p className="text-[10px] text-brand-600 font-semibold leading-tight">Potentiel<br />clients</p>
                </div>
              </div>

              {/* Énergie breakdown */}
              {ademeData.totalCoupDePouce > 0 && (
                <div className="flex gap-2">
                  {ademeData.energieDetail.filter(e => e.total > 0).map(e => (
                    <div key={e.label} className="flex-1 bg-surface-tertiary rounded-[var(--radius-sm)] px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Flame className="w-3.5 h-3.5 text-warning" />
                        <span className="text-[12px] font-semibold text-text">{e.label}</span>
                      </div>
                      <p className="text-lg font-bold text-text tabular-nums">{e.total}</p>
                      <p className="text-[10px] text-muted">DPE trouvés</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample results */}
              {ademeData.sampleResults?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Exemples d'immeubles éligibles</p>
                  {ademeData.sampleResults.map((r, i) => {
                    const dpeColor = getDpeColor(r.etiquetteDpe)
                    return (
                      <div key={r.numeroDpe || i} className="flex items-center gap-3 bg-surface-tertiary rounded-[var(--radius-sm)] px-3 py-2.5">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold shrink-0"
                          style={{ backgroundColor: dpeColor.bg, color: dpeColor.text }}
                        >
                          {r.etiquetteDpe || '?'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-text truncate">
                            {r.adresse || 'Adresse non renseignée'}{r.commune ? `, ${r.commune}` : ''}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted mt-0.5">
                            {r.nombreAppartements && (
                              <span className="flex items-center gap-0.5">
                                <Building2 className="w-3 h-3" /> {r.nombreAppartements} logts
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-warning" /> {r.energieLabel}
                            </span>
                            {r.installationEcs && (
                              <span className="flex items-center gap-0.5">
                                <Droplets className="w-3 h-3" /> ECS {r.installationEcs}
                              </span>
                            )}
                            {r.consoM2 && <span>{r.consoM2} kWh/m²</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex gap-2 pt-1">
                <Link
                  to={`/prospection-dpe?cp=${postalCode}&chauffage=collectif`}
                  className="flex-1 text-center bg-artex-primary hover:bg-artex-secondary text-white text-[12px] font-semibold py-3 rounded-[var(--radius-sm)] transition"
                >
                  Explorer les {ademeData.totalCoupDePouce} immeubles →
                </Link>
                <button
                  type="button"
                  onClick={() => setShowProspectionModal(false)}
                  className="px-4 py-3 text-[12px] font-semibold text-muted hover:text-text border border-border rounded-[var(--radius-sm)] transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 2 : Répartition des ménages ─── */}
      <section className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-brand-600" />
          <h2 className="text-[13px] font-semibold text-text">Répartition des ménages</h2>
        </div>

        <div className="bg-surface rounded-[var(--radius)] border border-border p-5 shadow-v2-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Classique */}
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-[13px] font-semibold text-text">Ménages classiques</span>
              </div>
              <InputField
                label="Nombre de logements"
                id="nbClassique"
                type="number"
                value={nbClassique}
                onChange={setNbClassique}
                min={0}
                helper="Revenus intermédiaires et supérieurs"
              />
              <InputField
                label="Prix CEE"
                id="prixClassique"
                type="number"
                value={prixClassique}
                onChange={setPrixClassique}
                suffix="€/MWhc"
                step={0.5}
                min={1}
                max={20}
              />
            </div>

            {/* Précaire */}
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[13px] font-semibold text-text">Ménages précaires</span>
              </div>
              <InputField
                label="Nombre de logements"
                id="nbPrecaire"
                type="number"
                value={nbPrecaire}
                onChange={setNbPrecaire}
                min={0}
                helper="Revenus modestes et très modestes"
              />
              <InputField
                label="Prix CEE"
                id="prixPrecaire"
                type="number"
                value={prixPrecaire}
                onChange={setPrixPrecaire}
                suffix="€/MWhc"
                step={0.5}
                min={1}
                max={20}
              />
            </div>
          </div>

          {/* Barre total */}
          {nbTotal > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-text">{nbTotal} logement{nbTotal > 1 ? 's' : ''}</span>
                <div className="flex gap-3 text-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                    {Math.round(((Number(nbClassique) || 0) / nbTotal) * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    {Math.round(((Number(nbPrecaire) || 0) / nbTotal) * 100)}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-surface-tertiary overflow-hidden flex">
                <div className="bg-orange-400 transition-all duration-300" style={{ width: `${((Number(nbClassique) || 0) / nbTotal) * 100}%` }} />
                <div className="bg-indigo-500 transition-all duration-300" style={{ width: `${((Number(nbPrecaire) || 0) / nbTotal) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 3 : Équipement PAC ─── */}
      <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-brand-600" />
          <h2 className="text-[13px] font-semibold text-text">Équipement PAC</h2>
        </div>

        <div className="bg-surface rounded-[var(--radius)] border border-border p-5 shadow-v2-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Usage de la PAC"
              id="usage"
              value={usage}
              onChange={setUsage}
              options={BAR_TH_179.USAGE_OPTIONS}
            />
            <SelectField
              label="Classe ETAS"
              id="etasClass"
              value={etasClass}
              onChange={setEtasClass}
              options={BAR_TH_179.ETAS_OPTIONS}
            />
          </div>

          {/* Forfait résultant */}
          <div className="bg-surface-tertiary rounded-[var(--radius-sm)] p-3 flex items-center justify-between">
            <span className="text-[12px] text-muted">
              Forfait / logement ({usage === 'chauffage_ecs' ? 'Ch+ECS' : 'Chauffage'}, {etasClass}%, {zone})
            </span>
            <span className="text-lg font-extrabold text-text tabular-nums">{formatKWhc(forfaitAffiche)}</span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4 : Dimensionnement PAC (rétracté) ─── */}
      <section className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <button
          type="button"
          onClick={() => setShowDimensionnement(!showDimensionnement)}
          className="w-full flex items-center justify-between mb-3 group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-brand-600" />
            <h2 className="text-[13px] font-semibold text-text">Dimensionnement PAC (facteur R)</h2>
            {result.facteurR < 1 && (
              <span className="text-[11px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-semibold">
                R = {result.facteurR}
              </span>
            )}
          </div>
          {showDimensionnement
            ? <ChevronUp className="w-4 h-4 text-muted group-hover:text-brand-600 transition" />
            : <ChevronDown className="w-4 h-4 text-muted group-hover:text-brand-600 transition" />
          }
        </button>

        {showDimensionnement && (
          <div className="bg-surface rounded-[var(--radius)] border border-border p-5 shadow-v2-sm space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Puissance nominale PAC"
                id="puissancePac"
                type="number"
                value={puissancePac}
                onChange={setPuissancePac}
                suffix="kW"
                min={1}
                max={400}
                helper="Max 400 kW pour éligibilité"
              />
              <InputField
                label="Puissance totale chaufferie"
                id="puissanceTotale"
                type="number"
                value={puissanceTotale}
                onChange={setPuissanceTotale}
                suffix="kW"
                min={1}
                helper="Hors secours"
              />
            </div>

            <div className={`rounded-[var(--radius-sm)] p-3 text-[12px] ${result.facteurR < 1
              ? 'bg-warning/5 border border-warning/20 text-warning'
              : 'bg-success/5 border border-success/20 text-success'
            }`}>
              <span className="font-semibold">R = {result.facteurR}</span>
              <span className="ml-2 font-normal">
                {result.facteurR < 1 ? 'PAC < 40% puissance totale' : 'PAC ≥ 40% — pas de réduction'}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ─── SECTION 5 : Résultats ─── */}
      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <h2 className="text-[13px] font-semibold text-text">Résultats CEE</h2>
        </div>

        {nbTotal === 0 ? (
          <AlertBox type="warning">Saisissez le nombre de logements pour calculer la prime CEE.</AlertBox>
        ) : (
          <div className="space-y-4">
            {/* Hero — Dark block synthèse */}
            <div className="bg-artex-primary rounded-[var(--radius)] p-6 shadow-v2-md text-center animate-result-pop">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-1">Prime CEE estimée</p>
              <p className="text-4xl font-extrabold text-artex-green tabular-nums">{formatCurrency(result.primeTotale)}</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">
                {formatCurrency(result.primeTotale / nbTotal)}
                <span className="text-[13px] font-normal text-white/50 ml-1">/ logement en moyenne</span>
              </p>
              <p className="text-[11px] text-white/40 mt-3">
                {formatNumber(result.volumeTotal / 1000)} MWhc cumac — {nbTotal} logement{nbTotal > 1 ? 's' : ''}
              </p>
            </div>

            {/* Détail classique / précaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-surface rounded-[var(--radius)] border border-border p-4 shadow-v2-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[12px] font-semibold text-text-secondary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    Classiques ({nbClassique})
                  </h3>
                  <span className="text-[11px] font-semibold text-orange-600 bg-orange-400/10 px-2 py-0.5 rounded-full">
                    {prixClassique} €/MWhc
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-text tabular-nums">{formatCurrency(result.primeClassique)}</p>
                {Number(nbClassique) > 0 && (
                  <p className="text-[11px] text-muted mt-1">{formatCurrency(result.primeClassique / Number(nbClassique))} / logement</p>
                )}
              </div>

              <div className="bg-surface rounded-[var(--radius)] border border-border p-4 shadow-v2-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[12px] font-semibold text-text-secondary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Précaires ({nbPrecaire})
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    {prixPrecaire} €/MWhc
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-text tabular-nums">{formatCurrency(result.primePrecaire)}</p>
                {Number(nbPrecaire) > 0 && (
                  <p className="text-[11px] text-muted mt-1">{formatCurrency(result.primePrecaire / Number(nbPrecaire))} / logement</p>
                )}
              </div>
            </div>

            {/* Détail de calcul — rétracté */}
            <details className="bg-surface rounded-[var(--radius)] border border-border shadow-v2-xs">
              <summary className="p-4 cursor-pointer text-[12px] font-semibold text-text-secondary hover:text-text select-none">
                Détail du calcul
              </summary>
              <div className="px-4 pb-4 border-t border-border-light pt-3 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <p className="text-[11px] text-muted">Forfait / logement</p>
                    <p className="text-[13px] font-semibold text-text tabular-nums">{formatKWhc(result.forfait)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Facteur R</p>
                    <p className="text-[13px] font-semibold text-text">x{result.facteurR}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Coup de Pouce</p>
                    <p className="text-[13px] font-semibold">
                      {result.coupDePouce
                        ? <span className="text-success">x{result.multiplicateur}</span>
                        : <span className="text-muted">x1</span>
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Prix classique</p>
                    <p className="text-[13px] font-semibold text-text tabular-nums">{prixClassique} €</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Prix précaire</p>
                    <p className="text-[13px] font-semibold text-text tabular-nums">{prixPrecaire} €</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border-light text-[11px] text-muted space-y-1">
                  <p>
                    Volume = {formatKWhc(result.forfait)} × {result.facteurR}
                    {result.coupDePouce ? ` × ${result.multiplicateur}` : ''} = <strong className="text-text">{formatKWhc(result.volumeParLogement)}</strong> /logement
                  </p>
                  <p>
                    Prime = {formatNumber(result.volumeParLogement / 1000)} MWhc × ({nbClassique}×{prixClassique}€ + {nbPrecaire}×{prixPrecaire}€) = <strong className="text-text">{formatCurrency(result.primeTotale)}</strong>
                  </p>
                </div>
              </div>
            </details>

            {Number(puissancePac) > 400 && (
              <AlertBox type="error">Puissance PAC &gt; 400 kW — non éligible BAR-TH-179.</AlertBox>
            )}
          </div>
        )}
      </section>
    </SimulatorLayout>
  )
}
