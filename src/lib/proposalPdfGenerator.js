import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Palette ───
const C = {
  primary:      [30, 27, 75],
  primaryLight: [99, 102, 241],
  green:        [22, 101, 52],
  greenLight:   [34, 197, 94],
  emerald:      [16, 185, 129],
  blue:         [37, 99, 235],
  blueLight:    [59, 130, 246],
  orange:       [234, 88, 12],
  orangeLight:  [251, 146, 60],
  text:         [30, 41, 59],
  textLight:    [100, 116, 139],
  border:       [226, 232, 240],
  bgLight:      [248, 250, 252],
  yellow:       [234, 179, 8],
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
    .replace(/\u2264/g, '<=')
    .replace(/[\u00e9\u00e8\u00ea\u00eb]/g, 'e')
    .replace(/\u00e0/g, 'a')
    .replace(/\u00f4/g, 'o')
    .replace(/\u00e7/g, 'c')
    .replace(/[\u00ee\u00ef]/g, 'i')
    .replace(/[\u00fb\u00fc]/g, 'u')
}

// ─── Dessiner un badge DPE ───
function drawDpeBadge(doc, letter, x, y, size, active = false) {
  const colors = DPE_COLORS[letter] || { bg: [156, 163, 175], text: [255, 255, 255] }
  const r = size * 0.22

  if (active) {
    doc.setFillColor(0, 0, 0)
    doc.setGState(new doc.GState({ opacity: 0.08 }))
    doc.roundedRect(x + 0.4, y + 0.4, size, size, r, r, 'F')
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
  const w = 2.5
  const half = h / 2
  doc.setDrawColor(...color)
  doc.setLineWidth(0.5)
  doc.line(x, y, x + w, y + half)
  doc.line(x + w, y + half, x, y + h)
  doc.setLineWidth(0.2)
}

// ─── Dessiner le chemin DPE ───
function drawDpeTrail(doc, from, to, cx, y) {
  const startIdx = CLASS_ORDER.indexOf(from)
  const endIdx = CLASS_ORDER.indexOf(to)
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return

  const activeS = 11
  const smallS = 7
  const arrowW = 5
  const trail = CLASS_ORDER.slice(startIdx, endIdx + 1)

  // Largeur totale
  let totalW = activeS + arrowW
  for (let i = 1; i < trail.length - 1; i++) totalW += smallS + 1.5
  if (trail.length > 2) totalW += arrowW
  totalW += activeS

  let x = cx - totalW / 2

  drawDpeBadge(doc, from, x, y, activeS, true)
  x += activeS + 1
  drawChevron(doc, x + 0.5, y + activeS * 0.2, activeS * 0.6, C.textLight)
  x += arrowW

  for (let i = 1; i < trail.length - 1; i++) {
    drawDpeBadge(doc, trail[i], x, y + (activeS - smallS) / 2, smallS)
    x += smallS + 1.5
  }

  if (trail.length > 2) {
    drawChevron(doc, x + 0.5, y + activeS * 0.2, activeS * 0.6, C.textLight)
    x += arrowW
  }

  drawDpeBadge(doc, to, x, y, activeS, true)
}

// ─── Barre de repartition ───
function drawBar(doc, x, y, w, totalCost, cee, mpr, rac) {
  if (totalCost <= 0) return y
  const h = 7

  let bx = x
  // CEE
  if (cee > 0) {
    const pct = cee / totalCost
    const bw = Math.max(5, w * pct)
    doc.setFillColor(...C.emerald)
    doc.roundedRect(bx, y, bw, h, 1.5, 1.5, 'F')
    if (bw > 14) {
      doc.setFontSize(5)
      doc.setTextColor(...C.white)
      doc.setFont('helvetica', 'bold')
      doc.text(`CEE ${Math.round(pct * 100)}%`, bx + bw / 2, y + h * 0.6, { align: 'center' })
    }
    bx += bw
  }

  // MPR
  if (mpr > 0) {
    const pct = mpr / totalCost
    const bw = Math.max(5, w * pct)
    doc.setFillColor(...C.blueLight)
    doc.rect(bx, y, bw, h, 'F')
    if (bw > 14) {
      doc.setFontSize(5)
      doc.setTextColor(...C.white)
      doc.setFont('helvetica', 'bold')
      doc.text(`MPR ${Math.round(pct * 100)}%`, bx + bw / 2, y + h * 0.6, { align: 'center' })
    }
    bx += bw
  }

  // RAC
  if (rac > 0) {
    const racW = x + w - bx
    doc.setFillColor(...C.primaryLight)
    doc.roundedRect(bx, y, Math.max(5, racW), h, 1.5, 1.5, 'F')
    if (racW > 14) {
      doc.setFontSize(5)
      doc.setTextColor(...C.white)
      doc.setFont('helvetica', 'bold')
      doc.text(`RAC ${Math.round((rac / totalCost) * 100)}%`, bx + racW / 2, y + h * 0.6, { align: 'center' })
    }
  }

  // Legende
  y += h + 4
  doc.setFontSize(6.5)
  let lx = x

  if (cee > 0) {
    doc.setFillColor(...C.emerald)
    doc.roundedRect(lx, y - 2, 3, 3, 0.8, 0.8, 'F')
    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'bold')
    doc.text(`CEE : ${fmt(cee)}`, lx + 5, y)
    lx += 46
  }
  if (mpr > 0) {
    doc.setFillColor(...C.blueLight)
    doc.roundedRect(lx, y - 2, 3, 3, 0.8, 0.8, 'F')
    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'bold')
    doc.text(`MPR : ${fmt(mpr)}`, lx + 5, y)
    lx += 46
  }
  doc.setFillColor(...C.primaryLight)
  doc.roundedRect(lx, y - 2, 3, 3, 0.8, 0.8, 'F')
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.text(`Reste : ${fmt(rac)}`, lx + 5, y)
  doc.setFont('helvetica', 'normal')

  return y + 6
}

