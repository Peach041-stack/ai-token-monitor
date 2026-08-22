import React from 'react';
import { MODEL_CONFIGS } from '../utils/mockDataGenerator';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  Layers, 
  BarChart3, 
  LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare
} from 'lucide-react';

export default function FilterControls({
  filterType,
  setFilterType,
  dailyLimit,
  setDailyLimit,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  visibleModels,
  toggleModel,
  selectAllModels,
  chartType,
  setChartType,
  onRegenerateData,
  isGenerating
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-md space-y-4">
      
      {/* ส่วนบน: ตัวกรองเวลา & ปุ่มสลับชนิดกราฟ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* 1. ตัวเลือกมุมมองเวลา (Time Filters) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>มุมมองช่วงเวลา (Time Filter)</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('daily')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl border transition-all duration-200 ${
                filterType === 'daily'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>รายวัน (Daily)</span>
            </button>

            <button
              onClick={() => setFilterType('custom')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl border transition-all duration-200 ${
                filterType === 'custom'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>กำหนดช่วงเวลาเอง (Custom)</span>
            </button>

            <button
              onClick={() => setFilterType('monthly')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl border transition-all duration-200 ${
                filterType === 'monthly'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>รายเดือน (Monthly 6 เดือน)</span>
            </button>
          </div>
        </div>

        {/* 2. สลับชนิดของกราฟ (Chart Type Switcher) */}
        <div className="space-y-1.5 self-start lg:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>รูปแบบกราฟ (Chart Type)</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartType('line')}
              title="กราฟเส้น (Line Chart)"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartType === 'line'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>เส้น</span>
            </button>

            <button
              onClick={() => setChartType('bar')}
              title="กราฟแท่ง (Bar Chart)"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartType === 'bar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>แท่ง</span>
            </button>

            <button
              onClick={() => setChartType('area')}
              title="กราฟพื้นที่สะสม (Stacked Area Chart)"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartType === 'area'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <AreaChartIcon className="w-3.5 h-3.5" />
              <span>พื้นที่</span>
            </button>
          </div>
        </div>

      </div>

      {/* ส่วนย่อย: ตัวเลือกช่วงวันเพิ่มเติม หรือ Date Pickers */}
      {filterType === 'daily' && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">ดูย้อนหลัง:</span>
          {[
            { days: 7, label: '7 วันล่าสุด' },
            { days: 14, label: '14 วันล่าสุด' },
            { days: 30, label: '30 วันล่าสุด' },
            { days: 60, label: '60 วันล่าสุด' }
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => setDailyLimit(item.days)}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
                dailyLimit === item.days
                  ? 'bg-slate-700 text-white border-slate-500 font-semibold'
                  : 'bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {filterType === 'custom' && (
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3 animate-fadeIn text-xs">
          <span className="text-slate-400 font-medium">ตั้งแต่วันที่:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-400 font-medium">ถึงวันที่:</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* ส่วนล่าง: ตัวกรองเปิด/ปิดโมเดล (Model Toggles) */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            เลือกโมเดล (Models):
          </span>

          {Object.entries(MODEL_CONFIGS).map(([key, config]) => {
            const isChecked = visibleModels[key];
            return (
              <button
                key={key}
                onClick={() => toggleModel(key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium border transition-all duration-200 ${
                  isChecked
                    ? 'bg-slate-800/90 border-slate-600 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/60 text-slate-500 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-md flex items-center justify-center text-[10px] text-white font-bold transition-all shadow-inner"
                  style={{
                    backgroundColor: isChecked ? config.color : '#334155'
                  }}
                >
                  {isChecked ? '✓' : ''}
                </span>
                <span>{config.name}</span>
              </button>
            );
          })}

          <button
            onClick={selectAllModels}
            className="text-xs text-blue-400 hover:text-blue-300 ml-2 underline underline-offset-2"
          >
            เลือกทั้งหมด
          </button>
        </div>

        {/* ปุ่มสุ่มข้อมูลใหม่ (Mock Data Refresher) */}
        <button
          onClick={onRegenerateData}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 text-xs transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-blue-400' : ''}`} />
          <span>สุ่มข้อมูลจำลองใหม่</span>
        </button>

      </div>

    </div>
  );
}
