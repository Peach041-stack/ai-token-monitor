const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to load .env file without external dependencies
function loadEnvFile() {
  const possiblePaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx > 0) {
              const key = trimmed.slice(0, idx).trim();
              const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        });
        console.log('⚙️ Loaded configuration from .env at:', p);
        break;
      } catch (e) {}
    }
  }
}

loadEnvFile();

let PORT = parseInt(process.env.PORT || '3001', 10);
const DAILY_BUDGET_USD = parseFloat(process.env.DAILY_BUDGET_USD || '5.00');
const MONTHLY_BUDGET_USD = parseFloat(process.env.MONTHLY_BUDGET_USD || '50.00');
const ALERT_THRESHOLD_PERCENT = parseFloat(process.env.ALERT_THRESHOLD_PERCENT || '80');
const EXCHANGE_RATE_THB = parseFloat(process.env.EXCHANGE_RATE_THB || '35.50');

const clients = new Set();
const home = os.homedir();

// แปลง Timestamp เป็นวันที่ YYYY-MM-DD ตาม Local Timezone ของเครื่องผู้ใช้ (ป้องกันปัญหาเหลื่อมเวลา UTC)
function getLocalDateStr(ts) {
  if (!ts) return new Date().toLocaleDateString('en-CA');
  const d = new Date(ts);
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-CA');
  return d.toLocaleDateString('en-CA'); // en-CA format จะเป็น YYYY-MM-DD ตามเวลาท้องถิ่นเสมอ
}

