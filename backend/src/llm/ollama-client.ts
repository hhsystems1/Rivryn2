import { Ollama } from 'ollama';
import { LLMProvider, ProviderHealth, ProviderName, ToolDefinition, LLMResponse } from './types';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export class OllamaClient implements LLMProvider {
  private client: Ollama;
  private model: string;
  private host: string;
  readonly provider: ProviderName = 'ollama';

  constructor(
    model = process.env.OLLAMA_MODEL || 'codellama',
    host = process.env.OLLAMA_HOST,
    private apiKey = process.env.OLLAMA_API_KEY || ''
  ) {
    this.model = model;
    this.host = host || 'https://api.ollama.ai';
    this.client = new Ollama({ host: this.host });
  }

  async generate(systemPrompt: string, userPrompt: string, context?: string): Promise<string> {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context ? [{ role: 'user', content: context }] : []),
      { role: 'user', content: userPrompt }
    ] as OllamaMessage[];

    let response;
    try {
      response = await this.client.chat({
        model: this.model,
        messages,
        stream: false,
        ...(this.apiKey ? { headers: { Authorization: `Bearer ${this.apiKey}` } } : {})
      });
    } catch (error) {
      throw new Error(this.formatOllamaError(error));
    }

    return response.message.content;
  }

  async *streamGenerate(systemPrompt: string, userPrompt: string): AsyncGenerator<string> {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ] as OllamaMessage[];

    let stream;
    try {
      stream = await this.client.chat({
        model: this.model,
        messages,
        stream: true,
        ...(this.apiKey ? { headers: { Authorization: `Bearer ${this.apiKey}` } } : {})
      });
    } catch (error) {
      throw new Error(this.formatOllamaError(error));
    }

    for await (const chunk of stream) {
      yield chunk.message.content;
    }
  }

  async generateWithTools(
    systemPrompt: string,
    userPrompt: string,
    tools: ToolDefinition[],
    extraMessages?: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }[]
  ): Promise<LLMResponse> {
    const messages: OllamaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(extraMessages || []).map((m) => ({ role: m.role, content: m.content }) as OllamaMessage),
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.client.chat({
        model: this.model,
        messages,
        stream: false,
        tools: tools as any,
        ...(this.apiKey ? { headers: { Authorization: `Bearer ${this.apiKey}` } } : {})
      });

      const toolCalls = (response.message as any).tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        return {
          type: 'tool_calls',
          calls: toolCalls.map((tc: any, idx: number) => ({
            id: `${tc.function.name}-${idx}`,
            name: tc.function.name,
            arguments: tc.function.arguments
          }))
        };
      }

      return { type: 'text', content: response.message.content };
    } catch (error) {
      throw new Error(this.formatOllamaError(error));
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    try {
      const list = await this.client.list();
      const models = list.models?.map((item) => item.name) ?? [];
      const modelAvailable = models.some(
        (name) => name === this.model || name.startsWith(`${this.model}:`)
      );

      return {
        provider: this.provider,
        model: this.model,
        connected: true,
        modelAvailable,
        availableModels: models
      } as ProviderHealth & { availableModels: string[] };
    } catch (error) {
      return {
        provider: this.provider,
        model: this.model,
        connected: false,
        modelAvailable: false,
        error: this.formatOllamaError(error)
      };
    }
  }

  private formatOllamaError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('model') && message.includes('not found')) {
      return `Ollama model '${this.model}' not found on ${this.host}. Pull it with: ollama pull ${this.model}`;
    }
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      return `Unable to connect to Ollama at ${this.host}. Ensure Ollama is running and OLLAMA_HOST is correct.`;
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Ollama Cloud authentication failed. Check your OLLAMA_API_KEY.';
    }
    return `Ollama request failed (${this.host}, model ${this.model}): ${message}`;
  }
}
