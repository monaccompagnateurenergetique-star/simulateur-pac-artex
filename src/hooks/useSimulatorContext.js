import { useSearchParams } from 'react-router-dom'
import { useProjects } from './useProjects'
import { useCeeDeals } from './useCeeDeals'
import { getLocationInfo } from '../utils/postalCode'

const CATEGORY_TO_PRICE_KEY = {
  Bleu: 'tresModeste',
  Jaune: 'modeste',
  Violet: 'classique',
  Rose: 'aise',
}

/**
 * Hook centralisé pour les simulateurs.
 * - Détecte le contexte projet/scénario/édition depuis l'URL
 * - Fournit les données du projet pour pré-remplir les champs
 * - Pré-remplit le prix CEE depuis le deal actif
 * - En mode édition, retourne les inputs de la simulation précédente
 *
 * @param {string} ficheCode — Code de la fiche CEE (ex: 'BAR-TH-171')
 */
export function useSimulatorContext(ficheCode) {
  const [searchParams] = useSearchParams()
  const { projects } = useProjects()
  const { getActiveDeal, getPriceForFiche } = useCeeDeals()

  const projectId = searchParams.get('projectId')
  const scenarioId = searchParams.get('scenarioId')
  const editSimId = searchParams.get('editSimId')
  const clientId = searchParams.get('clientId')

  // Trouver le projet
  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : clientId
      ? projects.find((p) => p.id === clientId)
      : null

  const scenario = project && scenarioId
    ? (project.scenarios || []).find((s) => s.id === scenarioId)
    : null

  const editingSim = scenario && editSimId
    ? scenario.simulations.find((s) => s.id === editSimId)
    : null

  // Deal actif
  const activeDeal = getActiveDeal()
  const minCeePercent = activeDeal?.minCeePercent || 0

  // Résoudre le prix CEE depuis le deal
  const categoryKey = project?.category
    ? CATEGORY_TO_PRICE_KEY[project.category] || 'tresModeste'
    : 'tresModeste'

  const dealPrice = activeDeal && ficheCode
    ? getPriceForFiche(activeDeal, ficheCode, categoryKey)
    : activeDeal?.pricePerMWhc?.tresModeste ?? null

  // Données du projet pour pré-remplir
  const locationInfo = project?.postalCode ? getLocationInfo(project.postalCode) : null

  const projectDefaults = project ? {
    zone: locationInfo?.zoneSimplifiee || locationInfo?.zoneClimatique || null,
    mprCategory: project.category || null,
    surface: project.surface ? Number(project.surface) : null,
    housingType: project.typeLogement === 'appartement' ? 'Appartement' : project.typeLogement === 'maison' ? 'Maison' : null,
    personnes: project.personnes ? Number(project.personnes) : null,
    chauffageActuel: project.chauffageActuel || null,
    beneficiaryType: 'pp_occupant',
    occupation: 'principale',
    priceMWh: dealPrice,
    ceePercent: minCeePercent > 0 ? Math.max(minCeePercent, 100) : null,
  } : null

  // Defaults du deal (même sans projet — simulations rapides)
  const dealDefaults = activeDeal ? {
    priceMWh: dealPrice,
    ceePercent: minCeePercent > 0 ? Math.max(minCeePercent, 100) : null,
  } : null

  /**
   * Retourne la valeur à utiliser pour un champ de formulaire.
   * Priorité : 1) inputs simulation en édition 2) données projet 3) defaults deal 4) fallback
   */
  function getDefault(fieldName, fallback) {
    if (editingSim?.inputs && editingSim.inputs[fieldName] !== undefined && editingSim.inputs[fieldName] !== null) {
      return editingSim.inputs[fieldName]
    }
    if (projectDefaults && projectDefaults[fieldName] !== undefined && projectDefaults[fieldName] !== null) {
      return projectDefaults[fieldName]
    }
    if (dealDefaults && dealDefaults[fieldName] !== undefined && dealDefaults[fieldName] !== null) {
      return dealDefaults[fieldName]
    }
    return fallback
  }

  /**
   * Retourne le prix CEE du deal actif pour une catégorie de précarité.
   * À appeler quand l'utilisateur change la catégorie dans le simulateur.
   */
  function getDealPrice(category) {
    if (!activeDeal) return null
    const key = CATEGORY_TO_PRICE_KEY[category] || 'classique'
    if (ficheCode) {
      return getPriceForFiche(activeDeal, ficheCode, key)
    }
    return activeDeal.pricePerMWhc?.[key] ?? null
  }

  return {
    projectId: projectId || clientId,
    scenarioId,
    editSimId,
    project,
    scenario,
    editingSim,
    projectDefaults,
    getDefault,
    getDealPrice,
    isEditMode: !!editingSim,
    isProjectContext: !!project,
    activeDeal,
    minCeePercent,
  }
}
