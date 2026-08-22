import React, { useState, useEffect, useRef } from 'react';
import { MODEL_CONFIGS, formatTokens } from '../utils/mockDataGenerator';
import { 
  Play, 
  Pause, 
  Zap, 
  Activity, 
  Terminal, 
  RotateCcw,
  Sparkles,
  Radio
} from 'lucide-react';

export default function LiveTokenStream({ onNewLiveTokens, externalLiveEvents = [], isRealMode = false }) {
  const [isLive, setIsLive] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);
  const [tokensPerSecond, setTokensPerSecond] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  
  const tokenCountRef = useRef(0);
  const secondTokensRef = useRef(0);

  // ผสานเหตุการณ์จริงเมื่อมี real events เข้ามา
  useEffect(() => {
    if (isRealMode && externalLiveEvents && externalLiveEvents.length > 0) {
      setLiveEvents(externalLiveEvents);
      const latest = externalLiveEvents[0];
      if (latest) {
        secondTokensRef.current += (latest.totalTokens || 0);
        setSessionTotal((prev) => prev + (latest.totalTokens || 0));
      }
    }
  }, [isRealMode, externalLiveEvents]);

  // หากอยู่ในโหมด Demo หรือไม่มี real events ให้รัน Simulation
  useEffect(() => {
    if (isRealMode) {
      // Timer สำหรับคำนวณ TPS ในโหมดจริง
      const tpsInterval = setInterval(() => {
        setTokensPerSecond(Math.round(secondTokensRef.current));
        secondTokensRef.current = 0;
      }, 1000);
      return () => clearInterval(tpsInterval);
    }

    if (!isLive) return;

    const sampleTasks = [
      'Refactoring React component state',
      'Generating SQL query optimization',
      'Explaining neural network backprop',
      'Debugging async/await deadlock',
      'Writing unit tests for authentication',
      'Summarizing API documentation',
      'Analyzing TypeScript compiler errors'
    ];

    const models = ['ClaudeCowork', 'Codex', 'Antigravity'];

    const interval = setInterval(() => {
      const model = models[Math.floor(Math.random() * models.length)];
      const promptTokens = Math.floor(Math.random() * 280 + 50);
      const completionTokens = Math.floor(Math.random() * 450 + 120);
      const totalEventTokens = promptTokens + completionTokens;
      const latency = (Math.random() * 1.8 + 0.4).toFixed(2);
      const task = sampleTasks[Math.floor(Math.random() * sampleTasks.length)];

      const newEvent = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString('th-TH', { hour12: false }),
        model,
        task,
        promptTokens,
        completionTokens,
        totalTokens: totalEventTokens,
        latency: `${latency}s`
      };

      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
      setSessionTotal((prev) => prev + totalEventTokens);
      
      secondTokensRef.current += totalEventTokens;
      tokenCountRef.current += totalEventTokens;

      if (onNewLiveTokens) {
        onNewLiveTokens(model, totalEventTokens);
      }
    }, 2000);

    const tpsInterval = setInterval(() => {
      setTokensPerSecond(Math.round(secondTokensRef.current));
      secondTokensRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(tpsInterval);
    };
  }, [isLive, isRealMode, onNewLiveTokens]);

  const clearLogs = () => {
    setLiveEvents([]);
    setSessionTotal(0);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      
      {/* ส่วนหัว Live Monitor */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>ถ่ายทอดสดการตรวจจับ Token (Live Monitor)</span>
              {isRealMode && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-normal">
                  REAL SESSIONS
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isRealMode
                ? 'ดักฟัง Prompt/Response สดจาก Codex GUI, CLI, Antigravity, Claude'
                : 'จำลอง Stream การส่ง/รับ Token แบบ Real-time'}
            </p>
          </div>
        </div>

        {/* ควบคุม Play/Pause & Reset */}
        <div className="flex items-center gap-2">
          {!isRealMode && (
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isLive
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLive ? 'หยุดชั่วคราว' : 'เริ่มสตรีม'}</span>
            </button>
          )}

          <button
            onClick={clearLogs}
            title="ล้างประวัติสด"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* แถบสถิติย่อของ Live Stream */}
      <div className="grid grid-cols-2 gap-3 my-3">
        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> อัตราความเร็ว (TPS)
          </span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {tokensPerSecond} <span className="text-xs text-slate-400 font-normal">t/s</span>
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> ตรวจพบล่าสุดในเซสชันนี้
          </span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {sessionTotal.toLocaleString('th-TH')} <span className="text-xs text-slate-400 font-normal">Token</span>
          </p>
        </div>
      </div>

      {/* รายการเหตุการณ์ล่าสุด (Live Logs Console) */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-slate-400" /> เหตุการณ์เรียลไทม์ล่าสุด
          </span>
          <span className="text-[10px] text-slate-500 font-normal">
            (ยิง Prompt ใน Codex แล้วสังเกตการขยับที่นี่ได้ทันที)
          </span>
        </span>

        <div className="h-44 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700">
          {liveEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-xs space-y-1">
              <span>กำลังรอ Event ข้อมูล Token จาก Codex / AI...</span>
              <span className="text-[10px] text-slate-600 font-sans">
                (เมื่อคุณ Prompt คำถามใน Codex GUI หรือ CLI ตัวเลขจะเด้งขึ้นทันที)
              </span>
            </div>
          ) : (
            liveEvents.map((evt) => {
              const cfg = MODEL_CONFIGS[evt.model] || { color: '#10b981' };
              return (
                <div
                  key={evt.id}
                  className="bg-slate-950/80 border border-slate-800/60 p-2 rounded-lg flex items-center justify-between gap-2 hover:border-slate-700 transition-all text-[11px]"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-slate-500 shrink-0 text-[10px]">{evt.time}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {evt.model}
                    </span>
                    <span className="text-slate-300 truncate max-w-[140px] md:max-w-[200px]" title={evt.task}>
                      {evt.task}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    <span className="text-emerald-400 font-bold">
                      +{evt.totalTokens.toLocaleString('th-TH')} <span className="text-[9px] text-slate-500">t</span>
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {evt.latency}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
