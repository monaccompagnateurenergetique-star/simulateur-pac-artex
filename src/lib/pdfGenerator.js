import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Palette Artex v3 — plus raffinée ───
const C = {
  primary:      [17, 19, 24],
  primaryLight: [30, 34, 42],
  brand:        [116, 191, 22],
  brandDark:    [74, 122, 15],
  brandLight:   [136, 219, 27],
  brandBg:      [245, 255, 235],
  sky:          [56, 189, 248],
  skyDark:      [14, 116, 192],
  skyBg:        [240, 249, 255],
  amber:        [251, 191, 36],
  orange:       [249, 115, 22],
  text:         [30, 41, 59],
  textMuted:    [100, 116, 139],
  textLight:    [148, 163, 184],
  border:       [226, 232, 240],
  borderLight:  [241, 245, 249],
  surface:      [248, 250, 252],
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

// ─── Primitives de dessin v3 ───

/** Micro-ombre portée (rectangle gris décalé sous la card) */
function drawShadow(doc, x, y, w, h, r = 3) {
  doc.setFillColor(0, 0, 0)
  doc.setGState(new doc.GState({ opacity: 0.04 }))
  doc.roundedRect(x + 0.5, y + 0.7, w, h, r, r, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
}

/** Card propre avec ombre + bordure fine */
function drawCard(doc, x, y, w, h, { shadow = true, radius = 3, fill = C.white, borderColor = C.border } = {}) {
  if (shadow) drawShadow(doc, x, y, w, h, radius)
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, w, h, radius, radius, 'F')
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, w, h, radius, radius, 'S')
  doc.setLineWidth(0.2)
}

/** Section header — trait vert à gauche + titre */
function drawSectionTitle(doc, title, subtitle, x, y, accentColor = C.brand) {
  // Trait accent vertical
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

/** Ligne de paramètre label — valeur dans une card */
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
  doc.text(value, x + w - 4, y, { align: 'right' })
}

/** Badge pill (MPR category, etc.) */
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

/** Coche verte pour les avantages */
function drawCheckmark(doc, x, y, color = C.brand) {
  doc.setDrawColor(...color)
  doc.setLineWidth(0.7)
  doc.line(x - 1.5, y, x - 0.3, y + 1.5)
  doc.line(x - 0.3, y + 1.5, x + 2, y - 1)
  doc.setLineWidth(0.2)
}

