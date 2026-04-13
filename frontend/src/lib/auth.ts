// [FILE] frontend/src/lib/auth.ts
// Authentication utilities: token storage, auth header injection, and axios interceptor.

import axios from 'axios';

const TOKEN_KEY = 'coop_access_token';
const USER_KEY = 'coop_user';

// Store the JWT token in localStorage after login
export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Retrieve the stored token (returns null if not logged in)
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove tokens on logout
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Save authenticated user data for display
export const saveUser = (user: any) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
};

// Axios interceptor: automatically attaches Bearer token to every request.
// This means no component needs to manually add the Authorization header.
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor: handle 401 globally — redirect to login if token expired
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
