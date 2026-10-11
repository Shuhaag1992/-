/**
 * Menu 5: Monthly Summary (৫. মাসিক সামারি)
 * নির্বাচিত মাসের পূর্ণাঙ্গ আর্থিক প্রতিবেদন, লাভ-ক্ষতি ও টার্গেট অর্জন
 */

import React, { useState } from 'react';
import {
  Garden,
  DailyWorkLog,
  Expense,
  Income,
  AdvancePayment,
  SalarySettlement,
  Worker,
} from '../types';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
} from '../utils/banglaUtils';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Coins,
  Receipt,
  Users,
  Target,
} from 'lucide-react';

interface MonthlySummaryProps {
  garden: Garden;
  workers: Worker[];
  dailyLogs: DailyWorkLog[];
  expenses: Expense[];
  incomes: Income[];
  advances: AdvancePayment[];
  settlements: SalarySettlement[];
  onPrintMonthlySummary?: (monthStr: string) => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  garden,
  workers,
  dailyLogs,
  expenses,
  incomes,
  advances,
  settlements,
  onPrintMonthlySummary,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayDateStr().slice(0, 7)); // YYYY-MM

  // Filter items for the selected month
  const monthLogs = dailyLogs.filter((l) => l.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const monthIncomes = incomes.filter((i) => i.date.startsWith(selectedMonth));
  const monthAdvances = advances.filter(
    (a) => a.date.startsWith(selectedMonth) && a.status !== 'reversed'
  );
  const monthSettlements = settlements.filter(
    (s) => s.startDate.startsWith(selectedMonth) || s.endDate.startsWith(selectedMonth)
  );

  // Totals
  const totalSheet = monthLogs.reduce((sum, l) => sum + (l.sheet || 0), 0);
  const totalDouble = monthLogs.reduce((sum, l) => sum + (l.double || 0), 0);
  const totalHalf = monthLogs.reduce((sum, l) => sum + (l.half || 0), 0);
  const totalWorkdays = monthLogs.reduce((sum, l) => sum + (l.workdays || 0), 0);
  const totalEarnedWages = monthLogs.reduce((sum, l) => sum + (l.earnedSalary || 0), 0);

  const totalAdvanceGiven = monthAdvances.reduce((sum, a) => sum + a.amount, 0);
  const totalAdvanceAdjusted = monthSettlements.reduce(
    (sum, s) => sum + s.summary.totalAdvanceDeducted,
    0
  );
  const totalSalaryPaid = monthSettlements.reduce((sum, s) => sum + s.summary.totalPaid, 0);
  const totalSalaryRemaining = monthSettlements.reduce(
    (sum, s) => sum + s.summary.totalRemainingBalance,
    0
  );

  const totalOperatingExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalGardenIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

  // True Operating Profit/Loss: Income - (Labor Wages + Operating Expenses)
  const netOperationalProfit =
    totalGardenIncome - (totalOperatingExpenses + totalEarnedWages);

  // Target metrics for month (approx 30 days * daily target)
  const [yearStr, monthNumStr] = selectedMonth.split('-');
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthNumStr, 10), 0).getDate();
  const monthlyBaseTarget = (garden.dailyBaseTarget || 5000) * daysInMonth;
  const targetAchievementPercentage =
    monthlyBaseTarget > 0 ? (totalGardenIncome / monthlyBaseTarget) * 100 : 0;

  // Category breakdown for expenses
  const categoryMap: Record<string, number> = {};
  (garden.categories || []).forEach((cat) => {
    categoryMap[cat] = monthExpenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
  });

  const handlePrint = () => {
    if (onPrintMonthlySummary) {
      onPrintMonthlySummary(selectedMonth);
    } else {
      window.print();
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>৫. মাসিক সামারি</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            মাসিক আয়-ব্যয়, লাভ-ক্ষতি ও কাজের সারসংক্ষেপ
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            নির্দিষ্ট মাসের মোট কর্মদিবস, মজুরি, খরচ, বিক্রয় ও লাভ-ক্ষতির সম্পূর্ণ প্রতিবেদন।
          </p>
        </div>

        {/* Month Selector & Print */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-neutral-900 bg-transparent border-0 focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>মাসিক রিপোর্ট মুদ্রণ / PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Highlight KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-neutral-500 block">মোট বাগান বিক্রয় / আয়</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-800 tabular-nums mt-1 block">
            {formatTaka(totalGardenIncome)}
          </span>
          <div className="text-[11px] text-neutral-500 mt-2">
            টার্গেট: {formatTaka(monthlyBaseTarget)} ({toBanglaNumber(targetAchievementPercentage, 1)}%)
          </div>
        </div>

        {/* Labor Wages */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-neutral-500 block">শ্রমিকদের অর্জিত মজুরি</span>
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
            {formatTaka(totalEarnedWages)}
          </span>
          <div className="text-[11px] text-neutral-500 mt-2">
            মোট কর্মদিবস: {toBanglaNumber(totalWorkdays, 1)} দিন
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-neutral-500 block">অন্যান্য পরিচালন খরচ</span>
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
            {formatTaka(totalOperatingExpenses)}
          </span>
          <div className="text-[11px] text-neutral-500 mt-2">
            বাটি, চাকু, খাবার, মেরামত ইত্যাদি
          </div>
        </div>

        {/* Operating Profit */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-neutral-500 block">প্রকৃত পরিচালন লাভ বা ক্ষতি</span>
          <span
            className={`text-xl sm:text-2xl font-bold tabular-nums mt-1 block ${
              netOperationalProfit >= 0 ? 'text-emerald-800' : 'text-red-700'
            }`}
          >
            {formatTaka(netOperationalProfit)}
          </span>
          <div className="text-[11px] text-neutral-500 mt-2">
            আয় − (মজুরি + অন্যান্য খরচ)
          </div>
        </div>
      </div>

      {/* Two Columns: Labor & Advances on left, Operating & Target on right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Labor Work & Advance Summary */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Users className="w-4 h-4 text-emerald-800" />
            <span>শ্রমিক কাজ, বেতন ও অগ্রিমের বিবরণ</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">মোট সিট সংখ্যা:</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{toBanglaNumber(totalSheet)} টি</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">মোট ডবল সংখ্যা:</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{toBanglaNumber(totalDouble)} টি</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">মোট হাফ সংখ্যা:</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{toBanglaNumber(totalHalf)} টি</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">মোট কর্মদিবস:</span>
              <span className="font-bold text-emerald-800 tabular-nums">{toBanglaNumber(totalWorkdays, 1)} দিন</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">মোট অর্জিত মজুরি:</span>
              <span className="font-bold text-neutral-900 tabular-nums">{formatTaka(totalEarnedWages)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">এই মাসে প্রদত্ত নতুন অগ্রিম:</span>
              <span className="font-semibold text-amber-700 tabular-nums">{formatTaka(totalAdvanceGiven)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">বেতন থেকে সমন্বয় করা অগ্রিম:</span>
              <span className="font-semibold text-emerald-800 tabular-nums">{formatTaka(totalAdvanceAdjusted)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">মোট পরিশোধিত নিট বেতন:</span>
              <span className="font-bold text-neutral-900 tabular-nums">{formatTaka(totalSalaryPaid)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-600">অবশিষ্ট বকেয়া বেতন:</span>
              <span className="font-bold text-neutral-700 tabular-nums">{formatTaka(totalSalaryRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Expenses Breakdown & Target Progress */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Receipt className="w-4 h-4 text-emerald-800" />
            <span>ক্যাটাগরিভিত্তিক পরিচালন খরচ ও টার্গেট</span>
          </h3>

          <div className="space-y-2 text-xs">
            {Object.entries(categoryMap).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">{cat}:</span>
                <span className="font-semibold text-neutral-900 tabular-nums">{formatTaka(amt)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-bold border-t border-neutral-200 text-neutral-900">
              <span>মোট পরিচালন খরচ:</span>
              <span className="tabular-nums text-red-700">{formatTaka(totalOperatingExpenses)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-600">মাসিক ভিত্তি টার্গেট ({toBanglaNumber(daysInMonth)} দিন):</span>
              <span className="font-bold text-neutral-900 tabular-nums">{formatTaka(monthlyBaseTarget)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">প্রকৃত বিক্রয় অর্জন:</span>
              <span className="font-bold text-emerald-800 tabular-nums">{formatTaka(totalGardenIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">টার্গেট ঘাটতি / উদ্বৃত্ত:</span>
              <span
                className={`font-bold tabular-nums ${
                  totalGardenIncome >= monthlyBaseTarget ? 'text-emerald-800' : 'text-red-700'
                }`}
              >
                {totalGardenIncome >= monthlyBaseTarget
                  ? `+${formatTaka(totalGardenIncome - monthlyBaseTarget)}`
                  : `-${formatTaka(monthlyBaseTarget - totalGardenIncome)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
