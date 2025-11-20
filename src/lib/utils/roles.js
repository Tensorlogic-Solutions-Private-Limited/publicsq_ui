// UTILITY FOR ROLE MAPPING 

/**
 * All available roles from the API with their codes and names
 */
export const ROLES = [
  { id: 'super_admin', name: 'Super Admin', value: 'super_admin' },
  { id: 'admin', name: 'Admin', value: 'admin' },
  { id: 'admin_user', name: 'Admin-User', value: 'admin_user' },
  { id: 'block_admin', name: 'Region Admin', value: 'block_admin' },
  { id: 'teacher', name: 'Teacher', value: 'teacher' }
];

/**
 * Check if a role code represents an admin user
 * @param {string} roleCode - The role code to check
 * @returns {boolean} True if the role is an admin role
 */
export function isAdminRole(roleCode) {
  // Include both new string-based and legacy numeric role codes
  const adminRoles = ['admin', 'super_admin', 'admin_user', 'block_admin', '100'];
  return adminRoles.includes(roleCode);
}

/**
 * Check if a role code represents an educator/teacher
 * @param {string} roleCode - The role code to check
 * @returns {boolean} True if the role is an educator role
 */
export function isEducatorRole(roleCode) {
  const educatorRoles = ['teacher', '101'];
  return educatorRoles.includes(roleCode);
}