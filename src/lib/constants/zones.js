export const ZONE_FACTORS = {
  H1: 1.2,
  H2: 1.0,
  H3: 0.7,
}

export const ZONE_OPTIONS = [
  { value: 'H1', label: 'H1 (Nord - x1.2)' },
  { value: 'H2', label: 'H2 (Centre - x1.0)' },
  { value: 'H3', label: 'H3 (Sud - x0.7)' },
]

/** Températures extérieures de base par zone principale (°C) */
export const ZONE_BASE_TEMPERATURES = {
  H1: -7,
  H2: -4,
  H3: 2,
}

/** Températures de base RT2012 par sous-zone climatique (°C) — précises */
export const ZONE_BASE_TEMPERATURES_DETAIL = {
  H1a: -9,
  H1b: -9,
  H1c: -8,
  H2a: -6,
  H2b: -6,
  H2c: -5,
  H2d: -3,
  H3: -2,
}

/** Options de sous-zones avec T_base RT2012 — pour dimensionnement thermique précis */
export const ZONE_DETAIL_OPTIONS = [
  { value: 'H1a', label: 'H1a — Île-de-France, Centre',        tBase: -9, parent: 'H1' },
  { value: 'H1b', label: 'H1b — Lorraine, Alsace, Champagne',  tBase: -9, parent: 'H1' },
  { value: 'H1c', label: 'H1c — Massif Central, Jura, Savoie', tBase: -8, parent: 'H1' },
  { value: 'H2a', label: 'H2a — Bretagne',                     tBase: -6, parent: 'H2' },
  { value: 'H2b', label: 'H2b — Ouest, Poitou-Charentes',      tBase: -6, parent: 'H2' },
  { value: 'H2c', label: 'H2c — Centre-Ouest, Aquitaine',      tBase: -5, parent: 'H2' },
  { value: 'H2d', label: 'H2d — Rhône-Alpes sud, Midi-Pyr.',   tBase: -3, parent: 'H2' },
  { value: 'H3',  label: 'H3 — Méditerranée',                  tBase: -2, parent: 'H3' },
]

/** Mapping département → sous-zone climatique RT2012 */
const DEPT_TO_ZONE = {
  // H1a — Île-de-France + Centre
  '28': 'H1a', '36': 'H1a', '37': 'H1a', '41': 'H1a', '45': 'H1a',
  '75': 'H1a', '77': 'H1a', '78': 'H1a', '91': 'H1a', '92': 'H1a',
  '93': 'H1a', '94': 'H1a', '95': 'H1a',
  // H1b — Nord-Est, Normandie, Hauts-de-France, Bourgogne Franche-Comté, Lorraine, Alsace
  '02': 'H1b', '08': 'H1b', '10': 'H1b', '14': 'H1b', '21': 'H1b',
  '25': 'H1b', '27': 'H1b', '39': 'H1b', '50': 'H1b', '51': 'H1b',
  '52': 'H1b', '54': 'H1b', '55': 'H1b', '57': 'H1b', '58': 'H1b',
  '59': 'H1b', '60': 'H1b', '61': 'H1b', '62': 'H1b', '67': 'H1b',
  '68': 'H1b', '70': 'H1b', '71': 'H1b', '76': 'H1b', '80': 'H1b',
  '88': 'H1b', '89': 'H1b', '90': 'H1b',
  // H1c — Massif Central
  '03': 'H1c', '15': 'H1c', '19': 'H1c', '23': 'H1c', '42': 'H1c',
  '43': 'H1c', '48': 'H1c', '63': 'H1c',
  // H2a — Bretagne
  '22': 'H2a', '29': 'H2a', '35': 'H2a', '56': 'H2a',
  // H2b — Ouest / Pays de la Loire
  '44': 'H2b', '49': 'H2b', '53': 'H2b', '72': 'H2b', '79': 'H2b',
  '85': 'H2b', '86': 'H2b',
  // H2c — Centre-Ouest, Aquitaine
  '16': 'H2c', '17': 'H2c', '24': 'H2c', '33': 'H2c', '40': 'H2c',
  '47': 'H2c', '64': 'H2c', '87': 'H2c',
  // H2d — Rhône-Alpes sud + Midi-Pyrénées
  '01': 'H2d', '05': 'H2d', '09': 'H2d', '11': 'H2d', '12': 'H2d',
  '26': 'H2d', '30': 'H2d', '31': 'H2d', '32': 'H2d', '34': 'H2d',
  '38': 'H2d', '46': 'H2d', '65': 'H2d', '69': 'H2d', '73': 'H2d',
  '74': 'H2d', '81': 'H2d', '82': 'H2d', '84': 'H2d',
  // H3 — Méditerranée + Corse
  '04': 'H3', '06': 'H3', '13': 'H3', '20': 'H3', '66': 'H3',
  '83': 'H3', '2A': 'H3', '2B': 'H3',
}

/** Déduit la sous-zone climatique RT2012 depuis un code postal français */
export function getZoneFromPostalCode(postalCode) {
  if (!postalCode) return null
  const cleaned = String(postalCode).trim().replace(/\s/g, '')
  if (cleaned.length < 2) return null
  // Corse : 20xxx → 2A ou 2B (approximation : 20000-20199 = 2A, 20200+ = 2B)
  if (cleaned.startsWith('20')) {
    const num = parseInt(cleaned.substring(0, 5), 10)
    if (num >= 20000 && num <= 20199) return DEPT_TO_ZONE['2A']
    if (num >= 20200 && num <= 20999) return DEPT_TO_ZONE['2B']
  }
  const dept = cleaned.substring(0, 2)
  return DEPT_TO_ZONE[dept] ?? null
}

/** Tranches d'altitude (select utilisateur), midpoint pour calcul */
export const ALTITUDE_RANGES = [
  { value: '0_200',     label: '0 – 200 m',        midpoint: 100  },
  { value: '200_400',   label: '200 – 400 m',      midpoint: 300  },
  { value: '400_600',   label: '400 – 600 m',      midpoint: 500  },
  { value: '600_800',   label: '600 – 800 m',      midpoint: 700  },
  { value: '800_1000',  label: '800 – 1 000 m',    midpoint: 900  },
  { value: '1000_1500', label: '1 000 – 1 500 m',  midpoint: 1250 },
  { value: 'plus_1500', label: 'Plus de 1 500 m',  midpoint: 1800 },
]
