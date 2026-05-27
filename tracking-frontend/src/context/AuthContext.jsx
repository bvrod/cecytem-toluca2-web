import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../services/api';

export const AuthContext = createContext();

// ────────────────────────────────────────────────────────
// HELPER: Decodificar JWT sin necesidad de librería externa
// ────────────────────────────────────────────────────────
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    console.warn('[JWT] No se pudo decodificar el token JWT');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ────────────────────────────────────────────────────────
  // INICIALIZACIÓN: Restaurar usuario desde localStorage
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // ────────────────────────────────────────────────────────
  // LOGIN: Procesar respuesta correctamente y asignar rol
  // ────────────────────────────────────────────────────────
  const login = async (username, password) => {
    const response = await api.post('auth/login/', {
      username,
      password,
    });

    console.log('[AuthContext] response.data completo →', response.data);

    const token = response.data.access ?? response.data.token;
    if (!token) throw new Error('El backend no devolvió un token de acceso.');

    // ┌─────────────────────────────────────────────────────────────┐
    // │ CORRECCIÓN BUG 2: Extracción inteligente del usuario + JWT   │
    // └─────────────────────────────────────────────────────────────┘
    
    // 1. Intentar extraer usuario del payload de respuesta
    let rawUser = response.data.user ?? response.data.usuario ?? response.data.data ?? null;
    
    // 2. Si no viene en la respuesta, decodificar JWT para obtener claims
    if (!rawUser || !rawUser.id) {
      const decodedJWT = decodeJWT(token);
      if (decodedJWT) {
        rawUser = decodedJWT;
        console.log('[AuthContext] Usuario extraído del JWT →', rawUser);
      } else {
        rawUser = {};
      }
    }

    console.log('[AuthContext] rawUser extraído →', rawUser);

    // 3. Construir objeto userData con todos los campos posibles
    const userData = {
      id: rawUser.id ?? rawUser.pk ?? rawUser.user_id ?? null,
      username: rawUser.username ?? username,
      nombre: rawUser.nombre ?? rawUser.first_name ?? rawUser.nombre_completo ?? username,
      email: rawUser.email ?? '',
      is_superuser: rawUser.is_superuser ?? false,
      is_staff: rawUser.is_staff ?? false,
      rol: rawUser.rol ?? rawUser.role ?? null,
    };

    // 4. Lógica de asignación de rol con prioridad correcta
    // ┌─────────────────────────────────────────────────────────────┐
    // │ CORRECCIÓN BUG 2: Si es superuser → ADMIN obligatorio         │
    // │                  Si es staff → ADMIN                         │
    // │                  Si tiene rol explícito → respetarlo         │
    // │                  Si no → ALUMNO por defecto                 │
    // └─────────────────────────────────────────────────────────────┘
    if (userData.is_superuser) {
      // Superuser SIEMPRE es ADMIN
      userData.rol = 'ADMIN';
    } else if (userData.is_staff) {
      // Staff es ADMIN por defecto (ajustar según tu lógica si necesitas DOCENTE)
      userData.rol = 'ADMIN';
    } else if (userData.rol === 'ADMIN' || userData.rol === 'DOCENTE' || userData.rol === 'ALUMNO') {
      // Si ya viene un rol válido, mantenerlo
      // (sin cambios)
    } else {
      // Fallback: ALUMNO
      userData.rol = 'ALUMNO';
    }

    console.log('[AuthContext] userData final (con rol) →', userData);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  // ────────────────────────────────────────────────────────
  // LOGOUT: Limpiar estado reactivamente (SIN redirección)
  // ────────────────────────────────────────────────────────
  // ┌─────────────────────────────────────────────────────────────┐
  // │ CORRECCIÓN BUG 1: NO usar window.location.href               │
  // │                  Limpiar estado de forma reactiva            │
  // │                  App.jsx captura el cambio y desmonta        │
  // └─────────────────────────────────────────────────────────────┘
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    
    // Cambiar el estado de forma reactiva (sin redirecciones)
    // Esto dispara un re-render en App.jsx que desmonta el layout
    // y muestra el LoginForm automáticamente
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};