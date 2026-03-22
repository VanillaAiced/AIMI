/**
 * API Client - Handles all API calls with proper base URL configuration
 * Uses REACT_APP_API_URL environment variable for backend URL
 */

const getApiBaseUrl = () => {
  // For production, use the environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // For development (local), relay through local proxy
  return '';
};

/**
 * Wrapper for fetch that automatically prepends the API base URL
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/me/')
 * @param {object} options - Fetch options
 */
export const apiFetch = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
  
  return fetch(url, options);
};

export const API_BASE_URL = getApiBaseUrl();
