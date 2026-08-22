import { CalculatedCost, ModelPricing, TokenUsagePayload } from '../providers/types.js';
import { config } from '../config/index.js';

export class CostCalculator {
  /**
   * Calculate exact cost breakdown based on pricing structure
   */
  static calculate(
    usage: TokenUsagePayload,
    pricing: ModelPricing,
    exchangeRate: number = config.EXCHANGE_RATE_THB
  ): CalculatedCost {
    const inputRate = pricing.inputCostPerMillion / 1_000_000;
    const outputRate = pricing.outputCostPerMillion / 1_000_000;
    const cachedRate = (pricing.cachedInputCostPerMillion ?? (pricing.inputCostPerMillion * 0.25)) / 1_000_000;
    const reasoningRate = (pricing.reasoningCostPerMillion ?? pricing.outputCostPerMillion) / 1_000_000;

    const uncachedInput = Math.max(0, usage.inputTokens - (usage.cachedInputTokens || 0));
    const cachedInput = usage.cachedInputTokens || 0;
    const reasoning = usage.reasoningTokens || 0;
    const output = usage.outputTokens;

    const inputUSD = uncachedInput * inputRate;
    const cachedUSD = cachedInput * cachedRate;
    const reasoningUSD = reasoning * reasoningRate;
    const outputUSD = output * outputRate;

    const totalUSD = inputUSD + cachedUSD + reasoningUSD + outputUSD;
    const totalTHB = totalUSD * exchangeRate;

    return {
      inputUSD,
      cachedUSD,
      reasoningUSD,
      outputUSD,
      totalUSD,
      totalTHB
    };
  }

  /**
   * Calculate savings from Prompt Caching (Tokens that used cache rate instead of full input rate)
   */
  static calculateCacheSavings(
    usage: TokenUsagePayload,
    pricing: ModelPricing
  ): number {
    if (!usage.cachedInputTokens || usage.cachedInputTokens === 0) return 0;
    const fullRate = pricing.inputCostPerMillion / 1_000_000;
    const cachedRate = (pricing.cachedInputCostPerMillion ?? (pricing.inputCostPerMillion * 0.25)) / 1_000_000;
    
    return usage.cachedInputTokens * (fullRate - cachedRate);
  }
}
