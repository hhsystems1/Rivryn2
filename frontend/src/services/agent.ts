import { apiUrl } from '../config/runtime';

export type AgentEvent =
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; call: { id: string; name: string; arguments: Record<string, unknown> } }
  | { type: 'tool_result'; call: { id: string; name: string }; result: { success: boolean; output: string } }
  | { type: 'pending_approval'; callId: string; call: { id: string; name: string; arguments: Record<string, unknown> } }
  | { type: 'approved'; callId: string }
  | { type: 'rejected'; callId: string }
  | { type: 'complete'; summary: string }
  | { type: 'error'; message: string };

export interface AgentRunOptions {
  prompt: string;
  projectId: string;
  provider?: string;
  onEvent: (event: AgentEvent) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

export async function runAgent(options: AgentRunOptions): Promise<string | undefined> {
  const { prompt, projectId, provider, onEvent, onError, onComplete } = options;

  const providerKey: Record<string, string> = {
    openai: 'rivryn_openai_api_key',
    codex: 'rivryn_codex_token',
    ollama: 'rivryn_ollama_api_key'
  };
  const storedProvider = provider || localStorage.getItem('rivryn_llm_provider') || 'ollama';
  const apiKey = localStorage.getItem(providerKey[storedProvider] || '') || '';
  const sessionId = `agent-${projectId}-${Date.now()}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(apiUrl('/api/agent/run'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, projectId, provider: storedProvider, sessionId })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      onError(data.error || `Request failed with status ${res.status}`);
      onComplete();
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('Response body is not readable');
      onComplete();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6).trim();
        if (payload === '[DONE]') {
          onComplete();
          return;
        }
        try {
          const event = JSON.parse(payload) as AgentEvent;
          onEvent(event);
          if (event.type === 'complete' || event.type === 'error') {
            onComplete();
            return;
          }
        } catch {
          console.warn('Failed to parse SSE event:', payload);
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error.message : String(error));
    onComplete();
  }

  return sessionId;
}

export function createAgentSessionId(projectId: string): string {
  return `agent-${projectId}-${Date.now()}`;
}

export async function approveToolCall(
  sessionId: string,
  callId: string,
  approved: boolean
): Promise<void> {
  const res = await fetch(apiUrl('/api/agent/approve'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, callId, approved })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Failed to send approval');
  }
}
