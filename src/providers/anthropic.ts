import { IAIProvider, ModelPricing, TokenUsagePayload } from './types.js';

export class AnthropicProvider implements IAIProvider {
  name = 'anthropic' as const;
  displayName = 'Anthropic / Claude';
  supportedModels = [
    'claude-3-7-sonnet',
    'claude-3-5-sonnet',
    'claude-3-5-haiku',
    'claude-3-opus',
    'claude-fable-5',
    'claude-code'
  ];

  private pricingMap: Record<string, ModelPricing> = {
    'claude-3-7-sonnet': {
      modelId: 'claude-3-7-sonnet',
      displayName: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.30,
    },
    'claude-3-5-sonnet': {
      modelId: 'claude-3-5-sonnet',
      displayName: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.30,
    },
    'claude-3-5-haiku': {
      modelId: 'claude-3-5-haiku',
      displayName: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      inputCostPerMillion: 0.80,
      outputCostPerMillion: 4.0,
      cachedInputCostPerMillion: 0.08,
    },
    'default': {
      modelId: 'claude-default',
      displayName: 'Claude Default',
      provider: 'anthropic',
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      cachedInputCostPerMillion: 0.30,
    }
  };

  getPricing(model: string): ModelPricing {
    const key = Object.keys(this.pricingMap).find(k => model.toLowerCase().includes(k)) || 'default';
    return this.pricingMap[key];
  }

  parseLogLine(line: string): TokenUsagePayload | null {
    if (!line.trim() || !line.includes('usage')) return null;
    try {
      const obj = JSON.parse(line);
      const usage = obj.usage || obj.payload?.usage || obj.message?.usage;
      if (usage && (usage.input_tokens || usage.output_tokens)) {
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;
        const cachedInputTokens = usage.cache_read_input_tokens || 0;
        return {
          inputTokens,
          outputTokens,
          cachedInputTokens,
          totalTokens: inputTokens + outputTokens + cachedInputTokens
        };
      }
    } catch {}
    return null;
  }
}

export const anthropicProvider = new AnthropicProvider();
