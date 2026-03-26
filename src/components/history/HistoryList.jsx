import { Link } from 'react-router-dom'
import { History, ArrowRight, Trash2, Clock } from 'lucide-react'
import { useSimulationHistory } from '../../hooks/useSimulationHistory'
import { formatCurrency } from '../../utils/formatters'
import Button from '../ui/Button'

export default function HistoryList({ limit, showViewAll = true, showDelete = false }) {
  const { history, deleteSimulation, clearHistory } = useSimulationHistory()
  const items = limit ? history.slice(0, limit) : history

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucune simulation sauvegardée pour le moment.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          Historique des simulations
        </h2>
        <div className="flex items-center gap-2">
          {showDelete && history.length > 0 && (
            <Button variant="danger" size="sm" onClick={clearHistory}>
              Tout effacer
            </Button>
          )}
          {showViewAll && (
            <Link
              to="/historique"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                  {item.type}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(item.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-1 truncate">{item.title}</p>
              {item.results?.totalAid !== undefined && (
                <p className="text-xs text-gray-500">
                  Total aides : {formatCurrency(item.results.totalAid)} — RAC : {formatCurrency(item.results.resteACharge)}
                </p>
              )}
            </div>
            {showDelete && (
              <button
                onClick={() => deleteSimulation(item.id)}
                className="ml-3 p-2 text-gray-400 hover:text-red-500 transition"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
