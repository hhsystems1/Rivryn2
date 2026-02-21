const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim();
const RAW_WS_BASE = (import.meta.env.VITE_WS_BASE_URL || '').trim();

const API_BASE = sanitizeBaseUrl(RAW_API_BASE);
const WS_BASE = (RAW_WS_BASE || toWebSocketBase(API_BASE)).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) {
    return normalized;
  }
  return `${API_BASE}${normalized}`;
}

export function wsUrl(path: string): string {
  if (/^wss?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!WS_BASE) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}${normalized}`;
  }
  return `${WS_BASE}${normalized}`;
}

function toWebSocketBase(httpBase: string): string {
  if (!httpBase) {
    return '';
  }
  if (httpBase.startsWith('https://')) {
    return `wss://${httpBase.slice('https://'.length)}`;
  }
  if (httpBase.startsWith('http://')) {
    return `ws://${httpBase.slice('http://'.length)}`;
  }
  return httpBase;
}

function sanitizeBaseUrl(input: string): string {
  const normalized = input.replace(/\/+$/, '');
  if (!normalized) {
    return '';
  }
  const lowered = normalized.toLowerCase();
  if (
    lowered.includes('your-backend-domain.com') ||
    lowered.includes('example.com')
  ) {
    console.warn('VITE_API_BASE_URL is still a placeholder. Falling back to relative /api paths.');
    return '';
  }
  return normalized;
}
