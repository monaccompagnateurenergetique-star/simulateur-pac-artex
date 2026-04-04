/**
 * useClients — Compat wrapper autour de useProjects
 * Les pages legacy qui importent useClients continuent de fonctionner
 */
import { useProjects, PROJECT_STATUSES } from './useProjects'

export const STATUSES = PROJECT_STATUSES

export function useClients() {
  return useProjects()
}
