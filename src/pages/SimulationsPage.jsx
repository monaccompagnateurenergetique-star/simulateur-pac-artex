import { Link, useSearchParams } from 'react-router-dom'
import { Calculator, ChevronRight, Zap } from 'lucide-react'
import { CATALOG } from '../lib/constants/catalog'

export default function SimulationsPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId')
  const scenarioId = searchParams.get('scenarioId')

  const queryString = projectId
    ? `?projectId=${projectId}${scenarioId ? `&scenarioId=${scenarioId}` : ''}`
    : ''

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Calculator className="w-7 h-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Simulations rapides</h1>
          <p className="text-sm text-gray-500">Estimez les aides CEE, MPR, ANAH et PTZ pour chaque type de travaux</p>
        </div>
      </div>

      {projectId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-6 text-sm text-indigo-700 flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0" />
          <span>
            Simulation pour un projet{scenarioId ? ' (scénario lié)' : ''}.
            Le résultat sera automatiquement rattaché au projet.
          </span>
        </div>
      )}

      <div className="space-y-8">
        {CATALOG.map((cat) => {
          const activeItems = cat.items.filter((i) => i.active)
          if (activeItems.length === 0) return null

          return (
            <div key={cat.category}>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-lg">{cat.emoji}</span> {cat.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeItems.map((item) => (
                  <Link
                    key={item.code}
                    to={`${item.route}${queryString}`}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 group-hover:text-indigo-700 transition">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.description || item.code}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
