import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Tag,
  ArrowUpDown,
  CreditCard,
  FileText,
  AlertTriangle,
  Receipt,
  Eye,
} from 'lucide-react';
import { ExpenseItem, ExpenseCategory } from '../types/expense';
import { CATEGORIES, getCategoryBadgeClasses, formatCurrency } from '../utils/categoryColors';
import { dbService } from '../services/db';

interface ExpenseHistoryProps {
  expenses: ExpenseItem[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onViewReceipt: (imageData: string, rawText?: string) => void;
  onNewScan: () => void;
}

export const ExpenseHistory: React.FC<ExpenseHistoryProps> = ({
  expenses,
  onDeleteExpense,
  onEditExpense,
  onViewReceipt,
  onNewScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'THIS_YEAR'>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

  // Filter & Sort Logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return expenses
      .filter((item) => {
        // 1. Search Query
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchMerchant = item.merchant.toLowerCase().includes(q);
          const matchNotes = (item.notes || '').toLowerCase().includes(q);
          const matchAmount = item.amount.toString().includes(q);
          if (!matchMerchant && !matchNotes && !matchAmount) {
            return false;
          }
        }

        // 2. Category
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false;
        }

        // 3. Date Filter
        if (dateFilter !== 'ALL') {
          const itemDate = new Date(item.date);
          if (dateFilter === 'THIS_MONTH') {
            if (itemDate.getFullYear() !== currentYear || itemDate.getMonth() !== currentMonth) {
              return false;
            }
          } else if (dateFilter === 'LAST_30_DAYS') {
            const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < 0 || diffDays > 30) {
              return false;
            }
          } else if (dateFilter === 'THIS_YEAR') {
            if (itemDate.getFullYear() !== currentYear) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt;
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt;
        }
        if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [expenses, searchTerm, selectedCategory, dateFilter, sortBy]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const handleExportFiltered = () => {
    if (filteredExpenses.length === 0) {
      alert('No expenses match the current filter to export.');
      return;
    }
    const filterTag = selectedCategory === 'ALL' ? 'all' : selectedCategory.toLowerCase().replace(/\s+/g, '_');
    dbService.downloadCSV(filteredExpenses, `expenses_${filterTag}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Expense Records & History
            </h2>
            <p className="text-xs text-stone-500">
              Filter by category, search records, or download as CSV
            </p>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportFiltered}
            disabled={filteredExpenses.length === 0}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Filtered CSV ({filteredExpenses.length})
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by merchant name, notes, or amount..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 p-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between text-xs font-medium text-stone-500 pt-2 border-t border-stone-100">
          <span>
            Showing <strong className="text-stone-800">{filteredExpenses.length}</strong> of{' '}
            {expenses.length} expenses
          </span>
          <span>
            Total:{' '}
            <strong className="text-stone-900 font-bold text-sm">
              {formatCurrency(totalFilteredAmount)}
            </strong>
          </span>
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-sm mb-1">No matching expenses found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
            Try adjusting your search keywords, clearing filters, or scan a new receipt to record an expense.
          </p>
          <div className="flex justify-center gap-2">
            {(searchTerm || selectedCategory !== 'ALL' || dateFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setDateFilter('ALL');
                }}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={onNewScan}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 cursor-pointer"
            >
              Scan Receipt
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-emerald-300 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3 min-w-0">
                {/* Receipt Image Thumbnail or Category icon */}
                {expense.receiptImageData ? (
                  <div
                    onClick={() => onViewReceipt(expense.receiptImageData!, expense.rawOcrText)}
                    className="relative w-12 h-12 rounded-xl border border-stone-200 overflow-hidden shrink-0 cursor-pointer group-hover:ring-2 ring-emerald-500/40 transition-all bg-stone-100"
                    title="Click to view receipt image"
                  >
                    <img
                      src={expense.receiptImageData}
                      alt={expense.merchant}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-500">
                    <DollarSign className="w-5 h-5 text-emerald-700" />
                  </div>
                )}

                {/* Text details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-stone-900 text-sm truncate max-w-[220px]">
                      {expense.merchant}
                    </h4>
                    {expense.isSample && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-stone-100 text-stone-500 border border-stone-200">
                        Sample
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 flex-wrap">
                    <span>{expense.date}</span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClasses(
                        expense.category
                      )}`}
                    >
                      {expense.category}
                    </span>
                    {expense.paymentMethod && (
                      <>
                        <span>•</span>
                        <span className="text-[11px] text-stone-400">
                          {expense.paymentMethod}
                        </span>
                      </>
                    )}
                  </div>

                  {expense.notes && (
                    <p className="text-[11px] text-stone-500 truncate mt-1 max-w-md">
                      {expense.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Amount & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="text-left sm:text-right">
                  <div className="font-extrabold text-stone-900 text-base sm:text-lg">
                    {formatCurrency(expense.amount)}
                  </div>
                  {expense.tax !== undefined && expense.tax > 0 && (
                    <div className="text-[10px] text-stone-400">
                      Tax: {formatCurrency(expense.tax)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditExpense(expense)}
                    title="Edit expense record"
                    className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpenseToDelete(expense)}
                    title="Delete expense"
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">Delete Expense?</h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Are you sure you want to delete the expense for{' '}
              <strong className="text-stone-900">"{expenseToDelete.merchant}"</strong> (
              {formatCurrency(expenseToDelete.amount)})? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
