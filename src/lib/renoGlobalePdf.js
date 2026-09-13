import jsPDF from 'jspdf'
import { WORK_GROUPS_MAISON, WORK_GROUPS_APPART } from './constants/renovationGlobale'

/**
 * PDF « Plan de financement » — BAR-TH-174 Rénovation globale
 *
 * Document client 2 pages : synthèse des travaux + détail des aides et du parcours.
 * Volontairement séparé de pdfGenerator.js (utilisé par les autres simulateurs)
 * pour pouvoir soigner la mise en page sans impacter les autres fiches.
 */

// ─── Palette ───
const C = {
  green900: [11, 61, 42],
  green700: [20, 104, 74],
  green500: [31, 157, 99],
  green100: [231, 244, 236],
  green050: [243, 250, 246],
  lime: [148, 193, 31],
  violet: [108, 92, 231],
  violet050: [239, 237, 253],
  ink: [22, 40, 31],
  muted: [107, 122, 115],
  line: [220, 231, 225],
  rowLine: [237, 243, 240],
  white: [255, 255, 255],
}

const DPE_COLORS = {
  A: [49, 152, 52],
  B: [51, 204, 49],
  C: [143, 212, 0],
  D: [245, 228, 0],
  E: [240, 165, 0],
  F: [235, 108, 0],
  G: [227, 30, 36],
}
const DPE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const MPR_LABELS = {
  Bleu: 'Très modestes',
  Jaune: 'Modestes',
  Violet: 'Intermédiaires',
  Rose: 'Supérieurs',
}

// Libellés client, plus parlants que les libellés de saisie
const POSTE_LABELS = {
  combles_perdus: 'Isolation des combles perdus',
  rampants: 'Isolation des rampants de toiture',
  toiture_terrasse: 'Isolation de la toiture terrasse',
  murs_ite: 'Isolation des murs par l’extérieur (ITE)',
  murs_iti: 'Isolation des murs par l’intérieur (ITI)',
  menuiseries: 'Fenêtres / Menuiseries extérieures',
  plancher: 'Isolation du plancher bas',
  pac_air_air: 'Pompe à chaleur air/air',
  pac_air_eau: 'Pompe à chaleur air/eau',
  chaudiere_granules: 'Chaudière à granulés',
  vmc_simple: 'VMC simple flux',
  vmc_double: 'VMC double flux',
  vmc_hygro: 'VMC hygroréglable',
  ecs_electrique: 'Ballon d’eau chaude électrique',
  ecs_thermo: 'Ballon d’eau chaude thermodynamique',
}

const POSTE_DESCRIPTIONS = {
  menuiseries: 'Remplacement par vitrage performant',
  pac_air_air: 'Remplacement du système de chauffage principal',
  pac_air_eau: 'Remplacement du système de chauffage principal',
  chaudiere_granules: 'Remplacement du système de chauffage principal',
  vmc_simple: 'Ventilation et qualité de l’air intérieur',
  vmc_double: 'Ventilation et qualité de l’air intérieur',
  vmc_hygro: 'Ventilation et qualité de l’air intérieur',
  ecs_electrique: 'Production d’eau chaude sanitaire',
  ecs_thermo: 'Production d’eau chaude sanitaire',
}

// type de poste -> groupe d'affichage
const GROUP_OF_TYPE = (() => {
  const map = {}
  for (const grp of [...WORK_GROUPS_MAISON, ...WORK_GROUPS_APPART]) {
    for (const item of grp.items) map[item.value] = grp.group
  }
  return map
})()

// résistance thermique réglementaire par poste, depuis les constantes
const R_OF_TYPE = (() => {
  const map = {}
  for (const grp of [...WORK_GROUPS_MAISON, ...WORK_GROUPS_APPART]) {
    for (const item of grp.items) if (item.r) map[item.value] = item.r
  }
  return map
})()

const DISPLAY_GROUPS = [
  { key: 'isolation', label: 'Isolation de l’enveloppe' },
  { key: 'equipements', label: 'Chauffage, eau chaude sanitaire et ventilation' },
  { key: 'menuiseries', label: 'Menuiseries' },
  { key: 'autres', label: 'Autres travaux' },
]

// ─── Formatage ───

/** Espace fine insécable interdite en WinAnsi : on reste sur l'espace simple. */
function nb(str) {
  return String(str).replace(/[\u00A0\u202F\u2009]/g, ' ')
}

/** Remplace les caractères absents des polices standard jsPDF. */
function clean(str) {
  return nb(str || '')
    .replace(/≥\s*/g, 'min. ')
    .replace(/→/g, 'vers')
    .replace(/≤\s*/g, 'max. ')
}

function group3(intPart) {
  const parts = []
  for (let i = intPart.length; i > 0; i -= 3) parts.unshift(intPart.slice(Math.max(0, i - 3), i))
  return parts.join(' ')
}

/** 43 312 € */
function fmt0(amount) {
  const r = Math.round(amount || 0)
  return (r < 0 ? '-' : '') + group3(Math.abs(r).toString()) + ' €'
}

/** 10 313,74 € */
function fmt2(amount) {
  const v = Number(amount) || 0
  const abs = Math.abs(v).toFixed(2)
  const [int, dec] = abs.split('.')
  return (v < 0 ? '-' : '') + group3(int) + ',' + dec + ' €'
}

// ─── Primitives ───

function txt(doc, s, x, y, opt = {}) {
  const { size = 8, style = 'normal', color = C.ink, align = 'left', maxWidth } = opt
  doc.setFontSize(size)
  doc.setFont('helvetica', style)
  doc.setTextColor(...color)
  doc.text(clean(s), x, y, maxWidth ? { align, maxWidth } : { align })
}

