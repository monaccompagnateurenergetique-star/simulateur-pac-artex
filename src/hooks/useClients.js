/**
 * useClients — Compat wrapper autour de useProjects
 * Les pages legacy qui importent useClients continuent de fonctionner
 */
import { useProjects, PROJECT_STATUSES, TYPES_TRAVAUX, getTypeTravauxInfo } from './useProjects'

export const STATUSES = PROJECT_STATUSES
export { TYPES_TRAVAUX, getTypeTravauxInfo }

export function useClients() {
  return useProjects()
}
