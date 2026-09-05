import React from 'react';
import { formatTokens, MODEL_CONFIGS } from '../utils/mockDataGenerator';
import { Cpu, Layers, DollarSign, Sparkles } from 'lucide-react';

export default function SubModelBreakdown({ rawData, subModelsList = [] }) {
  // สถิติจาก Mock หรือ Real API
  const defaultSubModels = [
    { modelName: 'GPT-6 Astra', provider: 'Codex', totalTokens: 1450000000, costPer1k: 0.012 },
    { modelName: 'GPT-5.6', provider: 'Codex', totalTokens: 1171955576, costPer1k: 0.010 },
    { modelName: 'Claude Opus 5', provider: 'ClaudeCowork', totalTokens: 2839990000, costPer1k: 0.015 },
    { modelName: 'Claude Fable 5', provider: 'ClaudeCowork', totalTokens: 688794147, costPer1k: 0.015 },
    { modelName: 'Gemini 3.0 Flash / Pro', provider: 'Antigravity', totalTokens: 1338541, costPer1k: 0.008 }
  ];

  const modelsToDisplay = subModelsList && subModelsList.length > 0 ? subModelsList : defaultSubModels;
  const grandTotal = modelsToDisplay.reduce((acc, curr) => acc + (curr.totalTokens || 0), 0);

  const getProviderColor = (provider) => {
    if (provider === 'Codex' || provider?.includes('Codex')) return '#10b981';
    if (provider === 'ClaudeCowork' || provider?.includes('Claude')) return '#a855f7';
    return '#3b82f6';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-md space-y-4">
      
      {/* ส่วนหัว */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>🧩 จำแนกตามชื่อโมเดลย่อย (Sub-Model Breakdown)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ระบุเวอร์ชันและชื่อโมเดลเฉพาะเจาะจงที่ถูกเรียกใช้จริงในแต่ละเซสชัน (เช่น GPT-6 Astra, GPT-5.6, Claude Opus 5, Gemini)
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{modelsToDisplay.length} โมเดลที่ตรวจพบ</span>
        </div>
      </div>

      {/* Grid รายการโมเดลย่อย */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {modelsToDisplay.map((item, idx) => {
          const color = getProviderColor(item.provider);
          const percent = grandTotal > 0 ? ((item.totalTokens / grandTotal) * 100).toFixed(1) : '0';
          const rate = item.costPer1k || (item.provider === 'ClaudeCowork' ? 0.015 : item.provider === 'Codex' ? 0.010 : 0.008);
          const costUSD = (item.totalTokens / 1000) * rate;
          const isAstra = item.modelName?.toLowerCase().includes('astra');

          return (
            <div
              key={idx}
              className={`bg-slate-950/70 border rounded-xl p-4 transition-all hover:border-slate-700 space-y-2.5 shadow-sm ${
                isAstra ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-slate-950/70' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-wide">{item.modelName}</h4>
                      {isAstra && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          Astra
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">ค่าย: {item.provider}</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-200">
                  {percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/60">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${percent}%`, backgroundColor: color }}
                />
              </div>

              {/* Metrics ด้านล่าง */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900 font-mono">
                <span className="text-slate-400">
                  {item.totalTokens.toLocaleString('th-TH')} <span className="text-[10px] text-slate-500 font-sans">Token</span>
                </span>
                <span className="text-emerald-400 font-semibold">
                  ≈ ${costUSD.toFixed(2)} USD
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
