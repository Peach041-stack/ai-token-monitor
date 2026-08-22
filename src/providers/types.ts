export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'antigravity';

export interface TokenUsagePayload {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  totalTokens: number;
}

export interface ModelPricing {
  modelId: string;
  displayName: string;
  provider: ProviderName;
  inputCostPerMillion: number; // USD per 1M tokens
  outputCostPerMillion: number;
  cachedInputCostPerMillion?: number;
  reasoningCostPerMillion?: number;
}

export interface CalculatedCost {
  inputUSD: number;
  outputUSD: number;
  cachedUSD: number;
  reasoningUSD: number;
  totalUSD: number;
  totalTHB: number;
}

export interface TokenEvent {
  id: string;
  timestamp: string;
  provider: ProviderName;
  model: string;
  usage: TokenUsagePayload;
  cost: CalculatedCost;
  taskDescription?: string;
  latencySeconds?: number;
}

export interface IAIProvider {
  name: ProviderName;
  displayName: string;
  supportedModels: string[];
  getPricing(model: string): ModelPricing;
  parseLogLine?(line: string): TokenUsagePayload | null;
}
