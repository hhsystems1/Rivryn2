import { LLMProvider, ProviderName } from './types';
import { OllamaClient } from './ollama-client';
import { OpenAIClient } from './openai-client';
import { CodexClient } from './codex-client';

const providerConstructors: Record<ProviderName, () => LLMProvider> = {
  ollama: () => new OllamaClient(),
  openai: () => new OpenAIClient(),
  codex: () => new CodexClient()
};

export function createProvider(name?: string): LLMProvider {
  const providerName = (name || process.env.LLM_PROVIDER || 'ollama') as ProviderName;

  if (!(providerName in providerConstructors)) {
    console.warn(`Unknown LLM provider "${providerName}". Falling back to ollama.`);
    return new OllamaClient();
  }

  try {
    return providerConstructors[providerName]();
  } catch (error) {
    console.error(`Failed to create provider "${providerName}":`, error);
    console.warn('Falling back to ollama.');
    return new OllamaClient();
  }
}
