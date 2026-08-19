import axios from 'axios';

const resolveApiBase = () => {
  const configured = import.meta.env.VITE_API_URL || 'https://cecytem-toluca2-web.onrender.com/api/';
  return configured.endsWith('/') ? configured : `${configured}/`;
};

const baseURL = resolveApiBase();

const api = axios.create({ baseURL });
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('access_token');
  
  // Limpieza defensiva: si el valor tiene la palabra pegada, la quitamos
  if (token && token.startsWith('access_token')) {
    token = token.replace('access_token', '');
  }

  if (token && !config.url.includes('auth/login/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // CAMBIO: Igual aquí, quitamos el '/api' inicial
    if (error.response?.status === 401 && !error.config.url.includes('auth/login/')) {
      console.warn("❌ Token expirado, cerrando sesión...");
      localStorage.removeItem('access_token');
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;