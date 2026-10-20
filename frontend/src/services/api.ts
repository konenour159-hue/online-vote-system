import axios, { AxiosInstance, AxiosError } from 'axios';

// En production (Vercel), l'API est servie sur la même adresse que le site grâce à la redirection /api de vercel.json :
// pas de CORS, et le cookie de session reste « first-party ». En développement, on garde l'API locale.
// VITE_API_URL, s'il est défini, a toujours priorité.
const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Renouvellement de session : le jeton de renouvellement est dans un cookie httpOnly, que le navigateur envoie tout seul.
// Une seule demande de renouvellement à la fois, même si plusieurs requêtes échouent en même temps.
let refreshing: Promise<string> | null = null;
const refreshAccessToken = async (): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });
  const { accessToken } = response.data.data;
  localStorage.setItem('accessToken', accessToken);
  return accessToken;
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const isAuthCall = /\/auth\/(login|refresh|signup)/.test(originalRequest?.url ?? '');

    // Un 401 sur une page protégée : on tente de renouveler la session une fois, sinon retour à la connexion.
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthCall && localStorage.getItem('accessToken')) {
      originalRequest._retry = true;
      try {
        refreshing = refreshing ?? refreshAccessToken().finally(() => (refreshing = null));
        const accessToken = await refreshing;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
