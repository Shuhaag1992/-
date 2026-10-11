/**
 * Types for Rubber Garden Accounting Management Software
 * রাবার বাগান হিসাব ব্যবস্থাপনা সফটওয়্যার
 */

export interface Garden {
  id: string;
  name: string; // e.g. "বাগান নং ১"
  code: string; // e.g. "BG-01"
  location: string;
  contractStartDate: string; // YYYY-MM-DD
  contractEndDate: string; // YYYY-MM-DD
  initialInvestment: number; // প্রাথমিক বিনিয়োগ (৳)
  additionalInvestment: number; // অতিরিক্ত মূলধন (৳)
  annualTarget: number; // বার্ষিক অর্থ পুনরুদ্ধারের লক্ষ্য (৳)
  targetStartDate?: string; // টার্গেট শুরুর তারিখ
  targetEndDate?: string; // টার্গেট শেষের তারিখ
  targetToRecover?: number; // এখনো যে টাকা উদ্ধার করতে হবে (৳, e.g. 7,50,000)
  dailyBaseTarget: number; // দৈনিক গড় নিট টার্গেট (৳, e.g. 3,750)
  recoveredInvestment: number; // বাস্তবে পুনরুদ্ধার করা টাকা (৳)
  salaryDivisor: number; // ডিফল্ট ৩০ (বেতন বিভাজক)
  salaryCycleType: '15_days' | 'monthly';
  payoutDay: number; // ডিফল্ট ১৬ (বেতন প্রদানের নির্ধারিত দিন)
  targetDeductsExpenses: boolean; // দৈনিক অর্জনে পরিচালন খরচ ও মজুরি বাদ যাবে কি না
  categories: string[]; // খরচ ক্যাটাগরি তালিকা
  notes?: string;
  createdAt: string;
}

