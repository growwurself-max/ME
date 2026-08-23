const BASE_URL = (import.meta.env.VITE_API_URL || 'https://result-hub-ve8j.onrender.com').replace(/\/$/, '');
const TOKEN_KEY = 'resulthub.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {}; 
}

async function handle(response) {
  if (response.status === 401) {
    clearToken();
    if (!location.pathname.startsWith('/login')) {
      location.href = '/login?reason=session-expired';
    }
  }
  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const body = isJson ? await response.json() : null;
  if (!response.ok) {
    const detail = body?.details?.map?.((d) => `${d.path || d.field}: ${d.message}`).join(', ');
    const error = new Error(detail ? `${body.error}: ${detail}` : body?.error || `Request failed (${response.status})`);
    error.code = body?.code;
    error.details = body?.details;
    throw error;
  }
  return body;
}

export const api = {
  get: (path) => fetch(`${BASE_URL}${path}`, { headers: authHeaders() }).then(handle),
  post: (path, data) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data ?? {}),
    }).then(handle),
  put: (path, data) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data ?? {}),
    }).then(handle),
  patch: (path, data) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data ?? {}),
    }).then(handle),
  del: (path) => fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
  upload: (path, formData) =>
    fetch(`${BASE_URL}${path}`, { method: 'POST', headers: authHeaders(), body: formData }).then(handle),
  download: async (path, fallbackName) => {
    const response = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Download failed');
    }
    const disposition = response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = match ? match[1] : fallbackName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
