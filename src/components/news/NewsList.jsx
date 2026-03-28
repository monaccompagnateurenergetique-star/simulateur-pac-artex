import { Link } from 'react-router-dom'
import { Newspaper, ArrowRight, AlertTriangle } from 'lucide-react'
import newsData from '../../data/news.json'

const categoryColors = {
  réglementation: 'bg-red-100 text-red-700',
  aides: 'bg-green-100 text-green-700',
  actualités: 'bg-blue-100 text-blue-700',
  guides: 'bg-purple-100 text-purple-700',
  alerte: 'bg-orange-100 text-orange-700',
}

// Tri par date décroissante
const sortedNews = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date))

export default function NewsList({ limit = 3, showViewAll = true }) {
  const articles = limit ? sortedNews.slice(0, limit) : sortedNews

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-indigo-600" />
          Actualités & Informations
        </h2>
        {showViewAll && (
          <Link
            to="/actualites"
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.map((article) => (
          <article
            key={article.id}
            className={`rounded-xl border p-4 hover:shadow-md transition-shadow ${
              article.important
                ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-200 md:col-span-3'
                : 'bg-white border-gray-200'
            }`}
          >
            {article.important ? (
              // Full-width alert layout
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">
                    ALERTE
                  </span>
                  <span className="text-xs text-orange-600 font-medium">
                    {new Date(article.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-orange-900 mb-1">{article.title}</h3>
                <p className="text-xs text-orange-800">{article.summary}</p>
              </div>
            ) : (
              // Standard card layout
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      categoryColors[article.category] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(article.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2">{article.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-3">{article.summary}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
