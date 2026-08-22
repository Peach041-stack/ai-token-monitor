import { config } from '../config/index.js';

export interface BudgetStatus {
  currentSpendUSD: number;
  budgetLimitUSD: number;
  percentageUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
  remainingUSD: number;
}

export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertNotification {
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: string;
}

export class AlertManager {
  private monthlyBudget: number;
  private dailyBudget: number;
  private thresholdPercent: number;
  private triggeredAlerts: Set<string> = new Set();

  constructor(
    monthlyBudget = config.MONTHLY_BUDGET_USD,
    dailyBudget = config.DAILY_BUDGET_USD,
    thresholdPercent = config.ALERT_THRESHOLD_PERCENT
  ) {
    this.monthlyBudget = monthlyBudget;
    this.dailyBudget = dailyBudget;
    this.thresholdPercent = thresholdPercent;
  }

  /**
   * Evaluate budget status against current accumulated spend
   */
  evaluate(spendUSD: number, period: 'daily' | 'monthly' = 'monthly'): BudgetStatus {
    const limit = period === 'monthly' ? this.monthlyBudget : this.dailyBudget;
    const percentage = limit > 0 ? (spendUSD / limit) * 100 : 0;
    const isWarning = percentage >= this.thresholdPercent && percentage < 100;
    const isExceeded = percentage >= 100;
    const remaining = Math.max(0, limit - spendUSD);

    return {
      currentSpendUSD: spendUSD,
      budgetLimitUSD: limit,
      percentageUsed: percentage,
      isWarning,
      isExceeded,
      remainingUSD: remaining
    };
  }

  /**
   * Check and generate alerts if spend crosses thresholds
   */
  checkAndNotify(spendUSD: number, period: 'daily' | 'monthly' = 'monthly'): AlertNotification | null {
    const status = this.evaluate(spendUSD, period);
    const alertKey = `${period}_${Math.floor(status.percentageUsed / 10) * 10}`;

    if (status.isExceeded && !this.triggeredAlerts.has(`${period}_exceeded`)) {
      this.triggeredAlerts.add(`${period}_exceeded`);
      return {
        level: 'CRITICAL',
        title: `🚨 AI Budget Exceeded (${period})`,
        message: `Your current ${period} spend is $${spendUSD.toFixed(2)}, which exceeds your budget of $${status.budgetLimitUSD.toFixed(2)} (${status.percentageUsed.toFixed(1)}%).`,
        timestamp: new Date().toISOString()
      };
    }

    if (status.isWarning && !this.triggeredAlerts.has(alertKey)) {
      this.triggeredAlerts.add(alertKey);
      return {
        level: 'WARNING',
        title: `⚠️ AI Budget Warning (${status.percentageUsed.toFixed(0)}%)`,
        message: `You have reached ${status.percentageUsed.toFixed(1)}% of your ${period} budget ($${spendUSD.toFixed(2)} / $${status.budgetLimitUSD.toFixed(2)}).`,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }
}

export const alertManager = new AlertManager();
