import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../services/api';

export const AuthContext = createContext();

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

  const login = async (username, password) => {
    const response = await api.post('auth/login/', {
      username,
      password,
    });

    console.log('[AuthContext] response.data completo →', response.data);

    const token = response.data.access ?? response.data.token;
    if (!token) throw new Error('El backend no devolvió un token de acceso.');

    let rawUser = response.data.user ?? response.data.usuario ?? response.data.data ?? null;
    
    if (!rawUser || !rawUser.id) {
      const decoded = decodeJWT(token);
      if (decoded) {
        rawUser = decoded;
        console.log('[AuthContext] Usuario extraído del JWT →', rawUser);
      } else {
        rawUser = {};
      }
    }

    const userData = {
      id: rawUser.id ?? rawUser.pk ?? rawUser.user_id ?? null,
      username: rawUser.username ?? username,
      nombre: rawUser.nombre ?? rawUser.first_name ?? rawUser.nombre_completo ?? username,
      email: rawUser.email ?? '',
      is_superuser: rawUser.is_superuser ?? false,
      is_staff: rawUser.is_staff ?? false,
      rol: rawUser.rol ?? rawUser.role ?? null,
    };

    // 🚨 AJUSTE DE PRIORIDAD DE ROLES CORREGIDO:
    if (userData.is_superuser) {
      // Si es superusuario de Django, indiscutiblemente es ADMIN supremo
      userData.rol = 'ADMIN';
    } else if (userData.is_staff || userData.rol === 'DOCENTE') {
      // 💡 CORRECCIÓN: Si es staff (pero no superuser) O el rol explícito es DOCENTE, 
      // le asignamos el panel de DOCENTE para que no se confunda con el Admin.
      userData.rol = 'DOCENTE';
    } else if (userData.rol === 'ADMIN') {
      userData.rol = 'ADMIN';
    } else {
      userData.rol = 'ALUMNO';
    }

    console.log('[AuthContext] userData final (con rol corregido) →', userData);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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