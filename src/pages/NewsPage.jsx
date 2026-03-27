import { useState } from 'react'
import { Newspaper, FileText } from 'lucide-react'
import newsData from '../data/news.json'

const categoryColors = {
  réglementation: 'bg-red-100 text-red-700 border-red-200',
  aides: 'bg-green-100 text-green-700 border-green-200',
  actualités: 'bg-blue-100 text-blue-700 border-blue-200',
  guides: 'bg-purple-100 text-purple-700 border-purple-200',
}

const allCategories = [...new Set(newsData.map((a) => a.category))]

export default function NewsPage() {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? newsData : newsData.filter((a) => a.category === filter)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Newspaper className="w-6 h-6 text-indigo-600" />
        Actualités & Informations
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tout
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition capitalize ${
              filter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filtered.map((article) => (
          <article
            key={article.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  categoryColors[article.category] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {article.category}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(article.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">{article.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{article.content}</p>
            {(article.pdf || article.pdf2) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.pdf && (
                  <a
                    href={`${import.meta.env.BASE_URL}${article.pdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {article.pdf2 ? (article.pdf2Label ? 'Fiche BAR-TH-174' : 'Consulter le PDF') : 'Consulter le PDF'}
                  </a>
                )}
                {article.pdf2 && (
                  <a
                    href={`${import.meta.env.BASE_URL}${article.pdf2}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {article.pdf2Label || 'Consulter le PDF'}
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
