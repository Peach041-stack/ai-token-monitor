import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env if exists
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  loadDotenv({ path: envPath });
}

// Config Schema & Validation
const configSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('localhost'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Budgets (USD)
  MONTHLY_BUDGET_USD: z.coerce.number().positive().default(50.0),
  DAILY_BUDGET_USD: z.coerce.number().positive().default(5.0),
  ALERT_THRESHOLD_PERCENT: z.coerce.number().min(1).max(100).default(80),
  
  // Exchange Rate (USD to THB)
  EXCHANGE_RATE_THB: z.coerce.number().positive().default(35.5),

  // Optional API Keys
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Optional Custom Log Directories
  CODEX_LOG_DIR: z.string().optional(),
  CLAUDE_LOG_DIR: z.string().optional(),
  ANTIGRAVITY_LOG_DIR: z.string().optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn('⚠️ Invalid environment variables detected, using safe defaults:', parsed.error.format());
    return configSchema.parse({});
  }
  return parsed.data;
}

export const config = loadConfig();
