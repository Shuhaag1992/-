/**
 * Menu 9: Reports & Backup (৯. রিপোর্ট ও ব্যাকআপ)
 * সকল রিপোর্ট মুদ্রণ, সম্পূর্ণ ডেটা এক্সপোর্ট ও ইমপোর্ট ব্যাকআপ
 */

import React, { useState, useRef } from 'react';
import {
  Garden,
  Worker,
  DailyWorkLog,
  Expense,
  Income,
  SalarySettlement,
  AppData,
} from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
} from '../utils/banglaUtils';
import {
  FileText,
  Download,
  Upload,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Database,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsAndBackupProps {
  garden: Garden;
  workers: Worker[];
  dailyLogs: DailyWorkLog[];
  expenses: Expense[];
  incomes: Income[];
  settlements: SalarySettlement[];
  onRefreshData: () => void;
  onOpenPrintView: (docType: any, data?: any) => void;
}

export const ReportsAndBackup: React.FC<ReportsAndBackupProps> = ({
  garden,
  workers,
  dailyLogs,
  expenses,
  incomes,
  settlements,
  onRefreshData,
  onOpenPrintView,
}) => {
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [selectedReportDate, setSelectedReportDate] = useState<string>(getTodayDateStr());
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>(
    getTodayDateStr().slice(0, 7)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Export Data
  const handleExportBackup = () => {
    const dataString = StorageService.exportData();
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = getTodayDateStr().replace(/-/g, '');
    a.href = url;
    a.download = `rubber_garden_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setImportStatus({
      success: true,
      message: 'সম্পূর্ণ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!',
    });
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Handle File Upload for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (
        window.confirm(
          'সতর্কতা: ব্যাকআপ ফাইলটি রিস্টোর করলে বর্তমান ডেটা প্রতিস্থাপিত হবে। আপনি কি চালিয়ে যেতে চান?'
        )
      ) {
        const result = StorageService.importData(content);
        setImportStatus(result);
        if (result.success) {
          onRefreshData();
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset to verified test data
  const handleResetSampleData = () => {
    if (
      window.confirm(
        'আপনি কি নিশ্চিতভাবে নমুনা পরীক্ষামূলক ডেটা (বাগান নং ১, ২, ৩ এবং কর্মী) পুনরায় লোড করতে চান?'
      )
    ) {
      StorageService.resetToSampleData();
      onRefreshData();
      setImportStatus({
        success: true,
        message: 'নমুনা ডেটা সফলভাবে রিস্টোর করা হয়েছে!',
      });
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  // Trigger Daily Summary Print
  const handlePrintDaily = () => {
    const logs = StorageService.getDailyLogs(garden.id, selectedReportDate);
    onOpenPrintView('daily_summary', {
      date: selectedReportDate,
      logs,
      workers,
    });
  };

  // Trigger Monthly Summary Print
  const handlePrintMonthly = () => {
    const monthLogs = dailyLogs.filter((l) => l.date.startsWith(selectedReportMonth));
    const monthExp = expenses.filter((e) => e.date.startsWith(selectedReportMonth));
    const monthInc = incomes.filter((i) => i.date.startsWith(selectedReportMonth));

    const totalWorkdays = monthLogs.reduce((s, l) => s + l.workdays, 0);
    const totalEarned = monthLogs.reduce((s, l) => s + l.earnedSalary, 0);
    const totalExpenses = monthExp.reduce((s, e) => s + e.amount, 0);
    const totalIncome = monthInc.reduce((s, i) => s + i.amount, 0);

    onOpenPrintView('monthly_summary', {
      monthStr: selectedReportMonth,
      totalWorkdays,
      totalEarned,
      totalExpenses,
      totalIncome,
      netProfit: totalIncome - (totalEarned + totalExpenses),
    });
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>৯. রিপোর্ট ও ব্যাকআপ</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            রিপোর্ট মুদ্রণ, PDF ও ডেটা ব্যাকআপ
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            সকল হিসাবের A4 ফরম্যাটের প্রিন্ট রিপোর্ট তৈরি এবং কম্পিউটারে ব্যাকআপ সংরক্ষণ।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>ব্যাকআপ ফাইল ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {importStatus && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold border ${
            importStatus.success
              ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
              : 'bg-red-100 border-red-300 text-red-900'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Daily Summary PDF */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <Printer className="w-4 h-4" />
              <span>১. ডেইলি সামারি PDF</span>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              যেকোনো নির্দিষ্ট দিনের সিট, ডবল, হাফ, কর্মদিবস ও দৈনিক মজুরির A4 কপি।
            </p>
            <div className="space-y-1 mb-4">
              <label className="text-[11px] text-neutral-600 block">তারিখ নির্বাচন:</label>
              <input
                type="date"
                value={selectedReportDate}
                onChange={(e) => setSelectedReportDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handlePrintDaily}
            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট প্রিভিউ দেখুন</span>
          </button>
        </div>

        {/* 2. Monthly Summary PDF */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>২. মাসিক সামারি ও লাভ-ক্ষতি PDF</span>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              পুরো মাসের মোট বিক্রয়, মজুরি, পরিচালন খরচ ও নিট লাভ-ক্ষতির প্রাতিষ্ঠানিক প্রতিবেদন।
            </p>
            <div className="space-y-1 mb-4">
              <label className="text-[11px] text-neutral-600 block">মাস নির্বাচন:</label>
              <input
                type="month"
                value={selectedReportMonth}
                onChange={(e) => setSelectedReportMonth(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handlePrintMonthly}
            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>মাসিক রিপোর্ট মুদ্রণ</span>
          </button>
        </div>

        {/* 3. Latest Finalized Salary PDF */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <FileText className="w-4 h-4" />
              <span>৩. সর্বশেষ চূড়ান্ত বেতন শিট PDF</span>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              ১৫ দিন বা মাসের অনুমোদিত বেতন পর্বের ভাউচার ও ব্যক্তিগত স্বাক্ষর শিট।
            </p>
            <div className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-100 mb-4">
              সংরক্ষিত পে-রোল: {toBanglaNumber(settlements.length)} টি পর্ব
            </div>
          </div>
          <button
            type="button"
            disabled={settlements.length === 0}
            onClick={() => {
              if (settlements.length > 0) {
                onOpenPrintView('salary_settlement', settlements[0]);
              }
            }}
            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>সর্বশেষ পে-রোল প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Backup & Data Restore Section */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
          <Database className="w-5 h-5 text-emerald-800" />
          <h3 className="text-base font-bold text-neutral-900">
            ডেটা সংরক্ষণ, ব্যাকআপ ও পুনরুদ্ধার ব্যবস্থাপনা
          </h3>
        </div>

        {/* Local Storage Security Notice */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">গুরুত্বপূর্ণ নিরাপত্তা পরামর্শ:</div>
            <p className="leading-relaxed">
              আপনার সমস্ত হিসাব ব্রাউজারের লোকাল স্টোরেজে স্থায়ীভাবে জমা থাকছে। তবে ব্রাউজার ক্যাশ বা হিস্ট্রি ডিলিট করলে কিংবা ডিভাইস পরিবর্তন করলে তথ্য হারানোর ঝুঁকি থাকে। তাই প্রতি সপ্তাহে বা মাসে &apos;ব্যাকআপ ফাইল ডাউনলোড&apos; করে নিজের ফোন, পেনড্রাইভ বা কম্পিউটারে সংরক্ষণ করার পরামর্শ দেওয়া হচ্ছে।
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Export */}
          <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-neutral-900 text-xs mb-1">
                সম্পূর্ণ ব্যাকআপ ডাউনলোড (Export)
              </div>
              <p className="text-[11px] text-neutral-500 mb-3">
                সকল বাগান, শ্রমিক, কাজের খতিয়ান ও পেমেন্টের JSON ব্যাকআপ ফাইল।
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ডাউনলোড করুন</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-neutral-900 text-xs mb-1">
                ব্যাকআপ রিস্টোর (Import & Restore)
              </div>
              <p className="text-[11px] text-neutral-500 mb-3">
                পূর্বে সেভ করা JSON ফাইল আপলোড করে হিসাব পুনরুদ্ধার করুন।
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-white border border-neutral-300 text-neutral-800 rounded-md text-xs font-semibold hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ফাইল সিলেক্ট করে রিস্টোর</span>
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-neutral-900 text-xs mb-1">
                নমুনা টেস্ট ডেটা রিলোড (Reset)
              </div>
              <p className="text-[11px] text-neutral-500 mb-3">
                বাগান ১, ২, ৩ ও পরীক্ষামূলক শ্রমিকদের তৈরি করা ডেটাসেট।
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSampleData}
              className="w-full py-2 bg-white border border-red-300 text-red-700 rounded-md text-xs font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>নমুনা ডেটায় রিসেট</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
