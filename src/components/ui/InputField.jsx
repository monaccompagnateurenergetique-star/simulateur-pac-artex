export default function InputField({ label, id, value, onChange, type = 'text', suffix, helper, placeholder, min, max, step, className, readOnly }) {
  function handleChange(e) {
    const raw = e.target.value
    if (type === 'number') {
      // Permettre le champ vide temporairement pour la saisie
      if (raw === '' || raw === '-') {
        onChange(raw)
        return
      }
      const parsed = parseFloat(raw)
      onChange(isNaN(parsed) ? '' : parsed)
    } else {
      onChange(raw)
    }
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          readOnly={readOnly}
          className={`w-full pl-3 ${suffix ? 'pr-12' : 'pr-3'} py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition${readOnly ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 text-sm font-medium">
            {suffix}
          </div>
        )}
      </div>
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  )
}
