/**
 * Menu 6: Investment & Target (৬. বাগান বিনিয়োগ ও টার্গেট)
 * মূলধন বিনিয়োগ, বার্ষিক ও দৈনিক ভিত্তি টার্গেট, স্বয়ংক্রিয় দৈনিক টার্গেট নির্ধারণ, ঘাটতি সমন্বয় ও মূলধন পুনরুদ্ধার
 */

import React, { useState, useEffect } from 'react';
import {
  Garden,
  InvestmentRecovery,
  DailyWorkLog,
  Expense,
  Income,
  TargetPlan,
} from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
  getRemainingDays,
  getDaysBetweenDates,
  generateUniqueId,
} from '../utils/banglaUtils';
import {
  Target,
  TrendingUp,
  Coins,
  Calendar,
  Calculator,
  Plus,
  History,
  ShieldAlert,
  Info,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
  Clock,
  Sparkles,
  Layers,
  Trash2,
  Edit2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface InvestmentTargetProps {
  garden: Garden;
  dailyLogs: DailyWorkLog[];
  expenses: Expense[];
  incomes: Income[];
  onRefreshData: () => void;
}

export const InvestmentTarget: React.FC<InvestmentTargetProps> = ({
  garden,
  dailyLogs,
  expenses,
  incomes,
  onRefreshData,
}) => {
  // Recovery Modal State
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryDate, setRecoveryDate] = useState(getTodayDateStr());
  const [recoveryAmount, setRecoveryAmount] = useState<number>(50000);
  const [recoveryNote, setRecoveryNote] = useState('');

  // Target Plans state
  const targetPlans = StorageService.getTargetPlans(garden.id);
  const activePlan = targetPlans.find((p) => p.isActive) || targetPlans[0] || null;

  // Selected plan to edit in the form
  const [editingPlanId, setEditingPlanId] = useState<string | null>(activePlan?.id || null);
  const [planTitle, setPlanTitle] = useState<string>(() => {
    return activePlan?.planTitle || `${garden.name} বার্ষিক নিট লক্ষ্য পরিকল্পনা`;
  });
  const [planStartDate, setPlanStartDate] = useState<string>(() => {
    return activePlan?.startDate || garden.targetStartDate || garden.contractStartDate || '2026-01-01';
  });
  const [planEndDate, setPlanEndDate] = useState<string>(() => {
    return activePlan?.endDate || garden.targetEndDate || garden.contractEndDate || '2026-12-31';
  });
  const [targetToRecover, setTargetToRecover] = useState<number>(() => {
    return activePlan?.targetToRecover ?? (garden.targetToRecover ?? 750000);
  });
  const [isManualOverride, setIsManualOverride] = useState<boolean>(() => {
    return activePlan?.isUserOverridden || false;
  });
  const [manualDailyTarget, setManualDailyTarget] = useState<number>(() => {
    return activePlan?.dailyBaseTarget ?? (garden.dailyBaseTarget || 3750);
  });
  const [planNotes, setPlanNotes] = useState<string>(() => activePlan?.notes || '');
  const [planSaveNotification, setPlanSaveNotification] = useState<string | null>(null);

  // Recalculation basis selector (anti-double-counting)
  const [recalcTrackingBasis, setRecalcTrackingBasis] = useState<'net_profit' | 'capital_withdrawn'>('net_profit');

  // Interactive Deficit Calculator State for testing
  const [testBaseTarget, setTestBaseTarget] = useState<number>(garden.dailyBaseTarget || 3750);
  const [testActualNet, setTestActualNet] = useState<number>(4000);
  const [testRemainingDays, setTestRemainingDays] = useState<number>(200);

  // Sync state if active plan changes
  useEffect(() => {
    if (activePlan && !editingPlanId) {
      setEditingPlanId(activePlan.id);
      setPlanTitle(activePlan.planTitle);
      setPlanStartDate(activePlan.startDate);
      setPlanEndDate(activePlan.endDate);
      setTargetToRecover(activePlan.targetToRecover);
      setIsManualOverride(!!activePlan.isUserOverridden);
      setManualDailyTarget(activePlan.dailyBaseTarget);
      setPlanNotes(activePlan.notes || '');
    }
  }, [activePlan, editingPlanId]);

  // Today and Remaining days
  const todayStr = getTodayDateStr();
  const contractRemainingDays = getRemainingDays(todayStr, garden.contractEndDate);

  // 1. Validation & Automated calculation for the Plan Form (Points 1, 2, 3, 4, 6)
  const planDays = getDaysBetweenDates(planStartDate, planEndDate);
  const isDateInvalid = !planStartDate || !planEndDate || planEndDate <= planStartDate || planDays <= 0;

  // Automated Formula:
  // দৈনিক গড় নিট টার্গেট = উদ্ধার করতে বাকি টাকা ÷ পরিকল্পনার অবশিষ্ট দিন
  const autoDailyTarget = !isDateInvalid && planDays > 0 && targetToRecover > 0
    ? Math.round((targetToRecover / planDays) * 100) / 100
    : 0;

  // Effective daily target displayed/used
  const effectiveDailyTarget = isManualOverride ? manualDailyTarget : autoDailyTarget;

  // Financial calculations
  const totalInvestment = garden.initialInvestment + (garden.additionalInvestment || 0);
  const recoveredInvestment = garden.recoveredInvestment || 0;
  const remainingInvestment = Math.max(0, totalInvestment - recoveredInvestment);
  const recoveryPercentage = totalInvestment > 0 ? (recoveredInvestment / totalInvestment) * 100 : 0;

  // Cumulative all-time operational metrics for this garden
  const totalIncomeAllTime = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpensesAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWagesAllTime = dailyLogs.reduce((sum, l) => sum + l.earnedSalary, 0);
  const netOperationalProfit = totalIncomeAllTime - (totalExpensesAllTime + totalWagesAllTime);

  // Investment Recoveries list
  const recoveries = StorageService.getInvestmentRecoveries(garden.id).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // 2. Real-time dynamic recalculation for the Active Plan (Point 5)
  // Determine date bounds of the active plan
  const currentPlanStart = activePlan ? activePlan.startDate : planStartDate;
  const currentPlanEnd = activePlan ? activePlan.endDate : planEndDate;
  const currentPlanTargetAmount = activePlan ? activePlan.targetToRecover : targetToRecover;

  // Period-specific operational figures
  const planIncomes = incomes.filter((i) => i.date >= currentPlanStart && i.date <= currentPlanEnd);
  const planExpenses = expenses.filter((e) => e.date >= currentPlanStart && e.date <= currentPlanEnd);
  const planLogs = dailyLogs.filter((l) => l.date >= currentPlanStart && l.date <= currentPlanEnd);
  const planRecoveries = recoveries.filter((r) => r.date >= currentPlanStart && r.date <= currentPlanEnd);

  const planTotalIncome = planIncomes.reduce((s, i) => s + i.amount, 0);
  const planTotalExpenses = planExpenses.reduce((s, e) => s + e.amount, 0);
  const planTotalWages = planLogs.reduce((s, l) => s + l.earnedSalary, 0);
  const planOperationalNet = planTotalIncome - (planTotalExpenses + planTotalWages);
  const planTotalCapitalWithdrawn = planRecoveries.reduce((s, r) => s + r.amount, 0);

  // Anti-double-counting: Select one authoritative basis for target progress
  const planRecordedAchievement = recalcTrackingBasis === 'net_profit'
    ? Math.max(0, planOperationalNet)
    : planTotalCapitalWithdrawn;

  const planRemainingToRecover = Math.max(0, currentPlanTargetAmount - planRecordedAchievement);
  const planDaysRemainingFromToday = Math.max(0, getDaysBetweenDates(todayStr, currentPlanEnd));
  const dynamicNextDailyTarget = planDaysRemainingFromToday > 0
    ? Math.round((planRemainingToRecover / planDaysRemainingFromToday) * 100) / 100
    : 0;

  // Calculate accumulated deficit/surplus across logged days for history table
  const activeDates = Array.from(
    new Set([
      ...dailyLogs.map((l) => l.date),
      ...expenses.map((e) => e.date),
      ...incomes.map((i) => i.date),
    ])
  ).sort();

  let accumulatedDeficit = 0;
  const targetHistory = activeDates.map((d) => {
    const dayIncome = incomes.filter((i) => i.date === d).reduce((s, i) => s + i.amount, 0);
    const dayExpense = expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0);
    const dayWages = dailyLogs.filter((l) => l.date === d).reduce((s, l) => s + l.earnedSalary, 0);

    const actualNet = dayIncome - (dayExpense + dayWages);
    const baseTarget = garden.dailyBaseTarget || effectiveDailyTarget || 3750;
    const remainingDaysOnDate = getRemainingDays(d, garden.contractEndDate);

    const dayDeficit = baseTarget - actualNet;
    accumulatedDeficit += dayDeficit;

    const dailyExtra = accumulatedDeficit > 0 ? Math.round(accumulatedDeficit / remainingDaysOnDate) : 0;
    const nextAdjustedTarget = baseTarget + dailyExtra;

    return {
      date: d,
      income: dayIncome,
      wages: dayWages,
      expenses: dayExpense,
      actualNet,
      baseTarget,
      dayDeficit,
      accumulatedDeficit,
      remainingDays: remainingDaysOnDate,
      dailyExtra,
      nextAdjustedTarget,
    };
  });

  // Handle Save / Apply Target Plan (Point 7)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateInvalid) return;
    if (targetToRecover <= 0) return;

    const planId = editingPlanId || generateUniqueId('PLAN');
    const newPlan: TargetPlan = {
      id: planId,
      gardenId: garden.id,
      planTitle: planTitle.trim() || `${garden.name} পরিকল্পনা`,
      startDate: planStartDate,
      endDate: planEndDate,
      targetToRecover: Number(targetToRecover),
      totalDays: planDays,
      dailyBaseTarget: effectiveDailyTarget,
      isUserOverridden: isManualOverride,
      isActive: true,
      notes: planNotes.trim(),
      createdAt: activePlan?.id === planId ? activePlan.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveTargetPlan(newPlan);
    setEditingPlanId(planId);
    setPlanSaveNotification(`টার্গেট পরিকল্পনা '${newPlan.planTitle}' সফলভাবে সংরক্ষিত ও বাগানে সক্রিয় করা হয়েছে!`);
    setTimeout(() => setPlanSaveNotification(null), 5000);
    onRefreshData();
  };

  // Start creating a brand new plan (Point 7: নতুন বছর বা নতুন বাগানের জন্য নতুন পরিকল্পনা)
  const handleStartNewPlan = () => {
    setEditingPlanId(null);
    setPlanTitle(`নতুন বছর/সিজন টার্গেট পরিকল্পনা`);
    setPlanStartDate(todayStr);
    // Default 1 year from today
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setPlanEndDate(nextYear.toISOString().slice(0, 10));
    setTargetToRecover(750000);
    setIsManualOverride(false);
    setManualDailyTarget(3750);
    setPlanNotes('');
  };

  // Select existing plan to view/edit
  const handleSelectPlanToEdit = (plan: TargetPlan) => {
    setEditingPlanId(plan.id);
    setPlanTitle(plan.planTitle);
    setPlanStartDate(plan.startDate);
    setPlanEndDate(plan.endDate);
    setTargetToRecover(plan.targetToRecover);
    setIsManualOverride(!!plan.isUserOverridden);
    setManualDailyTarget(plan.dailyBaseTarget);
    setPlanNotes(plan.notes || '');
  };

  // Set plan active
  const handleSetActivePlan = (planId: string) => {
    StorageService.setActiveTargetPlan(garden.id, planId);
    setEditingPlanId(planId);
    onRefreshData();
  };

  // Delete plan
  const handleDeletePlan = (planId: string) => {
    if (confirm('আপনি কি এই পরিকল্পনাটি মুছে ফেলতে চান? পুরোনো তথ্য অক্ষত রাখতে চাইলে এটি রেখে দিতে পারেন।')) {
      StorageService.deleteTargetPlan(planId);
      onRefreshData();
    }
  };

  // Handle Save Recovery
  const handleSaveRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryAmount || recoveryAmount <= 0) return;

    const newRecovery: InvestmentRecovery = {
      id: generateUniqueId('REC'),
      gardenId: garden.id,
      date: recoveryDate,
      amount: Number(recoveryAmount),
      notes: recoveryNote.trim() || 'বাস্তবে মূলধন পুনরুদ্ধার',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveInvestmentRecovery(newRecovery);
    setIsRecoveryModalOpen(false);
    setRecoveryAmount(50000);
    setRecoveryNote('');
    onRefreshData();
  };

  // Test Calculator Result
  const testDeficit = Math.max(0, testBaseTarget - testActualNet);
  const testDailyExtra = testRemainingDays > 0 ? Math.round((testDeficit / testRemainingDays) * 100) / 100 : 0;
  const testNextAdjustedTarget = testBaseTarget + testDailyExtra;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>৬. বাগান বিনিয়োগ ও টার্গেট</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            বিনিয়োগ পুনরুদ্ধার ও স্বয়ংক্রিয় দৈনিক টার্গেট ব্যবস্থাপনা
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            উদ্ধার করতে বাকি টাকা ও পরিকল্পনার অবশিষ্ট দিন অনুসারে দৈনিক গড় নিট টার্গেট স্বয়ংক্রিয়ভাবে নির্ধারিত হয়।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleStartNewPlan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300 rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0"
          >
            <FolderPlus className="w-4 h-4 text-emerald-700" />
            <span>নতুন পরিকল্পনা তৈরি</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRecoveryModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>মূলধন পুনরুদ্ধার যোগ</span>
          </button>
        </div>
      </div>

      {/* 4 Investment KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investment */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-neutral-500 block">মোট মূলধন বিনিয়োগ</span>
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
            {formatTaka(totalInvestment)}
          </span>
          <div className="text-[11px] text-neutral-500 mt-2">
            প্রাথমিক: {formatTaka(garden.initialInvestment)} + অতিরিক্ত: {formatTaka(garden.additionalInvestment || 0)}
          </div>
        </div>

        {/* Recovered Investment */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-neutral-500 block">বাস্তবে পুনরুদ্ধারকৃত মূলধন</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-800 tabular-nums mt-1 block">
            {formatTaka(recoveredInvestment)}
          </span>
          <div className="text-[11px] text-emerald-800 mt-2 font-medium">
            অগ্রগতি: {toBanglaNumber(recoveryPercentage, 1)}% পুনরুদ্ধার সম্পন্ন
          </div>
        </div>

        {/* Remaining Investment */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-neutral-500 block">অবশিষ্ট মূলধন বিনিয়োগ</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-800 tabular-nums mt-1 block">
            {formatTaka(remainingInvestment)}
          </span>
          <div className="text-[11px] text-neutral-500 mt-2">
            চুক্তির মেয়াদ শেষ: {formatDateBangla(garden.contractEndDate)}
          </div>
        </div>

        {/* Operational Net Profit */}
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
            মোট আয়: {formatTaka(totalIncomeAllTime)} - ব্যয়: {formatTaka(totalExpensesAllTime + totalWagesAllTime)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 1: স্বয়ংক্রিয় দৈনিক টার্গেট নির্ধারণ ফর্ম (POINTS 1 to 7) */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-emerald-600/30 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
              <Target className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  স্বয়ংক্রিয় দৈনিক নিট টার্গেট নির্ধারণ ফর্ম
                </h3>
                {editingPlanId ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    সম্পাদনা মোড
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                    নতুন পরিকল্পনা মোড
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                সূত্র: <strong className="font-semibold text-emerald-900">দৈনিক গড় নিট টার্গেট = উদ্ধার করতে বাকি টাকা ÷ পরিকল্পনার অবশিষ্ট দিন</strong>
              </p>
            </div>
          </div>

          {targetPlans.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-600 font-medium">সংরক্ষিত পরিকল্পনা:</label>
              <select
                value={editingPlanId || ''}
                onChange={(e) => {
                  const target = targetPlans.find((p) => p.id === e.target.value);
                  if (target) handleSelectPlanToEdit(target);
                }}
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-hidden text-neutral-800"
              >
                {targetPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.planTitle} {p.isActive ? '(সক্রিয়)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {planSaveNotification && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-900 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{planSaveNotification}</span>
          </div>
        )}

        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* পরিকল্পনার নাম */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                পরিকল্পনার নাম বা শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="যেমন: ২০২৬ বার্ষিক নিট লক্ষ্য পরিকল্পনা বা ২০২৬-২০২৭ সিজন টার্গেট"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            {/* ১. টার্গেট শুরুর তারিখ */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center justify-between">
                <span>১. টার্গেট শুরুর তারিখ *</span>
                <span className="text-[11px] font-normal text-neutral-500">
                  {formatDateBangla(planStartDate)}
                </span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            {/* ১. টার্গেট শেষের তারিখ */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center justify-between">
                <span>১. টার্গেট শেষের তারিখ *</span>
                <span className="text-[11px] font-normal text-neutral-500">
                  {formatDateBangla(planEndDate)}
                </span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={planEndDate}
                  onChange={(e) => setPlanEndDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs sm:text-sm focus:outline-hidden font-medium ${
                    isDateInvalid ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-emerald-600'
                  }`}
                />
              </div>
            </div>

            {/* ২. এখনো যে টাকা উদ্ধার করতে হবে */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center justify-between">
                <span>২. এখনো যে টাকা উদ্ধার করতে হবে (৳) *</span>
                <span className="text-[11px] font-bold text-emerald-800">
                  {formatTaka(targetToRecover)}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={targetToRecover || ''}
                  onChange={(e) => setTargetToRecover(Number(e.target.value))}
                  placeholder="যেমন: ৭৫০০০০"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs sm:text-sm tabular-nums font-bold text-neutral-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                উদাহরণ: ৳৭,৫০,০০০ (সব প্রযোজ্য খরচ বাদ দেওয়ার পরের নিট উদ্ধারযোগ্য টাকা)
              </span>
            </div>

            {/* ৩ & ৪. দৈনিক গড় নিট টার্গেট (স্বয়ংক্রিয় হিসাব ও ব্যবহারকারীর ম্যানুয়াল পরিবর্তন) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>৩. দৈনিক গড় নিট টার্গেট (৳) *</span>
                </label>
                {isManualOverride ? (
                  <button
                    type="button"
                    onClick={() => setIsManualOverride(false)}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>স্বয়ংক্রিয় হিসেবে রিসেট</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    স্বয়ংক্রিয় নির্ধারিত
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  required
                  disabled={isDateInvalid}
                  value={isDateInvalid ? '' : (isManualOverride ? manualDailyTarget : autoDailyTarget)}
                  onChange={(e) => {
                    setIsManualOverride(true);
                    setManualDailyTarget(Number(e.target.value));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs sm:text-sm tabular-nums font-extrabold focus:outline-hidden ${
                    isDateInvalid
                      ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                      : isManualOverride
                      ? 'bg-amber-50/70 text-amber-950 border-2 border-amber-400 focus:border-amber-500'
                      : 'bg-emerald-50/70 text-emerald-950 border-2 border-emerald-500 focus:border-emerald-600'
                  }`}
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">
                  {isDateInvalid
                    ? 'তারিখ সঠিক হলে স্বয়ংক্রিয় হিসাব বসবে'
                    : isManualOverride
                    ? '⚠️ আপনি কাস্টম টার্গেট নির্ধারণ করেছেন'
                    : `হিসাব: ৳${toBanglaNumber(targetToRecover)} ÷ ${toBanglaNumber(planDays)} দিন = ৳${toBanglaNumber(autoDailyTarget)}`}
                </span>
                {!isDateInvalid && (
                  <span className="font-bold text-emerald-800 tabular-nums">
                    {formatTaka(effectiveDailyTarget)} / দিন
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ৬. তারিখের ভুল ইনপুটের সতর্কবার্তা (Point 6) */}
          {isDateInvalid && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3 text-xs text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">তারিখ নির্বাচন সঠিক নয়:</span>
                <p className="text-amber-800 leading-relaxed">
                  টার্গেট শেষের তারিখ অবশ্যই শুরুর তারিখের পরবর্তী হতে হবে এবং পরিকল্পনার দিন সংখ্যা শূন্যের চেয়ে বেশি হতে হবে।
                  অবশিষ্ট দিন শূন্য বা ভুল থাকলে দৈনিক টার্গেটের ভুল হিসাব দেখানো হয় না।
                </p>
              </div>
            </div>
          )}

          {/* ৩. গণনা সারসংক্ষেপ ব্যানার (Point 3 formula explanation) */}
          {!isDateInvalid && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950">
                    পরিকল্পনার মোট মেয়াদ: <span className="tabular-nums text-emerald-800">{toBanglaNumber(planDays)} দিন</span>
                    {' '}· আজ থেকে অবশিষ্ট: <span className="tabular-nums text-neutral-700">{toBanglaNumber(Math.max(0, getDaysBetweenDates(todayStr, planEndDate)))} দিন</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    উদ্ধার করতে বাকি টাকা ৳{toBanglaNumber(targetToRecover)} ÷ পরিকল্পনার দিন {toBanglaNumber(planDays)} = দৈনিক গড় নিট টার্গেট ৳{toBanglaNumber(autoDailyTarget)}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-neutral-500 block">কার্যকরী দৈনিক নিট লক্ষ্য</span>
                <span className="text-base sm:text-lg font-bold text-emerald-900 tabular-nums">
                  {formatTaka(effectiveDailyTarget)}
                </span>
              </div>
            </div>
          )}

          {/* মন্তব্য / বিবরণ */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              পরিকল্পনার মন্তব্য বা অতিরিক্ত বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              placeholder="যেমন: বর্ষা মৌসুমের জন্য বিশেষ উদ্ধার লক্ষ্যমাত্রা বা লিজ শর্ত"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* ফর্ম সেভ বাটন */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200">
            <span className="text-xs text-neutral-500">
              * সংরক্ষণ করলে এই টার্গেটটি বাগান হিসাব, ডেলি সামারি ও মাসিক প্রতিবেদনে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
            </span>

            <div className="flex items-center gap-2">
              {editingPlanId && (
                <button
                  type="button"
                  onClick={handleStartNewPlan}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  বাতিল / নতুন শুরু
                </button>
              )}
              <button
                type="submit"
                disabled={isDateInvalid || targetToRecover <= 0}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-neutral-300 disabled:text-neutral-500 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>পরিকল্পনা সংরক্ষণ ও বাগানে প্রয়োগ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 2: প্রতিদিনের নিট অর্জন পরবর্তী লক্ষ্য পুনর্গণনা (POINT 5) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-800" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-neutral-900">
                প্রতিদিনের নিট অর্জন ও উদ্ধার পরবর্তী লক্ষ্য পুনর্গণনা (লাইভ আপডেট)
              </h4>
              <p className="text-xs text-neutral-500">
                কার্যকর পরিকল্পনা: <strong className="text-neutral-800 font-semibold">{activePlan?.planTitle || planTitle}</strong>
                {' '}· মেয়াদ: {formatDateBangla(currentPlanStart)} হতে {formatDateBangla(currentPlanEnd)}
              </p>
            </div>
          </div>

          {/* Anti-double-counting Toggle (Point 5: একই টাকা দুবার গণনা করবেন না) */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg text-xs">
            <span className="text-[11px] font-semibold text-neutral-500 px-2">পুনর্গণনার ভিত্তি:</span>
            <button
              type="button"
              onClick={() => setRecalcTrackingBasis('net_profit')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                recalcTrackingBasis === 'net_profit'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="পরিচালন নিট অর্জন = আয় − খরচ − মজুরি"
            >
              পরিচালন নিট অর্জন
            </button>
            <button
              type="button"
              onClick={() => setRecalcTrackingBasis('capital_withdrawn')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                recalcTrackingBasis === 'capital_withdrawn'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="বাস্তবে ড্রয়িংস বা ব্যাংকে উত্তোলিত টাকা"
            >
              বাস্তব মূলধন উত্তোলন
            </button>
          </div>
        </div>

        {/* Anti-double-counting rule explanation note */}
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-neutral-900">একই টাকা দুবার গণনা না করার নিশ্চয়তা:</strong> দৈনিক অর্জিত পরিচালন লাভ (বিক্রয় − খরচ − মজুরি) এবং বাস্তবে ড্রয়িংস উত্তোলনকে সম্পূর্ণ পৃথক হিসেবে গণনা করা হয়। একই নগদ টাকা যাতে দুইভাবে যোগ না হয় সেজন্য উপরের যেকোনো একটি বাস্তব ভিত্তির উপর পরবর্তী দিনগুলোর দৈনিক টার্গেট পুনর্গণনা করা হচ্ছে।
          </p>
        </div>

        {/* Live dynamic recalculation metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-neutral-500 block text-[11px]">পরিকল্পনার মোট লক্ষ্যমাত্রা</span>
            <span className="text-lg font-bold text-neutral-900 tabular-nums mt-0.5 block">
              {formatTaka(currentPlanTargetAmount)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              মোট দিন: {toBanglaNumber(getDaysBetweenDates(currentPlanStart, currentPlanEnd))} দিন
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-neutral-500 block text-[11px]">
              পরিকল্পনাকালীন অর্জিত / উদ্ধারকৃত
            </span>
            <span className="text-lg font-bold text-emerald-800 tabular-nums mt-0.5 block">
              {formatTaka(planRecordedAchievement)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              ভিত্তি: {recalcTrackingBasis === 'net_profit' ? 'পরিচালন নিট লাভ' : 'উত্তোলিত মূলধন'}
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-neutral-500 block text-[11px]">এখনো উদ্ধার করতে বাকি</span>
            <span className="text-lg font-bold text-amber-800 tabular-nums mt-0.5 block">
              {formatTaka(planRemainingToRecover)}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              আজ থেকে অবশিষ্ট: {toBanglaNumber(planDaysRemainingFromToday)} দিন
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-300">
            <span className="text-emerald-900 font-semibold block text-[11px]">
              পরবর্তী দিনগুলোর পুনর্গণিত দৈনিক টার্গেট
            </span>
            <span className="text-xl font-extrabold text-emerald-950 tabular-nums mt-0.5 block">
              {formatTaka(dynamicNextDailyTarget)}
            </span>
            <span className="text-[11px] text-emerald-800 mt-1 block font-medium">
              ঘাটতি/উদ্বৃত্ত সমন্বিত প্রয়োজনীয় হার
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 3: সংরক্ষিত সকল পরিকল্পনা তালিকা (POINT 7) */}
      {/* ========================================================================= */}
      {targetPlans.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-800" />
              <h4 className="text-sm font-bold text-neutral-900">
                সংরক্ষিত পরিকল্পনা সমূহ (সকল বছরের পরিকল্পনা অক্ষত ও সুরক্ষিত)
              </h4>
            </div>
            <span className="text-xs text-neutral-500">
              মোট: {toBanglaNumber(targetPlans.length)}টি পরিকল্পনা
            </span>
          </div>

          <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg overflow-hidden">
            {targetPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  plan.isActive ? 'bg-emerald-50/50' : 'bg-white hover:bg-neutral-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 text-sm">{plan.planTitle}</span>
                    {plan.isActive ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-800 text-white">
                        সক্রিয় পরিকল্পনা
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
                        সংরক্ষিত আর্কাইভ
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>মেয়াদ: {formatDateBangla(plan.startDate)} হতে {formatDateBangla(plan.endDate)}</span>
                    <span>·</span>
                    <span>মোট দিন: {toBanglaNumber(plan.totalDays)} দিন</span>
                    <span>·</span>
                    <span>উদ্ধার লক্ষ্য: {formatTaka(plan.targetToRecover)}</span>
                    {plan.notes && (
                      <>
                        <span>·</span>
                        <span className="italic">{plan.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-500 block">দৈনিক নিট টার্গেট</span>
                    <span className="font-bold text-emerald-900 tabular-nums text-sm">
                      {formatTaka(plan.dailyBaseTarget)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-200">
                    {!plan.isActive && (
                      <button
                        type="button"
                        onClick={() => handleSetActivePlan(plan.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded transition-colors"
                        title="এই পরিকল্পনাকে বাগানের সক্রিয় টার্গেট হিসেবে নির্ধারণ করুন"
                      >
                        সক্রিয় করুন
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectPlanToEdit(plan)}
                      className="p-1.5 text-neutral-600 hover:text-emerald-800 hover:bg-neutral-100 rounded transition-colors"
                      title="সম্পাদনা করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract & Target Formula Box */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Target className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                বাগানের মূল চুক্তি ও অবশিষ্ট দিন
              </h3>
              <p className="text-xs text-neutral-500">
                চুক্তি শুরু: {formatDateBangla(garden.contractStartDate)} · চুক্তি শেষ: {formatDateBangla(garden.contractEndDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-right">
              <span className="text-[11px] text-neutral-500 block">দৈনিক ভিত্তি টার্গেট</span>
              <span className="text-sm sm:text-base font-bold text-neutral-900 tabular-nums">
                {formatTaka(garden.dailyBaseTarget || effectiveDailyTarget || 3750)}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-right">
              <span className="text-[11px] text-emerald-800 block">চুক্তির অবশিষ্ট দিন</span>
              <span className="text-sm sm:text-base font-bold text-emerald-900 tabular-nums">
                {toBanglaNumber(contractRemainingDays)} দিন
              </span>
            </div>
          </div>
        </div>

        {/* Deficit Distribution Rule Details */}
        <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 space-y-2">
          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-700" />
            ঘাটতি সমন্বয় গণনার পদ্ধতি (বাগান নীতিমালা ধারা ১৪):
          </div>
          <p className="leading-relaxed">
            কোনো দিনে প্রকৃত অর্জনে ঘাটতি দেখা দিলে পুরো ঘাটতি পরবর্তী ১ দিনের মাথায় চাপিয়ে দেওয়া হয় না।
            বরং চুক্তির অবশিষ্ট দিনসংখ্যা দিয়ে ঘাটতি ভাগ করে দৈনিক সামান্য পরিমাণ অতিরিক্ত টার্গেট যোগ করা হয়।
          </p>
          <div className="font-mono bg-white p-2.5 rounded border border-neutral-200 text-emerald-950 font-semibold text-[11px]">
            দৈনিক অতিরিক্ত টার্গেট = ঘাটতি ÷ অবশিষ্ট দিন সংখ্যা | পরবর্তী দিনের সমন্বিত টার্গেট = ভিত্তি টার্গেট + দৈনিক অতিরিক্ত টার্গেট
          </div>
        </div>
      </div>

      {/* Interactive Deficit Formula Simulator (To directly verify Section 14 & Test 9) */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-800" />
            <h4 className="text-sm font-bold text-emerald-950">
              ঘাটতি সমন্বয় সিমুলেটর ও ক্যালকুলেটর (সরাসরি পরীক্ষা)
            </h4>
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold">
            ধারা ১৪ ও টেস্ট ৯ যাচাই
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              দৈনিক ভিত্তি টার্গেট (৳)
            </label>
            <input
              type="number"
              value={testBaseTarget}
              onChange={(e) => setTestBaseTarget(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md tabular-nums font-bold"
            />
          </div>
          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              প্রকৃত নিট অর্জন (৳)
            </label>
            <input
              type="number"
              value={testActualNet}
              onChange={(e) => setTestActualNet(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md tabular-nums font-bold"
            />
          </div>
          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              অবশিষ্ট দিন সংখ্যা (দিন)
            </label>
            <input
              type="number"
              value={testRemainingDays}
              onChange={(e) => setTestRemainingDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md tabular-nums font-bold"
            />
          </div>
        </div>

        {/* Calculation Result Callout */}
        <div className="p-3 bg-white border border-emerald-200 rounded-lg text-xs space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-neutral-600">
              ঘাটতি: <strong className="text-red-700 tabular-nums">{formatTaka(testDeficit)}</strong>
              {' '}(৳{toBanglaNumber(testBaseTarget)} − ৳{toBanglaNumber(testActualNet)})
            </span>
            <span className="text-neutral-600">
              দৈনিক অতিরিক্ত টার্গেট: <strong className="text-emerald-800 tabular-nums">{formatTaka(testDailyExtra)}</strong>
              {' '}(৳{toBanglaNumber(testDeficit)} ÷ {toBanglaNumber(testRemainingDays)} দিন)
            </span>
            <span className="font-bold text-emerald-950 text-sm">
              পরবর্তী দিনের সমন্বিত টার্গেট = <span className="tabular-nums text-emerald-800">{formatTaka(testNextAdjustedTarget)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Target History Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
          <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500" />
            <span>দৈনিক টার্গেট, প্রকৃত নিট অর্জন ও সমন্বয়ের ইতিহাস</span>
          </h4>
        </div>

        {targetHistory.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-neutral-500">
            এখনো কোনো দিনের কাজ বা আয়-ব্যয় রেকর্ড করা হয়নি
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-semibold">
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3 text-right">ভিত্তি টার্গেট</th>
                  <th className="py-2.5 px-3 text-right">বাগান আয়</th>
                  <th className="py-2.5 px-3 text-right">মজুরি ও খরচ</th>
                  <th className="py-2.5 px-3 text-right">প্রকৃত নিট অর্জন</th>
                  <th className="py-2.5 px-3 text-right">দৈনিক ঘাটতি/উদ্বৃত্ত</th>
                  <th className="py-2.5 px-3 text-center">অবশিষ্ট দিন</th>
                  <th className="py-2.5 px-3 text-right">পরবর্তী সমন্বিত টার্গেট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {targetHistory.map((item) => (
                  <tr key={item.date} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-neutral-900">
                      {formatDateBangla(item.date)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-neutral-700">
                      {formatTaka(item.baseTarget)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-medium text-emerald-800">
                      {formatTaka(item.income)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-neutral-600">
                      {formatTaka(item.wages + item.expenses)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                        item.actualNet >= 0 ? 'text-neutral-900' : 'text-red-700'
                      }`}
                    >
                      {formatTaka(item.actualNet)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                        item.dayDeficit > 0 ? 'text-red-700' : 'text-emerald-800'
                      }`}
                    >
                      {item.dayDeficit > 0 ? `-${formatTaka(item.dayDeficit)}` : `+${formatTaka(Math.abs(item.dayDeficit))}`}
                    </td>
                    <td className="py-2.5 px-3 text-center tabular-nums text-neutral-600">
                      {toBanglaNumber(item.remainingDays)} দিন
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-800">
                      {formatTaka(item.nextAdjustedTarget)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recoveries Ledger List */}
      {recoveries.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-neutral-900">
            বাস্তবে মূলধন প্রত্যাহারের রেকর্ড তালিকা
          </h4>
          <div className="divide-y divide-neutral-200 text-xs sm:text-sm">
            {recoveries.map((rec) => (
              <div key={rec.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-neutral-900">{formatDateBangla(rec.date)}</span>
                  <span className="text-neutral-500 ml-2">({rec.notes})</span>
                </div>
                <div className="font-bold text-emerald-800 tabular-nums">
                  {formatTaka(rec.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-fadeIn">
            <h3 className="text-base font-bold text-neutral-900 pb-3 border-b border-neutral-200">
              মূলধন পুনরুদ্ধার রেকর্ড করুন
            </h3>
            <form onSubmit={handleSaveRecovery} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  টাকা প্রত্যাহারের তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={recoveryDate}
                  onChange={(e) => setRecoveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  উত্তোলিত / পুনরুদ্ধারকৃত টাকা (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-hidden tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  মন্তব্য বা বিবরণ
                </label>
                <input
                  type="text"
                  value={recoveryNote}
                  onChange={(e) => setRecoveryNote(e.target.value)}
                  placeholder="ব্যাংক একাউন্টে জমা বা ড্রয়িংস..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsRecoveryModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 rounded-md text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold"
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
