export default function Footer() {
  return (
    <footer className="bg-[#121212] text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-white">Artex360</p>
            <p className="text-xs mt-1">Plateforme d'outils pour artisans en rénovation énergétique</p>
          </div>
          <div className="text-xs text-gray-500">
            <p>Simulations à titre indicatif et non contractuelles.</p>
            <p className="mt-1">© {new Date().getFullYear()} Artex360. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
