import { apiUrl } from '../config/runtime';
import { supabase } from '../lib/supabase';

export interface AuditEvent {
  id: string;
  actorId: string;
  scope: 'memory' | 'project-context';
  summary: string;
  timestamp: string;
  sync: 'saved' | 'failed';
  error?: string;
}

export interface MemoryPayload {
  baseMemory: string;
  overlayAgent: string;
  overlayText: string;
}

export interface ProjectContextPayload {
  projectName: string;
  repoUrl: string;
  deploymentTarget: string;
  approvalRules: string;
}

const PRIMARY_ACCOUNT_KEY = 'sidekick_primary_account_key';
const MEMORY_KEY = 'sidekick_memory';
const CONTEXT_KEY = 'sidekick_project_context';
const AUDIT_KEY = 'sidekick_audit_log';
const GOOGLE_CONNECTED_KEY = 'sidekick_google_connected';

const sidekickApiBase = (
  import.meta.env.VITE_SIDEKICK_API_BASE_URL ||
  'https://xztpkgnorbltoksucckc.supabase.co/functions/v1'
).replace(/\/+$/, '');
const googleConnectEndpoint =
  import.meta.env.VITE_SIDEKICK_GOOGLE_CONNECT_URL || `${sidekickApiBase}/google-connect`;
const googleStatusEndpoint =
  import.meta.env.VITE_SIDEKICK_GOOGLE_STATUS_URL || `${sidekickApiBase}/google-status`;
const googleDisconnectEndpoint =
  import.meta.env.VITE_SIDEKICK_GOOGLE_DISCONNECT_URL || `${sidekickApiBase}/google-disconnect`;
const memoryEndpoint = import.meta.env.VITE_SIDEKICK_MEMORY_SYNC_URL || '';
const contextEndpoint = import.meta.env.VITE_SIDEKICK_PROJECT_CONTEXT_SYNC_URL || '';
const deployStatusEndpoint = import.meta.env.VITE_SIDEKICK_DEPLOY_STATUS_URL || '';

export async function signInWithPassword(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User id missing from session.');
  }
  localStorage.setItem(PRIMARY_ACCOUNT_KEY, userId);
  return userId;
}

export async function signUpWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem(PRIMARY_ACCOUNT_KEY);
}

export async function getAuthState(): Promise<{ userId: string | null; accessToken: string | null }> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id || null;
  const accessToken = data.session?.access_token || null;
  if (userId) {
    localStorage.setItem(PRIMARY_ACCOUNT_KEY, userId);
  }
  return { userId, accessToken };
}

export function onAuthStateChanged(callback: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(() => callback());
  return () => {
    data.subscription.unsubscribe();
  };
}

export function getPrimaryAccountKey(): string | null {
  return localStorage.getItem(PRIMARY_ACCOUNT_KEY);
}

export async function startGoogleConnect(accessToken: string, redirectTo: string): Promise<string | null> {
  const res = await fetch(googleConnectEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ redirect_to: redirectTo })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to start Google connect');
  }

  localStorage.setItem(GOOGLE_CONNECTED_KEY, 'pending');
  if (data.url) {
    return data.url as string;
  }
  if (data.redirect_to) {
    return data.redirect_to as string;
  }
  return null;
}

export async function disconnectGoogle(accessToken: string): Promise<void> {
  const res = await fetch(googleDisconnectEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to disconnect Google');
  }
  localStorage.setItem(GOOGLE_CONNECTED_KEY, 'false');
}

export async function getGoogleStatus(accessToken: string): Promise<{ connected: boolean; raw: unknown }> {
  const res = await fetch(googleStatusEndpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Failed to read Google status');
  }

  const normalized = data as Record<string, unknown>;
  const connected = Boolean(
    normalized.connected ??
      normalized.is_connected ??
      normalized.google_connected ??
      normalized.active ??
      false
  );
  localStorage.setItem(GOOGLE_CONNECTED_KEY, connected ? 'true' : 'false');
  return { connected, raw: data };
}

