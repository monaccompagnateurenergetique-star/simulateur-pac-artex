import { useState, useMemo, useEffect } from 'react'
import {
  PAC_SIZING,
  DEFAULT_INSULATION_BY_PERIOD,
  INSULATION_RENO_FULL,
} from '../../lib/constants/dimPac'
import { ZONE_DETAIL_OPTIONS, getZoneFromPostalCode } from '../../lib/constants/zones'
import { calculatePacSizing } from '../../lib/calculators/dimPac'
import SimulatorLayout from '../../components/simulator/SimulatorLayout'
import DimPacNote from '../../components/simulator/DimPacNote'
import InfoHint from '../../components/common/InfoHint'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { searchAddress, fetchAltitude } from '../../lib/services/geolocation'
import { deptFromPostalCode } from '../../lib/services/tBaseLookup'
import './_artex-tokens.css'
import './SimShared.css'
import './SimDimensionnementPac.css'

export default function DimPacPage() {
  // ─── Carte 1 : Localisation & Logement ──────────────────
  const [housingType, setHousingType] = useState('Maison')
  const [surface, setSurface] = useState(100)
  const [surfaceFocused, setSurfaceFocused] = useState(false)
  const [ceilingHeight, setCeilingHeight] = useState(2.5)
  const [nbEtages, setNbEtages] = useState(1)
  const [postalCode, setPostalCode] = useState('')
  const [zone, setZone] = useState('H1b')

  const [addressLabel, setAddressLabel] = useState('')
  const [altitudeM, setAltitudeM] = useState(100)
  const [altitudeSource, setAltitudeSource] = useState('default')
  const [geoLoading, setGeoLoading] = useState(false)

  /** Sélection depuis l'autocomplete BAN : déclenche altitude auto + CP + zone */
  const handleAddressSelected = async (addr) => {
    setAddressLabel(addr.label || '')
    if (addr.postalCode) setPostalCode(addr.postalCode.replace(/\D/g, ''))
    try {
      const results = await searchAddress(addr.label || `${addr.address} ${addr.postalCode} ${addr.city}`)
      const match = results[0]
      if (!match) return
      setGeoLoading(true)
      const alt = await fetchAltitude(match.lat, match.lon)
      setAltitudeM(alt.altitude)
      setAltitudeSource('auto')
    } catch (e) {
      console.warn('[DIM-PAC] altitude auto KO', e)
    } finally {
      setGeoLoading(false)
    }
  }

  // Auto-détection zone depuis code postal
  useEffect(() => {
    if (postalCode.length === 5) {
      const detectedZone = getZoneFromPostalCode(postalCode)
      if (detectedZone) setZone(detectedZone)
    }
  }, [postalCode])

  // ─── Carte 2 : Période de construction ──────────────────
  const [construction, setConstruction] = useState('1989_2000')

  // ─── Carte 3 : Isolation détaillée (état réel par poste) ─
  const [insulation, setInsulation] = useState(DEFAULT_INSULATION_BY_PERIOD['1989_2000'])

  const handleConstructionChange = (p) => {
    setConstruction(p)
    setInsulation(DEFAULT_INSULATION_BY_PERIOD[p])
  }
  const applyPreset = (preset) => {
    setInsulation(preset === 'reno' ? INSULATION_RENO_FULL : DEFAULT_INSULATION_BY_PERIOD[construction])
  }
  const setInsulationLevel = (key, value) => {
    setInsulation(prev => ({ ...prev, [key]: value }))
  }

  // ─── Carte 4 : Installation actuelle ────────────────────
  const [heatingSystem, setHeatingSystem] = useState('fioul')
  const [emitters, setEmitters] = useState(['radiateur_acier_alu'])
  const [includeEcs, setIncludeEcs] = useState(true)

  const toggleEmitter = (e) => {
    setEmitters(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }

  // ─── Note : champs libres ───────────────────────────────
  const [clientName, setClientName] = useState('')
  const [conseillerName, setConseillerName] = useState('')

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
      construction, insulation,
      heatingSystem, emitters, includeEcs,
    }),
    [housingType, surface, ceilingHeight, nbEtages, zone, altitudeM, dept, construction, insulation, heatingSystem, emitters, includeEcs],
  )

  const zoneDetail = ZONE_DETAIL_OPTIONS.find(z => z.value === zone)
  const periodDef = PAC_SIZING.CONSTRUCTION_PERIODS.find(p => p.value === construction)
  const heatingDef = PAC_SIZING.HEATING_SYSTEMS.find(h => h.value === heatingSystem)

  const topDeperditions = result.deperditionsByCategory.slice(0, 3)
  const numSurface = typeof surface === 'number' ? surface : (parseFloat(surface) || 0)
  // Alerte uniquement hors saisie (champ non focus) et pour des valeurs vraiment aberrantes.
  const surfaceWarn = !surfaceFocused && numSurface > 0 && (numSurface < 10 || numSurface > 1000)

  const summarySentence = result.intersection.valid
    ? `Pour couvrir les ~${result.deperditionsKw.toFixed(1)} kW de déperditions de ce logement tout en respectant la prime CEE (BAR-TH-171) et la norme DTU 68.16, une pompe à chaleur de ${result.puissanceRecommandeeKw} kW est idéale (plage acceptable : ${result.intersection.minKw.toFixed(1)} à ${result.intersection.maxKw.toFixed(1)} kW).`
    : `Avec ces paramètres, les règles CEE et DTU ne se recoupent pas — vérifiez la surface, l'isolation ou les émetteurs. À titre indicatif, la puissance proposée est de ${result.puissanceRecommandeeKw} kW.`

  const today = new Date()
  const dateLabel = today.toLocaleDateString('fr-FR')
  const reference = `DIM-${postalCode || 'PAC'}-${dateLabel.replace(/\//g, '')}`
  const noteData = {
    conseillerName: conseillerName.trim(),
    clientName: clientName.trim(),
    address: addressLabel,
    postalCode,
    deptName: result.tBaseSource?.deptName,
    dept: result.tBaseSource?.dept,
    zone: zoneDetail?.value,
    dateLabel,
    reference,
    housingType,
    surface: typeof surface === 'number' ? surface : 100,
    ceilingHeight: typeof ceilingHeight === 'number' ? ceilingHeight : 2.5,
    nbEtages,
    periodLabel: periodDef?.label ?? '',
    heatingLabel: heatingDef?.label ?? '',
    includeEcs,
    result,
    topDeperditions: topDeperditions.map(c => ({ key: c.key, label: c.label, percentage: c.percentage })),
  }

  return (
    <SimulatorLayout
      code="DIM-PAC"
      title="Dimensionnement PAC air/eau"
      description="Méthode G pondérée — conforme Guide CEE BAR-TH-171 & DTU 68.16"
    >

      {/* ══════════ CARTE 1 : Localisation & Logement ══════════ */}
      <div className="sim-card">
        <div className="sim-card__head">
          <div className="sim-card__icon"><i className="fa-solid fa-house" /></div>
          <div>
            <h3 className="sim-card__title">Localisation &amp; Logement</h3>
            <p className="sim-card__subtitle">Caractéristiques physiques du bâtiment</p>
          </div>
        </div>

        <div className="sim-layout__fields">
          <div className="sim-field">
            <span className="sim-label">Type de logement</span>
            <div className="sim-toggle">
              <button className={`sim-toggle__btn ${housingType === 'Maison' ? 'sim-toggle__btn--on' : ''}`} onClick={() => setHousingType('Maison')}>
                <i className="fa-solid fa-house" /> Maison
              </button>
              <button className={`sim-toggle__btn ${housingType === 'Appartement' ? 'sim-toggle__btn--on' : ''}`} onClick={() => setHousingType('Appartement')}>
                <i className="fa-solid fa-building" /> Appartement
              </button>
            </div>
          </div>

          <div className="sim-grid-2">
            <div className="sim-field">
              <span className="sim-label">Surface chauffée</span>
              <div className="sim-input-wrap">
                <input
                  className="sim-input"
                  type="number"
                  min={0}
                  value={surface}
                  onFocus={() => setSurfaceFocused(true)}
                  onBlur={() => { setSurfaceFocused(false); if (surface === '' || numSurface < 1) setSurface(100) }}
                  onChange={e => { const v = e.target.value; setSurface(v === '' ? '' : (parseFloat(v) || 0)) }}
                />
                <span className="sim-input-suffix">m²</span>
              </div>
              {surfaceWarn && (
                <span className="dim-pac__helper" style={{ color: 'var(--warning-emphasis, #92400e)' }}>
                  <i className="fa-solid fa-triangle-exclamation" /> Surface inhabituelle — vérifiez la valeur.
                </span>
              )}
            </div>
            <div className="sim-field">
              <span className="sim-label">Hauteur sous plafond</span>
              <div className="sim-input-wrap">
                <input className="sim-input" type="number" min={2} max={5} step={0.1} value={ceilingHeight} onChange={e => setCeilingHeight(Math.max(2, parseFloat(e.target.value) || 2.5))} />
                <span className="sim-input-suffix">m</span>
              </div>
            </div>
          </div>

          <div className="sim-field">
            <span className="sim-label">Nombre d'étages</span>
            <div className="dim-pac__etages">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`dim-pac__etage-btn ${nbEtages === n ? 'dim-pac__etage-btn--active' : ''}`}
                  onClick={() => setNbEtages(n)}
                  type="button"
                >
                  {n === 5 ? '5+' : n}
                </button>
              ))}
            </div>
          </div>

          <div className="sim-field">
            <span className="sim-label">
              Adresse du logement
              <span className="dim-pac__helper"> (code postal accepté · auto-remplit altitude et T° base)</span>
            </span>
            <AddressAutocomplete
              value={addressLabel}
              placeholder="ex: 16 rue du Bourg, 57510 Ernestviller  —  ou juste 57510"
              onChange={(a) => {
                if (a && a.label) handleAddressSelected(a)
                else setAddressLabel('')
              }}
            />
            {postalCode && (
              <div className="dim-pac__address-info">
                <i className="fa-solid fa-circle-check" />
                <span>
                  <strong>{postalCode}</strong>
                  {result.tBaseSource?.standard === 'NF P 52-612' && result.tBaseSource.deptName && (
                    <> · {result.tBaseSource.deptName} ({result.tBaseSource.dept})</>
                  )}
                  {zoneDetail && <> · Zone {zoneDetail.value}</>}
                </span>
                {postalCode.length === 5 && !getZoneFromPostalCode(postalCode) && (
                  <em className="dim-pac__address-info-warn">CP non reconnu</em>
                )}
              </div>
            )}
          </div>

          <div className="sim-field">
            <span className="sim-label">
              Altitude
              <InfoHint text="Altitude du logement. Plus on monte, plus la température extérieure de base est basse (≈ −1 °C par 200 m), ce qui augmente les déperditions." />
              {altitudeSource === 'auto' && !geoLoading && (
                <span className="dim-pac__helper" style={{ color: '#10b981' }}> ✓ auto (Open-Meteo)</span>
              )}
              {geoLoading && (
                <span className="dim-pac__helper" style={{ color: '#2563eb' }}> … récupération</span>
              )}
              {altitudeSource === 'manual' && (
                <span className="dim-pac__helper"> (saisie manuelle)</span>
              )}
            </span>
            <div className="sim-input-wrap">
              <input
                className="sim-input"
                type="number"
                placeholder="0"
                min={0}
                max={3000}
                step={1}
                value={altitudeM}
                onChange={e => {
                  const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                  setAltitudeM(Number.isNaN(v) ? 0 : v)
                  setAltitudeSource('manual')
                }}
              />
              <span className="sim-input-suffix">m</span>
            </div>
          </div>

          <div className="dim-pac__tbase-badge">
            <i className="fa-solid fa-temperature-low" />
            <div className="dim-pac__tbase-info">
              <span className="dim-pac__tbase-label">
                Température extérieure de base
                <InfoHint text="Température extérieure minimale de dimensionnement (NF P 52-612) pour le département et l'altitude. Sert de référence au calcul des déperditions." />
                {result.tBaseSource?.standard && (
                  <span style={{ opacity: 0.7, fontWeight: 400 }}> · {result.tBaseSource.standard}</span>
                )}
              </span>
              <strong className="dim-pac__tbase-value">{result.tBaseCorrigee.toFixed(1)}°C</strong>
            </div>

            {result.tBaseSource?.standard === 'NF P 52-612' ? (
              <div className="dim-pac__tbase-zone">
                <span>Département</span>
                <strong>{result.tBaseSource.dept}</strong>
                <small>{result.tBaseSource.deptName}</small>
              </div>
            ) : zoneDetail && (
              <div className="dim-pac__tbase-zone">
                <span>Zone</span>
                <strong>{zoneDetail.value}</strong>
                <small>{zoneDetail.label.split(' — ')[1] ?? ''}</small>
              </div>
            )}

            {result.tBaseSource?.standard === 'NF P 52-612' && altitudeM > 0 && (
              <span className="dim-pac__tbase-detail">
                Base mer {result.tBaseSource.tBaseMer}°C · {altitudeM} m ({result.tBaseSource.bracket}) · correction −{Math.abs(result.altitudeCorrection).toFixed(0)}°C
              </span>
            )}
            {result.tBaseSource?.standard !== 'NF P 52-612' && altitudeM > 0 && (
              <span className="dim-pac__tbase-detail">
                Base {zoneDetail?.tBase}°C − altitude {result.altitudeCorrection.toFixed(1)}°C
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ CARTE 2 : Période de construction ══════════ */}
      <div className="sim-card">
        <div className="sim-card__head">
          <div className="sim-card__icon"><i className="fa-solid fa-hammer" /></div>
          <div>
            <h3 className="sim-card__title">Période de construction</h3>
            <p className="sim-card__subtitle">Détermine le G de base et pré-remplit l'isolation d'époque</p>
          </div>
        </div>

        <div className="dim-pac__periods">
          {PAC_SIZING.CONSTRUCTION_PERIODS.map(p => (
            <button
              key={p.value}
              className={`dim-pac__period-btn ${construction === p.value ? 'dim-pac__period-btn--active' : ''}`}
              onClick={() => handleConstructionChange(p.value)}
              type="button"
            >
              <i className={`${p.icon} dim-pac__period-icon`} />
              <span className="dim-pac__period-label">{p.label}</span>
              <span className="dim-pac__period-sub">{p.subLabel}</span>
              <span className="dim-pac__period-g">G = {p.gBase}</span>
            </button>
          ))}
        </div>

        {periodDef && (
          <div className="sim-alert sim-alert--info" style={{ marginTop: 'var(--space-md)' }}>
            <i className="fa-solid fa-circle-info" />
            <span>
              <strong>{periodDef.label}</strong> — {periodDef.subLabel}.
              G de base = <strong>{periodDef.gBase} W/m³·K</strong>.
              Intermittence ×{periodDef.intermittence}.
              <em style={{ opacity: 0.8 }}> L'isolation ci-dessous est pré-remplie à l'état d'origine de cette période — ajustez-la.</em>
            </span>
          </div>
        )}
      </div>

      {/* ══════════ CARTE 3 : Isolation détaillée ══════════ */}
      <div className="sim-card">
        <div className="sim-card__head">
          <div className="sim-card__icon"><i className="fa-solid fa-temperature-arrow-down" /></div>
          <div>
            <h3 className="sim-card__title">Isolation réelle par poste</h3>
            <p className="sim-card__subtitle">Ajustez chaque poste selon l'état réel (d'origine ou rénové)</p>
          </div>
        </div>

        <div className="dim-pac__presets">
          <span className="dim-pac__presets-label">Préremplir :</span>
          <button type="button" className="dim-pac__preset-btn" onClick={() => applyPreset('origine')}>
            <i className="fa-solid fa-clock-rotate-left" /> État d'origine ({periodDef?.label})
          </button>
          <button type="button" className="dim-pac__preset-btn" onClick={() => applyPreset('reno')}>
            <i className="fa-solid fa-screwdriver-wrench" /> Rénovation complète
          </button>
        </div>

        <div className="dim-pac__iso-list" style={{ marginTop: 'var(--space-md)' }}>
          {PAC_SIZING.INSULATION_CATEGORIES.map(cat => {
            const currentValue = insulation[cat.key]
            return (
              <div key={cat.key} className="dim-pac__iso-row">
                <div className="dim-pac__iso-label">
                  <i className={cat.icon} style={{ color: cat.color }} />
                  <div>
                    <strong>{cat.label}</strong>
                    <span>{(cat.share * 100).toFixed(0)}% des déperditions</span>
                  </div>
                </div>
                <div className="dim-pac__iso-segments">
                  {cat.levels.map(level => (
                    <button
                      key={level.value}
                      className={`dim-pac__iso-segment ${currentValue === level.value ? 'dim-pac__iso-segment--active' : ''}`}
                      onClick={() => setInsulationLevel(cat.key, level.value)}
                      type="button"
                      title={level.subLabel || ''}
                    >
                      <span className="dim-pac__iso-segment-label">{level.label}</span>
                      {level.subLabel && (
                        <span className="dim-pac__iso-segment-sublabel">{level.subLabel}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="dim-pac__g-summary">
          <div className="dim-pac__g-row">
            <span>G de base (période)</span>
            <strong>{result.gBase.toFixed(2)} W/m³·K</strong>
          </div>
          <div className="dim-pac__g-row">
            <span>Ratio global isolation</span>
            <strong className={result.ratioGlobal < 1 ? 'dim-pac__g-val--good' : result.ratioGlobal > 1 ? 'dim-pac__g-val--bad' : ''}>
              ×{result.ratioGlobal.toFixed(2)}
            </strong>
          </div>
          {housingType === 'Appartement' && (
            <div className="dim-pac__g-row dim-pac__g-row--info">
              <span>Correction appartement (×0.80)</span>
              <strong>appliquée</strong>
            </div>
          )}
          <div className="dim-pac__g-row dim-pac__g-row--total">
            <span>G effectif</span>
            <strong>{result.gEffectif.toFixed(2)} W/m³·K</strong>
          </div>
        </div>
      </div>

      {/* ══════════ CARTE 4 : Installation actuelle ══════════ */}
      <div className="sim-card">
        <div className="sim-card__head">
          <div className="sim-card__icon"><i className="fa-solid fa-fire-burner" /></div>
          <div>
            <h3 className="sim-card__title">Installation actuelle</h3>
            <p className="sim-card__subtitle">Chauffage à déposer + émetteurs existants</p>
          </div>
        </div>

        <div className="sim-layout__fields">
          <div className="sim-field">
            <span className="sim-label">Chauffage principal (à déposer)</span>
            <div className="dim-pac__heating-grid">
              {PAC_SIZING.HEATING_SYSTEMS.map(h => (
                <button
                  key={h.value}
                  className={`dim-pac__heating-btn ${heatingSystem === h.value ? 'dim-pac__heating-btn--active' : ''}`}
                  onClick={() => setHeatingSystem(h.value)}
                  type="button"
                >
                  <i className={h.icon} />
                  <div className="dim-pac__heating-text">
                    <strong>{h.label}</strong>
                    <span>{h.subLabel}</span>
                  </div>
                  {h.eligibleBarTh171 && (
                    <span className="dim-pac__heating-badge"><i className="fa-solid fa-check" /></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={`sim-alert ${result.eligibleBarTh171 ? 'sim-alert--success' : 'sim-alert--warning'}`}>
            <i className={`fa-solid ${result.eligibleBarTh171 ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
            <span>{result.barTh171Reason}</span>
          </div>

          <div className="sim-field">
            <span className="sim-label">Émetteurs de chaleur <span className="dim-pac__helper">(sélection multiple)</span></span>
            <div className="dim-pac__emitters-grid">
              {PAC_SIZING.EMITTERS.map(em => {
                const selected = emitters.includes(em.value)
                return (
                  <button
                    key={em.value}
                    className={`dim-pac__emitter-btn ${selected ? 'dim-pac__emitter-btn--active' : ''}`}
                    onClick={() => toggleEmitter(em.value)}
                    type="button"
                  >
                    <i className={em.icon} />
                    <span>{em.label}</span>
                    <span className={`dim-pac__emitter-mode dim-pac__emitter-mode--${em.mode.toLowerCase().replace('_', '')}`}>
                      {em.mode === 'BT' ? 'BT' : 'MT/HT'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="sim-row">
            <span className="sim-label">ECS intégrée (eau chaude)</span>
            <div className="sim-toggle">
              <button className={`sim-toggle__btn sim-toggle__btn--sm ${includeEcs ? 'sim-toggle__btn--on' : ''}`} onClick={() => setIncludeEcs(true)}>Oui</button>
              <button className={`sim-toggle__btn sim-toggle__btn--sm ${!includeEcs ? 'sim-toggle__btn--on' : ''}`} onClick={() => setIncludeEcs(false)}>Non</button>
            </div>
          </div>

          <div className="sim-alert sim-alert--info">
            <i className="fa-solid fa-bolt" />
            <span>
              {result.emitterMode === 'none'
                ? 'Sélectionnez au moins un émetteur.'
                : <>Application <strong>{result.emitterMode === 'BT' ? 'basse température' : result.emitterMode === 'mixte' ? 'mixte' : 'moyenne/haute température'}</strong> — ETAS requise ≥ <strong>{Math.round(result.etasRequired * 100)}%</strong> @ {result.etasTempRef}°C</>
              }
            </span>
          </div>
        </div>
      </div>

      {/* ══════════ CARTE 5 : Résultat du dimensionnement ══════════ */}
      <div className="dim-pac__results-card">
        <div className="dim-pac__results-head">
          <i className="fa-solid fa-bolt" />
          <h3>Résultat du dimensionnement</h3>
          <button type="button" className="dim-pac__export-btn" onClick={() => window.print()}>
            <i className="fa-solid fa-file-pdf" /> Télécharger la note (PDF)
          </button>
        </div>

        <div className="dim-pac__results-body">

          <div className="dim-pac__summary">
            <div className="dim-pac__summary-head">
              <span className="dim-pac__summary-label">PAC recommandée</span>
              <span className="dim-pac__summary-value">{result.puissanceRecommandeeKw}<small> kW</small></span>
            </div>
            <p className="dim-pac__summary-text">{summarySentence}</p>
          </div>

          <div className="dim-pac__rules">

            <div className="dim-pac__rule dim-pac__rule--cee">
              <div className="dim-pac__rule-header">
                <span className="dim-pac__rule-step">1</span>
                <div>
                  <h4 className="dim-pac__rule-title">Éligibilité prime CEE <small>BAR-TH-171</small></h4>
                  <p className="dim-pac__rule-sub">Puissance PAC acceptée pour valoriser la prime CEE</p>
                </div>
                <i className="fa-solid fa-sack-dollar dim-pac__rule-icon" />
              </div>
              <div className="dim-pac__rule-range">
                <strong>{result.ceePlage.minKw.toFixed(1)}</strong>
                <span>–</span>
                <strong>{result.ceePlage.maxKw.toFixed(1)}</strong>
                <small>kW</small>
              </div>
              <div className="dim-pac__rule-formula">
                60 à 130&nbsp;% des déperditions (appoint électrique implicite)
              </div>
            </div>

            <div className="dim-pac__rule dim-pac__rule--dtu">
              <div className="dim-pac__rule-header">
                <span className="dim-pac__rule-step">2</span>
                <div>
                  <h4 className="dim-pac__rule-title">Dimensionnement <small>DTU 68.16</small></h4>
                  <p className="dim-pac__rule-sub">Puissance PAC à installer, sans appoint, avec marge sécurité ×1.2</p>
                </div>
                <i className="fa-solid fa-ruler-combined dim-pac__rule-icon" />
              </div>
              <div className="dim-pac__rule-range">
                <strong>{result.dtuPlage.minKw.toFixed(1)}</strong>
                <span>–</span>
                <strong>{result.dtuPlage.maxKw.toFixed(1)}</strong>
                <small>kW</small>
              </div>
              <div className="dim-pac__rule-formula">
                70 à 100&nbsp;% des déperditions × marge 1.2 (couverture {result.dtuPlage.coverageMinKw.toFixed(1)}–{result.dtuPlage.coverageMaxKw.toFixed(1)}&nbsp;kW)
              </div>
            </div>

            <div className={`dim-pac__rule dim-pac__rule--final ${!result.intersection.valid ? 'dim-pac__rule--warn' : ''}`}>
              <div className="dim-pac__rule-header">
                <span className="dim-pac__rule-step dim-pac__rule-step--final">
                  <i className="fa-solid fa-bullseye" />
                </span>
                <div>
                  <h4 className="dim-pac__rule-title">Votre PAC idéale</h4>
                  <p className="dim-pac__rule-sub">
                    {result.intersection.valid
                      ? 'Respecte simultanément les règles CEE et DTU 68.16'
                      : '⚠ Aucune puissance ne respecte les 2 règles — vérifier les entrées'}
                  </p>
                </div>
              </div>

              <div className="dim-pac__pac-value">
                <span>{result.puissanceRecommandeeKw}</span>
                <small>kW</small>
              </div>

              {result.intersection.valid && (
                <>
                  <div className="dim-pac__pac-range">
                    Acceptable&nbsp;: <strong>{result.intersection.minKw.toFixed(1)}</strong> à <strong>{result.intersection.maxKw.toFixed(1)}&nbsp;kW</strong>
                  </div>

                  <div className="dim-pac__pac-bar">
                    {(() => {
                      const maxScale = Math.max(result.ceePlage.maxKw, result.dtuPlage.maxKw) * 1.08
                      const pct = (kW) => Math.max(0, Math.min(100, (kW / maxScale) * 100))
                      const ceeMin = pct(result.ceePlage.minKw)
                      const ceeMax = pct(result.ceePlage.maxKw)
                      const dtuMin = pct(result.dtuPlage.minKw)
                      const dtuMax = pct(result.dtuPlage.maxKw)
                      const interMin = pct(result.intersection.minKw)
                      const interMax = pct(result.intersection.maxKw)
                      const target = pct(result.puissanceRecommandeeKw)
                      return (
                        <>
                          <div className="dim-pac__pac-bar-track">
                            <div className="dim-pac__pac-bar-cee" style={{ left: `${ceeMin}%`, width: `${ceeMax - ceeMin}%` }} />
                            <div className="dim-pac__pac-bar-dtu" style={{ left: `${dtuMin}%`, width: `${dtuMax - dtuMin}%` }} />
                            <div className="dim-pac__pac-bar-inter" style={{ left: `${interMin}%`, width: `${interMax - interMin}%` }} />
                            <div className="dim-pac__pac-bar-target" style={{ left: `${target}%` }} />
                          </div>
                          <div className="dim-pac__pac-bar-scale">
                            <span>0</span>
                            <span>{(maxScale / 2).toFixed(0)}&nbsp;kW</span>
                            <span>{maxScale.toFixed(0)}&nbsp;kW</span>
                          </div>
                          <div className="dim-pac__pac-bar-legend">
                            <span><i className="dim-pac__pac-legend-chip dim-pac__pac-legend-chip--cee" /> CEE</span>
                            <span><i className="dim-pac__pac-legend-chip dim-pac__pac-legend-chip--dtu" /> DTU</span>
                            <span><i className="dim-pac__pac-legend-chip dim-pac__pac-legend-chip--inter" /> Zone idéale</span>
                            <span><i className="dim-pac__pac-legend-chip dim-pac__pac-legend-chip--target" /> Recommandation</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </>
              )}

              {includeEcs && (
                <div className="dim-pac__pac-note">
                  <i className="fa-solid fa-droplet" />
                  La PAC assure chauffage + ECS ({PAC_SIZING.ECS_POWER_KW}&nbsp;kW) en alternance — la marge ×1.2 couvre les deux besoins.
                </div>
              )}
            </div>

          </div>

          {/* Top 3 postes de déperditions */}
          {topDeperditions.length > 0 && (
            <div className="dim-pac__top-posts">
              <span className="dim-pac__top-posts-label">Principales déperditions :</span>
              {topDeperditions.map(c => (
                <span key={c.key} className="dim-pac__top-post" title={`${c.label} : ${(c.watts / 1000).toFixed(2)} kW`}>
                  <i className="dim-pac__top-post-dot" style={{ background: c.color }} />
                  {c.label}
                  <strong>{c.percentage.toFixed(0)}%</strong>
                </span>
              ))}
            </div>
          )}

          {/* Compliance badges */}
          <div className="dim-pac__compliance">
            <div className={`dim-pac__compliance-item ${result.eligibleBarTh171 ? 'dim-pac__compliance-item--ok' : 'dim-pac__compliance-item--ko'}`}>
              <i className={`fa-solid ${result.eligibleBarTh171 ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
              <div>
                <strong>Éligibilité BAR-TH-171</strong>
                <span>{result.eligibleBarTh171 ? `Dépose ${heatingDef?.label.toLowerCase()} ✓` : 'Dépose fossile requise'}</span>
              </div>
            </div>
            <div className="dim-pac__compliance-item dim-pac__compliance-item--info">
              <i className="fa-solid fa-temperature-half" />
              <div>
                <strong>ETAS requise <InfoHint text="Efficacité énergétique saisonnière minimale de la PAC, exigée selon la température des émetteurs (35 °C en basse température, 55 °C en moyenne/haute)." /></strong>
                <span>≥ {Math.round(result.etasRequired * 100)}% @ {result.etasTempRef}°C ({result.emitterMode === 'BT' ? 'Basse T°' : result.emitterMode === 'mixte' ? 'Mixte' : 'Moyenne/Haute T°'})</span>
              </div>
            </div>
            <div className="dim-pac__compliance-item dim-pac__compliance-item--info">
              <i className="fa-solid fa-gauge-high" />
              <div>
                <strong>Taux de couverture</strong>
                <span>
                  CEE : {Math.round(PAC_SIZING.CEE_MIN_COVERAGE * 100)}–{Math.round(PAC_SIZING.CEE_MAX_COVERAGE * 100)}% (appoint élec.)
                  {' · '}
                  DTU : {Math.round(PAC_SIZING.DTU_MIN_COVERAGE * 100)}–{Math.round(PAC_SIZING.DTU_MAX_COVERAGE * 100)}% ×{PAC_SIZING.DTU_SAFETY_FACTOR} (PAC seule)
                </span>
              </div>
            </div>
          </div>

          {/* Détail du calcul (replié) */}
          <details className="dim-pac__details">
            <summary className="dim-pac__details-summary">
              <i className="fa-solid fa-calculator" /> Détail du calcul
            </summary>
            <div className="dim-pac__chips">
              <div className="dim-pac__chip"><span>Déperditions</span><strong>{result.deperditionsKw.toFixed(1)} kW</strong></div>
              <div className="dim-pac__chip"><span>G base <InfoHint text="Coefficient de déperdition du bâti à l'époque de construction (W/m³·K)." /></span><strong>{result.gBase.toFixed(2)}</strong></div>
              <div className="dim-pac__chip"><span>G eff. <InfoHint text="Coefficient G corrigé selon l'isolation réelle et le type de logement." /></span><strong>{result.gEffectif.toFixed(2)}</strong></div>
              <div className="dim-pac__chip"><span>V</span><strong>{result.volume.toFixed(0)} m³</strong></div>
              <div className="dim-pac__chip"><span>ΔT <InfoHint text="Écart entre 19 °C de confort intérieur et la température extérieure de base." /></span><strong>{result.deltaT.toFixed(0)}°C</strong></div>
              <div className="dim-pac__chip"><span>T_base <InfoHint text="Température extérieure minimale de dimensionnement (NF P 52-612), selon département et altitude." /></span><strong>{result.tBaseCorrigee.toFixed(1)}°C</strong></div>
              <div className="dim-pac__chip"><span>Intermittence <InfoHint text="Surpuissance pour relancer le chauffage après un ralenti (ex. nuit)." /></span><strong>×{result.intermittenceCoeff}</strong></div>
              {includeEcs && <div className="dim-pac__chip"><span>ECS</span><strong>+{result.ecsKw.toFixed(1)} kW</strong></div>}
            </div>
          </details>

          {/* Nom du client + conseiller (pour la note) */}
          <div className="dim-pac__note-row">
            <div className="sim-field" style={{ flex: 1 }}>
              <span className="sim-label">Nom du client / chantier <span className="dim-pac__helper">(pour la note PDF)</span></span>
              <input className="sim-input" type="text" placeholder="ex: M. et Mme Durand" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="sim-field" style={{ flex: 1 }}>
              <span className="sim-label">Établi par <span className="dim-pac__helper">(conseiller)</span></span>
              <input className="sim-input" type="text" placeholder="ex: Jean Martin — Artex360" value={conseillerName} onChange={e => setConseillerName(e.target.value)} />
            </div>
            <button type="button" className="dim-pac__export-btn dim-pac__export-btn--solid" onClick={() => window.print()}>
              <i className="fa-solid fa-file-pdf" /> Télécharger la note
            </button>
          </div>
        </div>
      </div>

      {/* Note imprimable (masquée à l'écran, révélée à l'impression) */}
      <DimPacNote data={noteData} />

    </SimulatorLayout>
  )
}
