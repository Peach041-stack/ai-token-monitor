import React from 'react';
import { MODEL_CONFIGS, formatTokens, estimateCost } from '../utils/mockDataGenerator';
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Cpu, 
  Award,
  Activity,
  Flame,
  Radio
} from 'lucide-react';

export default function KPICards({ chartData, visibleModels }) {
  // คำนวณยอดรวมแต่ละโมเดล
  const totals = {
    ClaudeCowork: 0,
    Codex: 0,
    Antigravity: 0,
    grandTotal: 0
  };

  chartData.forEach((row) => {
    if (visibleModels.ClaudeCowork) totals.ClaudeCowork += (row.ClaudeCowork || 0);
    if (visibleModels.Codex) totals.Codex += (row.Codex || 0);
    if (visibleModels.Antigravity) totals.Antigravity += (row.Antigravity || 0);
  });

  totals.grandTotal = totals.ClaudeCowork + totals.Codex + totals.Antigravity;

  // หาข้อมูลของ "วันนี้"
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRow = chartData.find((r) => r.date === todayStr) || chartData[chartData.length - 1] || {};
  const todayClaude = visibleModels.ClaudeCowork ? (todayRow.ClaudeCowork || 0) : 0;
  const todayCodex = visibleModels.Codex ? (todayRow.Codex || 0) : 0;
  const todayAnti = visibleModels.Antigravity ? (todayRow.Antigravity || 0) : 0;
  const todayTotal = todayClaude + todayCodex + todayAnti;

  // หาโมเดลที่ใช้งานสูงสุด
  const modelStats = [
    { key: 'ClaudeCowork', name: 'ClaudeCowork', val: totals.ClaudeCowork, color: MODEL_CONFIGS.ClaudeCowork.color },
    { key: 'Codex', name: 'Codex', val: totals.Codex, color: MODEL_CONFIGS.Codex.color },
    { key: 'Antigravity', name: 'Antigravity', val: totals.Antigravity, color: MODEL_CONFIGS.Antigravity.color },
  ].filter(m => visibleModels[m.key]);

  const topModel = modelStats.length > 0 
    ? modelStats.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), modelStats[0])
    : null;

  // ค่าใช้จ่ายประเมิน
  const cost = estimateCost(totals);

  return (
    <div className="space-y-4">
      {/* การ์ดสถิติภาพรวม 4 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: ยอดรวม Token ทั้งหมด (แสดง 3 หลักทศนิยมชัดเจน + เลขเต็ม) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ยอดรวม Token สะสมทั้งหมด
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-2">
              <span>{formatTokens(totals.grandTotal)}</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 font-mono font-medium">
              {totals.grandTotal.toLocaleString('th-TH')} <span className="text-slate-400 font-sans">Tokens</span>
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>นับเฉพาะโมเดลที่เลือกแสดงผล</span>
          </div>
        </div>

        {/* Card 2: ยอดใช้งานของ "วันนี้" (Active Today) - เด้งสดทุกครั้งที่ Prompt! */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-emerald-900/50 p-5 shadow-xl backdrop-blur-md transition-all hover:border-emerald-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ยอดใช้งานวันนี้ (Today)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight animate-pulse">
              {formatTokens(todayTotal)}
            </div>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              {todayTotal.toLocaleString('th-TH')} Tokens วันนี้
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400/90 font-medium">
            <Radio className="w-3.5 h-3.5 animate-spin" />
            <span>อัปเดตสดทันทีเมื่อ Prompt</span>
          </div>
        </div>

        {/* Card 3: โมเดลที่มีการใช้งานสูงสุด */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              โมเดลที่ใช้สูงสุด
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {topModel ? (
                <>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: topModel.color }}
                  />
                  <span>{topModel.name}</span>
                </>
              ) : (
                'ไม่มีข้อมูล'
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {topModel && totals.grandTotal > 0
                ? `${((topModel.val / totals.grandTotal) * 100).toFixed(1)}% ของปริมาณทั้งหมด`
                : 'ไม่ได้เลือกโมเดล'}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-amber-300/80">
            <Cpu className="w-3.5 h-3.5" />
            <span>{topModel ? `${formatTokens(topModel.val)} Tokens` : '-'}</span>
          </div>
        </div>

        {/* Card 4: ค่าใช้จ่ายประเมิน (USD & THB) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ประมาณการค่าใช้จ่าย
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              ${cost.usd.toFixed(2)}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              ≈ ฿{cost.thb.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span>คำนวณตามมาตรฐาน API Rates</span>
          </div>
        </div>

      </div>

      {/* แถบย่อยแสดงรายละเอียดของทั้ง 3 โมเดลแบบการ์ดเฉพาะตัว */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(MODEL_CONFIGS).map(([key, config]) => {
          const isVisible = visibleModels[key];
          const tokenCount = totals[key] || 0;
          const percentage = totals.grandTotal > 0 ? ((tokenCount / totals.grandTotal) * 100).toFixed(1) : '0';

          return (
            <div
              key={key}
              className={`rounded-xl border p-4 transition-all duration-300 backdrop-blur-sm ${
                isVisible
                  ? 'bg-slate-900/80 border-slate-800 shadow-md'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-40 grayscale'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.iconText}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{config.name}</h4>
                    <span className="text-[11px] text-slate-400">{config.provider}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${config.bgBadge}`}>
                  {percentage}%
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-slate-800/80 pt-2.5">
                <span className="text-xs text-slate-400">Tokens สะสม:</span>
                <span className="font-mono font-bold text-slate-100 text-base">
                  {tokenCount.toLocaleString('th-TH')}
                </span>
              </div>

              {/* Progress bar แสดงสัดส่วน */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${isVisible ? percentage : 0}%`,
                    backgroundColor: config.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
