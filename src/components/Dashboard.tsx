import React, { useMemo } from 'react';
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Camera,
  ShieldCheck,
  ArrowRight,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
  Calendar,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { ExpenseItem } from '../types/expense';
import { formatCurrency, getCategoryBadgeClasses } from '../utils/categoryColors';
import { dbService } from '../services/db';

interface DashboardProps {
  expenses: ExpenseItem[];
  onOpenScan: () => void;
  onViewAllExpenses: () => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onClearSampleData: () => void;
  onAddSampleData: () => void;
  onOpenPrivacyNotice: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  onOpenScan,
  onViewAllExpenses,
  onEditExpense,
  onClearSampleData,
  onAddSampleData,
  onOpenPrivacyNotice,
}) => {
  // Compute analytics
  const { totalAmount, receiptCount, averageExpense, topCategory, sampleCount, categoryBreakdown } =
    useMemo(() => {
      const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
      const count = expenses.length;
      const avg = count > 0 ? total / count : 0;
      const samples = expenses.filter((e) => e.isSample).length;

      // Category breakdown
      const catMap: Record<string, number> = {};
      for (const item of expenses) {
        catMap[item.category] = (catMap[item.category] || 0) + item.amount;
      }

      let bestCat = 'None';
      let bestCatAmount = 0;
      for (const [cat, amt] of Object.entries(catMap)) {
        if (amt > bestCatAmount) {
          bestCatAmount = amt;
          bestCat = cat;
        }
      }

      return {
        totalAmount: total,
        receiptCount: count,
        averageExpense: avg,
        topCategory: bestCat,
        sampleCount: samples,
        categoryBreakdown: catMap,
      };
    }, [expenses]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [expenses]);

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export yet.');
      return;
    }
    dbService.downloadCSV(expenses);
  };

  return (
    <div className="space-y-5">
      {/* Privacy Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Privacy First Guarantee
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
              Saved expenses and receipt photos stay strictly in this browser's IndexedDB. Never uploaded to any external server or cloud service.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenPrivacyNotice}
          className="self-start sm:self-auto text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 shrink-0 cursor-pointer"
        >
          View Details
        </button>
      </div>

      {/* Sample Data Notice if samples present */}
      {sampleCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Showing <strong>{sampleCount} sample expenses</strong> to help you explore.
            </span>
          </div>
          <button
            onClick={onClearSampleData}
            className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Remove Sample Data
          </button>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Across all time
          </div>
        </div>

        {/* Total Receipts */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Receipts
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {receiptCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {sampleCount > 0 ? `${receiptCount - sampleCount} user + ${sampleCount} sample` : 'Saved in IndexedDB'}
          </div>
        </div>

        {/* Average Spend */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Avg. Expense
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {formatCurrency(averageExpense)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Per transaction</div>
        </div>

        {/* Top Category */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Top Category
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold text-stone-900 truncate">
            {topCategory}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 truncate">
            {topCategory !== 'None' ? formatCurrency(categoryBreakdown[topCategory] || 0) : '$0.00'}
          </div>
        </div>
      </div>

      {/* Main Action Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md shadow-emerald-700/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">
            Got a new shop receipt or invoice?
          </h2>
          <p className="text-emerald-100 text-xs mt-1 max-w-md leading-relaxed">
            Snap a photo or upload an image. In-browser OCR extracts the merchant, total, date, and category automatically.
          </p>
        </div>
        <button
          onClick={onOpenScan}
          className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-800 hover:bg-stone-50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
          Scan or Upload Receipt
        </button>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              Recent Expenses
            </h3>
            <p className="text-xs text-stone-500">
              Latest transactions recorded on this device
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              title="Download as CSV spreadsheet"
              className="text-xs font-semibold text-stone-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer p-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={onViewAllExpenses}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1.5 rounded-lg"
            >
              View All ({expenses.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-stone-500 text-xs mb-3">No expenses recorded yet.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={onAddSampleData}
                className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
              >
                Load Sample Data
              </button>
              <button
                onClick={onOpenScan}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Scan Receipt
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                onClick={() => onEditExpense(expense)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-stone-600">
                      {expense.category.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {expense.merchant}
                      </p>
                      {expense.isSample && (
                        <span className="text-[9px] px-1 bg-stone-100 text-stone-500 rounded font-medium">
                          Sample
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                      <span>{expense.date}</span>
                      <span>•</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getCategoryBadgeClasses(
                          expense.category
                        )}`}
                      >
                        {expense.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {expense.paymentMethod || 'Card'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
