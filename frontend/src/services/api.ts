import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { DEMO_ACCOUNTS } from '../mock/demoAccounts';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor attaches JWT bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('innogov_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor handles auth errors cleanly
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    const token = localStorage.getItem('innogov_token');
    const config = error.config as (InternalAxiosRequestConfig & { _retryDemoUpgrade?: boolean }) | undefined;

    if (error.response?.status === 401 && !config?._retryDemoUpgrade) {
      try {
        const saved = localStorage.getItem('innogov_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          const demoPersona = Object.values(DEMO_ACCOUNTS).find(
            (acc) => acc.email.toLowerCase() === parsed.email?.toLowerCase()
          );

          if (demoPersona) {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
              email: demoPersona.email,
              password: demoPersona.password,
            });

            const nextToken = response.data.access_token;
            localStorage.setItem('innogov_token', nextToken);
            if (config) {
              config._retryDemoUpgrade = true;
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${nextToken}`;
            }
            return apiClient.request(config!);
          }
        }
      } catch {
        // Fall through to the existing login redirect below.
      }
    }

    if (error.response?.status === 401) {
      // Clear auth tokens
      localStorage.removeItem('innogov_token');
      localStorage.removeItem('innogov_user');

      // Redirect to login only if not already on login/register/landing page
      const publicPaths = ['/login', '/', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login?reason=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
