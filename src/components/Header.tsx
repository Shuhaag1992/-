/**
 * Header Component
 * Top Bar Contract: Zone 1 (Brand) - Zone 2 (Garden & Navigation Context) - Zone 3 (Action)
 */

import React from 'react';
import { Garden } from '../types';
import { Sprout, RefreshCw, Database, Layers, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  currentGarden: Garden | null;
  onSwitchGarden: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentGarden,
  onSwitchGarden,
  onOpenBackup,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
            <Sprout className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap">
              রাবার বাগান হিসাব
            </span>
            <span className="text-xs text-neutral-500 hidden sm:inline whitespace-nowrap">
              হিসাব ব্যবস্থাপনা সফটওয়্যার
            </span>
          </div>
        </div>

        {/* Zone 2: Current Garden Context / Breadcrumb / Back Button */}
        <div className="flex items-center gap-2 overflow-hidden">
          {currentGarden ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchGarden}
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors shrink-0"
                title="বাগান তালিকায় ফিরে যান"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">বাগান তালিকা</span>
              </button>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-md truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-semibold text-neutral-900 truncate">{currentGarden.name}</span>
                <span className="text-neutral-400 hidden sm:inline">·</span>
                <span className="text-neutral-500 hidden sm:inline truncate">{currentGarden.location}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-neutral-500 font-medium">
              বাগান নির্বাচন করুন
            </div>
          )}
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {currentGarden && (
            <button
              onClick={onSwitchGarden}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 hover:text-neutral-900 transition-colors whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>বাগান পরিবর্তন</span>
            </button>
          )}

          <button
            onClick={onOpenBackup}
            type="button"
            title="ব্যাকআপ ও ডেটা পুনরুদ্ধার"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors whitespace-nowrap"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ব্যাকআপ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
