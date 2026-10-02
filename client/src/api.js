export const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : import.meta.env.VITE_API_URL;

const ADMIN_TOKEN_KEY = 'adminToken';

// Public endpoints (no login) — keeps Firebase out of the Home page bundle
export function publicFetch(path, options) {
  return fetch(`${API_BASE}${path}`, options);
}

// Fetch from the API as the logged-in Firebase user (sends their ID token).
// Firebase is imported lazily so pages that never log in don't download it.
export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  const { auth } = await import('./firebase');
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // storage unavailable — admin will need to log in again
  }
}

// Fetch from the API as admin; an expired/invalid token sends the admin back to login
export async function adminFetch(path, options = {}) {
  const headers = { ...options.headers, Authorization: `Bearer ${getAdminToken()}` };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    setAdminToken(null);
    window.location.assign('/admin/login');
  }
  return res;
}
