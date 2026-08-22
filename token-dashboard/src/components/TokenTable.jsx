import React, { useState } from 'react';
import { MODEL_CONFIGS, formatTokens, estimateCost } from '../utils/mockDataGenerator';
import { Table, Download, Search, FileSpreadsheet, FileJson } from 'lucide-react';

export default function TokenTable({ chartData, visibleModels, filterType }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  // กรองและเรียงลำดับ
  const filteredData = chartData.filter((item) => {
    const label = item.periodLabel || item.date || '';
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortField] ?? a.total ?? 0;
    let valB = b[sortField] ?? b.total ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

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
    const headers = ['ช่วงเวลา', 'ClaudeCowork (Tokens)', 'Codex (Tokens)', 'Antigravity (Tokens)', 'ยอดรวม (Tokens)', 'ประมาณการ USD'];
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
        cost.usd.toFixed(2)
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `token_usage_report_${Date.now()}.csv`);
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
    link.setAttribute('download', `token_usage_data_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
      
      {/* ส่วนหัวตาราง & ปุ่มค้นหา/ส่งออก */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <span>ตารางแจกแจงรายละเอียดข้อมูล (Detailed Logs)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            แสดงรายละเอียดเชิงลึกและสามารถส่งออกไฟล์รายงานได้
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ช่องค้นหา */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาวันที่/งวด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* ปุ่มส่งออก CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-all font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* ปุ่มส่งออก JSON */}
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-all font-medium"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* ตารางข้อมูล */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
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
                    ClaudeCowork
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
                    Codex
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
                    Antigravity
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
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-sans italic">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                </td>
              </tr>
            ) : (
              sortedData.slice(0, 15).map((row, idx) => {
                const c = row.ClaudeCowork || 0;
                const x = row.Codex || 0;
                const a = row.Antigravity || 0;
                const rowTotal = (visibleModels.ClaudeCowork ? c : 0) + 
                                 (visibleModels.Codex ? x : 0) + 
                                 (visibleModels.Antigravity ? a : 0);
                const cost = estimateCost({ ClaudeCowork: c, Codex: x, Antigravity: a });

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                      {row.periodLabel || row.date}
                    </td>
                    {visibleModels.ClaudeCowork && (
                      <td className="py-2.5 px-4 text-right text-purple-300">
                        {c.toLocaleString('th-TH')}
                      </td>
                    )}
                    {visibleModels.Codex && (
                      <td className="py-2.5 px-4 text-right text-emerald-300">
                        {x.toLocaleString('th-TH')}
                      </td>
                    )}
                    {visibleModels.Antigravity && (
                      <td className="py-2.5 px-4 text-right text-blue-300">
                        {a.toLocaleString('th-TH')}
                      </td>
                    )}
                    <td className="py-2.5 px-4 text-right font-bold text-white">
                      {rowTotal.toLocaleString('th-TH')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-400 font-sans font-medium">
                      ${cost.usd.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sortedData.length > 15 && (
        <p className="text-[11px] text-slate-500 text-center italic">
          (แสดง 15 แถวแรกจากทั้งหมด {sortedData.length} รายการ - ดาวน์โหลด CSV เพื่อดูทั้งหมด)
        </p>
      )}

    </div>
  );
}
