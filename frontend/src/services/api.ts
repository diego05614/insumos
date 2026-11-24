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

export const api = axios.create({
  baseURL: 'https://pdlc11kz-3000.use2.devtunnels.ms/api',
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