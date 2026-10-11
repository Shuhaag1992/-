/**
 * Persistent Storage Service for Rubber Garden Accounting
 * ব্রাউজারের লোকাল স্টোরেজে সম্পূর্ণ ডেটা সংরক্ষণ ও পুনরুদ্ধারের সার্ভিস
 */

import {
  AppData,
  Garden,
  Worker,
  DailyWorkLog,
  AdvancePayment,
  Expense,
  Income,
  SalarySettlement,
  InvestmentRecovery,
  TargetPlan,
} from '../types';
import { calculateWorkdays, calculateDailyWage, calculateEarnedSalary, generateUniqueId } from '../utils/banglaUtils';

const STORAGE_KEY = 'rubber_garden_account_data_v1';

/**
 * Default seed data with 3 gardens and sample workers for immediate verification
 */
function createInitialSeedData(): AppData {
  const garden1Id = 'garden-001';
  const garden2Id = 'garden-002';
  const garden3Id = 'garden-003';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Dates for testing
  const dateYesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dateTwoDaysAgo = new Date(Date.now() - 172800000).toISOString().slice(0, 10);

  const gardens: Garden[] = [
    {
      id: garden1Id,
      name: 'বাগান নং ১',
      code: 'BG-01',
      location: 'মৌলভীবাজার সদর, সিলেট',
      contractStartDate: '2026-01-01',
      contractEndDate: '2026-12-31',
      initialInvestment: 1000000, // ১০,০০,০০০ ৳
      additionalInvestment: 0,
      annualTarget: 1500000,
      dailyBaseTarget: 5000, // দৈনিক ৫,০০০ ৳
      recoveredInvestment: 120000, // ১,২০,০০০ ৳ পুনরুদ্ধার
      salaryDivisor: 30,
      salaryCycleType: '15_days',
      payoutDay: 16,
      targetDeductsExpenses: true,
      categories: ['বাটি', 'চাকু', 'খাবার', 'পরিবহন', 'মালামাল', 'মেরামত', 'অন্যান্য'],
      notes: 'প্রধান রাবার বাগান এস্টেট - ৫০০ একর',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: garden2Id,
      name: 'বাগান নং ২',
      code: 'BG-02',
      location: 'শ্রীমঙ্গল, মৌলভীবাজার',
      contractStartDate: '2026-02-01',
      contractEndDate: '2026-12-31',
      initialInvestment: 800000, // ৮,০০,০০০ ৳
      additionalInvestment: 50000,
      annualTarget: 1200000,
      dailyBaseTarget: 4000,
      recoveredInvestment: 80000,
      salaryDivisor: 30,
      salaryCycleType: '15_days',
      payoutDay: 16,
      targetDeductsExpenses: true,
      categories: ['বাটি', 'চাকু', 'খাবার', 'পরিবহন', 'মালামাল', 'মেরামত', 'অন্যান্য'],
      notes: 'ব্লু হিলস রাবার ব্লক',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
      id: garden3Id,
      name: 'বাগান নং ৩',
      code: 'BG-03',
      location: 'কমলগঞ্জ, মৌলভীবাজার',
      contractStartDate: '2026-03-01',
      contractEndDate: '2027-02-28',
      initialInvestment: 1200000, // ১২,০০,০০০ ৳
      additionalInvestment: 0,
      annualTarget: 1800000,
      dailyBaseTarget: 6000,
      recoveredInvestment: 0,
      salaryDivisor: 30,
      salaryCycleType: 'monthly',
      payoutDay: 1,
      targetDeductsExpenses: true,
      categories: ['বাটি', 'চাকু', 'খাবার', 'পরিবহন', 'মালামাল', 'মেরামত', 'অন্যান্য'],
      notes: 'নতুন লিজ নেওয়া বাগান',
      createdAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  const workers: Worker[] = [
    {
      id: 'wrk-001',
      gardenId: garden1Id,
      name: 'মো: রফিকুল ইসলাম',
      fatherName: 'মরহুম আব্দুল গণি',
      motherName: 'মোছা: রহিমা খাতুন',
      nid: '1988562391000021',
      phone: '01712-345678',
      emergencyContactName: 'মো: শফিকুল ইসলাম',
      emergencyRelation: 'ভাই',
      emergencyPhone: '01712-998877',
      address: 'গ্রাম: রাধানগর, ডাকঘর: শ্রীমঙ্গল, মৌলভীবাজার',
      joiningDate: '2026-01-05',
      monthlySalary: 12000, // দৈনিক বেতন = ৪০০ ৳ (১২০০০ ÷ ৩০)
      isActive: true,
      notes: 'অভিজ্ঞ রাবার কাটার কারিগর (ট্যাপার)',
      createdAt: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 'wrk-002',
      gardenId: garden1Id,
      name: 'স্বপন রবিদাস',
      fatherName: 'রামেশ্বর রবিদাস',
      motherName: 'শান্তি দেবী',
      nid: '1992562391000045',
      phone: '01819-234567',
      emergencyContactName: 'বিষ্ণু রবিদাস',
      emergencyRelation: 'পিতা',
      emergencyPhone: '01819-876543',
      address: 'চা বাগান কলোনি, সেকশন ৩, মৌলভীবাজার',
      joiningDate: '2026-01-10',
      monthlySalary: 12000, // দৈনিক ৪০০ ৳
      isActive: true,
      notes: 'দক্ষ ল্যাটেক্স সংগ্রহকারী',
      createdAt: '2026-01-10T00:00:00.000Z',
    },
    {
      id: 'wrk-003',
      gardenId: garden1Id,
      name: 'মো: আব্দুল করিম',
      fatherName: 'মো: সোলেমান মিয়া',
      motherName: 'আমেনা বেগম',
      nid: '1990562391000088',
      phone: '01911-345678',
      emergencyContactName: 'আমেনা বেগম',
      emergencyRelation: 'মা',
      emergencyPhone: '01911-001122',
      address: 'গ্রাম: কালীঘাট, মৌলভীবাজার',
      joiningDate: '2026-01-15',
      monthlySalary: 13500, // দৈনিক ৪৫০ ৳ (১৩৫০০ ÷ ৩০)
      isActive: true,
      notes: 'বাগানের সিনিয়র সর্দার',
      createdAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 'wrk-004',
      gardenId: garden1Id,
      name: 'মো: জসিম উদ্দিন',
      fatherName: 'মরহুম নুর মিয়া',
      motherName: 'মাজেদা খাতুন',
      nid: '1995562391000099',
      phone: '01622-456789',
      emergencyContactName: 'মো: রুবেল মিয়া',
      emergencyRelation: 'চাচা',
      emergencyPhone: '01622-112233',
      address: 'গ্রাম: মির্জাপুর, শ্রীমঙ্গল',
      joiningDate: '2026-02-01',
      monthlySalary: 12000,
      isActive: true,
      notes: 'ট্যাপিং ও ড্রাম পরিবহন',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
    // Worker for garden 2 to prove garden isolation
    {
      id: 'wrk-005',
      gardenId: garden2Id,
      name: 'বাপ্পি মাঝি',
      fatherName: 'গোবিন্দ মাঝি',
      motherName: 'লক্ষ্মী মাঝি',
      nid: '1993562391000077',
      phone: '01733-112233',
      emergencyContactName: 'লক্ষ্মী মাঝি',
      emergencyRelation: 'মা',
      emergencyPhone: '01733-445566',
      address: 'মাঝি পাড়া, কমলগঞ্জ',
      joiningDate: '2026-02-05',
      monthlySalary: 12000,
      isActive: true,
      notes: 'বাগান ২ এর প্রধান কারিগর',
      createdAt: '2026-02-05T00:00:00.000Z',
    },
  ];

  // Daily work logs for today and yesterday in Garden 1
  const dailyWorkLogs: DailyWorkLog[] = [
    {
      id: generateUniqueId('LOG'),
      gardenId: garden1Id,
      workerId: 'wrk-001',
      date: todayStr,
      sheet: 1,
      double: 0,
      half: 1, // সিট + হাফ = ১.৫ দিন
      workdays: 1.5,
      dailyWageRate: 400,
      earnedSalary: 600, // ১.৫ × ৪০০ = ৬০০ ৳
      notes: 'সকালে ১ সিট এবং বিকেলে আধা দিন অতিরিক্ত কাজ',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('LOG'),
      gardenId: garden1Id,
      workerId: 'wrk-002',
      date: todayStr,
      sheet: 1,
      double: 1, // সিট + ডবল = ২ দিন (টেস্ট ৩ মোতাবেক)
      half: 0,
      workdays: 2.0,
      dailyWageRate: 400,
      earnedSalary: 800, // ২.০ × ৪০০ = ৮০০ ৳
      notes: 'ডবল শিফট কাজ',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('LOG'),
      gardenId: garden1Id,
      workerId: 'wrk-003',
      date: todayStr,
      sheet: 1,
      double: 1,
      half: 1, // সিট + ডবল + হাফ = ২.৫ দিন (টেস্ট ৩ মোতাবেক)
      workdays: 2.5,
      dailyWageRate: 450,
      earnedSalary: 1125, // ২.৫ × ৪৫০ = ১,১২৫ ৳
      notes: 'ডবল এবং হাফ ওভারটাইম',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('LOG'),
      gardenId: garden1Id,
      workerId: 'wrk-004',
      date: todayStr,
      sheet: 1,
      double: 0,
      half: 0, // শুধু সিট = ১ দিন
      workdays: 1.0,
      dailyWageRate: 400,
      earnedSalary: 400,
      notes: 'নিয়মিত সিট কাজ',
      updatedAt: new Date().toISOString(),
    },
    // Yesterday logs
    {
      id: generateUniqueId('LOG'),
      gardenId: garden1Id,
      workerId: 'wrk-001',
      date: dateYesterday,
      sheet: 1,
      double: 0,
      half: 0,
      workdays: 1.0,
      dailyWageRate: 400,
      earnedSalary: 400,
      notes: '',
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('LOG'),
      gardenId: garden1Id,
      workerId: 'wrk-002',
      date: dateYesterday,
      sheet: 1,
      double: 0,
      half: 0,
      workdays: 1.0,
      dailyWageRate: 400,
      earnedSalary: 400,
      notes: '',
      updatedAt: new Date().toISOString(),
    },
  ];

  // Advance payments
  const advancePayments: AdvancePayment[] = [
    {
      id: generateUniqueId('ADV'),
      gardenId: garden1Id,
      workerId: 'wrk-001',
      date: dateTwoDaysAgo,
      amount: 1500, // ১,৫০০ ৳ অগ্রিম (টেস্ট ৫ যাচাইয়ের জন্য)
      reason: 'পারিবারিক ও চিকিৎসার জরুরি খরচ',
      status: 'pending',
      adjustedAmount: 0,
      notes: 'পরবর্তী ১৫ দিনের বেতনে সমন্বয় হবে',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('ADV'),
      gardenId: garden1Id,
      workerId: 'wrk-002',
      date: dateYesterday,
      amount: 500,
      reason: 'খাবার বাবদ ধার',
      status: 'pending',
      adjustedAmount: 0,
      notes: '',
      createdAt: new Date().toISOString(),
    },
  ];

  // Daily Expenses for Garden 1
  const expenses: Expense[] = [
    {
      id: generateUniqueId('EXP'),
      gardenId: garden1Id,
      date: todayStr,
      category: 'বাটি',
      amount: 450,
      description: 'ল্যাটেক্স সংগ্রহের নতুন প্লাস্টিক বাটি ২০টি',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('EXP'),
      gardenId: garden1Id,
      date: todayStr,
      category: 'চাকু',
      amount: 350,
      description: 'রাবার ছালের বিশেষ ট্যাপিং চাকু শান ও মেরামত',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('EXP'),
      gardenId: garden1Id,
      date: todayStr,
      category: 'খাবার',
      amount: 600,
      description: 'বাগানের শ্রমিকদের দুপুরের নাস্তা ও চা',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('EXP'),
      gardenId: garden1Id,
      date: dateYesterday,
      category: 'পরিবহন',
      amount: 800,
      description: 'কাঁচা রাবার দুধ ড্রামে ভরে সেন্টারে নেওয়া',
      createdAt: new Date().toISOString(),
    },
  ];

  // Incomes for Garden 1
  const incomes: Income[] = [
    {
      id: generateUniqueId('INC'),
      gardenId: garden1Id,
      date: todayStr,
      type: 'শিট রাবার বিক্রয়',
      weightKg: 40,
      unitPrice: 220,
      amount: 8800, // ৪০ কেজি × ২২০ = ৮,৮০০ ৳
      buyerName: 'আলহাজ্ব রাবার ট্রেডার্স',
      description: 'উচ্চমানের আরএসএস-৪ গ্রেড শিট রাবার সরবরাহ',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUniqueId('INC'),
      gardenId: garden1Id,
      date: dateYesterday,
      type: 'স্ক্র্যাপ/ঝিল বিক্রয়',
      weightKg: 25,
      unitPrice: 130,
      amount: 3250, // ২৫ কেজি × ১৩০ = ৩,২৫০ ৳
      buyerName: 'মেসার্স সেলিম ব্রাদার্স',
      description: 'গাছের ছালে শুকিয়ে যাওয়া স্ক্র্যাপ ঝিল',
      createdAt: new Date().toISOString(),
    },
  ];

  const investmentRecoveries: InvestmentRecovery[] = [
    {
      id: generateUniqueId('REC'),
      gardenId: garden1Id,
      date: '2026-03-31',
      amount: 120000,
      notes: 'প্রথম প্রান্তিকের মুনাফা থেকে মূলধন প্রত্যাহার',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    version: '1.0.0',
    lastBackupDate: new Date().toISOString(),
    gardens,
    workers,
    dailyWorkLogs,
    advancePayments,
    expenses,
    incomes,
    salarySettlements: [],
    investmentRecoveries,
    targetPlans: [
      {
        id: 'plan-001',
        gardenId: garden1Id,
        planTitle: '২০২৬ বার্ষিক নিট লক্ষ্য ও মূলধন উদ্ধার পরিকল্পনা',
        startDate: '2026-01-01',
        endDate: '2026-07-19',
        targetToRecover: 750000,
        totalDays: 200,
        dailyBaseTarget: 3750,
        isUserOverridden: false,
        isActive: true,
        notes: 'বাকি টাকা ৳৭,৫০,০০০ এবং পরিকল্পনার দিন ২০০ হলে দৈনিক গড় নিট টার্গেট ৳৩,৭৫০',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

/**
 * Storage Service singleton methods
 */
export const StorageService = {
  /**
   * Load entire AppData from localStorage (initializes with seeds if absent)
   */
  loadData(): AppData {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        const initialData = createInitialSeedData();
        StorageService.saveData(initialData);
        return initialData;
      }
      const parsed = JSON.parse(serialized) as AppData;
      // Ensure required arrays exist even if old version had fewer properties
      parsed.gardens = parsed.gardens || [];
      parsed.workers = parsed.workers || [];
      parsed.dailyWorkLogs = parsed.dailyWorkLogs || [];
      parsed.advancePayments = parsed.advancePayments || [];
      parsed.expenses = parsed.expenses || [];
      parsed.incomes = parsed.incomes || [];
      parsed.salarySettlements = parsed.salarySettlements || [];
      parsed.investmentRecoveries = parsed.investmentRecoveries || [];
      parsed.targetPlans = parsed.targetPlans || [];
      return parsed;
    } catch (e) {
      console.error('Failed to load data from localStorage:', e);
      const initialData = createInitialSeedData();
      return initialData;
    }
  },

  /**
   * Save AppData to localStorage
   */
  saveData(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data to localStorage:', e);
    }
  },

  /**
   * Gardens API
   */
  getGardens(): Garden[] {
    return StorageService.loadData().gardens;
  },

  getGarden(gardenId: string): Garden | undefined {
    return StorageService.loadData().gardens.find((g) => g.id === gardenId);
  },

  saveGarden(garden: Garden): void {
    const data = StorageService.loadData();
    const index = data.gardens.findIndex((g) => g.id === garden.id);
    if (index >= 0) {
      data.gardens[index] = garden;
    } else {
      data.gardens.push(garden);
    }
    StorageService.saveData(data);
  },

  deleteGarden(gardenId: string): void {
    const data = StorageService.loadData();
    data.gardens = data.gardens.filter((g) => g.id !== gardenId);
    // Cleanup related records
    data.workers = data.workers.filter((w) => w.gardenId !== gardenId);
    data.dailyWorkLogs = data.dailyWorkLogs.filter((l) => l.gardenId !== gardenId);
    data.advancePayments = data.advancePayments.filter((a) => a.gardenId !== gardenId);
    data.expenses = data.expenses.filter((e) => e.gardenId !== gardenId);
    data.incomes = data.incomes.filter((i) => i.gardenId !== gardenId);
    data.salarySettlements = data.salarySettlements.filter((s) => s.gardenId !== gardenId);
    data.investmentRecoveries = data.investmentRecoveries.filter((r) => r.gardenId !== gardenId);
    data.targetPlans = (data.targetPlans || []).filter((p) => p.gardenId !== gardenId);
    StorageService.saveData(data);
  },

  /**
   * Workers API (strictly partitioned by gardenId)
   */
  getWorkers(gardenId: string): Worker[] {
    return StorageService.loadData().workers.filter((w) => w.gardenId === gardenId);
  },

  saveWorker(worker: Worker): void {
    const data = StorageService.loadData();
    const index = data.workers.findIndex((w) => w.id === worker.id);
    if (index >= 0) {
      data.workers[index] = worker;
    } else {
      data.workers.push(worker);
    }
    StorageService.saveData(data);
  },

  toggleWorkerStatus(workerId: string): void {
    const data = StorageService.loadData();
    const worker = data.workers.find((w) => w.id === workerId);
    if (worker) {
      worker.isActive = !worker.isActive;
      StorageService.saveData(data);
    }
  },

  /**
   * Daily Work Logs API
   */
  getDailyLogs(gardenId: string, date: string): DailyWorkLog[] {
    return StorageService.loadData().dailyWorkLogs.filter(
      (l) => l.gardenId === gardenId && l.date === date
    );
  },

  getDailyLogsForRange(gardenId: string, startDate: string, endDate: string): DailyWorkLog[] {
    return StorageService.loadData().dailyWorkLogs.filter(
      (l) => l.gardenId === gardenId && l.date >= startDate && l.date <= endDate
    );
  },

  saveDailyLogs(logs: DailyWorkLog[]): void {
    const data = StorageService.loadData();
    logs.forEach((log) => {
      const index = data.dailyWorkLogs.findIndex(
        (l) => l.gardenId === log.gardenId && l.workerId === log.workerId && l.date === log.date
      );
      if (index >= 0) {
        data.dailyWorkLogs[index] = log;
      } else {
        data.dailyWorkLogs.push(log);
      }
    });
    StorageService.saveData(data);
  },

  /**
   * Advance Payments API
   */
  getAdvances(gardenId: string): AdvancePayment[] {
    return StorageService.loadData().advancePayments.filter((a) => a.gardenId === gardenId);
  },

  getWorkerAdvances(workerId: string): AdvancePayment[] {
    return StorageService.loadData().advancePayments.filter((a) => a.workerId === workerId);
  },

  saveAdvance(advance: AdvancePayment): void {
    const data = StorageService.loadData();
    const index = data.advancePayments.findIndex((a) => a.id === advance.id);
    if (index >= 0) {
      data.advancePayments[index] = advance;
    } else {
      data.advancePayments.push(advance);
    }
    StorageService.saveData(data);
  },

  reverseAdvance(advanceId: string, reason: string): void {
    const data = StorageService.loadData();
    const advance = data.advancePayments.find((a) => a.id === advanceId);
    if (advance) {
      advance.status = 'reversed';
      advance.isReversed = true;
      advance.notes = (advance.notes ? advance.notes + ' | ' : '') + `সংশোধন/বাতিল: ${reason}`;
      StorageService.saveData(data);
    }
  },

  /**
   * Calculate worker's outstanding advance
   */
  getWorkerOutstandingAdvance(workerId: string): number {
    const advances = StorageService.getWorkerAdvances(workerId);
    return advances.reduce((sum, adv) => {
      if (adv.status === 'reversed') return sum;
      const remaining = adv.amount - (adv.adjustedAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
  },

  /**
   * Expenses API
   */
  getExpenses(gardenId: string): Expense[] {
    return StorageService.loadData().expenses.filter((e) => e.gardenId === gardenId);
  },

  saveExpense(expense: Expense): void {
    const data = StorageService.loadData();
    const index = data.expenses.findIndex((e) => e.id === expense.id);
    if (index >= 0) {
      data.expenses[index] = expense;
    } else {
      data.expenses.push(expense);
    }
    StorageService.saveData(data);
  },

  deleteExpense(expenseId: string): void {
    const data = StorageService.loadData();
    data.expenses = data.expenses.filter((e) => e.id !== expenseId);
    StorageService.saveData(data);
  },

  /**
   * Income API
   */
  getIncomes(gardenId: string): Income[] {
    return StorageService.loadData().incomes.filter((i) => i.gardenId === gardenId);
  },

  saveIncome(income: Income): void {
    const data = StorageService.loadData();
    const index = data.incomes.findIndex((i) => i.id === income.id);
    if (index >= 0) {
      data.incomes[index] = income;
    } else {
      data.incomes.push(income);
    }
    StorageService.saveData(data);
  },

  deleteIncome(incomeId: string): void {
    const data = StorageService.loadData();
    data.incomes = data.incomes.filter((i) => i.id !== incomeId);
    StorageService.saveData(data);
  },

  /**
   * Salary Settlement API
   */
  getSettlements(gardenId: string): SalarySettlement[] {
    return StorageService.loadData().salarySettlements.filter((s) => s.gardenId === gardenId);
  },

  saveSettlement(settlement: SalarySettlement): void {
    const data = StorageService.loadData();
    const index = data.salarySettlements.findIndex((s) => s.id === settlement.id);
    if (index >= 0) {
      data.salarySettlements[index] = settlement;
    } else {
      data.salarySettlements.push(settlement);
    }

    // If finalized, lock the advance adjustments so they won't be deducted again!
    if (settlement.isFinalized) {
      settlement.workers.forEach((workerSettlement) => {
        let deductionToAllocate = workerSettlement.advanceDeducted;
        if (deductionToAllocate > 0) {
          // Find pending/partially_adjusted advances for this worker in chronological order
          const workerAdvances = data.advancePayments
            .filter((a) => a.workerId === workerSettlement.workerId && a.status !== 'reversed' && a.status !== 'adjusted')
            .sort((a, b) => a.date.localeCompare(b.date));

          for (const adv of workerAdvances) {
            if (deductionToAllocate <= 0) break;
            const remainingOnAdv = adv.amount - (adv.adjustedAmount || 0);
            if (remainingOnAdv <= 0) continue;

            const adjustForThis = Math.min(deductionToAllocate, remainingOnAdv);
            adv.adjustedAmount = (adv.adjustedAmount || 0) + adjustForThis;
            deductionToAllocate -= adjustForThis;

            if (adv.adjustedAmount >= adv.amount) {
              adv.status = 'adjusted';
            } else {
              adv.status = 'partially_adjusted';
            }
            adv.settlementId = settlement.id;
          }
        }
      });
    }

    StorageService.saveData(data);
  },

  /**
   * Investment Recoveries API
   */
  getInvestmentRecoveries(gardenId: string): InvestmentRecovery[] {
    return StorageService.loadData().investmentRecoveries.filter((r) => r.gardenId === gardenId);
  },

  saveInvestmentRecovery(recovery: InvestmentRecovery): void {
    const data = StorageService.loadData();
    const index = data.investmentRecoveries.findIndex((r) => r.id === recovery.id);
    if (index >= 0) {
      data.investmentRecoveries[index] = recovery;
    } else {
      data.investmentRecoveries.push(recovery);
    }
    // Also update garden's recoveredInvestment sum
    const garden = data.gardens.find((g) => g.id === recovery.gardenId);
    if (garden) {
      garden.recoveredInvestment = data.investmentRecoveries
        .filter((r) => r.gardenId === garden.id)
        .reduce((sum, r) => sum + r.amount, 0);
    }
    StorageService.saveData(data);
  },

  /**
   * Target Plans API
   */
  getTargetPlans(gardenId: string): import('../types').TargetPlan[] {
    return (StorageService.loadData().targetPlans || []).filter((p) => p.gardenId === gardenId);
  },

  saveTargetPlan(plan: import('../types').TargetPlan): void {
    const data = StorageService.loadData();
    data.targetPlans = data.targetPlans || [];
    const index = data.targetPlans.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      data.targetPlans[index] = plan;
    } else {
      data.targetPlans.push(plan);
    }
    // If this plan is marked active, deactivate others for this garden and update garden
    if (plan.isActive) {
      data.targetPlans.forEach((p) => {
        if (p.gardenId === plan.gardenId && p.id !== plan.id) {
          p.isActive = false;
        }
      });
      const garden = data.gardens.find((g) => g.id === plan.gardenId);
      if (garden) {
        garden.dailyBaseTarget = plan.dailyBaseTarget;
        garden.targetStartDate = plan.startDate;
        garden.targetEndDate = plan.endDate;
        garden.targetToRecover = plan.targetToRecover;
      }
    }
    StorageService.saveData(data);
  },

  deleteTargetPlan(planId: string): void {
    const data = StorageService.loadData();
    data.targetPlans = (data.targetPlans || []).filter((p) => p.id !== planId);
    StorageService.saveData(data);
  },

  setActiveTargetPlan(gardenId: string, planId: string): void {
    const data = StorageService.loadData();
    data.targetPlans = data.targetPlans || [];
    let activatedPlan: TargetPlan | undefined;
    data.targetPlans.forEach((p) => {
      if (p.gardenId === gardenId) {
        if (p.id === planId) {
          p.isActive = true;
          activatedPlan = p;
        } else {
          p.isActive = false;
        }
      }
    });
    if (activatedPlan) {
      const garden = data.gardens.find((g) => g.id === gardenId);
      if (garden) {
        garden.dailyBaseTarget = activatedPlan.dailyBaseTarget;
        garden.targetStartDate = activatedPlan.startDate;
        garden.targetEndDate = activatedPlan.endDate;
        garden.targetToRecover = activatedPlan.targetToRecover;
      }
    }
    StorageService.saveData(data);
  },

  /**
   * Export Backup to JSON string
   */
  exportData(): string {
    const data = StorageService.loadData();
    data.lastBackupDate = new Date().toISOString();
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import Backup from JSON string with validation
   */
  importData(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonString) as AppData;
      if (!parsed || !Array.isArray(parsed.gardens)) {
        return { success: false, message: 'অবৈধ ফাইল ফরম্যাট! ব্যাকআপ ফাইলে বাগানের তালিকা পাওয়া যায়নি।' };
      }

      // Basic validation
      const gardenCount = parsed.gardens.length;
      const workerCount = Array.isArray(parsed.workers) ? parsed.workers.length : 0;
      const logsCount = Array.isArray(parsed.dailyWorkLogs) ? parsed.dailyWorkLogs.length : 0;

      // Clean missing fields
      parsed.gardens = parsed.gardens || [];
      parsed.workers = parsed.workers || [];
      parsed.dailyWorkLogs = parsed.dailyWorkLogs || [];
      parsed.advancePayments = parsed.advancePayments || [];
      parsed.expenses = parsed.expenses || [];
      parsed.incomes = parsed.incomes || [];
      parsed.salarySettlements = parsed.salarySettlements || [];
      parsed.investmentRecoveries = parsed.investmentRecoveries || [];

      StorageService.saveData(parsed);
      return {
        success: true,
        message: `সফলভাবে ডেটা রিস্টোর করা হয়েছে! বাগান: ${gardenCount}টি, শ্রমিক: ${workerCount}জন, কাজের রেকর্ড: ${logsCount}টি।`,
        count: gardenCount,
      };
    } catch (e: any) {
      return { success: false, message: `ফাইল রিড করতে ব্যর্থ: ${e?.message || 'ভুল JSON ফরম্যাট'}` };
    }
  },

  /**
   * Reset to initial sample seed data
   */
  resetToSampleData(): void {
    const freshData = createInitialSeedData();
    StorageService.saveData(freshData);
  },
};
