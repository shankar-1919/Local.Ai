import React from 'react';
import { ShieldCheck, Database, Sliders, FileSpreadsheet } from 'lucide-react';
import { ExpenseItem } from '../types/expense';
import { dbService } from '../services/db';

interface HeaderProps {
  expenses: ExpenseItem[];
  onOpenSettings: () => void;
  onOpenScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({ expenses, onOpenSettings }) => {
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export yet.');
      return;
    }
    dbService.downloadCSV(expenses);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M14 8H8" />
              <path d="M16 12H8" />
              <path d="M13 16H8" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-stone-900">
                LocalBiz <span className="text-emerald-600 font-extrabold">AI</span>
              </h1>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                100% Offline
              </span>
            </div>
            <p className="text-xs text-stone-500 font-normal">
              Private expense tracker for shops & freelancers
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            title="Export expenses to CSV spreadsheet"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>

          <button
            onClick={onOpenSettings}
            title="Privacy, Storage, and AI Settings"
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200 sm:border-transparent cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          >
            <Sliders className="w-4 h-4 text-stone-700" />
            <span className="hidden md:inline">Settings & AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
