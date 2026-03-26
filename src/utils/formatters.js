export function formatCurrency(amount) {
  return Math.round(amount).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  })
}

export function formatPercent(value) {
  return (value * 100).toFixed(0) + '%'
}

export function formatKWhc(value) {
  return Math.round(value).toLocaleString('fr-FR') + ' kWhc'
}

export function formatNumber(value) {
  return Math.round(value).toLocaleString('fr-FR')
}
