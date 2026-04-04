/**
 * Matrice de permissions RBAC — Artex360
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  INSTALLER_ADMIN: 'installer_admin',
  INSTALLER_MEMBER: 'installer_member',
  BENEFICIARY: 'beneficiary',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.INSTALLER_ADMIN]: 'Administrateur',
  [ROLES.INSTALLER_MEMBER]: 'Membre',
  [ROLES.BENEFICIARY]: 'Bénéficiaire',
}

export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  [ROLES.INSTALLER_ADMIN]: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  [ROLES.INSTALLER_MEMBER]: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  [ROLES.BENEFICIARY]: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

export const STATUS_LABELS = {
  active: 'Actif',
  disabled: 'Désactivé',
  pending_approval: 'En attente',
}

export const STATUS_COLORS = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  disabled: { bg: 'bg-red-100', text: 'text-red-700' },
  pending_approval: { bg: 'bg-amber-100', text: 'text-amber-700' },
}

const PERMISSION_MATRIX = {
  manage_all_users:      [ROLES.SUPER_ADMIN],
  manage_org_members:    [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN],
  manage_org_settings:   [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN],
  access_simulations:    [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN, ROLES.INSTALLER_MEMBER],
  access_leads:          [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN, ROLES.INSTALLER_MEMBER],
  access_projects:       [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN, ROLES.INSTALLER_MEMBER],
  access_beneficiary_view: [ROLES.BENEFICIARY],
  access_admin_panel:    [ROLES.SUPER_ADMIN],
  manage_tickets:        [ROLES.SUPER_ADMIN],
  create_tickets:        [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN, ROLES.INSTALLER_MEMBER, ROLES.BENEFICIARY],
  access_any_org:        [ROLES.SUPER_ADMIN],
  manage_minisite:       [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN],
  manage_cee_deals:      [ROLES.SUPER_ADMIN, ROLES.INSTALLER_ADMIN],
}

export function hasPermission(role, permission) {
  const allowed = PERMISSION_MATRIX[permission]
  if (!allowed) return false
  return allowed.includes(role)
}

export function getPermissions(role) {
  const perms = {}
  for (const [perm, roles] of Object.entries(PERMISSION_MATRIX)) {
    perms[perm] = roles.includes(role)
  }
  return perms
}

export function isInstallerRole(role) {
  return role === ROLES.INSTALLER_ADMIN || role === ROLES.INSTALLER_MEMBER
}
