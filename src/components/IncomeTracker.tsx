/**
 * Menu 7: Income & Sales Tracker (৭. আয় ও বিক্রয় হিসাব)
 * রাবার বিক্রি, স্ক্র্যাপ ঝিল ও অন্যান্য বাস্তব আয়ের সঠিক হিসাব
 */

import React, { useState } from 'react';
import { Garden, Income } from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
  generateUniqueId,
} from '../utils/banglaUtils';
import {
  BadgeDollarSign,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Scale,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

interface IncomeTrackerProps {
  garden: Garden;
  incomes: Income[];
  onRefreshData: () => void;
}

export const IncomeTracker: React.FC<IncomeTrackerProps> = ({
  garden,
  incomes,
  onRefreshData,
}) => {
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [type, setType] = useState<string>('শিট রাবার বিক্রয়');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(getTodayDateStr().slice(0, 7));

  // Auto-calculate total amount when weight and rate change
  const handleWeightOrPriceChange = (
    newWeight: number | '',
    newPrice: number | ''
  ) => {
    setWeightKg(newWeight);
    setUnitPrice(newPrice);
    if (newWeight && newPrice) {
      setAmount(Math.round(Number(newWeight) * Number(newPrice)));
    }
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('সঠিক মোট আয়ের পরিমাণ দিন।');
      return;
    }

    if (editingIncome) {
      const updated: Income = {
        ...editingIncome,
        date,
        type,
        weightKg: weightKg === '' ? undefined : Number(weightKg),
        unitPrice: unitPrice === '' ? undefined : Number(unitPrice),
        amount: Number(amount),
        buyerName: buyerName.trim(),
        description: description.trim(),
      };
      StorageService.saveIncome(updated);
      setEditingIncome(null);
    } else {
      const newInc: Income = {
        id: generateUniqueId('INC'),
        gardenId: garden.id,
        date,
        type,
        weightKg: weightKg === '' ? undefined : Number(weightKg),
        unitPrice: unitPrice === '' ? undefined : Number(unitPrice),
        amount: Number(amount),
        buyerName: buyerName.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
      };
      StorageService.saveIncome(newInc);
    }

    setAmount('');
    setWeightKg('');
    setUnitPrice('');
    setBuyerName('');
    setDescription('');
    onRefreshData();
  };

  const openEdit = (inc: Income) => {
    setEditingIncome(inc);
    setDate(inc.date);
    setType(inc.type);
    setWeightKg(inc.weightKg ?? '');
    setUnitPrice(inc.unitPrice ?? '');
    setAmount(inc.amount);
    setBuyerName(inc.buyerName || '');
    setDescription(inc.description || '');
  };

  const cancelEdit = () => {
    setEditingIncome(null);
    setAmount('');
    setWeightKg('');
    setUnitPrice('');
    setBuyerName('');
    setDescription('');
    setDate(getTodayDateStr());
  };

  const handleDelete = (incId: string) => {
    if (window.confirm('আপনি কি এই বিক্রয়ের রেকর্ড মুছে ফেলতে চান?')) {
      StorageService.deleteIncome(incId);
      onRefreshData();
    }
  };

  // Filtered list
  const filteredIncomes = incomes
    .filter((inc) => !filterMonth || inc.date.startsWith(filterMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalFilteredIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalFilteredWeight = filteredIncomes.reduce((sum, i) => sum + (i.weightKg || 0), 0);
  const allTimeTotal = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>৭. আয় ও বিক্রয় হিসাব</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            রাবার উৎপাদন ও পণ্য বিক্রয় হিসাব
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            শিট রাবার, স্ক্র্যাপ ঝিল, কাঁচা তরল দুধ বা কাঠের বিক্রয়মূল্য নির্ভুলভাবে এন্ট্রি করুন।
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[11px] text-neutral-500 block">চলতি মাসের বিক্রয়</span>
            <span className="text-base sm:text-lg font-bold text-emerald-800 tabular-nums">
              {formatTaka(totalFilteredIncome)}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[11px] text-emerald-800 block">সর্বমোট অর্জিত আয়</span>
            <span className="text-base sm:text-lg font-bold text-emerald-950 tabular-nums">
              {formatTaka(allTimeTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              {editingIncome ? 'বিক্রয় রেকর্ড সম্পাদন' : 'নতুন বিক্রয় / আয় এন্ট্রি'}
            </h3>
            {editingIncome && (
              <button
                onClick={cancelEdit}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                বাতিল ✕
              </button>
            )}
          </div>

          <form onSubmit={handleSaveIncome} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                তারিখ *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                আয়ের ধরন *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="শিট রাবার বিক্রয়">শিট রাবার বিক্রয় (RSS-4)</option>
                <option value="কাঁচা রাবার বিক্রয়">কাঁচা রাবার দুধ বিক্রয়</option>
                <option value="স্ক্র্যাপ/ঝিল বিক্রয়">স্ক্র্যাপ/ঝিল বিক্রয়</option>
                <option value="গাছ বা কাঠ বিক্রয়">পুরোনো রাবার গাছ/কাঠ বিক্রয়</option>
                <option value="অন্যান্য আয়">অন্যান্য বাগান আয়</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  ওজন / পরিমাণ (কেজি)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weightKg}
                  onChange={(e) =>
                    handleWeightOrPriceChange(
                      e.target.value === '' ? '' : Number(e.target.value),
                      unitPrice
                    )
                  }
                  placeholder="যেমন: ৫০"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  দর (টাকা/কেজি)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={unitPrice}
                  onChange={(e) =>
                    handleWeightOrPriceChange(
                      weightKg,
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  placeholder="যেমন: ২২০"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                মোট বিক্রিত মূল্য (৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="মোট টাকা"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                ক্রেতা / পার্টি নাম
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="মেসার্স রহিম রাবার ট্রেডার্স"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                বিবরণ বা চালানের নোট
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="গ্রেড, আর্দ্রতা বা চালানের বিবরণ..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs"
            >
              {editingIncome ? 'আয় আপডেট করুন' : 'বিক্রয় রেকর্ড সংরক্ষণ করুন'}
            </button>
          </form>
        </div>

        {/* Ledger Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-700">মাস নির্বাচন:</span>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-2 py-1 bg-white border border-neutral-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div className="font-semibold text-neutral-800">
                মোট ওজন: <span className="tabular-nums">{toBanglaNumber(totalFilteredWeight, 1)} কেজি</span>
              </div>
            </div>

            {filteredIncomes.length === 0 ? (
              <div className="text-center py-16 px-4 text-xs text-neutral-500">
                এই মাসে কোনো বিক্রয় এন্ট্রি নেই
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-neutral-100 sticky top-0 border-b border-neutral-200 text-neutral-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">আয়ের ধরন</th>
                      <th className="py-2.5 px-3 text-right">ওজন (কেজি)</th>
                      <th className="py-2.5 px-3 text-right">দর (৳/কেজি)</th>
                      <th className="py-2.5 px-3 text-right">মোট বিক্রয় (৳)</th>
                      <th className="py-2.5 px-3">ক্রেতা</th>
                      <th className="py-2.5 px-3 text-center w-20">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {formatDateBangla(inc.date)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-800">
                          {inc.type}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-neutral-700">
                          {inc.weightKg ? toBanglaNumber(inc.weightKg, 1) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-neutral-700">
                          {inc.unitPrice ? formatTaka(inc.unitPrice) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-800 tabular-nums">
                          {formatTaka(inc.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 text-xs">
                          {inc.buyerName || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(inc)}
                              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
                              title="সম্পাদনা"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(inc.id)}
                              className="p-1 text-neutral-400 hover:text-red-600 rounded-md"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-100 font-bold border-t border-neutral-300">
                      <td colSpan={4} className="py-3 px-3">
                        সর্বমোট বিক্রয় ({toBanglaNumber(filteredIncomes.length)} টি এন্ট্রি)
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-900 font-bold tabular-nums">
                        {formatTaka(totalFilteredIncome)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
