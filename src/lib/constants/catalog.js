export const CATALOG = [
  {
    category: 'Chauffage & EnR',
    emoji: '☀️',
    items: [
      { code: 'BAR-TH-171', title: 'Pompe à chaleur air/eau', route: '/simulateur/bar-th-171', active: true },
      { code: 'BAR-TH-112', title: 'Appareil de chauffage au bois', route: '/simulateur/bar-th-112', active: true },
      { code: 'BAR-TH-113', title: 'Chaudière biomasse individuelle', route: '/simulateur/bar-th-113', active: true },
      { code: 'BAR-TH-172', title: 'PAC géothermique', route: null, active: false },
      { code: 'BAR-TH-106', title: 'Chauffe-eau thermodynamique', route: null, active: false },
      { code: 'BAR-TH-143', title: 'Système solaire combiné', route: null, active: false },
    ],
  },
  {
    category: 'Rénovation Globale',
    emoji: '🏠',
    items: [
      { code: 'BAR-TH-174', title: 'Rénovation globale maison', route: '/simulateur/bar-th-174', active: true },
      { code: 'BAR-TH-175', title: 'Rénovation globale appartement', route: '/simulateur/bar-th-175', active: true },
    ],
  },
  {
    category: 'Isolation',
    emoji: '🧱',
    items: [
      { code: 'BAR-EN-101', title: 'Isolation combles / toitures', route: '/simulateur/bar-en-101', active: true },
      { code: 'BAR-EN-102', title: 'Isolation des murs', route: '/simulateur/bar-en-102', active: true },
      { code: 'BAR-EN-103', title: 'Isolation plancher bas', route: '/simulateur/bar-en-103', active: true },
      { code: 'BAR-EN-104', title: 'Fenêtres / portes-fenêtres', route: null, active: false },
      { code: 'BAR-EN-105', title: 'Isolation toiture-terrasse', route: null, active: false },
    ],
  },
]
