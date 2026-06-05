import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ── Palette Artex ── */
const C = {
  primary: [17, 19, 24],
  brand: [116, 191, 22],
  brandDark: [74, 122, 15],
  brandBg: [245, 255, 235],
  indigo: [99, 102, 241],
  indigoBg: [238, 242, 255],
  amber: [245, 158, 11],
  emerald: [16, 185, 129],
  emeraldBg: [236, 253, 245],
  red: [239, 68, 68],
  text: [30, 41, 59],
  textMuted: [100, 116, 139],
  border: [226, 232, 240],
  surface: [248, 250, 252],
  white: [255, 255, 255],
}

const eur = (v) => `${Math.round(Number(v) || 0).toLocaleString('fr-FR')} EUR`
const kwh = (v) => `${Math.round(Number(v) || 0).toLocaleString('fr-FR')} kWh`

/* ── Drawing helpers ── */
function drawCard(doc, x, y, w, h, { radius = 3, fill = C.white } = {}) {
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, w, h, radius, radius, 'F')
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, w, h, radius, radius, 'S')
}

function drawSection(doc, title, x, y, accent = C.indigo) {
  doc.setFillColor(...accent)
  doc.roundedRect(x, y, 1.2, 6, 0.6, 0.6, 'F')
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text(title, x + 5, y + 4.2)
  return y + 10
}

function drawKpi(doc, x, y, w, label, value, sub, accent = C.indigo) {
  drawCard(doc, x, y, w, 26)
  doc.setFillColor(...accent)
  doc.roundedRect(x + 4, y + 4, 6, 6, 1.5, 1.5, 'F')
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text(label, x + 13, y + 8.5)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text(value, x + 4, y + 20)
  if (sub) {
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text(sub, x + 4, y + 24)
  }
}

