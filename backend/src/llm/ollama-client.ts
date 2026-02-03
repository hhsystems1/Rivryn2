import ollama from 'ollama';

export class OllamaClient {
  private model: string;

  constructor(model = 'codellama') {
    this.model = model;
  }

  async generate(systemPrompt: string, userPrompt: string, context?: string): Promise<string> {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context ? [{ role: 'user', content: context }] : []),
      { role: 'user', content: userPrompt }
    ];

    const response = await ollama.chat({
      model: this.model,
      messages,
      stream: false
    });

    return response.message.content;
  }

  async *streamGenerate(systemPrompt: string, userPrompt: string): AsyncGenerator<string> {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const stream = await ollama.chat({
      model: this.model,
      messages,
      stream: true
    });

    for await (const chunk of stream) {
      yield chunk.message.content;
    }
  }
}
