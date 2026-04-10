/**
 * GENERATEUR D'EMAIL — Demande de pieces aux beneficiaires
 *
 * Genere automatiquement un email personnalise listant les documents
 * a fournir, en fonction du dispositif (CEE / MPR / Anah / Reno Ampleur),
 * du profil bénéficiaire et de la phase du dossier.
 */

import { getRequiredDocuments, SOURCE_LABELS } from './constants/documentLibrary.js'

/**
 * Genere le contenu d'un email de demande de pieces
 *
 * @param {Object} options
 * @param {string}   options.clientFirstName - Prenom du client
 * @param {string}   options.clientLastName  - Nom du client
 * @param {string[]} options.tags            - ['CEE', 'MPR', 'ANAH', 'RENO_AMPLEUR']
 * @param {string}   [options.precarity]     - 'tres_modeste' | 'modeste' | ...
 * @param {string}   [options.phase]         - 'avant' | 'apres' (par defaut 'avant')
 * @param {Object}   [options.company]       - Infos entreprise pour signature
 * @param {string}   [options.replyEmail]    - Email destinataire des pieces
 * @param {string}   [options.dispositifLabel] - Label du dispositif (ex: "Anah Réno Ampleur")
 *
 * @returns {{ subject: string, body: string, plainText: string }}
 */
export function generateDocumentRequestEmail({
  clientFirstName = '',
  clientLastName = '',
  tags = ['CEE'],
  precarity = null,
  phase = 'avant',
  company = {},
  replyEmail = '',
  dispositifLabel = '',
} = {}) {
  // Recupere uniquement les documents a fournir par le client
  const allDocs = getRequiredDocuments({ tags, phase, precarity })
  const clientDocs = allDocs.filter((d) => d.source === 'client')

  // Calcul du label dispositif si non fourni
  const dispLabel = dispositifLabel || tagsToLabel(tags)

  // Sujet
  const fullName = [clientFirstName, clientLastName].filter(Boolean).join(' ').trim() || 'votre dossier'
  const subject = `Documents nécessaires — ${fullName} — ${dispLabel}`

  // Corps texte (plain text — pour mailto: ou copier-coller)
  const greeting = clientFirstName ? `Bonjour ${clientFirstName},` : 'Bonjour,'

  const lines = []
  lines.push(greeting)
  lines.push('')
  lines.push(`Afin d'instruire votre dossier dans les meilleurs délais, merci de réunir les documents ci-dessous.`)
  lines.push('')
  lines.push(`PIÈCES À FOURNIR — ${dispLabel.toUpperCase()} :`)
  lines.push('')

  clientDocs.forEach((doc, i) => {
    lines.push(`${i + 1}. ${doc.label}`)
    if (doc.description) {
      lines.push(`   ${doc.description}`)
    }
    lines.push('')
  })

  lines.push(`Nous vous invitons à scanner ces documents en format PDF (lisibles), puis à les envoyer séparément par mail${replyEmail ? ' à : ' + replyEmail : ''}.`)
  lines.push('')
  lines.push('En vous souhaitant une excellente journée.')
  lines.push('')

  // Signature
  if (company.name) {
    lines.push('Cordialement,')
    lines.push(company.name)
    if (company.phone) lines.push(`Tél : ${company.phone}`)
    if (company.email) lines.push(company.email)
  } else {
    lines.push('Cordialement,')
  }

  const plainText = lines.join('\n')

  // Version HTML (pour client mail riche / preview)
  const htmlLines = []
  htmlLines.push(`<p>${escapeHtml(greeting)}</p>`)
  htmlLines.push(`<p>Afin d'instruire votre dossier dans les meilleurs délais, merci de réunir les documents ci-dessous.</p>`)
  htmlLines.push(`<p><strong>PIÈCES À FOURNIR — ${escapeHtml(dispLabel.toUpperCase())} :</strong></p>`)
  htmlLines.push('<ul>')
  clientDocs.forEach((doc) => {
    htmlLines.push(`<li><strong>${escapeHtml(doc.label)}</strong>${doc.description ? `<br><span style="color:#64748b;font-size:0.9em">${escapeHtml(doc.description)}</span>` : ''}</li>`)
  })
  htmlLines.push('</ul>')
  htmlLines.push(`<p>Nous vous invitons à scanner ces documents en format PDF (lisibles), puis à les envoyer séparément par mail${replyEmail ? ' à : <a href="mailto:' + escapeHtml(replyEmail) + '">' + escapeHtml(replyEmail) + '</a>' : ''}.</p>`)
  htmlLines.push('<p>En vous souhaitant une excellente journée.</p>')
  if (company.name) {
    htmlLines.push(`<p>Cordialement,<br><strong>${escapeHtml(company.name)}</strong>`)
    if (company.phone) htmlLines.push(`<br>Tél : ${escapeHtml(company.phone)}`)
    if (company.email) htmlLines.push(`<br><a href="mailto:${escapeHtml(company.email)}">${escapeHtml(company.email)}</a>`)
    htmlLines.push('</p>')
  } else {
    htmlLines.push('<p>Cordialement,</p>')
  }

  return {
    subject,
    body: htmlLines.join('\n'),
    plainText,
    documentsCount: clientDocs.length,
    documents: clientDocs,
  }
}

/**
 * Construit un lien mailto: pret a cliquer
 */
export function buildMailtoLink({ to = '', subject = '', plainText = '' } = {}) {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (plainText) params.set('body', plainText)
  return `mailto:${encodeURIComponent(to)}?${params.toString().replace(/\+/g, '%20')}`
}

// ─── Helpers ────────────────────────────────────────────────

function tagsToLabel(tags) {
  if (!tags || tags.length === 0) return 'Dossier'
  if (tags.includes('RENO_AMPLEUR')) return 'Anah Rénovation d\'Ampleur'
  if (tags.includes('ANAH')) return 'Anah'
  if (tags.includes('MPR') && tags.includes('CEE')) return 'CEE + MaPrimeRénov\''
  if (tags.includes('MPR')) return 'MaPrimeRénov\''
  if (tags.includes('CEE')) return 'CEE'
  return 'Dossier'
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
