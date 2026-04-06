import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Palette ───
const C = {
  primary:      [30, 27, 75],
  primaryLight: [99, 102, 241],
  green:        [22, 101, 52],
  greenLight:   [34, 197, 94],
  greenDark:    [5, 46, 22],
  emerald:      [16, 185, 129],
  blue:         [37, 99, 235],
  text:         [30, 41, 59],
  textLight:    [100, 116, 139],
  border:       [226, 232, 240],
  bgLight:      [248, 250, 252],
  yellow:       [234, 179, 8],
  orange:       [234, 88, 12],
  white:        [255, 255, 255],
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

const MPR_CATEGORY_LABELS = {
  Bleu: 'Tres modestes',
  Jaune: 'Modestes',
  Violet: 'Intermediaires',
  Rose: 'Superieurs',
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

function drawFinanceBar(doc, x, y, width, totalCost, aides, rac, aideColor = C.emerald) {
  if (totalCost <= 0) return y
  const barH = 7
  const aidePct = Math.min(aides / totalCost, 1)
  const aideW = Math.max(6, width * aidePct)

  doc.setFillColor(...aideColor)
  doc.roundedRect(x, y, aideW, barH, 2, 2, 'F')
  if (aideW > 12) {
    doc.setFontSize(5.5)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(`${Math.round(aidePct * 100)}%`, x + aideW / 2, y + barH * 0.6, { align: 'center' })
  }

  const racW = width - aideW
  if (racW > 2) {
    doc.setFillColor(...C.primaryLight)
    doc.roundedRect(x + aideW, y, racW, barH, 2, 2, 'F')
    if (racW > 12) {
      doc.setFontSize(5.5)
      doc.setTextColor(...C.white)
      doc.text(`${Math.round((1 - aidePct) * 100)}%`, x + aideW + racW / 2, y + barH * 0.6, { align: 'center' })
    }
  }

  y += barH + 4
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')

  // Legende gauche — Aides
  doc.setFillColor(...aideColor)
  doc.roundedRect(x, y - 2, 3, 3, 0.8, 0.8, 'F')
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.text(`Aides : ${fmt(aides)}`, x + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`(${Math.round(aidePct * 100)}%)`, x + 5 + doc.getTextWidth(`Aides : ${fmt(aides)} `), y)

  // Legende droite — RAC
  doc.setFillColor(...C.primaryLight)
  doc.roundedRect(x + width / 2, y - 2, 3, 3, 0.8, 0.8, 'F')
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.text(`Reste a charge : ${fmt(rac)}`, x + width / 2 + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`(${Math.round((1 - aidePct) * 100)}%)`, x + width / 2 + 5 + doc.getTextWidth(`Reste a charge : ${fmt(rac)} `), y)
  return y + 6
}

/**
 * Genere un PDF de simulation
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
  const accentColor = isAnah ? C.greenLight : C.emerald
  const darkBg = isAnah ? C.greenDark : C.primary

  const cleanParams = params.map(p => ({ label: sanitize(p.label), value: sanitize(String(p.value ?? '')) }))
  const cleanResults = results.map(r => ({ label: sanitize(r.label), value: sanitize(String(r.value ?? '')) }))

  // ════════════════════════════════════════════
  //  EN-TETE
  // ════════════════════════════════════════════
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, 38, 'F')
  doc.setFillColor(...accentColor)
  doc.rect(0, 38, W, 1.5, 'F')

  if (company.logo) {
    try { doc.addImage(company.logo, 'AUTO', mx, 5, 26, 26) } catch (e) { /* skip */ }
  }

  const hx = company.logo ? mx + 31 : mx
  doc.setTextColor(...C.white)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name || 'Artex360', hx, 15)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  const lines = []
  if (company.address) lines.push(company.address)
  if (company.postalCode || company.city) lines.push(`${company.postalCode || ''} ${company.city || ''}`.trim())
  if (company.phone) lines.push(`Tel : ${company.phone}`)
  if (company.email) lines.push(company.email)
  lines.forEach((l, i) => doc.text(l, hx, 21 + i * 3.2))

  if (company.siret || company.rge) {
    doc.setFontSize(6.5)
    doc.setTextColor(180, 180, 210)
    if (company.siret) doc.text(`SIRET : ${company.siret}`, W - mx, 14, { align: 'right' })
    if (company.rge) doc.text(`RGE : ${company.rge}`, W - mx, 18, { align: 'right' })
  }

  y = 46

  // ════════════════════════════════════════════
  //  TITRE
  // ════════════════════════════════════════════
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('VOTRE PROJET DE RENOVATION ENERGETIQUE', W / 2, y, { align: 'center' })

  y += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.primaryLight)
  doc.text(ficheTitle || ficheCode, W / 2, y, { align: 'center' })

  y += 4
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(0.8)
  doc.line(W / 2 - 25, y, W / 2 + 25, y)
  doc.setLineWidth(0.2)
  y += 4

  // Badge mode
  if (isAnah) {
    const modeLabel = "MaPrimeRenov' Parcours Accompagne"
    const modeW = doc.getTextWidth(modeLabel) * 0.85 + 12
    doc.setFillColor(...C.greenLight)
    doc.roundedRect(W / 2 - modeW / 2, y, modeW, 7, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(modeLabel, W / 2, y + 4.8, { align: 'center' })
    y += 10
  } else if (mode === 'cee') {
    const modeLabel = 'Financement 100% CEE'
    const modeW = doc.getTextWidth(modeLabel) * 0.85 + 12
    doc.setFillColor(...C.primaryLight)
    doc.roundedRect(W / 2 - modeW / 2, y, modeW, 7, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(modeLabel, W / 2, y + 4.8, { align: 'center' })
    y += 10
  } else {
    y += 2
  }

  // Date + client
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`Date : ${dateStr}`, mx, y)
  if (clientName) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text(`Client : ${clientName}`, W - mx, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
  }
  y += 8

  // ════════════════════════════════════════════
  //  SAUT DPE
  // ════════════════════════════════════════════
  if (classInitiale && classCible) {
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(mx, y, cw, 34, 3, 3, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(mx, y, cw, 34, 3, 3, 'S')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('PERFORMANCE ENERGETIQUE', mx + 6, y + 7)

    const jumpLabel = `+${jumps} classe${jumps > 1 ? 's' : ''} DPE`
    doc.setFillColor(...accentColor)
    const jumpW = doc.getTextWidth(jumpLabel) + 8
    doc.roundedRect(W - mx - jumpW - 4, y + 3, jumpW, 8, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.text(jumpLabel, W - mx - jumpW / 2 - 4, y + 8.2, { align: 'center' })

    // DPE trail
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
  //  TRAVAUX PREVUS
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
      head: [['Parametre', 'Valeur']],
      body: cleanParams.map(p => [p.label, p.value]),
      theme: 'striped',
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 2.5 },
      bodyStyles: { fontSize: 8, textColor: C.text, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: cw * 0.50, fontStyle: 'bold' }, 1: { cellWidth: cw * 0.50, halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ════════════════════════════════════════════
  //  FINANCEMENT
  // ════════════════════════════════════════════
  const totalAid = summary.totalAid || 0
  const rac = summary.resteACharge || 0
  const cost = summary.projectCost || 0
  const cee = summary.ceeCommerciale || 0
  const mpr = summary.mprFinal || 0

  if (y + 80 > H) { doc.addPage(); y = 20 }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('VOTRE FINANCEMENT', mx, y)
  y += 4

  if (isAnah && mpr > 0) {
    // ──────── MODE ANAH — MaPrimeRenov' ────────

    // Bloc fond vert clair avec 3 cartes blanches (comme l'UI web)
    const cardH = 16
    const cardGap = 3
    const cardW = (cw - cardGap * 2 - 8) / 3
    const infoH = cardH + 14

    doc.setFillColor(236, 253, 245)
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
    doc.setTextColor(...C.green)
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

    // Grand bloc vert fonce (comme l'UI green-800)
    const synthH = 64

    doc.setFillColor(22, 101, 52) // green-800
    doc.roundedRect(mx, y, cw, synthH, 4, 4, 'F')

    const centerX = W / 2

    // Titre centre
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(187, 247, 208) // green-200
    doc.text("MAPRIMERENOV' PARCOURS ACCOMPAGNE", centerX, y + 10, { align: 'center' })

    // Montant MPR centre
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.greenLight) // green-300
    doc.text(fmt(mpr), centerX, y + 20, { align: 'center' })

    // Detail calcul
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(134, 239, 172) // green-300
    doc.text(`${Math.round((mprTaux || 0) * 100)}% x ${fmt(mprDepenseEligible || 0)} HT`, centerX, y + 25, { align: 'center' })

    // Separateur
    doc.setDrawColor(21, 128, 61) // green-700
    doc.line(mx + 12, y + 30, W - mx - 12, y + 30)

    // TOTAL AIDES
    const sl = mx + 14
    const sr = W - mx - 14
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text('TOTAL AIDES :', sl, y + 40)
    doc.setFontSize(14)
    doc.setTextColor(...C.yellow) // yellow-300
    doc.text(fmt(totalAid), sr, y + 40, { align: 'right' })

    // RESTE A CHARGE
    doc.setFontSize(9)
    doc.setTextColor(187, 247, 208) // green-200
    doc.setFont('helvetica', 'bold')
    doc.text('RESTE A CHARGE :', sl, y + 52)
    doc.setFontSize(13)
    doc.setTextColor(...C.white)
    doc.text(fmt(rac), sr, y + 52, { align: 'right' })

    y += synthH + 6
    y = drawFinanceBar(doc, mx, y, cw, cost, totalAid, rac, C.greenLight)

  } else {
    // ──────── MODE CEE ────────
    let synthLines = 1
    if (cee > 0) synthLines++
    if (mpr > 0) synthLines++
    const synthH = 14 + (synthLines * 8) + 28

    doc.setFillColor(...C.primary)
    doc.roundedRect(mx, y, cw, synthH, 4, 4, 'F')

    let sy = y + 10
    const sl = mx + 10
    const sr = W - mx - 10

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 190, 220)
    doc.text('Cout total du projet', sl, sy)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(fmt(cost), sr, sy, { align: 'right' })
    sy += 8

    if (cee > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 220)
      doc.text('Prime CEE deduite', sl, sy)
      doc.setTextColor(...C.yellow)
      doc.setFont('helvetica', 'bold')
      doc.text(`- ${fmt(cee)}`, sr, sy, { align: 'right' })
      sy += 8
    }

    if (mpr > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 220)
      doc.text("MaPrimeRenov'", sl, sy)
      doc.setTextColor(...C.greenLight)
      doc.setFont('helvetica', 'bold')
      doc.text(`- ${fmt(mpr)}`, sr, sy, { align: 'right' })
      sy += 8
    }

    doc.setDrawColor(80, 70, 140)
    doc.line(sl, sy, sr, sy)
    sy += 7

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 190, 220)
    doc.text('TOTAL DES AIDES', sl, sy)
    doc.setTextColor(...C.yellow)
    doc.setFontSize(13)
    doc.text(fmt(totalAid), sr, sy, { align: 'right' })
    sy += 10

    doc.setFillColor(255, 255, 255)
    doc.setGState(new doc.GState({ opacity: 0.1 }))
    doc.roundedRect(sl - 4, sy - 5, cw - 12, 14, 3, 3, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))

    doc.setFontSize(10)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text('RESTE A CHARGE', sl, sy + 3)
    doc.setFontSize(16)
    doc.text(fmt(rac), sr, sy + 4, { align: 'right' })

    y += synthH + 6
    y = drawFinanceBar(doc, mx, y, cw, cost, totalAid, rac, C.emerald)
  }

  y += 4

  // ════════════════════════════════════════════
  //  DETAILS TECHNIQUES
  // ════════════════════════════════════════════
  if (cleanResults.length > 0) {
    if (y + 30 > H) { doc.addPage(); y = 20 }
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
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(mx, y, cw, 18, 2, 2, 'F')
    doc.setDrawColor(147, 197, 253)
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
  if (y + 50 > H) { doc.addPage(); y = 20 }
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
    doc.setFillColor(...accentColor)
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
  const footerY = H - 14
  doc.setDrawColor(...C.border)
  doc.line(mx, footerY - 5, W - mx, footerY - 5)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`Simulation indicative basee sur la fiche ${ficheCode}. Montants sous reserve d'eligibilite. Non contractuel.`, W / 2, footerY - 1, { align: 'center', maxWidth: cw })
  doc.text(`Document genere le ${dateStr} via Artex360 — Plateforme d'outils pour artisans en renovation energetique.`, W / 2, footerY + 3, { align: 'center', maxWidth: cw })
  doc.setFontSize(5.5)
  doc.text(`Ref. ${ficheCode}`, W - mx, footerY + 7, { align: 'right' })

  const safeName = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) + '_' : ''
  doc.save(`simulation_${safeName}${ficheCode}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
