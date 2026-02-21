import { Ollama } from 'ollama';

interface OllamaHealth {
  host: string;
  model: string;
  connected: boolean;
  modelAvailable: boolean;
  availableModels: string[];
  error?: string;
}

export class OllamaClient {
  private client: Ollama;
  private model: string;
  private host: string;

  constructor(model = process.env.OLLAMA_MODEL || 'codellama', host = process.env.OLLAMA_HOST) {
    this.model = model;
    this.host = host || 'http://127.0.0.1:11434';
    this.client = new Ollama({ host: this.host });
  }

  async generate(systemPrompt: string, userPrompt: string, context?: string): Promise<string> {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context ? [{ role: 'user', content: context }] : []),
      { role: 'user', content: userPrompt }
    ];

    let response;
    try {
      response = await this.client.chat({
        model: this.model,
        messages,
        stream: false
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
    ];

    let stream;
    try {
      stream = await this.client.chat({
        model: this.model,
        messages,
        stream: true
      });
    } catch (error) {
      throw new Error(this.formatOllamaError(error));
    }

    for await (const chunk of stream) {
      yield chunk.message.content;
    }
  }

  async checkHealth(): Promise<OllamaHealth> {
    try {
      const list = await this.client.list();
      const models = list.models?.map((item) => item.name) ?? [];
      const modelAvailable = models.some(
        (name) => name === this.model || name.startsWith(`${this.model}:`)
      );

      return {
        host: this.host,
        model: this.model,
        connected: true,
        modelAvailable,
        availableModels: models
      };
    } catch (error) {
      return {
        host: this.host,
        model: this.model,
        connected: false,
        modelAvailable: false,
        availableModels: [],
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
    return `Ollama request failed (${this.host}, model ${this.model}): ${message}`;
  }
}
