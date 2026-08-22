import { IAIProvider, ProviderName } from './types.js';
import { openaiProvider } from './openai.js';
import { anthropicProvider } from './anthropic.js';
import { geminiProvider } from './gemini.js';

export * from './types.js';
export * from './openai.js';
export * from './anthropic.js';
export * from './gemini.js';

export const providers: Record<ProviderName, IAIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  antigravity: geminiProvider
};

export function getProvider(name: string): IAIProvider {
  const normalized = name.toLowerCase();
  if (normalized.includes('openai') || normalized.includes('codex') || normalized.includes('gpt')) {
    return openaiProvider;
  }
  if (normalized.includes('anthropic') || normalized.includes('claude')) {
    return anthropicProvider;
  }
  return geminiProvider;
}
