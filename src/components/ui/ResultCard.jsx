import clsx from 'clsx'

export default function ResultCard({ label, value, sublabel, className, size = 'md' }) {
  const sizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={clsx('text-center animate-result', className)}>
      {label && <p className="text-sm font-semibold uppercase tracking-wider mb-1 opacity-80">{label}</p>}
      <p className={clsx('font-extrabold', sizeMap[size])}>{value}</p>
      {sublabel && <p className="text-xs mt-1 opacity-70">{sublabel}</p>}
    </div>
  )
}
