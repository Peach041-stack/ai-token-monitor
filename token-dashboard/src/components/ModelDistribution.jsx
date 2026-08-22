import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { MODEL_CONFIGS, formatTokens, estimateCost } from '../utils/mockDataGenerator';
import { PieChart as PieIcon } from 'lucide-react';

export default function ModelDistribution({ chartData, visibleModels }) {
  const totals = {
    ClaudeCowork: 0,
    Codex: 0,
    Antigravity: 0
  };

  chartData.forEach((row) => {
    if (visibleModels.ClaudeCowork) totals.ClaudeCowork += (row.ClaudeCowork || 0);
    if (visibleModels.Codex) totals.Codex += (row.Codex || 0);
    if (visibleModels.Antigravity) totals.Antigravity += (row.Antigravity || 0);
  });

  const grandTotal = totals.ClaudeCowork + totals.Codex + totals.Antigravity;

  const pieData = Object.entries(MODEL_CONFIGS)
    .filter(([key]) => visibleModels[key])
    .map(([key, config]) => ({
      name: config.name,
      value: totals[key] || 0,
      color: config.color,
      cost: ((totals[key] || 0) / 1000) * config.costPer1k
    }));

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = grandTotal > 0 ? ((data.value / grandTotal) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span className="font-bold">{data.name}</span>
          </div>
          <div className="space-y-1 font-mono text-slate-300">
            <p>ปริมาณ: {data.value.toLocaleString('th-TH')} Tokens ({percent}%)</p>
            <p className="text-emerald-400">ประมาณการ: ${data.payload.cost.toFixed(2)} USD</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      <div className="border-b border-slate-800/80 pb-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-purple-400" />
          <span>สัดส่วนการใช้งานแต่ละโมเดล (Distribution)</span>
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">
          เปรียบเทียบสัดส่วน Token และงบประมาณ
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
        {/* Donut Chart */}
        <div className="w-48 h-48 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] text-slate-400 font-medium">รวมทั้งหมด</span>
            <span className="text-sm font-bold text-white font-mono">{formatTokens(grandTotal)}</span>
          </div>
        </div>

        {/* รายการแสดงข้อมูลด้านข้าง */}
        <div className="space-y-3 flex-1 w-full">
          {pieData.map((item) => {
            const pct = grandTotal > 0 ? ((item.value / grandTotal) * 100).toFixed(1) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between text-xs bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="font-semibold text-slate-200">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.value.toLocaleString('th-TH')} Token</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-white text-sm">{pct}%</span>
                  <p className="text-[10px] text-emerald-400">${item.cost.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
