import { useSearchParams } from 'react-router-dom'
import { useClients } from './useClients'

/**
 * Hook that reads ?clientId from URL and returns client data for pre-filling simulators.
 * Also provides a save helper that auto-links the simulation to the client.
 */
export function useClientContext() {
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const { clients, linkSimulation } = useClients()

  const client = clientId ? clients.find((c) => c.id === clientId) : null

  function linkToClient(simulationId) {
    if (clientId && simulationId) {
      linkSimulation(clientId, simulationId)
    }
  }

  return {
    clientId,
    client,
    linkToClient,
    // Pre-fill helpers
    prefill: client
      ? {
          surface: client.surface || null,
          zone: client.zone || null,
          mprCategory: client.category || null,
          typeLogement: client.typeLogement || null,
          housingType: client.typeLogement === 'appartement' ? 'Appartement' : 'Maison',
        }
      : null,
  }
}
