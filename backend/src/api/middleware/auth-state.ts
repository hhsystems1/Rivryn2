const envToken = process.env.API_AUTH_TOKEN || '';
let runtimeToken = '';

export function getAuthToken(): string {
  return envToken || runtimeToken;
}

export function setAuthToken(token: string): void {
  runtimeToken = token;
}