// 🌐 Dynamic Cross-Platform Path Resolver (Windows, macOS, Linux)
function resolvePlatformPaths() {
  const platform = os.platform();
  let codex = [
    process.env.CODEX_LOG_DIR || path.join(home, '.codex', 'sessions'),
    path.join(home, '.codex', 'archived_sessions')
  ];
  let claude = [
    process.env.CLAUDE_LOG_DIR || path.join(home, '.claude', 'projects')
  ];
  let antigravity = process.env.ANTIGRAVITY_LOG_DIR || path.join(home, '.gemini', 'antigravity', 'brain');

  if (platform === 'win32') {
    claude.push(
      path.join(home, 'AppData', 'Local', 'Packages', 'Claude_pzs8sxrjxfjjc', 'LocalCache', 'Roaming', 'Claude', 'local-agent-mode-sessions'),
      path.join(home, 'AppData', 'Roaming', 'Claude', 'local-agent-mode-sessions')
    );
  } else if (platform === 'darwin') { // macOS
    claude.push(
      path.join(home, 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions'),
      path.join(home, 'Library', 'Application Support', 'Claude', 'projects')
    );
    codex.push(
      path.join(home, 'Library', 'Application Support', 'OpenAI', 'Codex', 'sessions')
    );
  } else { // Linux
    claude.push(
      path.join(home, '.config', 'Claude', 'local-agent-mode-sessions'),
      path.join(home, '.config', 'claude', 'projects')
    );
    codex.push(
      path.join(home, '.config', 'openai', 'codex', 'sessions')
    );
  }

  return {
    codexDirs: codex.filter(p => fs.existsSync(p)),
    claudeDirs: claude.filter(p => fs.existsSync(p)),
    antigravityDir: antigravity
  };
}

const { codexDirs: CODEX_DIRS, claudeDirs: CLAUDE_DIRS, antigravityDir: ANTIGRAVITY_DIR } = resolvePlatformPaths();

const IGNORED_SUBDIRS = new Set([
  'Cache', 'DawnCache', 'GPUCache', 'Cache_Data', 'node_modules', 'rpm', 'mcp-logs-workspace', 'vm_bundles'
]);

console.log('----------------------------------------------------');
console.log(`🤖 AI Token Real-Time Bridge Server Starting on ${os.platform()}...`);
console.log('📁 Watching Codex Directories:', CODEX_DIRS);
console.log('📁 Watching Claude Directories:', CLAUDE_DIRS);
console.log('📁 Watching Antigravity:', ANTIGRAVITY_DIR);
console.log(`💰 Budget Thresholds: Daily $${DAILY_BUDGET_USD} | Monthly $${MONTHLY_BUDGET_USD} | Warn at ${ALERT_THRESHOLD_PERCENT}%`);
console.log('----------------------------------------------------');

// 🧩 Declarative Model Registry & Cost Rates
const MODEL_REGISTRY = [
  { match: /gpt-6-astra|astra/i, name: 'GPT-6 Astra', provider: 'Codex', costPer1k: 0.012 },
  { match: /gpt-6/i, name: 'GPT-6', provider: 'Codex', costPer1k: 0.015 },
  { match: /gpt-5\.6/i, name: 'GPT-5.6', provider: 'Codex', costPer1k: 0.010 },
  { match: /gpt-5\.5/i, name: 'GPT-5.5', provider: 'Codex', costPer1k: 0.010 },
  { match: /gpt-5\.4/i, name: 'GPT-5.4', provider: 'Codex', costPer1k: 0.008 },
  { match: /gpt-5/i, name: 'GPT-5', provider: 'Codex', costPer1k: 0.008 },
  { match: /gpt-4o-mini/i, name: 'GPT-4o Mini', provider: 'Codex', costPer1k: 0.0006 },
  { match: /gpt-4o/i, name: 'GPT-4o', provider: 'Codex', costPer1k: 0.005 },
  { match: /o3-mini/i, name: 'o3-mini', provider: 'Codex', costPer1k: 0.004 },
  { match: /o3/i, name: 'o3', provider: 'Codex', costPer1k: 0.020 },
  { match: /codex-auto-review/i, name: 'Codex Auto-Review', provider: 'Codex', costPer1k: 0.005 },
  { match: /opus-5/i, name: 'Claude Opus 5', provider: 'ClaudeCowork', costPer1k: 0.015 },
  { match: /opus-4/i, name: 'Claude Opus 4.8', provider: 'ClaudeCowork', costPer1k: 0.015 },
  { match: /fable-5/i, name: 'Claude Fable 5', provider: 'ClaudeCowork', costPer1k: 0.015 },
  { match: /sonnet-5/i, name: 'Claude Sonnet 5', provider: 'ClaudeCowork', costPer1k: 0.010 },
  { match: /sonnet-4-6|3-5-sonnet/i, name: 'Claude Sonnet 4.6', provider: 'ClaudeCowork', costPer1k: 0.006 },
  { match: /3-7-sonnet/i, name: 'Claude 3.7 Sonnet', provider: 'ClaudeCowork', costPer1k: 0.008 },
  { match: /haiku-4-5|3-5-haiku/i, name: 'Claude Haiku 4.5', provider: 'ClaudeCowork', costPer1k: 0.001 },
  { match: /gemini-3\.0/i, name: 'Gemini 3.0 Flash / Pro', provider: 'Antigravity', costPer1k: 0.008 },
  { match: /gemini-2\.5-pro/i, name: 'Gemini 2.5 Pro', provider: 'Antigravity', costPer1k: 0.007 },
  { match: /gemini-2\.5-flash/i, name: 'Gemini 2.5 Flash', provider: 'Antigravity', costPer1k: 0.0005 },
  { match: /antigravity/i, name: 'Antigravity (Gemini)', provider: 'Antigravity', costPer1k: 0.008 }
];

function resolveModelInfo(rawModel, provider) {
  if (!rawModel) {
    const fallbackName = provider === 'Codex' ? 'GPT-6 Astra' : provider === 'ClaudeCowork' ? 'Claude Sonnet 5' : 'Gemini 3.0 Flash / Pro';
    return { name: fallbackName, provider, costPer1k: provider === 'ClaudeCowork' ? 0.015 : provider === 'Codex' ? 0.010 : 0.008 };
  }
  for (const entry of MODEL_REGISTRY) {
    if (entry.match.test(rawModel)) {
      return { name: entry.name, provider: entry.provider, costPer1k: entry.costPer1k };
    }
  }
  return { name: rawModel, provider, costPer1k: provider === 'ClaudeCowork' ? 0.015 : provider === 'Codex' ? 0.010 : 0.008 };
}

let dailyMap = {};
let subModelStatsMap = {};
let recentLiveEvents = [];
const fileOffsets = new Map();
const sessionModelCache = new Map();

// ⚡ Persistent Cache Management (.token-cache.json)
const CACHE_FILE = path.join(__dirname, '.token-cache.json');
let fileCache = {};

function loadPersistentCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (data && data.version === 2 && data.files) {
        fileCache = data.files;
        return true;
      }
    } catch (e) {}
  }
  fileCache = {};
  return false;
}

