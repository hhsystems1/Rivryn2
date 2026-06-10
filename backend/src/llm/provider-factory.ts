import { LLMProvider, ProviderName } from './types';
import { OllamaClient } from './ollama-client';
import { OpenAIClient } from './openai-client';
import { CodexClient } from './codex-client';

function createProviderForName(name: ProviderName, apiKey?: string): LLMProvider {
  switch (name) {
    case 'openai':
      return new OpenAIClient(apiKey);
    case 'codex':
      return new CodexClient(apiKey);
    case 'ollama':
      return new OllamaClient(undefined, undefined, apiKey);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export function createProvider(name?: string, apiKey?: string): LLMProvider {
  const providerName = (name || process.env.LLM_PROVIDER || 'ollama') as ProviderName;

  try {
    return createProviderForName(providerName, apiKey);
  } catch (error) {
    console.error(`Failed to create provider "${providerName}":`, error);
    console.warn('Falling back to ollama.');
    return new OllamaClient();
  }
}
