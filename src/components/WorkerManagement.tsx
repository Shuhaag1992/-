/**
 * Menu 2: Worker Management (২. শ্রমিক তালিকা ও প্রোফাইল)
 * সম্পূর্ণ প্রোফাইল, অগ্রিম প্রদান, অগ্রিম লেজার ও বেতন হিস্ট্রি
 */

import React, { useState } from 'react';
import { Garden, Worker } from '../types';
import { StorageService } from '../services/storageService';
import {
  formatTaka,
  formatDateBangla,
  toBanglaNumber,
  generateUniqueId,
  calculateDailyWage,
} from '../utils/banglaUtils';
import { GiveAdvanceModal, AdvanceLedgerModal } from './AdvanceModal';
import {
  Users,
  UserPlus,
  Search,
  HandCoins,
  History,
  Eye,
  Edit2,
  Power,
  Phone,
  Calendar,
  X,
  Shield,
  CreditCard,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface WorkerManagementProps {
  garden: Garden;
  workers: Worker[];
  onRefreshData: () => void;
  onNavigateToDailyWork?: () => void;
}

export const WorkerManagement: React.FC<WorkerManagementProps> = ({
  garden,
  workers,
  onRefreshData,
  onNavigateToDailyWork,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const [selectedWorkerForAdvance, setSelectedWorkerForAdvance] = useState<Worker | null>(null);
  const [selectedWorkerForLedger, setSelectedWorkerForLedger] = useState<Worker | null>(null);
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<Worker | null>(null);
  const [selectedWorkerForSalaryHistory, setSelectedWorkerForSalaryHistory] = useState<Worker | null>(null);

  // Worker Form Fields
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [nid, setNid] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [address, setAddress] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-01-01');
  const [monthlySalary, setMonthlySalary] = useState<number>(12000);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingWorker(null);
    setName('');
    setFatherName('');
    setMotherName('');
    setNid('');
    setPhone('');
    setEmergencyContactName('');
    setEmergencyRelation('');
    setEmergencyPhone('');
    setAddress('');
    setJoiningDate('2026-01-01');
    setMonthlySalary(12000);
    setNotes('');
    setIsActive(true);
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setName(worker.name);
    setFatherName(worker.fatherName || '');
    setMotherName(worker.motherName || '');
    setNid(worker.nid || '');
    setPhone(worker.phone || '');
    setEmergencyContactName(worker.emergencyContactName || '');
    setEmergencyRelation(worker.emergencyRelation || '');
    setEmergencyPhone(worker.emergencyPhone || '');
    setAddress(worker.address || '');
    setJoiningDate(worker.joiningDate);
    setMonthlySalary(worker.monthlySalary);
    setNotes(worker.notes || '');
    setIsActive(worker.isActive);
    setIsAddEditModalOpen(true);
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingWorker) {
      const updated: Worker = {
        ...editingWorker,
        name: name.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        nid: nid.trim(),
        phone: phone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyRelation: emergencyRelation.trim(),
        emergencyPhone: emergencyPhone.trim(),
        address: address.trim(),
        joiningDate,
        monthlySalary: Number(monthlySalary) || 12000,
        isActive,
        notes: notes.trim(),
      };
      StorageService.saveWorker(updated);
    } else {
      const newWorker: Worker = {
        id: generateUniqueId('WRK'),
        gardenId: garden.id,
        name: name.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        nid: nid.trim(),
        phone: phone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyRelation: emergencyRelation.trim(),
        emergencyPhone: emergencyPhone.trim(),
        address: address.trim(),
        joiningDate,
        monthlySalary: Number(monthlySalary) || 12000,
        isActive: true,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      StorageService.saveWorker(newWorker);
    }

    setIsAddEditModalOpen(false);
    onRefreshData();
  };

  const handleToggleStatus = (workerId: string) => {
    StorageService.toggleWorkerStatus(workerId);
    onRefreshData();
  };

  // Filtered workers
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.phone.includes(searchTerm) ||
      (worker.address && worker.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? worker.isActive
        : !worker.isActive;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>২. শ্রমিক তালিকা ও প্রোফাইল</span>
            <span>·</span>
            <span className="text-neutral-500 font-normal">{garden.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            শ্রমিক ব্যবস্থাপনা ও অগ্রিম হিসাব
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            শ্রমিকের বিস্তারিত প্রোফাইল, দৈনিক কাজের সুযোগ, জরুরি অগ্রিম প্রদান ও অগ্রিম খতিয়ান।
          </p>
        </div>

        <button
          onClick={openAddModal}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 text-white rounded-lg text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন শ্রমিক যোগ করুন</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, মোবাইল বা ঠিকানা দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Status segmented controls */}
        <div className="flex items-center p-1 bg-neutral-100 rounded-lg border border-neutral-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            সবাই ({toBanglaNumber(workers.length)})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            সক্রিয় ({toBanglaNumber(workers.filter((w) => w.isActive).length)})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            নিষ্ক্রিয় ({toBanglaNumber(workers.filter((w) => !w.isActive).length)})
          </button>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800">কোনো শ্রমিক পাওয়া যায়নি</h3>
            <p className="text-xs text-neutral-500 mt-1">
              {searchTerm ? 'অনুসন্ধানের তথ্যের সাথে কোনো মিল নেই।' : 'বাগানে নতুন শ্রমিক যোগ করুন।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-semibold">
                  <th className="py-3 px-3 w-12 text-center">ক্র.নং</th>
                  <th className="py-3 px-4 min-w-[180px]">শ্রমিকের নাম ও পদবি</th>
                  <th className="py-3 px-3 min-w-[120px]">মাসিক বেতন ও দৈনিক রেট</th>
                  <th className="py-3 px-3 min-w-[110px] text-right">বকেয়া অগ্রিম</th>
                  <th className="py-3 px-3 min-w-[110px]">যোগদানের তারিখ</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">অবস্থা</th>
                  <th className="py-3 px-4 text-center min-w-[260px]">কার্যক্রম ও হিসাব</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredWorkers.map((worker, idx) => {
                  const dailyWage = calculateDailyWage(
                    worker.monthlySalary,
                    garden.salaryDivisor || 30
                  );
                  const outstandingAdvance = StorageService.getWorkerOutstandingAdvance(worker.id);

                  return (
                    <tr
                      key={worker.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        !worker.isActive ? 'bg-neutral-50/50 opacity-70' : ''
                      }`}
                    >
                      {/* SL */}
                      <td className="py-3 px-3 text-center text-neutral-500 font-medium tabular-nums">
                        {toBanglaNumber(idx + 1)}
                      </td>

                      {/* Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{worker.name}</div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{worker.phone || 'মোবাইল নেই'}</span>
                        </div>
                      </td>

                      {/* Salary */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900 tabular-nums">
                          {formatTaka(worker.monthlySalary)}
                        </div>
                        <div className="text-[11px] text-neutral-500 tabular-nums">
                          দৈনিক: {formatTaka(dailyWage)}
                        </div>
                      </td>

                      {/* Outstanding Advance */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-bold tabular-nums ${
                            outstandingAdvance > 0 ? 'text-amber-700' : 'text-neutral-400'
                          }`}
                        >
                          {formatTaka(outstandingAdvance)}
                        </span>
                      </td>

                      {/* Joining date */}
                      <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                        {formatDateBangla(worker.joiningDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            worker.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}
                        >
                          {worker.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Give Advance */}
                          <button
                            type="button"
                            onClick={() => setSelectedWorkerForAdvance(worker)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                            title="অগ্রিম টাকা দিন"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            <span>অগ্রিম দিন</span>
                          </button>

                          {/* View Advance Ledger */}
                          <button
                            type="button"
                            onClick={() => setSelectedWorkerForLedger(worker)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                            title="অগ্রিম হিসাবের খতিয়ান দেখুন"
                          >
                            <History className="w-3.5 h-3.5 text-neutral-500" />
                            <span>অগ্রিম হিসাব</span>
                          </button>

                          {/* Full Profile */}
                          <button
                            type="button"
                            onClick={() => setSelectedWorkerForProfile(worker)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                            title="শ্রমিকের বিস্তারিত তথ্য"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(worker)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                            title="তথ্য সম্পাদন করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(worker.id)}
                            className={`p-1.5 rounded-md transition-colors ${
                              worker.isActive
                                ? 'text-neutral-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-neutral-400 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={worker.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Give Advance Modal */}
      {selectedWorkerForAdvance && (
        <GiveAdvanceModal
          worker={selectedWorkerForAdvance}
          gardenId={garden.id}
          onClose={() => setSelectedWorkerForAdvance(null)}
          onSuccess={onRefreshData}
        />
      )}

      {/* Advance Ledger Modal */}
      {selectedWorkerForLedger && (
        <AdvanceLedgerModal
          worker={selectedWorkerForLedger}
          onClose={() => setSelectedWorkerForLedger(null)}
          onRefresh={onRefreshData}
        />
      )}

      {/* Worker Full Profile Modal */}
      {selectedWorkerForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  শ্রমিকের ব্যক্তিগত ও অফিসিয়াল প্রোফাইল
                </h3>
              </div>
              <button
                onClick={() => setSelectedWorkerForProfile(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              {/* Header Card */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xl font-bold">
                  {selectedWorkerForProfile.name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-900">
                    {selectedWorkerForProfile.name}
                  </h4>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    মাসিক বেতন: <span className="font-semibold text-neutral-800 tabular-nums">{formatTaka(selectedWorkerForProfile.monthlySalary)}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    আইডি: {selectedWorkerForProfile.id}
                  </div>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-neutral-200 rounded-lg p-3 text-xs">
                <div>
                  <span className="text-neutral-500 block">পিতার নাম:</span>
                  <span className="font-medium text-neutral-900">{selectedWorkerForProfile.fatherName || 'উল্লেখ নেই'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">মাতার নাম:</span>
                  <span className="font-medium text-neutral-900">{selectedWorkerForProfile.motherName || 'উল্লেখ নেই'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">জাতীয় পরিচয়পত্র (NID):</span>
                  <span className="font-mono text-neutral-900">{selectedWorkerForProfile.nid || 'সংরক্ষিত নেই'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">ব্যক্তিগত মোবাইল:</span>
                  <span className="font-medium text-neutral-900">{selectedWorkerForProfile.phone || 'নেই'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">জরুরি যোগাযোগকারী:</span>
                  <span className="font-medium text-neutral-900">
                    {selectedWorkerForProfile.emergencyContactName
                      ? `${selectedWorkerForProfile.emergencyContactName} (${selectedWorkerForProfile.emergencyRelation || 'সম্পর্ক'})`
                      : 'উল্লেখ নেই'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">জরুরি যোগাযোগ মোবাইল:</span>
                  <span className="font-medium text-neutral-900">{selectedWorkerForProfile.emergencyPhone || 'নেই'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-neutral-500 block">স্থায়ী ও বর্তমান ঠিকানা:</span>
                  <span className="font-medium text-neutral-900">{selectedWorkerForProfile.address || 'উল্লেখ নেই'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">চাকরিতে যোগদানের তারিখ:</span>
                  <span className="font-medium text-neutral-900">{formatDateBangla(selectedWorkerForProfile.joiningDate)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">বর্তমান স্ট্যাটাস:</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedWorkerForProfile.isActive ? 'সক্রিয় কর্মরত' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
                {selectedWorkerForProfile.notes && (
                  <div className="sm:col-span-2 pt-1 border-t border-neutral-100">
                    <span className="text-neutral-500 block">অন্যান্য নোট:</span>
                    <span className="text-neutral-800">{selectedWorkerForProfile.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedWorkerForProfile(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                {editingWorker ? 'শ্রমিকের তথ্য সম্পাদন করুন' : 'নতুন শ্রমিক যোগ করুন'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                type="button"
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    শ্রমিকের পূর্ণ নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="মো: রফিকুল ইসলাম"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    মাসিক মূল বেতন (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="100"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden tabular-nums font-bold"
                  />
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    দৈনিক বেতন হার হবে: {formatTaka(calculateDailyWage(monthlySalary, garden.salaryDivisor || 30))} (বিভাজক ৩০)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    পিতার নাম
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="পিতার নাম"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    মাতার নাম
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="মাতার নাম"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    জাতীয় পরিচয়পত্র নম্বর (NID)
                  </label>
                  <input
                    type="text"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    placeholder="1988562391000021"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    ব্যক্তিগত মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712-345678"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    জরুরি যোগাযোগকারীর নাম
                  </label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="নাম"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    সম্পর্ক
                  </label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="ভাই / পিতা / স্ত্রী"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    জরুরি মোবাইল
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="01819-000000"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  সম্পূর্ণ ঠিকানা
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="গ্রাম, ডাকঘর, থানা ও জেলা..."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    চাকরিতে যোগদানের তারিখ
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-neutral-300 focus:ring-emerald-600"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-medium text-neutral-700">
                    শ্রমিক বর্তমানে সক্রিয় কাজে আছেন
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  অন্যান্য নোট বা দক্ষতা
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="দক্ষ ট্যাপার, ড্রাম বহনকারী, বিশ্বস্ত..."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
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
