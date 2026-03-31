import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = {
  primary: [30, 27, 75],
  primaryLight: [99, 102, 241],
  green: [22, 101, 52],
  greenLight: [34, 197, 94],
  blue: [37, 99, 235],
  blueLight: [59, 130, 246],
  orange: [234, 88, 12],
  orangeLight: [251, 146, 60],
  text: [30, 41, 59],
  textLight: [100, 116, 139],
  border: [226, 232, 240],
  bgLight: [248, 250, 252],
  yellow: [234, 179, 8],
  white: [255, 255, 255],
}

function fmt(amount) {
  const rounded = Math.round(amount || 0)
  const str = Math.abs(rounded).toString()
  const parts = []
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i))
  }
  return (rounded < 0 ? '-' : '') + parts.join(' ') + ' \u20AC'
}

/**
 * Nettoie une chaine pour jsPDF (remplace les caracteres speciaux non supportes)
 */
function sanitize(str) {
  return (str || '')
    .replace(/\u2192/g, '->')  // →
    .replace(/\u2190/g, '<-')  // ←
    .replace(/\u2265/g, '>=')  // ≥
    .replace(/\u2264/g, '<=')  // ≤
    .replace(/\u00A0/g, ' ')   // espace insecable
    .replace(/\u202F/g, ' ')   // espace fine insecable
    .replace(/\u2009/g, ' ')   // thin space
    .replace(/\u00e9/g, 'e')   // é
    .replace(/\u00e8/g, 'e')   // è
    .replace(/\u00ea/g, 'e')   // ê
    .replace(/\u00e0/g, 'a')   // à
    .replace(/\u00f4/g, 'o')   // ô
    .replace(/\u00e7/g, 'c')   // ç
    .replace(/\u00ee/g, 'i')   // î
    .replace(/\u00fb/g, 'u')   // û
}

function fmtNum(value) {
  const rounded = Math.round(value || 0)
  const str = Math.abs(rounded).toString()
  const parts = []
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i))
  }
  return (rounded < 0 ? '-' : '') + parts.join(' ')
}

/**
 * Genere un PDF de proposition commerciale pour un scenario de travaux.
 *
 * @param {Object} opts
 * @param {Object} opts.company       - Infos societe (useSettings)
 * @param {Object} opts.project       - Projet/beneficiaire
 * @param {Object} opts.scenario      - Scenario avec simulations[]
 * @param {Object} opts.totals        - Totaux du scenario (getScenarioTotals)
 * @param {string} [opts.validityDays] - Duree de validite (jours)
 */
