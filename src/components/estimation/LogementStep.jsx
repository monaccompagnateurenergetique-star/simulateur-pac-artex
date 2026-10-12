import { Home, ArrowUpRight } from 'lucide-react'
import { ENERGY_CLASSES, TARGET_CLASSES, CLASS_ORDER, MIN_CLASS_JUMP } from '../../lib/constants/renovationGlobale'

const CHAUFFAGE_OPTIONS = [
  { value: 'gaz', label: 'Gaz naturel' },
  { value: 'fioul', label: 'Fioul' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'bois', label: 'Bois / Granulés' },
  { value: 'pac', label: 'Pompe à chaleur' },
  { value: 'autre', label: 'Autre / Inconnu' },
]

export default function LogementStep({ data, onChange }) {
  const jump = (() => {
    const i = CLASS_ORDER.indexOf(data.classInitiale)
    const c = CLASS_ORDER.indexOf(data.classeCible)
    if (i < 0 || c < 0) return 0
    return c - i
  })()

  const validJump = jump >= MIN_CLASS_JUMP

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Home className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Caractéristiques du logement</h3>
          <p className="text-sm text-gray-400">Type, surface et performance énergétique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Type de logement</label>
          <div className="flex gap-3">
            {['Maison', 'Appartement'].map((type) => (
              <button
                key={type}
                onClick={() => onChange({ typeLogement: type })}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                  data.typeLogement === type
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-white/5 border-gray-700 text-gray-400 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Surface habitable (m²)</label>
          <input
            type="number"
            value={data.surface || ''}
            onChange={(e) => onChange({ surface: Number(e.target.value) })}
            placeholder={data.typeLogement === 'Appartement' ? '60' : '100'}
            min={10}
            max={500}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Classe DPE initiale</label>
          <select
            value={data.classInitiale || ''}
            onChange={(e) => onChange({ classInitiale: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Sélectionner</option>
            {ENERGY_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Classe DPE cible</label>
          <select
            value={data.classeCible || ''}
            onChange={(e) => onChange({ classeCible: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Sélectionner</option>
            {TARGET_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Chauffage actuel</label>
          <select
            value={data.chauffageActuel || ''}
            onChange={(e) => onChange({ chauffageActuel: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Sélectionner</option>
            {CHAUFFAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {data.classInitiale && data.classeCible && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
          validJump ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <ArrowUpRight className={`w-5 h-5 ${validJump ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className={`text-sm font-medium ${validJump ? 'text-emerald-300' : 'text-red-300'}`}>
            {jump > 0
              ? `Saut de ${jump} classe${jump > 1 ? 's' : ''} : ${data.classInitiale} → ${data.classeCible}`
              : 'La classe cible doit être supérieure à la classe initiale'}
            {jump > 0 && jump < MIN_CLASS_JUMP && ` (minimum ${MIN_CLASS_JUMP} classes requises)`}
          </span>
        </div>
      )}
    </div>
  )
}
