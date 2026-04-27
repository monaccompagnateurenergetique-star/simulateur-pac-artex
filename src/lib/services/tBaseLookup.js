/* ════════════════════════════════════════════════════════
   T_base NF P 52-612 — Lookup par département + altitude

   La norme française NF P 52-612/CN (annexe de NF EN 12831)
   donne une température extérieure de base PAR DÉPARTEMENT
   au niveau de la mer, puis des corrections par tranche
   d'altitude.

   Exemple : Moselle (57) à 265 m → -12 + (-3) = -15°C
   C'est cette valeur que Qhare/Pacman utilisent.

   Plancher physique : -25°C (NF P 52-612).
   ════════════════════════════════════════════════════════ */

import TBASE_TABLE from '../data/tBaseNfP52612.json'

const PLANCHER = TBASE_TABLE._meta?.plancher ?? -25

/** Tranches d'altitude NF P 52-612 (bornes hautes incluses). */
const ALTITUDE_BRACKETS = [
  { key: '0_200',     max: 200 },
  { key: '200_400',   max: 400 },
  { key: '400_600',   max: 600 },
  { key: '600_800',   max: 800 },
  { key: '800_1000',  max: 1000 },
  { key: '1000_1200', max: 1200 },
  { key: '1200_1400', max: 1400 },
  { key: '1400_1600', max: 1600 },
  { key: '1600_1800', max: 1800 },
  { key: '1800_2000', max: 2000 },
  { key: '2000_plus', max: Infinity },
]

/** Tranche d'altitude depuis une valeur en mètres. */
export function altitudeBracket(altitudeM) {
  const a = Math.max(0, Number(altitudeM) || 0)
  return ALTITUDE_BRACKETS.find(b => a <= b.max) ?? ALTITUDE_BRACKETS[ALTITUDE_BRACKETS.length - 1]
}

/** Normalise un code département (2A/2B/01/57…). */
export function normalizeDept(input) {
  if (!input) return null
  const s = String(input).trim().toUpperCase()
  if (s === '2A' || s === '2B') return s
  const digits = s.replace(/\D/g, '')
  if (!digits) return null
  return digits.length === 1 ? `0${digits}` : digits.substring(0, 2).padStart(2, '0')
}

/** Déduit le département depuis un code postal (01234 → "01", 20xxx → 2A/2B). */
export function deptFromPostalCode(postalCode) {
  if (!postalCode) return null
  const cleaned = String(postalCode).replace(/\D/g, '')
  if (cleaned.length < 2) return null
  if (cleaned.startsWith('20')) {
    const n = parseInt(cleaned.substring(0, 5), 10)
    if (n >= 20000 && n <= 20199) return '2A'
    if (n >= 20200 && n <= 20999) return '2B'
  }
  return cleaned.substring(0, 2)
}

/**
 * Récupère les infos département : { name, zone, tBaseMer, corrections }.
 */
export function getDeptInfo(deptCode) {
  const d = normalizeDept(deptCode)
  if (!d) return null
  return TBASE_TABLE[d] ?? null
}

/**
 * Calcule la T_base NF P 52-612 pour un département + une altitude donnée.
 *
 * @param {string|number} deptCode - "57", 57, "2A"…
 * @param {number} altitudeM - altitude en mètres (0 si inconnue)
 * @returns {{ tBase: number, tBaseMer: number, correction: number, bracket: string,
 *            zone: string, deptName: string, deptCode: string } | null}
 */
export function getTBaseNfP52612(deptCode, altitudeM = 0) {
  const info = getDeptInfo(deptCode)
  if (!info) return null
  const bracket = altitudeBracket(altitudeM)
  const correction = info.corrections?.[bracket.key] ?? 0
  const raw = info.tBaseMer + correction
  const tBase = Math.max(PLANCHER, raw)
  return {
    tBase,
    tBaseMer: info.tBaseMer,
    correction,
    bracket: bracket.key,
    bracketLabel: TBASE_TABLE._meta?.correctionsKeys?.[bracket.key] ?? bracket.key,
    zone: info.zone,
    deptName: info.name,
    deptCode: normalizeDept(deptCode),
  }
}

/** Raccourci : T_base directement depuis un code postal. */
export function getTBaseFromPostalCode(postalCode, altitudeM = 0) {
  const dept = deptFromPostalCode(postalCode)
  return dept ? getTBaseNfP52612(dept, altitudeM) : null
}
