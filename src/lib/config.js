import { menuItems } from "$lib/constants.js";

export const roles = {
  // Super Admin
  super_admin: {
    restrictedRoutes: [], // Admin has full access, no restrictions
    restrictedActions: {}, // No action restrictions for admin
    restrictedMenuList: [],
  },
  admin: {
    restrictedRoutes: [], // Admin has full access, no restrictions
    restrictedActions: {}, // No action restrictions for admin
    restrictedMenuList: [],
  },
  admin_user: {
    restrictedRoutes: [
      // organizations
      '/organizations',
      '/organizations/details/:id'
    ], 
    restrictedActions: {}, // No action restrictions for admin
    restrictedMenuList: [menuItems?.ORGANIZATIONS],
  },
  block_admin: {
    restrictedRoutes: [
      // organizations
      '/organizations',
      '/organizations/details/:id',

    ], 
    restrictedActions: {}, // No action restrictions for admin
    restrictedMenuList: [menuItems?.ORGANIZATIONS],
  },
  teacher: {
    restrictedRoutes: [
      // organizations
      '/organizations',
      '/organizations/details/:id',

      // regions
      '/regions',
      '/regions/:id/details',

      // schools
      '/schools',
      '/schools/:id/details',
      '/schools/:id/edit',
      '/schools/add',

      // users
      '/users',
      '/users/details/:id',
      '/users/edit/:id',
      '/users/add',

      // questions
      '/questions',
      '/questions/:id',
      '/questions/:id/edit',
      '/questions/add',

      // upload history
      '/uploadHistory',
    ], // Admin has full access, no restrictions
    restrictedActions: {}, // No action restrictions for admin
    restrictedMenuList: [
      menuItems?.ORGANIZATIONS,
      menuItems?.REGIONS,
      menuItems?.SCHOOLS,
      menuItems?.USERS,
      menuItems?.QUESTIONS,
      menuItems?.UPLOAD_HISTORY,
    ],
  },
};
