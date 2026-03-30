/**
 * Calcule le pourcentage de complétion d'un lead ou projet
 * basé sur les champs du formulaire bénéficiaire
 */

const FIELDS = [
  { key: 'firstName', label: 'Prénom' },
  { key: 'lastName', label: 'Nom' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Adresse' },
  { key: 'postalCode', label: 'Code postal' },
  { key: 'city', label: 'Ville' },
  { key: 'personnes', label: 'Personnes au foyer' },
  { key: 'rfr', label: 'Revenu fiscal de référence' },
  { key: 'typeLogement', label: 'Type de logement' },
  { key: 'surface', label: 'Surface habitable' },
]

function isFilled(value) {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'number' && value === 0) return false
  return true
}

/**
 * @param {Object} data - Objet lead ou projet
 * @returns {{ percent: number, filledCount: number, totalCount: number, missingFields: Array<{key: string, label: string}> }}
 */
export function getCompletion(data) {
  if (!data) return { percent: 0, filledCount: 0, totalCount: FIELDS.length, missingFields: FIELDS }

  const missingFields = []
  let filledCount = 0

  for (const field of FIELDS) {
    if (isFilled(data[field.key])) {
      filledCount++
    } else {
      missingFields.push(field)
    }
  }

  const percent = Math.round((filledCount / FIELDS.length) * 100)

  return { percent, filledCount, totalCount: FIELDS.length, missingFields }
}
