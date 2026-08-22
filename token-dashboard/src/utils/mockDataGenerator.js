// การตั้งค่าโมเดล สีประจำโมเดล และไอคอน
export const MODEL_CONFIGS = {
  ClaudeCowork: {
    id: 'ClaudeCowork',
    name: 'ClaudeCowork',
    provider: 'Anthropic',
    color: '#a855f7', // ม่วงสดใส
    gradient: 'from-purple-500 to-indigo-600',
    bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    iconText: 'C',
    costPer1k: 0.015, // USD per 1K tokens (approx)
  },
  Codex: {
    id: 'Codex',
    name: 'Codex',
    provider: 'OpenAI',
    color: '#10b981', // เขียว Emerald
    gradient: 'from-emerald-500 to-teal-600',
    bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconText: 'X',
    costPer1k: 0.010,
  },
  Antigravity: {
    id: 'Antigravity',
    name: 'Antigravity',
    provider: 'Google DeepMind',
    color: '#3b82f6', // น้ำเงินสดใส
    gradient: 'from-blue-500 to-cyan-600',
    bgBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    iconText: 'A',
    costPer1k: 0.008,
  }
};

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * สร้างข้อมูลจำลองย้อนหลัง 180 วัน (6 เดือน)
 */
export function generateDailyMockData() {
  const data = [];
  const today = new Date();
  const daysToGenerate = 180;

  for (let i = daysToGenerate; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const dayOfWeek = d.getDay(); // 0 = อาทิตย์, 6 = เสาร์
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // จำลองลักษณะการใช้งาน: วันธรรมดาใช้เยอะกว่าวันหยุด + สุ่ม fluctuation
    const baseMultiplier = isWeekend ? 0.35 : 1.0;
    const wave = Math.sin(i / 7) * 0.2 + 1.0; // คลื่นสัปดาห์

    const claude = Math.round((Math.random() * 35000 + 25000) * baseMultiplier * wave);
    const codex = Math.round((Math.random() * 45000 + 30000) * baseMultiplier * wave);
    const anti = Math.round((Math.random() * 40000 + 20000) * baseMultiplier * wave);

    data.push({
      date: dateStr,
      timestamp: d.getTime(),
      ClaudeCowork: claude,
      Codex: codex,
      Antigravity: anti,
      total: claude + codex + anti
    });
  }

  return data;
}

/**
 * ฟอร์แมตวันที่แบบไทย เช่น "15 ส.ค. 69" หรือ "15 ส.ค."
 */
export function formatThaiDate(dateStr, includeYear = false) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  if (includeYear) {
    const thaiYear = (d.getFullYear() + 543).toString().slice(-2);
    return `${day} ${month} ${thaiYear}`;
  }
  return `${day} ${month}`;
}

/**
 * ฟอร์แมตเดือนแบบไทย เช่น "สิงหาคม 2569"
 */
export function formatThaiMonth(yearMonthStr) {
  if (!yearMonthStr) return '';
  const [year, month] = yearMonthStr.split('-');
  const thaiYear = parseInt(year, 10) + 543;
  const monthIndex = parseInt(month, 10) - 1;
  return `${THAI_MONTHS_FULL[monthIndex]} ${thaiYear}`;
}

/**
 * ฟังก์ชันประมวลผลและรวมผลข้อมูล (Aggregate)
 */
export function aggregateData(rawData, filterType, customStart, customEnd, daysLimit = 30) {
  if (!rawData || rawData.length === 0) return [];

  // 1. มุมมองรายเดือน (Monthly)
  if (filterType === 'monthly') {
    const monthlyMap = {};

    rawData.forEach((item) => {
      const monthKey = item.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          dateKey: monthKey,
          periodLabel: formatThaiMonth(monthKey),
          ClaudeCowork: 0,
          Codex: 0,
          Antigravity: 0,
          total: 0,
          daysCount: 0
        };
      }
      monthlyMap[monthKey].ClaudeCowork += item.ClaudeCowork;
      monthlyMap[monthKey].Codex += item.Codex;
      monthlyMap[monthKey].Antigravity += item.Antigravity;
      monthlyMap[monthKey].total += item.total;
      monthlyMap[monthKey].daysCount += 1;
    });

    return Object.values(monthlyMap);
  }

  // 2. มุมมองกำหนดช่วงเวลาเอง (Custom Date Range)
  if (filterType === 'custom') {
    let filtered = rawData;
    if (customStart && customEnd) {
      filtered = rawData.filter((d) => d.date >= customStart && d.date <= customEnd);
    }
    return filtered.map((item) => ({
      ...item,
      periodLabel: formatThaiDate(item.date, false)
    }));
  }

  // 3. มุมมองรายวัน (Daily) - ดึง N วันล่าสุด (เช่น 30 วัน)
  const sliced = rawData.slice(-daysLimit);
  return sliced.map((item) => ({
    ...item,
    periodLabel: formatThaiDate(item.date, false)
  }));
}

/**
 * ฟอร์แมตตัวเลข Token ให้อ่านง่าย เช่น 1.25M, 450K, 12,500
 */
export function formatTokens(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString('th-TH');
}

/**
 * คำนวณราคาประเมินเป็นเงินบาท (THB) และดอลลาร์ (USD)
 */
export function estimateCost(tokensByModel, usdRate = 35.5) {
  let totalUSD = 0;
  Object.keys(MODEL_CONFIGS).forEach((key) => {
    const tokens = tokensByModel[key] || 0;
    const rate = MODEL_CONFIGS[key].costPer1k;
    totalUSD += (tokens / 1000) * rate;
  });

  return {
    usd: totalUSD,
    thb: totalUSD * usdRate
  };
}
