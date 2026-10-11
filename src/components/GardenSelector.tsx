/**
 * Screen 1: Garden Selector (প্রথম স্ক্রিন: বাগান নির্বাচন)
 * একাধিক বাগানের তালিকা, আর্থিক সংক্ষেপ ও প্রবেশ করার সুযোগ
 */

import React, { useState } from 'react';
import { Garden, AppData } from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  formatDateBangla,
  generateUniqueId,
  toBanglaNumber,
  getDaysBetweenDates,
  calculateAutomatedDailyTarget,
} from '../utils/banglaUtils';
import {
  Trees,
  Plus,
  ArrowRight,
  Calendar,
  Wallet,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Building2,
  ShieldCheck,
  Target,
  AlertTriangle,
} from 'lucide-react';

interface GardenSelectorProps {
  onSelectGarden: (garden: Garden) => void;
  appData: AppData;
  onRefreshData: () => void;
}

export const GardenSelector: React.FC<GardenSelectorProps> = ({
  onSelectGarden,
  appData,
  onRefreshData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [initialInvestment, setInitialInvestment] = useState<number>(1000000);
  const [additionalInvestment, setAdditionalInvestment] = useState<number>(0);
  const [targetStartDate, setTargetStartDate] = useState<string>('2026-05-01');
  const [targetEndDate, setTargetEndDate] = useState<string>('2026-11-17');
  const [targetToRecover, setTargetToRecover] = useState<number>(750000);
  const [dailyBaseTarget, setDailyBaseTarget] = useState<number>(3750);
  const [isTargetManuallyEdited, setIsTargetManuallyEdited] = useState<boolean>(false);
  const [annualTarget, setAnnualTarget] = useState<number>(1500000);
  const [salaryDivisor, setSalaryDivisor] = useState<number>(30);
  const [salaryCycleType, setSalaryCycleType] = useState<'15_days' | 'monthly'>('15_days');
  const [payoutDay, setPayoutDay] = useState<number>(16);
  const [notes, setNotes] = useState('');

  // Automated Planning Days & Target Calculation
  const planningDays = getDaysBetweenDates(targetStartDate, targetEndDate);
  const targetCalcResult = calculateAutomatedDailyTarget(targetToRecover, planningDays);

  const openAddModal = () => {
    setEditingGarden(null);
    setName(`বাগান নং ${appData.gardens.length + 1}`);
    setCode(`BG-0${appData.gardens.length + 1}`);
    setLocation('মৌলভীবাজার, সিলেট');
    setContractStartDate('2026-05-01');
    setContractEndDate('2027-04-30');
    setInitialInvestment(800000);
    setAdditionalInvestment(40000);
    setTargetStartDate('2026-05-01');
    setTargetEndDate('2026-11-17'); // 200 days approx
    setTargetToRecover(750000); // যেমন: ৳৭,৫০,০০০
    const days = getDaysBetweenDates('2026-05-01', '2026-11-17');
    const autoCalc = calculateAutomatedDailyTarget(750000, days);
    setDailyBaseTarget(autoCalc.isValid ? autoCalc.dailyTarget : 3750);
    setIsTargetManuallyEdited(false);
    setAnnualTarget(1500000);
    setSalaryDivisor(30);
    setSalaryCycleType('15_days');
    setPayoutDay(16);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (garden: Garden, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGarden(garden);
    setName(garden.name);
    setCode(garden.code);
    setLocation(garden.location);
    setContractStartDate(garden.contractStartDate);
    setContractEndDate(garden.contractEndDate);
    setInitialInvestment(garden.initialInvestment);
    setAdditionalInvestment(garden.additionalInvestment || 0);

    const tStart = garden.targetStartDate || garden.contractStartDate || '2026-05-01';
    const tEnd = garden.targetEndDate || garden.contractEndDate || '2027-04-30';
    setTargetStartDate(tStart);
    setTargetEndDate(tEnd);

    const defaultToRecover = garden.targetToRecover ?? (
      garden.initialInvestment + (garden.additionalInvestment || 0) - (garden.recoveredInvestment || 0)
    );
    const toRecoverVal = defaultToRecover > 0 ? defaultToRecover : 750000;
    setTargetToRecover(toRecoverVal);

    setDailyBaseTarget(garden.dailyBaseTarget || 5000);
    setIsTargetManuallyEdited(true); // preserve existing garden's target
    setAnnualTarget(garden.annualTarget || 1500000);
    setSalaryDivisor(garden.salaryDivisor || 30);
    setSalaryCycleType(garden.salaryCycleType || '15_days');
    setPayoutDay(garden.payoutDay || 16);
    setNotes(garden.notes || '');
    setIsModalOpen(true);
  };

  // Target Input Handlers with Auto Calculation
  const handleTargetStartDateChange = (val: string) => {
    setTargetStartDate(val);
    const days = getDaysBetweenDates(val, targetEndDate);
    if (days > 0 && !isTargetManuallyEdited) {
      const calc = calculateAutomatedDailyTarget(targetToRecover, days);
      if (calc.isValid) {
        setDailyBaseTarget(calc.dailyTarget);
      }
    }
  };

  const handleTargetEndDateChange = (val: string) => {
    setTargetEndDate(val);
    const days = getDaysBetweenDates(targetStartDate, val);
    if (days > 0 && !isTargetManuallyEdited) {
      const calc = calculateAutomatedDailyTarget(targetToRecover, days);
      if (calc.isValid) {
        setDailyBaseTarget(calc.dailyTarget);
      }
    }
  };

  const handleTargetToRecoverChange = (val: number) => {
    setTargetToRecover(val);
    const days = getDaysBetweenDates(targetStartDate, targetEndDate);
    if (days > 0 && !isTargetManuallyEdited) {
      const calc = calculateAutomatedDailyTarget(val, days);
      if (calc.isValid) {
        setDailyBaseTarget(calc.dailyTarget);
      }
    }
  };

  const handleResetToAutoTarget = () => {
    setIsTargetManuallyEdited(false);
    if (targetCalcResult.isValid) {
      setDailyBaseTarget(targetCalcResult.dailyTarget);
    }
  };

  const handleSaveGarden = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (planningDays <= 0) {
      alert('সতর্কতা: টার্গেট শেষের তারিখ অবশ্যই শুরুর তারিখের পরের হতে হবে (পরিকল্পনার দিন শূন্য বা ঋণাত্মক হতে পারবে না)।');
      return;
    }

    if (editingGarden) {
      const updated: Garden = {
        ...editingGarden,
        name: name.trim(),
        code: code.trim(),
        location: location.trim(),
        contractStartDate,
        contractEndDate,
        initialInvestment: Number(initialInvestment) || 0,
        additionalInvestment: Number(additionalInvestment) || 0,
        targetStartDate,
        targetEndDate,
        targetToRecover: Number(targetToRecover) || 0,
        dailyBaseTarget: Number(dailyBaseTarget) || 0,
        annualTarget: Number(annualTarget) || 1500000,
        salaryDivisor: Number(salaryDivisor) || 30,
        salaryCycleType,
        payoutDay: Number(payoutDay) || 16,
        notes: notes.trim(),
      };
      StorageService.saveGarden(updated);
    } else {
      const newGarden: Garden = {
        id: generateUniqueId('GDN'),
        name: name.trim(),
        code: code.trim() || `BG-${Date.now().toString().slice(-3)}`,
        location: location.trim() || 'সিলেট বিভাগ',
        contractStartDate: contractStartDate || '2026-05-01',
        contractEndDate: contractEndDate || '2027-04-30',
        initialInvestment: Number(initialInvestment) || 0,
        additionalInvestment: Number(additionalInvestment) || 0,
        targetStartDate: targetStartDate || contractStartDate || '2026-05-01',
        targetEndDate: targetEndDate || contractEndDate || '2027-04-30',
        targetToRecover: Number(targetToRecover) || 750000,
        annualTarget: Number(annualTarget) || 1500000,
        dailyBaseTarget: Number(dailyBaseTarget) || 3750,
        recoveredInvestment: 0,
        salaryDivisor: Number(salaryDivisor) || 30,
        salaryCycleType,
        payoutDay: Number(payoutDay) || 16,
        targetDeductsExpenses: true,
        categories: ['বাটি', 'চাকু', 'খাবার', 'পরিবহন', 'মালামাল', 'মেরামত', 'অন্যান্য'],
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      StorageService.saveGarden(newGarden);
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  const handleDeleteGarden = (gardenId: string, gardenName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `সতর্কতা: আপনি কি নিশ্চিতভাবে "${gardenName}" মুছে ফেলতে চান? এর সকল শ্রমিক ও লেনদেন স্থায়ীভাবে মুছে যাবে।`
      )
    ) {
      StorageService.deleteGarden(gardenId);
      onRefreshData();
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Banner / Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>অফলাইন সুরক্ষিত ও স্থায়ী হিসাব ডেটাবেস</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            বাগান নির্বাচন করুন
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            আপনার রাবার বাগান নির্বাচন করে দৈনিক হিসাব, শ্রমিক মজুরি, অগ্রিম ও লাভ-ক্ষতি পরিচালনা করুন।
          </p>
        </div>

        <button
          onClick={openAddModal}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 text-white rounded-lg text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বাগান যোগ করুন</span>
        </button>
      </div>

      {/* Garden Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appData.gardens.map((garden) => {
          // Calculate quick stats for this garden
          const workers = appData.workers.filter((w) => w.gardenId === garden.id);
          const activeWorkers = workers.filter((w) => w.isActive);
          const gardenIncomes = appData.incomes.filter((i) => i.gardenId === garden.id);
          const gardenExpenses = appData.expenses.filter((e) => e.gardenId === garden.id);
          const gardenLogs = appData.dailyWorkLogs.filter((l) => l.gardenId === garden.id);

          const totalIncome = gardenIncomes.reduce((sum, i) => sum + i.amount, 0);
          const totalExpense = gardenExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalWages = gardenLogs.reduce((sum, l) => sum + l.earnedSalary, 0);
          const totalInvestment = garden.initialInvestment + (garden.additionalInvestment || 0);
          const remainingInvestment = Math.max(0, totalInvestment - (garden.recoveredInvestment || 0));

          return (
            <div
              key={garden.id}
              onClick={() => onSelectGarden(garden)}
              className="group relative bg-white border border-neutral-200 rounded-xl p-6 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                      <Trees className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 group-hover:text-emerald-800 transition-colors">
                        {garden.name}
                      </h2>
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                        <span>{garden.code}</span>
                        <span>·</span>
                        <span>{garden.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => openEditModal(garden, e)}
                      type="button"
                      title="সম্পাদনা করুন"
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {appData.gardens.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteGarden(garden.id, garden.name, e)}
                        type="button"
                        title="মুছে ফেলুন"
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contract Dates */}
                <div className="bg-neutral-50 rounded-lg p-3 my-4 text-xs space-y-1.5 border border-neutral-100">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      চুক্তির মেয়াদ:
                    </span>
                    <span className="font-medium text-neutral-800">
                      {formatDateBangla(garden.contractStartDate)} থেকে {formatDateBangla(garden.contractEndDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                      সক্রিয় শ্রমিক:
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {activeWorkers.length} জন (মোট {workers.length} জন)
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 text-xs border-t border-neutral-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">মোট বিনিয়োগ:</span>
                    <span className="font-semibold text-neutral-900 tabular-nums">
                      {formatTaka(totalInvestment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">পুনরুদ্ধারকৃত মূলধন:</span>
                    <span className="font-medium text-emerald-700 tabular-nums">
                      {formatTaka(garden.recoveredInvestment || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">অবশিষ্ট বিনিয়োগ:</span>
                    <span className="font-medium text-amber-700 tabular-nums">
                      {formatTaka(remainingInvestment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-dashed border-neutral-200">
                    <span className="text-neutral-500">সর্বমোট বিক্রয়/আয়:</span>
                    <span className="font-bold text-neutral-900 tabular-nums">
                      {formatTaka(totalIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  দৈনিক টার্গেট: {formatTaka(garden.dailyBaseTarget || 5000)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
                  <span>বাগানে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Garden Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">
                {editingGarden ? 'বাগানের তথ্য সম্পাদন করুন' : 'নতুন বাগান যোগ করুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGarden} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    বাগানের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="বাগান নং ৪"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    বাগানের কোড / আইডি
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="BG-04"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  অবস্থান / ঠিকানা
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="শ্রীমঙ্গল, মৌলভীবাজার"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    চুক্তি শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    চুক্তি শেষের তারিখ
                  </label>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    প্রাথমিক বিনিয়োগ (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    অতিরিক্ত বিনিয়োগ (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={additionalInvestment}
                    onChange={(e) => setAdditionalInvestment(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                  />
                </div>
              </div>

              {/* স্বয়ংক্রিয় দৈনিক টার্গেট নির্ধারণ ব্লক */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <Target className="w-4 h-4 text-emerald-700" />
                    <span>স্বয়ংক্রিয় দৈনিক নিট টার্গেট নির্ধারণ</span>
                  </div>
                  {planningDays > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 tabular-nums">
                      পরিকল্পনার দিন: {toBanglaNumber(planningDays)} দিন
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      টার্গেট শুরুর তারিখ *
                    </label>
                    <input
                      type="date"
                      required
                      value={targetStartDate}
                      onChange={(e) => handleTargetStartDateChange(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      টার্গেট শেষের তারিখ *
                    </label>
                    <input
                      type="date"
                      required
                      value={targetEndDate}
                      onChange={(e) => handleTargetEndDateChange(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    এখনো যে টাকা উদ্ধার করতে হবে (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={targetToRecover}
                    onChange={(e) => handleTargetToRecoverChange(Number(e.target.value))}
                    placeholder="যেমন: ৭৫০০০০"
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums font-bold"
                  />
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    উদাহরণ: ৳৭,৫০,০০০ উদ্ধার করতে হবে।
                  </div>
                </div>

                {/* Date Validation Alert if invalid */}
                {!targetCalcResult.isValid && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{targetCalcResult.error}</span>
                  </div>
                )}

                {/* Daily Net Target input and dynamic formula preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-neutral-800">
                        দৈনিক গড় নিট টার্গেট (৳) *
                      </label>
                      {isTargetManuallyEdited && (
                        <button
                          type="button"
                          onClick={handleResetToAutoTarget}
                          className="text-[10px] text-emerald-800 font-semibold hover:underline"
                        >
                          স্বয়ংক্রিয় হিসাবে রিসেট
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      required
                      value={dailyBaseTarget}
                      onChange={(e) => {
                        setDailyBaseTarget(Number(e.target.value));
                        setIsTargetManuallyEdited(true);
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-emerald-400 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums font-bold text-emerald-900"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="text-[11px] text-neutral-700 bg-white/90 p-2.5 rounded border border-emerald-200 space-y-0.5">
                      {planningDays > 0 ? (
                        <>
                          <div className="font-semibold text-emerald-950">
                            হিসাবের সূত্র:
                          </div>
                          <div>
                            {formatTaka(targetToRecover)} ÷ {toBanglaNumber(planningDays)} দিন ={' '}
                            <span className="font-bold text-emerald-800">
                              {formatTaka(targetCalcResult.dailyTarget)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-red-600">তারিখ সঠিক নয় (দিন গণনা সম্ভব নয়)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    বেতন বিভাজক দিন (ডিফল্ট ৩০)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={salaryDivisor}
                    onChange={(e) => setSalaryDivisor(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    বেতন প্রদানের চক্র
                  </label>
                  <select
                    value={salaryCycleType}
                    onChange={(e) => setSalaryCycleType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="15_days">১৫ দিনের চক্র (ডিফল্ট)</option>
                    <option value="monthly">মাসিক চক্র</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    বেতন দেওয়ার দিন (মাসের)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={payoutDay}
                    onChange={(e) => setPayoutDay(Number(e.target.value))}
                    placeholder="16"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  অন্যান্য বিবরণ বা নোট
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="গাছের সংখ্যা, লিজের শর্ত বা অন্যান্য তথ্য..."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
