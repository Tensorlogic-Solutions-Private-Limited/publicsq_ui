import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// function createAuthStore() {
//   // Create the store with initial values
//   const store = writable({
//     isAuthenticated: true,
//     token: true,
//     username: null,
//     role: null,
//     roleCode: null,
//     userId: null,
//     roleName: null,
//   });

//   const { subscribe, set } = store;

//   return {
//     subscribe,
//     set,
//     login: async ({ token, role, roleCode, username, userId, roleName }) => {
//       try {
//         // Validate required fields
//         if (!token) throw new Error('Token is required');
//         if (!role) throw new Error('Role is required');
//         if (!roleCode) throw new Error('Role code is required');
//         if (!username) throw new Error('Username is required');
//         if (!userId) throw new Error('User id is required');
//         if (!roleName) throw new Error('Role name is required');

//         // Store values in localStorage with correct keys
//         localStorage.setItem('token', token);
//         localStorage.setItem('role', role);
//         localStorage.setItem('role_code', roleCode);
//         localStorage.setItem('username', username); // Don't JSON.stringify simple strings
//         localStorage.setItem('userId', userId.toString());
//         localStorage.setItem('roleName', roleName);

//         // Update the store using set function from closure
//         set({
//           isAuthenticated: true,
//           token,
//           username,
//           role,
//           roleCode,
//           userId,
//           roleName,
//         });

//         return true;
//       } catch (error) {
//         console.error('Auth store login failed:', error);
//         throw error;
//       }
//     },
//     logout: async () => {
//       // Clear localStorage
//       localStorage.removeItem('token');
//       localStorage.removeItem('role');
//       localStorage.removeItem('role_code');
//       localStorage.removeItem('username');
//       localStorage.removeItem('userId');
//       localStorage.removeItem('roleName');

//       // Clear cookie if used
//       if (typeof document !== 'undefined') {
//         document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
//       }
      
//       // Reset store state using set from closure
//       set({
//         isAuthenticated: false,
//         token: null,
//         username: null,
//         role: null,
//         roleCode: null,
//         userId: null,
//         roleName: null,
//       });

//       // await goto('/auth/login');
//     },
//     initialize: () => {
//       if (typeof window === 'undefined') return; // SSR guard
      
//       const token = localStorage.getItem('token');
//       const role = localStorage.getItem('role');
//       const roleCode = localStorage.getItem('role_code');
//       const username = localStorage.getItem('username');
//       const userId = localStorage.getItem('userId');
//       const roleName = localStorage.getItem('roleName');

//       console.log('Initializing auth store from localStorage:', {
//         hasToken: !!token,
//         role,
//         roleCode,
//         username,
//         userId,
//         roleName
//       });

//       if (token && username && role && roleCode) {
//         set({
//           isAuthenticated: true,
//           token,
//           username,
//           role,
//           roleCode,
//           userId: userId ? parseInt(userId, 10) : null,
//           roleName,
//         });
        
//         console.log('Auth store initialized successfully');
//       } else {
//         console.log('Auth store initialization failed - missing required data');
//       }
//     }
//   };
// }

export const authStore = writable({})

export const userInfoStore = writable({}) ;


export function setUserInfo({username,userId,isAuthenticated, role,roleId,roleName,roleCode}){
  userInfoStore.set({username,userId,isAuthenticated, role,roleId, roleName,roleCode}) ; 
}