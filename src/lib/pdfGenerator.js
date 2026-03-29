import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = {
  primary: [30, 27, 75],       // indigo-900
  primaryLight: [99, 102, 241], // indigo-500
  green: [22, 101, 52],        // green-800
  greenLight: [34, 197, 94],
  text: [30, 41, 59],          // slate-800
  textLight: [100, 116, 139],  // slate-500
  border: [226, 232, 240],     // slate-200
  bgLight: [248, 250, 252],    // slate-50
  yellow: [234, 179, 8],
  red: [220, 38, 38],
  white: [255, 255, 255],
}

/**
 * Formate un montant en euros compatible jsPDF
 * Utilise des espaces normaux (pas insécables) pour que jsPDF les affiche correctement
 */
function formatCurrencyPDF(amount) {
  const rounded = Math.round(amount)
  // Formatage manuel avec espace normal comme séparateur de milliers
  const str = Math.abs(rounded).toString()
  const parts = []
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i))
  }
  const formatted = parts.join(' ')
  return (rounded < 0 ? '-' : '') + formatted + ' \u20AC'
}

/**
 * Formate un nombre avec séparateur de milliers compatible jsPDF
 */
function formatNumberPDF(value) {
  const rounded = Math.round(value)
  const str = Math.abs(rounded).toString()
  const parts = []
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i))
  }
  return (rounded < 0 ? '-' : '') + parts.join(' ')
}

