import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const C = {
  primary: [17, 19, 24],
  text: [30, 41, 59],
  textMuted: [100, 116, 139],
  border: [226, 232, 240],
  surface: [248, 250, 252],
  white: [255, 255, 255],
  bleu: [37, 99, 235],
  bleuBg: [219, 234, 254],
  jaune: [245, 158, 11],
  jauneBg: [254, 243, 199],
  violet: [147, 51, 234],
  violetBg: [243, 232, 255],
  rose: [236, 72, 153],
  roseBg: [252, 231, 243],
  emerald: [16, 185, 129],
  indigo: [99, 102, 241],
}

const eur = (v) => `${Math.round(Number(v) || 0).toLocaleString('fr-FR')} €`
const pct = (v) => `${v || 0} %`

const DPE_COLORS = {
  A: [49, 152, 52], B: [51, 163, 87], C: [81, 184, 75],
  D: [242, 229, 0], E: [240, 180, 0], F: [235, 130, 53], G: [215, 34, 31],
}

const CAT_META = [
  { key: 'bleu', label: 'Bleu', sub: 'Très modestes', color: C.bleu, bg: C.bleuBg },
  { key: 'jaune', label: 'Jaune', sub: 'Modestes', color: C.jaune, bg: C.jauneBg },
  { key: 'violet', label: 'Violet', sub: 'Intermédiaires', color: C.violet, bg: C.violetBg },
  { key: 'rose', label: 'Rose', sub: 'Supérieurs', color: C.rose, bg: C.roseBg },
]

