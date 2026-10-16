import React from 'react';
import { LayoutDashboard, Camera, ReceiptText, Shield } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'expenses' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'expenses' | 'settings') => void;
  onOpenScan: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenScan,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 py-1.5 px-4 sm:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'dashboard'
              ? 'text-emerald-700 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        {/* Big Center Scan Action */}
        <button
          onClick={onOpenScan}
          className="relative -top-3 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform"
          aria-label="Scan or add receipt"
        >
          <Camera className="w-6 h-6" />
        </button>

        {/* Expenses */}
        <button
          onClick={() => onSelectTab('expenses')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'expenses'
              ? 'text-emerald-700 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span>Expenses</span>
        </button>

        {/* Settings / Privacy */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'settings'
              ? 'text-emerald-700 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Shield className="w-5 h-5 mb-0.5" />
          <span>Privacy & AI</span>
        </button>
      </div>
    </nav>
  );
};
