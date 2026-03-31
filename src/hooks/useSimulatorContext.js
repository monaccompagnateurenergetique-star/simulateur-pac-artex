import { useSearchParams } from 'react-router-dom'
import { useProjects } from './useProjects'
import { getLocationInfo } from '../utils/postalCode'

/**
 * Hook centralisé pour les simulateurs.
 * - Détecte le contexte projet/scénario/édition depuis l'URL
 * - Fournit les données du projet pour pré-remplir les champs
 * - En mode édition, retourne les inputs de la simulation précédente
 * - Fonctionne aussi avec ?clientId (simulations rapides legacy)
 */
export function useSimulatorContext() {
  const [searchParams] = useSearchParams()
  const { projects } = useProjects()

  const projectId = searchParams.get('projectId')
  const scenarioId = searchParams.get('scenarioId')
  const editSimId = searchParams.get('editSimId')
  const clientId = searchParams.get('clientId')

  // Trouver le projet — soit via projectId (scénario), soit via clientId (simulation rapide)
  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : clientId
      ? projects.find((p) => p.id === clientId)
      : null

  const scenario = project && scenarioId
    ? (project.scenarios || []).find((s) => s.id === scenarioId)
    : null

  // Simulation à éditer
  const editingSim = scenario && editSimId
    ? scenario.simulations.find((s) => s.id === editSimId)
    : null

  // Données du projet pour pré-remplir
  const locationInfo = project?.postalCode ? getLocationInfo(project.postalCode) : null

  const projectDefaults = project ? {
    zone: locationInfo?.zoneClimatique || null,
    mprCategory: project.category || null,
    surface: project.surface ? Number(project.surface) : null,
    housingType: project.typeLogement === 'appartement' ? 'Appartement' : project.typeLogement === 'maison' ? 'Maison' : null,
    personnes: project.personnes ? Number(project.personnes) : null,
    // Réno globale : bénéficiaire
    beneficiaryType: 'pp_occupant',
    occupation: 'principale',
  } : null

  /**
   * Retourne la valeur à utiliser pour un champ de formulaire.
   * Priorité : 1) inputs de la simulation en édition, 2) données du projet, 3) valeur par défaut
   */
  function getDefault(fieldName, fallback) {
    // 1. Mode édition : reprendre les inputs sauvegardés
    if (editingSim?.inputs && editingSim.inputs[fieldName] !== undefined && editingSim.inputs[fieldName] !== null) {
      return editingSim.inputs[fieldName]
    }
    // 2. Pré-remplir depuis le projet
    if (projectDefaults && projectDefaults[fieldName] !== undefined && projectDefaults[fieldName] !== null) {
      return projectDefaults[fieldName]
    }
    // 3. Valeur par défaut du simulateur
    return fallback
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
    isEditMode: !!editingSim,
    isProjectContext: !!project,
  }
}
