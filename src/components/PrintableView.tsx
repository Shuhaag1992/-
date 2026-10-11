/**
 * Dedicated A4 Printable Document View (প্রিন্ট ও PDF ভিউয়ার)
 * ব্রাউজারের নেটিভ প্রিন্ট ইঞ্জিনের মাধ্যমে নির্ভুল বাংলা ফন্ট ও মার্জিনে A4 ডকুমেন্ট
 */

import React from 'react';
import { Garden, SalarySettlement, DailyWorkLog, Expense, Worker } from '../types';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
} from '../utils/banglaUtils';
import { Printer, ArrowLeft } from 'lucide-react';

export type PrintableDocType =
  | 'salary_settlement'
  | 'daily_summary'
  | 'monthly_summary'
  | 'expenses';

interface PrintableViewProps {
  garden: Garden;
  docType: PrintableDocType;
  settlementData?: SalarySettlement | null;
  dailyData?: {
    date: string;
    logs: DailyWorkLog[];
    workers: Worker[];
  } | null;
  monthlyData?: {
    monthStr: string;
    totalWorkdays: number;
    totalEarned: number;
    totalExpenses: number;
    totalIncome: number;
    netProfit: number;
  } | null;
  onBack: () => void;
}

export const PrintableView: React.FC<PrintableViewProps> = ({
  garden,
  docType,
  settlementData,
  dailyData,
  monthlyData,
  onBack,
}) => {
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="bg-neutral-100 min-h-screen py-6 px-4">
      {/* Top Floating Control Bar (Hidden during printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white border border-neutral-300 rounded-xl p-4 shadow-sm no-print">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ফিরে যান</span>
        </button>

        <div className="text-xs sm:text-sm font-bold text-neutral-800">
          A4 প্রিন্ট ও PDF প্রিভিউ — {garden.name}
        </div>

        <button
          type="button"
          onClick={triggerPrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-emerald-900 transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>প্রিন্ট করুন / PDF সেভ করুন</span>
        </button>
      </div>

      {/* A4 Document Paper Container */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-12 border border-neutral-300 shadow-md rounded-lg print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="text-center border-b-2 border-neutral-900 pb-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {garden.name}
          </h1>
          <div className="text-sm text-neutral-700 font-medium mt-1">
            {garden.location} · কোড: {garden.code}
          </div>

          <div className="mt-3 inline-block bg-neutral-100 px-4 py-1 rounded text-sm font-bold text-neutral-900">
            {docType === 'salary_settlement' &&
              `শ্রমিকদের বেতন বিবরণী ও পেমেন্ট শিট (${settlementData?.periodType === '15_days' ? '১৫ দিনের চক্র' : 'মাসিক চক্র'})`}
            {docType === 'daily_summary' &&
              `দৈনিক মজুরি ও কাজের সারাংশ প্রতিবেদন`}
            {docType === 'monthly_summary' &&
              `মাসিক আর্থিক ও লাভ-ক্ষতি বিবরণী`}
          </div>
        </div>

        {/* 1. Salary Settlement Document */}
        {docType === 'salary_settlement' && settlementData && (
          <div className="space-y-6">
            {/* Meta bar */}
            <div className="flex justify-between text-xs text-neutral-700 border-b border-neutral-200 pb-2">
              <div>
                বেতন পর্ব:{' '}
                <strong className="text-neutral-900">
                  {formatDateBangla(settlementData.startDate)} থেকে {formatDateBangla(settlementData.endDate)}
                </strong>
              </div>
              <div>
                হিসাব প্রস্তুতের তারিখ:{' '}
                <strong className="text-neutral-900">
                  {formatDateBangla(settlementData.settlementDate)}
                </strong>
              </div>
            </div>

            {/* Workers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-900 font-bold">
                    <th className="p-2 border-r border-neutral-300 text-center w-8">ক্র.</th>
                    <th className="p-2 border-r border-neutral-300">শ্রমিকের নাম</th>
                    <th className="p-2 border-r border-neutral-300 text-center">সিট</th>
                    <th className="p-2 border-r border-neutral-300 text-center">ডবল</th>
                    <th className="p-2 border-r border-neutral-300 text-center">হাফ</th>
                    <th className="p-2 border-r border-neutral-300 text-right">কর্মদিবস</th>
                    <th className="p-2 border-r border-neutral-300 text-right">রেট</th>
                    <th className="p-2 border-r border-neutral-300 text-right">অর্জিত বেতন</th>
                    <th className="p-2 border-r border-neutral-300 text-right">অগ্রিম সমন্বয়</th>
                    <th className="p-2 border-r border-neutral-300 text-right">নিট পাওনা</th>
                    <th className="p-2 border-r border-neutral-300 text-right">পরিশোধ</th>
                    <th className="p-2 text-right">বকেয়া</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300">
                  {settlementData.workers.map((w, idx) => (
                    <tr key={w.workerId} className="border-b border-neutral-200">
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">
                        {toBanglaNumber(idx + 1)}
                      </td>
                      <td className="p-2 border-r border-neutral-300 font-bold text-neutral-900">
                        {w.workerName}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">{toBanglaNumber(w.sheetCount)}</td>
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">{toBanglaNumber(w.doubleCount)}</td>
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">{toBanglaNumber(w.halfCount)}</td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-semibold">
                        {toBanglaNumber(w.totalWorkdays, 1)}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums">
                        {formatTaka(w.dailyWageRate, false)}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-bold">
                        {formatTaka(w.totalEarned, false)}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums text-red-700">
                        {formatTaka(w.advanceDeducted, false)}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-bold text-neutral-900">
                        {formatTaka(w.netPayable, false)}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-bold text-neutral-900">
                        {formatTaka(w.paidAmount, false)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatTaka(w.remainingBalance, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 border-t-2 border-neutral-900 font-bold text-neutral-900">
                    <td colSpan={2} className="p-2 border-r border-neutral-300">
                      মোট ({toBanglaNumber(settlementData.summary.totalWorkers)} জন)
                    </td>
                    <td colSpan={3} className="border-r border-neutral-300"></td>
                    <td className="p-2 border-r border-neutral-300 text-right tabular-nums">
                      {toBanglaNumber(settlementData.summary.totalWorkdays, 1)} দিন
                    </td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-bold">
                      {formatTaka(settlementData.summary.totalEarned, false)}
                    </td>
                    <td className="p-2 border-r border-neutral-300 text-right tabular-nums text-red-700 font-bold">
                      {formatTaka(settlementData.summary.totalAdvanceDeducted, false)}
                    </td>
                    <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-bold">
                      {formatTaka(settlementData.summary.totalNetPayable, false)}
                    </td>
                    <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-bold">
                      {formatTaka(settlementData.summary.totalPaid, false)}
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {formatTaka(settlementData.summary.totalRemainingBalance, false)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Combined Summary Box */}
            <div className="bg-neutral-50 p-4 border border-neutral-300 rounded text-xs space-y-1.5 print-avoid-break">
              <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-1 mb-2">
                সম্মিলিত বেতন সারসংক্ষেপ (আর্থিক নিয়ন্ত্রণ তথ্য):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>মোট অর্জিত মজুরি: <strong>{formatTaka(settlementData.summary.totalEarned)}</strong></div>
                <div>মোট অগ্রিম সমন্বয়: <strong className="text-red-700">{formatTaka(settlementData.summary.totalAdvanceDeducted)}</strong></div>
                <div>মোট নিট পাওনা: <strong>{formatTaka(settlementData.summary.totalNetPayable)}</strong></div>
                <div>মোট পরিশোধ: <strong>{formatTaka(settlementData.summary.totalPaid)}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Daily Summary Document */}
        {docType === 'daily_summary' && dailyData && (
          <div className="space-y-6">
            <div className="flex justify-between text-xs text-neutral-700 border-b border-neutral-200 pb-2">
              <div>তারিখ: <strong>{formatDateBangla(dailyData.date, true)}</strong></div>
              <div>মোট কর্মরত শ্রমিক: <strong>{toBanglaNumber(dailyData.logs.length)} জন</strong></div>
            </div>

            <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 font-bold">
                  <th className="p-2 border-r border-neutral-300 text-center w-8">ক্র.</th>
                  <th className="p-2 border-r border-neutral-300">শ্রমিকের নাম</th>
                  <th className="p-2 border-r border-neutral-300 text-center">সিট</th>
                  <th className="p-2 border-r border-neutral-300 text-center">ডবল</th>
                  <th className="p-2 border-r border-neutral-300 text-center">হাফ</th>
                  <th className="p-2 border-r border-neutral-300 text-right">কর্মদিবস</th>
                  <th className="p-2 border-r border-neutral-300 text-right">দৈনিক মজুরি রেট</th>
                  <th className="p-2 text-right">অর্জিত মজুরি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {dailyData.logs.map((log, idx) => {
                  const worker = dailyData.workers.find((w) => w.id === log.workerId);
                  return (
                    <tr key={log.id} className="border-b border-neutral-200">
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">{toBanglaNumber(idx + 1)}</td>
                      <td className="p-2 border-r border-neutral-300 font-bold">{worker?.name || 'শ্রমিক'}</td>
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">{toBanglaNumber(log.sheet)}</td>
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">{toBanglaNumber(log.double)}</td>
                      <td className="p-2 border-r border-neutral-300 text-center tabular-nums">{toBanglaNumber(log.half)}</td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums font-semibold">{toBanglaNumber(log.workdays, 1)} দিন</td>
                      <td className="p-2 border-r border-neutral-300 text-right tabular-nums">{formatTaka(log.dailyWageRate, false)}</td>
                      <td className="p-2 text-right tabular-nums font-bold">{formatTaka(log.earnedSalary, false)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-900">
                  <td colSpan={2} className="p-2 border-r border-neutral-300">সর্বমোট</td>
                  <td className="p-2 border-r border-neutral-300 text-center tabular-nums">
                    {toBanglaNumber(dailyData.logs.reduce((s, l) => s + l.sheet, 0))}
                  </td>
                  <td className="p-2 border-r border-neutral-300 text-center tabular-nums">
                    {toBanglaNumber(dailyData.logs.reduce((s, l) => s + l.double, 0))}
                  </td>
                  <td className="p-2 border-r border-neutral-300 text-center tabular-nums">
                    {toBanglaNumber(dailyData.logs.reduce((s, l) => s + l.half, 0))}
                  </td>
                  <td className="p-2 border-r border-neutral-300 text-right tabular-nums">
                    {toBanglaNumber(dailyData.logs.reduce((s, l) => s + l.workdays, 0), 1)} দিন
                  </td>
                  <td className="border-r border-neutral-300"></td>
                  <td className="p-2 text-right tabular-nums">
                    {formatTaka(dailyData.logs.reduce((s, l) => s + l.earnedSalary, 0), false)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 3. Monthly Summary Document */}
        {docType === 'monthly_summary' && monthlyData && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="border-b border-neutral-200 pb-2 font-semibold">
              হিসাবের মাস: {monthlyData.monthStr}
            </div>

            <div className="space-y-2 border border-neutral-300 p-4 rounded">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span>মোট বিক্রয় ও বাগান আয়:</span>
                <span className="font-bold text-emerald-800">{formatTaka(monthlyData.totalIncome)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span>শ্রমিকদের মোট অর্জিত মজুরি ({toBanglaNumber(monthlyData.totalWorkdays, 1)} দিন):</span>
                <span className="font-semibold">{formatTaka(monthlyData.totalEarned)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span>বাগান পরিচালন খরচ (বাটি, চাকু, মেরামত ইত্যাদি):</span>
                <span className="font-semibold">{formatTaka(monthlyData.totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-base border-t-2 border-neutral-900">
                <span>প্রকৃত পরিচালন লাভ বা ক্ষতি:</span>
                <span className={monthlyData.netProfit >= 0 ? 'text-emerald-800' : 'text-red-700'}>
                  {formatTaka(monthlyData.netProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Signatures Area (For physical audit & vouchers) */}
        <div className="mt-16 pt-8 border-t border-neutral-300 grid grid-cols-3 text-center text-xs text-neutral-700 print-avoid-break">
          <div>
            <div className="border-t border-neutral-400 w-32 mx-auto pt-1 mb-1"></div>
            <span>হিসাব প্রস্তুতকারী</span>
          </div>
          <div>
            <div className="border-t border-neutral-400 w-32 mx-auto pt-1 mb-1"></div>
            <span>বাগান ম্যানেজার / সর্দার</span>
          </div>
          <div>
            <div className="border-t border-neutral-400 w-32 mx-auto pt-1 mb-1"></div>
            <span>মালিক / কর্তৃপক্ষ</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-[10px] text-neutral-400 border-t border-neutral-200 pt-3">
          রাবার বাগান হিসাব ব্যবস্থাপনা সফটওয়্যার দ্বারা স্বয়ংক্রিয়ভাবে তৈরি · মুদ্রণ তারিখ: {formatDateBangla(getTodayDateStr())}
        </div>
      </div>
    </div>
  );
};
