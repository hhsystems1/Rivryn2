export type ProviderName = 'ollama' | 'openai' | 'codex';

export interface ProviderHealth {
  provider: ProviderName;
  connected: boolean;
  modelAvailable: boolean;
  model: string;
  error?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type LLMResponse =
  | { type: 'text'; content: string }
  | { type: 'tool_calls'; calls: ToolCall[] };

export interface LLMProvider {
  generate(systemPrompt: string, userPrompt: string, context?: string): Promise<string>;
  streamGenerate(systemPrompt: string, userPrompt: string): AsyncGenerator<string>;
  generateWithTools(
    systemPrompt: string,
    userPrompt: string,
    tools: ToolDefinition[],
    messages?: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }[]
  ): Promise<LLMResponse>;
  checkHealth(): Promise<ProviderHealth>;
}
