import jsPDF from 'jspdf'

const BLUE_ANAH = [0, 83, 159]
const RED_RF = [206, 17, 38]
const GRAY_TEXT = [51, 51, 51]
const GRAY_LIGHT = [120, 120, 120]
const BLACK = [0, 0, 0]
const WHITE = [255, 255, 255]
const CHECKBOX_SIZE = 3.5

function drawCheckbox(doc, x, y, checked) {
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.3)
  doc.rect(x, y, CHECKBOX_SIZE, CHECKBOX_SIZE)
  if (checked) {
    doc.setFillColor(...BLUE_ANAH)
    doc.rect(x + 0.5, y + 0.5, CHECKBOX_SIZE - 1, CHECKBOX_SIZE - 1, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('✓', x + 0.8, y + 3)
    doc.setTextColor(...BLACK)
  }
}

function drawFieldLine(doc, label, value, x, y, w) {
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_LIGHT)
  doc.text(label, x, y)
  doc.setTextColor(...BLACK)
  doc.setFont('helvetica', 'bold')
  const labelW = doc.getTextWidth(label)
  doc.text(value || '', x + labelW + 2, y)
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.2)
  doc.line(x + labelW + 1, y + 1, x + w, y + 1)
}

function drawFieldGrid(doc, fields, x, y, colW) {
  let cy = y
  for (const row of fields) {
    let cx = x
    for (const field of row) {
      drawFieldLine(doc, field.label, field.value, cx, cy, field.width || colW)
      cx += (field.width || colW) + 5
    }
    cy += 7
  }
  return cy
}

