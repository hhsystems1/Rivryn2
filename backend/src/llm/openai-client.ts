import OpenAI from 'openai';
import { LLMProvider, ProviderHealth, ProviderName, ToolDefinition, LLMResponse } from './types';

export class OpenAIClient implements LLMProvider {
  private client: OpenAI;
  private model: string;
  readonly provider: ProviderName = 'openai';

  constructor(
    apiKey = process.env.OPENAI_API_KEY || '',
    model = process.env.OPENAI_MODEL || 'gpt-4'
  ) {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Provide it via env or constructor.');
    }
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(systemPrompt: string, userPrompt: string, context?: string): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system' as const, content: systemPrompt },
      ...(context ? [{ role: 'user' as const, content: context }] : []),
      { role: 'user' as const, content: userPrompt }
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        stream: false
      });
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(this.formatOpenAIError(error));
    }
  }

  async *streamGenerate(systemPrompt: string, userPrompt: string): AsyncGenerator<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    let stream;
    try {
      stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        stream: true
      });
    } catch (error) {
      throw new Error(this.formatOpenAIError(error));
    }

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async generateWithTools(
    systemPrompt: string,
    userPrompt: string,
    tools: ToolDefinition[],
    extraMessages?: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }[]
  ): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system' as const, content: systemPrompt },
      ...(extraMessages || []).map((m) => {
        if (m.role === 'tool') {
          return {
            role: 'tool' as const,
            content: m.content,
            tool_call_id: m.tool_call_id || ''
          } as OpenAI.Chat.ChatCompletionMessageParam;
        }
        return { role: m.role as 'system' | 'user' | 'assistant', content: m.content };
      }),
      { role: 'user' as const, content: userPrompt }
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters as Record<string, unknown>
          }
        })),
        stream: false
      });

      const choice = response.choices[0];
      const toolCalls = choice?.message?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        const calls = toolCalls
          .filter((tc: any) => tc.type === 'function' && tc.function)
          .map((tc: any) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          }));

        if (calls.length > 0) {
          return { type: 'tool_calls', calls };
        }
      }

      return { type: 'text', content: choice?.message?.content || '' };
    } catch (error) {
      throw new Error(this.formatOpenAIError(error));
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false
      });
      return {
        provider: this.provider,
        model: this.model,
        connected: true,
        modelAvailable: !!response.choices[0]?.message?.content
      };
    } catch (error) {
      return {
        provider: this.provider,
        model: this.model,
        connected: false,
        modelAvailable: false,
        error: this.formatOpenAIError(error)
      };
    }
  }

  private formatOpenAIError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('401') || message.includes('Incorrect API key')) {
      return 'OpenAI authentication failed. Check your OPENAI_API_KEY.';
    }
    if (message.includes('429')) {
      return 'OpenAI rate limit exceeded. Please wait and retry.';
    }
    if (message.includes('model_not_found')) {
      return `OpenAI model '${this.model}' not found or not accessible with your API key.`;
    }
    return `OpenAI request failed (model ${this.model}): ${message}`;
  }
}