/**
 * Dessine un « ≥ » vectoriel : le glyphe est absent des polices standard jsPDF,
 * et embarquer une police entiere pour un seul signe couterait ~100 ko de bundle.
 * Retourne la largeur occupee, chasse comprise.
 */
function drawGte(doc, x, y, sizePt, color) {
  const mm = sizePt * 0.3528
  const c = mm * 0.62
  const w = c * 0.82
  const lead = mm * 0.14
  const gx = x + lead
  doc.setDrawColor(...color)
  doc.setLineWidth(Math.max(0.12, mm * 0.06))
  doc.line(gx, y - c, gx + w, y - c * 0.6)
  doc.line(gx + w, y - c * 0.6, gx, y - c * 0.2)
  doc.line(gx, y + c * 0.06, gx + w, y + c * 0.06)
  doc.setLineWidth(0.2)
  return lead + w + mm * 0.2
}

/** Comme txt(), mais rend les « ≥ » presents dans la chaine en vectoriel. */
function txtGte(doc, s, x, y, opt = {}) {
  const parts = String(s || '').split('≥')
  if (parts.length === 1) return txt(doc, s, x, y, opt)
  const { size = 8, style = 'normal', color = C.ink } = opt
  let cx = x
  parts.forEach((part, i) => {
    if (i > 0) cx += drawGte(doc, cx, y, size, color)
    if (!part) return
    txt(doc, part, cx, y, opt)
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    cx += doc.getTextWidth(clean(part))
  })
}

function card(doc, x, y, w, h, opt = {}) {
  const { fill = C.white, border = C.line, radius = 2.2 } = opt
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, w, h, radius, radius, 'F')
  if (border) {
    doc.setDrawColor(...border)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, w, h, radius, radius, 'S')
  }
}

/** Titre de section : petites capitales vertes + filet qui court jusqu'au bord */
function sectionTitle(doc, label, x, y, w) {
  doc.setFontSize(7.4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.green700)
  const spaced = clean(label).toUpperCase().split('').join(' ')
  doc.text(spaced, x, y)
  const tw = doc.getTextWidth(spaced)
  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.25)
  doc.line(x + tw + 3, y - 1, x + w, y - 1)
  return y + 4.2
}

/** Pastille arrondie type « chip » */
function chip(doc, label, x, y, opt = {}) {
  const { bg = C.green100, fg = C.green700, border = [205, 231, 217] } = opt
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  const w = doc.getTextWidth(clean(label)) + 6
  const h = 4.6
  doc.setFillColor(...bg)
  doc.roundedRect(x, y, w, h, 2.3, 2.3, 'F')
  if (border) {
    doc.setDrawColor(...border)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, w, h, 2.3, 2.3, 'S')
  }
  doc.setTextColor(...fg)
  doc.text(clean(label), x + w / 2, y + 3.1, { align: 'center' })
  return w
}

/** Encart à filet coloré à gauche */
function callout(doc, x, y, w, lines, opt = {}) {
  const { accent = C.green500, bg = C.green050, titleColor = C.green900 } = opt
  const inner = w - 9
  doc.setFontSize(7.6)
  const wrapped = []
  lines.forEach((l) => {
    doc.setFont('helvetica', l.bold ? 'bold' : 'normal')
    doc.splitTextToSize(clean(l.text), inner).forEach((t) => wrapped.push({ text: t, bold: l.bold }))
  })
  const h = wrapped.length * 3.6 + 6
  doc.setFillColor(...bg)
  doc.roundedRect(x, y, w, h, 1.8, 1.8, 'F')
  doc.setFillColor(...accent)
  doc.rect(x, y, 1, h, 'F')
  let ty = y + 5.2
  wrapped.forEach((l) => {
    doc.setFont('helvetica', l.bold ? 'bold' : 'normal')
    doc.setTextColor(...(l.bold ? titleColor : C.ink))
    doc.setFontSize(7.6)
    doc.text(l.text, x + 5, ty)
    ty += 3.6
  })
  return h
}

/** Secteur d'anneau (donut) */
function donutSegment(doc, cx, cy, rOut, rIn, a0, a1, color) {
  const steps = Math.max(10, Math.ceil((Math.abs(a1 - a0) / Math.PI) * 60))
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push([cx + rOut * Math.cos(a), cy + rOut * Math.sin(a)])
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push([cx + rIn * Math.cos(a), cy + rIn * Math.sin(a)])
  }
  const deltas = []
  for (let i = 1; i < pts.length; i++) deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]])
  doc.setFillColor(...color)
  doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], 'F', true)
}

// ─── Construction du document ───

const W = 210
const H = 297
const MX = 13
const CW = W - MX * 2

function header(doc, { company, metaTitle, dateStr, ficheCode }) {
  const logoBottom = 24.5
  let drawn = false
  if (company.logo) {
    try {
      const props = doc.getImageProperties(company.logo)
      const h = 13.5
      const w = (props.width / props.height) * h
      doc.addImage(company.logo, props.fileType || 'PNG', MX, logoBottom - h, Math.min(w, 60), h)
      drawn = true
    } catch {
      drawn = false
    }
  }
  if (!drawn) {
    txt(doc, company.name || 'Simulation', MX, 20, { size: 15, style: 'bold', color: C.green900 })
    if (company.city) txt(doc, company.city, MX, 24, { size: 6.8, color: C.muted })
  }

  txt(doc, metaTitle, W - MX, 15, { size: 8, style: 'bold', color: C.green900, align: 'right' })
  txt(doc, `Édité le ${dateStr}`, W - MX, 19, { size: 7.2, color: C.muted, align: 'right' })
  txt(doc, `Réf. simulation : ${ficheCode}`, W - MX, 22.4, { size: 7.2, color: C.muted, align: 'right' })

  doc.setFillColor(...C.lime)
  doc.rect(MX, 26, CW, 0.7, 'F')
  return 26.7
}

