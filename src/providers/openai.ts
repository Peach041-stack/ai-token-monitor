import { IAIProvider, ModelPricing, TokenUsagePayload } from './types.js';

export class OpenAIProvider implements IAIProvider {
  name = 'openai' as const;
  displayName = 'OpenAI / Codex';
  supportedModels = [
    'gpt-5',
    'gpt-5.5',
    'gpt-5.4',
    'gpt-4o',
    'gpt-4o-mini',
    'o3',
    'o3-mini',
    'codex'
  ];

  private pricingMap: Record<string, ModelPricing> = {
    'gpt-5': {
      modelId: 'gpt-5',
      displayName: 'GPT-5 (Codex)',
      provider: 'openai',
      inputCostPerMillion: 5.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 1.25,
      reasoningCostPerMillion: 15.0,
    },
    'gpt-4o': {
      modelId: 'gpt-4o',
      displayName: 'GPT-4o',
      provider: 'openai',
      inputCostPerMillion: 2.5,
      outputCostPerMillion: 10.0,
      cachedInputCostPerMillion: 1.25,
    },
    'gpt-4o-mini': {
      modelId: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      provider: 'openai',
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.6,
      cachedInputCostPerMillion: 0.075,
    },
    'default': {
      modelId: 'codex-default',
      displayName: 'Codex Default',
      provider: 'openai',
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 12.0,
      cachedInputCostPerMillion: 1.0,
    }
  };

  getPricing(model: string): ModelPricing {
    const key = Object.keys(this.pricingMap).find(k => model.toLowerCase().includes(k)) || 'default';
    return this.pricingMap[key];
  }

  parseLogLine(line: string): TokenUsagePayload | null {
    if (!line.trim() || !line.includes('token_usage')) return null;
    try {
      const obj = JSON.parse(line);
      const info = obj.payload?.info;
      const usage = info?.last_token_usage || info?.total_token_usage;
      if (usage) {
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;
        const cachedInputTokens = usage.cached_input_tokens || 0;
        const reasoningTokens = usage.reasoning_output_tokens || 0;
        return {
          inputTokens,
          outputTokens,
          cachedInputTokens,
          reasoningTokens,
          totalTokens: inputTokens + outputTokens + cachedInputTokens + reasoningTokens
        };
      }
    } catch {}
    return null;
  }
}

export const openaiProvider = new OpenAIProvider();
