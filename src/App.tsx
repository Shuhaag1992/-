/**
 * রাবার বাগান হিসাব ব্যবস্থাপনা সফটওয়্যার (Rubber Garden Accounting Management)
 * Main Application Orchestration
 */

import React, { useState, useEffect } from 'react';
import { Garden, AppData, DailyWorkLog, Worker, SalarySettlement } from './types';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { GardenSelector } from './components/GardenSelector';
import { DailyWorkEntry } from './components/DailyWorkEntry';
import { WorkerManagement } from './components/WorkerManagement';
import { DailySummary } from './components/DailySummary';
import { ExpenseTracker } from './components/ExpenseTracker';
import { MonthlySummary } from './components/MonthlySummary';
import { InvestmentTarget } from './components/InvestmentTarget';
import { IncomeTracker } from './components/IncomeTracker';
import { SalarySettlementView } from './components/SalarySettlementView';
import { ReportsAndBackup } from './components/ReportsAndBackup';
import { PrintableView, PrintableDocType } from './components/PrintableView';
import bannerImg from './assets/images/rubber_plantation_banner_1791682414538.jpg';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => StorageService.loadData());

  // Restore garden from hash or localStorage
  const [selectedGardenId, setSelectedGardenId] = useState<string | null>(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/garden\/([^/]+)/);
    if (match && match[1]) {
      return match[1];
    }
    const saved = localStorage.getItem('rubber_garden_active_garden');
    return saved || null;
  });

  // Restore active tab from hash or localStorage
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/garden\/[^/]+\/([^/?]+)/);
    if (match && match[1]) {
      return match[1] as NavTab;
    }
    const saved = localStorage.getItem('rubber_garden_active_tab') as NavTab;
    return saved || 'daily_work';
  });

  // Printable View state
  const [printDoc, setPrintDoc] = useState<{
    docType: PrintableDocType;
    settlementData?: SalarySettlement | null;
    dailyData?: {
      date: string;
      logs: DailyWorkLog[];
      workers: Worker[];
    } | null;
    monthlyData?: {
      monthStr: string;
      totalWorkdays: number;
      totalEarned: number;
      totalExpenses: number;
      totalIncome: number;
      netProfit: number;
    } | null;
  } | null>(null);

  // Synchronize URL hash and localStorage whenever garden or tab changes
  useEffect(() => {
    if (selectedGardenId) {
      localStorage.setItem('rubber_garden_active_garden', selectedGardenId);
      localStorage.setItem('rubber_garden_active_tab', activeTab);
      const targetHash = `#/garden/${selectedGardenId}/${activeTab}`;
      if (window.location.hash !== targetHash) {
        const hashMatch = window.location.hash.match(/^#\/garden\/([^/]+)/);
        if (hashMatch && hashMatch[1] === selectedGardenId) {
          window.history.replaceState(
            { gardenId: selectedGardenId, tab: activeTab },
            '',
            targetHash
          );
        } else {
          window.history.pushState(
            { gardenId: selectedGardenId, tab: activeTab },
            '',
            targetHash
          );
        }
      }
    } else {
      localStorage.removeItem('rubber_garden_active_garden');
      localStorage.removeItem('rubber_garden_active_tab');
      if (window.location.hash && window.location.hash !== '#/') {
        window.history.pushState({ gardenId: null }, '', '#/');
      }
    }
  }, [selectedGardenId, activeTab]);

  // Handle browser Back / Forward buttons (popstate event)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If print preview is open, back button simply exits print preview
      if (printDoc) {
        setPrintDoc(null);
        return;
      }

      const hash = window.location.hash;
      const match = hash.match(/^#\/garden\/([^/]+)(?:\/([^/?]+))?/);
      if (match && match[1]) {
        setSelectedGardenId(match[1]);
        if (match[2]) {
          setActiveTab(match[2] as NavTab);
        }
      } else {
        setSelectedGardenId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [printDoc]);

  // Reload data from local storage
  const handleRefreshData = () => {
    const updated = StorageService.loadData();
    setAppData(updated);
  };

  const currentGarden = appData.gardens.find((g) => g.id === selectedGardenId) || null;

  // Garden-specific workers, logs, expenses, incomes, settlements, advances
  const currentWorkers = currentGarden
    ? appData.workers.filter((w) => w.gardenId === currentGarden.id)
    : [];
  const currentDailyLogs = currentGarden
    ? appData.dailyWorkLogs.filter((l) => l.gardenId === currentGarden.id)
    : [];
  const currentExpenses = currentGarden
    ? appData.expenses.filter((e) => e.gardenId === currentGarden.id)
    : [];
  const currentIncomes = currentGarden
    ? appData.incomes.filter((i) => i.gardenId === currentGarden.id)
    : [];
  const currentAdvances = currentGarden
    ? appData.advancePayments.filter((a) => a.gardenId === currentGarden.id)
    : [];
  const currentSettlements = currentGarden
    ? appData.salarySettlements.filter((s) => s.gardenId === currentGarden.id)
    : [];

  const handleSelectGarden = (garden: Garden) => {
    setSelectedGardenId(garden.id);
    setActiveTab('daily_work');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchGarden = () => {
    setSelectedGardenId(null);
    setPrintDoc(null);
    localStorage.removeItem('rubber_garden_active_garden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBackup = () => {
    if (selectedGardenId) {
      setActiveTab('reports');
    } else {
      // If on garden selector screen, trigger backup download directly
      const backupStr = StorageService.exportData();
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rubber_garden_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // If Printable View is active, render the dedicated printable view
  if (printDoc && currentGarden) {
    return (
      <PrintableView
        garden={currentGarden}
        docType={printDoc.docType}
        settlementData={printDoc.settlementData}
        dailyData={printDoc.dailyData}
        monthlyData={printDoc.monthlyData}
        onBack={() => setPrintDoc(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      {/* Top Header */}
      <Header
        currentGarden={currentGarden}
        onSwitchGarden={handleSwitchGarden}
        onOpenBackup={handleOpenBackup}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!selectedGardenId || !currentGarden ? (
          <div>
            {/* Hero Image Section */}
            <div className="relative bg-emerald-950 overflow-hidden text-white">
              <div className="absolute inset-0 opacity-25 mix-blend-overlay">
                <img
                  src={bannerImg}
                  alt="রাবার বাগান দৃশ্য"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-xs mb-3">
                    <span>প্রফেশনাল রাবার এস্টেট একাউন্টিং</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    রাবার বাগান হিসাব ব্যবস্থাপনা
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-neutral-200">
                    একাধিক বাগানের শ্রমিক মজুরি, দৈনিক ট্যাপিং শিট, ডবল ও হাফ কাজ, অগ্রিম টাকা সমন্বয়, ব্যয়, রাবার বিক্রয় ও বিনিয়োগ লাভ-ক্ষতির সম্পূর্ণ নির্ভুল সফটওয়্যার।
                  </p>
                </div>
              </div>
            </div>

            {/* Screen 1: Garden Selector */}
            <GardenSelector
              appData={appData}
              onSelectGarden={handleSelectGarden}
              onRefreshData={handleRefreshData}
            />
          </div>
        ) : (
          <div>
            {/* Nine Menus Navigation Bar */}
            <Navigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              gardenName={currentGarden.name}
            />

            {/* Sub-Views for each Menu Tab */}
            <div className="pb-16">
              {/* Menu 1: Daily Work Entry */}
              {activeTab === 'daily_work' && (
                <DailyWorkEntry
                  garden={currentGarden}
                  workers={currentWorkers}
                  onRefreshData={handleRefreshData}
                />
              )}

              {/* Menu 2: Worker Management */}
              {activeTab === 'workers' && (
                <WorkerManagement
                  garden={currentGarden}
                  workers={currentWorkers}
                  onRefreshData={handleRefreshData}
                  onNavigateToDailyWork={() => setActiveTab('daily_work')}
                />
              )}

              {/* Menu 3: Daily Summary */}
              {activeTab === 'daily_summary' && (
                <DailySummary
                  garden={currentGarden}
                  workers={currentWorkers}
                  onNavigateToEditDate={(date) => setActiveTab('daily_work')}
                  onPrintSummary={(date) => {
                    const logs = StorageService.getDailyLogs(currentGarden.id, date);
                    setPrintDoc({
                      docType: 'daily_summary',
                      dailyData: {
                        date,
                        logs,
                        workers: currentWorkers,
                      },
                    });
                  }}
                />
              )}

              {/* Menu 4: Daily Expenses */}
              {activeTab === 'daily_expenses' && (
                <ExpenseTracker
                  garden={currentGarden}
                  expenses={currentExpenses}
                  onRefreshData={handleRefreshData}
                />
              )}

              {/* Menu 5: Monthly Summary */}
              {activeTab === 'monthly_summary' && (
                <MonthlySummary
                  garden={currentGarden}
                  workers={currentWorkers}
                  dailyLogs={currentDailyLogs}
                  expenses={currentExpenses}
                  incomes={currentIncomes}
                  advances={currentAdvances}
                  settlements={currentSettlements}
                  onPrintMonthlySummary={(monthStr) => {
                    const monthLogs = currentDailyLogs.filter((l) => l.date.startsWith(monthStr));
                    const monthExp = currentExpenses.filter((e) => e.date.startsWith(monthStr));
                    const monthInc = currentIncomes.filter((i) => i.date.startsWith(monthStr));
                    const totalWorkdays = monthLogs.reduce((s, l) => s + l.workdays, 0);
                    const totalEarned = monthLogs.reduce((s, l) => s + l.earnedSalary, 0);
                    const totalExpenses = monthExp.reduce((s, e) => s + e.amount, 0);
                    const totalIncome = monthInc.reduce((s, i) => s + i.amount, 0);

                    setPrintDoc({
                      docType: 'monthly_summary',
                      monthlyData: {
                        monthStr,
                        totalWorkdays,
                        totalEarned,
                        totalExpenses,
                        totalIncome,
                        netProfit: totalIncome - (totalEarned + totalExpenses),
                      },
                    });
                  }}
                />
              )}

              {/* Menu 6: Investment & Target */}
              {activeTab === 'investment_target' && (
                <InvestmentTarget
                  garden={currentGarden}
                  dailyLogs={currentDailyLogs}
                  expenses={currentExpenses}
                  incomes={currentIncomes}
                  onRefreshData={handleRefreshData}
                />
              )}

              {/* Menu 7: Income & Rubber Sales */}
              {activeTab === 'income' && (
                <IncomeTracker
                  garden={currentGarden}
                  incomes={currentIncomes}
                  onRefreshData={handleRefreshData}
                />
              )}

              {/* Menu 8: Salary Settlement */}
              {activeTab === 'salary' && (
                <SalarySettlementView
                  garden={currentGarden}
                  workers={currentWorkers}
                  onRefreshData={handleRefreshData}
                  onPrintSettlement={(settlement) => {
                    setPrintDoc({
                      docType: 'salary_settlement',
                      settlementData: settlement,
                    });
                  }}
                />
              )}

              {/* Menu 9: Reports & Backup */}
              {activeTab === 'reports' && (
                <ReportsAndBackup
                  garden={currentGarden}
                  workers={currentWorkers}
                  dailyLogs={currentDailyLogs}
                  expenses={currentExpenses}
                  incomes={currentIncomes}
                  settlements={currentSettlements}
                  onRefreshData={handleRefreshData}
                  onOpenPrintView={(docType, data) => {
                    if (docType === 'daily_summary') {
                      setPrintDoc({ docType, dailyData: data });
                    } else if (docType === 'monthly_summary') {
                      setPrintDoc({ docType, monthlyData: data });
                    } else if (docType === 'salary_settlement') {
                      setPrintDoc({ docType, settlementData: data });
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 text-center text-xs text-neutral-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>রাবার বাগান হিসাব ব্যবস্থাপনা সফটওয়্যার · সম্পূর্ণ ব্যক্তিগত ও সুরক্ষিত অফলাইন ডেটাবেস</span>
          <span>সর্বস্বত্ব সংরক্ষিত © ২০২৬</span>
        </div>
      </footer>
    </div>
  );
}
