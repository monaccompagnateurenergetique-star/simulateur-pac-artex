export default function Slider({ label, id, value, onChange, min = 0, max = 100, step = 1, unit = '%', leftLabel, rightLabel }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2 flex justify-between items-center">
          <span>{label}</span>
          <span className="text-xl font-extrabold text-indigo-600">{value}{unit}</span>
        </label>
      )}
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}