/**
 * Génère un PDF de simulation
 * @param {Object} options
 * @param {Object} options.company - Infos société depuis useSettings
 * @param {string} options.ficheCode - Code de la fiche (BAR-TH-171, etc.)
 * @param {string} options.ficheTitle - Titre du simulateur
 * @param {Array} options.params - Paramètres [{label, value}]
 * @param {Array} options.results - Résultats [{label, value, highlight?}]
 * @param {Object} options.summary - Synthèse financière {ceeCommerciale, mprFinal, totalAid, resteACharge, projectCost}
 * @param {Object} options.margin - Marge CEE {ceeBase, ceeApplied, margin, marginPercent} (optionnel)
 * @param {string} options.clientName - Nom du client (optionnel)
 * @param {string} options.mode - 'anah' ou 'cee' pour rénovation globale (optionnel)
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
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 15
  const contentWidth = pageWidth - marginX * 2
  let y = 15

  // Reformater les valeurs pour le PDF (remplacer les espaces insécables)
  const cleanParams = params.map(p => ({
    label: p.label,
    value: sanitizeValue(String(p.value ?? '')),
  }))
  const cleanResults = results.map(r => ({
    label: r.label,
    value: sanitizeValue(String(r.value ?? '')),
    highlight: r.highlight,
  }))

  // ─── EN-TÊTE SOCIÉTÉ ───
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  // Logo société
  if (company.logo) {
    try {
      doc.addImage(company.logo, 'AUTO', marginX, 6, 28, 28)
    } catch (e) {
      // Logo invalide, on continue sans
    }
  }

  const headerX = company.logo ? marginX + 33 : marginX
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name || 'Simulation CEE', headerX, 17)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const companyLines = []
  if (company.address) companyLines.push(company.address)
  if (company.postalCode || company.city) companyLines.push(`${company.postalCode || ''} ${company.city || ''}`.trim())
  if (company.phone) companyLines.push(`Tel : ${company.phone}`)
  if (company.email) companyLines.push(company.email)
  companyLines.forEach((line, i) => {
    doc.text(line, headerX, 23 + i * 3.5)
  })

  // SIRET / RGE à droite
  if (company.siret || company.rge) {
    doc.setFontSize(7)
    doc.setTextColor(200, 200, 220)
    if (company.siret) doc.text(`SIRET : ${company.siret}`, pageWidth - marginX, 17, { align: 'right' })
    if (company.rge) doc.text(`RGE : ${company.rge}`, pageWidth - marginX, 21, { align: 'right' })
  }

  y = 48

  // ─── TITRE DE LA SIMULATION ───
  doc.setFillColor(...COLORS.bgLight)
  doc.roundedRect(marginX, y, contentWidth, 18, 3, 3, 'F')
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(marginX, y, contentWidth, 18, 3, 3, 'S')

  doc.setTextColor(...COLORS.primaryLight)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(ficheCode, marginX + 5, y + 6)

  doc.setTextColor(...COLORS.text)
  doc.setFontSize(13)
  doc.text(ficheTitle, marginX + 5, y + 13)

  if (mode) {
    const modeLabel = mode === 'anah' ? "MaPrimeRenov' Parcours Accompagne" : '100% CEE'
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.primaryLight)
    doc.text(modeLabel, pageWidth - marginX - 5, y + 10, { align: 'right' })
  }

  y += 24

  // ─── DATE ET CLIENT ───
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Date : ${dateStr}`, marginX, y)
  if (clientName) {
    doc.text(`Client : ${clientName}`, pageWidth - marginX, y, { align: 'right' })
  }

  y += 8

  // ─── PARAMÈTRES ───
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.text)
  doc.text('Parametres de la simulation', marginX, y)
  y += 2

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Parametre', 'Valeur']],
    body: cleanParams.map(p => [p.label, p.value]),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.50, fontStyle: 'bold' },
      1: { cellWidth: contentWidth * 0.50, halign: 'right' },
    },
  })

  y = doc.lastAutoTable.finalY + 8

  // ─── RÉSULTATS CEE ───
  if (cleanResults.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.text)
    doc.text('Resultats du calcul', marginX, y)
    y += 2

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Indicateur', 'Valeur']],
      body: cleanResults.map(r => [r.label, r.value]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primaryLight,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.text,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [238, 242, 255],
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.50, fontStyle: 'bold' },
        1: { cellWidth: contentWidth * 0.50, halign: 'right' },
      },
    })

    y = doc.lastAutoTable.finalY + 8
  }

  // ─── SYNTHÈSE FINANCIÈRE ───
  // Calcul dynamique de la hauteur du bloc
  let blockLines = 0
  if (summary.projectCost) blockLines++
  if (summary.ceeCommerciale !== undefined) blockLines++
  if (summary.showMpr !== false && summary.mprFinal !== undefined && summary.mprFinal > 0) blockLines++
  // +2 pour total aides + reste a charge + séparateur + padding
  const synthBlockH = 18 + (blockLines * 7) + 22

  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(marginX, y, contentWidth, synthBlockH, 3, 3, 'F')

  const rightCol = pageWidth - marginX - 8

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Synthese Financiere', marginX + 8, y + 8)

  let sy = y + 16
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // Coût projet
  if (summary.projectCost) {
    doc.setTextColor(180, 190, 220)
    doc.text('Cout du projet :', marginX + 8, sy)
    doc.setTextColor(...COLORS.white)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrencyPDF(summary.projectCost), rightCol, sy, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    sy += 7
  }

  // CEE
  if (summary.ceeCommerciale !== undefined) {
    doc.setTextColor(180, 190, 220)
    doc.text('Prime CEE deduite :', marginX + 8, sy)
    doc.setTextColor(...COLORS.yellow)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrencyPDF(summary.ceeCommerciale), rightCol, sy, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    sy += 7
  }

  // MPR
  if (summary.showMpr !== false && summary.mprFinal !== undefined && summary.mprFinal > 0) {
    doc.setTextColor(180, 190, 220)
    doc.text("MaPrimeRenov' :", marginX + 8, sy)
    doc.setTextColor(...COLORS.greenLight)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrencyPDF(summary.mprFinal), rightCol, sy, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    sy += 7
  }

  // Ligne séparatrice
  doc.setDrawColor(80, 70, 140)
  doc.line(marginX + 8, sy, pageWidth - marginX - 8, sy)
  sy += 6

  // Total Aides
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.white)
  doc.text('TOTAL AIDES :', marginX + 8, sy)
  doc.setTextColor(...COLORS.yellow)
  doc.setFontSize(12)
  doc.text(formatCurrencyPDF(summary.totalAid || 0), rightCol, sy, { align: 'right' })
  sy += 8

  // Reste à charge
  doc.setFontSize(10)
  doc.setTextColor(180, 190, 220)
  doc.text('RESTE A CHARGE :', marginX + 8, sy)
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(11)
  doc.text(formatCurrencyPDF(summary.resteACharge || 0), rightCol, sy, { align: 'right' })

  y = sy + 12

  // ─── MARGE CEE (optionnel — ne pas mettre sur le PDF client) ───
  if (margin && margin.showOnPdf) {
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(marginX, y, contentWidth, 22, 3, 3, 'F')
    doc.setDrawColor(147, 197, 253)
    doc.roundedRect(marginX, y, contentWidth, 22, 3, 3, 'S')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('Marge CEE (usage interne)', marginX + 5, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(8)
    doc.text(
      `Base 100% : ${formatCurrencyPDF(margin.ceeBase)}  |  Appliquee : ${formatCurrencyPDF(margin.ceeApplied)}  |  Marge : ${formatCurrencyPDF(margin.margin)} (${Math.round(margin.marginPercent)}%)`,
      marginX + 5, y + 14
    )

    y += 28
  }

  // ─── DISCLAIMER ───
  const disclaimerY = Math.max(y + 5, pageHeight - 25)
  doc.setDrawColor(...COLORS.border)
  doc.line(marginX, disclaimerY - 3, pageWidth - marginX, disclaimerY - 3)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)
  doc.text(
    `Simulation basee sur la fiche CEE ${ficheCode} et la reglementation en vigueur. Montants donnes a titre indicatif et non contractuels.`,
    pageWidth / 2, disclaimerY + 1, { align: 'center', maxWidth: contentWidth }
  )
  doc.text(
    `Document genere le ${dateStr} via Artex360 - Plateforme d'outils pour artisans en renovation energetique.`,
    pageWidth / 2, disclaimerY + 6, { align: 'center', maxWidth: contentWidth }
  )

  // ─── ENREGISTRER ───
  const fileName = `simulation_${ficheCode}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}

/**
 * Nettoie les valeurs pour le PDF :
 * - Remplace les espaces insécables (U+00A0, U+202F) par des espaces normaux
 * - Remplace le symbole € encodé par le texte
 */
function sanitizeValue(str) {
  return str
    .replace(/\u00A0/g, ' ')   // espace insécable → espace normal
    .replace(/\u202F/g, ' ')   // espace fine insécable → espace normal
    .replace(/\u2009/g, ' ')   // thin space → espace normal
}
