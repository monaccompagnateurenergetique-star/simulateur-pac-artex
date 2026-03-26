import clsx from 'clsx'

export default function Card({ children, className, onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        hover && 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
