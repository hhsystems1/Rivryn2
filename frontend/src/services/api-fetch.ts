import { apiUrl } from '../config/runtime';
import { getToken } from './auth';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(apiUrl(path), { ...options, headers });
}
