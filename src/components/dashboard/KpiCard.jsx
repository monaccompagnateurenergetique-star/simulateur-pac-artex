import { ArrowUp, ArrowDown } from 'lucide-react'

export default function KpiCard({ icon: Icon, value, label, color = 'text-indigo-600', bgColor = 'bg-indigo-50', trend, trendLabel }) {
  const hasTrend = trend !== undefined && trend !== null
  const isPositive = trend > 0
  const isNeutral = trend === 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {hasTrend && !isNeutral && (
          <div className={`flex items-center gap-1 mt-0.5 text-[10px] font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{trend}% {trendLabel || 'vs 7j'}
          </div>
        )}
      </div>
    </div>
  )
}
