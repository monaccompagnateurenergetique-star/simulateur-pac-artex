const kw = (v) => `${Number(v).toFixed(1)} kW`

/**
 * Note de dimensionnement imprimable (A4).
 * Masquée à l'écran (display:none) — révélée uniquement à l'impression via
 * le bloc @media print de index.css.
 *
 * Adaptée au calculateur du simulateur public (modèle BAR-TH-171 60-130 %
 * + DTU 65.16 80-120 %). Aucune dépendance externe.
 */
export default function DimPacNote({ data }) {
  const { result } = data
  const localisation = [
    data.address,
    data.deptName ? `${data.deptName}${data.dept ? ` (${data.dept})` : ''}` : null,
    data.zone ? `Zone ${data.zone}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="dim-pac__note" aria-hidden="true">
      {/* En-tête */}
      <header className="dpn__header">
        <div>
          <h1 className="dpn__title">Note de dimensionnement — Pompe à chaleur air/eau</h1>
          <p className="dpn__subtitle">Méthode G améliorée · NF P 52-612 · BAR-TH-171 &amp; DTU 65.16</p>
        </div>
        <div className="dpn__meta">
          <div><span>Référence</span><strong>{data.reference}</strong></div>
          <div><span>Date</span><strong>{data.dateLabel}</strong></div>
        </div>
      </header>

      {/* Bloc identités */}
      <section className="dpn__parties">
        <div className="dpn__party">
          <h2>Établi par</h2>
          <p className="dpn__party-name">{data.conseillerName || 'Artex360'}</p>
        </div>
        <div className="dpn__party">
          <h2>Client / Chantier</h2>
          {data.clientName && <p className="dpn__party-name">{data.clientName}</p>}
          {localisation && <p>{localisation}</p>}
          {!data.clientName && !localisation && <p className="dpn__muted">—</p>}
        </div>
      </section>

      {/* Caractéristiques du logement */}
      <section className="dpn__section">
        <h2 className="dpn__h2">Caractéristiques du logement</h2>
        <div className="dpn__grid">
          <div><span>Type</span><strong>{data.housingType}</strong></div>
          <div><span>Surface chauffée</span><strong>{data.surface} m²</strong></div>
          <div><span>Hauteur sous plafond</span><strong>{data.ceilingHeight} m</strong></div>
          <div><span>Volume chauffé</span><strong>{result.volume.toFixed(0)} m³</strong></div>
          <div><span>Nombre d'étages</span><strong>{data.nbEtages === 5 ? '5+' : data.nbEtages}</strong></div>
          <div><span>Période de construction</span><strong>{data.periodLabel}</strong></div>
          <div><span>Chauffage déposé</span><strong>{data.heatingLabel}</strong></div>
          <div><span>Eau chaude sanitaire</span><strong>{data.includeEcs ? 'Intégrée à la PAC' : 'Non incluse'}</strong></div>
        </div>
      </section>

      {/* Recommandation */}
      <section className="dpn__reco">
        <div className="dpn__reco-main">
          <span className="dpn__reco-label">Puissance PAC recommandée</span>
          <span className="dpn__reco-value">{result.puissanceRecommandeeKw} kW</span>
          <span className="dpn__reco-range">DTU 65.16 : {result.dtuVerdict}</span>
        </div>
        <div className="dpn__reco-rules">
          <div>
            <span>Plage CEE BAR-TH-171</span>
            <strong>{kw(result.puissanceMinKw)} – {kw(result.puissanceMaxKw)}</strong>
            <small>60 à 130 % de la cible (appoint élec. implicite)</small>
          </div>
          <div>
            <span>Plage DTU 65.16</span>
            <strong>{kw(result.dtuMinKw)} – {kw(result.dtuMaxKw)}</strong>
            <small>80 à 120 % des déperditions · ratio {(result.dtuRatio * 100).toFixed(0)} %</small>
          </div>
        </div>
      </section>

      {/* Détail du calcul */}
      <section className="dpn__section">
        <h2 className="dpn__h2">Détail du calcul des déperditions</h2>
        <table className="dpn__table">
          <tbody>
            <tr><td>Coefficient G de base (période)</td><td>{result.gBase.toFixed(2)} W/m³·K</td></tr>
            <tr><td>Coefficient G effectif (après isolation)</td><td>{result.gEffectif.toFixed(2)} W/m³·K</td></tr>
            <tr><td>Volume chauffé</td><td>{result.volume.toFixed(0)} m³</td></tr>
            <tr><td>Température intérieure de confort</td><td>19 °C</td></tr>
            <tr><td>Température extérieure de base ({result.tBaseSource.standard})</td><td>{result.tBaseCorrigee.toFixed(1)} °C</td></tr>
            <tr><td>Écart de température ΔT</td><td>{result.deltaT.toFixed(0)} °C</td></tr>
            <tr className="dpn__table-strong"><td>Déperditions thermiques</td><td>{kw(result.deperditionsKw)}</td></tr>
            <tr><td>Coefficient d'intermittence</td><td>×{result.intermittenceCoeff}</td></tr>
            {data.includeEcs && <tr><td>Besoin eau chaude sanitaire</td><td>+{result.ecsKw.toFixed(1)} kW</td></tr>}
          </tbody>
        </table>
      </section>

      {/* Répartition des déperditions */}
      {data.topDeperditions.length > 0 && (
        <section className="dpn__section">
          <h2 className="dpn__h2">Principales déperditions</h2>
          <ul className="dpn__posts">
            {data.topDeperditions.map(p => (
              <li key={p.key}><span>{p.label}</span><strong>{p.percentage.toFixed(0)} %</strong></li>
            ))}
          </ul>
        </section>
      )}

      {/* Conformité */}
      <section className="dpn__section">
        <h2 className="dpn__h2">Conformité &amp; exigences</h2>
        <table className="dpn__table">
          <tbody>
            <tr>
              <td>Éligibilité prime CEE BAR-TH-171</td>
              <td>{result.eligibleBarTh171 ? 'Oui — dépose chauffage fossile' : 'Non — dépose fossile requise'}</td>
            </tr>
            <tr>
              <td>Dimensionnement DTU 65.16</td>
              <td>{result.dtuVerdict} (ratio {(result.dtuRatio * 100).toFixed(0)} %)</td>
            </tr>
            <tr>
              <td>ETAS minimale requise</td>
              <td>≥ {Math.round(result.etasRequired * 100)} % @ {result.etasTempRef} °C</td>
            </tr>
            <tr>
              <td>Mode de température (émetteurs)</td>
              <td>{result.emitterMode === 'BT' ? 'Basse température' : result.emitterMode === 'mixte' ? 'Mixte' : 'Moyenne/Haute température'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Pied */}
      <footer className="dpn__footer">
        <p className="dpn__disclaimer">
          Note indicative établie selon la méthode G améliorée et les barèmes en vigueur (NF P 52-612,
          Guide CEE BAR-TH-171, DTU 65.16). La puissance définitive doit être confirmée par une étude
          thermique sur site. Document non contractuel.
        </p>
        <div className="dpn__signature">
          <div><span>Date</span><div className="dpn__sign-line" /></div>
          <div><span>Signature</span><div className="dpn__sign-line" /></div>
        </div>
      </footer>
    </div>
  )
}
