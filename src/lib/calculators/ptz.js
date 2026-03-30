import { PTZ_PLAFONDS, PTZ_CONDITIONS } from '../constants/ptz.js'

/**
 * Calcul du Prêt à Taux Zéro (PTZ) 2026
 * @param {object} params
 * @param {number} params.nbGestes - Nombre de gestes de rénovation (1-4+)
 * @param {number} params.montantTravaux - Coût total des travaux en €
 * @param {string} params.category - Profil revenus : 'Bleu' | 'Jaune' | 'Violet' | 'Rose'
 * @returns {object} Résultat du calcul PTZ
 */
export function calculerPTZ({ nbGestes, montantTravaux, category }) {
  const conditions = PTZ_CONDITIONS[category]

  if (!conditions || !conditions.eligible) {
    return {
      eligible: false,
      raison: category === 'Rose'
        ? 'Le profil Rose (revenus supérieurs) n\'est pas éligible au PTZ.'
        : 'Profil de revenus non reconnu.',
      montantPTZ: 0,
      mensualite: 0,
      dureeDiffere: 0,
      dureeRemboursement: 0,
      dureeTotale: 0,
    }
  }

  if (!nbGestes || nbGestes < 1) {
    return {
      eligible: false,
      raison: 'Au moins 1 geste de rénovation est requis.',
      montantPTZ: 0,
      mensualite: 0,
      dureeDiffere: 0,
      dureeRemboursement: 0,
      dureeTotale: 0,
    }
  }

  if (!montantTravaux || montantTravaux <= 0) {
    return {
      eligible: false,
      raison: 'Le montant des travaux doit être supérieur à 0.',
      montantPTZ: 0,
      mensualite: 0,
      dureeDiffere: 0,
      dureeRemboursement: 0,
      dureeTotale: 0,
    }
  }

  const clampedGestes = Math.min(nbGestes, 4)
  const plafond = PTZ_PLAFONDS[clampedGestes]
  const montantPTZ = Math.min(plafond, montantTravaux)

  const { differe, dureeTotale } = conditions
  const dureeRemboursement = dureeTotale - differe
  const nbMensualites = dureeRemboursement * 12
  const mensualite = nbMensualites > 0 ? Math.round((montantPTZ / nbMensualites) * 100) / 100 : 0

  return {
    eligible: true,
    raison: null,
    montantPTZ,
    plafond,
    mensualite,
    dureeDiffere: differe,
    dureeRemboursement,
    dureeTotale,
    nbMensualites,
    category,
    nbGestes: clampedGestes,
  }
}
