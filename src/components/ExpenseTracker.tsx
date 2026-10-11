/**
 * Menu 4: Daily Expenses (৪. দৈনিক খরচ)
 * ক্যাটাগরিভিত্তিক খরচ এন্ট্রি, কাস্টম ক্যাটাগরি তৈরি, সারসংক্ষেপ ও খতিয়ান
 */

import React, { useState } from 'react';
import { Garden, Expense } from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  toBanglaNumber,
  formatDateBangla,
  getTodayDateStr,
  generateUniqueId,
} from '../utils/banglaUtils';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Layers,
  Calendar,
  X,
  CheckCircle2,
  Coins,
} from 'lucide-react';

interface ExpenseTrackerProps {
  garden: Garden;
  expenses: Expense[];
  onRefreshData: () => void;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  garden,
  expenses,
  onRefreshData,
}) => {
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [category, setCategory] = useState<string>('বাটি');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);

  // Edit State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(getTodayDateStr().slice(0, 7)); // YYYY-MM

  // Categories list for garden
  const availableCategories = garden.categories || [
    'বাটি',
    'চাকু',
    'খাবার',
    'পরিবহন',
    'মালামাল',
    'মেরামত',
    'অন্যান্য',
  ];

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('সঠিক টাকার পরিমাণ দিন।');
      return;
    }

    if (editingExpense) {
      const updated: Expense = {
        ...editingExpense,
        date,
        category,
        amount: Number(amount),
        description: description.trim(),
      };
      StorageService.saveExpense(updated);
      setEditingExpense(null);
    } else {
      const newExp: Expense = {
        id: generateUniqueId('EXP'),
        gardenId: garden.id,
        date,
        category,
        amount: Number(amount),
        description: description.trim(),
        createdAt: new Date().toISOString(),
      };
      StorageService.saveExpense(newExp);
    }

    setAmount('');
    setDescription('');
    onRefreshData();
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (availableCategories.includes(trimmed)) {
      alert('এই ক্যাটাগরিটি ইতিমধ্যে বিদ্যমান আছে।');
      return;
    }

    const updatedCategories = [...availableCategories, trimmed];
    const updatedGarden: Garden = {
      ...garden,
      categories: updatedCategories,
    };
    StorageService.saveGarden(updatedGarden);
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCustomCategory(false);
    onRefreshData();
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDescription(exp.description);
  };

  const cancelEdit = () => {
    setEditingExpense(null);
    setAmount('');
    setDescription('');
    setDate(getTodayDateStr());
  };

  const handleDelete = (expId: string) => {
    if (window.confirm('আপনি কি এই খরচের এন্ট্রি মুছে ফেলতে চান?')) {
      StorageService.deleteExpense(expId);
      onRefreshData();
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses
    .filter((exp) => {
      const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
      const matchesMonth = !filterMonth || exp.date.startsWith(filterMonth);
      return matchesCategory && matchesMonth;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Category-wise totals
  const categoryTotals: Record<string, number> = {};
  availableCategories.forEach((cat) => {
    categoryTotals[cat] = expenses
      .filter((e) => e.category === cat && (!filterMonth || e.date.startsWith(filterMonth)))
      .reduce((sum, e) => sum + e.amount, 0);
  });

  const totalFilteredExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = expenses
    .filter((e) => e.date === getTodayDateStr())
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>৪. দৈনিক খরচ</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            বাগান পরিচালনা ও সামগ্রী খরচের হিসাব
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            বাটি, চাকু, খাবার, পরিবহন, মালামাল ও মেরামতসহ সকল দৈনিক খরচ এন্ট্রি ও পরিচালনা করুন।
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[11px] text-neutral-500 block">আজকের মোট খরচ</span>
            <span className="text-base sm:text-lg font-bold text-neutral-900 tabular-nums">
              {formatTaka(todayTotal)}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[11px] text-emerald-800 block">নির্বাচিত মাসের মোট খরচ</span>
            <span className="text-base sm:text-lg font-bold text-emerald-900 tabular-nums">
              {formatTaka(totalFilteredExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Form - Right Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Entry Form */}
        <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              {editingExpense ? 'খরচ সম্পাদন করুন' : 'নতুন খরচ যোগ করুন'}
            </h3>
            {editingExpense && (
              <button
                onClick={cancelEdit}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                বাতিল ✕
              </button>
            )}
          </div>

          <form onSubmit={handleSaveExpense} className="space-y-4 text-xs sm:text-sm">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-700">
                  খরচের ক্যাটাগরি *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                  className="text-[11px] font-semibold text-emerald-800 hover:underline"
                >
                  {isAddingCustomCategory ? 'ক্যাটাগরি তালিকা' : '+ নতুন ক্যাটাগরি'}
                </button>
              </div>

              {isAddingCustomCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="ক্যাটাগরির নাম (যেমন: সার, কীটনাশক)..."
                    className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-md focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold"
                  >
                    যোগ
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                টাকার পরিমাণ (৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="৫০০"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                বিবরণ বা মন্তব্য
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="দোকানের নাম, চালানের তথ্য বা নির্দিষ্ট বিবরণ..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs"
            >
              {editingExpense ? 'খরচ আপডেট করুন' : 'খরচ সংরক্ষণ করুন'}
            </button>
          </form>
        </div>

        {/* Category breakdown Strip & Monthly Filter */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Total Cards */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">
              ক্যাটাগরিভিত্তিক খরচের মোট হিসাব
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {availableCategories.map((cat) => {
                const catTotal = categoryTotals[cat] || 0;
                return (
                  <div
                    key={cat}
                    onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      filterCategory === cat
                        ? 'bg-emerald-50 border-emerald-400 font-bold'
                        : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="text-neutral-500 text-[11px] truncate">{cat}</div>
                    <div className="text-neutral-900 font-semibold tabular-nums mt-0.5">
                      {formatTaka(catTotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            {/* Table Header Filter Controls */}
            <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-700">ফিল্টার:</span>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-2 py-1 bg-white border border-neutral-300 rounded-md focus:outline-hidden"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1 bg-white border border-neutral-300 rounded-md focus:outline-hidden"
                >
                  <option value="all">সকল ক্যাটাগরি</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="font-semibold text-neutral-800">
                মোট রেকর্ড: <span className="tabular-nums">{toBanglaNumber(filteredExpenses.length)}</span> টি
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-neutral-500">
                এই ফিল্টারে কোনো খরচ পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-neutral-100 sticky top-0 border-b border-neutral-200 text-neutral-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">ক্যাটাগরি</th>
                      <th className="py-2.5 px-3 text-right">পরিমাণ (৳)</th>
                      <th className="py-2.5 px-3 min-w-[160px]">বিবরণ</th>
                      <th className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">আইডি</th>
                      <th className="py-2.5 px-3 text-center w-20">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {formatDateBangla(exp.date)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-800">
                          {exp.category}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900 tabular-nums">
                          {formatTaka(exp.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600">
                          {exp.description || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">
                          {exp.id}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(exp)}
                              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
                              title="সম্পাদনা"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(exp.id)}
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
                      <td colSpan={2} className="py-3 px-3">
                        সর্বমোট
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-900 font-bold tabular-nums">
                        {formatTaka(totalFilteredExpense)}
                      </td>
                      <td colSpan={3}></td>
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
