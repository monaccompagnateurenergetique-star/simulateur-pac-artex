import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'

/**
 * AddressAutocomplete — Input avec suggestions via API BAN (adresse.data.gouv.fr)
 * Props:
 *   value: string — texte affiché dans l'input (label complet ou adresse)
 *   onChange({ address, postalCode, city, label }) — appelé à la sélection ou saisie libre
 */
export default function AddressAutocomplete({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const prevValueRef = useRef(value)

  // Sync externe — seulement si la prop change depuis l'extérieur (pas depuis notre onChange)
  useEffect(() => {
    if (value !== prevValueRef.current && !selected) {
      setQuery(value || '')
    }
    prevValueRef.current = value
  }, [value, selected])

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (val) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search?q=${encodeURIComponent(val)}&limit=5&type=housenumber`
      )
      const data = await res.json()
      let results = data.features || []

      // Fallback sans type housenumber
      if (!results.length) {
        const res2 = await fetch(
          `https://api-adresse.data.gouv.fr/search?q=${encodeURIComponent(val)}&limit=5`
        )
        const data2 = await res2.json()
        results = data2.features || []
      }

      if (results.length) {
        setSuggestions(results.map((f) => ({
          label: f.properties.label,
          address: `${f.properties.housenumber || ''} ${f.properties.street || f.properties.name || ''}`.trim(),
          postalCode: f.properties.postcode || '',
          city: f.properties.city || '',
        })))
        setShowDropdown(true)
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(val) {
    setQuery(val)
    setSelected(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 4) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(() => search(val), 400)
  }

  function handleSelect(suggestion) {
    setQuery(suggestion.label)
    setSelected(true)
    setSuggestions([])
    setShowDropdown(false)
    onChange({
      address: suggestion.address,
      postalCode: suggestion.postalCode,
      city: suggestion.city,
      label: suggestion.label,
    })
  }

  function handleClear() {
    setQuery('')
    setSelected(false)
    setSuggestions([])
    setShowDropdown(false)
    onChange({ address: '', postalCode: '', city: '', label: '' })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder || 'Saisissez une adresse...'}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
        {!loading && query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition text-sm flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