function footer(doc, { company, page, pages }) {
  const y = H - 12
  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.25)
  doc.line(MX, y, W - MX, y)

  const bits = []
  if (company.address) bits.push(company.address)
  const cityLine = `${company.postalCode || ''} ${company.city || ''}`.trim()
  if (cityLine) bits.push(cityLine)
  doc.setFontSize(6.4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.green700)
  const name = clean(company.name || '')
  doc.text(name, MX, y + 3.6)
  const nameW = doc.getTextWidth(name)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  const tail = (bits.length ? ', ' + bits.join(', ') : '') + (company.email ? `. ${company.email}` : '')
  if (tail) doc.text(clean(tail), MX + nameW, y + 3.6)
  doc.text(`Simulation indicative et non contractuelle. Page ${page}/${pages}`, W - MX, y + 3.6, { align: 'right' })
}

/** Prépare les lignes de travaux regroupées par famille */
function buildWorkRows(workItems) {
  const buckets = { isolation: [], equipements: [], menuiseries: [], autres: [] }
  for (const w of workItems || []) {
    const ht = Number(w.prixHT) || 0
    const tva = Number(w.tva) || 5.5
    const type = w.type || ''
    let key = 'autres'
    if (type === 'menuiseries') key = 'menuiseries'
    else {
      const grp = GROUP_OF_TYPE[type]
      if (grp === 'isolation') key = 'isolation'
      else if (grp === 'chauffage' || grp === 'ecs' || grp === 'ventilation') key = 'equipements'
    }
    const r = R_OF_TYPE[type]
    buckets[key].push({
      label: POSTE_LABELS[type] || w.label || 'Poste de travaux',
      desc: r
        ? `Résistance thermique ${r.replace('.', ',')} m².K/W`
        : POSTE_DESCRIPTIONS[type] || '',
      ht,
      tva,
      tvaAmount: (ht * tva) / 100,
    })
  }
  return DISPLAY_GROUPS
    .map((g) => ({ ...g, rows: buckets[g.key] }))
    .filter((g) => g.rows.length > 0)
}

