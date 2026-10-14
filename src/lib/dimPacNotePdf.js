import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Palette Artex v3 — coherente avec les autres PDFs ───
const C = {
  primary:      [17, 19, 24],
  primaryLight: [30, 34, 42],
  brand:        [132, 204, 22],
  brandDark:    [74, 122, 15],
  brandLight:   [136, 219, 27],
  brandBg:      [245, 255, 235],
  sky:          [56, 189, 248],
  orange:       [234, 88, 12],
  text:         [30, 41, 59],
  textMuted:    [100, 116, 139],
  textLight:    [148, 163, 184],
  border:       [226, 232, 240],
  borderLight:  [241, 245, 249],
  surface:      [248, 250, 252],
  white:        [255, 255, 255],
}

const kw = (v) => `${Number(v).toFixed(1)} kW`

// ─── Primitives de dessin v3 ───

function drawShadow(doc, x, y, w, h, r = 3) {
  doc.setFillColor(0, 0, 0)
  doc.setGState(new doc.GState({ opacity: 0.04 }))
  doc.roundedRect(x + 0.5, y + 0.7, w, h, r, r, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
}

function drawCard(doc, x, y, w, h, { shadow = true, radius = 3, fill = C.white, borderColor = C.border } = {}) {
  if (shadow) drawShadow(doc, x, y, w, h, radius)
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, w, h, radius, radius, 'F')
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, w, h, radius, radius, 'S')
  doc.setLineWidth(0.2)
}

function drawSectionTitle(doc, title, subtitle, x, y, accentColor = C.brand) {
  doc.setFillColor(...accentColor)
  doc.roundedRect(x, y, 1.2, subtitle ? 9 : 6, 0.6, 0.6, 'F')
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text(title, x + 5, y + 4)
  if (subtitle) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text(subtitle, x + 5, y + 9)
    return y + 14
  }
  return y + 9
}

