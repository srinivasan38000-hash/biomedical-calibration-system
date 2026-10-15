// Empty in development (Vite proxy handles it). Set VITE_API_URL when deployed.
export const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function api(path, { method = 'GET', body, isForm = false } = {}) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---------- small helpers used by several pages ----------
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

// Returns 'Not calibrated' | 'Overdue' | 'Due soon' | 'OK'
export function calibrationState(nextDate) {
  if (!nextDate) return 'Not calibrated';
  const days = Math.ceil((new Date(nextDate) - new Date()) / 86400000);
  if (days < 0) return 'Overdue';
  if (days <= 30) return 'Due soon';
  return 'OK';
}

export const daysLeft = (nextDate) =>
  nextDate ? Math.ceil((new Date(nextDate) - new Date()) / 86400000) : null;
