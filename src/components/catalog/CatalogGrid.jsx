import { CATALOG } from '../../lib/constants/catalog'
import CatalogCard from './CatalogCard'

export default function CatalogGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {CATALOG.map((category) => (
        <div key={category.category}>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>{category.emoji}</span>
            {category.category}
          </h3>
          <div className="space-y-2">
            {category.items.map((item) => (
              <CatalogCard key={item.code} {...item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