function drawParamRow(doc, label, value, x, y, w, isAlt = false) {
  if (isAlt) {
    doc.setFillColor(...C.surface)
    doc.rect(x, y - 3.2, w, 6.5, 'F')
  }
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text(label, x + 4, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(String(value), x + w - 4, y, { align: 'right' })
}

function drawBadge(doc, text, x, y, bg, fg) {
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  const tw = doc.getTextWidth(text) + 10
  doc.setFillColor(...bg)
  doc.roundedRect(x, y, tw, 7, 3.5, 3.5, 'F')
  doc.setTextColor(...fg)
  doc.text(text, x + tw / 2, y + 4.8, { align: 'center' })
  return tw
}

function drawCheckmark(doc, x, y, color = C.brand) {
  doc.setDrawColor(...color)
  doc.setLineWidth(0.7)
  doc.line(x - 1.5, y, x - 0.3, y + 1.5)
  doc.line(x - 0.3, y + 1.5, x + 2, y - 1)
  doc.setLineWidth(0.2)
}

function drawFooter(doc, W, mx, dateStr, pageNum, totalPages) {
  const H = doc.internal.pageSize.getHeight()
  const footerY = H - 12

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(mx, footerY - 3, W - mx, footerY - 3)
  doc.setLineWidth(0.2)

  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(
    'Note indicative — methode G ponderee (NF P 52-612). Puissance definitive a confirmer par etude thermique sur site. Non contractuel.',
    W / 2, footerY + 0.5, { align: 'center', maxWidth: W - mx * 2 }
  )
  doc.text(`Artex360 — Document genere le ${dateStr}`, W / 2, footerY + 4, { align: 'center' })
  doc.text(`${pageNum} / ${totalPages}`, W - mx, footerY + 4, { align: 'right' })

  doc.setFillColor(...C.brandLight)
  doc.rect(0, H - 2, W, 2, 'F')
}

/**
 * Genere et telecharge la note de dimensionnement PAC en PDF (A4).
 * Design Artex v3 — coherent avec les autres PDFs de la plateforme.
 */
export function generateDimPacNotePdf(d) {
  const r = d.result
  const doc = new jsPDF('p', 'mm', 'a4')
  const W = 210
  const H = 297
  const mx = 16
  const cw = W - mx * 2
  const dateStr = d.dateLabel || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  let y = 0

  // ════════════════════════════════════════════════════════════
  //  HEADER — Bandeau dark elegant + accent vert
  // ════════════════════════════════════════════════════════════
  doc.setFillColor(...C.brandLight)
  doc.rect(0, 0, W, 1.8, 'F')

  doc.setFillColor(...C.primary)
  doc.rect(0, 1.8, W, 30, 'F')

  doc.setFillColor(...C.brand)
  doc.rect(0, 31.8, W, 0.6, 'F')

  // Titre
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandLight)
  doc.text('Note de dimensionnement PAC', mx, 13)

  // Sous-titre
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 150, 170)
  doc.text('Methode G ponderee — NF P 52-612 — BAR-TH-171 & DTU 68.16', mx, 19)

  // Artex360 branding
  doc.setFontSize(6.5)
  doc.setTextColor(110, 120, 140)
  doc.text('Artex360', mx, 26)

  // Date + reference droite
  doc.setFontSize(7.5)
  doc.setTextColor(...C.white)
  doc.text(dateStr, W - mx, 10, { align: 'right' })

  doc.setFontSize(6.5)
  doc.setTextColor(110, 120, 140)
  if (d.reference) doc.text(`Ref : ${d.reference}`, W - mx, 17, { align: 'right' })

  y = 38

  // ════════════════════════════════════════════════════════════
  //  PARTIES — 2 cards cote a cote
  // ════════════════════════════════════════════════════════════
  const gap = 5
  const halfW = (cw - gap) / 2
  const localisation = [
    d.address,
    d.deptName ? `${d.deptName}${d.dept ? ` (${d.dept})` : ''}` : null,
    d.zone ? `Zone ${d.zone}` : null,
  ].filter(Boolean).join(' — ')
  const partyH = localisation ? 25 : 20

  // Card Etabli par
  drawCard(doc, mx, y, halfW, partyH)
  doc.setFillColor(59, 130, 246)
  doc.roundedRect(mx, y, 1.2, partyH, 0.6, 0.6, 'F')

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('ETABLI PAR', mx + 5, y + 5.5)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(d.conseillerName || 'Artex360', mx + 5, y + 12)

  // Card Client / Chantier
  const lx = mx + halfW + gap
  drawCard(doc, lx, y, halfW, partyH)
  doc.setFillColor(...C.brand)
  doc.roundedRect(lx, y, 1.2, partyH, 0.6, 0.6, 'F')

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('CLIENT / CHANTIER', lx + 5, y + 5.5)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(d.clientName || '—', lx + 5, y + 12)

  if (localisation) {
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text(doc.splitTextToSize(localisation, halfW - 10), lx + 5, y + 18)
  }

  y += partyH + 6

  // ════════════════════════════════════════════════════════════
  //  RECOMMANDATION — Hero card accented
  // ════════════════════════════════════════════════════════════
  const recH = 34
  drawShadow(doc, mx, y, cw, recH, 4)
  doc.setFillColor(...C.brandBg)
  doc.roundedRect(mx, y, cw, recH, 4, 4, 'F')
  doc.setDrawColor(...C.brand)
  doc.setLineWidth(0.5)
  doc.roundedRect(mx, y, cw, recH, 4, 4, 'S')
  doc.setLineWidth(0.2)

  // Accent bar left
  doc.setFillColor(...C.brand)
  doc.roundedRect(mx + 1, y + 3, 1.5, recH - 6, 0.75, 0.75, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text('PUISSANCE PAC RECOMMANDEE', mx + 7, y + 8)

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text(`${r.puissanceRecommandeeKw} kW`, mx + 7, y + 22)

  // Plages a droite
  const rxLabel = W - mx - 72
  const rxVal = W - mx - 6

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Plage CEE BAR-TH-171', rxLabel, y + 9)
  doc.text('Plage DTU 68.16', rxLabel, y + 17)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(`${kw(r.ceePlage.minKw)} – ${kw(r.ceePlage.maxKw)}`, rxVal, y + 9, { align: 'right' })
  doc.text(`${kw(r.dtuPlage.minKw)} – ${kw(r.dtuPlage.maxKw)}`, rxVal, y + 17, { align: 'right' })

  if (r.intersection.valid) {
    // Badge plage acceptable
    const plageText = `Plage acceptable : ${kw(r.intersection.minKw)} a ${kw(r.intersection.maxKw)}`
    drawBadge(doc, plageText, mx + 7, y + 25, C.brand, C.white)
  }

  y += recH + 8

  // ════════════════════════════════════════════════════════════
  //  CARACTERISTIQUES DU LOGEMENT
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, 'CARACTERISTIQUES DU LOGEMENT', 'Donnees du bien', mx, y, C.brand)

  const housingRows = [
    ['Type', String(d.housingType)],
    ['Surface chauffee', `${d.surface} m2`],
    ['Hauteur sous plafond', `${d.ceilingHeight} m`],
    ['Volume chauffe', `${r.volume.toFixed(0)} m3`],
    ["Nombre d'etages", d.nbEtages === 5 ? '5+' : String(d.nbEtages)],
    ['Periode de construction', d.periodLabel],
    ['Chauffage depose', d.heatingLabel],
    ['Eau chaude sanitaire', d.includeEcs ? 'Integree a la PAC' : 'Non incluse'],
  ]

  const housingH = housingRows.length * 7 + 6
  drawCard(doc, mx, y, cw, housingH)
  let dy = y + 5
  housingRows.forEach((row, i) => {
    drawParamRow(doc, row[0], row[1], mx + 2, dy, cw - 4, i % 2 === 0)
    dy += 7
  })
  y += housingH + 6

  // ════════════════════════════════════════════════════════════
  //  DETAIL DU CALCUL DES DEPERDITIONS
  // ════════════════════════════════════════════════════════════
  const calcRows = [
    ['Coefficient G de base (periode)', `${r.gBase.toFixed(2)} W/m3.K`],
    ['Coefficient G effectif (apres isolation)', `${r.gEffectif.toFixed(2)} W/m3.K`],
    ['Volume chauffe', `${r.volume.toFixed(0)} m3`],
    ['Temperature interieure de confort', '19 °C'],
    [`Temperature exterieure de base (${r.tBaseSource.standard})`, `${r.tBaseCorrigee.toFixed(1)} °C`],
    ['Ecart de temperature DeltaT', `${r.deltaT.toFixed(0)} °C`],
    ['Deperditions thermiques', kw(r.deperditionsKw)],
    ["Coefficient d'intermittence", `x${r.intermittenceCoeff}`],
  ]
  if (d.includeEcs) calcRows.push(['Besoin eau chaude sanitaire', `+${r.ecsKw.toFixed(1)} kW`])

  const calcH = calcRows.length * 7 + 6
  if (y + calcH + 14 > H - 20) { doc.addPage(); y = 20 }

  y = drawSectionTitle(doc, 'DETAIL DU CALCUL', 'Deperditions thermiques', mx, y, C.orange)

  drawCard(doc, mx, y, cw, calcH)
  dy = y + 5
  calcRows.forEach((row, i) => {
    drawParamRow(doc, row[0], row[1], mx + 2, dy, cw - 4, i % 2 === 0)
    dy += 7
  })
  y += calcH + 6

  // ════════════════════════════════════════════════════════════
  //  PRINCIPALES DEPERDITIONS
  // ════════════════════════════════════════════════════════════
  if (d.topDeperditions && d.topDeperditions.length) {
    const depRows = d.topDeperditions.map(p => [p.label, `${p.percentage.toFixed(0)} %`])
    const depH = depRows.length * 7 + 6
    if (y + depH + 14 > H - 20) { doc.addPage(); y = 20 }

    y = drawSectionTitle(doc, 'PRINCIPALES DEPERDITIONS', null, mx, y, C.sky)

    drawCard(doc, mx, y, cw, depH)
    dy = y + 5
    depRows.forEach((row, i) => {
      drawParamRow(doc, row[0], row[1], mx + 2, dy, cw - 4, i % 2 === 0)
      dy += 7
    })
    y += depH + 6
  }

  // ════════════════════════════════════════════════════════════
  //  CONFORMITE & EXIGENCES
  // ════════════════════════════════════════════════════════════
  const confRows = [
    ['Eligibilite prime CEE BAR-TH-171', r.eligibleBarTh171 ? 'Oui — depose chauffage fossile' : 'Non — depose fossile requise'],
    ['ETAS minimale requise', `>= ${Math.round(r.etasRequired * 100)} % @ ${r.etasTempRef} °C`],
    ['Mode de temperature (emetteurs)', r.emitterMode === 'BT' ? 'Basse temperature' : r.emitterMode === 'mixte' ? 'Mixte' : 'Moyenne/Haute temperature'],
  ]
  const confH = confRows.length * 7 + 6
  if (y + confH + 14 > H - 20) { doc.addPage(); y = 20 }

  y = drawSectionTitle(doc, 'CONFORMITE & EXIGENCES', null, mx, y, C.brandDark)

  // Eligibility badge
  const eligBg = r.eligibleBarTh171 ? C.brand : [239, 68, 68]
  const eligText = r.eligibleBarTh171 ? 'ELIGIBLE' : 'NON ELIGIBLE'
  drawBadge(doc, eligText, W - mx - 30, y - 7, eligBg, C.white)

  drawCard(doc, mx, y, cw, confH)
  dy = y + 5
  confRows.forEach((row, i) => {
    drawParamRow(doc, row[0], row[1], mx + 2, dy, cw - 4, i % 2 === 0)
    dy += 7
  })
  y += confH + 8

  // ════════════════════════════════════════════════════════════
  //  AVANTAGES / POINTS CLES
  // ════════════════════════════════════════════════════════════
  if (y + 40 > H - 20) { doc.addPage(); y = 20 }
  y += 2
  y = drawSectionTitle(doc, 'POINTS CLES', null, mx, y, C.brand)

  const advantages = [
    'Dimensionnement conforme BAR-TH-171 & DTU 68.16',
    `Deperditions calculees : ${kw(r.deperditionsKw)} — puissance recommandee : ${r.puissanceRecommandeeKw} kW`,
    d.includeEcs ? 'Production ECS integree a la pompe a chaleur' : 'ECS non incluse — a prevoir separement',
    r.eligibleBarTh171 ? 'Installation eligible a la prime CEE' : 'Depose chauffage fossile requise pour eligibilite CEE',
  ]

  advantages.forEach(text => {
    drawCheckmark(doc, mx + 4, y)
    doc.setFontSize(7.5)
    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'normal')
    doc.text(text, mx + 9, y + 1, { maxWidth: cw - 12 })
    y += 7.5
  })

  // ════════════════════════════════════════════════════════════
  //  SIGNATURES
  // ════════════════════════════════════════════════════════════
  if (y + 30 > H - 15) { doc.addPage(); y = 20 }
  y += 6

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text("L'installateur :", mx, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.textLight)
  doc.text(d.conseillerName || 'Artex360', mx, y + 5)
  doc.text('Date et signature :', mx, y + 14)
  doc.setDrawColor(...C.border)
  doc.line(mx, y + 22, mx + 65, y + 22)

  const sigX = W / 2 + 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.text)
  doc.text('Le client :', sigX, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.textLight)
  doc.text(d.clientName || '—', sigX, y + 5)
  doc.text('Bon pour accord, date et signature :', sigX, y + 14)
  doc.line(sigX, y + 22, sigX + 65, y + 22)

  // ════════════════════════════════════════════════════════════
  //  FOOTER sur chaque page
  // ════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(doc, W, mx, dateStr, i, totalPages)
  }

  // Telecharger
  const safeClient = (d.clientName || '').replace(/[^a-zA-Z0-9-]+/g, '_').slice(0, 30)
  const fileName = `Note-dimensionnement-PAC${safeClient ? '-' + safeClient : ''}.pdf`
  doc.save(fileName)
}
