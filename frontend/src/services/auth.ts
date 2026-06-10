import { apiUrl } from '../config/runtime';

const AUTH_TOKEN_KEY = 'rivryn_auth_token';
const USER_EMAIL_KEY = 'rivryn_user_email';

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(apiUrl('/api/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Login failed');
  }

  const data = await res.json() as { token: string };
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  localStorage.setItem(USER_EMAIL_KEY, email);
  return data.token;
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUserEmail(): string | null {
  return localStorage.getItem(USER_EMAIL_KEY);
}
