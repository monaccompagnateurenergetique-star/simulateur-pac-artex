/**
 * Jauge de complétion circulaire ou barre horizontale
 * @param {{ percent: number, size?: 'sm'|'md'|'lg', variant?: 'circle'|'bar', label?: string }} props
 */
export default function CompletionGauge({ percent = 0, size = 'md', variant = 'circle', label }) {
  const clamped = Math.max(0, Math.min(100, percent))

  // Couleur en fonction du pourcentage
  const getColor = (p) => {
    if (p >= 80) return { stroke: '#22c55e', bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' }
    if (p >= 50) return { stroke: '#eab308', bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100' }
    if (p >= 25) return { stroke: '#f97316', bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-100' }
    return { stroke: '#ef4444', bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' }
  }

  const color = getColor(clamped)

  // ─── Variante Cercle ───
  if (variant === 'circle') {
    const sizes = { sm: 48, md: 64, lg: 80 }
    const fontSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' }
    const dim = sizes[size]
    const strokeWidth = size === 'sm' ? 4 : 5
    const radius = (dim - strokeWidth * 2) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (clamped / 100) * circumference

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative" style={{ width: dim, height: dim }}>
          <svg width={dim} height={dim} className="-rotate-90">
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={radius}
              fill="none"
              stroke={color.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center font-bold ${fontSizes[size]} ${color.text}`}>
            {clamped}%
          </div>
        </div>
        {label && <span className="text-xs text-gray-500 text-center">{label}</span>}
      </div>
    )
  }

  // ─── Variante Barre ───
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className={`text-xs font-bold ${color.text}`}>{clamped}%</span>
        </div>
      )}
      <div className={`w-full h-2 rounded-full ${color.light}`}>
        <div
          className={`h-2 rounded-full ${color.bg} transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
