export const CATALOG = [
  {
    category: 'Chauffage & EnR',
    emoji: '☀️',
    items: [
      { code: 'BAR-TH-171', title: 'Pompe à chaleur air/eau', description: 'CEE + MPR — Coup de Pouce Chauffage', route: '/simulateur/bar-th-171', active: true },
      { code: 'BAR-TH-112', title: 'Appareil de chauffage au bois', description: 'Poêle, insert, foyer fermé, cuisinière', route: '/simulateur/bar-th-112', active: true },
      { code: 'BAR-TH-113', title: 'Chaudière biomasse individuelle', description: 'Chaudière bois / granulés', route: '/simulateur/bar-th-113', active: true },
      { code: 'BAR-TH-179', title: 'PAC collective air/eau ou eau/eau', description: 'CEE + Coup de Pouce Chauffage collectif', route: '/simulateur/bar-th-179', active: true },
      { code: 'BAR-TH-172', title: 'PAC géothermique', route: null, active: false },
      { code: 'BAR-TH-106', title: 'Chauffe-eau thermodynamique', route: null, active: false },
      { code: 'BAR-TH-143', title: 'Système solaire combiné', route: null, active: false },
    ],
  },
  {
    category: 'Rénovation Globale',
    emoji: '🏠',
    items: [
      { code: 'BAR-TH-174', title: 'Rénovation globale maison', description: 'CEE + MPR — Gain énergétique 55%', route: '/simulateur/bar-th-174', active: true },
      { code: 'BAR-TH-175', title: 'Rénovation globale appartement', description: 'CEE + MPR — Gain énergétique 35%', route: '/simulateur/bar-th-175', active: true },
    ],
  },
  {
    category: 'Isolation',
    emoji: '🧱',
    items: [
      { code: 'BAR-EN-101', title: 'Isolation combles / toitures', description: 'Combles perdus et rampants', route: '/simulateur/bar-en-101', active: true },
      { code: 'BAR-EN-102', title: 'Isolation des murs', description: 'Murs par l\'intérieur ou l\'extérieur', route: '/simulateur/bar-en-102', active: true },
      { code: 'BAR-EN-103', title: 'Isolation plancher bas', description: 'Plancher sur local non chauffé', route: '/simulateur/bar-en-103', active: true },
      { code: 'BAR-EN-104', title: 'Fenêtres / portes-fenêtres', route: null, active: false },
      { code: 'BAR-EN-105', title: 'Isolation toiture-terrasse', route: null, active: false },
    ],
  },
  {
    category: 'Financement & Aides',
    emoji: '💰',
    items: [
      { code: 'PTZ', title: 'Prêt à Taux Zéro (PTZ)', description: 'Éligibilité et montant du PTZ 2026', route: '/simulations/ptz', active: true },
      { code: 'LOC-AVANTAGE', title: 'Loc\'Avantages — Convention ANAH', description: 'Subvention travaux, réduction d\'impôt, intermédiation', route: '/simulateur/loc-avantage', active: true },
      { code: 'MaPrimeAdapt\'', title: 'Ma Prime Adapt\'', description: 'Adaptation du logement (perte d\'autonomie / handicap)', route: '/maprimeadapt', active: true },
    ],
  },
  {
    category: 'Outils techniques',
    emoji: '📐',
    items: [
      { code: 'DIM-PAC', title: 'Dimensionnement PAC', description: 'Estimez la puissance PAC air/eau adaptée', route: '/simulateur/dim-pac', active: true },
    ],
  },
]