let cacheSaveTimer = null;
function savePersistentCacheDebounced() {
  if (cacheSaveTimer) clearTimeout(cacheSaveTimer);
  cacheSaveTimer = setTimeout(() => {
    try {
      const payload = { version: 2, lastSaved: new Date().toISOString(), files: fileCache };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(payload), 'utf8');
    } catch (e) {}
  }, 1000);
}

function parseCodexLine(line, filename = '') {
  if (!line.trim()) return null;
  try {
    const obj = JSON.parse(line);

    if (obj.type === 'world_state') {
      const m = obj.payload?.state?.collaboration_mode?.model;
      if (m && filename) sessionModelCache.set(filename, m);
    }
    if (obj.type === 'turn_context' && obj.payload?.model) {
      if (filename) sessionModelCache.set(filename, obj.payload.model);
    }

    if (!line.includes('token_usage') && !line.includes('token_count')) return null;

    const info = obj.payload?.info;
    if (info?.last_token_usage || info?.total_token_usage) {
      const last = info.last_token_usage || info.total_token_usage;
      const inp = last.input_tokens || 0;
      const out = last.output_tokens || 0;
      const reas = last.reasoning_output_tokens || 0;
      const cach = last.cached_input_tokens || 0;
      const total = inp + out + reas + cach;
      if (total === 0) return null;

      const rawModel = info.model || info.model_name || sessionModelCache.get(filename) || 'gpt-6-astra';
      const modelInfo = resolveModelInfo(rawModel, 'Codex');
      const dateStr = getLocalDateStr(obj.timestamp);

      return {
        provider: 'Codex',
        model: modelInfo.name,
        rawModel,
        costPer1k: modelInfo.costPer1k,
        inputTokens: inp,
        outputTokens: out,
        reasoningTokens: reas,
        cachedTokens: cach,
        totalTokens: total,
        timestamp: obj.timestamp || new Date().toISOString(),
        dateStr,
        file: filename
      };
    }
  } catch (e) {}
  return null;
}

function parseClaudeLine(line) {
  if (!line.trim() || (!line.includes('usage') && !line.includes('input_tokens'))) return null;
  try {
    const obj = JSON.parse(line);
    const usage = obj.usage || obj.payload?.usage || obj.message?.usage;
    if (usage && (usage.input_tokens || usage.output_tokens)) {
      const inp = usage.input_tokens || 0;
      const out = usage.output_tokens || 0;
      const cr = usage.cache_read_input_tokens || 0;
      const total = inp + out + cr;
      if (total === 0) return null;

      const rawModel = obj.model || obj.message?.model || 'claude-opus-5';
      const modelInfo = resolveModelInfo(rawModel, 'ClaudeCowork');
      const dateStr = getLocalDateStr(obj.timestamp);

      return {
        provider: 'ClaudeCowork',
        model: modelInfo.name,
        rawModel,
        costPer1k: modelInfo.costPer1k,
        inputTokens: inp,
        outputTokens: out,
        cachedTokens: cr,
        totalTokens: total,
        timestamp: obj.timestamp || new Date().toISOString(),
        dateStr
      };
    }
  } catch (e) {}
  return null;
}

function parseAntigravityLine(line) {
  if (!line.trim() || (!line.includes('PLANNER_RESPONSE') && !line.includes('USER_INPUT'))) return null;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'PLANNER_RESPONSE') {
      const chars = (obj.content || '').length + JSON.stringify(obj.tool_calls || []).length;
      if (chars > 0) {
        const estTokens = Math.round(chars / 3.5);
        const dateStr = getLocalDateStr(obj.timestamp);
        const modelInfo = resolveModelInfo('gemini-3.0', 'Antigravity');
        return {
          provider: 'Antigravity',
          model: modelInfo.name,
          rawModel: 'gemini-3.0',
          costPer1k: modelInfo.costPer1k,
          totalTokens: estTokens,
          outputTokens: estTokens,
          timestamp: obj.timestamp || new Date().toISOString(),
          dateStr
        };
      }
    }
  } catch (e) {}
  return null;
}

