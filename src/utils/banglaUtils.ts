/**
 * Bengali Formatting and Financial Calculation Utilities
 * বাংলা সংখ্যা, মুদ্রা, তারিখ ও কাজের দিন গণনার ইউটিলিটি
 */

const banglaDigits: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const banglaMonths = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

/**
 * Convert any number or string with digits to Bengali digits
 */
export function toBanglaNumber(value: number | string | null | undefined, decimals?: number): string {
  if (value === null || value === undefined || value === '') return '০';

  let numStr: string;
  if (typeof value === 'number') {
    if (isNaN(value)) return '০';
    if (decimals !== undefined) {
      numStr = value.toFixed(decimals);
    } else {
      // Format with Indian/South Asian grouping (thousands, lakhs)
      numStr = formatSouthAsianNumber(value);
    }
  } else {
    numStr = value.toString();
  }

  return numStr.replace(/\d/g, (d) => banglaDigits[d] || d);
}

/**
 * Format numbers with South Asian lakh/thousand grouping
 */
function formatSouthAsianNumber(val: number): string {
  const parts = val.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1].slice(0, 2)}` : '';

  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  return (isNegative ? '-' : '') + integerPart + decimalPart;
}

/**
 * Format currency in Bangladeshi Taka (৳)
 */
export function formatTaka(amount: number | null | undefined, showSymbol = true): string {
  const num = amount ?? 0;
  const banglaNum = toBanglaNumber(num);
  return showSymbol ? `৳ ${banglaNum}` : banglaNum;
}

/**
 * Format date (YYYY-MM-DD) into Bengali readable format
 */
export function formatDateBangla(dateStr: string | null | undefined, longFormat = false): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  if (longFormat && banglaMonths[month]) {
    return `${toBanglaNumber(day)} ${banglaMonths[month]} ${toBanglaNumber(year)}`;
  }

  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const monthStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
  return `${toBanglaNumber(dayStr)}/${toBanglaNumber(monthStr)}/${toBanglaNumber(year)}`;
}

/**
 * Formula for workdays calculation in rubber gardens:
 * - ১টি সিট = ১ দিন
 * - ১টি ডবল = ২ দিন (ডবল ট্যাপ করলে ২ দিন কাউন্ট হয়)
 * - ১টি হাফ = ০.৫ দিন
 *
 * Examples from prompt & Acceptance Test 3:
 * - সিট + ডবল = ২ দিন
 * - সিট + হাফ = ১.৫ দিন
 * - সিট + ডবল + হাফ = ২.৫ দিন
 * - শুধু ডবল = ২ দিন
 * - শুধু হাফ = ০.৫ দিন
 * - শুধু সিট = ১ দিন
 */
export function calculateWorkdays(sheet: number, double: number, half: number): number {
  const s = Math.max(0, sheet || 0);
  const d = Math.max(0, double || 0);
  const h = Math.max(0, half || 0);

  // If double work is performed, it subsumes the primary sheet (2 days total)
  if (d > 0) {
    return d * 2 + (h * 0.5);
  }
  return (s * 1) + (h * 0.5);
}

/**
 * Calculate daily wage rate: monthly salary ÷ divisor (default 30)
 * Example: 12,000 ÷ 30 = 400 ৳
 */
export function calculateDailyWage(monthlySalary: number, divisor = 30): number {
  if (!monthlySalary || divisor <= 0) return 0;
  return Math.round((monthlySalary / divisor) * 100) / 100;
}

/**
 * Calculate earned salary: workdays × daily wage
 * Example: 1.5 × 400 = 600 ৳
 */
export function calculateEarnedSalary(workdays: number, dailyWage: number): number {
  if (!workdays || !dailyWage) return 0;
  return Math.round(workdays * dailyWage * 100) / 100;
}

/**
 * Calculate remaining days between a given date and contract end date
 */
export function getRemainingDays(currentDateStr: string, contractEndDateStr: string): number {
  const current = new Date(currentDateStr);
  const end = new Date(contractEndDateStr);
  const diffTime = end.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // Ensure at least 1 day divisor
}

/**
 * Generate a unique ID with custom prefix
 */
export function generateUniqueId(prefix: string): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${datePart}-${randomPart}`;
}

/**
 * Get current date string formatted as YYYY-MM-DD
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in days between two dates (পরিকল্পনার দিন গণনা)
 */
export function getDaysBetweenDates(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const sParts = startDateStr.split('-').map(Number);
  const eParts = endDateStr.split('-').map(Number);
  if (sParts.length !== 3 || eParts.length !== 3) return 0;
  const start = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
  const end = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
  if (isNaN(start) || isNaN(end)) return 0;
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Automated daily net target formula:
 * দৈনিক গড় নিট টার্গেট = উদ্ধার করতে বাকি টাকা ÷ পরিকল্পনার অবশিষ্ট দিন
 */
export function calculateAutomatedDailyTarget(
  targetToRecover: number,
  days: number
): { dailyTarget: number; isValid: boolean; error?: string } {
  if (!days || days <= 0) {
    return {
      dailyTarget: 0,
      isValid: false,
      error: 'টার্গেট শেষের তারিখ অবশ্যই শুরুর তারিখের পরের হতে হবে (পরিকল্পনার দিন শূন্য বা ঋণাত্মক হতে পারবে না)।',
    };
  }
  if (targetToRecover < 0) {
    return {
      dailyTarget: 0,
      isValid: false,
      error: 'উদ্ধার করতে বাকি টাকার পরিমাণ ঋণাত্মক হতে পারবে না।',
    };
  }
  // Formula: targetToRecover / days
  const dailyTarget = Math.round((targetToRecover / days) * 100) / 100;
  return { dailyTarget, isValid: true };
}

