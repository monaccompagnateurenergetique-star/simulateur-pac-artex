import Tesseract from 'tesseract.js'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/**
 * Extrait les donnees d'un avis d'imposition (image OU PDF)
 *
 * PDF natif → extraction texte directe via pdf.js (rapide, precis)
 * Image/PDF scanne → OCR via Tesseract.js (plus lent)
 */
export async function extractAvisImposition(file, onProgress) {
  try {
    let text = ''

    if (file.type === 'application/pdf') {
      // Essayer extraction texte directe (PDF natif)
      try {
        text = await extractTextFromPDF(file, onProgress)
        console.log('[OCR] PDF text extraction:', text.length, 'chars')
      } catch (pdfErr) {
        console.warn('[OCR] PDF text extraction failed:', pdfErr)
        text = ''
      }

      // Si pas assez de texte, le PDF est probablement scanne → fallback OCR
      if (text.length < 100) {
        console.log('[OCR] Fallback to OCR images')
        try {
          const images = await pdfToImages(file, onProgress)
          text = await ocrImages(images, onProgress)
        } catch (ocrErr) {
          console.warn('[OCR] Image OCR failed:', ocrErr)
        }
      }
    } else {
      // Image → OCR direct
      text = await ocrImages([URL.createObjectURL(file)], onProgress)
    }

    console.log('[OCR] Final text length:', text.length)
    let parsed
    try {
      parsed = parseAvisImposition(text)
    } catch (parseErr) {
      console.error('[OCR] Parse CRASHED:', parseErr)
      parsed = { error: 'Erreur d\'analyse: ' + parseErr.message }
    }
    console.log('[OCR] Parsed result:', JSON.stringify({
      nom: parsed.nom, prenom: parsed.prenom, rfr: parsed.rfr,
      parts: parsed.parts, adresse: parsed.adresse, codePostal: parsed.codePostal,
      numeroFiscal: parsed.numeroFiscal, error: parsed.error
    }))
    return parsed
  } catch (err) {
    console.warn('Extraction error:', err)
    return { error: 'Impossible de lire le document. Essayez avec une image plus nette.' }
  }
}

/**
 * Extraction texte directe depuis un PDF natif via pdf.js (pas d'OCR)
 */
async function extractTextFromPDF(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  const maxPages = Math.min(pdf.numPages, 3)

  for (let i = 1; i <= maxPages; i++) {
    if (onProgress) onProgress(Math.round((i / maxPages) * 80))
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // Reconstruire le texte avec les positions pour garder les retours a la ligne
    const items = content.items
    let lastY = null
    for (const item of items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        fullText += '\n'
      }
      fullText += item.str + ' '
      lastY = item.transform[5]
    }
    fullText += '\n\n'
  }

  if (onProgress) onProgress(100)
  return fullText
}

/**
 * Convertit un PDF en images via pdf.js (pour PDF scannes)
 */
async function pdfToImages(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const imageUrls = []
  const maxPages = Math.min(pdf.numPages, 2)

  for (let i = 1; i <= maxPages; i++) {
    if (onProgress) onProgress(Math.round((i / maxPages) * 30))
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
    imageUrls.push(URL.createObjectURL(blob))
  }

  return imageUrls
}

/**
 * OCR sur une liste d'images via Tesseract.js
 */
async function ocrImages(imageUrls, onProgress) {
  let fullText = ''
  for (let i = 0; i < imageUrls.length; i++) {
    // Pre-traiter l'image pour ameliorer l'OCR
    const processedUrl = await preprocessImage(imageUrls[i])

    const result = await Tesseract.recognize(processedUrl, 'fra', {
      logger: (info) => {
        if (onProgress && info.status === 'recognizing text') {
          onProgress(Math.round(30 + (i / imageUrls.length + info.progress / imageUrls.length) * 70))
        }
      },
    })
    fullText += result.data.text + '\n'

    if (processedUrl !== imageUrls[i]) URL.revokeObjectURL(processedUrl)
  }
  imageUrls.forEach((url) => URL.revokeObjectURL(url))
  console.log('[OCR] Raw OCR text:', fullText.substring(0, 500))
  return fullText
}

/**
 * Pre-traitement image : niveaux de gris + contraste + agrandissement
 * Ameliore significativement la precision OCR
 */
async function preprocessImage(imageUrl) {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageUrl
    })

    // Agrandir x2 si petite image
    const scale = Math.max(1, Math.min(2, 2000 / Math.max(img.width, img.height)))
    const canvas = document.createElement('canvas')
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    const ctx = canvas.getContext('2d')

    // Dessiner l'image agrandie
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Convertir en niveaux de gris + augmenter le contraste
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      // Niveaux de gris
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      // Augmenter le contraste (seuillage adaptatif)
      const contrasted = gray < 128 ? Math.max(0, gray * 0.5) : Math.min(255, gray * 1.3 + 30)
      data[i] = contrasted
      data[i + 1] = contrasted
      data[i + 2] = contrasted
    }
    ctx.putImageData(imageData, 0, 0)

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
    return URL.createObjectURL(blob)
  } catch {
    // Si le pre-traitement echoue, utiliser l'image originale
    return imageUrl
  }
}

