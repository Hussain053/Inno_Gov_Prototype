import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Hosted backends can need a little time to resume after being idle.  A
  // 15-second client timeout turns an otherwise valid cold start into a
  // failed sign-in, so keep the request alive long enough for it to finish.
  timeout: 60000,
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
