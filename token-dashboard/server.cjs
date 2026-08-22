const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3001;
const clients = new Set();

// Paths
const CODEX_DIR = path.join(os.homedir(), '.codex', 'sessions');
const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'projects');
const ANTIGRAVITY_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');

console.log('----------------------------------------------------');
console.log('🤖 AI Token Real-Time Bridge Server Starting...');
console.log('📁 Watching Codex:', CODEX_DIR);
console.log('📁 Watching Claude:', CLAUDE_DIR);
console.log('📁 Watching Antigravity:', ANTIGRAVITY_DIR);
console.log('----------------------------------------------------');

// Cache สำหรับเก็บ State และ Daily Aggregate
let dailyMap = {};
let recentLiveEvents = [];
const fileOffsets = new Map();

function parseCodexLine(line, filename = '') {
  if (!line.trim() || (!line.includes('token_usage') && !line.includes('token_count'))) return null;
  try {
    const obj = JSON.parse(line);
    const info = obj.payload?.info;
    if (info?.last_token_usage || info?.total_token_usage) {
      const last = info.last_token_usage || info.total_token_usage;
      const inp = last.input_tokens || 0;
      const out = last.output_tokens || 0;
      const reas = last.reasoning_output_tokens || 0;
      const cach = last.cached_input_tokens || 0;
      const total = inp + out + reas + cach;
      if (total === 0) return null;

      const dateStr = (obj.timestamp ? new Date(obj.timestamp) : new Date()).toISOString().split('T')[0];
      return {
        provider: 'Codex',
        model: info.model || info.model_name || 'Codex',
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

      const dateStr = (obj.timestamp ? new Date(obj.timestamp) : new Date()).toISOString().split('T')[0];
      return {
        provider: 'ClaudeCowork',
        model: obj.model || obj.message?.model || 'ClaudeCowork',
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
        return {
          provider: 'Antigravity',
          model: 'Antigravity (Gemini)',
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
  console.log('🔄 Indexing historical sessions...');
  dailyMap = {};

  function addDaily(dateStr, provider, tokens) {
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
  }

  // 1. Scan Codex
  if (fs.existsSync(CODEX_DIR)) {
    function walkCodex(dir) {
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
              if (res) addDaily(res.dateStr, 'Codex', res.totalTokens);
            }
          } catch (e) {}
        }
      }
    }
    walkCodex(CODEX_DIR);
  }

  // 2. Scan Claude
  if (fs.existsSync(CLAUDE_DIR)) {
    function walkClaude(dir) {
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
              if (res) addDaily(res.dateStr, 'ClaudeCowork', res.totalTokens);
            }
          } catch (e) {}
        }
      }
    }
    walkClaude(CLAUDE_DIR);
  }

  // 3. Scan Antigravity
  if (fs.existsSync(ANTIGRAVITY_DIR)) {
    function walkAntigravity(dir) {
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
              if (res) addDaily(res.dateStr, 'Antigravity', res.totalTokens);
            }
          } catch (e) {}
        }
      }
    }
    walkAntigravity(ANTIGRAVITY_DIR);
  }

  console.log(`✅ Indexed ${Object.keys(dailyMap).length} active days of usage!`);
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

  console.log(`⚡ [REAL-TIME TOKEN EVENT] ${evt.provider}: +${evt.totalTokens.toLocaleString()} tokens (${evt.model})`);

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
    res.end(JSON.stringify({ success: true, count: sorted.length, data: sorted }));
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
    res.end(JSON.stringify({ status: 'ok', clientsConnected: clients.size, totalDays: Object.keys(dailyMap).length }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

scanAllHistoricalData();
setupDirectoryWatchers();

server.listen(PORT, () => {
  console.log(`🚀 Real-Time Token Server is running at http://localhost:${PORT}`);
  console.log(`📡 SSE Stream: http://localhost:${PORT}/api/tokens/live`);
});