/**
 * Parse le texte pour extraire les informations d'un avis d'imposition
 */
export function parseAvisImposition(text) {
  const result = {
    nom: null, prenom: null,
    adresse: null, codePostal: null, ville: null,
    numeroFiscal: null, referenceAvis: null,
    rfr: null, parts: null, personnesCharge: null,
    raw: text, error: null,
  }

  if (!text || text.length < 30) {
    result.error = 'Texte trop court — le document est peut-être illisible'
    return result
  }

  const n = text.replace(/\r\n/g, '\n').replace(/['']/g, "'")
  const nNorm = n.replace(/  +/g, ' ')
  const flat = n.replace(/\n/g, ' ').replace(/\s+/g, ' ')

  // ── Numéro fiscal ──
  // "30 16 793 335 080" — 13 chiffres avec espaces
  const fiscalMatch = flat.match(/(\d{2}\s*\d{2}\s*\d{3}\s*\d{3}\s*\d{3})/i)
  if (fiscalMatch) {
    result.numeroFiscal = fiscalMatch[1].trim()
  }

  // ── Référence de l'avis ──
  // "24 57 A039778 55"
  const refMatch = flat.match(/(\d{2}\s*\d{2}\s*[A-Z]\d{5,8}\s*\d{2})/i)
  if (refMatch) {
    result.referenceAvis = refMatch[1].trim()
  }

  // ── Revenu Fiscal de Référence ──
  // Sur l'avis, le RFR apparait dans un cadre en bas de page 1 :
  // "Revenu fiscal de référence :    21 693"
  // "Nombre de parts :               1,00"
  // Le format dans le texte extrait est souvent "21 693\n1,00" ou "26 603\n3,00"

  // 1. Chercher le montant dans le cadre "Revenu fiscal de référence : MONTANT"
  const rfrDirect = flat.match(/[Rr]evenu\s*fiscal\s*de\s*r[eéÉ]f[eéÉ]rence\s*[:\s]+(\d[\d\s]{2,8}\d)/i)
  if (rfrDirect) {
    const val = parseAmount(rfrDirect[1])
    // Ignorer les petits numeros (numeros de case comme "25")
    if (val && val >= 1000) result.rfr = val
  }

  // 2. Chercher "MONTANT\nX,00" (RFR suivi du nombre de parts)
  if (!result.rfr) {
    const rfrBeforeParts = nNorm.match(/(\d[\d\s]{2,8}\d)\s*\n\s*\d[,.]\d{2}\s*$/m)
    if (rfrBeforeParts) {
      const val = parseAmount(rfrBeforeParts[1])
      if (val && val >= 1000) result.rfr = val
    }
  }

  // 3. Chercher le dernier montant 5+ chiffres sur la derniere page (souvent le RFR)
  if (!result.rfr) {
    const allBigAmounts = [...nNorm.matchAll(/\b(\d{2}\s?\d{3})\b/g)]
      .map(m => parseAmount(m[1]))
      .filter(v => v && v >= 1000 && v < 300000)
    if (allBigAmounts.length > 0) {
      // Le RFR est le montant qui apparait le plus souvent (repete sur page 1 et 2)
      const counts = {}
      allBigAmounts.forEach(a => { counts[a] = (counts[a] || 0) + 1 })
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      result.rfr = Number(sorted[0][0])
    }
  }

  // ── Nombre de parts ──
  // Format typique : "3,00" ou "3.00" ou juste "3"
  // Souvent juste apres le RFR sur la meme ligne : "26 603 3,00"
  const partsPatterns = [
    /(\d[,.]?\d{2})\s*parts?/i,
    /nombre\s*de\s*parts?\s*[:\s]*(\d[,.]?\d{0,2})/i,
    /parts?\s*(?:fiscal|de\s*quotient)\s*[:\s]*(\d[,.]?\d{0,2})/i,
  ]
  for (const p of partsPatterns) {
    const m = flat.match(p)
    if (m) { result.parts = parseFloat(m[1].replace(',', '.')); break }
  }

  // Fallback : sur l'avis, apres le RFR il y a souvent "X,00" (nombre de parts)
  if (!result.parts && result.rfr) {
    // Chercher un petit nombre decimal (1-9) apres le montant du RFR
    const rfrStr = String(result.rfr)
    const afterRfr = flat.match(new RegExp(rfrStr.replace(/\s/g, '\\s*') + '\\s+(\\d[,.]\\d{2})'))
    if (afterRfr) {
      const val = parseFloat(afterRfr[1].replace(',', '.'))
      if (val >= 1 && val <= 10) result.parts = val
    }
    // Aussi chercher "26 603 3,00" directement
    if (!result.parts) {
      const rfrParts = flat.match(/\d[\d\s]*\d{3}\s+(\d[,.]00)/i)
      if (rfrParts) {
        result.parts = parseFloat(rfrParts[1].replace(',', '.'))
      }
    }
  }

  // ── Nom, Prénom et Adresse du contribuable ──
  // Le bloc contribuable est un bloc compact : NOM PRENOM\n[APPT X\n]ADRESSE\nCODE_POSTAL VILLE
  // Il apparait apres le bloc CEDEX du centre des impots
  // Strategie : chercher tous les blocs "TEXTE\n...ADRESSE\nCODE_POSTAL VILLE" et prendre
  // celui qui n'est PAS le centre des impots (pas CEDEX, pas SIP, pas FORBACH)

  // Chercher le bloc contribuable : NOM PRENOM\n[complement\n]ADRESSE\nCODE_POSTAL VILLE
  // Le NOM est toujours en MAJUSCULES, minimum 2 lettres, et suivi d'un PRENOM aussi en majuscules
  const contribuableBlocks = [...nNorm.matchAll(
    /\n\s*([A-ZÉÈÊËÀÂÄÙÛÜ]{2,20})\s+([A-ZÉÈÊËÀÂÄÙÛÜ]{2,20})\s*\n((?:APPT?\s*\d+\s*\n)?)\s*(\d{1,4}[A-Z]?\s+(?:RUE|AVENUE|BOULEVARD|IMPASSE|CHEMIN|PLACE|ALL[EÉ]E|ROUTE|CHE)\s+[^\n]{2,40})\s*\n\s*(\d{5})\s+([^\n]+)/gi
  )]

  // Filtrer : ignorer les blocs qui contiennent CEDEX, SIP, FORBACH, BOITE
  const validBlocks = contribuableBlocks.filter(m => {
    const ville = m[6].trim()
    return !ville.includes('CEDEX') && !ville.includes('BOITE') && !ville.includes('SIP')
  })

  if (validBlocks.length > 0) {
    const block = validBlocks[0]
    result.nom = block[1].trim()
    result.prenom = block[2].trim()
    const complement = (block[3] || '').trim().replace(/\n/g, '')
    const rue = block[4].trim()
    result.adresse = complement ? `${complement}, ${rue}` : rue
    result.codePostal = block[5]
    result.ville = block[6].trim()
  }

  // Fallback nom : "Déclarant 1 - Nom de naissance : CHARLES"
  if (!result.nom) {
    const declMatch = flat.match(/[Dd][eéÉ]clarant\s*1\s*[-–]\s*[Nn]om\s*de\s*naissance\s*[:\s]*([A-ZÉÈÊËÀÂÄÙÛÜ]{2,20})/i)
    if (declMatch) result.nom = declMatch[1].trim()
  }

  // Fallback prenom via le nom
  if (result.nom && !result.prenom) {
    const prenomMatch = n.match(new RegExp(result.nom + '\\s+([A-ZÉÈÊËÀÂÄÙÛÜ]{2,20})\\s', 'i'))
    if (prenomMatch) result.prenom = prenomMatch[1].trim()
  }

  // Fallback adresse : "Adresse d'imposition"
  if (!result.adresse) {
    const adresseImpo = nNorm.match(/[Aa]dresse\s*d['']imposition[^:]*:\s*\n\s*(APPT?\s*\d+\s*\n)?\s*(.+?)\n\s*(\d{5})\s+(.+?)(?:\n|$)/i)
    if (adresseImpo) {
      const complement = (adresseImpo[1] || '').trim()
      const rue = adresseImpo[2].trim()
      result.adresse = complement ? `${complement}, ${rue}` : rue
      result.codePostal = adresseImpo[3]
      result.ville = adresseImpo[4].trim()
    }
  }

  // Fallback code postal
  if (!result.codePostal) {
    const cpMatches = [...nNorm.matchAll(/(\d{5})\s+([A-ZÉÈÊËÀÂÄÙÛÜ][A-ZÉÈÊËÀÂÄÙÛÜ\s-]{2,25})/gi)]
    for (const m of cpMatches) {
      if (!m[2].includes('CEDEX') && !m[2].includes('BOITE') && !m[2].includes('SIP')) {
        result.codePostal = m[1]
        result.ville = m[2].trim()
        break
      }
    }
  }

  // ── Personnes à charge ──
  const chargeMatch = flat.match(/personne.*charge\s*[:\s]*(\d+)/i)
  if (chargeMatch) {
    result.personnesCharge = parseInt(chargeMatch[1])
  }

  if (!result.rfr && !result.nom && !result.numeroFiscal) {
    result.error = 'Aucune donnée trouvée. Vérifiez la qualité du document ou saisissez manuellement.'
  }

  return result
}

function parseAmount(str) {
  if (!str) return null
  let cleaned = str.replace(/\s/g, '').replace(/\./g, '')
  cleaned = cleaned.replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : Math.round(num)
}
