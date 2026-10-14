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
  amber:        [245, 158, 11],
  red:          [239, 68, 68],
  text:         [30, 41, 59],
  textMuted:    [100, 116, 139],
  textLight:    [148, 163, 184],
  border:       [226, 232, 240],
  borderLight:  [241, 245, 249],
  surface:      [248, 250, 252],
  white:        [255, 255, 255],
}

// ─── Couleurs DPE A-G ───
const DPE_COLORS = {
  A: { bg: [0, 128, 0],     label: 'A', text: [255, 255, 255] },
  B: { bg: [50, 180, 50],   label: 'B', text: [255, 255, 255] },
  C: { bg: [140, 198, 63],  label: 'C', text: [255, 255, 255] },
  D: { bg: [255, 215, 0],   label: 'D', text: [30, 41, 59] },
  E: { bg: [255, 165, 0],   label: 'E', text: [255, 255, 255] },
  F: { bg: [255, 99, 71],   label: 'F', text: [255, 255, 255] },
  G: { bg: [220, 38, 38],   label: 'G', text: [255, 255, 255] },
}

const GES_COLORS = {
  A: { bg: [230, 230, 250], label: 'A', text: [30, 41, 59] },
  B: { bg: [200, 190, 240], label: 'B', text: [30, 41, 59] },
  C: { bg: [170, 150, 220], label: 'C', text: [255, 255, 255] },
  D: { bg: [140, 110, 200], label: 'D', text: [255, 255, 255] },
  E: { bg: [120, 80, 180],  label: 'E', text: [255, 255, 255] },
  F: { bg: [100, 50, 150],  label: 'F', text: [255, 255, 255] },
  G: { bg: [80, 20, 120],   label: 'G', text: [255, 255, 255] },
}

// Couleurs pour qualite d'isolation
const ISOLATION_COLORS = {
  'tres bonne':   { bg: C.brand,  text: C.white },
  'bonne':        { bg: [140, 198, 63], text: C.white },
  'moyenne':      { bg: [255, 165, 0],  text: C.white },
  'insuffisante': { bg: [239, 68, 68],  text: C.white },
}

const fmt = (v) => v != null ? Number(v).toLocaleString('fr-FR') : '—'
const fmtEur = (v) => v != null ? `${Number(v).toLocaleString('fr-FR')} €` : '—'

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
  doc.text(String(value ?? '—'), x + w - 4, y, { align: 'right' })
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
    'Document a titre indicatif — Les montants de primes et aides sont estimatifs et soumis a conditions. Non contractuel.',
    W / 2, footerY + 0.5, { align: 'center', maxWidth: W - mx * 2 }
  )
  doc.text(`Artex360 — Document genere le ${dateStr}`, W / 2, footerY + 4, { align: 'center' })
  doc.text(`${pageNum} / ${totalPages}`, W - mx, footerY + 4, { align: 'right' })

  doc.setFillColor(...C.brandLight)
  doc.rect(0, H - 2, W, 2, 'F')
}

/**
 * Dessine un badge DPE (A-G) sous forme de fleche.
 * @returns {number} largeur du badge
 */
function drawDpeBadge(doc, letter, x, y, size = 'normal') {
  const colors = DPE_COLORS[letter?.toUpperCase()] || DPE_COLORS.G
  const w = size === 'large' ? 28 : 20
  const h = size === 'large' ? 14 : 10
  const fontSize = size === 'large' ? 14 : 10

  doc.setFillColor(...colors.bg)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')

  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.text)
  doc.text(colors.label, x + w / 2, y + h / 2 + fontSize * 0.12, { align: 'center', baseline: 'middle' })
  return w
}

/**
 * Dessine un badge GES (A-G).
 */
function drawGesBadge(doc, letter, x, y, size = 'normal') {
  const colors = GES_COLORS[letter?.toUpperCase()] || GES_COLORS.G
  const w = size === 'large' ? 28 : 20
  const h = size === 'large' ? 14 : 10
  const fontSize = size === 'large' ? 14 : 10

  doc.setFillColor(...colors.bg)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')

  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.text)
  doc.text(colors.label, x + w / 2, y + h / 2 + fontSize * 0.12, { align: 'center', baseline: 'middle' })
  return w
}

