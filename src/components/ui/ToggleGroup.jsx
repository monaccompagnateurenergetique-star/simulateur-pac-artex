import clsx from 'clsx'

export default function ToggleGroup({ label, options, value, onChange, activeColor = 'indigo' }) {
  const colorMap = {
    indigo: { active: 'border-indigo-600 bg-indigo-50 text-indigo-700', inactive: 'border-gray-300 text-gray-500 hover:bg-gray-50' },
    green: { active: 'border-green-600 bg-green-50 text-green-700', inactive: 'border-gray-300 text-gray-500 hover:bg-gray-50' },
    red: { active: 'border-red-600 bg-red-50 text-red-700', inactive: 'border-gray-300 text-gray-500 hover:bg-gray-50' },
  }

  const colors = colorMap[activeColor] || colorMap.indigo

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      )}
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              'flex-1 py-2 px-3 rounded-lg border-2 font-bold text-sm transition-all duration-200',
              value === opt.value ? colors.active : colors.inactive
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
