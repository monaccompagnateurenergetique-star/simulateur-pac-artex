/**
 * Genere un mot de passe temporaire aleatoire
 * 12 caracteres : majuscules, minuscules, chiffres, symboles
 */
export function generateTempPassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols

  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  // Garantir au moins 1 de chaque type
  let password = ''
  password += upper[array[0] % upper.length]
  password += lower[array[1] % lower.length]
  password += digits[array[2] % digits.length]
  password += symbols[array[3] % symbols.length]

  for (let i = 4; i < length; i++) {
    password += all[array[i] % all.length]
  }

  // Melanger le resultat
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}
