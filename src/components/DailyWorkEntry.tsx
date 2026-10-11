/**
 * Menu 1: Daily Work Entry (১. দৈনিক হিসাব)
 * সিট, ডবল ও হাফ হিসাবের সঠিক নিয়ম অনুযায়ী দৈনিক কাজ এন্ট্রি
 */

import React, { useState, useEffect } from 'react';
import { Garden, Worker, DailyWorkLog } from '../types';
import { StorageService } from '../services/storageService';
import {
  calculateWorkdays,
  calculateDailyWage,
  calculateEarnedSalary,
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
  generateUniqueId,
} from '../utils/banglaUtils';
import {
  Calendar,
  Save,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Calculator,
} from 'lucide-react';

interface DailyWorkEntryProps {
  garden: Garden;
  workers: Worker[];
  onRefreshData: () => void;
}

interface WorkerWorkRow {
  workerId: string;
  name: string;
  monthlySalary: number;
  dailyWageRate: number;
  sheet: number;
  double: number;
  half: number;
  notes: string;
  existingLogId?: string;
}

export const DailyWorkEntry: React.FC<DailyWorkEntryProps> = ({
  garden,
  workers,
  onRefreshData,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return localStorage.getItem(`rubber_garden_daily_date_${garden.id}`) || getTodayDateStr();
  });
  const [rows, setRows] = useState<WorkerWorkRow[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(true);

  // Active workers for this garden
  const activeWorkers = workers.filter((w) => w.isActive);

  // Persist selected date
  useEffect(() => {
    localStorage.setItem(`rubber_garden_daily_date_${garden.id}`, selectedDate);
  }, [selectedDate, garden.id]);

  // Load existing logs whenever date or garden changes
  useEffect(() => {
    loadLogsForDate(selectedDate);
  }, [selectedDate, garden.id, workers]);

  const loadLogsForDate = (date: string) => {
    const existingLogs = StorageService.getDailyLogs(garden.id, date);

    const initialRows: WorkerWorkRow[] = activeWorkers.map((worker) => {
      const existing = existingLogs.find((l) => l.workerId === worker.id);
      const wageRate = existing
        ? existing.dailyWageRate
        : calculateDailyWage(worker.monthlySalary, garden.salaryDivisor || 30);

      return {
        workerId: worker.id,
        name: worker.name,
        monthlySalary: worker.monthlySalary,
        dailyWageRate: wageRate,
        sheet: existing ? existing.sheet : 1, // Default 1 regular sheet
        double: existing ? existing.double : 0,
        half: existing ? existing.half : 0,
        notes: existing?.notes || '',
        existingLogId: existing?.id,
      };
    });

    setRows(initialRows);
  };

  const handleRowChange = (
    workerId: string,
    field: 'sheet' | 'double' | 'half' | 'notes',
    value: any
  ) => {
    setRows((prev) => {
      const updated = prev.map((row) => {
        if (row.workerId === workerId) {
          return {
            ...row,
            [field]: value,
          };
        }
        return row;
      });

      // Instantly auto-save to storage so pressing back or switching tab never loses any work!
      const logsToSave: DailyWorkLog[] = updated.map((r) => {
        const workdays = calculateWorkdays(r.sheet, r.double, r.half);
        const earnedSalary = calculateEarnedSalary(workdays, r.dailyWageRate);
        return {
          id: r.existingLogId || generateUniqueId('LOG'),
          gardenId: garden.id,
          workerId: r.workerId,
          date: selectedDate,
          sheet: r.sheet,
          double: r.double,
          half: r.half,
          workdays,
          dailyWageRate: r.dailyWageRate,
          earnedSalary,
          notes: r.notes,
          updatedAt: new Date().toISOString(),
        };
      });

      StorageService.saveDailyLogs(logsToSave);
      setIsAutoSaved(true);
      return updated;
    });
  };

  const changeDateByDays = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Copy previous day's work
  const handleCopyPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().slice(0, 10);
    const prevLogs = StorageService.getDailyLogs(garden.id, prevDateStr);

    if (prevLogs.length === 0) {
      alert(`পূর্ববর্তী দিন (${formatDateBangla(prevDateStr)})-এ কোনো সংরক্ষিত কাজ পাওয়া যায়নি।`);
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        const found = prevLogs.find((l) => l.workerId === row.workerId);
        if (found) {
          return {
            ...row,
            sheet: found.sheet,
            double: found.double,
            half: found.half,
            notes: found.notes || '',
          };
        }
        return row;
      })
    );
    setSaveSuccessMessage(`পূর্ববর্তী দিন (${formatDateBangla(prevDateStr)}) থেকে কাজের তথ্য আনা হয়েছে।`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Batch Save all rows for selected date
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const logsToSave: DailyWorkLog[] = rows.map((row) => {
      const workdays = calculateWorkdays(row.sheet, row.double, row.half);
      const earnedSalary = calculateEarnedSalary(workdays, row.dailyWageRate);

      return {
        id: row.existingLogId || generateUniqueId('LOG'),
        gardenId: garden.id,
        workerId: row.workerId,
        date: selectedDate,
        sheet: row.sheet,
        double: row.double,
        half: row.half,
        workdays,
        dailyWageRate: row.dailyWageRate,
        earnedSalary,
        notes: row.notes,
        updatedAt: new Date().toISOString(),
      };
    });

    StorageService.saveDailyLogs(logsToSave);
    onRefreshData();
    setSaveSuccessMessage(
      `${formatDateBangla(selectedDate)} তারিখের মোট ${logsToSave.length} জন শ্রমিকের কাজ সফলভাবে সংরক্ষিত হয়েছে!`
    );
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Totals for this table
  const totalSheet = rows.reduce((sum, r) => sum + (r.sheet || 0), 0);
  const totalDouble = rows.reduce((sum, r) => sum + (r.double || 0), 0);
  const totalHalf = rows.reduce((sum, r) => sum + (r.half || 0), 0);
  const totalWorkdays = rows.reduce(
    (sum, r) => sum + calculateWorkdays(r.sheet, r.double, r.half),
    0
  );
  const totalEarnedSalary = rows.reduce(
    (sum, r) =>
      sum +
      calculateEarnedSalary(
        calculateWorkdays(r.sheet, r.double, r.half),
        r.dailyWageRate
      ),
    0
  );

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Date Navigation */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>১. দৈনিক কাজের হিসাব</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            দৈনিক কাজ এন্ট্রি ও মজুরি
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            সিট, ডবল ও হাফ কাজের ইনপুট দিন। স্বয়ংক্রিয়ভাবে মোট কর্মদিবস ও দৈনিক মজুরি নির্ধারিত হবে।
          </p>
        </div>

        {/* Date Selector and Fast Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => changeDateByDays(-1)}
              title="আগের দিন"
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
              onClick={() => changeDateByDays(1)}
              title="পরের দিন"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPreviousDay}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-neutral-500" />
            <span>আগের দিন থেকে আনুন</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFormulaGuide(!showFormulaGuide)}
            className="p-2 text-neutral-500 hover:text-neutral-800 rounded-lg border border-neutral-200 bg-white"
            title="কাজের দিন গণনার সূত্র দেখুন"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formula Guide Box */}
      {showFormulaGuide && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-700" />
              কর্মদিবস ও মজুরি গণনার নিয়মাবলী (বাগান নীতিমালা):
            </span>
            <button
              onClick={() => setShowFormulaGuide(false)}
              className="text-neutral-400 hover:text-neutral-700 font-normal"
            >
              বন্ধ করুন ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-neutral-800">
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100">
              <span className="font-semibold text-emerald-900">• ১টি সিট =</span> ১ কর্মদিবস
            </div>
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100">
              <span className="font-semibold text-emerald-900">• ১টি ডবল =</span> ২ কর্মদিবস
            </div>
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100">
              <span className="font-semibold text-emerald-900">• ১টি হাফ =</span> ০.৫ কর্মদিবস
            </div>
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100">
              <span className="font-semibold text-emerald-900">• সিট + ডবল =</span> ২ দিন
            </div>
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100">
              <span className="font-semibold text-emerald-900">• সিট + হাফ =</span> ১.৫ দিন
            </div>
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100">
              <span className="font-semibold text-emerald-900">• সিট + ডবল + হাফ =</span> ২.৫ দিন
            </div>
          </div>
          <div className="text-[11px] text-emerald-800 pt-1">
            * দৈনিক মজুরি = মাসিক বেতন ÷ {garden.salaryDivisor || 30} | দৈনিক অর্জিত মজুরি = মোট কর্মদিবস × দৈনিক মজুরি।
          </div>
        </div>
      )}

      {/* Success Banner */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Daily Work Table */}
      <form onSubmit={handleSaveAll} className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {rows.length === 0 ? (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800">কোনো সক্রিয় শ্রমিক নেই</h3>
            <p className="text-xs text-neutral-500 mt-1">
              দৈনিক কাজ এন্ট্রি করার জন্য প্রথমে &apos;শ্রমিক তালিকা&apos; থেকে নতুন শ্রমিক যোগ করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-semibold">
                  <th className="py-3 px-3 w-12 text-center">ক্র.নং</th>
                  <th className="py-3 px-4 min-w-[160px]">শ্রমিকের নাম ও বেতন রেট</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">সিট (১ দিন)</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">ডবল (২ দিন)</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">হাফ (০.৫ দিন)</th>
                  <th className="py-3 px-4 text-right min-w-[100px]">মোট কর্মদিবস</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">অর্জিত মজুরি</th>
                  <th className="py-3 px-3 min-w-[140px]">মন্তব্য / নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {rows.map((row, idx) => {
                  const workdays = calculateWorkdays(row.sheet, row.double, row.half);
                  const earnedSalary = calculateEarnedSalary(workdays, row.dailyWageRate);

                  return (
                    <tr
                      key={row.workerId}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* SL */}
                      <td className="py-3 px-3 text-center text-neutral-500 font-medium tabular-nums">
                        {toBanglaNumber(idx + 1)}
                      </td>

                      {/* Name & Wage info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{row.name}</div>
                        <div className="text-[11px] text-neutral-500 tabular-nums">
                          মাসিক: {formatTaka(row.monthlySalary)} · দৈনিক: {formatTaka(row.dailyWageRate)}
                        </div>
                      </td>

                      {/* Sheet (সিট) Input */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="1"
                            value={row.sheet}
                            onChange={(e) =>
                              handleRowChange(row.workerId, 'sheet', Number(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 text-center font-bold text-neutral-900 border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                          />
                        </div>
                      </td>

                      {/* Double (ডবল) Input */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="1"
                            value={row.double}
                            onChange={(e) =>
                              handleRowChange(row.workerId, 'double', Number(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 text-center font-bold text-neutral-900 border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                          />
                        </div>
                      </td>

                      {/* Half (হাফ) Input */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="1"
                            value={row.half}
                            onChange={(e) =>
                              handleRowChange(row.workerId, 'half', Number(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 text-center font-bold text-neutral-900 border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                          />
                        </div>
                      </td>

                      {/* Computed Workdays */}
                      <td className="py-3 px-4 text-right font-bold text-neutral-900 tabular-nums">
                        {toBanglaNumber(workdays, 1)} দিন
                      </td>

                      {/* Computed Daily Wage */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-800 tabular-nums">
                        {formatTaka(earnedSalary)}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={row.notes}
                          onChange={(e) =>
                            handleRowChange(row.workerId, 'notes', e.target.value)
                          }
                          placeholder="মন্তব্য..."
                          className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer with Totals */}
              <tfoot>
                <tr className="bg-neutral-100 border-t-2 border-neutral-300 font-bold text-neutral-900">
                  <td colSpan={2} className="py-3.5 px-4 text-neutral-800">
                    সর্বমোট ({toBanglaNumber(rows.length)} জন শ্রমিক)
                  </td>
                  <td className="py-3.5 px-3 text-center tabular-nums text-emerald-900">
                    {toBanglaNumber(totalSheet)} টি
                  </td>
                  <td className="py-3.5 px-3 text-center tabular-nums text-emerald-900">
                    {toBanglaNumber(totalDouble)} টি
                  </td>
                  <td className="py-3.5 px-3 text-center tabular-nums text-emerald-900">
                    {toBanglaNumber(totalHalf)} টি
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-900">
                    {toBanglaNumber(totalWorkdays, 1)} দিন
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-900 text-sm">
                    {formatTaka(totalEarnedSalary)}
                  </td>
                  <td className="py-3.5 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-600">
            <div>
              তারিখ: <span className="font-semibold text-neutral-900">{formatDateBangla(selectedDate, true)}</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>পরিবর্তন স্বয়ংক্রিয় সংরক্ষিত</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={rows.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 text-white rounded-lg text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>আজকের সম্পূর্ণ হিসাব সংরক্ষণ নিশ্চিত করুন</span>
          </button>
        </div>
      </form>
    </div>
  );
};
