export const PRIX_TRAVAUX_DEFAUT = {
  pac_air_eau:        { label: 'PAC air/eau', prixTTC: 14000, tva: 5.5, ficheCode: 'bar-th-171', unite: null },
  pac_air_air:        { label: 'PAC air/air', prixTTC: 8000, tva: 5.5, ficheCode: null, unite: null },
  chaudiere_granules: { label: 'Chaudière à granulés', prixTTC: 18000, tva: 5.5, ficheCode: 'bar-th-113', unite: null },
  combles_perdus:     { label: 'Isolation combles perdus', prixTTC: 35, tva: 5.5, ficheCode: 'bar-en-101', unite: '€/m²' },
  rampants:           { label: 'Isolation rampants', prixTTC: 55, tva: 5.5, ficheCode: 'bar-en-101', unite: '€/m²' },
  toiture_terrasse:   { label: 'Isolation toiture-terrasse', prixTTC: 80, tva: 5.5, ficheCode: 'bar-en-101', unite: '€/m²' },
  murs_ite:           { label: 'Isolation murs (ITE)', prixTTC: 150, tva: 5.5, ficheCode: 'bar-en-102', unite: '€/m²' },
  murs_iti:           { label: 'Isolation murs (ITI)', prixTTC: 90, tva: 5.5, ficheCode: 'bar-en-102', unite: '€/m²' },
  plancher:           { label: 'Isolation plancher bas', prixTTC: 55, tva: 5.5, ficheCode: 'bar-en-103', unite: '€/m²' },
  menuiseries:        { label: 'Fenêtres / Menuiseries', prixTTC: 800, tva: 5.5, ficheCode: null, unite: '€/unité' },
  vmc_simple:         { label: 'VMC simple flux', prixTTC: 2500, tva: 5.5, ficheCode: null, unite: null },
  vmc_double:         { label: 'VMC double flux', prixTTC: 5500, tva: 5.5, ficheCode: null, unite: null },
  ecs_electrique:     { label: 'Ballon ECS électrique', prixTTC: 1500, tva: 5.5, ficheCode: null, unite: null },
  ecs_thermo:         { label: 'Ballon ECS thermodynamique', prixTTC: 3500, tva: 5.5, ficheCode: null, unite: null },
}

export const ESTIMATION_STATUSES = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'termine', label: 'Terminé', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'envoye', label: 'Envoyé', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
]
