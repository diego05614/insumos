import axios from 'axios';

export function obtenerSessionId(): string {
  let sessionId = localStorage.getItem('insumos_session_id');
  if (!sessionId) {
    sessionId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('insumos_session_id', sessionId);
  }
  return sessionId;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('insumos_token');
  const sessionId = obtenerSessionId();

  config.headers = config.headers || {};
  config.headers['x-session-id'] = sessionId;

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});