function drawDpeBadge(doc, letter, x, y, size, active = false) {
  const colors = DPE_COLORS[letter] || { bg: [156, 163, 175], text: [255, 255, 255] }
  const r = size * 0.22
  if (active) drawShadow(doc, x, y, size, size, r)
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
 * Genere un PDF de simulation — Design Artex v3
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
  const mx = 16
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

  // ════════════════════════════════════════════════════════════
  //  HEADER — Bandeau dark élégant + accent vert top
  // ════════════════════════════════════════════════════════════
  // Accent vert fin tout en haut
  doc.setFillColor(...C.brandLight)
  doc.rect(0, 0, W, 1.8, 'F')

  // Bandeau dark
  doc.setFillColor(...C.primary)
  doc.rect(0, 1.8, W, 30, 'F')

  // Filet vert bas du header
  doc.setFillColor(...C.brand)
  doc.rect(0, 31.8, W, 0.6, 'F')

  if (company.logo) {
    try { doc.addImage(company.logo, 'AUTO', mx, 5, 22, 22) } catch (e) { /* skip */ }
  }

  const hx = company.logo ? mx + 27 : mx

  // Nom entreprise
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandLight)
  doc.text(company.name || 'Artex360', hx, 11)

  // Infos entreprise
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 150, 170)
  const infoLines = []
  if (company.address) infoLines.push(company.address)
  if (company.postalCode || company.city) infoLines.push(`${company.postalCode || ''} ${company.city || ''}`.trim())
  if (company.phone) infoLines.push(`Tel : ${company.phone}`)
  if (company.email) infoLines.push(company.email)
  infoLines.forEach((l, i) => doc.text(l, hx, 15.5 + i * 2.8))

  // Date + certifications à droite
  doc.setFontSize(7.5)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'normal')
  doc.text(dateStr, W - mx, 10, { align: 'right' })

  if (company.siret || company.rge) {
    doc.setFontSize(6)
    doc.setTextColor(110, 120, 140)
    let ry = 15
    if (company.siret) { doc.text(`SIRET : ${company.siret}`, W - mx, ry, { align: 'right' }); ry += 3 }
    if (company.rge) doc.text(`RGE : ${company.rge}`, W - mx, ry, { align: 'right' })
  }

  y = 38

  // ════════════════════════════════════════════════════════════
  //  TITRE CENTRAL + BADGE MPR
  // ════════════════════════════════════════════════════════════
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('SIMULATION DE RENOVATION ENERGETIQUE', W / 2, y, { align: 'center' })
  y += 5.5

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.brand)
  doc.text(`${ficheCode} — ${ficheTitle || ''}`, W / 2, y, { align: 'center' })
  y += 4

  // Séparateur fin centré
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(W / 2 - 35, y, W / 2 + 35, y)
  doc.setLineWidth(0.2)
  y += 5

  // Badge MPR centré
  const badgeInfo = MPR_BADGE[mprCategory]
  if (badgeInfo) {
    const bl = `${mprCategory} — ${badgeInfo.label}`
    // Calculer la largeur sans dessiner
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const bw = doc.getTextWidth(bl) + 10
    drawBadge(doc, bl, W / 2 - bw / 2, y, badgeInfo.bg, badgeInfo.text)
    y += 11
  }

  // Client name
  if (clientName) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text(`Client : ${clientName}`, mx, y)
    y += 5
  }

  // Badge mode Anah
  if (isAnah) {
    const ml = "MaPrimeRenov' Parcours Accompagne"
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const mw = doc.getTextWidth(ml) + 10
    drawBadge(doc, ml, W / 2 - mw / 2, y, C.brand, C.white)
    y += 11
  }

  // ════════════════════════════════════════════════════════════
  //  SAUT DPE
  // ════════════════════════════════════════════════════════════
  if (classInitiale && classCible) {
    const dpeH = 36
    drawCard(doc, mx, y, cw, dpeH)

    doc.setFillColor(...C.brand)
    doc.roundedRect(mx, y, 1.2, dpeH, 0.6, 0.6, 'F')

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('PERFORMANCE ENERGETIQUE', mx + 6, y + 7)

    const jumpLabel = `+${jumps} classe${jumps > 1 ? 's' : ''} DPE`
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const jumpW = doc.getTextWidth(jumpLabel) + 8
    doc.setFillColor(...C.brand)
    doc.roundedRect(W - mx - jumpW - 4, y + 3, jumpW, 7, 3.5, 3.5, 'F')
    doc.setTextColor(...C.white)
    doc.text(jumpLabel, W - mx - jumpW / 2 - 4, y + 7.5, { align: 'center' })

    const trailY = y + 14
    const startIdx = CLASS_ORDER.indexOf(classInitiale)
    const endIdx = CLASS_ORDER.indexOf(classCible)
    const trail = CLASS_ORDER.slice(startIdx, endIdx + 1)
    const activeSize = 14, inactiveSize = 9.5, arrowW = 6
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

    y += dpeH + 5
  }

  // ════════════════════════════════════════════════════════════
  //  TRAVAUX / PARAMETRES — Cards 2 colonnes
  // ════════════════════════════════════════════════════════════
  if (workItems && workItems.length > 0) {
    y = drawSectionTitle(doc, 'TRAVAUX PREVUS', 'Postes de renovation', mx, y, C.brand)

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
        headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 7.5, cellPadding: 3 },
        bodyStyles: { fontSize: 7.5, textColor: C.text, cellPadding: 3, lineColor: C.borderLight, lineWidth: 0.3 },
        columnStyles: {
          0: { cellWidth: cw * 0.46, fontStyle: 'bold' },
          1: { cellWidth: cw * 0.18, halign: 'right' },
          2: { cellWidth: cw * 0.12, halign: 'center', textColor: C.textMuted },
          3: { cellWidth: cw * 0.24, halign: 'right', fontStyle: 'bold', textColor: C.primary },
        },
        alternateRowStyles: { fillColor: C.surface },
      })
      y = doc.lastAutoTable.finalY + 6
    }
  } else {
    // ─── 2 cards côte à côte : Bénéficiaire + Logement ───
    const gap = 5
    const halfW = (cw - gap) / 2

    const benefParams = []
    const logementParams = []
    cleanParams.forEach(p => {
      const lbl = p.label.toLowerCase()
      if (lbl.includes('logement') || lbl.includes('surface') || lbl.includes('zone') || lbl.includes('etas') || lbl.includes('efficac'))
        logementParams.push(p)
      else
        benefParams.push(p)
    })

    const maxRows = Math.max(benefParams.length, logementParams.length)
    const cardH = maxRows * 7 + 18

    // Card Bénéficiaire
    drawCard(doc, mx, y, halfW, cardH)
    doc.setFillColor(59, 130, 246)
    doc.roundedRect(mx, y, 1.2, cardH, 0.6, 0.6, 'F') // accent bleu

    let cy = y + 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Beneficiaire', mx + 5, cy)
    cy += 4
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text('Profil de revenus', mx + 5, cy)
    cy += 5.5

    benefParams.forEach((p, i) => {
      drawParamRow(doc, p.label, p.value, mx + 1.5, cy, halfW - 3, i % 2 === 0)
      cy += 7
    })

    // Card Logement
    const lx = mx + halfW + gap
    drawCard(doc, lx, y, halfW, cardH)
    doc.setFillColor(...C.brand)
    doc.roundedRect(lx, y, 1.2, cardH, 0.6, 0.6, 'F') // accent vert

    cy = y + 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Logement', lx + 5, cy)
    cy += 4
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text('Caracteristiques du bien', lx + 5, cy)
    cy += 5.5

    logementParams.forEach((p, i) => {
      drawParamRow(doc, p.label, p.value, lx + 1.5, cy, halfW - 3, i % 2 === 0)
      cy += 7
    })

    y += cardH + 6
  }

  // ════════════════════════════════════════════════════════════
  //  VOTRE FINANCEMENT
  // ════════════════════════════════════════════════════════════
  if (y + 85 > H) { doc.addPage(); y = 20 }

  y = drawSectionTitle(doc, 'VOTRE FINANCEMENT', 'Repartition des aides', mx, y, C.brandDark)

  // ─── Cards CEE + MPR côte à côte ───
  const hasCee = cee > 0
  const hasMpr = mpr > 0

  if (hasCee || hasMpr) {
    const gap = 5
    const cols = (hasCee && hasMpr) ? 2 : 1
    const cardW = cols === 2 ? (cw - gap) / 2 : cw
    const cardH = 22

    if (hasCee) {
      // Card CEE
      drawCard(doc, mx, y, cardW, cardH, { fill: C.brandBg, borderColor: [200, 240, 180] })
      doc.setFillColor(...C.brand)
      doc.roundedRect(mx, y, 1.2, cardH, 0.6, 0.6, 'F')

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textMuted)
      doc.text('PRIME CEE', mx + 6, y + 7)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.brand)
      doc.text(fmt(cee), mx + 6, y + 16)
    }

    if (hasMpr) {
      const mprX = hasCee ? mx + cardW + gap : mx

      // Card MPR
      drawCard(doc, mprX, y, cardW, cardH, { fill: C.skyBg, borderColor: [186, 230, 253] })
      doc.setFillColor(...C.sky)
      doc.roundedRect(mprX, y, 1.2, cardH, 0.6, 0.6, 'F')

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textMuted)
      doc.text("MAPRIMERENOV'", mprX + 6, y + 7)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.skyDark)
      doc.text(fmt(mpr), mprX + 6, y + 16)
    }

    y += cardH + 5
  }

  // ─── Anah detail ───
  if (isAnah && mpr > 0) {
    const infoCards = [
      { label: 'Sauts DPE', value: `${jumps} classes`, color: C.text },
      { label: 'Taux MPR', value: `${Math.round((mprTaux || 0) * 100)}%`, color: C.brand },
      { label: 'Depense eligible', value: fmt(mprDepenseEligible || 0), color: C.text },
    ]
    const gap = 4
    const infoW = (cw - gap * 2) / 3
    const infoH = 15

    infoCards.forEach((card, i) => {
      const cx = mx + i * (infoW + gap)
      drawCard(doc, cx, y, infoW, infoH)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textMuted)
      doc.text(card.label, cx + 4, y + 5.5)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...card.color)
      doc.text(card.value, cx + 4, y + 11.5)
    })
    y += infoH + 5
  }

  // ─── Bloc SYNTHESE dark ───
  const synthH = 48
  drawShadow(doc, mx, y, cw, synthH, 3)
  doc.setFillColor(...C.primary)
  doc.roundedRect(mx, y, cw, synthH, 3, 3, 'F')

  // Accent vert en haut du bloc
  doc.setFillColor(...C.brandLight)
  doc.roundedRect(mx + 0.5, y, cw - 1, 1.2, 0.6, 0.6, 'F')

  const sl = mx + 12
  const sr = W - mx - 12
  let sy = y + 11

  // Coût projet
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 150, 170)
  doc.text('Cout total du projet', sl, sy)
  doc.setTextColor(200, 210, 225)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(cost), sr, sy, { align: 'right' })

  // Séparateur pointillé
  sy += 5
  doc.setDrawColor(50, 55, 70)
  doc.setLineDashPattern([1.5, 1.5], 0)
  doc.line(sl, sy, sr, sy)
  doc.setLineDashPattern([], 0)
  sy += 8

  // TOTAL DES AIDES
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(140, 150, 170)
  doc.text('TOTAL DES AIDES', sl, sy)
  doc.setTextColor(...C.brandLight)
  doc.setFontSize(18)
  doc.text(fmt(totalAid), sr, sy + 1, { align: 'right' })
  sy += 14

  // RESTE A CHARGE — surligné
  doc.setFillColor(255, 255, 255)
  doc.setGState(new doc.GState({ opacity: 0.06 }))
  doc.roundedRect(sl - 5, sy - 6, cw - 14, 14, 2.5, 2.5, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))

  doc.setFontSize(9.5)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text('RESTE A CHARGE', sl, sy + 2)
  doc.setFontSize(18)
  doc.text(fmt(rac), sr, sy + 2.5, { align: 'right' })

  y += synthH + 4

  // ─── Barre de répartition multi-segments ───
  const barH = 8
  const barSegments = []
  if (hasCee) barSegments.push({ label: 'CEE', value: cee, color: C.brandLight })
  if (hasMpr) barSegments.push({ label: 'MPR', value: mpr, color: C.sky })
  if (rac > 0) barSegments.push({ label: 'RAC', value: rac, color: [180, 190, 210] })

  if (barSegments.length > 0 && cost > 0) {
    let bx = mx
    const totalBarW = cw
    barSegments.forEach((seg, i) => {
      if (seg.value <= 0) return
      const pct = seg.value / cost
      const w = Math.max(3, pct * totalBarW)
      doc.setFillColor(...seg.color)

      // Coins arrondis seulement aux extrémités
      if (barSegments.length === 1) {
        doc.roundedRect(bx, y, w, barH, 2.5, 2.5, 'F')
      } else if (i === 0) {
        // Premier segment : arrondi à gauche
        doc.roundedRect(bx, y, w + 2, barH, 2.5, 2.5, 'F')
        doc.rect(bx + w - 2, y, 4, barH, 'F') // couvre l'arrondi droit
      } else if (i === barSegments.length - 1) {
        // Dernier segment : arrondi à droite
        doc.roundedRect(bx - 2, y, w + 2, barH, 2.5, 2.5, 'F')
        doc.rect(bx - 2, y, 4, barH, 'F') // couvre l'arrondi gauche
      } else {
        doc.rect(bx, y, w, barH, 'F')
      }

      // Label DANS la barre si assez large
      if (w > 18) {
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(`${seg.label} ${Math.round(pct * 100)}%`, bx + w / 2, y + barH * 0.62, { align: 'center' })
      }
      bx += w
    })

    // Légende sous la barre
    y += barH + 4
    let lx = mx
    barSegments.forEach(seg => {
      if (seg.value <= 0) return
      doc.setFillColor(...seg.color)
      doc.roundedRect(lx, y - 1, 3, 3, 0.8, 0.8, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...C.text)
      doc.setFont('helvetica', 'bold')
      const t = `${seg.label} : ${fmt(seg.value)}`
      doc.text(t, lx + 5, y + 1)
      lx += 5 + doc.getTextWidth(t) + 8
    })
    y += 7
  }

  // ════════════════════════════════════════════════════════════
  //  DETAILS TECHNIQUES
  // ════════════════════════════════════════════════════════════
  if (cleanResults.length > 0) {
    if (y + 30 > H) { doc.addPage(); y = 20 }
    y += 3
    y = drawSectionTitle(doc, 'DETAILS TECHNIQUES', 'Donnees de calcul', mx, y, C.textMuted)

    const detailH = cleanResults.length * 7 + 6
    drawCard(doc, mx, y, cw, detailH)
    let dy = y + 5
    cleanResults.forEach((r, i) => {
      drawParamRow(doc, r.label, r.value, mx + 2, dy, cw - 4, i % 2 === 0)
      dy += 7
    })
    y += detailH + 5
  }

  // ════════════════════════════════════════════════════════════
  //  MARGE CEE (interne)
  // ════════════════════════════════════════════════════════════
  if (margin && margin.showOnPdf) {
    drawCard(doc, mx, y, cw, 16, { fill: C.skyBg, borderColor: [186, 230, 253] })
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

  // ════════════════════════════════════════════════════════════
  //  VOS AVANTAGES — Coches vertes uniformes
  // ════════════════════════════════════════════════════════════
  if (y + 40 > H) { doc.addPage(); y = 20 }
  y += 2
  y = drawSectionTitle(doc, 'VOS AVANTAGES', null, mx, y, C.brand)

  const advantages = isAnah ? [
    "MaPrimeRenov' : jusqu'a 80% de prise en charge selon vos revenus",
    "Economies d'energie : reduisez vos factures de chauffage durablement",
    'Confort thermique ameliore ete comme hiver',
    'Valorisation de votre bien immobilier grace a un meilleur DPE',
  ] : [
    "Economies d'energie : reduisez vos factures de chauffage durablement",
    'Confort thermique ameliore ete comme hiver',
    'Valorisation de votre bien immobilier grace a un meilleur DPE',
    "Prime CEE deduite directement — pas d'avance de tresorerie",
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
  //  FOOTER
  // ════════════════════════════════════════════════════════════
  const footerY = H - 12

  // Ligne de séparation
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(mx, footerY - 3, W - mx, footerY - 3)
  doc.setLineWidth(0.2)

  // Disclaimer
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`Simulation indicative — fiche ${ficheCode}. Montants sous reserve d'eligibilite. Non contractuel.`, W / 2, footerY + 0.5, { align: 'center' })
  doc.text(`${company.name || 'Artex360'} — Document genere le ${dateStr}`, W / 2, footerY + 4, { align: 'center' })

  // Accent vert bottom
  doc.setFillColor(...C.brandLight)
  doc.rect(0, H - 2, W, 2, 'F')

  const safeName = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) + '_' : ''
  doc.save(`simulation_${safeName}${ficheCode}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
