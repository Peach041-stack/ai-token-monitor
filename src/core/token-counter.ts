import { TokenUsagePayload } from '../providers/types.js';

export class TokenCounter {
  /**
   * Estimate token count from raw text (Fallback when exact token counts are not in metadata)
   * Standard heuristic: ~3.5 to 4 characters per token for English/Code, ~1-2 chars for Thai/Unicode.
   */
  static estimateFromText(text: string): number {
    if (!text || text.length === 0) return 0;
    // Thai character regex
    const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
    const standardChars = text.length - thaiChars;
    
    const standardTokens = standardChars / 3.8;
    const thaiTokens = thaiChars / 1.6;

    return Math.ceil(standardTokens + thaiTokens);
  }

  /**
   * Aggregate multiple token payloads into a single total
   */
  static aggregate(usages: TokenUsagePayload[]): TokenUsagePayload {
    return usages.reduce(
      (acc, curr) => ({
        inputTokens: acc.inputTokens + curr.inputTokens,
        outputTokens: acc.outputTokens + curr.outputTokens,
        cachedInputTokens: (acc.cachedInputTokens || 0) + (curr.cachedInputTokens || 0),
        reasoningTokens: (acc.reasoningTokens || 0) + (curr.reasoningTokens || 0),
        totalTokens: acc.totalTokens + curr.totalTokens,
      }),
      {
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        reasoningTokens: 0,
        totalTokens: 0,
      }
    );
  }

  /**
   * Format numbers into compact readable format (e.g. 1.2M, 50k, 12,500)
   */
  static format(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString('th-TH');
  }
}
