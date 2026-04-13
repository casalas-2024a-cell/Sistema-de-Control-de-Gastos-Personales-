// [FILE] lib/auth.ts
// DEPRECATED — This file exists for backward compatibility only.
// All auth logic is now in context/AuthContext.tsx.
// Components should use: import { useAuth } from '../context/AuthContext'

// Re-export utilities for any files that still import from here
const TOKEN_KEY = 'coop_access_token';
const USER_KEY = 'coop_user';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
};
export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const saveUser = (user: any) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
