import { handleRedirection } from './helper.js';
import { page } from '$app/stores';
import { get } from 'svelte/store';

/**
 * Enhanced fetch wrapper that handles 401 responses
 */
export async function apiClient(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401 || response.status === 403) {
      // Clear any client-side auth state if needed
      console.log(`API returned ${response.status}, redirecting`);
      
      // Get current page for redirect
      const currentPage = get(page);
      
      // Use the centralized handleRedirection function
      await handleRedirection(response.status, currentPage.url.pathname, currentPage.url.search);
      
      // Return null to indicate authentication failure
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

