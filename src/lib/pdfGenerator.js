import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Palette Artex ───
const C = {
  primary:      [17, 19, 24],       // artex-primary #111318
  brand:        [116, 191, 22],     // brand-600 #74bf16
  brandDark:    [74, 122, 15],      // brand-700
  brandLight:   [136, 219, 27],     // artex-green #88DB1B
  sky:          [56, 189, 248],     // sky-400 — MPR
  amber:        [251, 191, 36],     // amber-400 — installateur
  text:         [30, 41, 59],
  textLight:    [100, 116, 139],
  border:       [226, 232, 240],
  bgLight:      [248, 250, 252],
  white:        [255, 255, 255],
  red:          [239, 68, 68],
}

const DPE_COLORS = {
  A: { bg: [49, 152, 52],  text: [255, 255, 255] },
  B: { bg: [51, 204, 51],  text: [255, 255, 255] },
  C: { bg: [203, 252, 52], text: [26, 26, 26] },
  D: { bg: [251, 239, 54], text: [26, 26, 26] },
  E: { bg: [252, 204, 47], text: [26, 26, 26] },
  F: { bg: [244, 142, 31], text: [255, 255, 255] },
  G: { bg: [238, 29, 35],  text: [255, 255, 255] },
}

const CLASS_ORDER = ['G', 'F', 'E', 'D', 'C', 'B', 'A']

const MPR_BADGE = {
  Bleu:   { label: 'Tres modestes', bg: [59, 130, 246],  text: [255, 255, 255] },
  Jaune:  { label: 'Modestes',      bg: [234, 179, 8],   text: [255, 255, 255] },
  Violet: { label: 'Intermediaires', bg: [139, 92, 246],  text: [255, 255, 255] },
  Rose:   { label: 'Superieurs',    bg: [236, 72, 153],  text: [255, 255, 255] },
}

function fmt(amount) {
  const rounded = Math.round(amount || 0)
  const str = Math.abs(rounded).toString()
  const parts = []
  for (let i = str.length; i > 0; i -= 3) parts.unshift(str.slice(Math.max(0, i - 3), i))
  return (rounded < 0 ? '-' : '') + parts.join(' ') + ' \u20AC'
}

function sanitize(str) {
  return (str || '')
    .replace(/[\u00A0\u202F\u2009]/g, ' ')
    .replace(/\u2192/g, '->')
    .replace(/\u2265/g, '>=')
}

function drawDpeBadge(doc, letter, x, y, size, active = false) {
  const colors = DPE_COLORS[letter] || { bg: [156, 163, 175], text: [255, 255, 255] }
  const r = size * 0.22
  if (active) {
    doc.setFillColor(0, 0, 0)
    doc.setGState(new doc.GState({ opacity: 0.12 }))
    doc.roundedRect(x + 0.6, y + 0.6, size, size, r, r, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))
  }
  doc.setFillColor(...colors.bg)
  doc.roundedRect(x, y, size, size, r, r, 'F')
  doc.setTextColor(...colors.text)
  doc.setFontSize(active ? size * 0.55 : size * 0.45)
  doc.setFont('helvetica', 'bold')
  doc.text(letter, x + size / 2, y + size * 0.62, { align: 'center' })
}

function drawChevron(doc, x, y, h, color) {
  const w = 3
  const half = h / 2
  doc.setDrawColor(...color)
  doc.setLineWidth(0.6)
  doc.line(x, y, x + w, y + half)
  doc.line(x + w, y + half, x, y + h)
  doc.setLineWidth(0.2)
}

// ─── Barre multi-segments CEE / MPR / RAC ───
function drawMultiBar(doc, x, y, width, segments) {
  const barH = 8
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total <= 0) return y

  let cx = x
  segments.forEach(seg => {
    if (seg.value <= 0) return
    const w = Math.max(1, (seg.value / total) * width)
    doc.setFillColor(...seg.color)
    doc.roundedRect(cx, y, w, barH, cx === x ? 2 : 0, cx + w >= x + width - 1 ? 2 : 0, 'F')
    // Texte dans le segment si assez large
    if (w > 20) {
      doc.setFontSize(5.5)
      doc.setTextColor(...C.white)
      doc.setFont('helvetica', 'bold')
      doc.text(`${seg.label} ${Math.round((seg.value / total) * 100)}%`, cx + w / 2, y + barH * 0.6, { align: 'center' })
    }
    cx += w
  })

  // Legende
  y += barH + 3
  let lx = x
  segments.forEach(seg => {
    if (seg.value <= 0) return
    doc.setFillColor(...seg.color)
    doc.roundedRect(lx, y - 1.5, 2.5, 2.5, 0.6, 0.6, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'bold')
    doc.text(`${seg.label} : ${fmt(seg.value)}`, lx + 4, y + 0.5)
    lx += 4 + doc.getTextWidth(`${seg.label} : ${fmt(seg.value)}`) + 6
  })

  return y + 5
}

