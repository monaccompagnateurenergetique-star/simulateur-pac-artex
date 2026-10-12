import { useState } from 'react'
import { MapPin, Search, Loader2, ExternalLink } from 'lucide-react'
import { searchDPE, getDpeColor } from '../../utils/dpeApi'
import { getLocationInfo } from '../../utils/postalCode'

export default function AddressStep({ data, onChange, onSelectDpe }) {
  const [searching, setSearching] = useState(false)
  const [dpeResults, setDpeResults] = useState(null)
  const [error, setError] = useState('')

  const locationInfo = data.postalCode?.length >= 5 ? getLocationInfo(data.postalCode) : null

  function handlePostalCodeChange(value) {
    onChange({ postalCode: value })
    if (value.length >= 5) {
      const info = getLocationInfo(value)
      if (info) {
        onChange({
          postalCode: value,
          zoneClimatique: info.zoneSimplifiee,
          departement: info.departement,
          region: info.region,
          isIDF: info.isIDF,
        })
      }
    }
  }

  async function handleSearch() {
    if (!data.address && !data.postalCode) return
    setSearching(true)
    setError('')
    setDpeResults(null)
    try {
      const result = await searchDPE(data.address, data.postalCode, data.city)
      setDpeResults(result)
      if (result.results.length === 0) {
        setError('Aucun DPE trouvé à cette adresse.')
      }
    } catch (err) {
      setError('Erreur lors de la recherche DPE.')
    } finally {
      setSearching(false)
    }
  }

  function handleSelectDpe(dpe) {
    onSelectDpe(dpe)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Adresse du bien</h3>
          <p className="text-sm text-gray-400">Saisissez l'adresse pour rechercher le DPE existant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
          <input
            type="text"
            value={data.address || ''}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="12 rue de la Paix"
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Code postal</label>
          <input
            type="text"
            value={data.postalCode || ''}
            onChange={(e) => handlePostalCodeChange(e.target.value)}
            placeholder="75001"
            maxLength={5}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Ville</label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Paris"
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {locationInfo && (
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
            Zone {locationInfo.zoneSimplifiee}
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
            {locationInfo.region}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 text-xs font-medium">
            Dép. {locationInfo.departement}
          </span>
          {locationInfo.isIDF && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">
              Île-de-France
            </span>
          )}
        </div>
      )}

      <button
        onClick={handleSearch}
        disabled={searching || (!data.address && !data.postalCode)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium transition-all"
      >
        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Rechercher le DPE
      </button>

      {error && (
        <p className="text-amber-400 text-sm bg-amber-500/10 px-4 py-3 rounded-xl">{error}</p>
      )}

      {dpeResults?.results?.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 font-medium">
            {dpeResults.results.length} DPE trouvé{dpeResults.results.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dpeResults.results.map((dpe, idx) => {
              const color = getDpeColor(dpe.etiquetteDpe)
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectDpe(dpe)}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-blue-500 rounded-xl text-left transition-all"
                >
                  <span
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-black shrink-0"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {dpe.etiquetteDpe}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{dpe.adresse}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      {dpe.surface && <span>{dpe.surface} m²</span>}
                      {dpe.typeBatiment && <span>{dpe.typeBatiment}</span>}
                      {dpe.consoM2 && <span>{dpe.consoM2} kWh/m².an</span>}
                      {dpe.energieChauffage && <span>{dpe.energieChauffage}</span>}
                    </div>
                  </div>
                  {dpe.observatoireUrl && (
                    <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
