import { Calculator } from 'lucide-react'
import CatalogGrid from '../components/catalog/CatalogGrid'
import NewsList from '../components/news/NewsList'
import HistoryList from '../components/history/HistoryList'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-fade-in">
      {/* Hero */}
      <section className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-100 rounded-2xl mb-4">
          <Calculator className="w-8 h-8 text-lime-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Simulateurs CEE & Aides
        </h1>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          Calculez les primes CEE, MaPrimeRénov' et optimisez votre stratégie commerciale.
          Tous vos outils de rénovation énergétique en un seul endroit.
        </p>
      </section>

      {/* Catalog */}
      <section>
        <CatalogGrid />
      </section>

      {/* News */}
      <section>
        <NewsList limit={3} />
      </section>

      {/* Recent History */}
      <section>
        <HistoryList limit={5} />
      </section>
    </div>
  )
}