/**
 * Genere un PDF de simulation — Design Artex
 */
export function generateSimulationPDF({
  company = {},
  ficheCode,
  ficheTitle,
  params = [],
  results = [],
  summary = {},
  margin = null,
  clientName = '',
  mode = null,
  classInitiale = null,
  classCible = null,
  jumps = 0,
  surface = 0,
  workItems = [],
  mprCategory = null,
  mprTaux = null,
  mprDepenseEligible = null,
  mprPlafond = null,
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const mx = 15
  const cw = W - mx * 2
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  let y = 0

  const isAnah = mode === 'anah'
  const cleanParams = params.map(p => ({ label: sanitize(p.label), value: sanitize(String(p.value ?? '')) }))
  const cleanResults = results.map(r => ({ label: sanitize(r.label), value: sanitize(String(r.value ?? '')) }))

  const totalAid = summary.totalAid || 0
  const rac = summary.resteACharge || 0
  const cost = summary.projectCost || 0
  const cee = summary.ceeCommerciale || 0
  const mpr = summary.mprFinal || 0

  // ════════════════════════════════════════════
  //  EN-TETE — Bandeau dark artex
  // ════════════════════════════════════════════
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, 36, 'F')

  // Accent vert en bas du bandeau
  doc.setFillColor(...C.brandLight)
  doc.rect(0, 36, W, 1.2, 'F')

  if (company.logo) {
    try { doc.addImage(company.logo, 'AUTO', mx, 5, 24, 24) } catch (e) { /* skip */ }
  }

  const hx = company.logo ? mx + 29 : mx
  doc.setTextColor(...C.brandLight)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name || 'Artex360', hx, 14)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 170, 190)
  const lines = []
  if (company.address) lines.push(company.address)
  if (company.postalCode || company.city) lines.push(`${company.postalCode || ''} ${company.city || ''}`.trim())
  if (company.phone) lines.push(`Tel : ${company.phone}`)
  if (company.email) lines.push(company.email)
  lines.forEach((l, i) => doc.text(l, hx, 20 + i * 3))

  // SIRET / RGE a droite
  if (company.siret || company.rge) {
    doc.setFontSize(6)
    doc.setTextColor(120, 130, 150)
    if (company.siret) doc.text(`SIRET : ${company.siret}`, W - mx, 12, { align: 'right' })
    if (company.rge) doc.text(`RGE : ${company.rge}`, W - mx, 16, { align: 'right' })
  }

  // Date a droite
  doc.setFontSize(7)
  doc.setTextColor(120, 130, 150)
  doc.text(dateStr, W - mx, 24, { align: 'right' })

  y = 44

  // ════════════════════════════════════════════
  //  TITRE + FICHE
  // ════════════════════════════════════════════
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('SIMULATION DE RENOVATION ENERGETIQUE', W / 2, y, { align: 'center' })
  y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.brand)
  doc.text(`${ficheCode} — ${ficheTitle || ''}`, W / 2, y, { align: 'center' })
  y += 3

  // Ligne verte decorative
  doc.setDrawColor(...C.brandLight)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 30, y, W / 2 + 30, y)
  doc.setLineWidth(0.2)
  y += 5

  // Client + Badge MPR
  if (clientName || mprCategory) {
    const badgeInfo = MPR_BADGE[mprCategory]
    if (clientName) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.text)
      doc.text(`Client : ${clientName}`, mx, y + 3)
    }
    if (badgeInfo) {
      const badgeLabel = `${mprCategory} — ${badgeInfo.label}`
      const bw = doc.getTextWidth(badgeLabel) * 0.85 + 10
      const bx = clientName ? W - mx - bw : W / 2 - bw / 2
      doc.setFillColor(...badgeInfo.bg)
      doc.roundedRect(bx, y - 1, bw, 7, 3, 3, 'F')
      doc.setFontSize(6.5)
      doc.setTextColor(...badgeInfo.text)
      doc.setFont('helvetica', 'bold')
      doc.text(badgeLabel, bx + bw / 2, y + 3.5, { align: 'center' })
    }
    y += 10
  }

  // Badge mode
  if (isAnah) {
    const modeLabel = "MaPrimeRenov' Parcours Accompagne"
    const modeW = doc.getTextWidth(modeLabel) * 0.85 + 12
    doc.setFillColor(...C.brand)
    doc.roundedRect(W / 2 - modeW / 2, y, modeW, 7, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(modeLabel, W / 2, y + 4.8, { align: 'center' })
    y += 10
  }

  // ════════════════════════════════════════════
  //  SAUT DPE
  // ════════════════════════════════════════════
  if (classInitiale && classCible) {
    doc.setFillColor(...C.bgLight)
    doc.roundedRect(mx, y, cw, 34, 3, 3, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(mx, y, cw, 34, 3, 3, 'S')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('PERFORMANCE ENERGETIQUE', mx + 6, y + 7)

    const jumpLabel = `+${jumps} classe${jumps > 1 ? 's' : ''} DPE`
    doc.setFillColor(...C.brand)
    const jumpW = doc.getTextWidth(jumpLabel) + 8
    doc.roundedRect(W - mx - jumpW - 4, y + 3, jumpW, 8, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.text(jumpLabel, W - mx - jumpW / 2 - 4, y + 8.2, { align: 'center' })

    const trailY = y + 14
    const startIdx = CLASS_ORDER.indexOf(classInitiale)
    const endIdx = CLASS_ORDER.indexOf(classCible)
    const trail = CLASS_ORDER.slice(startIdx, endIdx + 1)
    const activeSize = 14
    const inactiveSize = 9
    const arrowW = 6

    let totalW = activeSize + arrowW
    for (let i = 1; i < trail.length - 1; i++) totalW += inactiveSize + 2
    if (trail.length > 2) totalW += arrowW
    totalW += activeSize

    let cx = W / 2 - totalW / 2
    drawDpeBadge(doc, classInitiale, cx, trailY, activeSize, true)
    cx += activeSize + 1
    drawChevron(doc, cx + 0.5, trailY + activeSize * 0.2, activeSize * 0.6, C.textLight)
    cx += arrowW
    for (let i = 1; i < trail.length - 1; i++) {
      drawDpeBadge(doc, trail[i], cx, trailY + (activeSize - inactiveSize) / 2, inactiveSize)
      cx += inactiveSize + 2
    }
    if (trail.length > 2) {
      drawChevron(doc, cx + 0.5, trailY + activeSize * 0.2, activeSize * 0.6, C.textLight)
      cx += arrowW
    }
    drawDpeBadge(doc, classCible, cx, trailY, activeSize, true)

    y += 38
  }

  // ════════════════════════════════════════════
  //  TRAVAUX / PARAMETRES
  // ════════════════════════════════════════════
  if (workItems && workItems.length > 0) {
    y += 2
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('TRAVAUX PREVUS', mx, y)
    y += 2

    const worksBody = workItems.filter(w => w.type || w.label).map(w => {
      const ht = Number(w.prixHT) || 0
      const tva = Number(w.tva) || 5.5
      const ttc = Math.round(ht * (1 + tva / 100))
      return [sanitize(w.label || w.type), ht > 0 ? fmt(ht) : '-', ht > 0 ? `${tva}%` : '-', ttc > 0 ? fmt(ttc) : '-']
    })

    if (worksBody.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: mx, right: mx },
        head: [['Poste', 'HT', 'TVA', 'TTC']],
        body: worksBody,
        theme: 'grid',
        headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
        bodyStyles: { fontSize: 8, textColor: C.text, cellPadding: 3, lineColor: [230, 235, 245], lineWidth: 0.3 },
        columnStyles: {
          0: { cellWidth: cw * 0.46, fontStyle: 'bold' },
          1: { cellWidth: cw * 0.18, halign: 'right' },
          2: { cellWidth: cw * 0.12, halign: 'center', textColor: C.textLight },
          3: { cellWidth: cw * 0.24, halign: 'right', fontStyle: 'bold', textColor: C.primary },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })
      y = doc.lastAutoTable.finalY + 6
    }
  } else {
    y += 4
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('PARAMETRES DU PROJET', mx, y)
    y += 2
    autoTable(doc, {
      startY: y,
      margin: { left: mx, right: mx },
      body: cleanParams.map(p => [p.label, p.value]),
      theme: 'plain',
      bodyStyles: { fontSize: 8, textColor: C.text, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: cw * 0.50, textColor: C.textLight },
        1: { cellWidth: cw * 0.50, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ════════════════════════════════════════════
  //  FINANCEMENT — Bloc dark artex
  // ════════════════════════════════════════════
  if (y + 70 > H) { doc.addPage(); y = 20 }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('VOTRE FINANCEMENT', mx, y)
  y += 4

  if (isAnah && mpr > 0) {
    // ──────── MODE ANAH ────────
    const cardH = 16
    const cardGap = 3
    const cardW = (cw - cardGap * 2 - 8) / 3
    const infoH = cardH + 14

    doc.setFillColor(240, 253, 244) // green-50
    doc.roundedRect(mx, y, cw, infoH, 3, 3, 'F')
    doc.setDrawColor(187, 247, 208)
    doc.roundedRect(mx, y, cw, infoH, 3, 3, 'S')

    const cardY = y + 4
    const cardBaseX = mx + 4

    // Carte 1 — Sauts DPE
    doc.setFillColor(...C.white)
    doc.roundedRect(cardBaseX, cardY, cardW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(cardBaseX, cardY, cardW, cardH, 2, 2, 'S')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text('Sauts DPE :', cardBaseX + 4, cardY + 6)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textLight)
    doc.text(`${jumps} classes`, cardBaseX + 4, cardY + 11)

    // Carte 2 — Taux MPR
    const card2X = cardBaseX + cardW + cardGap
    doc.setFillColor(...C.white)
    doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'S')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text('Taux MPR :', card2X + 4, cardY + 6)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.brand)
    doc.text(`${Math.round((mprTaux || 0) * 100)}%`, card2X + 4, cardY + 11)

    // Carte 3 — Depense eligible
    const card3X = card2X + cardW + cardGap
    doc.setFillColor(...C.white)
    doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'S')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text('Depense eligible :', card3X + 4, cardY + 6)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textLight)
    doc.text(fmt(mprDepenseEligible || 0), card3X + 4, cardY + 11)

    y += infoH + 4
  }

  // ──────── Bloc synthese dark ────────
  const hasCee = cee > 0
  const hasMpr = mpr > 0
  let lineCount = 1 // cout projet
  if (hasCee) lineCount++
  if (hasMpr) lineCount++
  const synthH = 12 + (lineCount * 9) + 30

  doc.setFillColor(...C.primary)
  doc.roundedRect(mx, y, cw, synthH, 4, 4, 'F')

  let sy = y + 10
  const sl = mx + 10
  const sr = W - mx - 10

  // Cout projet
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 170, 190)
  doc.text('Cout total du projet', sl, sy)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(cost), sr, sy, { align: 'right' })
  sy += 9

  // CEE
  if (hasCee) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 170, 190)
    doc.text('Prime CEE', sl, sy)
    doc.setTextColor(...C.brandLight)
    doc.setFont('helvetica', 'bold')
    doc.text(`- ${fmt(cee)}`, sr, sy, { align: 'right' })
    sy += 9
  }

  // MPR
  if (hasMpr) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 170, 190)
    doc.text("MaPrimeRenov'", sl, sy)
    doc.setTextColor(...C.sky)
    doc.setFont('helvetica', 'bold')
    doc.text(`- ${fmt(mpr)}`, sr, sy, { align: 'right' })
    sy += 9
  }

  // Separateur
  doc.setDrawColor(60, 65, 80)
  doc.line(sl, sy - 2, sr, sy - 2)
  sy += 5

  // TOTAL AIDES
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(160, 170, 190)
  doc.text('TOTAL DES AIDES', sl, sy)
  doc.setTextColor(...C.brandLight)
  doc.setFontSize(14)
  doc.text(fmt(totalAid), sr, sy, { align: 'right' })
  sy += 12

  // RESTE A CHARGE
  doc.setFillColor(255, 255, 255)
  doc.setGState(new doc.GState({ opacity: 0.08 }))
  doc.roundedRect(sl - 4, sy - 5, cw - 12, 14, 3, 3, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))

  doc.setFontSize(10)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text('RESTE A CHARGE', sl, sy + 3)
  doc.setFontSize(16)
  doc.text(fmt(rac), sr, sy + 4, { align: 'right' })

  y += synthH + 6

  // ──────── Barre multi-segments ────────
  const barSegments = []
  if (hasCee) barSegments.push({ label: 'CEE', value: cee, color: C.brandLight })
  if (hasMpr) barSegments.push({ label: 'MPR', value: mpr, color: C.sky })
  if (rac > 0) barSegments.push({ label: 'RAC', value: rac, color: [148, 163, 184] }) // slate-400

  if (barSegments.length > 0) {
    y = drawMultiBar(doc, mx, y, cw, barSegments)
    y += 4
  }

  // ════════════════════════════════════════════
  //  DETAILS TECHNIQUES
  // ════════════════════════════════════════════
  if (cleanResults.length > 0) {
    if (y + 30 > H) { doc.addPage(); y = 20 }
    y += 2
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('DETAILS TECHNIQUES', mx, y)
    y += 2
    autoTable(doc, {
      startY: y,
      margin: { left: mx, right: mx },
      body: cleanResults.map(r => [r.label, r.value]),
      theme: 'plain',
      bodyStyles: { fontSize: 8, textColor: C.text, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: cw * 0.55, textColor: C.textLight },
        1: { cellWidth: cw * 0.45, halign: 'right', fontStyle: 'bold' },
      },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ════════════════════════════════════════════
  //  MARGE CEE (interne)
  // ════════════════════════════════════════════
  if (margin && margin.showOnPdf) {
    doc.setFillColor(240, 249, 255)
    doc.roundedRect(mx, y, cw, 18, 2, 2, 'F')
    doc.setDrawColor(186, 230, 253)
    doc.roundedRect(mx, y, cw, 18, 2, 2, 'S')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('Marge CEE (usage interne)', mx + 5, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.text)
    doc.setFontSize(7)
    doc.text(`Base 100% : ${fmt(margin.ceeBase)}  |  Appliquee : ${fmt(margin.ceeApplied)}  |  Marge : ${fmt(margin.margin)} (${Math.round(margin.marginPercent)}%)`, mx + 5, y + 12)
    y += 22
  }

  // ════════════════════════════════════════════
  //  AVANTAGES
  // ════════════════════════════════════════════
  if (y + 45 > H) { doc.addPage(); y = 20 }
  y += 2
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('VOS AVANTAGES', mx, y)
  y += 5

  const advantages = isAnah ? [
    { icon: 'M', text: "MaPrimeRenov' : jusqu'a 80% de prise en charge selon vos revenus" },
    { icon: 'E', text: "Economies d'energie : reduisez vos factures de chauffage durablement" },
    { icon: 'C', text: 'Confort thermique ameliore ete comme hiver dans toute votre habitation' },
    { icon: 'V', text: 'Valorisation de votre bien immobilier grace a un meilleur classement DPE' },
  ] : [
    { icon: 'E', text: "Economies d'energie : reduisez vos factures de chauffage durablement" },
    { icon: 'C', text: 'Confort thermique ameliore ete comme hiver dans toute votre habitation' },
    { icon: 'V', text: 'Valorisation de votre bien immobilier grace a un meilleur classement DPE' },
    { icon: 'A', text: "Prime CEE deduite directement — pas d'avance de tresorerie sur les aides" },
  ]

  advantages.forEach(adv => {
    doc.setFillColor(...C.brand)
    doc.circle(mx + 4, y + 0.5, 3, 'F')
    doc.setFontSize(6)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(adv.icon, mx + 4, y + 1.5, { align: 'center' })
    doc.setFontSize(7.5)
    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'normal')
    doc.text(adv.text, mx + 10, y + 1.5, { maxWidth: cw - 12 })
    y += 8
  })

  // ════════════════════════════════════════════
  //  FOOTER
  // ════════════════════════════════════════════
  const footerY = H - 12
  doc.setDrawColor(...C.border)
  doc.line(mx, footerY - 5, W - mx, footerY - 5)

  // Bandeau vert discret
  doc.setFillColor(...C.brandLight)
  doc.rect(0, H - 2, W, 2, 'F')

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`Simulation indicative — fiche ${ficheCode}. Montants sous reserve d'eligibilite. Non contractuel.`, W / 2, footerY - 1, { align: 'center', maxWidth: cw })
  doc.text(`${company.name || 'Artex360'} — Document genere le ${dateStr}`, W / 2, footerY + 3, { align: 'center', maxWidth: cw })

  const safeName = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) + '_' : ''
  doc.save(`simulation_${safeName}${ficheCode}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
