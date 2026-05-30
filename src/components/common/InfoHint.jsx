import { useId } from 'react'
import './InfoHint.css'

/**
 * Petite icône « ? » avec infobulle au survol / focus.
 * 100% CSS + accessible — aucune dépendance externe.
 */
export default function InfoHint({ text, label = 'Aide', className }) {
  const id = useId()
  return (
    <span className={`info-hint ${className ?? ''}`}>
      <button
        type="button"
        className="info-hint__btn"
        aria-label={label}
        aria-describedby={id}
        title={text}
      >
        <i className="fa-solid fa-circle-question" aria-hidden="true" />
      </button>
      <span role="tooltip" id={id} className="info-hint__bubble">
        {text}
      </span>
    </span>
  )
}
