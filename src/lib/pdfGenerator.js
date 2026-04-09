import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Palette Artex ───
const C = {
  primary:      [17, 19, 24],
  brand:        [116, 191, 22],
  brandDark:    [74, 122, 15],
  brandLight:   [136, 219, 27],
  brandBg:      [240, 253, 230],
  sky:          [56, 189, 248],
  skyBg:        [240, 249, 255],
  amber:        [251, 191, 36],
  text:         [30, 41, 59],
  textLight:    [100, 116, 139],
  border:       [226, 232, 240],
  bgLight:      [248, 250, 252],
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

// ─── Icone cercle avec lettre ───
function drawIcon(doc, letter, x, y, color, size = 6) {
  doc.setFillColor(...color)
  doc.circle(x, y, size / 2, 'F')
  doc.setFontSize(size * 0.55)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text(letter, x, y + size * 0.15, { align: 'center' })
}

// ─── Section header avec icone ───
function drawSectionHeader(doc, title, subtitle, icon, iconColor, x, y, width) {
  drawIcon(doc, icon, x + 4, y + 3.5, iconColor, 7)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text(title, x + 10, y + 3)
  if (subtitle) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textLight)
    doc.text(subtitle, x + 10, y + 7)
  }
  return y + (subtitle ? 12 : 8)
}

// ─── Card avec bordure ───
function drawCard(doc, x, y, w, h) {
  doc.setFillColor(...C.white)
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F')
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'S')
  doc.setLineWidth(0.2)
}