export function getGoogleConnected(): boolean {
  const value = localStorage.getItem(GOOGLE_CONNECTED_KEY);
  return value === 'true' || value === 'pending';
}

export function setGoogleConnected(connected: boolean): void {
  localStorage.setItem(GOOGLE_CONNECTED_KEY, connected ? 'true' : 'false');
}

export function loadMemory(): MemoryPayload {
  const parsed = parseJson<MemoryPayload>(MEMORY_KEY);
  return (
    parsed || {
      baseMemory: '',
      overlayAgent: 'coder',
      overlayText: ''
    }
  );
}

export function loadProjectContext(): ProjectContextPayload {
  const parsed = parseJson<ProjectContextPayload>(CONTEXT_KEY);
  return (
    parsed || {
      projectName: '',
      repoUrl: '',
      deploymentTarget: 'netlify',
      approvalRules: 'money, security, deletion, messaging require explicit approval'
    }
  );
}

export function loadAuditLog(): AuditEvent[] {
  return parseJson<AuditEvent[]>(AUDIT_KEY) || [];
}

export async function saveMemory(
  userId: string,
  payload: MemoryPayload
): Promise<{ sync: 'saved' | 'failed'; error?: string }> {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(payload));

  let sync: 'saved' | 'failed' = 'saved';
  let error: string | undefined;

  if (memoryEndpoint) {
    try {
      const res = await fetch(memoryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, payload })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Memory sync failed');
      }
    } catch (err) {
      sync = 'failed';
      error = err instanceof Error ? err.message : String(err);
    }
  } else {
    sync = 'failed';
    error = 'Set VITE_SIDEKICK_MEMORY_SYNC_URL to sync memory to Sidekick.';
  }

  appendAuditEvent({
    actorId: userId,
    scope: 'memory',
    summary: `Saved memory (overlay agent: ${payload.overlayAgent || 'none'})`,
    sync,
    error
  });

  return { sync, error };
}

export async function saveProjectContext(
  userId: string,
  payload: ProjectContextPayload
): Promise<{ sync: 'saved' | 'failed'; error?: string }> {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(payload));

  let sync: 'saved' | 'failed' = 'saved';
  let error: string | undefined;

  if (contextEndpoint) {
    try {
      const res = await fetch(contextEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, payload })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Project context sync failed');
      }
    } catch (err) {
      sync = 'failed';
      error = err instanceof Error ? err.message : String(err);
    }
  } else if (sidekickApiBase) {
    try {
      const res = await fetch(`${sidekickApiBase}/project-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, payload })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Project context sync failed');
      }
    } catch (err) {
      sync = 'failed';
      error = err instanceof Error ? err.message : String(err);
    }
  } else {
    sync = 'failed';
    error = 'Set VITE_SIDEKICK_PROJECT_CONTEXT_SYNC_URL or VITE_SIDEKICK_API_BASE_URL.';
  }

  appendAuditEvent({
    actorId: userId,
    scope: 'project-context',
    summary: `Saved project context for ${payload.projectName || 'unnamed project'}`,
    sync,
    error
  });

  return { sync, error };
}

export async function readDeployStatus(userId: string): Promise<string> {
  if (!deployStatusEndpoint) {
    return 'Set VITE_SIDEKICK_DEPLOY_STATUS_URL to fetch CI/deploy logs from Sidekick.';
  }
  const endpoint = deployStatusEndpoint.startsWith('http')
    ? `${deployStatusEndpoint}?userId=${encodeURIComponent(userId)}`
    : apiUrl(`${deployStatusEndpoint}?userId=${encodeURIComponent(userId)}`);
  const res = await fetch(endpoint);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch deploy status');
  }
  return JSON.stringify(data, null, 2);
}

function appendAuditEvent(input: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  const current = loadAuditLog();
  current.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...input
  });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(current.slice(0, 100)));
}

function parseJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
