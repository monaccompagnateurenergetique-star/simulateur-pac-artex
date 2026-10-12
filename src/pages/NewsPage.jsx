import { useState } from 'react'
import { Newspaper, FileText, AlertTriangle, ExternalLink, Calendar } from 'lucide-react'
import newsData from '../data/news.json'

const categoryColors = {
  réglementation: 'bg-red-50 text-red-700 border-red-200',
  aides: 'bg-green-50 text-green-700 border-green-200',
  actualités: 'bg-blue-50 text-blue-700 border-blue-200',
  guides: 'bg-purple-50 text-purple-700 border-purple-200',
  alerte: 'bg-orange-50 text-orange-700 border-orange-200',
}

const sortedNews = [...newsData].sort((a, b) => {
  if (a.important && !b.important) return -1
  if (!a.important && b.important) return 1
  return new Date(b.date) - new Date(a.date)
})

const allCategories = [...new Set(sortedNews.map((a) => a.category))]

export default function NewsPage() {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? sortedNews : sortedNews.filter((a) => a.category === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Actu hebdo</h1>
            <p className="text-sm text-gray-500">Actualités et informations sur la rénovation énergétique</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-black text-gray-800">{sortedNews.length}</p>
          <p className="text-xs text-gray-500">Articles</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-black text-orange-600">{sortedNews.filter(a => a.important).length}</p>
          <p className="text-xs text-gray-500">Alertes</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-black text-gray-800">{allCategories.length}</p>
          <p className="text-xs text-gray-500">Catégories</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-black text-gray-800">{filtered.length}</p>
          <p className="text-xs text-gray-500">Affichés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Tout ({sortedNews.length})
        </button>
        {allCategories.map((cat) => {
          const count = sortedNews.filter(a => a.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition capitalize ${
                filter === cat ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filtered.map((article) => (
          <article
            key={article.id}
            className={`bg-white rounded-2xl border p-6 hover:shadow-md transition-shadow ${
              article.important
                ? 'border-orange-300 ring-1 ring-orange-100'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {article.important && (
                <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">ALERTE</span>
                </div>
              )}
              {!article.important && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border capitalize ${
                  categoryColors[article.category] || 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {article.category}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {new Date(article.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>

            <h2 className={`text-lg font-bold mb-2 ${article.important ? 'text-orange-900' : 'text-gray-900'}`}>
              {article.title}
            </h2>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${article.important ? 'text-orange-800' : 'text-gray-600'}`}>
              {article.content}
            </p>

            {(article.pdf || article.pdf2 || article.link) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {article.pdf && (
                  <a
                    href={`${import.meta.env.BASE_URL}${article.pdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {article.pdf2Label || 'Consulter le PDF'}
                  </a>
                )}
                {article.link && (
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {article.linkLabel || 'Voir la source'}
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">Aucun article dans cette catégorie.</p>
        </div>
      )}
    </div>
  )
}
