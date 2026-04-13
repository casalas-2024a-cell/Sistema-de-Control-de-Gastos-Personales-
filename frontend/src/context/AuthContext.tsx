// [FILE] frontend/src/context/AuthContext.tsx
// Global authentication context implementing HU-09 criteria:
//   ☑ Stores JWT token securely and attaches to every request
//   ☑ Provides login/register/logout functions app-wide
//   ☑ Auto-redirects to /login when token expires (401 interceptor)
//   ☑ Rehydrates auth state from localStorage on page refresh
//
// WHY CONTEXT: Individual components should not manage auth state independently.
// A single React Context provides one source of truth for authentication,
// making it impossible for different parts of the app to desync on auth state.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API = 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'coop_access_token';
const USER_KEY = 'coop_user';

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  moneda: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  fechaNacimiento?: string;
  moneda?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Axios interceptor: inject Bearer token into every request automatically
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // True while rehydrating from localStorage

  // Rehydrate state from localStorage on first mount (page refresh)
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Axios 401 interceptor: logout when token expires
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          if (getToken()) { // Only toast if there was a token
            toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          }
          doLogout();
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Save auth state to both React state and localStorage
  const saveAuth = (accessToken: string, user: Usuario) => {
    setToken(accessToken);
    setUsuario(user);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  // [HU-09] Login with email + password → receive and store JWT
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const { accessToken, usuario: user } = res.data.data;
      saveAuth(accessToken, user);
      toast.success(`Bienvenido/a de nuevo, ${user.nombres}`);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        throw new Error(err.response.data.message || 'Error al iniciar sesión');
      }
      throw new Error('Error de conexión');
    }
  };

  // [HU-09] Register → create account and receive JWT immediately
  const register = async (data: RegisterData) => {
    try {
      const res = await axios.post(`${API}/auth/register`, data);
      const { accessToken, usuario: user } = res.data.data;
      saveAuth(accessToken, user);
      toast.success('Cuenta creada exitosamente');
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        throw new Error(err.response.data.message || 'Error al registrarte');
      }
      throw new Error('Error de conexión');
    }
  };

  // [HU-09] Logout → clear token from client (invalidation from client side)
  const doLogout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const logout = () => {
    doLogout();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for clean access to auth context
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
