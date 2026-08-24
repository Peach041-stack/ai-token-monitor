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
const clients = new Set();

// Dynamic OS-safe Paths
const CODEX_DIR = process.env.CODEX_LOG_DIR || path.join(os.homedir(), '.codex', 'sessions');
const CLAUDE_DIR = process.env.CLAUDE_LOG_DIR || path.join(os.homedir(), '.claude', 'projects');
const ANTIGRAVITY_DIR = process.env.ANTIGRAVITY_LOG_DIR || path.join(os.homedir(), '.gemini', 'antigravity', 'brain');


console.log('----------------------------------------------------');
console.log('🤖 AI Token Real-Time Bridge Server Starting...');
console.log('📁 Watching Codex:', CODEX_DIR);
console.log('📁 Watching Claude:', CLAUDE_DIR);
console.log('📁 Watching Antigravity:', ANTIGRAVITY_DIR);
console.log('----------------------------------------------------');

let dailyMap = {};
let subModelStatsMap = {}; // สถิติแยกตามชื่อโมเดลย่อยละเอียด (e.g. GPT-5.6, Claude Opus 5, Gemini 2.5)
let recentLiveEvents = [];
const fileOffsets = new Map();
const sessionModelCache = new Map(); // เก็บ mapping sessionId -> active model name

// Normalize ชื่อโมเดลให้อ่านง่าย
function normalizeModelName(rawModel, provider) {
  if (!rawModel) return provider === 'Codex' ? 'GPT-5.6' : provider === 'ClaudeCowork' ? 'Claude 3.7 Sonnet' : 'Gemini 2.5 Flash';
  const m = rawModel.toLowerCase();
  if (m.includes('gpt-5.6')) return 'GPT-5.6';
  if (m.includes('gpt-5.5')) return 'GPT-5.5';
  if (m.includes('gpt-5.4')) return 'GPT-5.4';
  if (m.includes('gpt-5')) return 'GPT-5';
  if (m.includes('gpt-4o-mini')) return 'GPT-4o Mini';
  if (m.includes('gpt-4o')) return 'GPT-4o';
  if (m.includes('o3-mini')) return 'o3-mini';
  if (m.includes('o3')) return 'o3';
  if (m.includes('opus-5')) return 'Claude Opus 5';
  if (m.includes('opus-4')) return 'Claude Opus 4.8';
  if (m.includes('fable-5')) return 'Claude Fable 5';
  if (m.includes('3-7-sonnet')) return 'Claude 3.7 Sonnet';
  if (m.includes('3-5-sonnet')) return 'Claude 3.5 Sonnet';
  if (m.includes('3-5-haiku')) return 'Claude 3.5 Haiku';
  if (m.includes('gemini-3.0')) return 'Gemini 3.0 Flash';
  if (m.includes('gemini-2.5-pro')) return 'Gemini 2.5 Pro';
  if (m.includes('gemini-2.5-flash')) return 'Gemini 2.5 Flash';
  if (m.includes('antigravity')) return 'Antigravity (Gemini)';
  return rawModel;
}

