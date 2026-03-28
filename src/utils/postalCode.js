// Département → Zone climatique détaillée
const DEPT_TO_ZONE = {
  '01': 'H1c', '02': 'H1a', '03': 'H1c', '04': 'H2d', '05': 'H1c',
  '06': 'H3', '07': 'H2d', '08': 'H1a', '09': 'H2c', '10': 'H1b',
  '11': 'H3', '12': 'H2c', '13': 'H3', '14': 'H2a', '15': 'H1c',
  '16': 'H2b', '17': 'H2b', '18': 'H1b', '19': 'H1c',
  '2A': 'H3', '2B': 'H3',
  '21': 'H1c', '22': 'H2a', '23': 'H1c', '24': 'H2c', '25': 'H1c',
  '26': 'H2d', '27': 'H1a', '28': 'H1b', '29': 'H2a', '30': 'H3',
  '31': 'H2c', '32': 'H2c', '33': 'H2b', '34': 'H3', '35': 'H2a',
  '36': 'H1b', '37': 'H2b', '38': 'H1c', '39': 'H1c', '40': 'H2c',
  '41': 'H2b', '42': 'H1c', '43': 'H1c', '44': 'H2b', '45': 'H1b',
  '46': 'H2c', '47': 'H2c', '48': 'H2d', '49': 'H2b', '50': 'H2a',
  '51': 'H1b', '52': 'H1b', '53': 'H2a', '54': 'H1b', '55': 'H1b',
  '56': 'H2a', '57': 'H1b', '58': 'H1b', '59': 'H1a', '60': 'H1a',
  '61': 'H2a', '62': 'H1a', '63': 'H1c', '64': 'H2c', '65': 'H2c',
  '66': 'H3', '67': 'H1b', '68': 'H1b', '69': 'H1c', '70': 'H1b',
  '71': 'H1c', '72': 'H2b', '73': 'H1c', '74': 'H1c', '75': 'H1a',
  '76': 'H1a', '77': 'H1a', '78': 'H1a', '79': 'H2b', '80': 'H1a',
  '81': 'H2c', '82': 'H2c', '83': 'H3', '84': 'H2d', '85': 'H2b',
  '86': 'H2b', '87': 'H1c', '88': 'H1b', '89': 'H1b', '90': 'H1b',
  '91': 'H1a', '92': 'H1a', '93': 'H1a', '94': 'H1a', '95': 'H1a',
  '971': 'H3', '972': 'H3', '973': 'H3', '974': 'H3', '976': 'H3',
}

// Département → Région
const DEPT_TO_REGION = {
  '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes',
  '15': 'Auvergne-Rhône-Alpes', '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
  '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '63': 'Auvergne-Rhône-Alpes',
  '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
  '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté', '39': 'Bourgogne-Franche-Comté',
  '58': 'Bourgogne-Franche-Comté', '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté',
  '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
  '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
  '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
  '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
  '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est',
  '68': 'Grand Est', '88': 'Grand Est',
  '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France',
  '62': 'Hauts-de-France', '80': 'Hauts-de-France',
  '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
  '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
  '94': 'Île-de-France', '95': 'Île-de-France',
  '14': 'Normandie', '27': 'Normandie', '50': 'Normandie',
  '61': 'Normandie', '76': 'Normandie',
  '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
  '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
  '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
  '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
  '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie',
  '31': 'Occitanie', '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie',
  '48': 'Occitanie', '65': 'Occitanie', '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
  '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
  '72': 'Pays de la Loire', '85': 'Pays de la Loire',
  '04': "Provence-Alpes-Côte d'Azur", '05': "Provence-Alpes-Côte d'Azur",
  '06': "Provence-Alpes-Côte d'Azur", '13': "Provence-Alpes-Côte d'Azur",
  '83': "Provence-Alpes-Côte d'Azur", '84': "Provence-Alpes-Côte d'Azur",
  '2A': 'Corse', '2B': 'Corse',
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion', '976': 'Mayotte',
}

const IDF_DEPTS = ['75', '77', '78', '91', '92', '93', '94', '95']

export function getDepartement(postalCode) {
  if (!postalCode || postalCode.length < 2) return null
  const trimmed = postalCode.trim()
  if (trimmed.startsWith('97')) return trimmed.substring(0, 3)
  const prefix = trimmed.substring(0, 2)
  if (prefix === '20') {
    const num = parseInt(trimmed, 10)
    return num < 20200 ? '2A' : '2B'
  }
  return prefix
}

export function getZoneClimatique(postalCode) {
  const dept = getDepartement(postalCode)
  return dept ? (DEPT_TO_ZONE[dept] ?? null) : null
}

export function getZoneSimplifiee(postalCode) {
  const zone = getZoneClimatique(postalCode)
  if (!zone) return null
  if (zone.startsWith('H1')) return 'H1'
  if (zone.startsWith('H2')) return 'H2'
  return 'H3'
}

export function getRegion(postalCode) {
  const dept = getDepartement(postalCode)
  return dept ? (DEPT_TO_REGION[dept] ?? null) : null
}

export function isIleDeFrance(postalCode) {
  const dept = getDepartement(postalCode)
  return dept ? IDF_DEPTS.includes(dept) : false
}

export function getLocationInfo(postalCode) {
  const dept = getDepartement(postalCode)
  if (!dept) return null
  return {
    departement: dept,
    region: DEPT_TO_REGION[dept] ?? null,
    zoneClimatique: DEPT_TO_ZONE[dept] ?? null,
    zoneSimplifiee: getZoneSimplifiee(postalCode),
    isIDF: IDF_DEPTS.includes(dept),
  }
}
