/**
 * Prix de vente par défaut par poste de travaux — Estimations agences immo
 * TVA réduite 5.5% pour travaux de rénovation énergétique (logement > 2 ans)
 */

export const PRIX_VENTE_DEFAUT = {
  maison: {
    isolation_combles:    { label: 'Isolation combles perdus',     prixHT: 3500,  tva: 5.5, categorie: 'isolation' },
    isolation_rampants:   { label: 'Isolation rampants de toiture', prixHT: 5500,  tva: 5.5, categorie: 'isolation' },
    isolation_murs_ite:   { label: 'Isolation murs (ITE)',         prixHT: 12000, tva: 5.5, categorie: 'isolation' },
    isolation_murs_iti:   { label: 'Isolation murs (ITI)',         prixHT: 7000,  tva: 5.5, categorie: 'isolation' },
    isolation_plancher:   { label: 'Isolation plancher bas',       prixHT: 3000,  tva: 5.5, categorie: 'isolation' },
    menuiseries:          { label: 'Remplacement menuiseries',     prixHT: 8000,  tva: 5.5, categorie: 'isolation' },
    pac_air_eau:          { label: 'PAC Air/Eau',                  prixHT: 15000, tva: 5.5, categorie: 'chauffage' },
    pac_air_air:          { label: 'PAC Air/Air',                  prixHT: 8000,  tva: 5.5, categorie: 'chauffage' },
    chaudiere_granules:   { label: 'Chaudière à granulés',         prixHT: 18000, tva: 5.5, categorie: 'chauffage' },
    vmc_simple:           { label: 'VMC simple flux hygro',        prixHT: 2500,  tva: 5.5, categorie: 'ventilation' },
    vmc_double:           { label: 'VMC double flux',              prixHT: 5000,  tva: 5.5, categorie: 'ventilation' },
    ballon_electrique:    { label: 'Ballon ECS électrique',        prixHT: 1500,  tva: 5.5, categorie: 'ecs' },
    ballon_thermo:        { label: 'Ballon thermodynamique',       prixHT: 3500,  tva: 5.5, categorie: 'ecs' },
  },
  appartement: {
    isolation_combles:    { label: 'Isolation combles / plafond',  prixHT: 2500,  tva: 5.5, categorie: 'isolation' },
    isolation_murs_ite:   { label: 'Isolation murs (ITE)',         prixHT: 9000,  tva: 5.5, categorie: 'isolation' },
    isolation_murs_iti:   { label: 'Isolation murs (ITI)',         prixHT: 5000,  tva: 5.5, categorie: 'isolation' },
    isolation_plancher:   { label: 'Isolation plancher bas',       prixHT: 2000,  tva: 5.5, categorie: 'isolation' },
    menuiseries:          { label: 'Remplacement menuiseries',     prixHT: 6000,  tva: 5.5, categorie: 'isolation' },
    pac_air_eau:          { label: 'PAC Air/Eau',                  prixHT: 12000, tva: 5.5, categorie: 'chauffage' },
    pac_air_air:          { label: 'PAC Air/Air',                  prixHT: 6000,  tva: 5.5, categorie: 'chauffage' },
    vmc_simple:           { label: 'VMC simple flux hygro',        prixHT: 2000,  tva: 5.5, categorie: 'ventilation' },
    vmc_double:           { label: 'VMC double flux',              prixHT: 4000,  tva: 5.5, categorie: 'ventilation' },
    ballon_electrique:    { label: 'Ballon ECS électrique',        prixHT: 1200,  tva: 5.5, categorie: 'ecs' },
    ballon_thermo:        { label: 'Ballon thermodynamique',       prixHT: 3000,  tva: 5.5, categorie: 'ecs' },
  },
}

export const CATEGORIES_LABELS = {
  isolation: 'Isolation',
  chauffage: 'Chauffage',
  ventilation: 'Ventilation',
  ecs: 'Eau chaude sanitaire',
}

export function calculerTTC(prixHT, tva) {
  return Math.round(prixHT * (1 + tva / 100) * 100) / 100
}

export function getTotalHT(travaux) {
  return travaux.reduce((sum, t) => sum + (t.prixHT || 0), 0)
}

export function getTotalTTC(travaux) {
  return travaux.reduce((sum, t) => sum + calculerTTC(t.prixHT || 0, t.tva || 5.5), 0)
}
