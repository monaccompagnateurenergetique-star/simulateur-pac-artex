import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* Couleurs */
const GREEN = [116, 191, 22]        // #74bf16
const DARK_GREEN = [44, 74, 0]      // #2c4a00
const GRAY = [107, 114, 128]        // #6b7280
const TEXT = [17, 24, 39]           // #111827
const SUBTLE = [75, 85, 99]         // #4b5563
const GREEN_FILL = [243, 251, 232]  // #f3fbe8

const kw = (v) => `${Number(v).toFixed(1)} kW`

/** Titre de section : libellé vert foncé + filet. Retourne le y après. */
function sectionTitle(doc, text, y, W, mx) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DARK_GREEN)
  doc.text(text, mx, y)
  y += 1.5
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.line(mx, y, W - mx, y)
  return y + 4
}

/** Tableau clé/valeur compact. Retourne le y après. */
function kvTable(doc, rows, startY, mx, W) {
  autoTable(doc, {
    startY,
    margin: { left: mx, right: mx },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: { top: 1.6, bottom: 1.6, left: 0, right: 0 }, textColor: SUBTLE, lineColor: [243, 244, 246], lineWidth: { bottom: 0.1 } },
    columnStyles: {
      0: { textColor: SUBTLE },
      1: { halign: 'right', fontStyle: 'bold', textColor: TEXT },
    },
    body: rows,
  })
  return doc.lastAutoTable.finalY
}

/**
 * Génère et télécharge directement la note de dimensionnement en PDF (A4).
 * Aucune boîte de dialogue d'impression — fichier téléchargé immédiatement.
 */
