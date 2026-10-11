/**
 * Menu 8: Salary Settlement & Payment (৮. বেতন ও পেমেন্ট হিসাব)
 * ১৫ দিনের ও মাসিক বেতন পর্ব, অগ্রিম সমন্বয়, আংশিক পেমেন্ট ও বকেয়া হিসাব
 */

import React, { useState, useEffect } from 'react';
import {
  Garden,
  Worker,
  DailyWorkLog,
  SalarySettlement,
  WorkerSettlementDetail,
  PaymentStatus,
} from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
  generateUniqueId,
  calculateDailyWage,
} from '../utils/banglaUtils';
import {
  Banknote,
  CheckCircle2,
  Calendar,
  Printer,
  FileText,
  AlertCircle,
  Clock,
  History,
  ShieldCheck,
} from 'lucide-react';

interface SalarySettlementViewProps {
  garden: Garden;
  workers: Worker[];
  onRefreshData: () => void;
  onPrintSettlement?: (settlement: SalarySettlement) => void;
}

export const SalarySettlementView: React.FC<SalarySettlementViewProps> = ({
  garden,
  workers,
  onRefreshData,
  onPrintSettlement,
}) => {
  // Period mode: 15_days or monthly
  const [periodType, setPeriodType] = useState<'15_days' | 'monthly' | 'custom'>('15_days');
  const [selectedFifteenHalf, setSelectedFifteenHalf] = useState<'first_half' | 'second_half'>('first_half');
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayDateStr().slice(0, 7)); // YYYY-MM
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Editable workers settlement state before finalization
  const [workerRows, setWorkerRows] = useState<WorkerSettlementDetail[]>([]);
  const [settlementSuccessMessage, setSettlementSuccessMessage] = useState<string | null>(null);

  // Past finalized settlements
  const pastSettlements = StorageService.getSettlements(garden.id).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  // Set default dates when period type or month changes
  useEffect(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    if (periodType === '15_days') {
      if (selectedFifteenHalf === 'first_half') {
        setStartDate(`${selectedMonth}-01`);
        setEndDate(`${selectedMonth}-15`);
      } else {
        setStartDate(`${selectedMonth}-16`);
        setEndDate(`${selectedMonth}-${String(lastDayOfMonth).padStart(2, '0')}`);
      }
    } else if (periodType === 'monthly') {
      setStartDate(`${selectedMonth}-01`);
      setEndDate(`${selectedMonth}-${String(lastDayOfMonth).padStart(2, '0')}`);
    }
  }, [periodType, selectedFifteenHalf, selectedMonth]);

  // Recalculate preview whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      calculateSettlementPreview();
    }
  }, [startDate, endDate, garden.id, workers]);

  const calculateSettlementPreview = () => {
    const logs = StorageService.getDailyLogsForRange(garden.id, startDate, endDate);

    const rows: WorkerSettlementDetail[] = workers
      .filter((w) => w.isActive)
      .map((worker) => {
        const workerLogs = logs.filter((l) => l.workerId === worker.id);

        const sheetCount = workerLogs.reduce((sum, l) => sum + (l.sheet || 0), 0);
        const doubleCount = workerLogs.reduce((sum, l) => sum + (l.double || 0), 0);
        const halfCount = workerLogs.reduce((sum, l) => sum + (l.half || 0), 0);
        const totalWorkdays = workerLogs.reduce((sum, l) => sum + (l.workdays || 0), 0);
        const totalEarned = workerLogs.reduce((sum, l) => sum + (l.earnedSalary || 0), 0);
        const wageRate = calculateDailyWage(worker.monthlySalary, garden.salaryDivisor || 30);

        // Fetch outstanding advance for this worker
        const outstandingAdv = StorageService.getWorkerOutstandingAdvance(worker.id);

        // Fetch past unsettled arrears from previous finalized settlements if any
        let previousArrears = 0;
        pastSettlements.forEach((s) => {
          const prevDetail = s.workers.find((w) => w.workerId === worker.id);
          if (prevDetail && prevDetail.remainingBalance > 0) {
            previousArrears += prevDetail.remainingBalance;
          }
        });

        // Default advance to deduct: whichever is smaller between earned salary and outstanding advance
        const defaultAdvanceDeduct = Math.min(totalEarned, outstandingAdv);
        const otherDeductions = 0;
        const netPayable = Math.max(
          0,
          totalEarned - defaultAdvanceDeduct - otherDeductions + previousArrears
        );

        return {
          workerId: worker.id,
          workerName: worker.name,
          sheetCount,
          doubleCount,
          halfCount,
          totalWorkdays,
          dailyWageRate: wageRate,
          totalEarned,
          totalOutstandingAdvance: outstandingAdv,
          advanceDeducted: defaultAdvanceDeduct,
          otherDeductions,
          previousBalance: previousArrears,
          netPayable,
          paidAmount: netPayable, // default to full payment
          remainingBalance: 0,
          paymentDate: getTodayDateStr(),
          paymentStatus: 'paid' as PaymentStatus,
          paymentMethod: 'নগদ',
          note: '',
        };
      });

    setWorkerRows(rows);
  };

  const handleRowChange = (
    workerId: string,
    field: 'advanceDeducted' | 'otherDeductions' | 'paidAmount' | 'paymentMethod' | 'note',
    value: any
  ) => {
    setWorkerRows((prev) =>
      prev.map((row) => {
        if (row.workerId === workerId) {
          const updated = { ...row, [field]: value };

          // Recalculate netPayable & remainingBalance
          const adv = Number(updated.advanceDeducted) || 0;
          const other = Number(updated.otherDeductions) || 0;
          const prevBal = Number(updated.previousBalance) || 0;
          const earned = Number(updated.totalEarned) || 0;

          const net = Math.max(0, earned - adv - other + prevBal);
          const paid = Number(updated.paidAmount) || 0;
          const remaining = Math.max(0, net - paid);

          let status: PaymentStatus = 'unpaid';
          if (paid >= net && net > 0) status = 'paid';
          else if (paid > 0 && paid < net) status = 'partial';
          else if (net === 0) status = 'paid';

          return {
            ...updated,
            netPayable: net,
            remainingBalance: remaining,
            paymentStatus: status,
          };
        }
        return row;
      })
    );
  };

  // Quick full payment button
  const handlePayFull = (workerId: string) => {
    setWorkerRows((prev) =>
      prev.map((r) => {
        if (r.workerId === workerId) {
          return {
            ...r,
            paidAmount: r.netPayable,
            remainingBalance: 0,
            paymentStatus: 'paid',
          };
        }
        return r;
      })
    );
  };

  // Summary Totals
  const totalWorkersCount = workerRows.length;
  const totalWorkdays = workerRows.reduce((sum, r) => sum + r.totalWorkdays, 0);
  const totalEarned = workerRows.reduce((sum, r) => sum + r.totalEarned, 0);
  const totalAdvanceDeducted = workerRows.reduce((sum, r) => sum + r.advanceDeducted, 0);
  const totalOtherDeductions = workerRows.reduce((sum, r) => sum + r.otherDeductions, 0);
  const totalNetPayable = workerRows.reduce((sum, r) => sum + r.netPayable, 0);
  const totalPaid = workerRows.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalRemainingBalance = workerRows.reduce((sum, r) => sum + r.remainingBalance, 0);

  // Finalize settlement
  const handleFinalizeSettlement = () => {
    if (workerRows.length === 0) {
      alert('হিসাব করার জন্য কোনো কর্মী পাওয়া যায়নি।');
      return;
    }

    if (
      !window.confirm(
        `আপনি কি নিশ্চিতভাবে এই বেতন হিসাব (${formatDateBangla(startDate)} হতে ${formatDateBangla(
          endDate
        )}) চূড়ান্ত অনুমোদন করতে চান? অনুমোদনের পর সমন্বিত অগ্রিম স্থায়ীভাবে লক হয়ে যাবে এবং পরবর্তীতে আর কাটা হবে না।`
      )
    ) {
      return;
    }

    const settlement: SalarySettlement = {
      id: generateUniqueId('SET'),
      gardenId: garden.id,
      periodType,
      startDate,
      endDate,
      settlementDate: getTodayDateStr(),
      workers: workerRows,
      summary: {
        totalWorkers: totalWorkersCount,
        totalWorkdays,
        totalEarned,
        totalAdvanceDeducted,
        totalOtherDeductions,
        totalNetPayable,
        totalPaid,
        totalRemainingBalance,
      },
      isFinalized: true,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveSettlement(settlement);
    onRefreshData();
    setSettlementSuccessMessage(
      `বেতন হিসাব সফলভাবে চূড়ান্ত করা হয়েছে! পরিশোধিত মোট: ${formatTaka(totalPaid)}`
    );
    setTimeout(() => setSettlementSuccessMessage(null), 5000);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>৮. বেতন ও পেমেন্ট হিসাব</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            বেতন নির্ধারণ, অগ্রিম কর্তন ও পরিশোধ
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            ১৫ দিনের চক্র বা পূর্ণ মাসের ভিত্তিতে অর্জিত বেতন, অগ্রিম সমন্বয় ও নিট পাওনা হিসাব।
          </p>
        </div>

        {/* Cycle Options */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPeriodType('15_days')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                periodType === '15_days'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              ১৫ দিনের বেতন
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('monthly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                periodType === 'monthly'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              মাসিক বেতন
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-700">মাস:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 border border-neutral-300 rounded-md focus:outline-hidden font-medium"
            />
          </div>

          {periodType === '15_days' && (
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-md border border-neutral-200">
              <button
                type="button"
                onClick={() => setSelectedFifteenHalf('first_half')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  selectedFifteenHalf === 'first_half'
                    ? 'bg-white text-emerald-900 font-bold shadow-xs'
                    : 'text-neutral-600'
                }`}
              >
                ১ থেকে ১৫ তারিখ
              </button>
              <button
                type="button"
                onClick={() => setSelectedFifteenHalf('second_half')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  selectedFifteenHalf === 'second_half'
                    ? 'bg-white text-emerald-900 font-bold shadow-xs'
                    : 'text-neutral-600'
                }`}
              >
                ১৬ থেকে শেষ দিন
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-md border border-neutral-200">
          নির্বাচিত বেতন পর্ব: <span className="font-bold text-neutral-900">{formatDateBangla(startDate)}</span> থেকে{' '}
          <span className="font-bold text-neutral-900">{formatDateBangla(endDate)}</span>
        </div>
      </div>

      {/* Success Notification */}
      {settlementSuccessMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{settlementSuccessMessage}</span>
        </div>
      )}

      {/* Calculation & Payroll Preview Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-neutral-900">
            বেতন শিট ও সমন্বয় তালিকা
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const dummySettlement: SalarySettlement = {
                  id: 'PREVIEW',
                  gardenId: garden.id,
                  periodType,
                  startDate,
                  endDate,
                  settlementDate: getTodayDateStr(),
                  workers: workerRows,
                  summary: {
                    totalWorkers: totalWorkersCount,
                    totalWorkdays,
                    totalEarned,
                    totalAdvanceDeducted,
                    totalOtherDeductions,
                    totalNetPayable,
                    totalPaid,
                    totalRemainingBalance,
                  },
                  isFinalized: false,
                  createdAt: new Date().toISOString(),
                };
                if (onPrintSettlement) onPrintSettlement(dummySettlement);
                else window.print();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>বেতন শিট প্রিন্ট / PDF</span>
            </button>
          </div>
        </div>

        {workerRows.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-neutral-500">
            নির্বাচিত পর্বে কোনো কর্মী বা কাজের রেকর্ড নেই
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-semibold">
                  <th className="py-3 px-3 w-10 text-center">ক্র.নং</th>
                  <th className="py-3 px-3 min-w-[140px]">শ্রমিকের নাম</th>
                  <th className="py-3 px-2 text-center">সিট</th>
                  <th className="py-3 px-2 text-center">ডবল</th>
                  <th className="py-3 px-2 text-center">হাফ</th>
                  <th className="py-3 px-3 text-right">কর্মদিবস</th>
                  <th className="py-3 px-3 text-right">অর্জিত বেতন</th>
                  <th className="py-3 px-3 text-right">বকেয়া অগ্রিম</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">অগ্রিম সমন্বয় (৳)</th>
                  <th className="py-3 px-3 text-right min-w-[100px]">নিট পাওনা</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">পরিশোধিত টাকা</th>
                  <th className="py-3 px-3 text-right min-w-[80px]">অবশিষ্ট বকেয়া</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {workerRows.map((row, idx) => (
                  <tr key={row.workerId} className="hover:bg-neutral-50/70 transition-colors">
                    {/* SL */}
                    <td className="py-2.5 px-3 text-center text-neutral-500 tabular-nums">
                      {toBanglaNumber(idx + 1)}
                    </td>

                    {/* Worker Name */}
                    <td className="py-2.5 px-3 font-semibold text-neutral-900">
                      <div>{row.workerName}</div>
                      <div className="text-[10px] text-neutral-400 tabular-nums">
                        দৈনিক রেট: {formatTaka(row.dailyWageRate)}
                      </div>
                    </td>

                    {/* Counts */}
                    <td className="py-2.5 px-2 text-center tabular-nums">{toBanglaNumber(row.sheetCount)}</td>
                    <td className="py-2.5 px-2 text-center tabular-nums">{toBanglaNumber(row.doubleCount)}</td>
                    <td className="py-2.5 px-2 text-center tabular-nums">{toBanglaNumber(row.halfCount)}</td>

                    {/* Workdays */}
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-neutral-900">
                      {toBanglaNumber(row.totalWorkdays, 1)} দিন
                    </td>

                    {/* Total Earned */}
                    <td className="py-2.5 px-3 text-right font-bold text-neutral-900 tabular-nums">
                      {formatTaka(row.totalEarned)}
                    </td>

                    {/* Outstanding advance */}
                    <td className="py-2.5 px-3 text-right tabular-nums text-amber-700">
                      {formatTaka(row.totalOutstandingAdvance)}
                    </td>

                    {/* Advance to Deduct (Input) */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={row.totalOutstandingAdvance}
                        value={row.advanceDeducted}
                        onChange={(e) =>
                          handleRowChange(row.workerId, 'advanceDeducted', Number(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 text-center font-bold text-red-700 border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                      />
                    </td>

                    {/* Net Payable */}
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800 tabular-nums">
                      {formatTaka(row.netPayable)}
                    </td>

                    {/* Paid Amount (Input) */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number"
                          min="0"
                          value={row.paidAmount}
                          onChange={(e) =>
                            handleRowChange(row.workerId, 'paidAmount', Number(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 text-center font-bold text-neutral-900 border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => handlePayFull(row.workerId)}
                          className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-1.5 py-1 rounded-md"
                          title="সম্পূর্ণ পরিশোধ"
                        >
                          ফুল
                        </button>
                      </div>
                    </td>

                    {/* Remaining Arrears */}
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-neutral-700">
                      {formatTaka(row.remainingBalance)}
                    </td>

                    {/* Status badge */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          row.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-800'
                            : row.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        {row.paymentStatus === 'paid'
                          ? 'পরিশোধিত'
                          : row.paymentStatus === 'partial'
                          ? 'আংশিক'
                          : 'বকেয়া'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Collective Summary Footer */}
              <tfoot>
                <tr className="bg-neutral-100 border-t-2 border-neutral-300 font-bold text-neutral-900 text-xs sm:text-sm">
                  <td colSpan={2} className="py-3 px-3">
                    সম্মিলিত মোট ({toBanglaNumber(totalWorkersCount)} জন শ্রমিক)
                  </td>
                  <td colSpan={3}></td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-900">
                    {toBanglaNumber(totalWorkdays, 1)} দিন
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-neutral-900">
                    {formatTaka(totalEarned)}
                  </td>
                  <td></td>
                  <td className="py-3 px-3 text-center tabular-nums text-red-700">
                    {formatTaka(totalAdvanceDeducted)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-900">
                    {formatTaka(totalNetPayable)}
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums text-emerald-900">
                    {formatTaka(totalPaid)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-neutral-900">
                    {formatTaka(totalRemainingBalance)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Finalize Action Bottom Bar */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-neutral-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>
              চূড়ান্ত অনুমোদন করার পর সমন্বয়কৃত অগ্রিম স্বয়ংক্রিয়ভাবে পরবর্তী পর্ব থেকে বাদ যাবে।
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinalizeSettlement}
            disabled={workerRows.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs disabled:opacity-50"
          >
            <Banknote className="w-4 h-4" />
            <span>বেতন হিসাব চূড়ান্ত করুন ও পেমেন্ট রেকর্ড সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>

      {/* Past Finalized Settlements List */}
      {pastSettlements.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500" />
            <span>পূর্ববর্তী চূড়ান্তকৃত বেতন পর্বের রেকর্ড</span>
          </h4>

          <div className="divide-y divide-neutral-200 text-xs sm:text-sm">
            {pastSettlements.map((s) => (
              <div
                key={s.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-neutral-900">
                    {formatDateBangla(s.startDate)} থেকে {formatDateBangla(s.endDate)}
                    <span className="text-neutral-400 font-normal ml-2">
                      ({s.periodType === '15_days' ? '১৫ দিনের চক্র' : 'মাসিক চক্র'})
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    শ্রমিক: {toBanglaNumber(s.summary.totalWorkers)} জন · মোট কর্মদিবস: {toBanglaNumber(s.summary.totalWorkdays, 1)} দিন · চূড়ান্ত তারিখ: {formatDateBangla(s.settlementDate)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-emerald-800 tabular-nums">
                      পরিশোধ: {formatTaka(s.summary.totalPaid)}
                    </div>
                    {s.summary.totalRemainingBalance > 0 && (
                      <div className="text-[11px] text-amber-700 tabular-nums">
                        বকেয়া: {formatTaka(s.summary.totalRemainingBalance)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onPrintSettlement) onPrintSettlement(s);
                      else window.print();
                    }}
                    className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                    title="রসিদ ও শীট মুদ্রণ"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
