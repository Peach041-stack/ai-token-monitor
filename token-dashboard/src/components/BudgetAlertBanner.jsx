import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, BellCheck, CheckCircle2, DollarSign, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

export default function BudgetAlertBanner({ budgetData, onEnableNotification }) {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'THB'

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('🔔 ระบบแจ้งเตือนโควตาเปิดใช้งานแล้ว', {
          body: 'คุณจะได้รับการแจ้งเตือนเมื่อยอดใช้งาน Token ถึง 80% หรือเกินงบประมาณประจำวัน',
          icon: '/favicon.ico'
        });
      }
    }
  };

  if (!budgetData) return null;

  const { daily, monthly, exchangeRateTHB, alertLevel, alertMessage } = budgetData;

  const isWarning = alertLevel === 'warning';
  const isCritical = alertLevel === 'critical';

  const formatCost = (usdVal, thbVal) => {
    if (currency === 'THB') {
      return `฿${(thbVal || usdVal * (exchangeRateTHB || 35.5)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl backdrop-blur-md p-4 md:p-5 ${
        isCritical
          ? 'bg-rose-950/40 border-rose-600/50 shadow-rose-950/20'
          : isWarning
          ? 'bg-amber-950/40 border-amber-600/50 shadow-amber-950/20'
          : 'bg-slate-900/80 border-slate-800/80'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* หัวเรื่องและการเตือน */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl border flex-shrink-0 ${
              isCritical
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : isWarning
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-6 h-6" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <TrendingUp className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>โควตางบประมาณ & การแจ้งเตือน (Budget Monitor)</span>
              </h4>
              {isCritical && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {alertMessage}
                </span>
              )}
              {isWarning && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {alertMessage}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ติดตามค่าใช้จ่ายเทียบกับงบประมาณใน <code className="font-mono text-indigo-300">.env</code> อัตโนมัติ (แจ้งเตือนล่วงหน้าที่ 80% และ 100%)
            </p>
          </div>
        </div>

        {/* ตัวควบคุมสลับสกุลเงิน & Desktop Notification */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          {/* สลับ USD / THB */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currency === 'USD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('THB')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currency === 'THB' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              THB (฿)
            </button>
          </div>

          {/* ปุ่มขอสิทธิ์ Desktop Notification */}
          <button
            onClick={requestNotificationPermission}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              notificationPermission === 'granted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 cursor-default'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
            title={notificationPermission === 'granted' ? 'เปิดแจ้งเตือนบนจอภาพแล้ว' : 'กดเพื่อเปิดการแจ้งเตือนบน Windows'}
          >
            {notificationPermission === 'granted' ? (
              <>
                <BellCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">แจ้งเตือนบนจอ: เปิดแล้ว</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>เปิดแจ้งเตือนบนจอ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bars: รายวัน และ รายเดือน */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/60">
        
        {/* งบประมาณวันนี้ (Daily) */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">🔥 งบประมาณวันนี้ (Today):</span>
            <span className="font-mono font-bold text-white">
              {formatCost(daily.spentUSD, daily.spentTHB)} / {formatCost(daily.budgetUSD, daily.budgetUSD * exchangeRateTHB)}
              <span className={`ml-2 text-[11px] ${daily.percent >= 100 ? 'text-rose-400' : daily.percent >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ({daily.percent}%)
              </span>
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                daily.percent >= 100
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : daily.percent >= 80
                  ? 'bg-amber-500 shadow-sm shadow-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, daily.percent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>เหลือใช้ได้อีก: {formatCost(daily.remainingUSD, daily.remainingUSD * exchangeRateTHB)}</span>
            <span>อัตราแลกเปลี่ยน: 1 USD = {exchangeRateTHB} THB</span>
          </div>
        </div>

        {/* งบประมาณเดือนนี้ (Monthly) */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">📅 งบประมาณเดือนนี้ (This Month):</span>
            <span className="font-mono font-bold text-white">
              {formatCost(monthly.spentUSD, monthly.spentTHB)} / {formatCost(monthly.budgetUSD, monthly.budgetUSD * exchangeRateTHB)}
              <span className={`ml-2 text-[11px] ${monthly.percent >= 100 ? 'text-rose-400' : monthly.percent >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ({monthly.percent}%)
              </span>
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                monthly.percent >= 100
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : monthly.percent >= 80
                  ? 'bg-amber-500 shadow-sm shadow-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, monthly.percent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>เหลือใช้ได้อีก: {formatCost(monthly.remainingUSD, monthly.remainingUSD * exchangeRateTHB)}</span>
            <span>สถานะ: {monthly.percent >= 100 ? '🔴 เกินงบ' : monthly.percent >= 80 ? '🟡 ใกล้เต็ม' : '🟢 ปกติ'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
