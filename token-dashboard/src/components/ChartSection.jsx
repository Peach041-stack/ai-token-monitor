import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { MODEL_CONFIGS, formatTokens } from '../utils/mockDataGenerator';

// Tooltip ภาษาไทยแบบกำหนดเอง (Custom Tooltip)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const totalTokens = payload.reduce((acc, curr) => acc + (curr.value || 0), 0);
    
    return (
      <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md min-w-[220px]">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2.5">
          <span className="text-xs font-bold text-slate-300">
            📅 {label}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {payload.length} โมเดล
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {payload.map((entry) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-200 font-medium">{entry.name}:</span>
              </span>
              <span className="font-mono font-semibold text-white">
                {entry.value.toLocaleString('th-TH')} Token
              </span>
            </div>
          ))}

          {payload.length > 1 && (
            <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between font-bold text-amber-400">
              <span>ยอดรวมทั้งหมด:</span>
              <span className="font-mono text-sm">
                {totalTokens.toLocaleString('th-TH')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Legend ภาษาไทยแบบกำหนดเอง
const CustomLegend = (props) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap items-center justify-end gap-4 pt-1 pb-3 text-xs">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ChartSection({ chartData, visibleModels, chartType, filterType }) {
  // ฟอร์แมตแกน Y ให้สั้นลง เช่น 50k, 1.2M
  const formatYAxis = (val) => formatTokens(val);

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-md space-y-4">
      
      {/* ส่วนหัวกราฟ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <span>📈 กราฟแสดงแนวโน้มการใช้งาน Token</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filterType === 'monthly' ? 'มุมมองรายเดือน' : filterType === 'custom' ? 'ช่วงเวลาที่กำหนด' : 'มุมมองรายวัน'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            แกน X: วันที่/เดือน | แกน Y: จำนวน Token ที่ใช้ (Tokens)
          </p>
        </div>
      </div>

      {/* กราฟ Recharts */}
      <div className="w-full h-[360px] md:h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          
          {/* 1. กราฟเส้น (Line Chart) */}
          {chartType === 'line' && (
            <LineChart data={chartData} margin={{ top: 15, right: 15, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="periodLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={formatYAxis}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} verticalAlign="top" />

              {visibleModels.ClaudeCowork && (
                <Line
                  type="monotone"
                  dataKey="ClaudeCowork"
                  name="ClaudeCowork"
                  stroke={MODEL_CONFIGS.ClaudeCowork.color}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: MODEL_CONFIGS.ClaudeCowork.color }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                />
              )}
              {visibleModels.Codex && (
                <Line
                  type="monotone"
                  dataKey="Codex"
                  name="Codex"
                  stroke={MODEL_CONFIGS.Codex.color}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: MODEL_CONFIGS.Codex.color }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                />
              )}
              {visibleModels.Antigravity && (
                <Line
                  type="monotone"
                  dataKey="Antigravity"
                  name="Antigravity"
                  stroke={MODEL_CONFIGS.Antigravity.color}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: MODEL_CONFIGS.Antigravity.color }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                />
              )}
            </LineChart>
          )}

          {/* 2. กราฟแท่ง (Bar Chart) */}
          {chartType === 'bar' && (
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="periodLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={formatYAxis}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} verticalAlign="top" />

              {visibleModels.ClaudeCowork && (
                <Bar
                  dataKey="ClaudeCowork"
                  name="ClaudeCowork"
                  fill={MODEL_CONFIGS.ClaudeCowork.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              )}
              {visibleModels.Codex && (
                <Bar
                  dataKey="Codex"
                  name="Codex"
                  fill={MODEL_CONFIGS.Codex.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              )}
              {visibleModels.Antigravity && (
                <Bar
                  dataKey="Antigravity"
                  name="Antigravity"
                  fill={MODEL_CONFIGS.Antigravity.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              )}
            </BarChart>
          )}

          {/* 3. กราฟพื้นที่สะสม (Stacked Area Chart) */}
          {chartType === 'area' && (
            <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 5, bottom: 25 }}>
              <defs>
                <linearGradient id="gradClaude" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={MODEL_CONFIGS.ClaudeCowork.color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={MODEL_CONFIGS.ClaudeCowork.color} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="gradCodex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={MODEL_CONFIGS.Codex.color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={MODEL_CONFIGS.Codex.color} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="gradAnti" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={MODEL_CONFIGS.Antigravity.color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={MODEL_CONFIGS.Antigravity.color} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="periodLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={formatYAxis}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} verticalAlign="top" />

              {visibleModels.ClaudeCowork && (
                <Area
                  type="monotone"
                  dataKey="ClaudeCowork"
                  name="ClaudeCowork"
                  stroke={MODEL_CONFIGS.ClaudeCowork.color}
                  fillOpacity={1}
                  fill="url(#gradClaude)"
                  strokeWidth={2}
                />
              )}
              {visibleModels.Codex && (
                <Area
                  type="monotone"
                  dataKey="Codex"
                  name="Codex"
                  stroke={MODEL_CONFIGS.Codex.color}
                  fillOpacity={1}
                  fill="url(#gradCodex)"
                  strokeWidth={2}
                />
              )}
              {visibleModels.Antigravity && (
                <Area
                  type="monotone"
                  dataKey="Antigravity"
                  name="Antigravity"
                  stroke={MODEL_CONFIGS.Antigravity.color}
                  fillOpacity={1}
                  fill="url(#gradAnti)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          )}

        </ResponsiveContainer>
      </div>

    </div>
  );
}
