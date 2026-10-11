/**
 * Menu 3: Daily Summary (৩. ডেইলি সামারি)
 * নির্বাচিত তারিখের বিস্তারিত সামারি, মোট কর্মদিবস ও মজুরি, প্রিন্ট ও PDF
 */

import React, { useState } from 'react';
import { Garden, Worker, DailyWorkLog } from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
} from '../utils/banglaUtils';
import {
  ClipboardList,
  Printer,
  Calendar,
  Edit,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Users,
  Coins,
} from 'lucide-react';

interface DailySummaryProps {
  garden: Garden;
  workers: Worker[];
  onNavigateToEditDate?: (date: string) => void;
  onPrintSummary?: (date: string) => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  garden,
  workers,
  onNavigateToEditDate,
  onPrintSummary,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());

  const logs = StorageService.getDailyLogs(garden.id, selectedDate);

  // Worker lookup map
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Summaries
  const totalSheet = logs.reduce((sum, l) => sum + (l.sheet || 0), 0);
  const totalDouble = logs.reduce((sum, l) => sum + (l.double || 0), 0);
  const totalHalf = logs.reduce((sum, l) => sum + (l.half || 0), 0);
  const totalWorkdays = logs.reduce((sum, l) => sum + (l.workdays || 0), 0);
  const totalEarnedSalary = logs.reduce((sum, l) => sum + (l.earnedSalary || 0), 0);

  const handlePrint = () => {
    if (onPrintSummary) {
      onPrintSummary(selectedDate);
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
            <span>৩. ডেইলি সামারি</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            দৈনিক কাজের সারাংশ ও প্রতিবেদন
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            যেকোনো তারিখের সিট, ডবল, হাফ এবং মোট অর্জিত মজুরির বিস্তারিত চিত্র।
          </p>
        </div>

        {/* Date picker & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              title="পূর্ববর্তী দিন"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs sm:text-sm font-semibold text-neutral-900 bg-transparent border-0 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => changeDate(1)}
              title="পরবর্তী দিন"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {onNavigateToEditDate && (
            <button
              type="button"
              onClick={() => onNavigateToEditDate(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-neutral-500" />
              <span>হিসাব সংশোধন</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট / PDF ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards for the Day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 block">মোট কর্মরত শ্রমিক</span>
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
            {toBanglaNumber(logs.length)} জন
          </span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 block">মোট কর্মদিবস</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-800 tabular-nums mt-1 block">
            {toBanglaNumber(totalWorkdays, 1)} দিন
          </span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 block">কাজের ধরন অনুপাত</span>
          <span className="text-xs font-semibold text-neutral-700 mt-2 block tabular-nums">
            সিট: {toBanglaNumber(totalSheet)} · ডবল: {toBanglaNumber(totalDouble)} · হাফ: {toBanglaNumber(totalHalf)}
          </span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 block">মোট অর্জিত শ্রমিক মজুরি</span>
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
            {formatTaka(totalEarnedSalary)}
          </span>
        </div>
      </div>

      {/* Printable Area Card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {/* Document Header preview */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">
              {garden.name} — দৈনিক মজুরি ও কাজের বিবরণ
            </h3>
            <div className="text-xs text-neutral-500 mt-0.5">
              তারিখ: <span className="font-semibold text-neutral-800">{formatDateBangla(selectedDate, true)}</span> · অবস্থান: {garden.location}
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            মুদ্রণ সময়: {formatDateBangla(getTodayDateStr())}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ClipboardList className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-neutral-800">
              {formatDateBangla(selectedDate)} তারিখে কোনো কাজের এন্ট্রি নেই
            </h4>
            <p className="text-xs text-neutral-500 mt-1">
              &apos;১. দৈনিক হিসাব&apos; মেনু থেকে এই তারিখের কাজ এন্ট্রি করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-semibold">
                  <th className="py-3 px-3 w-12 text-center">ক্র.নং</th>
                  <th className="py-3 px-4 min-w-[180px]">শ্রমিকের নাম</th>
                  <th className="py-3 px-3 text-center min-w-[70px]">সিট</th>
                  <th className="py-3 px-3 text-center min-w-[70px]">ডবল</th>
                  <th className="py-3 px-3 text-center min-w-[70px]">হাফ</th>
                  <th className="py-3 px-4 text-right min-w-[100px]">মোট কর্মদিবস</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">দৈনিক রেট</th>
                  <th className="py-3 px-4 text-right min-w-[130px]">দৈনিক অর্জিত মজুরি</th>
                  <th className="py-3 px-4 min-w-[140px]">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {logs.map((log, idx) => {
                  const worker = workerMap.get(log.workerId);
                  const workerName = worker ? worker.name : 'অজ্ঞাত শ্রমিক';

                  return (
                    <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3 text-center text-neutral-500 tabular-nums">
                        {toBanglaNumber(idx + 1)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        {workerName}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {toBanglaNumber(log.sheet)}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {toBanglaNumber(log.double)}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {toBanglaNumber(log.half)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-900 tabular-nums">
                        {toBanglaNumber(log.workdays, 1)} দিন
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600 tabular-nums">
                        {formatTaka(log.dailyWageRate)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800 tabular-nums">
                        {formatTaka(log.earnedSalary)}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-xs">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-100 border-t-2 border-neutral-300 font-bold text-neutral-900">
                  <td colSpan={2} className="py-3.5 px-4">
                    সর্বমোট ({toBanglaNumber(logs.length)} জন শ্রমিক)
                  </td>
                  <td className="py-3.5 px-3 text-center tabular-nums text-emerald-900">
                    {toBanglaNumber(totalSheet)}
                  </td>
                  <td className="py-3.5 px-3 text-center tabular-nums text-emerald-900">
                    {toBanglaNumber(totalDouble)}
                  </td>
                  <td className="py-3.5 px-3 text-center tabular-nums text-emerald-900">
                    {toBanglaNumber(totalHalf)}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-900">
                    {toBanglaNumber(totalWorkdays, 1)} দিন
                  </td>
                  <td className="py-3.5 px-4 text-right"></td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-900 text-sm">
                    {formatTaka(totalEarnedSalary)}
                  </td>
                  <td className="py-3.5 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
