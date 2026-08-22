import React, { useState, useMemo } from 'react';
import { MODEL_CONFIGS, formatTokens, formatThaiDate } from '../utils/mockDataGenerator';
import { Calendar, Flame, Trophy, Activity, Sparkles } from 'lucide-react';

export default function TokenHeatmap({ rawData }) {
  // แท็บเลือกโมเดลที่จะดู Heatmap: 'total' | 'ClaudeCowork' | 'Codex' | 'Antigravity'
  const [selectedModel, setSelectedModel] = useState('total');

  // จัด Map ข้อมูลตามวันที่ YYYY-MM-DD
  const dateMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(rawData)) {
      rawData.forEach((item) => {
        if (item.date) {
          map.set(item.date, item);
        }
      });
    }
    return map;
  }, [rawData]);

  // สร้าง Grid 365 วันย้อนหลัง (52 สัปดาห์)
  const { weeks, monthLabels, maxVal, streakDays, activeDaysCount, peakDay } = useMemo(() => {
    const today = new Date();
    const daysToShow = 364; // 52 weeks * 7 days
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow);
    // ปรับให้ตรงกับวันอาทิตย์เพื่อความเรียบร้อยของตารางสัปดาห์
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let curr = new Date(startDate);
    const weeksArr = [];
    let currentWeek = [];
    const months = [];
    let lastMonth = -1;

    let maxTokens = 0;
    let activeDays = 0;
    let bestDay = { date: '', tokens: 0 };

    const thaiMonthsShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];
      const entry = dateMap.get(dateStr);

      let val = 0;
      if (entry) {
        if (selectedModel === 'total') {
          val = entry.total || ((entry.ClaudeCowork || 0) + (entry.Codex || 0) + (entry.Antigravity || 0));
        } else {
          val = entry[selectedModel] || 0;
        }
      }

      if (val > 0) {
        activeDays++;
        if (val > maxTokens) maxTokens = val;
        if (val > bestDay.tokens) bestDay = { date: dateStr, tokens: val };
      }

      const dayObj = {
        date: dateStr,
        dayOfWeek: curr.getDay(),
        month: curr.getMonth(),
        value: val,
        rawEntry: entry,
        isFuture: curr > today
      };

      currentWeek.push(dayObj);

      if (currentWeek.length === 7) {
        // บันทึกตำแหน่งเดือนสำหรับแสดง Header ด้านบน
        const firstDayOfMonth = currentWeek.find((d) => d.month !== lastMonth);
        if (firstDayOfMonth && firstDayOfMonth.month !== lastMonth) {
          months.push({
            weekIndex: weeksArr.length,
            label: thaiMonthsShort[firstDayOfMonth.month]
          });
          lastMonth = firstDayOfMonth.month;
        }
        weeksArr.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ isFuture: true, value: 0 });
      }
      weeksArr.push(currentWeek);
    }

    // คำนวณ Current Streak (วันที่ใช้งานต่อเนื่องล่าสุด)
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      const e = dateMap.get(dStr);
      const val = e ? (selectedModel === 'total' ? e.total : e[selectedModel]) : 0;
      if (val > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      weeks: weeksArr,
      monthLabels: months,
      maxVal: maxTokens || 1,
      streakDays: streak,
      activeDaysCount: activeDays,
      peakDay: bestDay
    };
  }, [dateMap, selectedModel]);

  // คำนวณระดับความเข้มสี (Level 0 - 4)
  const getIntensityLevel = (val) => {
    if (!val || val === 0) return 0;
    const ratio = val / maxVal;
    if (ratio < 0.15) return 1;
    if (ratio < 0.4) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  // สีของแต่ละโมเดล (Theme Colors)
  const colorSchemes = {
    total: {
      0: 'bg-slate-900/60 border-slate-800/50',
      1: 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300',
      2: 'bg-emerald-700 border-emerald-600 text-white',
      3: 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/30',
      4: 'bg-emerald-300 border-emerald-200 text-slate-950 shadow-md shadow-emerald-400/50'
    },
    Codex: {
      0: 'bg-slate-900/60 border-slate-800/50',
      1: 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300',
      2: 'bg-emerald-700 border-emerald-600 text-white',
      3: 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/30',
      4: 'bg-emerald-300 border-emerald-200 text-slate-950 shadow-md shadow-emerald-400/50'
    },
    ClaudeCowork: {
      0: 'bg-slate-900/60 border-slate-800/50',
      1: 'bg-purple-950/80 border-purple-800/60 text-purple-300',
      2: 'bg-purple-700 border-purple-600 text-white',
      3: 'bg-purple-500 border-purple-400 text-white shadow-sm shadow-purple-500/30',
      4: 'bg-purple-300 border-purple-200 text-slate-950 shadow-md shadow-purple-400/50'
    },
    Antigravity: {
      0: 'bg-slate-900/60 border-slate-800/50',
      1: 'bg-blue-950/80 border-blue-800/60 text-blue-300',
      2: 'bg-blue-700 border-blue-600 text-white',
      3: 'bg-blue-500 border-blue-400 text-white shadow-sm shadow-blue-500/30',
      4: 'bg-blue-300 border-blue-200 text-slate-950 shadow-md shadow-blue-400/50'
    }
  };

  const currentScheme = colorSchemes[selectedModel] || colorSchemes.total;

  const [hoveredDay, setHoveredDay] = useState(null);

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-md space-y-4">
      
      {/* ส่วนหัว Heatmap & ปุ่มเลือกโมเดล */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>ตารางความถี่การใช้งาน (Activity Heatmap Grid)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ติดตามประวัติการใช้งาน Token รายวันในรูปแบบ GitHub Contribution Calendar ตลอดทั้งปี
          </p>
        </div>

        {/* ปุ่มสลับโมเดล (ยอดรวม / Claude / Codex / Antigravity) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSelectedModel('total')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedModel === 'total'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🌟 ยอดรวมทั้งหมด</span>
          </button>

          <button
            onClick={() => setSelectedModel('ClaudeCowork')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedModel === 'ClaudeCowork'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>ClaudeCowork</span>
          </button>

          <button
            onClick={() => setSelectedModel('Codex')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedModel === 'Codex'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Codex</span>
          </button>

          <button
            onClick={() => setSelectedModel('Antigravity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedModel === 'Antigravity'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Antigravity</span>
          </button>
        </div>
      </div>

      {/* แถบ Quick Stats ย่อยใต้หัวข้อ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> วันที่มีการใช้งาน
          </span>
          <p className="text-lg font-bold font-mono text-white mt-1">
            {activeDaysCount} <span className="text-xs text-slate-400 font-normal">วันในปีนี้</span>
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> ใช้งานต่อเนื่อง (Streak)
          </span>
          <p className="text-lg font-bold font-mono text-amber-400 mt-1">
            {streakDays} <span className="text-xs text-slate-400 font-normal">วันติด</span>
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl col-span-2">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-purple-400" /> วันที่ใช้ Token สูงสุด (Peak Day)
          </span>
          <p className="text-lg font-bold font-mono text-purple-300 mt-1">
            {peakDay.tokens > 0 ? (
              <>
                {formatTokens(peakDay.tokens)} <span className="text-xs font-sans text-slate-400">({formatThaiDate(peakDay.date, true)})</span>
              </>
            ) : (
              '-'
            )}
          </p>
        </div>
      </div>

      {/* Heatmap Matrix Grid */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[780px]">
          
          {/* Header ชื่อเดือน */}
          <div className="flex text-[11px] text-slate-400 mb-1 pl-7 relative h-4">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${m.weekIndex * 15 + 28}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* ตารางวัน (7 แถว: อา-ส) */}
          <div className="flex gap-[3px]">
            {/* Label วันในสัปดาห์ (จันทร์, พุธ, ศุกร์) */}
            <div className="flex flex-col justify-between text-[9px] text-slate-500 pr-2 pt-[2px] pb-[2px] select-none h-[95px]">
              <span>จ.</span>
              <span>พ.</span>
              <span>ศ.</span>
            </div>

            {/* Weeks columns */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dIdx) => {
                  if (day.isFuture) {
                    return (
                      <div
                        key={dIdx}
                        className="w-[12px] h-[12px] rounded-[2px] bg-slate-950/20 border border-slate-900/40 opacity-20"
                      />
                    );
                  }

                  const lvl = getIntensityLevel(day.value);
                  const colorClass = currentScheme[lvl];

                  return (
                    <div
                      key={dIdx}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-[12px] h-[12px] rounded-[2px] border transition-all cursor-pointer hover:ring-2 hover:ring-white/80 hover:scale-125 z-0 hover:z-10 ${colorClass}`}
                      title={`${formatThaiDate(day.date, true)}: ${day.value.toLocaleString('th-TH')} Token`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Legend & Tooltip Summary Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        
        {/* Tooltip รายละเอียดเมื่อเอาเมาส์ชี้ */}
        <div className="font-mono">
          {hoveredDay ? (
            <span className="text-slate-200">
              📅 <strong className="text-white font-sans">{formatThaiDate(hoveredDay.date, true)}:</strong>{' '}
              <span className="text-emerald-400 font-bold">{hoveredDay.value.toLocaleString('th-TH')}</span> Tokens
              {hoveredDay.rawEntry && selectedModel === 'total' && (
                <span className="text-slate-400 font-sans text-[11px] ml-2">
                  (C: {formatTokens(hoveredDay.rawEntry.ClaudeCowork || 0)} | X: {formatTokens(hoveredDay.rawEntry.Codex || 0)} | A: {formatTokens(hoveredDay.rawEntry.Antigravity || 0)})
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-500 italic font-sans text-[11px]">
              นำเมาส์ไปชี้ที่ช่องสี่เหลี่ยมเพื่อดูสถิติของแต่ละวัน
            </span>
          )}
        </div>

        {/* แถบสเกลสี (Less -> More) */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>น้อย</span>
          <div className="flex gap-1">
            <span className={`w-3 h-3 rounded-[2px] border ${currentScheme[0]}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${currentScheme[1]}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${currentScheme[2]}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${currentScheme[3]}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${currentScheme[4]}`} />
          </div>
          <span>มาก</span>
        </div>

      </div>

    </div>
  );
}