export function generateProposalPDF({
  company = {},
  project = {},
  scenario = {},
  totals = {},
  validityDays = 30,
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const W = doc.internal.pageSize.getWidth()   // 210
  const H = doc.internal.pageSize.getHeight()   // 297
  const mx = 15
  const cw = W - mx * 2
  const rightCol = W - mx - 5
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const validUntil = new Date(Date.now() + validityDays * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  let y = 0

  // ─────────────────────────────────────────────
  //  PAGE 1 — EN-TETE + CLIENT + RECAP FINANCIER
  // ─────────────────────────────────────────────

  // ── Bandeau societe ──
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, W, 42, 'F')

  if (company.logo) {
    try { doc.addImage(company.logo, 'AUTO', mx, 6, 28, 28) } catch (e) { /* skip */ }
  }

  const hx = company.logo ? mx + 33 : mx
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name || 'Artex360', hx, 18)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const lines = []
  if (company.address) lines.push(company.address)
  if (company.postalCode || company.city) lines.push(`${company.postalCode || ''} ${company.city || ''}`.trim())
  if (company.phone) lines.push(`Tel : ${company.phone}`)
  if (company.email) lines.push(company.email)
  lines.forEach((l, i) => doc.text(l, hx, 24 + i * 3.5))

  if (company.siret || company.rge) {
    doc.setFontSize(7)
    doc.setTextColor(200, 200, 220)
    if (company.siret) doc.text(`SIRET : ${company.siret}`, W - mx, 17, { align: 'right' })
    if (company.rge) doc.text(`RGE : ${company.rge}`, W - mx, 21, { align: 'right' })
  }

  y = 50

  // ── Titre du document ──
  doc.setFillColor(...COLORS.primaryLight)
  doc.roundedRect(mx, y, cw, 14, 3, 3, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PROPOSITION COMMERCIALE', W / 2, y + 9.5, { align: 'center' })
  y += 20

  // ── Infos client + date ──
  const clientName = `${project.firstName || ''} ${project.lastName || ''}`.trim() || 'Client'
  const clientAddress = [project.address, project.postalCode, project.city].filter(Boolean).join(', ')

  // Bloc client a gauche
  doc.setFillColor(...COLORS.bgLight)
  doc.roundedRect(mx, y, cw * 0.55, 32, 2, 2, 'F')
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(mx, y, cw * 0.55, 32, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  doc.setFont('helvetica', 'bold')
  doc.text('BENEFICIAIRE', mx + 4, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.text)
  doc.text(clientName, mx + 4, y + 13)
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  if (clientAddress) doc.text(clientAddress, mx + 4, y + 18)
  if (project.phone) doc.text(`Tel : ${project.phone}`, mx + 4, y + 23)
  if (project.email) doc.text(project.email, mx + 4, y + 28)

  // Bloc date/ref a droite
  const rightBlockX = mx + cw * 0.58
  const rightBlockW = cw * 0.42
  doc.setFillColor(...COLORS.bgLight)
  doc.roundedRect(rightBlockX, y, rightBlockW, 32, 2, 2, 'F')
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(rightBlockX, y, rightBlockW, 32, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  doc.setFont('helvetica', 'bold')
  doc.text('REFERENCE', rightBlockX + 4, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.text(`Date : ${dateStr}`, rightBlockX + 4, y + 13)
  doc.text(`Scenario : ${sanitize(scenario.name || 'Principal')}`, rightBlockX + 4, y + 18)
  doc.text(`Validite : ${validUntil}`, rightBlockX + 4, y + 23)

  // Categorie et logement
  const infoParts = []
  if (project.category) infoParts.push(`Profil : ${project.category}`)
  if (project.typeLogement) infoParts.push(project.typeLogement === 'maison' ? 'Maison' : 'Appartement')
  if (project.surface) infoParts.push(`${project.surface} m2`)
  if (infoParts.length > 0) {
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.primaryLight)
    doc.text(infoParts.join('  |  '), rightBlockX + 4, y + 28)
  }

  y += 40

  // ── Scenario : titre ──
  const simCount = (scenario.simulations || []).length
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.text)
  doc.text(`Scenario : ${sanitize(scenario.name || 'Principal')}`, mx, y)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)
  doc.text(`${simCount} poste${simCount > 1 ? 's' : ''} de travaux`, mx, y + 5)
  y += 10

  // ── Tableau des postes de travaux ──
  const sims = scenario.simulations || []
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
    head: [['Poste de travaux', 'Cout TTC', 'Prime CEE', "MPR", 'Total Aides', 'Reste a charge']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: cw * 0.28, fontStyle: 'bold' },
      1: { cellWidth: cw * 0.14, halign: 'right' },
      2: { cellWidth: cw * 0.14, halign: 'right', textColor: COLORS.green },
      3: { cellWidth: cw * 0.14, halign: 'right', textColor: COLORS.blue },
      4: { cellWidth: cw * 0.15, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: cw * 0.15, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  })

  y = doc.lastAutoTable.finalY + 2

  // ── Ligne TOTAUX ──
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
      fontSize: 9,
      textColor: COLORS.text,
      cellPadding: 3,
      fontStyle: 'bold',
      fillColor: [238, 242, 255],
    },
    columnStyles: {
      0: { cellWidth: cw * 0.28 },
      1: { cellWidth: cw * 0.14, halign: 'right' },
      2: { cellWidth: cw * 0.14, halign: 'right', textColor: COLORS.green },
      3: { cellWidth: cw * 0.14, halign: 'right', textColor: COLORS.blue },
      4: { cellWidth: cw * 0.15, halign: 'right' },
      5: { cellWidth: cw * 0.15, halign: 'right', textColor: COLORS.orange },
    },
  })

  y = doc.lastAutoTable.finalY + 8

  // ── Bloc SYNTHESE FINANCIERE ──
  const synthPad = 12  // padding interne du bloc
  const synthH = scenario.ptz ? 64 : 52
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(mx, y, cw, synthH, 3, 3, 'F')

  const synthLeft = mx + synthPad
  const synthRight = W - mx - synthPad

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('SYNTHESE FINANCIERE', synthLeft, y + 10)

  let sy = y + 20
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // Cout total
  doc.setTextColor(180, 190, 220)
  doc.text('Cout total des travaux :', synthLeft, sy)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(totals.totalCost), synthRight, sy, { align: 'right' })
  sy += 7

  // Prime CEE
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 190, 220)
  doc.text('Prime CEE :', synthLeft, sy)
  doc.setTextColor(...COLORS.yellow)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(totals.totalCee), synthRight, sy, { align: 'right' })
  sy += 7

  // MPR
  if (totals.totalMpr > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 190, 220)
    doc.text("MaPrimeRenov' :", synthLeft, sy)
    doc.setTextColor(...COLORS.greenLight)
    doc.setFont('helvetica', 'bold')
    doc.text(fmt(totals.totalMpr), synthRight, sy, { align: 'right' })
    sy += 7
  }

  // PTZ
  if (scenario.ptz && totals.ptzMontant > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 190, 220)
    doc.text(`Pret a Taux Zero (PTZ) — ${scenario.ptz.dureeTotale} ans :`, synthLeft, sy)
    doc.setTextColor(...COLORS.primaryLight)
    doc.setFont('helvetica', 'bold')
    doc.text(fmt(totals.ptzMontant), synthRight, sy, { align: 'right' })
    sy += 7
  }

  // Separateur
  doc.setDrawColor(80, 70, 140)
  doc.line(synthLeft, sy, synthRight, sy)
  sy += 8

  // Reste a charge
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(180, 190, 220)
  doc.text('RESTE A CHARGE :', synthLeft, sy)
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(14)
  doc.text(fmt(totals.resteACharge), synthRight, sy, { align: 'right' })

  y += synthH + 8

  // ── Barre de repartition visuelle ──
  if (totals.totalCost > 0) {
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textLight)
    doc.setFont('helvetica', 'bold')
    doc.text('REPARTITION DU FINANCEMENT', mx, y)
    y += 4

    const barH = 8
    let bx = mx

    // CEE
    if (totals.totalCee > 0) {
      const ceePct = totals.totalCee / totals.totalCost
      const ceeW = Math.max(8, cw * ceePct)
      doc.setFillColor(...COLORS.green)
      doc.roundedRect(bx, y, ceeW, barH, 1, 1, 'F')
      doc.setFontSize(6)
      doc.setTextColor(...COLORS.white)
      doc.setFont('helvetica', 'bold')
      if (ceeW > 15) doc.text('CEE', bx + ceeW / 2, y + 5.5, { align: 'center' })
      bx += ceeW
    }

    // MPR
    if (totals.totalMpr > 0) {
      const mprPct = totals.totalMpr / totals.totalCost
      const mprW = Math.max(8, cw * mprPct)
      doc.setFillColor(...COLORS.blue)
      doc.rect(bx, y, mprW, barH, 'F')
      doc.setFontSize(6)
      doc.setTextColor(...COLORS.white)
      if (mprW > 15) doc.text('MPR', bx + mprW / 2, y + 5.5, { align: 'center' })
      bx += mprW
    }

    // RAC
    if (totals.resteACharge > 0) {
      const racW = W - mx - bx
      doc.setFillColor(...COLORS.orangeLight)
      doc.roundedRect(bx, y, racW, barH, 1, 1, 'F')
      doc.setFontSize(6)
      doc.setTextColor(...COLORS.white)
      if (racW > 15) doc.text('RAC', bx + racW / 2, y + 5.5, { align: 'center' })
    }

    y += barH + 4

    // Legende
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.textLight)
    const legend = []
    if (totals.totalCee > 0) legend.push(`CEE : ${fmt(totals.totalCee)} (${Math.round(totals.totalCee / totals.totalCost * 100)}%)`)
    if (totals.totalMpr > 0) legend.push(`MPR : ${fmt(totals.totalMpr)} (${Math.round(totals.totalMpr / totals.totalCost * 100)}%)`)
    legend.push(`RAC : ${fmt(totals.resteACharge)} (${Math.round(totals.resteACharge / totals.totalCost * 100)}%)`)
    doc.text(legend.join('   |   '), mx, y)
    y += 8
  }

  // ── PTZ details ──
  if (scenario.ptz && totals.ptzMontant > 0) {
    doc.setFillColor(238, 242, 255)
    doc.roundedRect(mx, y, cw, 22, 2, 2, 'F')
    doc.setDrawColor(...COLORS.primaryLight)
    doc.roundedRect(mx, y, cw, 22, 2, 2, 'S')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primaryLight)
    doc.text('Pret a Taux Zero (PTZ) — Bareme 2026', mx + 5, y + 7)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.text)
    const ptzInfo = `Montant : ${fmt(totals.ptzMontant)}  |  Mensualite : ${fmt(scenario.ptz.mensualite || 0)}/mois  |  Differe : ${scenario.ptz.dureeDiffere || 0} ans  |  Duree totale : ${scenario.ptz.dureeTotale || 0} ans`
    doc.text(ptzInfo, mx + 5, y + 15)

    y += 28
  }

  // ── Detail des simulations ──
  if (sims.length > 0) {
    // Verifier si on a assez de place, sinon nouvelle page
    if (y > H - 80) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.text)
    doc.text('DETAIL DES POSTES DE TRAVAUX', mx, y)
    y += 6

    sims.forEach((sim, idx) => {
      const r = sim.results || {}
      const inp = sim.inputs || {}

      // Verifier place restante
      if (y > H - 50) {
        doc.addPage()
        y = 20
      }

      // Titre du poste
      doc.setFillColor(...COLORS.bgLight)
      doc.roundedRect(mx, y, cw, 10, 2, 2, 'F')
      doc.setDrawColor(...COLORS.border)
      doc.roundedRect(mx, y, cw, 10, 2, 2, 'S')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primaryLight)
      doc.text(`${idx + 1}. ${sim.type || ''}`, mx + 4, y + 6.5)
      doc.setTextColor(...COLORS.text)
      doc.text(sanitize(sim.title || 'Travaux'), mx + 4 + doc.getTextWidth(`${idx + 1}. ${sim.type || ''}  `), y + 6.5)
      y += 14

      // Parametres cles
      const details = []
      if (inp.surface) details.push(['Surface', `${inp.surface} m2`])
      if (inp.zone) details.push(['Zone climatique', inp.zone])
      if (inp.housingType) details.push(['Type de logement', inp.housingType])
      if (inp.mprCategory) details.push(['Profil revenus', inp.mprCategory])
      if (inp.insulationType) details.push(['Type isolation', inp.insulationType === 'combles' ? 'Combles perdus' : inp.insulationType === 'rampants' ? 'Rampants / toiture' : inp.insulationType])
      if (inp.etas) details.push(['Efficacite Etas', inp.etas === 'high' ? '>= 140%' : '111% a 140%'])
      if (inp.classInitiale && inp.classCible) details.push(['Saut energetique', `DPE ${inp.classInitiale} vers ${inp.classCible}`])

      const cee = r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
      const mpr = r.mprFinal || r.mprAmount || r.primeAmount || 0
      const cost = r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
      const aide = cee + mpr
      const rac = Math.max(0, cost - aide)

      details.push(['Cout TTC', fmt(cost)])
      if (cee > 0) details.push(['Prime CEE', fmt(cee)])
      if (mpr > 0) details.push(["MaPrimeRenov'", fmt(mpr)])
      details.push(['Reste a charge', fmt(rac)])

      autoTable(doc, {
        startY: y,
        margin: { left: mx + 4, right: mx + 4 },
        body: details,
        theme: 'plain',
        bodyStyles: {
          fontSize: 8,
          textColor: COLORS.text,
          cellPadding: 1.5,
        },
        columnStyles: {
          0: { cellWidth: (cw - 8) * 0.45, textColor: COLORS.textLight },
          1: { cellWidth: (cw - 8) * 0.55, halign: 'right', fontStyle: 'bold' },
        },
      })

      y = doc.lastAutoTable.finalY + 6
    })
  }

  // ── Conditions et mentions ──
  if (y > H - 50) {
    doc.addPage()
    y = 20
  }

  doc.setDrawColor(...COLORS.border)
  doc.line(mx, y, W - mx, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.text)
  doc.text('CONDITIONS', mx, y)
  y += 5

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)

  const conditions = [
    `Cette proposition est valable jusqu'au ${validUntil} (${validityDays} jours).`,
    "Les montants des primes CEE et MaPrimeRenov' sont donnes a titre indicatif et sous reserve d'eligibilite.",
    "Le reste a charge est calcule avant deduction d'eventuels autres financements (PTZ, eco-pret, etc.).",
    "Les travaux doivent etre realises par un professionnel RGE pour beneficier des aides.",
  ]

  conditions.forEach((c) => {
    doc.text(`- ${c}`, mx + 2, y, { maxWidth: cw - 4 })
    y += 5
  })

  y += 4

  // Zone signature
  if (y < H - 40) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.text)

    // Artisan
    doc.text('L\'artisan :', mx, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textLight)
    doc.text(company.name || '', mx, y + 5)
    doc.text('Date et signature :', mx, y + 15)
    doc.setDrawColor(...COLORS.border)
    doc.line(mx, y + 25, mx + 65, y + 25)

    // Client
    const sigX = W / 2 + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.text)
    doc.text('Le client :', sigX, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textLight)
    doc.text(clientName, sigX, y + 5)
    doc.text('Bon pour accord, date et signature :', sigX, y + 15)
    doc.line(sigX, y + 25, sigX + 65, y + 25)
  }

  // ── Footer / disclaimer ──
  const footerY = H - 12
  doc.setDrawColor(...COLORS.border)
  doc.line(mx, footerY - 3, W - mx, footerY - 3)

  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)
  doc.text(
    "Simulation indicative et non contractuelle. Les montants definitifs sont soumis a la validation des organismes de certification.",
    W / 2, footerY, { align: 'center', maxWidth: cw }
  )
  doc.text(
    `Document genere le ${dateStr} via Artex360 — Plateforme d'outils pour artisans en renovation energetique.`,
    W / 2, footerY + 4, { align: 'center', maxWidth: cw }
  )

  // ── Enregistrer ──
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
  const fileName = `proposition_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}