export interface TargetPlan {
  id: string;
  gardenId: string;
  planTitle: string; // যেমন: "২০২৬-২০২৭ সিজন পরিকল্পনা"
  startDate: string; // টার্গেট শুরুর তারিখ
  endDate: string; // টার্গেট শেষের তারিখ
  targetToRecover: number; // এখনো যে টাকা উদ্ধার করতে হবে (৳)
  totalDays: number; // পরিকল্পনার মোট দিন
  dailyBaseTarget: number; // দৈনিক গড় নিট টার্গেট (৳)
  isUserOverridden?: boolean;
  isActive?: boolean; // এই পরিকল্পনাটি বর্তমানে সক্রিয় কি না
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Worker {
  id: string;
  gardenId: string;
  name: string; // শ্রমিকের পূর্ণ নাম
  fatherName: string; // পিতার নাম
  motherName: string; // মাতার নাম
  nid: string; // জাতীয় পরিচয়পত্র নম্বর
  photoUrl?: string; // শ্রমিকের ছবি
  phone: string; // ব্যক্তিগত মোবাইল নম্বর
  emergencyContactName: string; // জরুরি যোগাযোগকারীর নাম
  emergencyRelation: string; // জরুরি যোগাযোগকারীর সঙ্গে সম্পর্ক
  emergencyPhone: string; // জরুরি যোগাযোগকারীর মোবাইল নম্বর
  address: string; // সম্পূর্ণ ঠিকানা
  joiningDate: string; // চাকরিতে যোগদানের তারিখ (YYYY-MM-DD)
  monthlySalary: number; // মাসিক বেতন (৳, e.g. 12,000)
  isActive: boolean; // সক্রিয় বা নিষ্ক্রিয় অবস্থা
  notes?: string;
  createdAt: string;
}

export interface DailyWorkLog {
  id: string;
  gardenId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  sheet: number; // সিট (1 = 1 দিন)
  double: number; // ডবল (1 = 2 দিন)
  half: number; // হাফ (1 = 0.5 দিন)
  workdays: number; // মোট কর্মদিবস (গণনা সূত্র: ডবল > 0 ? ডবল*2 + হাফ*0.5 : সিট*1 + হাফ*0.5)
  dailyWageRate: number; // দৈনিক মজুরি রেট (মাসিক বেতন ÷ বিভাজক)
  earnedSalary: number; // দৈনিক অর্জিত বেতন (কর্মদিবস × দৈনিক মজুরি)
  notes?: string;
  updatedAt: string;
}

export type AdvanceStatus = 'pending' | 'adjusted' | 'partially_adjusted' | 'reversed';

export interface AdvancePayment {
  id: string; // লেনদেনের Unique ID
  gardenId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  amount: number; // টাকার পরিমাণ
  reason: string; // মন্তব্য বা কারণ
  status: AdvanceStatus;
  adjustedAmount: number; // পূর্বে বা বর্তমানে সমন্বয় করা টাকা
  settlementId?: string; // যে বেতনে সমন্বয় করা হয়েছে
  notes?: string;
  isReversed?: boolean; // সংশোধনের জন্য রিভার্সাল রেকর্ড
  createdAt: string;
}

export interface Expense {
  id: string; // লেনদেনের Unique ID
  gardenId: string;
  date: string; // YYYY-MM-DD
  category: string; // বাটি, চাকু, খাবার, পরিবহন, মালামাল, মেরামত, অন্যান্য
  amount: number; // টাকার পরিমাণ
  description: string; // বিবরণ বা মন্তব্য
  voucherNo?: string;
  createdAt: string;
}

export interface Income {
  id: string; // লেনদেনের Unique ID
  gardenId: string;
  date: string; // YYYY-MM-DD
  type: string; // কাঁচা রাবার বিক্রয়, শিট রাবার বিক্রয়, স্ক্র্যাপ/ঝিল, অন্যান্য
  weightKg?: number; // ওজন বা পরিমাণ (কেজি/শিট)
  unitPrice?: number; // ইউনিটপ্রতি মূল্য (টাকা/কেজি)
  amount: number; // মোট টাকা
  buyerName?: string; // ক্রেতার নাম
  description: string; // বিবরণ
  createdAt: string;
}

export type SettlementPeriodType = '15_days' | 'monthly' | 'custom';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface WorkerSettlementDetail {
  workerId: string;
  workerName: string;
  sheetCount: number;
  doubleCount: number;
  halfCount: number;
  totalWorkdays: number;
  dailyWageRate: number;
  totalEarned: number;
  totalOutstandingAdvance: number; // সমন্বয়ের পূর্বের মোট বকেয়া অগ্রিম
  advanceDeducted: number; // এই পর্বে সমন্বয়যোগ্য কর্তন
  otherDeductions: number; // অন্যান্য অনুমোদিত কর্তন
  previousBalance: number; // পূর্ববর্তী বকেয়া বেতন সমন্বয়
  netPayable: number; // নিট পাওনা = totalEarned - advanceDeducted - otherDeductions + previousBalance
  paidAmount: number; // পরিশোধিত টাকা
  remainingBalance: number; // অবশিষ্ট বকেয়া বেতন = netPayable - paidAmount
  paymentDate: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string; // নগদ, ব্যাংক, বিকাশ, রকেট
  note?: string;
}

export interface SalarySettlement {
  id: string; // পে-রোল ইউনিক আইডি
  gardenId: string;
  periodType: SettlementPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  settlementDate: string; // বেতন হিসাব চূড়ান্ত করার তারিখ
  workers: WorkerSettlementDetail[];
  summary: {
    totalWorkers: number;
    totalWorkdays: number;
    totalEarned: number;
    totalAdvanceDeducted: number;
    totalOtherDeductions: number;
    totalNetPayable: number;
    totalPaid: number;
    totalRemainingBalance: number;
  };
  isFinalized: boolean; // ড্রাফট নাকি চূড়ান্ত অনুমোদিত
  createdAt: string;
}

export interface InvestmentRecovery {
  id: string;
  gardenId: string;
  date: string;
  amount: number;
  notes: string;
  createdAt: string;
}

export interface AppData {
  version: string;
  lastBackupDate?: string;
  gardens: Garden[];
  workers: Worker[];
  dailyWorkLogs: DailyWorkLog[];
  advancePayments: AdvancePayment[];
  expenses: Expense[];
  incomes: Income[];
  salarySettlements: SalarySettlement[];
  investmentRecoveries: InvestmentRecovery[];
  targetPlans?: TargetPlan[];
}
