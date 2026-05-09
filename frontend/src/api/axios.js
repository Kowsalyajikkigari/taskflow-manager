import axios from 'axios';

/*
 * API base URL configuration:
 *   - Production: full Railway backend URL (baked in at build time)
 *   - Local dev:  '/api' → proxied by Vite to backend
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Safety net: if VITE_API_URL is set but missing /api suffix, append it
const baseURL = API_BASE.endsWith('/api')
  ? API_BASE
  : `${API_BASE}/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/* Attach access token to every request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Auto-refresh on 401 (expired access token) */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Avoid infinite loops
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem('refresh');
      if (!refresh) {
        // No refresh token — user must log in again
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh,
        });
        localStorage.setItem('access', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original); // retry the failed request
      } catch {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
