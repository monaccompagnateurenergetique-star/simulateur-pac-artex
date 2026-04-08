import { BAR_TH_179 } from '../constants/barTh179'

/**
 * Calcul CEE BAR-TH-179 — PAC collective air/eau
 * Source : fiche vA75-1 à compter du 01/01/2026
 *
 * Formule (identique Renolib) :
 *   prime = (forfait / 1000) × ((nb_classique × prix_classique) + (nb_precaire × prix_precaire)) × CDP
 *
 * - forfait : kWhc cumac par logement (table officielle, selon ETAS + usage + zone)
 * - CDP : x3 si remplacement chaudière gaz/fioul/charbon, sinon x1
 * - prix_classique : 7 €/MWhc — prix_precaire : 12 €/MWhc
 * - Le volume kWhc est identique par logement, c'est le PRIX qui change selon la précarité
 * - Facteur R : R = 1 si PAC ≥ 40% puissance totale, sinon R = P_pac/P_total
 *
 * @param {Object} params
 * @param {string} params.usage - 'chauffage' ou 'chauffage_ecs'
 * @param {string} params.etasClass - classe ETAS ('111-126', '126-150', etc.)
 * @param {string} params.zone - 'H1', 'H2' ou 'H3'
 * @param {number} params.nbClassique - Nombre de ménages classiques
 * @param {number} params.nbPrecaire - Nombre de ménages précaires
 * @param {string} params.chauffageExistant - Type de chauffage remplacé
 * @param {number} params.prixClassique - Prix €/MWhc classique (défaut 7)
 * @param {number} params.prixPrecaire - Prix €/MWhc précaire (défaut 12)
 * @param {number} params.puissancePac - Puissance nominale PAC (kW)
 * @param {number} params.puissanceTotale - Puissance totale chaufferie après travaux (kW)
 */
export function calculateBarTh179({
  usage = 'chauffage_ecs',
  etasClass = '126-150',
  zone = 'H1',
  nbClassique = 0,
  nbPrecaire = 0,
  chauffageExistant = 'gaz',
  prixClassique = BAR_TH_179.PRIX_MWHC.classique,
  prixPrecaire = BAR_TH_179.PRIX_MWHC.precaire,
  puissancePac = 100,
  puissanceTotale = 100,
}) {
  const nbTotal = nbClassique + nbPrecaire
  if (nbTotal === 0) {
    return {
      forfait: 0, facteurR: 1, volumeTotal: 0,
      primeClassique: 0, primePrecaire: 0, primeTotale: 0,
      coupDePouce: false, multiplicateur: 1, nbTotal: 0,
      volumeParLogement: 0,
    }
  }

  // 1. Forfait par logement depuis la table officielle
  const forfaitTable = BAR_TH_179.FORFAITS[usage]
  const forfait = forfaitTable?.[etasClass]?.[zone] || forfaitTable?.['126-150']?.[zone] || 155000

  // 2. Facteur correctif R
  const pPac = Number(puissancePac) || 0
  const pTotal = Number(puissanceTotale) || pPac
  let facteurR = 1
  if (pTotal > 0 && pPac < pTotal * 0.4) {
    facteurR = Math.round((pPac / pTotal) * 100) / 100
  }

  // 3. Coup de pouce
  const coupDePouce = BAR_TH_179.COUP_DE_POUCE.eligible.includes(chauffageExistant)
  const multiplicateur = coupDePouce ? BAR_TH_179.COUP_DE_POUCE.multiplicateur : 1

  // 4. Volume CEE par logement (identique classique/précaire)
  const volumeParLogement = Math.round(forfait * facteurR * multiplicateur)

  // 5. Volume total
  const volumeTotal = volumeParLogement * nbTotal

  // 6. Prime en euros — la précarité affecte le PRIX, pas le volume
  // Formule Renolib : (forfait / 1000) × ((nb_classique × prix_classique) + (nb_precaire × prix_precaire)) × CDP × R
  const forfaitMWhc = forfait / 1000
  const primeClassique = Math.round(forfaitMWhc * facteurR * multiplicateur * nbClassique * prixClassique)
  const primePrecaire = Math.round(forfaitMWhc * facteurR * multiplicateur * nbPrecaire * prixPrecaire)
  const primeTotale = primeClassique + primePrecaire

  return {
    forfait,
    facteurR,
    coupDePouce,
    multiplicateur,
    volumeParLogement,
    volumeTotal,
    primeClassique,
    primePrecaire,
    primeTotale,
    prixClassique,
    prixPrecaire,
    nbTotal,
    nbClassique,
    nbPrecaire,
  }
}