export function generateMandatMprPdf({ mandant, mandataire, mandatType, lieu, date, numeroDossier }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = 210
  const margin = 15
  const cw = pw - margin * 2

  // ═══ PAGE 1 ═══

  // Header — République Française
  doc.setFillColor(...BLUE_ANAH)
  doc.rect(0, 0, pw, 3, 'F')
  doc.setFillColor(...WHITE)
  doc.rect(0, 3, pw, 1, 'F')
  doc.setFillColor(...RED_RF)
  doc.rect(0, 4, pw, 1.5, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text('RÉPUBLIQUE', margin, 12)
  doc.text('FRANÇAISE', margin, 15.5)
  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...GRAY_LIGHT)
  doc.text('Liberté · Égalité · Fraternité', margin, 19)

  // ANAH badge
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text('Agence nationale', pw - margin - 30, 12)
  doc.text("de l'habitat", pw - margin - 23, 15.5)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...RED_RF)
  doc.text('Anah', pw - margin - 5, 12)

  // Title block
  let y = 28
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('MANDAT', pw / 2, y, { align: 'center' })

  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text("• Administratif : pour la constitution d'une demande", pw / 2, y, { align: 'center' })
  y += 4.5
  doc.text('de prime et sa demande de paiement', pw / 2, y, { align: 'center' })
  y += 5
  doc.setTextColor(...RED_RF)
  doc.text('et/ou', pw / 2, y, { align: 'center' })
  y += 5
  doc.setTextColor(...BLUE_ANAH)
  doc.text('• Financier : pour la perception de la prime', pw / 2, y, { align: 'center' })

  y += 7
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('PROPRIÉTAIRE OCCUPANT et PROPRIÉTAIRE BAILLEUR', pw / 2, y, { align: 'center' })

  y += 5
  doc.setFontSize(6)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...GRAY_LIGHT)
  doc.text('Articles 1984 et suivants du code civil / Décret modifié n°2020-26 du 14 janvier 2020 /', pw / 2, y, { align: 'center' })
  y += 3.5
  doc.text('Arrêté modifié du 14 janvier 2020 relatif à la prime de transition énergétique', pw / 2, y, { align: 'center' })

  // Intro text
  y += 6
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  const introLines = doc.splitTextToSize(
    "Ce formulaire doit obligatoirement être utilisé si vous voulez désigner un mandataire pour effectuer les démarches relatives à MaPrimeRénov'. Vous pouvez choisir l'une ou l'ensemble des démarches proposées en cochant les cases ci-dessous, à savoir :\n– la constitution d'une demande de prime et d'une demande de paiement (mandat administratif),\n– la perception de la prime (mandat financier).\nLe mandataire s'identifie obligatoirement auprès de l'Anah, préalablement à la validation de votre demande de mandat.\nPour être valable, ce mandat doit être daté et signé par vous-même (le mandant) et par la personne que vous désignez (votre mandataire). Tous les champs sont obligatoires. Ce mandat reste valide tant qu'il n'a pas été révoqué par l'une ou l'autre des parties.",
    cw
  )
  doc.text(introLines, margin, y)
  y += introLines.length * 3.2

  // ═══ MANDANT SECTION ═══
  y += 4
  doc.setFillColor(240, 245, 255)
  doc.roundedRect(margin, y - 4, cw, 5.5, 1, 1, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text('Je, soussigné(e) (vous, le mandant) :', margin + 3, y)
  y += 6

  // Civilité + N° dossier
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  drawCheckbox(doc, margin, y - 3, mandant.civilite === 'M.' || mandant.civilite === 'M')
  doc.text('M.', margin + 5, y)
  drawCheckbox(doc, margin + 14, y - 3, mandant.civilite === 'Mme')
  doc.text('ou Mme', margin + 19, y)

  doc.setTextColor(...GRAY_LIGHT)
  doc.text('N° du dossier :', pw - margin - 55, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text(`MPR-${numeroDossier || '                    '}`, pw - margin - 35, y)
  y += 7

  // Nom / Prénom
  drawFieldLine(doc, 'Nom :', mandant.nom, margin, y, cw / 2 - 5)
  drawFieldLine(doc, 'Prénom :', mandant.prenom, margin + cw / 2, y, cw / 2)
  y += 7

  // Adresse logement
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...GRAY_LIGHT)
  doc.text("Propriétaire ou titulaire d'un droit réel immobilier du logement à rénover au :", margin, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...BLACK)
  doc.text(mandant.adresse || '', margin, y)
  doc.setDrawColor(180, 180, 180)
  doc.line(margin, y + 1, margin + cw, y + 1)
  y += 7

  drawFieldLine(doc, 'Code postal :', mandant.codePostal, margin, y, cw / 3 - 5)
  drawFieldLine(doc, 'Commune :', mandant.commune, margin + cw / 3 + 5, y, cw * 2 / 3 - 10)
  y += 7

  drawFieldLine(doc, 'Adresse mail :', mandant.email, margin, y, cw)
  y += 7

  drawFieldLine(doc, 'Téléphone (mobile ou fixe) :', mandant.telephone, margin, y, cw / 2)
  y += 10

  // ═══ MANDATAIRE SECTION ═══
  doc.setFillColor(240, 245, 255)
  doc.roundedRect(margin, y - 4, cw, 5.5, 1, 1, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text('Donne MANDAT à (votre mandataire) :', margin + 3, y)
  y += 6

  // Civilité mandataire
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  drawCheckbox(doc, margin, y - 3, mandataire.civilite === 'M.' || mandataire.civilite === 'M')
  doc.text('M.', margin + 5, y)
  drawCheckbox(doc, margin + 14, y - 3, mandataire.civilite === 'Mme')
  doc.text('ou Mme', margin + 19, y)
  doc.setFontSize(6)
  doc.setTextColor(...GRAY_LIGHT)
  doc.text('(si personne morale, nom-prénom du représentant ayant délégation de signature)', margin + 40, y)
  y += 7

  drawFieldLine(doc, 'Nom :', mandataire.nom, margin, y, cw / 2 - 5)
  drawFieldLine(doc, 'Prénom :', mandataire.prenom, margin + cw / 2, y, cw / 2)
  y += 7

  drawFieldLine(doc, 'Raison sociale (si personne morale) :', mandataire.raisonSociale, margin, y, cw)
  y += 7

  drawFieldLine(doc, 'Adresse postale :', mandataire.adresse, margin, y, cw)
  y += 7

  drawFieldLine(doc, 'Code postal :', mandataire.codePostal, margin + 0, y, cw / 3 - 5)
  drawFieldLine(doc, 'Commune :', mandataire.commune, margin + cw / 3 + 5, y, cw * 2 / 3 - 10)
  y += 7

  drawFieldLine(doc, 'Adresse mail :', mandataire.email, margin, y, cw)
  y += 7

  drawFieldLine(doc, 'Téléphone (mobile ou fixe) :', mandataire.telephone, margin, y, cw / 2)
  y += 10

  // ═══ TYPE DE MANDAT ═══
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_TEXT)
  const typeIntro = doc.splitTextToSize(
    "Pour effectuer en mon nom et pour mon compte l'une ou les deux démarches suivantes (cocher la ou les cases concernées) :",
    cw
  )
  doc.text(typeIntro, margin, y)
  y += typeIntro.length * 3.5 + 3

  // 1) Administratif
  doc.setFillColor(245, 250, 255)
  doc.roundedRect(margin, y - 4, cw, 18, 1, 1, 'F')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text("1) Mandat ADMINISTRATIF : constituer mon dossier de demande MaPrimeRénov' à ma place :", margin + 3, y)
  y += 5
  const isAdmin = mandatType === 'administratif' || mandatType === 'les_deux'
  drawCheckbox(doc, margin + 5, y - 3, isAdmin)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  const adminText = doc.splitTextToSize(
    "Je donne mandat pour la constitution et le dépôt en ligne de mon dossier de demande de prime et de demande de paiement, ainsi que pour la réception et le traitement de toute correspondance avec l'Anah. Il appartient au mandataire de joindre l'ensemble des pièces nécessaires à la constitution de la demande.",
    cw - 15
  )
  doc.text(adminText, margin + 11, y)
  y += adminText.length * 3 + 6

  // 2) Financier
  doc.setFillColor(255, 248, 245)
  doc.roundedRect(margin, y - 4, cw, 22, 1, 1, 'F')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...RED_RF)
  doc.text("2) Mandat FINANCIER : PERCEVOIR MaPrimeRénov' à ma place :", margin + 3, y)
  y += 5
  const isFinancier = mandatType === 'financier' || mandatType === 'les_deux'
  drawCheckbox(doc, margin + 5, y - 3, isFinancier)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  const finText = doc.splitTextToSize(
    "Je donne mandat pour que les sommes versées par l'Anah relatives à MaPrimeRénov' le soient directement sur le compte bancaire de mon mandataire. Je reste cependant seul(e) bénéficiaire de la prime. Ainsi, en cas de contrôle de l'Anah après paiement, s'il s'avère que les conditions pour le bénéfice de MaPrimeRénov' n'étaient pas remplies, je serais tenu(e) au reversement des sommes indûment payées même si celles-ci n'ont pas été versées sur mon compte bancaire personnel.",
    cw - 15
  )
  doc.text(finText, margin + 11, y)

  // Footer page 1
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text("MaPrimeRénov'", margin, 285)
  doc.setFontSize(5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...GRAY_LIGHT)
  doc.text('Mieux chez moi, mieux pour la planète', margin, 289)
  doc.setFontSize(7)
  doc.setTextColor(...GRAY_LIGHT)
  doc.text('16089*02', pw / 2, 289, { align: 'center' })
  doc.text('1', pw - margin, 289, { align: 'right' })

  // ═══ PAGE 2 ═══
  doc.addPage()
  y = 15

  const sections = [
    {
      title: "● J'ATTESTE :",
      items: [
        "ne pas avoir commencé les travaux et/ou prestations avant le dépôt en ligne de la demande de MaPrimeRénov' ;",
        "avoir un projet de travaux sur un logement achevé depuis plus de 15 ans à la date de début des travaux et/ou prestations ;",
        "être propriétaire de ce logement ou disposer d'un droit réel immobilier me conférant l'usage du logement (usufruitier, contrat de viager) ;",
        "avoir déclaré les ressources de l'ensemble des membres de mon foyer.",
      ],
    },
    {
      title: "● JE M'ENGAGE À :",
      items: [
        "faire réaliser les travaux et/ou prestations éligibles à MaPrimeRénov' par une ou des entreprises Reconnues Garantes de l'Environnement (RGE), lorsque cette certification existe pour le ou les travaux et/ou prestations réalisés ;",
        "justifier de l'achèvement des travaux conformément au projet agréé par l'Anah en présentant la demande de paiement du solde de MaPrimeRénov' au plus tard dans un délai de 2 ans suivant la date de notification de l'octroi de la prime (1 an en cas de versement d'une avance) ;",
        "déclarer les autres aides, les réductions et les contreparties accordées par l'entreprise de travaux, le cas échéant, perçues ou à percevoir ;",
        "ne pas solliciter une autre aide de l'Anah pour les mêmes travaux, notamment celles accordées par MaPrimeRénov' Sérénité ou le programme Loc'Avantages ;",
        "si je suis bailleur, respecter les engagements fixés dans la réglementation relative à MaPrimeRénov'.",
      ],
    },
    {
      title: "● JE SUIS INFORMÉ(E) DES ÉLÉMENTS SUIVANTS :",
      items: [
        "l'Anah peut effectuer à tout moment des contrôles, sur place ou sur pièces, pour vérifier la nature des travaux et leur réalisation effective ;",
        "l'absence de réponse à la demande de contrôle constitue un motif de non-respect des engagements et peut entraîner le retrait de la prime ;",
        "en cas de non-respect des engagements, la prime est annulée et les sommes déjà perçues doivent être remboursées ;",
        "toute fraude ou fausse déclaration entraîne le retrait et le reversement de la prime et expose à des sanctions ;",
        "le dépôt de la demande de solde par mon mandataire vaut déclaration d'achèvement de l'opération de travaux.",
      ],
    },
    {
      title: '● APRÈS LA SIGNATURE DE CE DOCUMENT :',
      items: [
        "Je conserve l'original du présent mandat et téléverse sa copie dans mon espace personnel sur la plateforme MaPrimeRénov'.",
        "Mon mandataire et moi pouvons révoquer le présent mandat à tout moment avant le dépôt de la demande de solde.",
      ],
    },
  ]

  for (const section of sections) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(section.title, margin, y)
    y += 5

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_TEXT)
    for (const item of section.items) {
      const lines = doc.splitTextToSize(`– ${item}`, cw - 5)
      if (y + lines.length * 3 > 260) {
        doc.addPage()
        y = 15
      }
      doc.text(lines, margin + 3, y)
      y += lines.length * 3 + 1.5
    }
    y += 3
  }

  // Disclaimer
  y += 2
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bolditalic')
  doc.setTextColor(...GRAY_TEXT)
  const disclaimer = doc.splitTextToSize(
    "L'Anah décline toute responsabilité en cas de mauvaise exécution du présent mandat par votre mandataire. Cette circonstance ne pourra en aucun cas vous exonérer de vos obligations et du respect des engagements que vous avez pris vis-à-vis de l'Anah.",
    cw
  )
  doc.text(disclaimer, margin, y)
  y += disclaimer.length * 3 + 8

  // ═══ SIGNATURE SECTION ═══
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  doc.text('Fait à', margin, y)
  doc.setFont('helvetica', 'bold')
  doc.text(lieu || '', margin + 15, y)
  doc.setDrawColor(180, 180, 180)
  doc.line(margin + 14, y + 1, margin + 60, y + 1)

  doc.setFont('helvetica', 'normal')
  doc.text('le', margin + 65, y)
  doc.setFont('helvetica', 'bold')
  doc.text(date || '', margin + 72, y)
  doc.line(margin + 71, y + 1, margin + 110, y + 1)
  y += 10

  // Two signature columns
  const colW = cw / 2 - 5

  // Left — Mandant
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  doc.text('Partie réservée au MANDANT (vous-même)', margin, y)
  y += 6
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.text('Nom et prénom :', margin, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text(`${mandant.nom || ''} ${mandant.prenom || ''}`, margin, y)

  // Right — Mandataire
  const rx = margin + colW + 10
  let ry = y - 11
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE_ANAH)
  const mandataireHeader = doc.splitTextToSize(
    "Partie réservée au MANDATAIRE qui s'engage à informer le mandant des démarches relatives au présent mandat et à accepter les contrôles de l'Anah",
    colW
  )
  doc.text(mandataireHeader, rx, ry)
  ry += mandataireHeader.length * 3 + 3
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.setFont('helvetica', 'normal')
  doc.text('Nom et prénom / Raison sociale :', rx, ry)
  ry += 5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text(mandataire.raisonSociale || `${mandataire.nom || ''} ${mandataire.prenom || ''}`, rx, ry)

  y += 5
  // Signature boxes
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_LIGHT)
  doc.text('Signature', margin, y + 3)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.rect(margin, y + 5, colW, 25)

  doc.text('Signature', rx, y + 3)
  doc.rect(rx, y + 5, colW, 25)

  // Footer page 2
  doc.setFontSize(7)
  doc.text('2', pw - margin, 289, { align: 'right' })

  const fileName = `Mandat_MPR_${mandant.nom || 'client'}_${mandant.prenom || ''}.pdf`.replace(/\s+/g, '_')
  doc.save(fileName)
}