// ─── Footer ───
function drawFooter(doc, W, mx, cw, dateStr) {
  const H = doc.internal.pageSize.getHeight()
  const fy = H - 12
  doc.setDrawColor(...C.border)
  doc.line(mx, fy - 4, W - mx, fy - 4)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(
    "Simulation indicative. Montants sous reserve d'eligibilite. Non contractuel.",
    W / 2, fy, { align: 'center', maxWidth: cw }
  )
  doc.text(
    `Document genere le ${dateStr} via Artex360 — Plateforme d'outils pour artisans en renovation energetique.`,
    W / 2, fy + 4, { align: 'center', maxWidth: cw }
  )
}

/**
 * Genere un PDF de proposition commerciale
 */
export function generateProposalPDF({
  company = {},
  project = {},
  scenario = {},
  totals = {},
  validityDays = 30,
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const mx = 15
  const cw = W - mx * 2
  const synthRight = W - mx - 10
  const synthLeft = mx + 10
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const validUntil = new Date(Date.now() + validityDays * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  let y = 0

  // ════════════════════════════════════════════
  //  PAGE 1 — EN-TETE
  // ════════════════════════════════════════════
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, 38, 'F')
  doc.setFillColor(...C.emerald)
  doc.rect(0, 38, W, 1.2, 'F')

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
  //  TITRE PROPOSITION
  // ════════════════════════════════════════════
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('PROPOSITION COMMERCIALE', W / 2, y, { align: 'center' })

  y += 5
  const accentLine = C.emerald
  doc.setDrawColor(...accentLine)
  doc.setLineWidth(0.8)
  doc.line(W / 2 - 30, y, W / 2 + 30, y)
  doc.setLineWidth(0.2)

  y += 7

  // ════════════════════════════════════════════
  //  BENEFICIAIRE + REFERENCE
  // ════════════════════════════════════════════
  const clientName = `${project.firstName || ''} ${project.lastName || ''}`.trim() || 'Client'
  const clientAddress = [project.address, project.postalCode, project.city].filter(Boolean).join(', ')

  // Bloc client (gauche)
  const leftW = cw * 0.54
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(mx, y, leftW, 30, 3, 3, 'F')
  doc.setDrawColor(...C.border)
  doc.roundedRect(mx, y, leftW, 30, 3, 3, 'S')

  doc.setFontSize(7)
  doc.setTextColor(...C.emerald)
  doc.setFont('helvetica', 'bold')
  doc.text('BENEFICIAIRE', mx + 5, y + 6)

  doc.setFontSize(11)
  doc.setTextColor(...C.text)
  doc.text(clientName, mx + 5, y + 13)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  if (clientAddress) doc.text(clientAddress, mx + 5, y + 18, { maxWidth: leftW - 10 })
  if (project.phone) doc.text(`Tel : ${project.phone}`, mx + 5, y + 23)
  if (project.email) doc.text(project.email, mx + 5, y + 27)

  // Bloc ref (droite)
  const rightX = mx + leftW + cw * 0.02
  const rightW = cw - leftW - cw * 0.02
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(rightX, y, rightW, 30, 3, 3, 'F')
  doc.setDrawColor(...C.border)
  doc.roundedRect(rightX, y, rightW, 30, 3, 3, 'S')

  doc.setFontSize(7)
  doc.setTextColor(...C.emerald)
  doc.setFont('helvetica', 'bold')
  doc.text('REFERENCE', rightX + 5, y + 6)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.text)
  doc.text(`Date : ${dateStr}`, rightX + 5, y + 13)
  doc.text(`Scenario : ${sanitize(scenario.name || 'Principal')}`, rightX + 5, y + 18)
  doc.text(`Validite : ${validUntil}`, rightX + 5, y + 23)

  const infoParts = []
  if (project.category) infoParts.push(project.category)
  if (project.typeLogement) infoParts.push(project.typeLogement === 'maison' ? 'Maison' : 'Appartement')
  if (project.surface) infoParts.push(`${project.surface} m2`)
  if (infoParts.length > 0) {
    doc.setFontSize(7)
    doc.setTextColor(...C.primaryLight)
    doc.setFont('helvetica', 'bold')
    doc.text(infoParts.join(' | '), rightX + 5, y + 28)
  }

  y += 37

  // ════════════════════════════════════════════
  //  SAUT DPE (si renovation globale)
  // ════════════════════════════════════════════
  const sims = scenario.simulations || []
  const renoSim = sims.find(s => {
    const inp = s.inputs || {}
    return inp.classInitiale && inp.classCible
  })

  if (renoSim) {
    const inp = renoSim.inputs
    const startIdx = CLASS_ORDER.indexOf(inp.classInitiale)
    const endIdx = CLASS_ORDER.indexOf(inp.classCible)
    const jumps = endIdx - startIdx

    doc.setFillColor(245, 247, 250)
    doc.roundedRect(mx, y, cw, 28, 3, 3, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(mx, y, cw, 28, 3, 3, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('PERFORMANCE ENERGETIQUE', mx + 6, y + 6)

    // Badge jumps
    if (jumps > 0) {
      const jumpLabel = `+${jumps} classe${jumps > 1 ? 's' : ''}`
      doc.setFillColor(...C.emerald)
      const jw = doc.getTextWidth(jumpLabel) + 7
      doc.roundedRect(W - mx - jw - 4, y + 2, jw, 7, 2.5, 2.5, 'F')
      doc.setFontSize(6)
      doc.setTextColor(...C.white)
      doc.text(jumpLabel, W - mx - jw / 2 - 4, y + 6.8, { align: 'center' })
    }

    drawDpeTrail(doc, inp.classInitiale, inp.classCible, W / 2, y + 12)
    y += 32
  }

  // ════════════════════════════════════════════
  //  TABLEAU DES POSTES
  // ════════════════════════════════════════════
  y += 1
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('POSTES DE TRAVAUX', mx, y)

  const simCount = sims.length
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)
  doc.text(`${simCount} poste${simCount > 1 ? 's' : ''}`, mx + doc.getTextWidth('POSTES DE TRAVAUX  '), y)
  y += 3

  const tableBody = sims.map((sim) => {
    const r = sim.results || {}
    const inp = sim.inputs || {}
    const cee = r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
    const mpr = r.mprFinal || r.mprAmount || r.primeAmount || 0
    const cost = r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
    const aide = cee + mpr
    const rac = Math.max(0, cost - aide)
    return [
      sanitize(sim.title || sim.type || 'Travaux'),
      cost > 0 ? fmt(cost) : '-',
      cee > 0 ? fmt(cee) : '-',
      mpr > 0 ? fmt(mpr) : '-',
      aide > 0 ? fmt(aide) : '-',
      cost > 0 ? fmt(rac) : '-',
    ]
  })

  autoTable(doc, {
    startY: y,
    margin: { left: mx, right: mx },
    head: [['Poste de travaux', 'Cout TTC', 'Prime CEE', 'MPR', 'Total Aides', 'Reste a charge']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: C.primary,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 3,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: C.text,
      cellPadding: 3,
      lineColor: [230, 235, 245],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: cw * 0.28, fontStyle: 'bold' },
      1: { cellWidth: cw * 0.14, halign: 'right' },
      2: { cellWidth: cw * 0.14, halign: 'right', textColor: C.green },
      3: { cellWidth: cw * 0.14, halign: 'right', textColor: C.blue },
      4: { cellWidth: cw * 0.15, halign: 'right', fontStyle: 'bold', textColor: C.primary },
      5: { cellWidth: cw * 0.15, halign: 'right', textColor: C.orange },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  y = doc.lastAutoTable.finalY + 1

  // Ligne TOTAUX
  autoTable(doc, {
    startY: y,
    margin: { left: mx, right: mx },
    body: [[
      'TOTAL',
      fmt(totals.totalCost),
      fmt(totals.totalCee),
      fmt(totals.totalMpr),
      fmt(totals.totalAides),
      fmt(totals.resteACharge),
    ]],
    theme: 'grid',
    bodyStyles: {
      fontSize: 8,
      textColor: C.text,
      cellPadding: 2.5,
      fontStyle: 'bold',
      fillColor: [238, 242, 255],
    },
    columnStyles: {
      0: { cellWidth: cw * 0.28 },
      1: { cellWidth: cw * 0.14, halign: 'right' },
      2: { cellWidth: cw * 0.14, halign: 'right', textColor: C.green },
      3: { cellWidth: cw * 0.14, halign: 'right', textColor: C.blue },
      4: { cellWidth: cw * 0.15, halign: 'right' },
      5: { cellWidth: cw * 0.15, halign: 'right', textColor: C.orange },
    },
  })

  y = doc.lastAutoTable.finalY + 6

  // ════════════════════════════════════════════
  //  SYNTHESE FINANCIERE
  // ════════════════════════════════════════════
  const ceeTotal = totals.totalCee || 0
  const mprTotal = totals.totalMpr || 0
  const totalAides = totals.totalAides || 0
  const rac = totals.resteACharge || 0
  const costTotal = totals.totalCost || 0

  // Detecter si le scenario est principalement ANAH
  const isMainlyAnah = mprTotal > 0 && mprTotal >= ceeTotal
  const synthDarkBg = isMainlyAnah ? [5, 46, 22] : C.primary
  const synthAccent = isMainlyAnah ? C.greenLight : C.yellow
  const synthMuted = isMainlyAnah ? [150, 200, 170] : [180, 190, 220]
  const synthSep = isMainlyAnah ? [40, 90, 50] : [80, 70, 140]

  // Bandeau info MPR si ANAH
  if (isMainlyAnah && renoSim) {
    const rinp = renoSim.inputs || {}
    const rres = renoSim.results || {}
    const taux = rres.taux || 0
    const depElig = rres.depenseEligible || 0
    const plafond = rres.plafondHT || 0
    const cat = rinp.mprCategory || project.category || ''

    // Bloc fond vert clair avec 3 cartes blanches (meme style que l'UI web)
    const cardH = 14
    const cardGap = 3
    const cardW = (cw - cardGap * 2 - 8) / 3
    const infoH = cardH + 12

    doc.setFillColor(236, 253, 245)
    doc.roundedRect(mx, y, cw, infoH, 3, 3, 'F')
    doc.setDrawColor(187, 247, 208)
    doc.roundedRect(mx, y, cw, infoH, 3, 3, 'S')

    const cardY = y + 4
    const cardBaseX = mx + 4

    // Carte 1 — Sauts DPE
    const startIdx2 = CLASS_ORDER.indexOf(rinp.classInitiale)
    const endIdx2 = CLASS_ORDER.indexOf(rinp.classCible)
    const jumps2 = Math.max(0, endIdx2 - startIdx2)

    doc.setFillColor(...C.white)
    doc.roundedRect(cardBaseX, cardY, cardW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(cardBaseX, cardY, cardW, cardH, 2, 2, 'S')
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text('Sauts DPE :', cardBaseX + 3, cardY + 5)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textLight)
    doc.text(`${jumps2} classes`, cardBaseX + 3, cardY + 10)

    // Carte 2 — Taux MPR
    const card2X = cardBaseX + cardW + cardGap
    doc.setFillColor(...C.white)
    doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'S')
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text('Taux MPR :', card2X + 3, cardY + 5)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.green)
    doc.text(`${Math.round(taux * 100)}%`, card2X + 3, cardY + 10)

    // Carte 3 — Depense eligible
    const card3X = card2X + cardW + cardGap
    doc.setFillColor(...C.white)
    doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'S')
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text('Depense eligible :', card3X + 3, cardY + 5)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textLight)
    doc.text(fmt(depElig), card3X + 3, cardY + 10)

    y += infoH + 4
  }

  if (y + 80 > H) { doc.addPage(); y = 20 }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('VOTRE FINANCEMENT', mx, y)
  y += 4

  if (isMainlyAnah) {
    // ── Mode ANAH — bloc centre comme l'UI web ──
    const synthH = 64
    doc.setFillColor(22, 101, 52) // green-800
    doc.roundedRect(mx, y, cw, synthH, 4, 4, 'F')

    const centerX = W / 2

    // Titre centre
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(187, 247, 208)
    doc.text("MAPRIMERENOV' PARCOURS ACCOMPAGNE", centerX, y + 10, { align: 'center' })

    // Montant MPR
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.greenLight)
    doc.text(fmt(mprTotal), centerX, y + 20, { align: 'center' })

    // Detail calcul
    if (renoSim) {
      const rr = renoSim.results || {}
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(134, 239, 172)
      doc.text(`${Math.round((rr.taux || 0) * 100)}% x ${fmt(rr.depenseEligible || 0)} HT`, centerX, y + 25, { align: 'center' })
    }

    // Separateur
    doc.setDrawColor(21, 128, 61)
    doc.line(mx + 12, y + 30, W - mx - 12, y + 30)

    // TOTAL AIDES
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text('TOTAL AIDES :', synthLeft, y + 40)
    doc.setFontSize(14)
    doc.setTextColor(...C.yellow)
    doc.text(fmt(totalAides), synthRight, y + 40, { align: 'right' })

    // RESTE A CHARGE
    doc.setFontSize(9)
    doc.setTextColor(187, 247, 208)
    doc.setFont('helvetica', 'bold')
    doc.text('RESTE A CHARGE :', synthLeft, y + 52)
    doc.setFontSize(13)
    doc.setTextColor(...C.white)
    doc.text(fmt(rac), synthRight, y + 52, { align: 'right' })

    y += synthH + 6
  } else {
    // ── Mode CEE — layout lignes ──
    let synthLines = 1
    if (ceeTotal > 0) synthLines++
    if (mprTotal > 0) synthLines++
    if (scenario.ptz && totals.ptzMontant > 0) synthLines++
    const synthH = 14 + (synthLines * 8) + 28

    doc.setFillColor(...C.primary)
    doc.roundedRect(mx, y, cw, synthH, 4, 4, 'F')

    let sy = y + 10

    // Cout total
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 190, 220)
    doc.text('Cout total des travaux', synthLeft, sy)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(fmt(costTotal), synthRight, sy, { align: 'right' })
    sy += 8

    // CEE
    if (ceeTotal > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 220)
      doc.text('Prime CEE deduite', synthLeft, sy)
      doc.setTextColor(...C.yellow)
      doc.setFont('helvetica', 'bold')
      doc.text(`- ${fmt(ceeTotal)}`, synthRight, sy, { align: 'right' })
      sy += 8
    }

    // MPR
    if (mprTotal > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 220)
      doc.text("MaPrimeRenov'", synthLeft, sy)
      doc.setTextColor(...C.greenLight)
      doc.setFont('helvetica', 'bold')
      doc.text(`- ${fmt(mprTotal)}`, synthRight, sy, { align: 'right' })
      sy += 8
    }

    // PTZ
    if (scenario.ptz && totals.ptzMontant > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 220)
      doc.text(`Pret a Taux Zero (${scenario.ptz.dureeTotale || 0} ans)`, synthLeft, sy)
      doc.setTextColor(...C.primaryLight)
      doc.setFont('helvetica', 'bold')
      doc.text(fmt(totals.ptzMontant), synthRight, sy, { align: 'right' })
      sy += 8
    }

    // Separateur
    doc.setDrawColor(80, 70, 140)
    doc.line(synthLeft, sy, synthRight, sy)
    sy += 7

    // Total Aides
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 190, 220)
    doc.text('TOTAL DES AIDES', synthLeft, sy)
    doc.setTextColor(...C.yellow)
    doc.setFontSize(13)
    doc.text(fmt(totalAides), synthRight, sy, { align: 'right' })
    sy += 10

    // Reste a charge
    doc.setFillColor(255, 255, 255)
    doc.setGState(new doc.GState({ opacity: 0.08 }))
    doc.roundedRect(synthLeft - 4, sy - 5, cw - 12, 14, 3, 3, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))

    doc.setFontSize(10)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text('RESTE A CHARGE', synthLeft, sy + 3)
    doc.setFontSize(16)
    doc.text(fmt(rac), synthRight, sy + 4, { align: 'right' })

    y += synthH + 6
  }

  // Barre de repartition
  y = drawBar(doc, mx, y, cw, costTotal, ceeTotal, mprTotal, rac)
  y += 2

  // ════════════════════════════════════════════
  //  PTZ DETAIL
  // ════════════════════════════════════════════
  if (scenario.ptz && totals.ptzMontant > 0) {
    doc.setFillColor(238, 242, 255)
    doc.roundedRect(mx, y, cw, 16, 2, 2, 'F')
    doc.setDrawColor(...C.primaryLight)
    doc.roundedRect(mx, y, cw, 16, 2, 2, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primaryLight)
    doc.text('Pret a Taux Zero (PTZ)', mx + 5, y + 6)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.text)
    doc.text(
      `Montant : ${fmt(totals.ptzMontant)}  |  Mensualite : ${fmt(scenario.ptz.mensualite || 0)}/mois  |  Differe : ${scenario.ptz.dureeDiffere || 0} ans  |  Duree : ${scenario.ptz.dureeTotale || 0} ans`,
      mx + 5, y + 12
    )
    y += 20
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

  const advAccent = isMainlyAnah ? C.greenLight : C.emerald
  const advantages = isMainlyAnah ? [
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
    doc.setFillColor(...advAccent)
    doc.circle(mx + 4, y + 0.5, 2.5, 'F')
    doc.setFontSize(5.5)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.text(adv.icon, mx + 4, y + 1.3, { align: 'center' })

    doc.setFontSize(7)
    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'normal')
    doc.text(adv.text, mx + 10, y + 1.2, { maxWidth: cw - 12 })
    y += 7
  })

  // ════════════════════════════════════════════
  //  PAGE 2 — DETAIL DES POSTES
  // ════════════════════════════════════════════
  if (sims.length > 0) {
    doc.addPage()
    y = 20

    // Mini header page 2
    doc.setFillColor(...C.primary)
    doc.rect(0, 0, W, 12, 'F')
    doc.setFillColor(...(isMainlyAnah ? C.greenLight : C.emerald))
    doc.rect(0, 12, W, 1, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DETAIL DES POSTES DE TRAVAUX', mx, 8)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(clientName, W - mx, 8, { align: 'right' })

    y = 20

    sims.forEach((sim, idx) => {
      const r = sim.results || {}
      const inp = sim.inputs || {}

      if (y > H - 55) { doc.addPage(); y = 20 }

      // Bandeau titre du poste
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(mx, y, cw, 10, 2, 2, 'F')
      doc.setDrawColor(...(isMainlyAnah ? C.greenLight : C.emerald))
      doc.roundedRect(mx, y, cw, 10, 2, 2, 'S')

      // Numero
      doc.setFillColor(...(isMainlyAnah ? C.greenLight : C.emerald))
      doc.circle(mx + 6, y + 5, 3.5, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...C.white)
      doc.setFont('helvetica', 'bold')
      doc.text(`${idx + 1}`, mx + 6, y + 6, { align: 'center' })

      // Code fiche
      doc.setFontSize(7)
      doc.setTextColor(...C.primaryLight)
      doc.text(sim.type || '', mx + 12, y + 5)

      // Titre
      doc.setTextColor(...C.text)
      doc.setFontSize(8)
      const typeW = doc.getTextWidth((sim.type || '') + '  ')
      doc.text(sanitize(sim.title || 'Travaux'), mx + 12 + typeW, y + 5)

      y += 14

      // DPE mini trail si applicable
      if (inp.classInitiale && inp.classCible) {
        drawDpeTrail(doc, inp.classInitiale, inp.classCible, mx + 50, y)
        y += 16
      }

      // Details
      const details = []
      if (inp.surface) details.push(['Surface', `${inp.surface} m2`])
      if (inp.zone) details.push(['Zone climatique', inp.zone])
      if (inp.mprCategory) details.push(['Profil revenus', inp.mprCategory])
      if (inp.classInitiale && inp.classCible) details.push(['Saut energetique', `DPE ${inp.classInitiale} -> ${inp.classCible}`])

      const cee = r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
      const mpr = r.mprFinal || r.mprAmount || r.primeAmount || 0
      const cost = r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
      const aide = cee + mpr
      const simRac = Math.max(0, cost - aide)

      details.push(['Cout TTC', fmt(cost)])
      if (cee > 0) details.push(['Prime CEE', fmt(cee)])
      if (mpr > 0) details.push(["MaPrimeRenov'", fmt(mpr)])
      details.push(['Reste a charge', fmt(simRac)])

      autoTable(doc, {
        startY: y,
        margin: { left: mx + 4, right: mx + 4 },
        body: details,
        theme: 'plain',
        bodyStyles: {
          fontSize: 7.5,
          textColor: C.text,
          cellPadding: 1.5,
        },
        columnStyles: {
          0: { cellWidth: (cw - 8) * 0.45, textColor: C.textLight },
          1: { cellWidth: (cw - 8) * 0.55, halign: 'right', fontStyle: 'bold' },
        },
      })

      y = doc.lastAutoTable.finalY + 8
    })
  }

  // ════════════════════════════════════════════
  //  CONDITIONS + SIGNATURES
  // ════════════════════════════════════════════
  if (y > H - 65) { doc.addPage(); y = 20 }

  doc.setDrawColor(...C.border)
  doc.line(mx, y, W - mx, y)
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('CONDITIONS', mx, y)
  y += 4

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textLight)

  const conditions = [
    `Cette proposition est valable jusqu'au ${validUntil} (${validityDays} jours).`,
    "Les montants des primes CEE et MaPrimeRenov' sont indicatifs et sous reserve d'eligibilite.",
    "Le reste a charge est calcule avant deduction d'eventuels autres financements (eco-pret, aides locales).",
    "Les travaux doivent etre realises par un professionnel RGE pour beneficier des aides.",
  ]

  conditions.forEach(c => {
    doc.text(`  -  ${c}`, mx, y, { maxWidth: cw })
    y += 4.5
  })

  y += 6

  // Signatures
  if (y + 30 < H - 15) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)

    // Artisan
    doc.text("L'artisan :", mx, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.textLight)
    doc.text(company.name || '', mx, y + 5)
    doc.text('Date et signature :', mx, y + 14)
    doc.setDrawColor(...C.border)
    doc.line(mx, y + 22, mx + 65, y + 22)

    // Client
    const sigX = W / 2 + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C.text)
    doc.text('Le client :', sigX, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.textLight)
    doc.text(clientName, sigX, y + 5)
    doc.text('Bon pour accord, date et signature :', sigX, y + 14)
    doc.line(sigX, y + 22, sigX + 65, y + 22)
  }

  // Footer sur chaque page
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawFooter(doc, W, mx, cw, dateStr)
    // Numero de page
    doc.setFontSize(6)
    doc.setTextColor(...C.textLight)
    doc.text(`${i} / ${pageCount}`, W - mx, H - 5, { align: 'right' })
  }

  // ── Enregistrer ──
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
  const fileName = `proposition_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}
