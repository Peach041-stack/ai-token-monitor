import React, { useState, useMemo } from 'react';
import { MODEL_CONFIGS, formatTokens, estimateCost, formatThaiDate } from '../utils/mockDataGenerator';
import { 
  Table, 
  Download, 
  Search, 
  FileSpreadsheet, 
  FileJson, 
  Calendar, 
  ChevronDown, 
  SlidersHorizontal,
  Clock
} from 'lucide-react';

export default function TokenTable({ rawData = [], chartData = [], visibleModels, filterType }) {
  // วันที่เลือกย้อนหลัง: '7' | '14' | '30' | '60' | '90' | '180' | '365' | 'all' | 'custom'
  const [tableRange, setTableRange] = useState('30');
  
  // Custom Date Range
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // การแสดงผลจำนวนแถว: 15 | 30 | 50 | 100 | 'all'
  const [rowsPerPage, setRowsPerPage] = useState('30');

  // การค้นหาและจัดเรียง
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  // ใช้ rawData (ข้อมูลทั้งหมดทุกวัน) มาทำการกรองตามช่วงวันที่ผู้ใช้เลือกในตาราง
  const dataset = useMemo(() => {
    const baseList = Array.isArray(rawData) && rawData.length > 0 ? rawData : chartData;

    // กรองตามช่วงวันที่เลือก
    let filtered = [...baseList];

    if (tableRange === 'custom') {
      if (customStart && customEnd) {
        filtered = filtered.filter((d) => d.date >= customStart && d.date <= customEnd);
      }
    } else if (tableRange !== 'all') {
      const days = parseInt(tableRange, 10) || 30;
      filtered = filtered.slice(-days);
    }

    return filtered.map((item) => ({
      ...item,
      periodLabel: item.periodLabel || formatThaiDate(item.date, false)
    }));
  }, [rawData, chartData, tableRange, customStart, customEnd]);

  // ค้นหาตามคำค้น
  const searchFiltered = useMemo(() => {
    return dataset.filter((item) => {
      const label = (item.periodLabel || item.date || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();
      return label.includes(query) || (item.date && item.date.includes(query));
    });
  }, [dataset, searchTerm]);

  // เรียงลำดับ (Sort)
  const sortedData = useMemo(() => {
    return [...searchFiltered].sort((a, b) => {
      let valA = a[sortField] ?? a.total ?? 0;
      let valB = b[sortField] ?? b.total ?? 0;
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [searchFiltered, sortField, sortAsc]);

  // ตัดแบ่งจำนวนแถวตาม rowsPerPage
  const displayedRows = useMemo(() => {
    if (rowsPerPage === 'all') return sortedData;
    const limit = parseInt(rowsPerPage, 10) || 30;
    return sortedData.slice(0, limit);
  }, [sortedData, rowsPerPage]);

  // คำนวณสรุปยอดรวมของข้อมูลที่กำลังแสดง
  const summaryTotals = useMemo(() => {
    let c = 0, x = 0, a = 0;
    sortedData.forEach((row) => {
      if (visibleModels.ClaudeCowork) c += (row.ClaudeCowork || 0);
      if (visibleModels.Codex) x += (row.Codex || 0);
      if (visibleModels.Antigravity) a += (row.Antigravity || 0);
    });
    const total = c + x + a;
    const cost = estimateCost({ ClaudeCowork: c, Codex: x, Antigravity: a });
    return { c, x, a, total, cost };
  }, [sortedData, visibleModels]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // ส่งออกเป็น CSV (UTF-8 พร้อม BOM สำหรับ Excel ภาษาไทย)
  const exportCSV = () => {
    const headers = ['ช่วงเวลา/วันที่', 'ClaudeCowork (Tokens)', 'Codex (Tokens)', 'Antigravity (Tokens)', 'ยอดรวม (Tokens)', 'ประมาณการ USD', 'ประมาณการ THB'];
    const rows = sortedData.map((row) => {
      const c = row.ClaudeCowork || 0;
      const x = row.Codex || 0;
      const a = row.Antigravity || 0;
      const t = row.total || (c + x + a);
      const cost = estimateCost({ ClaudeCowork: c, Codex: x, Antigravity: a });
      return [
        `"${row.periodLabel || row.date}"`,
        c,
        x,
        a,
        t,
        cost.usd.toFixed(2),
        cost.thb.toFixed(2)
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `token_usage_report_${tableRange}_days_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ส่งออกเป็น JSON
  const exportJSON = () => {
    const jsonStr = JSON.stringify(sortedData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `token_usage_data_${tableRange}_days_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quickRangeOptions = [
    { id: '7', label: '7 วันล่าสุด' },
    { id: '14', label: '14 วันล่าสุด' },
    { id: '30', label: '30 วันล่าสุด' },
    { id: '60', label: '60 วันล่าสุด' },
    { id: '90', label: '90 วันล่าสุด' },
    { id: '180', label: '180 วันล่าสุด' },
    { id: '365', label: '1 ปี (365 วัน)' },
    { id: 'all', label: 'ทั้งหมด (All-time)' },
    { id: 'custom', label: '📅 กำหนดวันเอง' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-md space-y-4">
      
      {/* ส่วนหัวตาราง & ปุ่มควบคุม */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-emerald-400" />
            <span>ตารางแจกแจงรายละเอียดข้อมูล (Detailed Logs & History)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            เลือกดูข้อมูลย้อนหลัง ค้นหารายวัน หรือส่งออกรายงานเชิงลึกเป็น Excel/CSV
          </p>
        </div>

        {/* ปุ่มค้นหา & ส่งออก */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ช่องค้นหา */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาวันที่ เช่น 23 ส.ค., 2026-08..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 text-white text-xs rounded-xl pl-8 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 w-44 sm:w-56 transition-all"
            />
          </div>

          {/* ปุ่มส่งออก CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-all font-medium shadow-sm hover:border-emerald-500/50"
            title="ดาวน์โหลดเป็นไฟล์ CSV (UTF-8 BOM ภาษาไทยสมบูรณ์)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>ดาวน์โหลด CSV</span>
          </button>

          {/* ปุ่มส่งออก JSON */}
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-all font-medium shadow-sm hover:border-amber-500/50"
            title="ดาวน์โหลดเป็นไฟล์ JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* แถบควบคุม: เลือกช่วงวันย้อนหลัง (Quick Range Selector) */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>เลือกช่วงเวลาย้อนหลังที่ต้องการดูในตาราง:</span>
          </span>

          {/* ตัวเลือกจำนวนแถว */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>แสดง:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="15">15 แถว</option>
              <option value="30">30 แถว</option>
              <option value="60">60 แถว</option>
              <option value="100">100 แถว</option>
              <option value="all">แสดงทั้งหมด</option>
            </select>
          </div>
        </div>

        {/* ปุ่ม Quick Range Presets */}
        <div className="flex flex-wrap gap-1.5">
          {quickRangeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTableRange(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tableRange === opt.id
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ตัวเลือกวันที่แบบกำหนดเอง (Custom Date Range Picker) */}
        {tableRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-300">
            <span className="font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>ตั้งแต่วันที่:</span>
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <span className="font-semibold">ถึงวันที่:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500">
              (พบ {sortedData.length} รายการในช่วงวันที่กำหนด)
            </span>
          </div>
        )}
      </div>

      {/* สรุปสถิติของช่วงเวลาที่กำลังเลือก */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400 font-mono">
        <div>
          <span>กำลังแสดง </span>
          <strong className="text-white font-sans">{displayedRows.length}</strong>
          <span> จากทั้งหมด </span>
          <strong className="text-white font-sans">{sortedData.length}</strong>
          <span> วันที่เลือก</span>
        </div>
        <div className="text-emerald-400 font-semibold font-mono">
          ยอดรวมช่วงนี้: {summaryTotals.total.toLocaleString('th-TH')} Tokens (≈ ${summaryTotals.cost.usd.toFixed(2)} USD)
        </div>
      </div>

      {/* ตารางข้อมูล (Table Matrix) */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider select-none">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                ช่วงเวลา / วันที่ {sortField === 'date' && (sortAsc ? '▲' : '▼')}
              </th>
              {visibleModels.ClaudeCowork && (
                <th
                  onClick={() => handleSort('ClaudeCowork')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_CONFIGS.ClaudeCowork.color }} />
                    ClaudeCowork {sortField === 'ClaudeCowork' && (sortAsc ? '▲' : '▼')}
                  </span>
                </th>
              )}
              {visibleModels.Codex && (
                <th
                  onClick={() => handleSort('Codex')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_CONFIGS.Codex.color }} />
                    Codex {sortField === 'Codex' && (sortAsc ? '▲' : '▼')}
                  </span>
                </th>
              )}
              {visibleModels.Antigravity && (
                <th
                  onClick={() => handleSort('Antigravity')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_CONFIGS.Antigravity.color }} />
                    Antigravity {sortField === 'Antigravity' && (sortAsc ? '▲' : '▼')}
                  </span>
                </th>
              )}
              <th
                onClick={() => handleSort('total')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                ยอดรวม Token {sortField === 'total' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="py-3 px-4 text-right">
                ประมาณการค่าใช้จ่าย
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500 font-sans italic">
                  🔍 ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาหรือช่วงวันที่เลือก
                </td>
              </tr>
            ) : (
              displayedRows.map((row, idx) => {
                const c = row.ClaudeCowork || 0;
                const x = row.Codex || 0;
                const a = row.Antigravity || 0;
                const rowTotal = (visibleModels.ClaudeCowork ? c : 0) + 
                                 (visibleModels.Codex ? x : 0) + 
                                 (visibleModels.Antigravity ? a : 0);
                const cost = estimateCost({ ClaudeCowork: c, Codex: x, Antigravity: a });

                return (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      {row.periodLabel || formatThaiDate(row.date, true)}
                    </td>
                    {visibleModels.ClaudeCowork && (
                      <td className="py-3 px-4 text-right text-purple-300">
                        {c.toLocaleString('th-TH')}
                      </td>
                    )}
                    {visibleModels.Codex && (
                      <td className="py-3 px-4 text-right text-emerald-300">
                        {x.toLocaleString('th-TH')}
                      </td>
                    )}
                    {visibleModels.Antigravity && (
                      <td className="py-3 px-4 text-right text-blue-300">
                        {a.toLocaleString('th-TH')}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {rowTotal.toLocaleString('th-TH')}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-sans font-medium">
                      ${cost.usd.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer ข้อความแจ้งสถานะรายการ */}
      {sortedData.length > displayedRows.length && (
        <div className="text-center pt-2">
          <button
            onClick={() => setRowsPerPage('all')}
            className="text-xs text-blue-400 hover:text-blue-300 underline font-sans"
          >
            กดเพื่อแสดงแถวที่เหลือทั้งหมด ({sortedData.length - displayedRows.length} รายการที่ซ่อนอยู่)
          </button>
        </div>
      )}

    </div>
  );
}
