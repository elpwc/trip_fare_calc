import { AuthRequestError, resolveAuthErrorMessage } from './auth-errors';
import { apiPath } from '@/src/config/paths';
import { apiRequest } from '@/src/utils/api-request';

export { AuthRequestError, resolveAuthErrorMessage };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

const API_ROOT = apiPath('/api/auth');
const STORAGE_KEY = 'tripFareCalc_token';
const USER_STORAGE_KEY = 'tripFareCalc_user';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export function getToken(): string | null {
  const storage = getStorage();
  return storage?.getItem(STORAGE_KEY) ?? null;
}

export function setToken(token: string | null) {
  const storage = getStorage();
  if (!storage) return;

  if (token) {
    storage.setItem(STORAGE_KEY, token);
  } else {
    storage.removeItem(STORAGE_KEY);
  }
}

export function getStoredUser(): AuthUser | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null) {
  const storage = getStorage();
  if (!storage) return;

  if (user) {
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    storage.removeItem(USER_STORAGE_KEY);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, options);
}

export async function registerEmail(email: string) {
  return request<{ message: string }>(`${API_ROOT}/register-email`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailToken(token: string) {
  return request<{ message: string }>(`${API_ROOT}/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });
}

export async function register(email: string, name: string, password: string, code: string) {
  const result = await request<{
    message: string;
    token: string;
    user: AuthUser;
  }>(`${API_ROOT}/register`, {
    method: 'POST',
    body: JSON.stringify({ email, name, password, code }),
  });
  setToken(result.token);
  setStoredUser(result.user);
  return result;
}

export async function login(email: string, password: string) {
  const result = await request<{
    message: string;
    token: string;
    user: AuthUser;
  }>(`${API_ROOT}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  setStoredUser(result.user);
  return result;
}

export async function logout() {
  setToken(null);
  setStoredUser(null);
}

export async function updateUser(fields: {
  name?: string;
  email?: string;
  password?: string;
  oldPassword?: string;
}) {
  const result = await request<{ message: string; user: AuthUser }>(`${API_ROOT}/users`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(fields),
  });
  setStoredUser(result.user);
  return result;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return updateUser({ oldPassword, password: newPassword });
}

export async function fetchProfile() {
  const storedUser = getStoredUser();
  if (storedUser) {
    return storedUser;
  }

  return request<AuthUser>(`${API_ROOT}/profile`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function updateName(name: string) {
  return updateUser({ name });
}

export async function updateEmail(email: string) {
  return updateUser({ email });
}

export async function verifyToken(token: string) {
  return request<{ message: string }>(`${API_ROOT}/verify-token`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