function addAggregatedStats(dateStr, provider, modelName, tokens, costPer1k = 0.01) {
  if (!dailyMap[dateStr]) {
    dailyMap[dateStr] = {
      date: dateStr,
      ClaudeCowork: 0,
      Codex: 0,
      Antigravity: 0,
      total: 0,
      costUSD: 0
    };
  }
  dailyMap[dateStr][provider] += tokens;
  dailyMap[dateStr].total += tokens;
  dailyMap[dateStr].costUSD += (tokens / 1000) * costPer1k;

  if (!subModelStatsMap[modelName]) {
    subModelStatsMap[modelName] = {
      modelName,
      provider,
      totalTokens: 0,
      callCount: 0,
      costPer1k
    };
  }
  subModelStatsMap[modelName].totalTokens += tokens;
  subModelStatsMap[modelName].callCount += 1;
}

// ⚡ Superfast Incremental Scanner with Caching
function scanAllHistoricalData() {
  const t0 = Date.now();
  console.log('🔄 Indexing historical sessions with persistent cache...');
  dailyMap = {};
  subModelStatsMap = {};
  loadPersistentCache();

  let cachedHitCount = 0;
  let newFileParsedCount = 0;

  function processFileWithCache(filePath, provider, parseFn) {
    try {
      const stat = fs.statSync(filePath);
      fileOffsets.set(filePath, stat.size);

      const cached = fileCache[filePath];
      if (cached && cached.mtime === stat.mtimeMs && cached.size === stat.size) {
        // Fast Cache Hit! Replay cached aggregates
        for (const [dStr, dData] of Object.entries(cached.daily || {})) {
          addAggregatedStats(dStr, provider, dData.model || 'Unknown', dData.tokens || 0, dData.costPer1k || 0.01);
        }
        cachedHitCount++;
        return;
      }

      // Cache Miss / File Changed: Parse fresh
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const fileDaily = {};

      for (const l of lines) {
        const res = parseFn(l, path.basename(filePath));
        if (res) {
          addAggregatedStats(res.dateStr, provider, res.model, res.totalTokens, res.costPer1k);
          if (!fileDaily[res.dateStr]) {
            fileDaily[res.dateStr] = { tokens: 0, model: res.model, costPer1k: res.costPer1k };
          }
          fileDaily[res.dateStr].tokens += res.totalTokens;
        }
      }

      fileCache[filePath] = {
        mtime: stat.mtimeMs,
        size: stat.size,
        daily: fileDaily
      };
      newFileParsedCount++;
    } catch (e) {}
  }

  // 1. Scan Codex
  CODEX_DIRS.forEach(dir => {
    function walkCodex(d) {
      try {
        for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, ent.name);
          if (ent.isDirectory()) {
            if (!IGNORED_SUBDIRS.has(ent.name)) walkCodex(full);
          } else if (ent.name.endsWith('.jsonl')) {
            processFileWithCache(full, 'Codex', parseCodexLine);
          }
        }
      } catch (e) {}
    }
    walkCodex(dir);
  });

  // 2. Scan Claude (Excluding audit.jsonl internal telemetry)
  CLAUDE_DIRS.forEach(dir => {
    function walkClaude(d) {
      try {
        for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, ent.name);
          if (ent.isDirectory()) {
            if (!IGNORED_SUBDIRS.has(ent.name)) walkClaude(full);
          } else if (ent.name.endsWith('.jsonl') && !ent.name.startsWith('audit')) {
            processFileWithCache(full, 'ClaudeCowork', parseClaudeLine);
          }
        }
      } catch (e) {}
    }
    walkClaude(dir);
  });

  // 3. Scan Antigravity
  if (fs.existsSync(ANTIGRAVITY_DIR)) {
    function walkAntigravity(d) {
      try {
        for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, ent.name);
          if (ent.isDirectory()) walkAntigravity(full);
          else if (ent.name === 'transcript.jsonl') {
            processFileWithCache(full, 'Antigravity', parseAntigravityLine);
          }
        }
      } catch (e) {}
    }
    walkAntigravity(ANTIGRAVITY_DIR);
  }

  savePersistentCacheDebounced();
  console.log(`✅ Indexed in ${Date.now() - t0}ms (${cachedHitCount} cached, ${newFileParsedCount} parsed) -> ${Object.keys(dailyMap).length} active days & ${Object.keys(subModelStatsMap).length} models!`);
}

