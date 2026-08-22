import { IAIProvider, ModelPricing, TokenUsagePayload } from './types.js';

export class GeminiProvider implements IAIProvider {
  name = 'gemini' as const;
  displayName = 'Google Gemini / Antigravity';
  supportedModels = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'antigravity-flash',
    'antigravity-pro'
  ];

  private pricingMap: Record<string, ModelPricing> = {
    'gemini-2.5-pro': {
      modelId: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      provider: 'gemini',
      inputCostPerMillion: 1.25,
      outputCostPerMillion: 5.0,
      cachedInputCostPerMillion: 0.3125,
    },
    'gemini-2.5-flash': {
      modelId: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      provider: 'gemini',
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.60,
      cachedInputCostPerMillion: 0.0375,
    },
    'default': {
      modelId: 'antigravity-default',
      displayName: 'Antigravity Default',
      provider: 'gemini',
      inputCostPerMillion: 0.50,
      outputCostPerMillion: 2.0,
      cachedInputCostPerMillion: 0.10,
    }
  };

  getPricing(model: string): ModelPricing {
    const key = Object.keys(this.pricingMap).find(k => model.toLowerCase().includes(k)) || 'default';
    return this.pricingMap[key];
  }

  parseLogLine(line: string): TokenUsagePayload | null {
    if (!line.trim()) return null;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'PLANNER_RESPONSE') {
        const text = (obj.content || '') + JSON.stringify(obj.tool_calls || []);
        const estTokens = Math.round(text.length / 3.5);
        return {
          inputTokens: 0,
          outputTokens: estTokens,
          totalTokens: estTokens
        };
      }
    } catch {}
    return null;
  }
}

export const geminiProvider = new GeminiProvider();
