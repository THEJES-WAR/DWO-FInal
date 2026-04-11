const normalizeOrigin = (value) => value?.replace(/\/+$/, '');

export const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_ORIGIN) || 'https://dwo-final.onrender.com';
export const SOCKET_URL = API_ORIGIN;
export const API_BASE = `${API_ORIGIN}/api`;

export const apiUrl = (path = '') => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};