// 💰 Budget Calculation Helper
function calculateCurrentBudget() {
  const today = getLocalDateStr();
  const currentMonthPrefix = today.slice(0, 7); // e.g. "2026-09"

  let todaySpentUSD = 0;
  let monthSpentUSD = 0;

  for (const [date, data] of Object.entries(dailyMap)) {
    const cost = data.costUSD || 0;
    if (date === today) todaySpentUSD += cost;
    if (date.startsWith(currentMonthPrefix)) monthSpentUSD += cost;
  }

  const dailyPercent = DAILY_BUDGET_USD > 0 ? (todaySpentUSD / DAILY_BUDGET_USD) * 100 : 0;
  const monthlyPercent = MONTHLY_BUDGET_USD > 0 ? (monthSpentUSD / MONTHLY_BUDGET_USD) * 100 : 0;

  let alertLevel = 'normal';
  let alertMessage = '';

  if (dailyPercent >= 100 || monthlyPercent >= 100) {
    alertLevel = 'critical';
    alertMessage = `🚨 เกินงบประมาณแล้ว! (วันนี้: ${dailyPercent.toFixed(1)}% | เดือนนี้: ${monthlyPercent.toFixed(1)}%)`;
  } else if (dailyPercent >= ALERT_THRESHOLD_PERCENT || monthlyPercent >= ALERT_THRESHOLD_PERCENT) {
    alertLevel = 'warning';
    alertMessage = `⚠️ การใช้งานใกล้ถึงโควตางบประมาณ (วันนี้: ${dailyPercent.toFixed(1)}% | เดือนนี้: ${monthlyPercent.toFixed(1)}%)`;
  }

  return {
    daily: {
      budgetUSD: DAILY_BUDGET_USD,
      spentUSD: parseFloat(todaySpentUSD.toFixed(4)),
      spentTHB: parseFloat((todaySpentUSD * EXCHANGE_RATE_THB).toFixed(2)),
      percent: parseFloat(dailyPercent.toFixed(1)),
      remainingUSD: parseFloat(Math.max(0, DAILY_BUDGET_USD - todaySpentUSD).toFixed(4))
    },
    monthly: {
      budgetUSD: MONTHLY_BUDGET_USD,
      spentUSD: parseFloat(monthSpentUSD.toFixed(4)),
      spentTHB: parseFloat((monthSpentUSD * EXCHANGE_RATE_THB).toFixed(2)),
      percent: parseFloat(monthlyPercent.toFixed(1)),
      remainingUSD: parseFloat(Math.max(0, MONTHLY_BUDGET_USD - monthSpentUSD).toFixed(4))
    },
    exchangeRateTHB: EXCHANGE_RATE_THB,
    alertThresholdPercent: ALERT_THRESHOLD_PERCENT,
    alertLevel,
    alertMessage
  };
}

let lastAlertEmittedLevel = 'normal';

