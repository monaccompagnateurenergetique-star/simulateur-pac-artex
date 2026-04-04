/**
 * Conversion parts fiscales → nombre de personnes dans le foyer
 *
 * Regles :
 * - Celibataire/divorce/veuf sans enfant = 1 part = 1 personne
 * - Couple marie/pacse = 2 parts = 2 personnes
 * - 1er enfant = +0.5 part = +1 personne
 * - 2e enfant = +0.5 part = +1 personne
 * - 3e enfant et suivants = +1 part = +1 personne chacun
 * - Demi-parts supplementaires (invalidite, ancien combattant) = 0 personne en plus
 *
 * Approximation : on inverse le calcul pour estimer le nombre de personnes
 */
export function partsToPersonnes(parts) {
  if (!parts || parts <= 0) return 1

  const p = parseFloat(parts)

  // 1 part = 1 personne (celibataire)
  if (p <= 1) return 1

  // 1.5 parts = 1 personne (celibataire + 1 enfant OU celibataire avec demi-part)
  // On compte 2 personnes car c'est plus prudent pour la precarite
  if (p <= 1.5) return 2

  // 2 parts = 2 personnes (couple sans enfant)
  if (p <= 2) return 2

  // 2.5 parts = 3 personnes (couple + 1 enfant)
  if (p <= 2.5) return 3

  // 3 parts = 4 personnes (couple + 2 enfants)
  if (p <= 3) return 4

  // Au-dela de 3 parts : chaque part supplementaire = 1 enfant en plus
  // 4 parts = 5 personnes (couple + 3 enfants)
  // 5 parts = 6 personnes (couple + 4 enfants)
  const extraParts = p - 3
  return 4 + Math.ceil(extraParts)
}

/**
 * Cumule plusieurs avis d'imposition
 * Retourne { totalRfr, totalParts, totalPersonnes, avisCount }
 */
export function cumulerAvis(avisList) {
  let totalRfr = 0
  let totalParts = 0

  for (const avis of avisList) {
    totalRfr += Number(avis.rfr) || 0
    totalParts += Number(avis.parts) || 0
  }

  // Le nombre de personnes est base sur le total des parts
  const totalPersonnes = partsToPersonnes(totalParts)

  return {
    totalRfr,
    totalParts,
    totalPersonnes,
    avisCount: avisList.length,
  }
}
