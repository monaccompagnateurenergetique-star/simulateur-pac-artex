import { BarChart3, TrendingDown, CheckCircle } from 'lucide-react'
import { computeMultiCategorySynthesis } from '../../hooks/useEstimations'
import { calculerTTC } from '../../lib/constants/prixVente'

const CATEGORY_COLORS = {
  Bleu:   { bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-400',   header: 'bg-blue-500/30' },
  Jaune:  { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', header: 'bg-yellow-500/30' },
  Violet: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', header: 'bg-purple-500/30' },
  Rose:   { bg: 'bg-pink-500/20',   border: 'border-pink-500/40',   text: 'text-pink-400',   header: 'bg-pink-500/30' },
}

const CATEGORY_LABELS = {
  Bleu: 'Très modestes',
  Jaune: 'Modestes',
  Violet: 'Intermédiaires',
  Rose: 'Supérieurs',
}

function fmt(n) {
  return Math.round(n).toLocaleString('fr-FR')
}

export default function SyntheseStep({ data }) {
  const travaux = data.travaux || []
  const isDetaille = data.workMode === 'detaille' && travaux.length > 0
  const projectCostHT = isDetaille
    ? travaux.reduce((s, t) => s + (t.prixHT || 0), 0)
    : (data.projectCostHT || 0)
  const projectCostTTC = isDetaille
    ? travaux.reduce((s, t) => s + calculerTTC(t.prixHT || 0, t.tva || 5.5), 0)
    : (data.projectCostTTC || 0)

  const results = computeMultiCategorySynthesis({
    typeLogement: data.typeLogement || 'Maison',
    surface: data.surface || 100,
    classInitiale: data.classInitiale || 'G',
    classeCible: data.classeCible || 'D',
    zone: data.zoneClimatique || 'H1',
    travaux,
    projectCostHT,
    projectCostTTC,
    priceMWh: data.priceMWh ?? 7,
    ceePercent: data.ceePercent ?? 100,
    includePAC: data.includePAC || false,
    pacParams: {
      type: data.typeLogement || 'Maison',
      etas: data.pacEtas || 'high',
    },
  })

  const categories = ['Bleu', 'Jaune', 'Violet', 'Rose']

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Synthèse financière</h3>
          <p className="text-sm text-gray-400">Estimation des aides par catégorie de revenus</p>
        </div>
      </div>

      {/* Recap projet */}
      <div className="bg-white/5 border border-gray-700 rounded-xl p-4 flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase">Logement</p>
          <p className="text-white font-medium">{data.typeLogement} — {data.surface} m²</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">DPE</p>
          <p className="text-white font-medium">{data.classInitiale} → {data.classeCible} ({results.Bleu?.jump || 0} sauts)</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Budget TTC</p>
          <p className="text-white font-medium">{fmt(projectCostTTC)} €</p>
        </div>
        {data.includePAC && (
          <div>
            <p className="text-xs text-gray-500 uppercase">PAC Air/Eau</p>
            <p className="text-emerald-400 font-medium">Incluse</p>
          </div>
        )}
      </div>

      {/* Tableau 4 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const r = results[cat]
          if (!r) return null
          const colors = CATEGORY_COLORS[cat]
          return (
            <div key={cat} className={`rounded-xl border ${colors.border} overflow-hidden`}>
              <div className={`${colors.header} px-4 py-3`}>
                <p className={`font-bold ${colors.text}`}>{cat}</p>
                <p className="text-xs text-gray-400">{CATEGORY_LABELS[cat]}</p>
              </div>
              <div className="p-4 space-y-3">
                <Row label="Prime CEE" value={r.ceeApplied} colors={colors} />
                {r.ceeApplied > 0 && r.ceePAC > 0 && (
                  <p className="text-[10px] text-gray-500 -mt-2 ml-1">
                    dont PAC : {fmt(r.ceePAC)} €
                  </p>
                )}
                <Row label="MaPrimeRénov'" value={r.mprAmount} colors={colors} />
                {r.amoAmount > 0 && (
                  <Row label="AMO (MAR)" value={r.amoAmount} colors={colors} />
                )}
                <div className="border-t border-gray-700 pt-3">
                  <Row label="Total aides" value={r.totalAides} colors={colors} bold />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Reste à charge</span>
                  <span className="text-white font-bold text-lg">{fmt(r.resteACharge)} €</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bg.replace('/20', '')}`}
                      style={{ width: `${Math.min(r.tauxCouverture, 100)}%`, backgroundColor: colors.text.includes('blue') ? '#3b82f6' : colors.text.includes('yellow') ? '#eab308' : colors.text.includes('purple') ? '#a855f7' : '#ec4899' }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${colors.text}`}>{r.tauxCouverture}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p>Les montants sont indicatifs et dépendent des revenus fiscaux de référence du futur acquéreur.</p>
        <p>CEE = Certificats d'Économie d'Énergie | MPR = MaPrimeRénov' Parcours Accompagné | AMO = Mon Accompagnateur Rénov'</p>
      </div>
    </div>
  )
}

function Row({ label, value, colors, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'text-white font-medium' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-sm font-medium ${value > 0 ? colors.text : 'text-gray-600'}`}>
        {value > 0 ? `- ${fmt(value)} €` : '—'}
      </span>
    </div>
  )
}