function broadcastLiveEvent(evt) {
  recentLiveEvents.unshift(evt);
  if (recentLiveEvents.length > 50) recentLiveEvents.pop();

  addAggregatedStats(evt.dateStr, evt.provider, evt.model, evt.totalTokens, evt.costPer1k);

  console.log(`⚡ [LIVE EVENT] ${evt.provider} (${evt.model}): +${evt.totalTokens.toLocaleString()} tokens`);

  const payload = `data: ${JSON.stringify(evt)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (e) {
      clients.delete(client);
    }
  }

  // Check Budget Alerts after Live Event
  const budget = calculateCurrentBudget();
  if (budget.alertLevel !== 'normal' && budget.alertLevel !== lastAlertEmittedLevel) {
    lastAlertEmittedLevel = budget.alertLevel;
    const alertPayload = `data: ${JSON.stringify({ type: 'BUDGET_ALERT', ...budget })}\n\n`;
    for (const client of clients) {
      try {
        client.write(alertPayload);
      } catch (e) {
        clients.delete(client);
      }
    }
  }
}

function watchFileIncremental(filePath, provider) {
  try {
    const stat = fs.statSync(filePath);
    const prevSize = fileOffsets.get(filePath) || 0;
    if (stat.size <= prevSize) return;

    const fd = fs.openSync(filePath, 'r');
    const bytesToRead = stat.size - prevSize;
    const buffer = Buffer.alloc(bytesToRead);
    fs.readSync(fd, buffer, 0, bytesToRead, prevSize);
    fs.closeSync(fd);
    fileOffsets.set(filePath, stat.size);

    const newContent = buffer.toString('utf8');
    const lines = newContent.split('\n');
    for (const l of lines) {
      if (!l.trim()) continue;
      let parsed = null;
      if (provider === 'Codex') parsed = parseCodexLine(l, path.basename(filePath));
      else if (provider === 'ClaudeCowork') parsed = parseClaudeLine(l);
      else if (provider === 'Antigravity') parsed = parseAntigravityLine(l);

      if (parsed) {
        broadcastLiveEvent(parsed);
      }
    }
  } catch (e) {}
}

function setupDirectoryWatchers() {
  CODEX_DIRS.forEach(dir => {
    try {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.jsonl')) return;
        const full = path.join(dir, filename);
        if (fs.existsSync(full)) watchFileIncremental(full, 'Codex');
      });
    } catch (e) {}
  });

  CLAUDE_DIRS.forEach(dir => {
    try {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.jsonl') || filename.includes('audit')) return;
        const full = path.join(dir, filename);
        if (fs.existsSync(full)) watchFileIncremental(full, 'ClaudeCowork');
      });
    } catch (e) {}
  });

  if (fs.existsSync(ANTIGRAVITY_DIR)) {
    try {
      fs.watch(ANTIGRAVITY_DIR, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('transcript.jsonl')) return;
        const full = path.join(ANTIGRAVITY_DIR, filename);
        if (fs.existsSync(full)) watchFileIncremental(full, 'Antigravity');
      });
    } catch (e) {}
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/tokens/history') {
    const sorted = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: sorted.length, data: sorted, models: Object.values(subModelStatsMap) }));
    return;
  }

  if (url.pathname === '/api/tokens/models') {
    const modelsList = Object.values(subModelStatsMap).sort((a, b) => b.totalTokens - a.totalTokens);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: modelsList.length, data: modelsList }));
    return;
  }

  if (url.pathname === '/api/budget') {
    const budgetData = calculateCurrentBudget();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, ...budgetData }));
    return;
  }

  if (url.pathname === '/api/tokens/live') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time token stream connected!' })}\n\n`);
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      port: PORT,
      platform: os.platform(),
      clientsConnected: clients.size,
      totalDays: Object.keys(dailyMap).length,
      subModelsTracked: Object.keys(subModelStatsMap).length,
      budget: calculateCurrentBudget(),
      recentEvents: recentLiveEvents.slice(0, 5)
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const list = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        list.push({ interface: name, ip: net.address });
      }
    }
  }
  return list;
}

function startServer(portToTry) {
  server.listen(portToTry, '0.0.0.0', () => {
    PORT = portToTry;
    const ips = getLocalIPs();
    console.log(`🚀 Real-Time Token Server is running at http://localhost:${PORT}`);
    console.log(`📡 SSE Stream: http://localhost:${PORT}/api/tokens/live`);
    if (ips.length > 0) {
      console.log('🌐 LAN Access URLs:');
      ips.forEach(n => console.log(`   - http://${n.ip}:${PORT} (${n.interface})`));
    }
    try {
      const portFilePath = path.join(__dirname, '.active-port.json');
      fs.writeFileSync(portFilePath, JSON.stringify({ port: PORT, startedAt: new Date().toISOString() }), 'utf8');
    } catch (e) {}
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
      setTimeout(() => {
        startServer(portToTry + 1);
      }, 500);
    } else {
      console.error('Server error:', err);
    }
  });
}

scanAllHistoricalData();
setupDirectoryWatchers();
startServer(PORT);