// ─── Ligne parametre dans une card ───
function drawParamLine(doc, label, value, x, y, w, isAlt) {
  if (isAlt) {
    doc.setFillColor(...C.bgLight)
    doc.rect(x, y - 3, w, 7, 'F')
  }
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(label, x + 4, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(value, x + w - 4, y, { align: 'right' })
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
  const w = 3, half = h / 2
  doc.setDrawColor(...color)
  doc.setLineWidth(0.6)
  doc.line(x, y, x + w, y + half)
  doc.line(x + w, y + half, x, y + h)
  doc.setLineWidth(0.2)
}

/**
 * Genere un PDF de simulation — Design Artex v2
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
  //  EN-TETE — Bandeau dark
  // ════════════════════════════════════════════
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, 34, 'F')
  doc.setFillColor(...C.brandLight)
  doc.rect(0, 34, W, 1, 'F')

  if (company.logo) {
    try { doc.addImage(company.logo, 'AUTO', mx, 4, 24, 24) } catch (e) { /* skip */ }
  }

  const hx = company.logo ? mx + 29 : mx
  doc.setTextColor(...C.brandLight)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name || 'Artex360', hx, 13)

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 160, 180)
  const lines = []
  if (company.address) lines.push(company.address)
  if (company.postalCode || company.city) lines.push(`${company.postalCode || ''} ${company.city || ''}`.trim())
  if (company.phone) lines.push(`Tel : ${company.phone}`)
  if (company.email) lines.push(company.email)
  lines.forEach((l, i) => doc.text(l, hx, 18 + i * 2.8))

  if (company.siret || company.rge) {
    doc.setFontSize(6)
    doc.setTextColor(110, 120, 140)
    if (company.siret) doc.text(`SIRET : ${company.siret}`, W - mx, 11, { align: 'right' })
    if (company.rge) doc.text(`RGE : ${company.rge}`, W - mx, 15, { align: 'right' })
  }

  doc.setFontSize(7)
  doc.setTextColor(110, 120, 140)
  doc.text(dateStr, W - mx, 22, { align: 'right' })

  y = 41

  // ════════════════════════════════════════════
  //  TITRE + BADGE
  // ════════════════════════════════════════════
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('SIMULATION DE RENOVATION ENERGETIQUE', W / 2, y, { align: 'center' })
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.brand)
  doc.text(`${ficheCode} — ${ficheTitle || ''}`, W / 2, y, { align: 'center' })
  y += 3

  doc.setDrawColor(...C.brandLight)
  doc.setLineWidth(0.5)
  doc.line(W / 2 - 28, y, W / 2 + 28, y)
  doc.setLineWidth(0.2)
  y += 5

  // Client + Badge MPR sur meme ligne
  if (clientName || mprCategory) {
    if (clientName) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.text)
      doc.text(`Client : ${clientName}`, mx, y + 3)
    }
    const badgeInfo = MPR_BADGE[mprCategory]
    if (badgeInfo) {
      const bl = `${mprCategory} — ${badgeInfo.label}`
      const bw = doc.getTextWidth(bl) * 0.85 + 10
      const bx = clientName ? W - mx - bw : W / 2 - bw / 2
      doc.setFillColor(...badgeInfo.bg)
      doc.roundedRect(bx, y - 0.5, bw, 7, 3, 3, 'F')
      doc.setFontSize(6.5)
      doc.setTextColor(...badgeInfo.text)
      doc.setFont('helvetica', 'bold')
      doc.text(bl, bx + bw / 2, y + 3.5, { align: 'center' })
    }
    y += 10
  }

  // Badge mode
  if (isAnah) {
    const ml = "MaPrimeRenov' Parcours Accompagne"
    const mw = doc.getTextWidth(ml) * 0.85 + 12
    doc.setFillColor(...C.brand)
    doc.roundedRect(W / 2 - mw / 2, y, mw, 7, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(ml, W / 2, y + 4.8, { align: 'center' })
    y += 10
  }

  // ════════════════════════════════════════════
  //  SAUT DPE
  // ════════════════════════════════════════════
  if (classInitiale && classCible) {
    drawCard(doc, mx, y, cw, 34)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    drawIcon(doc, 'E', mx + 7, y + 7, C.brand, 7)
    doc.text('PERFORMANCE ENERGETIQUE', mx + 13, y + 8)

    const jumpLabel = `+${jumps} classe${jumps > 1 ? 's' : ''} DPE`
    doc.setFillColor(...C.brand)
    const jumpW = doc.getTextWidth(jumpLabel) + 8
    doc.roundedRect(W - mx - jumpW - 4, y + 3, jumpW, 8, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.text(jumpLabel, W - mx - jumpW / 2 - 4, y + 8.2, { align: 'center' })

    const trailY = y + 15
    const startIdx = CLASS_ORDER.indexOf(classInitiale)
    const endIdx = CLASS_ORDER.indexOf(classCible)
    const trail = CLASS_ORDER.slice(startIdx, endIdx + 1)
    const activeSize = 13, inactiveSize = 9, arrowW = 6
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
  //  TRAVAUX / PARAMETRES — Cards avec icones
  // ════════════════════════════════════════════
  if (workItems && workItems.length > 0) {
    y = drawSectionHeader(doc, 'TRAVAUX PREVUS', 'Postes de renovation', 'T', C.brand, mx, y, cw)

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
        headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 7.5, cellPadding: 2.5 },
        bodyStyles: { fontSize: 7.5, textColor: C.text, cellPadding: 2.5, lineColor: [230, 235, 245], lineWidth: 0.3 },
        columnStyles: {
          0: { cellWidth: cw * 0.46, fontStyle: 'bold' },
          1: { cellWidth: cw * 0.18, halign: 'right' },
          2: { cellWidth: cw * 0.12, halign: 'center', textColor: C.textLight },
          3: { cellWidth: cw * 0.24, halign: 'right', fontStyle: 'bold', textColor: C.primary },
        },
        alternateRowStyles: { fillColor: C.bgLight },
      })
      y = doc.lastAutoTable.finalY + 6
    }
  } else {
    // ─── 2 cards cote a cote : Beneficiaire + Logement ───
    const halfW = (cw - 4) / 2

    // Separer params en 2 groupes intelligemment
    const benefParams = []
    const logementParams = []
    cleanParams.forEach(p => {
      const lbl = p.label.toLowerCase()
      if (lbl.includes('logement') || lbl.includes('surface') || lbl.includes('zone') || lbl.includes('etas') || lbl.includes('efficac'))
        logementParams.push(p)
      else
        benefParams.push(p)
    })

    // Card Beneficiaire
    const cardH1 = Math.max(benefParams.length, logementParams.length) * 7 + 16
    drawCard(doc, mx, y, halfW, cardH1)
    let cy = drawSectionHeader(doc, 'Beneficiaire', 'Profil de revenus', 'B', [59, 130, 246], mx + 3, y + 2, halfW)
    benefParams.forEach((p, i) => {
      drawParamLine(doc, p.label, p.value, mx + 2, cy + 1, halfW - 4, i % 2 === 0)
      cy += 7
    })

    // Card Logement
    drawCard(doc, mx + halfW + 4, y, halfW, cardH1)
    cy = drawSectionHeader(doc, 'Logement', 'Caracteristiques du bien', 'L', C.brand, mx + halfW + 7, y + 2, halfW)
    logementParams.forEach((p, i) => {
      drawParamLine(doc, p.label, p.value, mx + halfW + 6, cy + 1, halfW - 4, i % 2 === 0)
      cy += 7
    })

    y += cardH1 + 5
  }

  // ════════════════════════════════════════════
  //  FINANCEMENT
  // ════════════════════════════════════════════
  if (y + 80 > H) { doc.addPage(); y = 20 }

  y = drawSectionHeader(doc, 'VOTRE FINANCEMENT', 'Repartition des aides', 'F', C.brandDark, mx, y, cw)

  // ─── Cards CEE + MPR cote a cote (comme le web) ───
  const hasCee = cee > 0
  const hasMpr = mpr > 0

  if (hasCee || hasMpr) {
    const cols = (hasCee && hasMpr) ? 2 : 1
    const cardW = cols === 2 ? (cw - 4) / 2 : cw
    const cardH = 18

    if (hasCee) {
      // Card CEE — fond vert leger
      doc.setFillColor(...C.brandBg)
      doc.roundedRect(mx, y, cardW, cardH, 2.5, 2.5, 'F')
      doc.setDrawColor(200, 240, 180)
      doc.roundedRect(mx, y, cardW, cardH, 2.5, 2.5, 'S')

      drawIcon(doc, 'C', mx + 6, y + cardH / 2, C.brand, 6)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.textLight)
      doc.text('PRIME CEE', mx + 12, y + 6)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.brand)
      doc.text(fmt(cee), mx + 12, y + 13)
    }

    if (hasMpr) {
      const mprX = hasCee ? mx + cardW + 4 : mx
      const mprW = hasCee ? cardW : cardW

      // Card MPR — fond bleu leger
      doc.setFillColor(...C.skyBg)
      doc.roundedRect(mprX, y, mprW, cardH, 2.5, 2.5, 'F')
      doc.setDrawColor(186, 230, 253)
      doc.roundedRect(mprX, y, mprW, cardH, 2.5, 2.5, 'S')

      drawIcon(doc, 'M', mprX + 6, y + cardH / 2, C.sky, 6)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.textLight)
      doc.text("MAPRIMERENOV'", mprX + 12, y + 6)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.sky)
      doc.text(fmt(mpr), mprX + 12, y + 13)
    }

    y += cardH + 5
  }

  // ─── Anah detail cards ───
  if (isAnah && mpr > 0) {
    const infoCardW = (cw - 8) / 3
    const infoCardH = 14

    const infoCards = [
      { label: 'Sauts DPE', value: `${jumps} classes`, color: C.textLight },
      { label: 'Taux MPR', value: `${Math.round((mprTaux || 0) * 100)}%`, color: C.brand },
      { label: 'Depense eligible', value: fmt(mprDepenseEligible || 0), color: C.textLight },
    ]

    infoCards.forEach((card, i) => {
      const cx = mx + i * (infoCardW + 4)
      drawCard(doc, cx, y, infoCardW, infoCardH)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.text)
      doc.text(card.label, cx + 4, y + 5)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...card.color)
      doc.text(card.value, cx + 4, y + 10.5)
    })

    y += infoCardH + 5
  }

  // ─── Bloc dark synthese ───
  const synthH = 42

  doc.setFillColor(...C.primary)
  doc.roundedRect(mx, y, cw, synthH, 3, 3, 'F')

  const sl = mx + 10
  const sr = W - mx - 10
  let sy = y + 10

  // Cout projet
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 160, 180)
  doc.text('Cout total du projet', sl, sy)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(cost), sr, sy, { align: 'right' })

  // Separateur
  sy += 6
  doc.setDrawColor(50, 55, 70)
  doc.line(sl, sy, sr, sy)
  sy += 7

  // TOTAL AIDES
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(150, 160, 180)
  doc.text('TOTAL DES AIDES', sl, sy)
  doc.setTextColor(...C.brandLight)
  doc.setFontSize(14)
  doc.text(fmt(totalAid), sr, sy, { align: 'right' })
  sy += 11

  // RESTE A CHARGE
  doc.setFillColor(255, 255, 255)
  doc.setGState(new doc.GState({ opacity: 0.07 }))
  doc.roundedRect(sl - 4, sy - 5, cw - 12, 13, 2.5, 2.5, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))

  doc.setFontSize(9)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text('RESTE A CHARGE', sl, sy + 2.5)
  doc.setFontSize(15)
  doc.text(fmt(rac), sr, sy + 3, { align: 'right' })

  y += synthH + 5

  // ─── Barre multi-segments ───
  const barH = 7
  const barSegments = []
  if (hasCee) barSegments.push({ label: 'CEE', value: cee, color: C.brandLight })
  if (hasMpr) barSegments.push({ label: 'MPR', value: mpr, color: C.sky })
  if (rac > 0) barSegments.push({ label: 'RAC', value: rac, color: [180, 190, 205] })

  if (barSegments.length > 0 && cost > 0) {
    let bx = mx
    barSegments.forEach((seg, i) => {
      if (seg.value <= 0) return
      const w = Math.max(2, (seg.value / cost) * cw)
      doc.setFillColor(...seg.color)
      const rl = i === 0 ? 2 : 0
      const rr = i === barSegments.length - 1 ? 2 : 0
      doc.roundedRect(bx, y, w, barH, rl, rr, 'F')
      if (w > 22) {
        doc.setFontSize(5)
        doc.setTextColor(...C.white)
        doc.setFont('helvetica', 'bold')
        doc.text(`${seg.label} ${Math.round((seg.value / cost) * 100)}%`, bx + w / 2, y + barH * 0.6, { align: 'center' })
      }
      bx += w
    })

    // Legende
    y += barH + 3
    let lx = mx
    barSegments.forEach(seg => {
      if (seg.value <= 0) return
      doc.setFillColor(...seg.color)
      doc.roundedRect(lx, y - 1.5, 2.5, 2.5, 0.6, 0.6, 'F')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.text)
      doc.setFont('helvetica', 'bold')
      const t = `${seg.label} : ${fmt(seg.value)}`
      doc.text(t, lx + 4, y + 0.5)
      lx += 4 + doc.getTextWidth(t) + 6
    })
    y += 6
  }

  // ════════════════════════════════════════════
  //  DETAILS TECHNIQUES — Card avec icone
  // ════════════════════════════════════════════
  if (cleanResults.length > 0) {
    if (y + 30 > H) { doc.addPage(); y = 20 }
    y += 2
    y = drawSectionHeader(doc, 'DETAILS TECHNIQUES', 'Donnees de calcul', 'D', C.textLight, mx, y, cw)

    const detailH = cleanResults.length * 7 + 4
    drawCard(doc, mx, y, cw, detailH)
    let dy = y + 4
    cleanResults.forEach((r, i) => {
      drawParamLine(doc, r.label, r.value, mx + 1, dy, cw - 2, i % 2 === 0)
      dy += 7
    })
    y += detailH + 4
  }

  // ════════════════════════════════════════════
  //  MARGE CEE (interne)
  // ════════════════════════════════════════════
  if (margin && margin.showOnPdf) {
    doc.setFillColor(...C.skyBg)
    doc.roundedRect(mx, y, cw, 16, 2, 2, 'F')
    doc.setDrawColor(186, 230, 253)
    doc.roundedRect(mx, y, cw, 16, 2, 2, 'S')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('Marge CEE (usage interne)', mx + 5, y + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.text)
    doc.setFontSize(7)
    doc.text(`Base 100% : ${fmt(margin.ceeBase)}  |  Appliquee : ${fmt(margin.ceeApplied)}  |  Marge : ${fmt(margin.margin)} (${Math.round(margin.marginPercent)}%)`, mx + 5, y + 11)
    y += 20
  }

  // ════════════════════════════════════════════
  //  AVANTAGES — avec icones vertes
  // ════════════════════════════════════════════
  if (y + 42 > H) { doc.addPage(); y = 20 }
  y += 2
  y = drawSectionHeader(doc, 'VOS AVANTAGES', null, 'A', C.brand, mx, y, cw)

  const advantages = isAnah ? [
    { icon: 'M', text: "MaPrimeRenov' : jusqu'a 80% de prise en charge selon vos revenus" },
    { icon: 'E', text: "Economies d'energie : reduisez vos factures de chauffage durablement" },
    { icon: 'C', text: 'Confort thermique ameliore ete comme hiver' },
    { icon: 'V', text: 'Valorisation de votre bien immobilier grace a un meilleur DPE' },
  ] : [
    { icon: 'E', text: "Economies d'energie : reduisez vos factures de chauffage durablement" },
    { icon: 'C', text: 'Confort thermique ameliore ete comme hiver' },
    { icon: 'V', text: 'Valorisation de votre bien immobilier grace a un meilleur DPE' },
    { icon: 'A', text: "Prime CEE deduite directement — pas d'avance de tresorerie" },
  ]

  advantages.forEach(adv => {
    drawIcon(doc, adv.icon, mx + 4, y + 0.5, C.brand, 5.5)
    doc.setFontSize(7.5)
    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'normal')
    doc.text(adv.text, mx + 10, y + 1.5, { maxWidth: cw - 12 })
    y += 7
  })

  // ════════════════════════════════════════════
  //  FOOTER
  // ════════════════════════════════════════════
  const footerY = H - 10
  doc.setDrawColor(...C.border)
  doc.line(mx, footerY - 4, W - mx, footerY - 4)
  doc.setFillColor(...C.brandLight)
  doc.rect(0, H - 1.5, W, 1.5, 'F')

  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`Simulation indicative — fiche ${ficheCode}. Montants sous reserve d'eligibilite. Non contractuel.`, W / 2, footerY, { align: 'center', maxWidth: cw })
  doc.text(`${company.name || 'Artex360'} — Document genere le ${dateStr}`, W / 2, footerY + 3.5, { align: 'center', maxWidth: cw })

  const safeName = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) + '_' : ''
  doc.save(`simulation_${safeName}${ficheCode}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
