import { config } from './config/index.js';
import { providers, getProvider, TokenUsagePayload } from './providers/index.js';
import { TokenCounter } from './core/token-counter.js';
import { CostCalculator } from './core/cost-calculator.js';
import { AlertManager } from './core/alert-manager.js';

async function main() {
  console.log('===============================================================');
  console.log('📊 AI Token Monitor - Core Engine');
  console.log('   Real-Time Observability, Cost Calculation & Quota Alerting');
  console.log('===============================================================');
  console.log(`🔧 Port: ${config.PORT} | Node Env: ${config.NODE_ENV}`);
  console.log(`💵 Monthly Budget: $${config.MONTHLY_BUDGET_USD.toFixed(2)} USD | Threshold: ${config.ALERT_THRESHOLD_PERCENT}%`);
  console.log(`💱 Exchange Rate: 1 USD = ${config.EXCHANGE_RATE_THB} THB\n`);

  // 1. Initialize Alert Manager
  const alertManager = new AlertManager(
    config.MONTHLY_BUDGET_USD,
    config.DAILY_BUDGET_USD,
    config.ALERT_THRESHOLD_PERCENT
  );

  // 2. Demo Simulation Across Supported Providers
  const mockWorkloads = [
    {
      provider: 'openai',
      model: 'gpt-5',
      task: 'Complex Full-Stack Architecture Planning',
      usage: { inputTokens: 45000, outputTokens: 2500, cachedInputTokens: 38000, reasoningTokens: 1200, totalTokens: 47500 }
    },
    {
      provider: 'anthropic',
      model: 'claude-3-7-sonnet',
      task: 'React Component Optimization & Refactoring',
      usage: { inputTokens: 32000, outputTokens: 1800, cachedInputTokens: 28000, reasoningTokens: 0, totalTokens: 33800 }
    },
    {
      provider: 'gemini',
      model: 'gemini-2.5-pro',
      task: 'Code Analysis & Security Audit',
      usage: { inputTokens: 60000, outputTokens: 3000, cachedInputTokens: 50000, reasoningTokens: 0, totalTokens: 63000 }
    }
  ];

  console.log('🚀 [SIMULATION] Processing Sample Workloads:\n');

  let totalSessionCostUSD = 0;
  const totalUsages: TokenUsagePayload[] = [];

  for (const item of mockWorkloads) {
    const provider = getProvider(item.provider);
    const pricing = provider.getPricing(item.model);
    const cost = CostCalculator.calculate(item.usage, pricing, config.EXCHANGE_RATE_THB);
    const savings = CostCalculator.calculateCacheSavings(item.usage, pricing);

    totalSessionCostUSD += cost.totalUSD;
    totalUsages.push(item.usage);

    console.log(`📌 [${provider.displayName}] Model: ${pricing.displayName}`);
    console.log(`   Task: ${item.task}`);
    console.log(`   Tokens: ${TokenCounter.format(item.usage.totalTokens)} (In: ${TokenCounter.format(item.usage.inputTokens)}, Out: ${TokenCounter.format(item.usage.outputTokens)}, Cached: ${TokenCounter.format(item.usage.cachedInputTokens || 0)})`);
    console.log(`   Cost: $${cost.totalUSD.toFixed(4)} USD (≈ ฿${cost.totalTHB.toFixed(2)} บาท)`);
    if (savings > 0) {
      console.log(`   💰 Cache Savings: +$${savings.toFixed(4)} USD saved!`);
    }
    console.log('');
  }

  // 3. Summary & Budget Check
  const aggregatedUsage = TokenCounter.aggregate(totalUsages);
  console.log('---------------------------------------------------------------');
  console.log('📈 [SUMMARY METRICS]');
  console.log(`   Total Tokens Processed: ${TokenCounter.format(aggregatedUsage.totalTokens)}`);
  console.log(`   Total Session Cost: $${totalSessionCostUSD.toFixed(4)} USD (≈ ฿${(totalSessionCostUSD * config.EXCHANGE_RATE_THB).toFixed(2)} บาท)`);

  const budgetStatus = alertManager.evaluate(totalSessionCostUSD, 'daily');
  console.log(`   Daily Budget Used: ${budgetStatus.percentageUsed.toFixed(1)}% ($${totalSessionCostUSD.toFixed(2)} / $${budgetStatus.budgetLimitUSD.toFixed(2)})`);

  const alert = alertManager.checkAndNotify(totalSessionCostUSD, 'daily');
  if (alert) {
    console.log(`\n${alert.title}`);
    console.log(`   ${alert.message}`);
  } else {
    console.log('   ✅ All spend metrics within safe budget limits.');
  }

  console.log('===============================================================\n');
  console.log('💡 Tip: Start the Real-Time Web Dashboard using: npm run dashboard');
}

// Run CLI if executed directly
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  main().catch(err => {
    console.error('❌ Error executing AI Token Monitor:', err);
    process.exit(1);
  });
}

export {
  config,
  providers,
  getProvider,
  TokenCounter,
  CostCalculator,
  AlertManager
};