function drawRow(doc, label, value, x, y, w, alt = false) {
  if (alt) {
    doc.setFillColor(...C.surface)
    doc.rect(x, y - 3, w, 6, 'F')
  }
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text(label, x + 3, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(String(value), x + w - 3, y, { align: 'right' })
}

/**
 * Generate a professional PV simulation PDF.
 */
export function generatePvPdf({
  kwc, nbPanneaux, production, consoAnnuelle,
  fin, batteryKwh, autoconsoRate,
  addressLabel, regionLabel, orientation, inclinaison,
  scenarios, financing, loanRate, loanDuration,
  monthlyVsConso,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 14
  const pw = W - 2 * M // page width usable

  // ═══════ HEADER ═══════
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, 36, 'F')
  doc.setFillColor(...C.brand)
  doc.rect(0, 36, W, 2, 'F')

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Etude Photovoltaique', M, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 190, 210)
  doc.text('Production, economies & rentabilite estimees', M, 23)

  doc.setFontSize(8)
  doc.setTextColor(150, 160, 180)
  doc.text(`Artex360 — ${new Date().toLocaleDateString('fr-FR')}`, M, 31)

  if (addressLabel) {
    doc.setFontSize(8)
    doc.setTextColor(...C.white)
    doc.text(addressLabel, W - M, 16, { align: 'right' })
  }

  let y = 44

  // ═══════ HERO — Installation ═══════
  drawCard(doc, M, y, pw, 28, { fill: [79, 70, 229] }) // indigo-600
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 255)

  const col3 = pw / 3
  doc.text('INSTALLATION', M + 6, y + 7)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(`${kwc} kWc`, M + 6, y + 16)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 255)
  doc.text(`${nbPanneaux} panneaux${batteryKwh > 0 ? ` + batterie ${batteryKwh} kWh` : ''}`, M + 6, y + 22)

  doc.text('PRODUCTION', M + col3 + 4, y + 7)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(kwh(production.annualKwh), M + col3 + 4, y + 16)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 255)
  doc.text(`par an — ${regionLabel}`, M + col3 + 4, y + 22)

  doc.text('COUVERTURE', M + col3 * 2 + 4, y + 7)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(`${fin.tauxCouvertureProd} %`, M + col3 * 2 + 4, y + 16)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 255)
  doc.text(`autoconso ${fin.autoconsoEffective}%`, M + col3 * 2 + 4, y + 22)

  y += 34

  // ═══════ KPIs ═══════
  const kpiW = (pw - 6) / 4
  drawKpi(doc, M, y, kpiW, 'Cout net', eur(fin.coutNet), `${eur(fin.coutBrut)} - ${eur(fin.prime)} prime`, C.indigo)
  drawKpi(doc, M + kpiW + 2, y, kpiW, 'Economie an 1', eur(fin.economieAn1), `${fin.tauxAutoproduction}% autoproduction`, C.emerald)
  drawKpi(doc, M + (kpiW + 2) * 2, y, kpiW, 'Amortissement', fin.paybackAnnee ? `${fin.paybackAnnee.toFixed(1)} ans` : '> duree vie', 'Retour sur investissement', C.amber)
  drawKpi(doc, M + (kpiW + 2) * 3, y, kpiW, `Gain net 30 ans`, eur(fin.gainNetFinal), `ROI ${fin.roi}%`, C.indigo)

  y += 32

  // ═══════ Détails techniques ═══════
  y = drawSection(doc, 'Caracteristiques de l\'installation', M, y)
  drawCard(doc, M, y, pw, 38)
  const rows = [
    ['Puissance', `${kwc} kWc (${nbPanneaux} panneaux)`],
    ['Region', regionLabel],
    ['Orientation / Inclinaison', `${orientation} / ${inclinaison} deg`],
    ['Consommation annuelle', kwh(consoAnnuelle)],
    ['Autoconsommation', `${fin.autoconsoEffective}%`],
    ['Batterie', batteryKwh > 0 ? `${batteryKwh} kWh` : 'Sans'],
  ]
  rows.forEach(([l, v], i) => drawRow(doc, l, v, M, y + 6 + i * 6, pw, i % 2 === 0))
  y += 44

  // ═══════ Comparateur ═══════
  if (scenarios && scenarios.length > 0) {
    y = drawSection(doc, 'Comparateur de scenarios', M, y)

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Scenario', 'Cout net', 'Eco. an 1', 'Amorti', 'Gain 30a', 'ROI']],
      body: scenarios.map(s => [
        s.label,
        eur(s.fin.coutNet),
        eur(s.fin.economieAn1),
        s.fin.paybackAnnee ? `${s.fin.paybackAnnee.toFixed(1)} ans` : '—',
        eur(s.fin.gainNetFinal),
        `${s.fin.roi}%`,
      ]),
      styles: { fontSize: 7.5, cellPadding: 3, textColor: C.text },
      headStyles: { fillColor: C.indigo, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: C.surface },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right', textColor: C.emerald },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold', textColor: C.emerald },
        5: { halign: 'right', fontStyle: 'bold' },
      },
    })

    y = doc.lastAutoTable.finalY + 8
  }

  // ═══════ Financement ═══════
  if (financing) {
    y = drawSection(doc, 'Simulation de financement', M, y, C.amber)
    drawCard(doc, M, y, pw, 24)
    drawRow(doc, 'Montant finance', eur(fin.coutNet), M, y + 6, pw / 2)
    drawRow(doc, 'Taux / Duree', `${loanRate}% / ${loanDuration} ans`, M + pw / 2, y + 6, pw / 2)
    drawRow(doc, 'Mensualite pret', `${eur(financing.mensualite)}/mois`, M, y + 13, pw / 2, true)
    drawRow(doc, 'Economie mensuelle', `${eur(financing.ecoMoyenneMensuelle)}/mois`, M + pw / 2, y + 13, pw / 2, true)

    const autoF = financing.autoFinance
    doc.setFillColor(...(autoF ? C.emeraldBg : [255, 251, 235]))
    doc.roundedRect(M + 3, y + 17, pw - 6, 5, 1.5, 1.5, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(autoF ? C.emerald : C.amber))
    doc.text(
      autoF
        ? `Le solaire se paie tout seul ! Gain : ${eur(Math.abs(financing.resteACharge))}/mois`
        : `Reste a charge : ${eur(financing.resteACharge)}/mois pendant ${loanDuration} ans`,
      M + pw / 2, y + 20.5, { align: 'center' }
    )
    y += 30
  }

  // ═══════ Production vs Conso mensuelle ═══════
  if (monthlyVsConso && monthlyVsConso.length > 0) {
    // Check if we need a new page
    if (y > 230) { doc.addPage(); y = 20 }
    y = drawSection(doc, 'Production vs Consommation mensuelle', M, y, C.amber)

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Mois', 'Production', 'Consommation', 'Autoconsomme', 'Surplus', 'Achat reseau']],
      body: monthlyVsConso.map(m => [
        m.mois,
        `${m.prod} kWh`,
        `${m.conso} kWh`,
        `${m.autoconso} kWh`,
        `${m.surplus} kWh`,
        `${m.achatReseau} kWh`,
      ]),
      styles: { fontSize: 6.5, cellPadding: 2, textColor: C.text },
      headStyles: { fillColor: C.amber, textColor: C.white, fontStyle: 'bold', fontSize: 6.5 },
      alternateRowStyles: { fillColor: C.surface },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', textColor: C.indigo },
        4: { halign: 'right', textColor: C.emerald },
        5: { halign: 'right', textColor: C.red },
      },
    })

    y = doc.lastAutoTable.finalY + 8
  }

  // ═══════ Synthèse narrative ═══════
  if (y > 250) { doc.addPage(); y = 20 }
  drawCard(doc, M, y, pw, 22, { fill: C.brandBg })
  doc.setFillColor(...C.brand)
  doc.roundedRect(M + 3, y + 3, 1, 16, 0.5, 0.5, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brandDark)
  doc.text('Ce que cela signifie pour vous', M + 7, y + 7)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.text)
  const narrative = `Pour un investissement net de ${eur(fin.coutNet)}, votre installation de ${kwc} kWc${batteryKwh > 0 ? ` + batterie ${batteryKwh} kWh` : ''} produit ${kwh(production.annualKwh)}/an, couvre ${fin.tauxAutoproduction}% de votre consommation et vous fait economiser ${eur(fin.economieAn1)} des la 1ere annee.${fin.paybackAnnee ? ` Amortie en ${fin.paybackAnnee.toFixed(1)} ans.` : ''} Gain net : ${eur(fin.gainNetFinal)} sur 30 ans.`
  const lines = doc.splitTextToSize(narrative, pw - 12)
  doc.text(lines, M + 7, y + 12)
  y += 28

  // ═══════ Footer ═══════
  const pageH = 297
  doc.setFontSize(6)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...C.textMuted)
  doc.text('Estimation indicative — modele de productible regional. Tarifs et couts par defaut, a ajuster selon devis reel. Document non contractuel.', M, pageH - 12)
  doc.setFillColor(...C.brand)
  doc.rect(0, pageH - 6, W, 6, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Artex360 — Simulateurs CEE & Aides', W / 2, pageH - 2.5, { align: 'center' })

  return doc
}
