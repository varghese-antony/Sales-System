/**
 * Role helper utilities for consistent authorization checks across the app.
 */

export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
}

const ROLE_ORDER = [ROLES.CUSTOMER, ROLES.ADMIN, ROLES.SUPER_ADMIN]

/**
 * Check if a role value is one of the supported roles.
 * @param {string | null | undefined} userType
 * @returns {boolean}
 */
export const isValidRole = (userType) => ROLE_ORDER.includes(userType)

/**
 * Returns true when the given user type is customer.
 * @param {string | null | undefined} userType
 * @returns {boolean}
 */
export const isCustomer = (userType) => userType === ROLES.CUSTOMER

/**
 * Returns true for users with admin privileges (admin or super admin).
 * @param {string | null | undefined} userType
 * @returns {boolean}
 */
export const isAdmin = (userType) => [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(userType)

/**
 * Returns true only for super admin users.
 * @param {string | null | undefined} userType
 * @returns {boolean}
 */
export const isSuperAdmin = (userType) => userType === ROLES.SUPER_ADMIN

/**
 * Returns true for admins who do not have super admin privileges.
 * @param {string | null | undefined} userType
 * @returns {boolean}
 */
export const isAdminOnly = (userType) => userType === ROLES.ADMIN

/**
 * Compare required role against the current user type.
 * @param {string | null | undefined} userType
 * @param {string} requiredRole
 * @returns {boolean}
 */
export const hasMinimumRole = (userType, requiredRole) => {
  if (!isValidRole(requiredRole)) return false
  const userIndex = ROLE_ORDER.indexOf(userType)
  const requiredIndex = ROLE_ORDER.indexOf(requiredRole)
  return userIndex >= requiredIndex
}