function drawDpeBadge(doc, letter, x, y) {
  const col = DPE_COLORS[letter] || [150, 150, 150]
  doc.setFillColor(...col)
  doc.roundedRect(x, y, 10, 8, 2, 2, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(letter, x + 5, y + 5.5, { align: 'center' })
}

export function generateEstimationImmoPdf(estimation) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pw = doc.internal.pageSize.getWidth()
  const m = 15
  const cw = pw - 2 * m
  let y = m

  // Header
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, pw, 28, 'F')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Estimation de Rénovation Énergétique', m, 13)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text(`Artex 360 — ${new Date().toLocaleDateString('fr-FR')}`, m, 20)
  if (estimation.agenceNom) {
    doc.text(`Agence : ${estimation.agenceNom}`, pw - m, 20, { align: 'right' })
  }
  y = 35

  // Info bien
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('Informations du bien', m, y)
  y += 6

  doc.setFillColor(...C.surface)
  doc.roundedRect(m, y, cw, 22, 2, 2, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)

  const col1 = m + 4
  const col2 = m + cw / 3
  const col3 = m + 2 * cw / 3

  doc.text('Adresse', col1, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(estimation.addressLabel || '—', col1, y + 10, { maxWidth: cw / 3 - 8 })

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Type / Surface', col2, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(`${estimation.typeLogement === 'appartement' ? 'Appartement' : 'Maison'} — ${estimation.surface || '?'} m²`, col2, y + 10)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('DPE', col3, y + 5)
  if (estimation.dpeActuel) drawDpeBadge(doc, estimation.dpeActuel, col3, y + 8)
  if (estimation.dpeActuel && estimation.dpeVise) {
    doc.setFontSize(7)
    doc.setTextColor(...C.textMuted)
    doc.text('→', col3 + 13, y + 13)
    drawDpeBadge(doc, estimation.dpeVise, col3 + 18, y + 8)
  }

  if (estimation.dossier) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text(`Réf: ${estimation.dossier}`, col1, y + 18)
  }

  y += 28

  // Détail travaux
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('Détail des travaux', m, y)
  y += 4

  const travauxRows = (estimation.travaux || []).map((t) => [
    t.label,
    t.ficheCode ? t.ficheCode.toUpperCase() : '—',
    t.quantite > 1 ? String(t.quantite) : '—',
    eur(t.prixTTC * (t.quantite || 1)),
  ])
  travauxRows.push(['Total TTC', '', '', eur(estimation.totalTravauxTTC)])

  autoTable(doc, {
    startY: y,
    margin: { left: m, right: m },
    head: [['Poste', 'Fiche CEE', 'Qté', 'Coût TTC']],
    body: travauxRows,
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: C.border, lineWidth: 0.15 },
    headStyles: { fillColor: C.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { textColor: C.text },
    alternateRowStyles: { fillColor: C.surface },
    columnStyles: { 0: { cellWidth: 70 }, 3: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === travauxRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = C.surface
      }
    },
  })

  y = doc.lastAutoTable.finalY + 10

  // Synthèse comparative
  if (y > 220) { doc.addPage(); y = m }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('Synthèse comparative des aides par catégorie de revenus', m, y)
  y += 6

  const synthese = estimation.synthese
  if (synthese) {
    const headRow = ['', ...CAT_META.map((c) => c.label)]
    const rows = [
      ['Prime CEE', ...CAT_META.map((c) => eur(synthese[c.key]?.cee))],
      ['MaPrimeRénov\'', ...CAT_META.map((c) => eur(synthese[c.key]?.mpr))],
      ['Total aides', ...CAT_META.map((c) => eur(synthese[c.key]?.totalAides))],
      ['Reste à charge', ...CAT_META.map((c) => eur(synthese[c.key]?.resteACharge))],
      ['Couverture', ...CAT_META.map((c) => pct(synthese[c.key]?.tauxCouverture))],
    ]

    autoTable(doc, {
      startY: y,
      margin: { left: m, right: m },
      head: [headRow],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3, lineColor: C.border, lineWidth: 0.15, halign: 'center' },
      headStyles: { fillColor: C.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: C.text },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 35 } },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index > 0) {
          data.cell.styles.fillColor = CAT_META[data.column.index - 1].color
        }
        if (data.section === 'body' && (data.row.index === 2 || data.row.index === 3)) {
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

    y = doc.lastAutoTable.finalY + 8

    // Détail par poste et par catégorie
    if (y > 240) { doc.addPage(); y = m }

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Détail des aides par poste', m, y)
    y += 4

    const detailHead = ['Poste', 'Coût TTC', 'Bleu', 'Jaune', 'Violet', 'Rose']
    const detailRows = (estimation.travaux || []).map((t, i) => {
      const cost = t.prixTTC * (t.quantite || 1)
      return [
        t.label,
        eur(cost),
        ...CAT_META.map((c) => {
          const d = synthese[c.key]?.detail?.[i]
          const aide = (d?.cee || 0) + (d?.mpr || 0)
          return aide > 0 ? eur(aide) : '—'
        }),
      ]
    })

    autoTable(doc, {
      startY: y,
      margin: { left: m, right: m },
      head: [detailHead],
      body: detailRows,
      styles: { fontSize: 7, cellPadding: 2, lineColor: C.border, lineWidth: 0.15, halign: 'center' },
      headStyles: { fillColor: C.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: C.text },
      columnStyles: { 0: { halign: 'left', cellWidth: 45 }, 1: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index >= 2) {
          data.cell.styles.fillColor = CAT_META[data.column.index - 2].color
        }
      },
    })
  }

  // Footer
  const ph = doc.internal.pageSize.getHeight()
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...C.textMuted)
  doc.text(
    'Estimation indicative — les montants réels dépendent de la catégorie de revenus du ménage acquéreur et des conditions en vigueur.',
    pw / 2, ph - 8, { align: 'center', maxWidth: cw }
  )

  // Notes
  if (estimation.notes) {
    const pageCount = doc.internal.getNumberOfPages()
    const lastPage = pageCount
    doc.setPage(lastPage)
    const curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200
    if (curY < ph - 25) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.textMuted)
      doc.text(`Notes : ${estimation.notes}`, m, curY, { maxWidth: cw })
    }
  }

  const filename = `estimation-${(estimation.dossier || estimation.addressLabel || 'immo').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  doc.save(filename)
}
