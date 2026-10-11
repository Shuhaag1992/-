/**
 * Advance Modal Component
 * ১. অগ্রিম টাকা প্রদান (Give Advance)
 * ২. অগ্রিম হিসাবের লেজার ও সংশোধন (Advance Ledger & Reversal)
 */

import React, { useState } from 'react';
import { Worker, AdvancePayment } from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  formatDateBangla,
  generateUniqueId,
  getTodayDateStr,
} from '../utils/banglaUtils';
import {
  X,
  PlusCircle,
  History,
  RotateCcw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface GiveAdvanceModalProps {
  worker: Worker;
  gardenId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const GiveAdvanceModal: React.FC<GiveAdvanceModalProps> = ({
  worker,
  gardenId,
  onClose,
  onSuccess,
}) => {
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [amount, setAmount] = useState<number>(1000);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const currentOutstanding = StorageService.getWorkerOutstandingAdvance(worker.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('সঠিক অগ্রিম টাকার পরিমাণ দিন।');
      return;
    }

    const newAdvance: AdvancePayment = {
      id: generateUniqueId('ADV'),
      gardenId,
      workerId: worker.id,
      date,
      amount: Number(amount),
      reason: reason.trim() || 'জরুরি প্রয়োজন',
      status: 'pending',
      adjustedAmount: 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    StorageService.saveAdvance(newAdvance);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">
              অগ্রিম টাকা দিন
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-neutral-400 hover:text-neutral-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Info Card */}
        <div className="my-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-neutral-500">শ্রমিকের নাম:</span>
            <span className="font-bold text-neutral-900 text-sm">{worker.name}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-neutral-500">মাসিক বেতন:</span>
            <span className="font-semibold text-neutral-800 tabular-nums">
              {formatTaka(worker.monthlySalary)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-dashed border-neutral-200">
            <span className="text-neutral-500">বর্তমান বকেয়া অগ্রিম:</span>
            <span className="font-bold text-amber-700 tabular-nums">
              {formatTaka(currentOutstanding)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              টাকা দেওয়ার তারিখ *
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
              অগ্রিম টাকার পরিমাণ (৳) *
            </label>
            <input
              type="number"
              required
              min="100"
              step="50"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              টাকা নেওয়ার কারণ বা মন্তব্য
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="পারিবারিক খরচ, ওষুধ, ঈদের কেনাকাটা..."
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-xs"
            >
              অগ্রিম প্রদান নিশ্চিত করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AdvanceLedgerModalProps {
  worker: Worker;
  onClose: () => void;
  onRefresh: () => void;
}

export const AdvanceLedgerModal: React.FC<AdvanceLedgerModalProps> = ({
  worker,
  onClose,
  onRefresh,
}) => {
  const [reversalReason, setReversalReason] = useState<string>('');
  const [selectedAdvToReverse, setSelectedAdvToReverse] = useState<string | null>(null);

  const advances = StorageService.getWorkerAdvances(worker.id).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const totalTaken = advances.reduce(
    (sum, a) => (a.status !== 'reversed' ? sum + a.amount : sum),
    0
  );
  const totalAdjusted = advances.reduce(
    (sum, a) => (a.status !== 'reversed' ? sum + (a.adjustedAmount || 0) : sum),
    0
  );
  const currentOutstanding = Math.max(0, totalTaken - totalAdjusted);

  const handleReverse = (advId: string) => {
    if (!reversalReason.trim()) {
      alert('সংশোধন বা বাতিলের সুনির্দিষ্ট কারণ লিখুন।');
      return;
    }
    StorageService.reverseAdvance(advId, reversalReason.trim());
    setSelectedAdvToReverse(null);
    setReversalReason('');
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">
              অগ্রিম হিসাবের খতিয়ান (লেজার)
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-neutral-400 hover:text-neutral-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Summary Banner */}
        <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <div className="text-neutral-500">মোট অগ্রিম নেওয়া:</div>
            <div className="text-base font-bold text-neutral-900 mt-1 tabular-nums">
              {formatTaka(totalTaken)}
            </div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <div className="text-emerald-800 font-medium">বেতনে সমন্বিত অগ্রিম:</div>
            <div className="text-base font-bold text-emerald-900 mt-1 tabular-nums">
              {formatTaka(totalAdjusted)}
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="text-amber-800 font-medium">বর্তমান বকেয়া অগ্রিম:</div>
            <div className="text-base font-bold text-amber-900 mt-1 tabular-nums">
              {formatTaka(currentOutstanding)}
            </div>
          </div>
        </div>

        {/* Reversal Inline Dialog */}
        {selectedAdvToReverse && (
          <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
            <div className="font-semibold text-red-900">
              অগ্রিম লেনদেন সংশোধন / রিভার্সাল:
            </div>
            <input
              type="text"
              placeholder="ভুল এন্ট্রি, টাকা ফেরত দিয়েছে বা সংশোধনের কারণ লিখুন..."
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-red-300 rounded-md focus:outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAdvToReverse(null)}
                className="px-3 py-1 bg-neutral-200 text-neutral-800 rounded-md"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleReverse(selectedAdvToReverse)}
                className="px-3 py-1 bg-red-600 text-white rounded-md font-semibold"
              >
                নিশ্চিত রিভার্স করুন
              </button>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">আইডি</th>
                <th className="py-2.5 px-3">কারণ / বিবরণ</th>
                <th className="py-2.5 px-3 text-right">পরিমাণ</th>
                <th className="py-2.5 px-3 text-right">সমন্বয়</th>
                <th className="py-2.5 px-3 text-center">অবস্থা</th>
                <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-neutral-500">
                    কোনো অগ্রিম লেনদেনের রেকর্ড নেই
                  </td>
                </tr>
              ) : (
                advances.map((adv) => {
                  const isReversed = adv.status === 'reversed';
                  const isAdjusted = adv.status === 'adjusted';
                  const isPartially = adv.status === 'partially_adjusted';

                  return (
                    <tr
                      key={adv.id}
                      className={isReversed ? 'bg-neutral-50/70 opacity-60' : 'hover:bg-neutral-50'}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {formatDateBangla(adv.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">
                        {adv.id}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-800">
                        {adv.reason}
                        {adv.notes && (
                          <span className="block text-[10px] text-neutral-500">{adv.notes}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        {formatTaka(adv.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-800 tabular-nums">
                        {formatTaka(adv.adjustedAmount || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isReversed && (
                          <span className="text-[11px] text-red-600 font-medium">রিভার্সড</span>
                        )}
                        {isAdjusted && (
                          <span className="text-[11px] text-emerald-700 font-medium">সম্পূর্ণ সমন্বিত</span>
                        )}
                        {isPartially && (
                          <span className="text-[11px] text-amber-700 font-medium">আংশিক সমন্বিত</span>
                        )}
                        {!isReversed && !isAdjusted && !isPartially && (
                          <span className="text-[11px] text-neutral-700 font-medium">বকেয়া</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!isReversed && !isAdjusted && (
                          <button
                            type="button"
                            onClick={() => setSelectedAdvToReverse(adv.id)}
                            className="text-neutral-500 hover:text-red-600 p-1 rounded-md"
                            title="সংশোধন বা রিভার্স করুন"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
