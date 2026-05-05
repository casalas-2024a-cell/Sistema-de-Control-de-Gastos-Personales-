// [FILE] frontend/src/lib/api.ts
// HU-10: Centralized HTTP client with automatic JWT injection.
// Uses VITE_API_URL env variable for environment-agnostic configuration.
// The global axios interceptor in AuthContext attaches the Bearer token
// to ALL axios requests — including this instance via the shared default config.

import axios from 'axios';

// Use env variable for API base URL — defaults to localhost for local dev
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// All API calls go through this instance. The AuthContext interceptor
// is registered on the global axios instance which propagates to all instances.
export const api = axios.create({
  baseURL: API_BASE,
});

// Inject Bearer token into this instance as well (for pages that import api directly)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('coop_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
};

// ─────────────────────────────────────────────
// Tipos de Transacción
// ─────────────────────────────────────────────
export const tiposTransaccionApi = {
  getAll: () => api.get('/tipo-transaccion'),
};

// ─────────────────────────────────────────────
// Categorías
// ─────────────────────────────────────────────
export const categoriasApi = {
  getByUsuario: (usuarioId: number) =>
    api.get(`/categorias/usuario/${usuarioId}`),
  create: (data: Record<string, unknown>) =>
    api.post('/categorias', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/categorias/${id}`, data),
  delete: (id: number) =>
    api.delete(`/categorias/${id}`),
};

// ─────────────────────────────────────────────
// Períodos
// ─────────────────────────────────────────────
export const periodosApi = {
  getAll: () => api.get('/periodos'),
  create: (data: Record<string, unknown>) =>
    api.post('/periodos', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/periodos/${id}`, data),
  delete: (id: number) =>
    api.delete(`/periodos/${id}`),
};

// ─────────────────────────────────────────────
// Transacciones
// ─────────────────────────────────────────────
export const transaccionesApi = {
  getAll: (params: Record<string, string>) =>
    api.get(`/transacciones?${new URLSearchParams(params)}`),
  create: (data: Record<string, unknown>) =>
    api.post('/transacciones', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/transacciones/${id}`, data),
  delete: (id: number) =>
    api.delete(`/transacciones/${id}`),
};

// ─────────────────────────────────────────────
// Presupuestos
// ─────────────────────────────────────────────
export const presupuestosApi = {
  getEstado: (periodoId: number, usuarioId: number) =>
    api.get(`/presupuestos/estado/${periodoId}?usuarioId=${usuarioId}`),
  create: (data: Record<string, unknown>) =>
    api.post('/presupuestos', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/presupuestos/${id}`, data),
  delete: (id: number) =>
    api.delete(`/presupuestos/${id}`),
};

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export const dashboardApi = {
  getResumenMensual: (mes: number, anio: number) =>
    api.get(`/dashboard/resumen-mensual?mes=${mes}&anio=${anio}`),
  getGastosPorCategoria: (mes: number, anio: number) =>
    api.get(`/dashboard/gastos-por-categoria?mes=${mes}&anio=${anio}`),
  getPresupuestoVsGasto: (mes: number, anio: number) =>
    api.get(`/dashboard/presupuesto-vs-gasto?mes=${mes}&anio=${anio}`),
  getTransaccionesRecientes: (take = 5) =>
    api.get(`/dashboard/transacciones-recientes?take=${take}`),
  getAlertasActivas: () =>
    api.get('/dashboard/alertas-activas'),
  getResumenPorPeriodo: (periodoId: number) =>
    api.get(`/dashboard/resumen/${periodoId}`),
};

// ─────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────
export const usuariosApi = {
  getAll: () => api.get('/usuarios'),
  getById: (id: number) => api.get(`/usuarios/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post('/usuarios', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/usuarios/${id}`, data),
  delete: (id: number) =>
    api.delete(`/usuarios/${id}`),
};
