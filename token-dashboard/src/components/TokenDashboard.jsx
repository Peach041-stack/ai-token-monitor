import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  generateDailyMockData,
  aggregateData,
  MODEL_CONFIGS
} from '../utils/mockDataGenerator';

import KPICards from './KPICards';
import FilterControls from './FilterControls';
import ChartSection from './ChartSection';
import TokenHeatmap from './TokenHeatmap';
import ModelDistribution from './ModelDistribution';
import SubModelBreakdown from './SubModelBreakdown';
import LiveTokenStream from './LiveTokenStream';
import TokenTable from './TokenTable';

import { Sparkles, Radio, Database, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function TokenDashboard() {
  // โหมดแหล่งข้อมูล: 'real' (ข้อมูลจริงจากเครื่อง) หรือ 'mock' (ข้อมูลจำลอง)
  const [dataSource, setDataSource] = useState('real');
  const [serverOnline, setServerOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ข้อมูลประวัติการใช้งาน
  const [rawData, setRawData] = useState([]);
  const [subModelsList, setSubModelsList] = useState([]);
  const [liveEventsList, setLiveEventsList] = useState([]);

  // สถานะตัวกรองช่วงเวลา (daily | custom | monthly)
  const [filterType, setFilterType] = useState('daily');
  const [dailyLimit, setDailyLimit] = useState(30);

  // ช่วงเวลากำหนดเอง (Custom Date Range)
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // การเปิด/ปิดโมเดล
  const [visibleModels, setVisibleModels] = useState({
    ClaudeCowork: true,
    Codex: true,
    Antigravity: true
  });

  // ชนิดของกราฟ (line | bar | area)
  const [chartType, setChartType] = useState('line');

  // ดึง API URL แบบ Dynamic ตาม .env (รองรับทั้งแบบต่อตรง และผ่าน Vite Proxy)
  const API_BASE = useMemo(() => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined' && window.location.port === '5173') return '';
    return 'http://localhost:3001';
  }, []);

  // ฟังก์ชันโหลดข้อมูลจริงจาก Local Server
  const fetchRealHistory = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/tokens/history`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setRawData(json.data);
          if (json.models) setSubModelsList(json.models);
          setServerOnline(true);
        } else {
          // หากไม่มีประวัติจริง ให้ fallback เป็น mock
          setRawData(generateDailyMockData());
        }
      } else {
        setServerOnline(false);
        setRawData(generateDailyMockData());
      }
    } catch (e) {
      setServerOnline(false);
      // Fallback ถ้ายังไม่ได้เปิด backend server
      setRawData(generateDailyMockData());
    } finally {
      setIsSyncing(false);
    }
  }, [API_BASE]);

  // เมื่อเปลี่ยน Data Source
  useEffect(() => {
    if (dataSource === 'real') {
      fetchRealHistory();
    } else {
      setRawData(generateDailyMockData());
    }
  }, [dataSource, fetchRealHistory]);

  // เชื่อมต่อ Real-Time Stream (SSE) เมื่ออยู่ในโหมด Real Data
  useEffect(() => {
    if (dataSource !== 'real') return;

    let eventSource = null;
    try {
      eventSource = new EventSource(`${API_BASE}/api/tokens/live`);

      eventSource.onopen = () => {
        setServerOnline(true);
      };

      eventSource.onmessage = (event) => {

        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CONNECTED') return;

          // รับ Real-Time Token Event จาก Codex / Claude / Antigravity
          const newEvent = {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString('th-TH', { hour12: false }),
            model: data.provider || 'Codex',
            task: data.model || 'Live Session Event',
            promptTokens: data.inputTokens || 0,
            completionTokens: data.outputTokens || 0,
            totalTokens: data.totalTokens || 0,
            latency: 'Realtime'
          };

          setLiveEventsList((prev) => [newEvent, ...prev.slice(0, 19)]);

          // อัปเดตยอดรวมในกราฟของวันนี้ทันที
          setRawData((prev) => {
            const copy = [...prev];
            const today = new Date().toISOString().split('T')[0];
            const lastIdx = copy.findIndex((d) => d.date === today);

            if (lastIdx >= 0) {
              const item = { ...copy[lastIdx] };
              item[data.provider] = (item[data.provider] || 0) + data.totalTokens;
              item.total = (item.total || 0) + data.totalTokens;
              copy[lastIdx] = item;
            } else {
              copy.push({
                date: today,
                ClaudeCowork: data.provider === 'ClaudeCowork' ? data.totalTokens : 0,
                Codex: data.provider === 'Codex' ? data.totalTokens : 0,
                Antigravity: data.provider === 'Antigravity' ? data.totalTokens : 0,
                total: data.totalTokens
              });
            }
            return copy;
          });
        } catch (err) {}
      };

      eventSource.onerror = () => {
        setServerOnline(false);
      };
    } catch (e) {
      setServerOnline(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [dataSource]);

  // สลับการเปิด/ปิดแต่ละโมเดล
  const toggleModel = useCallback((modelKey) => {
    setVisibleModels((prev) => {
      const next = { ...prev, [modelKey]: !prev[modelKey] };
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }, []);

  const selectAllModels = useCallback(() => {
    setVisibleModels({
      ClaudeCowork: true,
      Codex: true,
      Antigravity: true
    });
  }, []);

  const handleRegenerateData = useCallback(() => {
    if (dataSource === 'real') {
      fetchRealHistory();
    } else {
      setRawData(generateDailyMockData());
    }
  }, [dataSource, fetchRealHistory]);

  const handleNewLiveTokens = useCallback((model, tokens) => {
    setRawData((prev) => {
      if (!prev || prev.length === 0) return prev;
      const copy = [...prev];
      const lastIndex = copy.length - 1;
      const todayEntry = { ...copy[lastIndex] };
      todayEntry[model] = (todayEntry[model] || 0) + tokens;
      todayEntry.total = (todayEntry.total || 0) + tokens;
      copy[lastIndex] = todayEntry;
      return copy;
    });
  }, []);

  // รวมข้อมูลอัตโนมัติ (Aggregate)
  const chartData = useMemo(() => {
    return aggregateData(rawData, filterType, customStartDate, customEndDate, dailyLimit);
  }, [rawData, filterType, customStartDate, customEndDate, dailyLimit]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* แถบด้านบนสุด (Top Header & Branding) */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                  ระบบติดตามการใช้งาน Token ของ AI
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Real-time Token Observability (Codex GUI/CLI • Antigravity • ClaudeCowork)
                </p>
              </div>
            </div>
          </div>

          {/* สลับโหมดแหล่งข้อมูล (Data Source Switcher) & Connection Status */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            
            {/* โหมด Data Source */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setDataSource('real')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  dataSource === 'real'
                    ? 'bg-emerald-600 text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>ข้อมูลจริงจากเครื่อง (Real Data)</span>
              </button>
              <button
                onClick={() => setDataSource('mock')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  dataSource === 'mock'
                    ? 'bg-indigo-600 text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ข้อมูลจำลอง (Demo)</span>
              </button>
            </div>

              {/* สถานะเชื่อมต่อ Server */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              {dataSource === 'real' ? (
                serverOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-mono text-emerald-400 font-bold">Live Stream Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-amber-400 font-medium">รอเปิด server.cjs (Port ใน .env)</span>
                  </>
                )
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-blue-300">Demo Mode</span>
                </>
              )}
            </div>

            {/* ป้ายแสดง LAN Access URL */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="text-slate-500">🌐 LAN:</span>
              <span className="text-slate-200">
                {typeof window !== 'undefined' && window.location.hostname !== 'localhost'
                  ? `http://${window.location.host}`
                  : `http://192.168.0.245:5173`}
              </span>
            </div>


          </div>
        </header>

        {/* แถบสรุป KPI Metrics */}
        <KPICards chartData={chartData} visibleModels={visibleModels} />

        {/* แผงควบคุมและตัวกรอง (Time Filter, Model Toggle, Chart Switcher) */}
        <FilterControls
          filterType={filterType}
          setFilterType={setFilterType}
          dailyLimit={dailyLimit}
          setDailyLimit={setDailyLimit}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          visibleModels={visibleModels}
          toggleModel={toggleModel}
          selectAllModels={selectAllModels}
          chartType={chartType}
          setChartType={setChartType}
          onRegenerateData={handleRegenerateData}
          isGenerating={isSyncing}
        />

        {/* พื้นที่กราฟหลักแสดงแนวโน้ม */}
        <ChartSection
          chartData={chartData}
          visibleModels={visibleModels}
          chartType={chartType}
          filterType={filterType}
        />

        {/* ตาราง Activity Heatmap Grid สไตล์ GitHub */}
        <TokenHeatmap rawData={rawData} />

        {/* ส่วนคู่: กราฟสัดส่วน (Distribution) และการตรวจจับแบบสด (Live Monitor) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModelDistribution chartData={chartData} visibleModels={visibleModels} />
          <LiveTokenStream
            onNewLiveTokens={handleNewLiveTokens}
            externalLiveEvents={liveEventsList}
            isRealMode={dataSource === 'real'}
          />
        </div>

        {/* ส่วนจำแนกตามชื่อโมเดลย่อย (Sub-Model Breakdown) */}
        <SubModelBreakdown rawData={rawData} subModelsList={subModelsList} />


        {/* ตารางข้อมูลอย่างละเอียด พร้อมปุ่มดาวน์โหลดรายงาน CSV / JSON */}
        <TokenTable
          rawData={rawData}
          chartData={chartData}
          visibleModels={visibleModels}
          filterType={filterType}
        />


        {/* ส่วนท้าย (Footer) */}
        <footer className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 AI Assistant Token Monitor • ดึงข้อมูลจริงจากเครื่องผ่าน Local File Watcher & SSE</p>
          <p className="text-[11px] text-slate-600">
            รองรับทั้ง Codex GUI (ChatGPT Desktop), Codex CLI, Antigravity และ Claude Code
          </p>
        </footer>

      </div>
    </div>
  );
}
