/**
 * Navigation Component for Garden Views
 * ৯টি প্রধান মেনুর ক্রম মেনে তৈরি
 */

import React from 'react';
import {
  CalendarDays,
  Users,
  ClipboardList,
  Receipt,
  FileSpreadsheet,
  Target,
  BadgeDollarSign,
  Banknote,
  FileText,
} from 'lucide-react';

export type NavTab =
  | 'daily_work'
  | 'workers'
  | 'daily_summary'
  | 'daily_expenses'
  | 'monthly_summary'
  | 'investment_target'
  | 'income'
  | 'salary'
  | 'reports';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  gardenName: string;
}

export const menuItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'daily_work', label: '১. দৈনিক হিসাব', icon: CalendarDays },
  { id: 'workers', label: '২. শ্রমিক তালিকা', icon: Users },
  { id: 'daily_summary', label: '৩. ডেইলি সামারি', icon: ClipboardList },
  { id: 'daily_expenses', label: '৪. দৈনিক খরচ', icon: Receipt },
  { id: 'monthly_summary', label: '৫. মাসিক সামারি', icon: FileSpreadsheet },
  { id: 'investment_target', label: '৬. বিনিয়োগ ও টার্গেট', icon: Target },
  { id: 'income', label: '৭. আয় ও বিক্রয়', icon: BadgeDollarSign },
  { id: 'salary', label: '৮. বেতন ও পেমেন্ট', icon: Banknote },
  { id: 'reports', label: '৯. রিপোর্ট ও ব্যাকআপ', icon: FileText },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  gardenName,
}) => {
  return (
    <div className="bg-white border-b border-neutral-200 sticky top-16 z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile View: Horizontal scrolling tabs */}
        <nav
          aria-label="Garden Navigation"
          className="flex items-center space-x-1 overflow-x-auto py-2.5 no-scrollbar scroll-smooth"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