/**
 * Dessine un badge de qualite d'isolation.
 */
function drawIsolationBadge(doc, quality, x, y) {
  const key = (quality || '').toLowerCase().replace(/[éè]/g, 'e')
  const colors = ISOLATION_COLORS[key] || { bg: C.textMuted, text: C.white }
  const label = quality || '—'
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  const tw = doc.getTextWidth(label) + 8
  doc.setFillColor(...colors.bg)
  doc.roundedRect(x, y, tw, 6, 3, 3, 'F')
  doc.setTextColor(...colors.text)
  doc.text(label, x + tw / 2, y + 4, { align: 'center' })
  return tw
}

/**
 * Verifie s'il faut sauter de page, si oui en ajoute une.
 */
function ensureSpace(doc, y, needed, H) {
  if (y + needed > H - 20) {
    doc.addPage()
    return 20
  }
  return y
}

// ══════════════════════════════════════════════════════════════
//  GENERATEUR PRINCIPAL
// ══════════════════════════════════════════════════════════════

/**
 * Genere et telecharge le rapport de renovation globale en PDF (A4).
 * Design Artex v3 — coherent avec les autres PDFs de la plateforme.
 */
export function generateRenoGlobalePdf(data = {}) {
  const d = data
  const client = d.client || {}
  const logement = d.logement || {}
  const chauffage = d.chauffage || {}
  const isolation = d.isolation || {}
  const travaux = d.travaux || []
  const financement = d.financement || {}
  const objectif = d.objectif || {}
  const conseiller = d.conseiller || {}

  const doc = new jsPDF('p', 'mm', 'a4')
  const W = 210
  const H = 297
  const mx = 16
  const cw = W - mx * 2
  const gap = 5
  const halfW = (cw - gap) / 2
  const dateStr = d.date
    ? new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  let y = 0

  // ══════════════════════════════════════════════════════════
  //  PAGE 1
  // ══════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────
  //  HEADER — Bandeau dark elegant + accent vert
  // ──────────────────────────────────────────────────────────
  doc.setFillColor(...C.brandLight)
  doc.rect(0, 0, W, 1.8, 'F')

  doc.setFillColor(...C.primary)
  doc.rect(0, 1.8, W, 30, 'F')

  doc.setFillColor(...C.brand)
  doc.rect(0, 31.8, W, 0.6, 'F')

  // Titre
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandLight)
  doc.text('RAPPORT DE RENOVATION GLOBALE', mx, 13)

  // Sous-titre
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 150, 170)
  doc.text('Analyse energetique & programme de travaux recommandes', mx, 19)

  // Artex360 branding
  doc.setFontSize(6.5)
  doc.setTextColor(110, 120, 140)
  doc.text('Artex360', mx, 26)

  // Date droite
  doc.setFontSize(7.5)
  doc.setTextColor(...C.white)
  doc.text(dateStr, W - mx, 10, { align: 'right' })

  // Conseiller
  if (conseiller.nom) {
    doc.setFontSize(6.5)
    doc.setTextColor(110, 120, 140)
    doc.text(`Conseiller : ${conseiller.nom}`, W - mx, 17, { align: 'right' })
  }

  y = 38

  // ──────────────────────────────────────────────────────────
  //  CLIENT & LOGEMENT — 2 cards cote a cote
  // ──────────────────────────────────────────────────────────
  const clientNom = [client.prenom, client.nom].filter(Boolean).join(' ') || '—'
  const clientAdresse = [client.adresse, [client.codePostal, client.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  // Card Client
  const clientH = 30
  drawCard(doc, mx, y, halfW, clientH)
  doc.setFillColor(59, 130, 246)
  doc.roundedRect(mx, y, 1.2, clientH, 0.6, 0.6, 'F')

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('CLIENT', mx + 5, y + 5.5)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(clientNom, mx + 5, y + 12)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  if (clientAdresse) doc.text(doc.splitTextToSize(clientAdresse, halfW - 12), mx + 5, y + 17)
  if (client.telephone) doc.text(client.telephone, mx + 5, y + 22)
  if (client.email) doc.text(client.email, mx + 5, y + 26)

  // Card Logement
  const lx = mx + halfW + gap
  drawCard(doc, lx, y, halfW, clientH)
  doc.setFillColor(...C.brand)
  doc.roundedRect(lx, y, 1.2, clientH, 0.6, 0.6, 'F')

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('LOGEMENT', lx + 5, y + 5.5)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(logement.type || 'Maison', lx + 5, y + 12)

  const logementLines = [
    logement.surface ? `${logement.surface} m²` : null,
    logement.anneeConstruction ? `Construit en ${logement.anneeConstruction}` : (logement.periodeConstruction || null),
    logement.nombreNiveaux ? `${logement.nombreNiveaux} niveau(x)` : null,
  ].filter(Boolean)
  let logY = y + 17
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  logementLines.forEach(line => {
    doc.text(line, lx + 5, logY)
    logY += 4
  })

  y += clientH + 7

  // ──────────────────────────────────────────────────────────
  //  DIAGNOSTIC ACTUEL — DPE & GES & conso
  // ──────────────────────────────────────────────────────────
  y = drawSectionTitle(doc, 'DIAGNOSTIC ACTUEL', 'Etat energetique du logement', mx, y, C.orange)

  const diagH = 40
  drawCard(doc, mx, y, cw, diagH)

  // DPE badge
  const dpeLabel = logement.etiquetteDpe?.toUpperCase() || '—'
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('ETIQUETTE DPE', mx + 8, y + 8)
  if (DPE_COLORS[dpeLabel]) {
    drawDpeBadge(doc, dpeLabel, mx + 8, y + 11, 'large')
  } else {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text(dpeLabel, mx + 8, y + 24)
  }

  // GES badge
  const gesLabel = logement.etiquetteGes?.toUpperCase() || '—'
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('ETIQUETTE GES', mx + 48, y + 8)
  if (GES_COLORS[gesLabel]) {
    drawGesBadge(doc, gesLabel, mx + 48, y + 11, 'large')
  } else {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text(gesLabel, mx + 48, y + 24)
  }

  // Consommation
  const consoX = mx + 92
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('CONSOMMATION', consoX, y + 8)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(logement.consoM2 != null ? `${fmt(logement.consoM2)}` : '—', consoX, y + 18)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('kWh/m²/an', consoX, y + 23)

  // Emissions GES
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('EMISSIONS GES', consoX, y + 30)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(logement.emissionGes != null ? `${fmt(logement.emissionGes)} kgCO₂/m²/an` : '—', consoX, y + 36)

  // Cout annuel
  const coutX = W - mx - 40
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('COUT ANNUEL', coutX, y + 8)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.orange)
  doc.text(logement.coutTotal != null ? fmtEur(logement.coutTotal) : '—', coutX, y + 18)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('estimation annuelle', coutX, y + 23)

  // Chauffage actuel
  if (chauffage.type) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.textMuted)
    doc.text('CHAUFFAGE', coutX, y + 30)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.text)
    doc.text(chauffage.type, coutX, y + 36)
  }

  y += diagH + 7

  // ──────────────────────────────────────────────────────────
  //  ETAT DE L'ISOLATION
  // ──────────────────────────────────────────────────────────
  y = drawSectionTitle(doc, "ETAT DE L'ISOLATION", null, mx, y, C.sky)

  const isoRows = [
    ['Enveloppe globale', isolation.enveloppe],
    ['Murs', isolation.murs],
    ['Plancher bas', isolation.plancherBas],
    ['Plancher haut / Toiture', isolation.plancherHaut],
    ['Menuiseries', isolation.menuiseries],
  ].filter(r => r[1])

  const isoH = isoRows.length * 8.5 + 6
  drawCard(doc, mx, y, cw, isoH)

  let isoY = y + 6
  isoRows.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...C.surface)
      doc.rect(mx + 2, isoY - 3.5, cw - 4, 8.5, 'F')
    }
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text(row[0], mx + 6, isoY + 1)

    // Badge couleur pour la qualite
    drawIsolationBadge(doc, row[1], W - mx - 40, isoY - 2)
    isoY += 8.5
  })

  y += isoH + 7

  // ══════════════════════════════════════════════════════════
  //  PAGE 2
  // ══════════════════════════════════════════════════════════
  doc.addPage()
  y = 16

  // ──────────────────────────────────────────────────────────
  //  PROGRAMME DE TRAVAUX RECOMMANDES
  // ──────────────────────────────────────────────────────────
  y = drawSectionTitle(doc, 'PROGRAMME DE TRAVAUX RECOMMANDES', 'Par ordre de priorite', mx, y, C.brand)

  if (travaux.length > 0) {
    // Trier par priorite
    const sorted = [...travaux].sort((a, b) => (a.priorite || 99) - (b.priorite || 99))

    const tableHead = [['#', 'Poste de travaux', 'Description', 'Gain', 'Cout estime', 'Prime estimee']]
    const tableBody = sorted.map((t, i) => [
      String(t.priorite || i + 1),
      t.poste || '—',
      t.description || '',
      t.gainEnergetique != null ? `${t.gainEnergetique} %` : '—',
      t.coutEstime != null ? fmtEur(t.coutEstime) : '—',
      t.primeEstimee != null ? fmtEur(t.primeEstimee) : '—',
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: mx, right: mx },
      head: tableHead,
      body: tableBody,
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 2.5,
        textColor: C.text,
        lineColor: C.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: C.primary,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 6.5,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 34, fontStyle: 'bold' },
        2: { cellWidth: 52 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right', textColor: C.brandDark },
      },
      alternateRowStyles: {
        fillColor: C.surface,
      },
      didParseCell(data) {
        // Colorer la colonne priorite
        if (data.section === 'body' && data.column.index === 0) {
          const prio = parseInt(data.cell.raw, 10)
          if (prio === 1) data.cell.styles.textColor = C.brand
          else if (prio === 2) data.cell.styles.textColor = C.sky
          else if (prio === 3) data.cell.styles.textColor = C.orange
        }
      },
    })

    y = doc.lastAutoTable.finalY + 8
  } else {
    drawCard(doc, mx, y, cw, 14)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...C.textMuted)
    doc.text('Aucun programme de travaux defini', mx + 6, y + 9)
    y += 22
  }

  // ──────────────────────────────────────────────────────────
  //  PLAN DE FINANCEMENT
  // ──────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 70, H)
  y = drawSectionTitle(doc, 'PLAN DE FINANCEMENT', 'Estimation des aides et du reste a charge', mx, y, C.brandDark)

  const finH = 58
  drawShadow(doc, mx, y, cw, finH, 4)
  doc.setFillColor(...C.brandBg)
  doc.roundedRect(mx, y, cw, finH, 4, 4, 'F')
  doc.setDrawColor(...C.brand)
  doc.setLineWidth(0.5)
  doc.roundedRect(mx, y, cw, finH, 4, 4, 'S')
  doc.setLineWidth(0.2)

  // Accent bar
  doc.setFillColor(...C.brand)
  doc.roundedRect(mx + 1, y + 3, 1.5, finH - 6, 0.75, 0.75, 'F')

  // Colonne gauche — couts
  const finLx = mx + 8
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text('INVESTISSEMENT', finLx, y + 8)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Cout total des travaux', finLx, y + 16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(fmtEur(financement.coutTotal), finLx + 58, y + 16)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text("Total des aides (MaPrimeRenov', CEE, ...)", finLx, y + 23)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text(financement.totalAides != null ? `- ${fmtEur(financement.totalAides)}` : '—', finLx + 58, y + 23)

  // Ligne separatrice
  doc.setDrawColor(...C.brand)
  doc.setLineWidth(0.3)
  doc.line(finLx, y + 27, finLx + 80, y + 27)
  doc.setLineWidth(0.2)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text('Reste a charge', finLx, y + 34)
  doc.setFontSize(14)
  doc.text(fmtEur(financement.resteACharge), finLx + 58, y + 34)

  // Colonne droite — economies
  const finRx = W / 2 + 15
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text('ECONOMIES', finRx, y + 8)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Economies annuelles estimees', finRx, y + 16)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text(financement.economiesAnnuelles != null ? `${fmtEur(financement.economiesAnnuelles)} /an` : '—', finRx, y + 25)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text("Retour sur investissement", finRx, y + 33)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(financement.retourInvestissement != null ? `${financement.retourInvestissement} ans` : '—', finRx, y + 42)

  // Badge ROI
  if (financement.retourInvestissement != null) {
    const roiBg = financement.retourInvestissement <= 5 ? C.brand : financement.retourInvestissement <= 10 ? C.amber : C.orange
    drawBadge(doc, financement.retourInvestissement <= 5 ? 'Excellent' : financement.retourInvestissement <= 10 ? 'Bon' : 'A evaluer', finRx, y + 46, roiBg, C.white)
  }

  y += finH + 8

  // ──────────────────────────────────────────────────────────
  //  OBJECTIF APRES RENOVATION — Avant / Apres
  // ──────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 55, H)
  y = drawSectionTitle(doc, 'OBJECTIF APRES RENOVATION', null, mx, y, C.brand)

  const objH = 42
  drawCard(doc, mx, y, cw, objH)

  // Colonne AVANT
  const avX = mx + 20
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textMuted)
  doc.text('AVANT', avX, y + 8, { align: 'center' })

  if (DPE_COLORS[logement.etiquetteDpe?.toUpperCase()]) {
    drawDpeBadge(doc, logement.etiquetteDpe, avX - 14, y + 12, 'large')
  }

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text(logement.consoM2 != null ? `${fmt(logement.consoM2)} kWh/m²/an` : '', avX, y + 34, { align: 'center' })

  // Fleche
  const arrowCx = mx + cw / 2
  doc.setFillColor(...C.brand)
  // Trait de la fleche
  doc.rect(arrowCx - 15, y + 17, 20, 2, 'F')
  // Pointe
  doc.triangle(arrowCx + 5, y + 13, arrowCx + 5, y + 23, arrowCx + 13, y + 18, 'F')

  // Gain
  if (objectif.gainEnergetique != null) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.brandDark)
    doc.text(`-${objectif.gainEnergetique}%`, arrowCx - 2, y + 30, { align: 'center' })
  }

  // Colonne APRES
  const apX = W - mx - 20
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text('APRES', apX, y + 8, { align: 'center' })

  if (DPE_COLORS[objectif.etiquetteCible?.toUpperCase()]) {
    drawDpeBadge(doc, objectif.etiquetteCible, apX - 14, y + 12, 'large')
  }

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.brandDark)
  doc.text(objectif.consoM2Cible != null ? `${fmt(objectif.consoM2Cible)} kWh/m²/an` : '', apX, y + 34, { align: 'center' })

  y += objH + 8

  // ══════════════════════════════════════════════════════════
  //  PAGE 3 — Prochaines etapes, mentions legales, signatures
  // ══════════════════════════════════════════════════════════
  doc.addPage()
  y = 16

  // ──────────────────────────────────────────────────────────
  //  PROCHAINES ETAPES
  // ──────────────────────────────────────────────────────────
  y = drawSectionTitle(doc, 'PROCHAINES ETAPES', null, mx, y, C.brand)

  const etapes = [
    { num: '1', titre: 'Audit energetique', desc: "Realisation d'un audit energetique complet par un professionnel certifie RGE pour confirmer les preconisations." },
    { num: '2', titre: 'Devis detailles', desc: 'Obtention de devis aupres d\'artisans RGE qualifies pour chaque poste de travaux identifies.' },
    { num: '3', titre: 'Montage du financement', desc: "Constitution du dossier MaPrimeRenov', demande de primes CEE, et etude des possibilites d'eco-PTZ." },
    { num: '4', titre: 'Realisation des travaux', desc: 'Execution des travaux dans un ordre optimise pour maximiser le gain energetique et le confort.' },
  ]

  const etapeCardH = etapes.length * 16 + 6
  drawCard(doc, mx, y, cw, etapeCardH)

  let ey = y + 8
  etapes.forEach((et) => {
    // Cercle numero
    doc.setFillColor(...C.brand)
    doc.circle(mx + 10, ey, 3.5, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text(et.num, mx + 10, ey + 0.5, { align: 'center', baseline: 'middle' })

    // Titre
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text(et.titre, mx + 17, ey - 1)

    // Description
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text(doc.splitTextToSize(et.desc, cw - 24), mx + 17, ey + 4)

    ey += 16
  })

  y += etapeCardH + 8

  // ──────────────────────────────────────────────────────────
  //  COORDONNEES DU CONSEILLER
  // ──────────────────────────────────────────────────────────
  if (conseiller.nom || conseiller.entreprise) {
    y = ensureSpace(doc, y, 30, H)
    y = drawSectionTitle(doc, 'VOTRE CONSEILLER', null, mx, y, C.sky)

    const consH = 22
    drawCard(doc, mx, y, cw, consH)
    doc.setFillColor(59, 130, 246)
    doc.roundedRect(mx, y, 1.2, consH, 0.6, 0.6, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    doc.text(conseiller.nom || '—', mx + 6, y + 8)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    const consDetails = [
      conseiller.entreprise,
      conseiller.telephone,
      conseiller.email,
    ].filter(Boolean).join(' — ')
    doc.text(consDetails, mx + 6, y + 14)

    y += consH + 8
  }

  // ──────────────────────────────────────────────────────────
  //  MENTIONS LEGALES
  // ──────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 35, H)
  y = drawSectionTitle(doc, 'MENTIONS LEGALES', null, mx, y, C.textMuted)

  const mentions = [
    "Ce rapport est etabli a titre indicatif sur la base des informations fournies et des donnees disponibles au moment de sa realisation.",
    "Les montants des primes et aides financieres sont des estimations et sont soumis aux conditions d'eligibilite en vigueur. Ils devront etre confirmes lors du montage du dossier.",
    "Les gains energetiques et economies annuelles sont des projections basees sur des hypotheses de calcul standards et peuvent varier selon les conditions reelles d'utilisation.",
    "Les travaux de renovation energetique doivent etre realises par des professionnels qualifies RGE (Reconnu Garant de l'Environnement) pour ouvrir droit aux aides.",
    "Ce document ne constitue ni un engagement contractuel, ni un devis, ni une offre de financement.",
  ]

  const mentionsCardH = 45
  drawCard(doc, mx, y, cw, mentionsCardH)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)

  let my = y + 6
  mentions.forEach(m => {
    doc.text(doc.splitTextToSize(`• ${m}`, cw - 12), mx + 6, my)
    my += 8
  })

  y += mentionsCardH + 8

  // ──────────────────────────────────────────────────────────
  //  SIGNATURES
  // ──────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 35, H)
  y += 4

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text("Le conseiller :", mx, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.textLight)
  doc.text(conseiller.nom || 'Artex360', mx, y + 5)
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
  doc.text(clientNom, sigX, y + 5)
  doc.text('Bon pour accord, date et signature :', sigX, y + 14)
  doc.line(sigX, y + 22, sigX + 65, y + 22)

  // ══════════════════════════════════════════════════════════
  //  FOOTER sur chaque page
  // ══════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(doc, W, mx, dateStr, i, totalPages)
  }

  // ══════════════════════════════════════════════════════════
  //  Telecharger
  // ══════════════════════════════════════════════════════════
  const safeNom = (client.nom || '').replace(/[^a-zA-Z0-9-]+/g, '_').slice(0, 30)
  const safeDate = (d.date || new Date().toISOString().slice(0, 10)).replace(/\//g, '-')
  const fileName = `Rapport_Reno_Globale${safeNom ? '_' + safeNom : ''}_${safeDate}.pdf`
  doc.save(fileName)
}