export function generateDimPacNotePdf(d) {
  const r = d.result
  const doc = new jsPDF('p', 'mm', 'a4')
  const W = 210
  const mx = 14
  let y = 16

  // ── En-tête ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14.5)
  doc.setTextColor(...DARK_GREEN)
  doc.text('Note de dimensionnement — Pompe à chaleur air/eau', mx, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('Méthode G pondérée · NF P 52-612 · BAR-TH-171 & DTU 68.16', mx, y)

  doc.setFontSize(8)
  doc.setTextColor(...TEXT)
  doc.text(`Référence : ${d.reference}`, W - mx, 13, { align: 'right' })
  doc.text(`Date : ${d.dateLabel}`, W - mx, 17.5, { align: 'right' })

  y += 3
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.7)
  doc.line(mx, y, W - mx, y)
  y += 8

  // ── Parties ──
  const localisation = [
    d.address,
    d.deptName ? `${d.deptName}${d.dept ? ` (${d.dept})` : ''}` : null,
    d.zone ? `Zone ${d.zone}` : null,
  ].filter(Boolean).join(' · ')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...GREEN)
  doc.text('ÉTABLI PAR', mx, y)
  doc.text('CLIENT / CHANTIER', W / 2, y)
  y += 4.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT)
  doc.text(d.conseillerName || 'Artex360', mx, y)
  doc.text(d.clientName || '—', W / 2, y)
  if (localisation) {
    y += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...SUBTLE)
    doc.text(doc.splitTextToSize(localisation, W / 2 - mx - 4), W / 2, y)
  }
  y += 9

  // ── Recommandation (encadré) ──
  const boxH = 24
  doc.setFillColor(...GREEN_FILL)
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.5)
  doc.roundedRect(mx, y, W - 2 * mx, boxH, 2.5, 2.5, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 148, 0)
  doc.text('PUISSANCE PAC RECOMMANDÉE', mx + 6, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...DARK_GREEN)
  doc.text(`${r.puissanceRecommandeeKw} kW`, mx + 6, y + 18)
  // plages à droite
  const rxLabel = W - mx - 70
  const rxVal = W - mx - 6
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text('Plage CEE BAR-TH-171', rxLabel, y + 7)
  doc.text('Plage DTU 68.16', rxLabel, y + 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT)
  doc.text(`${kw(r.ceePlage.minKw)} – ${kw(r.ceePlage.maxKw)}`, rxVal, y + 7, { align: 'right' })
  doc.text(`${kw(r.dtuPlage.minKw)} – ${kw(r.dtuPlage.maxKw)}`, rxVal, y + 16, { align: 'right' })
  if (r.intersection.valid) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(90, 148, 0)
    doc.text(`Plage acceptable : ${kw(r.intersection.minKw)} à ${kw(r.intersection.maxKw)}`, mx + 6, y + 22)
  }
  y += boxH + 8

  // ── Caractéristiques du logement ──
  y = sectionTitle(doc, 'Caractéristiques du logement', y, W, mx)
  y = kvTable(doc, [
    ['Type', String(d.housingType)],
    ['Surface chauffée', `${d.surface} m²`],
    ['Hauteur sous plafond', `${d.ceilingHeight} m`],
    ['Volume chauffé', `${r.volume.toFixed(0)} m³`],
    ["Nombre d'étages", d.nbEtages === 5 ? '5+' : String(d.nbEtages)],
    ['Période de construction', d.periodLabel],
    ['Chauffage déposé', d.heatingLabel],
    ['Eau chaude sanitaire', d.includeEcs ? 'Intégrée à la PAC' : 'Non incluse'],
  ], y, mx, W)
  y += 7

  // ── Détail du calcul ──
  y = sectionTitle(doc, 'Détail du calcul des déperditions', y, W, mx)
  const calcRows = [
    ['Coefficient G de base (période)', `${r.gBase.toFixed(2)} W/m³·K`],
    ['Coefficient G effectif (après isolation)', `${r.gEffectif.toFixed(2)} W/m³·K`],
    ['Volume chauffé', `${r.volume.toFixed(0)} m³`],
    ['Température intérieure de confort', '19 °C'],
    [`Température extérieure de base (${r.tBaseSource.standard})`, `${r.tBaseCorrigee.toFixed(1)} °C`],
    ['Écart de température ΔT', `${r.deltaT.toFixed(0)} °C`],
    ['Déperditions thermiques', kw(r.deperditionsKw)],
    ["Coefficient d'intermittence", `×${r.intermittenceCoeff}`],
  ]
  if (d.includeEcs) calcRows.push(['Besoin eau chaude sanitaire', `+${r.ecsKw.toFixed(1)} kW`])
  y = kvTable(doc, calcRows, y, mx, W)
  y += 7

  // ── Principales déperditions ──
  if (d.topDeperditions && d.topDeperditions.length) {
    y = sectionTitle(doc, 'Principales déperditions', y, W, mx)
    y = kvTable(doc, d.topDeperditions.map(p => [p.label, `${p.percentage.toFixed(0)} %`]), y, mx, W)
    y += 7
  }

  // ── Conformité ──
  y = sectionTitle(doc, 'Conformité & exigences', y, W, mx)
  y = kvTable(doc, [
    ['Éligibilité prime CEE BAR-TH-171', r.eligibleBarTh171 ? 'Oui — dépose chauffage fossile' : 'Non — dépose fossile requise'],
    ['ETAS minimale requise', `≥ ${Math.round(r.etasRequired * 100)} % @ ${r.etasTempRef} °C`],
    ['Mode de température (émetteurs)', r.emitterMode === 'BT' ? 'Basse température' : r.emitterMode === 'mixte' ? 'Mixte' : 'Moyenne/Haute température'],
  ], y, mx, W)
  y += 10

  // ── Pied : disclaimer + signatures ──
  if (y > 250) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(...GRAY)
  const disc = "Note indicative établie selon la méthode G pondérée et les barèmes en vigueur (NF P 52-612, Guide CEE BAR-TH-171, DTU 68.16). La puissance définitive doit être confirmée par une étude thermique sur site. Document non contractuel."
  doc.text(doc.splitTextToSize(disc, W - 2 * mx), mx, y)
  y += 16
  doc.setDrawColor(...GRAY)
  doc.setLineWidth(0.2)
  doc.line(mx, y, mx + 60, y)
  doc.line(W - mx - 60, y, W - mx, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.text('Date', mx, y + 4)
  doc.text('Signature', W - mx - 60, y + 4)

  // ── Téléchargement direct ──
  const safeClient = (d.clientName || '').replace(/[^a-zA-Z0-9-]+/g, '_').slice(0, 30)
  const fileName = `Note-dimensionnement-PAC${safeClient ? '-' + safeClient : ''}.pdf`
  doc.save(fileName)
}