function parseCodexLine(line, filename = '') {
  if (!line.trim()) return null;
  try {
    const obj = JSON.parse(line);

    // ตรวจหา Model จาก session_meta, world_state, หรือ turn_context
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

      const rawModel = info.model || info.model_name || sessionModelCache.get(filename) || 'gpt-5.6';
      const cleanModel = normalizeModelName(rawModel, 'Codex');
      const dateStr = (obj.timestamp ? new Date(obj.timestamp) : new Date()).toISOString().split('T')[0];

      return {
        provider: 'Codex',
        model: cleanModel,
        rawModel,
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
      const cleanModel = normalizeModelName(rawModel, 'ClaudeCowork');
      const dateStr = (obj.timestamp ? new Date(obj.timestamp) : new Date()).toISOString().split('T')[0];

      return {
        provider: 'ClaudeCowork',
        model: cleanModel,
        rawModel,
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
        const dateStr = (obj.timestamp ? new Date(obj.timestamp) : new Date()).toISOString().split('T')[0];
        const cleanModel = 'Gemini 3.0 Flash / Pro';
        return {
          provider: 'Antigravity',
          model: cleanModel,
          rawModel: 'gemini-3.0',
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

function scanAllHistoricalData() {
  console.log('🔄 Indexing historical sessions and sub-models...');
  dailyMap = {};
  subModelStatsMap = {};

  function addStats(dateStr, provider, modelName, tokens) {
    // 1. Daily Map
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = {
        date: dateStr,
        ClaudeCowork: 0,
        Codex: 0,
        Antigravity: 0,
        total: 0
      };
    }
    dailyMap[dateStr][provider] += tokens;
    dailyMap[dateStr].total += tokens;

    // 2. Sub-Model Stats Map
    if (!subModelStatsMap[modelName]) {
      subModelStatsMap[modelName] = {
        modelName,
        provider,
        totalTokens: 0,
        callCount: 0
      };
    }
    subModelStatsMap[modelName].totalTokens += tokens;
    subModelStatsMap[modelName].callCount += 1;
  }

  // 1. Scan Codex
  if (fs.existsSync(CODEX_DIR)) {
    function walkCodex(dir) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) walkCodex(full);
          else if (ent.name.endsWith('.jsonl')) {
            try {
              const content = fs.readFileSync(full, 'utf8');
              fileOffsets.set(full, Buffer.byteLength(content, 'utf8'));
              const lines = content.split('\n');
              for (const l of lines) {
                const res = parseCodexLine(l, ent.name);
                if (res) addStats(res.dateStr, 'Codex', res.model, res.totalTokens);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
    walkCodex(CODEX_DIR);
  }

  // 2. Scan Claude
  if (fs.existsSync(CLAUDE_DIR)) {
    function walkClaude(dir) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) walkClaude(full);
          else if (ent.name.endsWith('.jsonl')) {
            try {
              const content = fs.readFileSync(full, 'utf8');
              fileOffsets.set(full, Buffer.byteLength(content, 'utf8'));
              const lines = content.split('\n');
              for (const l of lines) {
                const res = parseClaudeLine(l);
                if (res) addStats(res.dateStr, 'ClaudeCowork', res.model, res.totalTokens);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
    walkClaude(CLAUDE_DIR);
  }

  // 3. Scan Antigravity
  if (fs.existsSync(ANTIGRAVITY_DIR)) {
    function walkAntigravity(dir) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) walkAntigravity(full);
          else if (ent.name === 'transcript.jsonl') {
            try {
              const content = fs.readFileSync(full, 'utf8');
              fileOffsets.set(full, Buffer.byteLength(content, 'utf8'));
              const lines = content.split('\n');
              for (const l of lines) {
                const res = parseAntigravityLine(l);
                if (res) addStats(res.dateStr, 'Antigravity', res.model, res.totalTokens);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
    walkAntigravity(ANTIGRAVITY_DIR);
  }

  console.log(`✅ Indexed ${Object.keys(dailyMap).length} active days & ${Object.keys(subModelStatsMap).length} unique sub-models!`);
}

function broadcastLiveEvent(evt) {
  recentLiveEvents.unshift(evt);
  if (recentLiveEvents.length > 50) recentLiveEvents.pop();

  const today = new Date().toISOString().split('T')[0];
  if (!dailyMap[today]) {
    dailyMap[today] = { date: today, ClaudeCowork: 0, Codex: 0, Antigravity: 0, total: 0 };
  }
  dailyMap[today][evt.provider] = (dailyMap[today][evt.provider] || 0) + evt.totalTokens;
  dailyMap[today].total += evt.totalTokens;

  if (!subModelStatsMap[evt.model]) {
    subModelStatsMap[evt.model] = { modelName: evt.model, provider: evt.provider, totalTokens: 0, callCount: 0 };
  }
  subModelStatsMap[evt.model].totalTokens += evt.totalTokens;
  subModelStatsMap[evt.model].callCount += 1;

  console.log(`⚡ [LIVE EVENT] ${evt.provider} (${evt.model}): +${evt.totalTokens.toLocaleString()} tokens`);

  const payload = `data: ${JSON.stringify(evt)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (e) {
      clients.delete(client);
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
  if (fs.existsSync(CODEX_DIR)) {
    try {
      fs.watch(CODEX_DIR, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.jsonl')) return;
        const full = path.join(CODEX_DIR, filename);
        if (fs.existsSync(full)) watchFileIncremental(full, 'Codex');
      });
    } catch (e) {}
  }

  if (fs.existsSync(CLAUDE_DIR)) {
    try {
      fs.watch(CLAUDE_DIR, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.jsonl')) return;
        const full = path.join(CLAUDE_DIR, filename);
        if (fs.existsSync(full)) watchFileIncremental(full, 'ClaudeCowork');
      });
    } catch (e) {}
  }

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
      clientsConnected: clients.size,
      totalDays: Object.keys(dailyMap).length,
      subModelsTracked: Object.keys(subModelStatsMap).length,
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

