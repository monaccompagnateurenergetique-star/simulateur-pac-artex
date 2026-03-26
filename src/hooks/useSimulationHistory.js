import { useLocalStorage } from './useLocalStorage'

export function useSimulationHistory() {
  const [history, setHistory] = useLocalStorage('artex-simulations', [])

  function saveSimulation(type, title, inputs, results) {
    const entry = {
      id: crypto.randomUUID(),
      type,
      title,
      inputs,
      results,
      date: new Date().toISOString(),
    }
    setHistory((prev) => [entry, ...prev])
    return entry
  }

  function deleteSimulation(id) {
    setHistory((prev) => prev.filter((s) => s.id !== id))
  }

  function clearHistory() {
    setHistory([])
  }

  function getRecent(count = 5) {
    return history.slice(0, count)
  }

  return {
    history,
    saveSimulation,
    deleteSimulation,
    clearHistory,
    getRecent,
  }
}
