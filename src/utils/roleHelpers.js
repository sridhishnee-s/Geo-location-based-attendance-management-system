/**
 * Role helper functions
 */

export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'manager', // Alias for manager
}

/**
 * Check if user is admin/manager
 */
export const isAdmin = (userData) => {
  return userData?.role === ROLES.MANAGER || userData?.role === ROLES.ADMIN
}

/**
 * Check if user is employee
 */
export const isEmployee = (userData) => {
  return userData?.role === ROLES.EMPLOYEE || !userData?.role
}

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLES.MANAGER:
    case ROLES.ADMIN:
      return 'Admin/Manager'
    case ROLES.EMPLOYEE:
      return 'Employee'
    default:
      return 'Employee'
  }
}

/**
 * Get role badge color
 */
export const getRoleBadgeColor = (role) => {
  switch (role) {
    case ROLES.MANAGER:
    case ROLES.ADMIN:
      return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
    case ROLES.EMPLOYEE:
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get role icon
 */
export const getRoleIcon = (role) => {
  switch (role) {
    case ROLES.MANAGER:
    case ROLES.ADMIN:
      return '👑'
    case ROLES.EMPLOYEE:
      return '👤'
    default:
      return '👤'
  }
}

/**
 * Check if user has permission for action
 */
export const hasPermission = (userData, action) => {
  if (isAdmin(userData)) {
    return true // Admins have all permissions
  }

  // Employee permissions
  const employeePermissions = [
    'view_own_attendance',
    'mark_attendance',
    'apply_leave',
    'view_own_analytics',
    'view_own_gamification',
  ]

  return employeePermissions.includes(action)
}