function drawDpeScale(doc, x, y, w, classInitiale, classCible) {
  const gap = 1
  const cellW = (w - gap * 6) / 7
  const boxH = 7
  DPE_ORDER.forEach((letter, i) => {
    const cx = x + i * (cellW + gap)
    const active = letter === classInitiale || letter === classCible
    if (!active) doc.setGState(new doc.GState({ opacity: 0.32 }))
    doc.setFillColor(...DPE_COLORS[letter])
    doc.roundedRect(cx, y, cellW, boxH, 1.3, 1.3, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    if (!active) doc.setGState(new doc.GState({ opacity: 0.55 }))
    doc.text(letter, cx + cellW / 2, y + 5, { align: 'center' })
    doc.setGState(new doc.GState({ opacity: 1 }))

    if (active) {
      const isStart = letter === classInitiale
      txt(doc, isStart ? 'AUJOURD’HUI' : 'APRÈS TRAVAUX', cx + cellW / 2, y + boxH + 3.2, {
        size: 6, style: 'bold', align: 'center', color: isStart ? [194, 65, 12] : C.green500,
      })
    }
  })
  return boxH + 4.6
}

function drawKpis(doc, y, { cost, aid, rac, aidLabel, costHT }) {
  const gap = 2.4
  const cw = (CW - gap * 2) / 3
  const h = 19
  const pct = cost > 0 ? Math.round((rac / cost) * 100) : 0

  card(doc, MX, y, cw, h)
  txt(doc, 'COÛT DU PROJET', MX + 4.5, y + 5.5, { size: 6.6, style: 'bold', color: C.muted })
  txt(doc, fmt0(cost), MX + 4.5, y + 13.2, { size: 17, style: 'bold', color: C.green900 })
  txt(doc, `TTC, soit ${fmt0(costHT)} HT`, MX + 4.5, y + 16.6, { size: 6.6, color: C.muted })

  const x2 = MX + cw + gap
  doc.setFillColor(...C.green700)
  doc.roundedRect(x2, y, cw, h, 2.2, 2.2, 'F')
  txt(doc, 'AIDES DÉDUITES', x2 + 4.5, y + 5.5, { size: 6.6, style: 'bold', color: [184, 227, 205] })
  txt(doc, fmt0(aid), x2 + 4.5, y + 13.2, { size: 17, style: 'bold', color: C.white })
  txt(doc, aidLabel, x2 + 4.5, y + 16.6, { size: 6.6, color: [205, 235, 220] })

  const x3 = MX + (cw + gap) * 2
  card(doc, x3, y, cw, h)
  txt(doc, 'RESTE À CHARGE', x3 + 4.5, y + 5.5, { size: 6.6, style: 'bold', color: C.muted })
  txt(doc, fmt0(rac), x3 + 4.5, y + 13.2, { size: 17, style: 'bold', color: C.violet })
  txt(doc, `soit ${pct} % du coût total`, x3 + 4.5, y + 16.6, { size: 6.6, color: C.muted })

  return h
}

/**
 * @param {boolean} priced faux en saisie rapide : les postes sont coches sans prix,
 *   on liste alors les postes sans colonnes de montants plutot que d'afficher des 0,00 EUR
 */
function drawWorkTable(doc, y, groups, totals, aidLabel, newPage, priced = true) {
  const colHT = W - MX - 62
  const colTVA = W - MX - 40
  const colTTC = W - MX - 2
  const LIMIT = H - 30

  function head() {
    txt(doc, priced ? 'POSTE DE TRAVAUX' : 'POSTES DE TRAVAUX RETENUS', MX + 2, y, {
      size: 6.6, style: 'bold', color: C.muted,
    })
    if (priced) {
      txt(doc, 'MONTANT HT', colHT, y, { size: 6.6, style: 'bold', color: C.muted, align: 'right' })
      txt(doc, 'TVA', colTVA, y, { size: 6.6, style: 'bold', color: C.muted, align: 'right' })
      txt(doc, 'MONTANT TTC', colTTC, y, { size: 6.6, style: 'bold', color: C.muted, align: 'right' })
    }
    y += 1.8
    doc.setDrawColor(...C.green700)
    doc.setLineWidth(0.4)
    doc.line(MX, y, W - MX, y)
  }

  /** Repart en haut d'une nouvelle page si le bloc ne tient plus. */
  function ensure(needed, withHead = false) {
    if (y + needed <= LIMIT) return
    y = newPage() + 4
    if (withHead) head()
  }

  head()

  groups.forEach((g) => {
    const groupHT = g.rows.reduce((s, r) => s + r.ht, 0)
    ensure(14, true)
    doc.setFillColor(...C.green050)
    doc.rect(MX, y, CW, 5.2, 'F')
    txt(doc, clean(g.label).toUpperCase().split('').join(' '), MX + 2, y + 3.5, {
      size: 6.4, style: 'bold', color: C.green700,
    })
    if (priced) {
      txt(doc, `${fmt2(groupHT)} HT`, colTTC, y + 3.5, { size: 6.4, style: 'bold', color: C.green700, align: 'right' })
    }
    doc.setDrawColor(...C.line)
    doc.setLineWidth(0.2)
    doc.line(MX, y + 5.2, W - MX, y + 5.2)
    y += 5.2

    g.rows.forEach((r) => {
      const rowH = r.desc ? 10.4 : 7.8
      ensure(rowH, true)
      txt(doc, r.label, MX + 2, y + 4.4, { size: 8.2, style: 'bold', color: C.ink })
      if (r.desc) txtGte(doc, r.desc, MX + 2, y + 7.9, { size: 6.6, color: C.muted })
      const vy = r.desc ? y + 6 : y + 5
      if (priced) {
        txt(doc, fmt2(r.ht), colHT, vy, { size: 8.2, align: 'right' })
        txt(doc, `${String(r.tva).replace('.', ',')} %`, colTVA, vy, { size: 6.8, color: C.muted, align: 'right' })
        txt(doc, fmt2(r.ht + r.tvaAmount), colTTC, vy, { size: 8.2, align: 'right' })
      }
      doc.setDrawColor(...C.rowLine)
      doc.setLineWidth(0.2)
      doc.line(MX, y + rowH, W - MX, y + rowH)
      y += rowH
    })
  })

  ensure(38)

  return drawTotalsBlock(doc, y + 2, totals, aidLabel)
}

/** Bloc totaux : HT, TVA, TTC, aide déduite et reste à charge */
function drawTotalsBlock(doc, y, totals, aidLabel) {
  const colTTC = W - MX - 2
  doc.setDrawColor(...C.green700)
  doc.setLineWidth(0.4)
  doc.line(MX + CW * 0.42, y, W - MX, y)
  y += 5.4
  txt(doc, 'Total travaux HT', colTTC - 34, y, { size: 7.8, color: C.muted, align: 'right' })
  txt(doc, fmt2(totals.ht), colTTC, y, { size: 8.2, style: 'bold', align: 'right' })
  y += 5.4
  txt(doc, `TVA ${String(totals.tvaLabel).replace('.', ',')}`, colTTC - 34, y, { size: 7.8, color: C.muted, align: 'right' })
  txt(doc, fmt2(totals.tva), colTTC, y, { size: 8.2, style: 'bold', align: 'right' })
  y += 6.6
  txt(doc, 'Total travaux TTC', colTTC - 34, y, { size: 9.5, style: 'bold', color: C.green900, align: 'right' })
  txt(doc, fmt2(totals.ttc), colTTC, y, { size: 9.5, style: 'bold', color: C.green900, align: 'right' })
  y += 6.4
  txt(doc, aidLabel, colTTC - 34, y, { size: 8.2, style: 'bold', color: C.green500, align: 'right' })
  txt(doc, `- ${fmt2(totals.aid)}`, colTTC, y, { size: 8.2, style: 'bold', color: C.green500, align: 'right' })
  y += 3.4
  doc.setFillColor(...C.violet)
  doc.roundedRect(MX, y, CW, 9.5, 2, 2, 'F')
  txt(doc, 'Reste à charge estimé', colTTC - 34, y + 6.2, { size: 10, style: 'bold', color: C.white, align: 'right' })
  txt(doc, fmt2(totals.rac), colTTC, y + 6.2, { size: 10, style: 'bold', color: C.white, align: 'right' })
  return y + 9.5
}

function drawDonut(doc, y, { aid, rac, cost, aidLabel, aidHint }) {
  const cx = MX + 22
  const cy = y + 22
  const rOut = 21
  const rIn = 13.5
  const share = cost > 0 ? aid / cost : 0
  const start = -Math.PI / 2

  donutSegment(doc, cx, cy, rOut, rIn, start, start + Math.PI * 2, C.violet)
  if (share > 0) donutSegment(doc, cx, cy, rOut, rIn, start, start + Math.PI * 2 * Math.min(share, 1), C.green500)

  txt(doc, 'FINANCÉ', cx, cy - 1.5, { size: 6.6, color: C.muted, align: 'center' })
  txt(doc, `${Math.round(share * 100)} %`, cx, cy + 6, { size: 20, style: 'bold', color: C.green900, align: 'center' })

  const lx = MX + 52
  const lw = W - MX - lx
  const rows = [
    { color: C.green500, name: aidLabel, note: aidHint, value: fmt0(aid), valueColor: C.green500 },
    { color: C.violet, name: 'Reste à charge', note: 'Finançable par éco-prêt à taux zéro', value: fmt0(rac), valueColor: C.violet },
    { color: C.green900, name: 'Coût total du projet', note: 'Travaux TTC, TVA incluse', value: fmt0(cost), valueColor: C.green900 },
  ]
  let ly = y + 6
  rows.forEach((r, i) => {
    doc.setFillColor(...r.color)
    doc.roundedRect(lx, ly - 2.4, 2.6, 2.6, 0.8, 0.8, 'F')
    txt(doc, r.name, lx + 5, ly, { size: 8.4, style: 'bold', color: C.ink })
    txt(doc, r.note, lx + 5, ly + 3.2, { size: 6.8, color: C.muted })
    txt(doc, r.value, lx + lw, ly + 1, { size: 9.5, style: 'bold', color: r.valueColor, align: 'right' })
    if (i < rows.length - 1) {
      doc.setDrawColor(...C.rowLine)
      doc.setLineWidth(0.2)
      doc.line(lx, ly + 6.4, lx + lw, ly + 6.4)
    }
    ly += 11.5
  })
  return 46
}

function drawCalcCard(doc, x, y, w, rows) {
  const rowH = 6.4
  const h = rows.length * rowH + 2
  card(doc, x, y, w, h)
  let ry = y + 1
  rows.forEach((r, i) => {
    if (r.highlight) {
      doc.setFillColor(...C.green100)
      doc.rect(x + 0.3, ry, w - 0.6, rowH, 'F')
    }
    txt(doc, r.label, x + 4, ry + 4.2, { size: 8, color: C.muted })
    txt(doc, r.value, x + w - 4, ry + 4.2, { size: 8, style: 'bold', color: C.green900, align: 'right' })
    if (i < rows.length - 1) {
      doc.setDrawColor(...C.rowLine)
      doc.setLineWidth(0.2)
      doc.line(x + 2, ry + rowH, x + w - 2, ry + rowH)
    }
    ry += rowH
  })
  return h
}

function drawSteps(doc, x, y, w, steps, startIndex) {
  let sy = y
  steps.forEach((s, i) => {
    const n = startIndex + i
    doc.setFillColor(...C.green700)
    doc.circle(x + 2.4, sy - 1, 2.4, 'F')
    txt(doc, String(n), x + 2.4, sy + 0.1, { size: 6.4, style: 'bold', color: C.white, align: 'center' })
    txt(doc, s.title, x + 7, sy, { size: 8.2, style: 'bold', color: C.green900 })
    doc.setFontSize(7.4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    const lines = doc.splitTextToSize(clean(s.detail), w - 8)
    lines.forEach((l, j) => doc.text(l, x + 7, sy + 3.4 + j * 3.1))
    sy += 3.4 + lines.length * 3.1 + 2.6
  })
  return sy - y
}

function drawBullets(doc, x, y, w, items) {
  let by = y
  items.forEach((it) => {
    doc.setFillColor(...C.lime)
    doc.circle(x + 1.2, by - 1, 1.2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const boldW = doc.getTextWidth(clean(it.strong))
    // On compose « libellé fort » + suite, avec repli sur plusieurs lignes
    doc.setFont('helvetica', 'normal')
    const restLines = doc.splitTextToSize(clean(it.rest || ''), w - 5 - boldW)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.green900)
    doc.text(clean(it.strong), x + 4.5, by)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.ink)
    if (restLines.length) doc.text(restLines[0], x + 4.5 + boldW, by)
    let extra = []
    if (restLines.length > 1) {
      extra = doc.splitTextToSize(restLines.slice(1).join(' '), w - 5)
      extra.forEach((l, i) => doc.text(l, x + 4.5, by + 3.2 + i * 3.2))
    }
    by += 3.2 + extra.length * 3.2 + 2.4
  })
  return by - y
}

/**
 * Construit le document (exporté pour pouvoir être testé hors navigateur).
 */
export function buildRenoGlobalePDF({
  company = {},
  client = null,
  ficheCode = 'BAR-TH-174',
  classInitiale = null,
  classCible = null,
  jumps = 0,
  workItems = [],
  projectCostHT = 0,
  mprCategory = null,
  mprTaux = null,
  mprDepenseEligible = null,
  mprPlafond = null,
  summary = {},
  ceeDetail = null,
  mode = 'anah',
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const isAnah = mode === 'anah'
  const aidLabel = isAnah ? 'MaPrimeRénov’ Parcours Accompagné' : 'Prime CEE'

  // ─── Montants ───
  const groups = buildWorkRows(workItems)
  const rows = groups.flatMap((g) => g.rows)
  const detailedHT = rows.reduce((s, r) => s + r.ht, 0)
  const hasDetail = rows.length > 0 && detailedHT > 0

  const totalHT = hasDetail ? detailedHT : projectCostHT || 0
  const totalTVA = hasDetail
    ? rows.reduce((s, r) => s + r.tvaAmount, 0)
    : Math.max(0, (summary.projectCost || 0) - totalHT)
  const totalTTC = hasDetail ? totalHT + totalTVA : summary.projectCost || 0
  const aid = summary.totalAid || 0
  const rac = Math.max(0, totalTTC - aid)
  // Taux affiche : celui des lignes si elles sont chiffrees, sinon le taux effectif
  // deduit du couple HT / TTC saisi en mode rapide.
  const tvaRates = [...new Set(rows.filter((r) => r.ht > 0).map((r) => r.tva))]
  const effectiveRate = totalHT > 0 ? Math.round((totalTVA / totalHT) * 1000) / 10 : 0
  const tvaLabel = tvaRates.length === 1
    ? `${tvaRates[0]} %`
    : tvaRates.length > 1
      ? 'appliquée'
      : effectiveRate > 0
        ? `${effectiveRate} %`
        : 'appliquée'
  const financedPct = totalTTC > 0 ? Math.round((aid / totalTTC) * 100) : 0

  // ════════════ PAGE 1 ════════════
  const newContinuationPage = () => {
    doc.addPage()
    return header(doc, { company, metaTitle: 'Détail des travaux (suite)', dateStr, ficheCode })
  }

  let y = header(doc, { company, metaTitle: 'Plan de financement', dateStr, ficheCode })

  y += 9
  txt(doc, financedPct > 0 ? `Votre rénovation globale, financée à ${financedPct} %` : 'Votre rénovation globale', MX, y, {
    size: 16, style: 'bold', color: C.green900,
  })
  y += 5.8
  txt(doc, 'Maison individuelle : synthèse des travaux envisagés et des aides mobilisables', MX, y, {
    size: 8.6, color: C.muted,
  })
  y += 3.2

  let cx = MX
  cx += chip(doc, aidLabel, cx, y) + 2
  if (jumps > 0) {
    chip(doc, `Saut de ${jumps} classe${jumps > 1 ? 's' : ''} DPE`, cx, y, {
      bg: C.violet050, fg: [76, 63, 196], border: [221, 216, 251],
    })
  }
  y += 8.6

  // Forme administrative francaise : civilite, NOM, prenom
  const clientName = client
    ? [client.civilite, client.lastName, client.firstName].filter(Boolean).join(' ').trim()
    : ''
  const clientAddress = client
    ? [client.address, `${client.postalCode || ''} ${client.city || ''}`.trim()].filter(Boolean).join(', ')
    : ''
  if (clientName || clientAddress) {
    const h = 7.2
    doc.setFillColor(251, 253, 248)
    doc.roundedRect(MX, y, CW, h, 1.6, 1.6, 'F')
    doc.setDrawColor(...C.line)
    doc.setLineWidth(0.2)
    doc.roundedRect(MX, y, CW, h, 1.6, 1.6, 'S')
    doc.setFillColor(...C.lime)
    doc.rect(MX, y, 1, h, 'F')
    let tx = MX + 5
    if (clientName) {
      txt(doc, 'Bénéficiaire :', tx, y + 4.3, { size: 8.2, color: C.muted })
      tx += doc.getTextWidth('Bénéficiaire :') + 1.5
      txt(doc, clientName, tx, y + 4.3, { size: 8.2, style: 'bold', color: C.green900 })
      doc.setFont('helvetica', 'bold')
      tx += doc.getTextWidth(clean(clientName)) + 8
    }
    if (clientAddress) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.2)
      txt(doc, 'Adresse des travaux :', tx, y + 4.3, { size: 8.2, color: C.muted })
      tx += doc.getTextWidth('Adresse des travaux :') + 1.5
      txt(doc, clientAddress, tx, y + 4.3, { size: 8.2, style: 'bold', color: C.green900 })
    }
    y += h
  }

  y += 6.5
  y += drawKpis(doc, y, { cost: totalTTC, aid, rac, aidLabel, costHT: totalHT })

  if (classInitiale && classCible) {
    y += 8
    y = sectionTitle(doc, 'Performance énergétique visée', MX, y, CW)
    const boxH = 22
    card(doc, MX, y, CW, boxH, { fill: C.green050 })
    txt(doc, `Étiquette DPE : de ${classInitiale} à ${classCible}`, MX + 4.5, y + 5.5, {
      size: 8.6, style: 'bold', color: C.green900,
    })
    const gainText = jumps >= 3 && ['F', 'G'].includes(classInitiale)
      ? `+${jumps} classes, sortie du statut de passoire énergétique`
      : `+${jumps} classe${jumps > 1 ? 's' : ''} sur l’étiquette énergie`
    txt(doc, gainText, W - MX - 4.5, y + 5.5, { size: 7.6, style: 'bold', color: C.green500, align: 'right' })
    drawDpeScale(doc, MX + 4.5, y + 9, CW - 9, classInitiale, classCible)
    y += boxH
  }

  if (groups.length > 0) {
    y += 8
    y = sectionTitle(doc, 'Détail des travaux envisagés', MX, y, CW)
    y = drawWorkTable(doc, y, groups, { ht: totalHT, tva: totalTVA, ttc: totalTTC, aid, rac, tvaLabel }, aidLabel, newContinuationPage, hasDetail)
  } else {
    // Mode rapide : pas de postes détaillés, on affiche le seul récapitulatif financier
    y += 8
    y = sectionTitle(doc, 'Récapitulatif financier', MX, y, CW)
    y = drawTotalsBlock(doc, y + 1, { ht: totalHT, tva: totalTVA, ttc: totalTTC, aid, rac, tvaLabel }, aidLabel)
  }

  y += 5
  doc.setFontSize(6.4)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  const noteParts = []
  if (Math.abs(effectiveRate - 5.5) < 0.05) {
    noteParts.push('TVA à taux réduit de 5,5 % applicable aux travaux d’amélioration de la performance énergétique dans les logements achevés depuis plus de 2 ans.')
  }
  if (groups.length > 0 && !hasDetail) {
    noteParts.push('Le coût indiqué est un montant global : la répartition par poste sera précisée sur les devis des entreprises.')
  }
  noteParts.push('Montants issus des devis prévisionnels, à confirmer après visite technique.')
  const note = noteParts.join(' ')
  doc.splitTextToSize(clean(note), CW).forEach((l, i) => doc.text(l, MX, y + i * 2.8))

  // ════════════ PAGE 2 ════════════
  doc.addPage()
  y = header(doc, { company, metaTitle: 'Vos aides et les prochaines étapes', dateStr, ficheCode })

  y += 4.4
  y = sectionTitle(doc, 'Répartition du financement', MX, y, CW)
  y += drawDonut(doc, y, {
    aid,
    rac,
    cost: totalTTC,
    aidLabel,
    aidHint: isAnah ? 'Aide de l’État versée par l’Anah, après travaux' : 'Prime versée par le délégataire après travaux',
  })

  y += 4.4
  y = sectionTitle(doc, 'Comment votre aide est calculée', MX, y, CW)
  const halfW = (CW - 6) / 2
  const calcRows = isAnah
    ? [
        { label: 'Catégorie de revenus', value: MPR_LABELS[mprCategory] || mprCategory || 'À confirmer' },
        { label: 'Saut de classes DPE visé', value: `${jumps} classes (${classInitiale} vers ${classCible})` },
        { label: 'Taux de prise en charge', value: `${Math.round((mprTaux || 0) * 100)} %` },
        { label: 'Assiette de dépense retenue', value: `${fmt0(mprDepenseEligible || 0)} HT` },
        { label: 'Montant MaPrimeRénov’', value: fmt0(aid), highlight: true },
      ]
    : [
        { label: 'Volume de certificats', value: `${group3(String(Math.round((ceeDetail?.volumeKWhc || 0))))} kWh cumac` },
        { label: 'Valeur de la prime (base)', value: fmt0(ceeDetail?.ceeEuros || 0) },
        { label: 'Part reversée au client', value: `${ceeDetail?.ceePercent ?? 100} %` },
        { label: 'Saut de classes DPE visé', value: `${jumps} classes (${classInitiale} vers ${classCible})` },
        { label: 'Montant de la prime CEE', value: fmt0(aid), highlight: true },
      ]
  const calcH = drawCalcCard(doc, MX, y, halfW, calcRows)

  const cx2 = MX + halfW + 6
  const cy2Start = y
  let cy2 = y
  if (isAnah) {
    // Barème en vigueur depuis le 01/01/2026 : 30 000 € HT (2 sauts), 40 000 € HT (3 sauts et plus)
    const marge = Math.max(0, (mprPlafond || 0) - (mprDepenseEligible || 0))
    const trancheLabel = jumps >= 3 ? 'un saut de 3 classes ou plus' : `un saut de ${jumps} classes`
    cy2 += callout(doc, cx2, cy2, halfW, marge > 500
      ? [
          { text: 'Marge sous le plafond.', bold: true },
          {
            text: `Pour ${trancheLabel}, la dépense subventionnable est plafonnée à ${fmt0(mprPlafond)} HT. Votre projet reste en dessous : ${fmt0(marge)} HT de travaux supplémentaires pourraient encore être financés, soit jusqu’à ${fmt0(marge * (mprTaux || 0))} d’aide en plus.`,
          },
        ]
      : [
          { text: 'Plafond atteint.', bold: true },
          {
            text: `Pour ${trancheLabel}, la dépense subventionnable est plafonnée à ${fmt0(mprPlafond)} HT, barème de l’Anah en vigueur en 2026. La part des travaux au-delà de ce plafond reste à votre charge.`,
          },
        ]) + 3
    cy2 += callout(doc, cx2, cy2, halfW, [
      { text: 'Avance possible.', bold: true },
      { text: 'Une avance sur l’aide peut être demandée avant les travaux. Elle est demandée et versée directement au bénéficiaire, jamais à l’entreprise.' },
    ], { accent: C.violet, bg: C.violet050, titleColor: [76, 63, 196] })
  } else {
    cy2 += callout(doc, cx2, cy2, halfW, [
      { text: 'Prime déduite de la facture.', bold: true },
      { text: 'La prime CEE est versée par le délégataire après réception des travaux et peut être déduite directement du montant à régler.' },
    ]) + 3
    cy2 += callout(doc, cx2, cy2, halfW, [
      { text: 'Engagement avant devis.', bold: true },
      { text: 'Le dossier CEE doit être engagé avant la signature du devis : la date de l’accord conditionne le versement de la prime.' },
    ], { accent: C.violet, bg: C.violet050, titleColor: [76, 63, 196] })
  }
  y += Math.max(calcH, cy2 - cy2Start)

  y += 4.4
  y = sectionTitle(doc, isAnah ? 'Le parcours accompagné, étape par étape' : 'Votre dossier, étape par étape', MX, y, CW)
  const steps = isAnah
    ? [
        { title: 'Mon Accompagnateur Rénov’', detail: 'Désignation de votre accompagnateur agréé, obligatoire dans ce parcours.' },
        { title: 'Audit énergétique du logement', detail: 'Il définit le scénario de travaux et le saut de classes atteignable.' },
        { title: 'Devis d’entreprises RGE', detail: 'Tous les postes de travaux doivent être réalisés par des professionnels RGE.' },
        { title: 'Dépôt du dossier', detail: 'Impérativement avant la signature des devis et le démarrage des travaux.' },
        { title: 'Notification d’accord', detail: 'L’Anah confirme le montant de subvention accordé.' },
        { title: 'Réalisation des travaux', detail: 'Suivi de chantier et coordination des différents corps d’état.' },
        { title: 'Audit et contrôle après travaux', detail: 'Vérification du gain énergétique réellement obtenu.' },
        { title: 'Versement de l’aide', detail: 'Sur présentation des factures acquittées.' },
      ]
    : [
        { title: 'Étude et devis', detail: 'Chiffrage des postes de travaux et vérification des critères de la fiche.' },
        { title: 'Engagement du dossier CEE', detail: 'Enregistrement de l’offre avant la signature du devis.' },
        { title: 'Signature du devis', detail: 'Une fois le dossier CEE engagé, jamais avant.' },
        { title: 'Audit énergétique', detail: 'Il justifie le saut de classes visé par le projet.' },
        { title: 'Réalisation des travaux', detail: 'Par des entreprises certifiées RGE.' },
        { title: 'Audit après travaux', detail: 'Vérification de la performance atteinte.' },
        { title: 'Dépôt des pièces', detail: 'Factures, attestation sur l’honneur et audits.' },
        { title: 'Versement de la prime', detail: 'Après validation du dossier par le délégataire.' },
      ]
  const stepsLeft = drawSteps(doc, MX, y + 2.6, halfW, steps.slice(0, 4), 1)
  const stepsRight = drawSteps(doc, MX + halfW + 6, y + 2.6, halfW, steps.slice(4), 5)
  y += Math.max(stepsLeft, stepsRight) + 2.6

  y += 4.4
  y = sectionTitle(doc, 'Conditions à respecter et bénéfices attendus', MX, y, CW)
  const conditions = isAnah
    ? [
        { strong: 'Logement de plus de 15 ans,', rest: ' occupé à titre de résidence principale.' },
        { strong: 'Engagement d’occupation', rest: ' du logement pendant au moins 3 ans après les travaux.' },
        { strong: 'Au moins deux gestes d’isolation', rest: ' parmi les postes retenus au projet.' },
        { strong: 'Saut minimum de 2 classes DPE', rest: ` depuis une classe E, F ou G, le projet en vise ${jumps}.` },
        { strong: 'Aucun équipement fossile', rest: ' : ni chauffage ni eau chaude au gaz, au fioul ou au charbon après travaux.' },
        { strong: 'Entreprises certifiées RGE', rest: ' pour l’ensemble des postes.' },
      ]
    : [
        { strong: 'Maison classée E, F ou G', rest: ' avant travaux, selon l’audit énergétique.' },
        { strong: 'Dossier engagé avant devis', rest: ' : c’est la condition de recevabilité de la prime.' },
        { strong: 'Au moins deux gestes d’isolation', rest: ' parmi les postes retenus au projet.' },
        { strong: 'Saut minimum de 2 classes DPE', rest: `, le projet en vise ${jumps}.` },
        { strong: 'Aucun équipement fossile', rest: ' : ni chauffage ni eau chaude au gaz, au fioul ou au charbon après travaux.' },
      ]
  const benefits = [
    { strong: 'Facture de chauffage réduite', rest: ' durablement grâce à l’isolation et au nouveau système de chauffage.' },
    { strong: 'Confort été comme hiver', rest: ' : suppression des parois froides et des courants d’air.' },
    { strong: 'Valorisation immobilière', rest: ` : un logement classé ${classCible || 'performant'} se revend et se loue nettement mieux.` },
  ]
  if (['F', 'G'].includes(classInitiale)) {
    benefits.unshift({ strong: 'Sortie de passoire énergétique', rest: ' : votre bien n’est plus concerné par les restrictions de location des logements F et G.' })
  }
  const bl = drawBullets(doc, MX, y + 2.6, halfW, conditions)
  const br = drawBullets(doc, MX + halfW + 6, y + 2.6, halfW, benefits)
  y += Math.max(bl, br) + 2.6

  y += 3
  y += callout(doc, MX, y, CW, [
    { text: 'Et pour le reste à charge ?', bold: true },
    {
      text: `L’éco-prêt à taux zéro « rénovation globale » permet d’emprunter jusqu’à 50 000 €, remboursables sur 20 ans maximum, sans aucun intérêt, de quoi lisser les ${fmt0(rac)} restants sur une mensualité proche de l’économie d’énergie réalisée. Nous étudions ce montage avec vous.`,
    },
  ])

  y += 3.5
  doc.setFontSize(6.4)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  const mentions = isAnah
    ? `Simulation établie sur la base de MaPrimeRénov’ Parcours Accompagné seule ; aucune aide CEE n’est comptabilisée sur ces travaux, leur valorisation étant réservée à l’Anah. Les montants indiqués sont donnés à titre indicatif, sous réserve de l’éligibilité définitive du logement et du ménage, de l’audit énergétique et des devis d’entreprises. Le total des aides publiques ne peut excéder ${mprCategory === 'Jaune' ? '90' : '100'} % de la dépense TTC. Document non contractuel.`
    : 'Simulation établie sur la base de la fiche CEE BAR-TH-174. Les montants indiqués sont donnés à titre indicatif, sous réserve de l’éligibilité définitive du logement, de l’audit énergétique et des devis d’entreprises. Document non contractuel.'
  doc.splitTextToSize(clean(mentions), CW).forEach((l, i) => doc.text(l, MX, y + i * 2.8))

  // Pieds de page une fois le nombre total de pages connu
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    footer(doc, { company, page: p, pages })
  }

  return doc
}

/** Génère et télécharge le PDF. */
export function generateRenoGlobalePDF(data) {
  const doc = buildRenoGlobalePDF(data)
  const client = data.client
  const safeName = client
    ? `${client.lastName || ''}_${client.firstName || ''}`.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') + '_'
    : ''
  doc.save(`plan_financement_${safeName}${data.ficheCode || 'BAR-TH-174'}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
