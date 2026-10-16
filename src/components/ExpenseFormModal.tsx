import React, { useState } from 'react';
import {
  X,
  Check,
  Calendar,
  DollarSign,
  Tag,
  Building,
  CreditCard,
  FileText,
  Eye,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { ExpenseItem, ExpenseCategory, ReceiptExtractionResult } from '../types/expense';
import { CATEGORIES } from '../utils/categoryColors';

interface ExpenseFormModalProps {
  initialData?: Partial<ExpenseItem> | ReceiptExtractionResult;
  receiptImageData?: string;
  rawOcrText?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseItem) => void;
  onViewRawText?: (text: string) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  initialData,
  receiptImageData,
  rawOcrText,
  isOpen,
  onClose,
  onSave,
  onViewRawText,
}) => {
  if (!isOpen) return null;

  const [merchant, setMerchant] = useState(initialData?.merchant || '');
  const [amount, setAmount] = useState(
    initialData?.amount !== null && initialData?.amount !== undefined
      ? String(initialData.amount)
      : ''
  );
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    (initialData?.category as ExpenseCategory) || 'Other'
  );
  const [tax, setTax] = useState(
    initialData?.tax !== undefined && initialData?.tax !== null ? String(initialData.tax) : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'Bank Transfer' | 'Other'>(
    initialData?.paymentMethod || 'Card'
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!merchant.trim()) {
      setValidationError('Please enter a merchant or business name.');
      return;
    }

    if (!date) {
      setValidationError('Please select a valid date.');
      return;
    }

    const expense: ExpenseItem = {
      id: ('id' in (initialData || {}) && (initialData as ExpenseItem).id) || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      merchant: merchant.trim(),
      amount: Math.round(parsedAmount * 100) / 100,
      date,
      category,
      tax: tax ? parseFloat(tax) : undefined,
      paymentMethod,
      notes: notes.trim(),
      receiptImageData: receiptImageData || (initialData as any)?.receiptImageData,
      rawOcrText: rawOcrText || (initialData as any)?.rawOcrText,
      isSample: false,
      createdAt: ('createdAt' in (initialData || {}) && (initialData as ExpenseItem).createdAt) || Date.now(),
    };

    onSave(expense);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="font-bold text-stone-900 text-base">
              {'id' in (initialData || {}) ? 'Edit Expense Record' : 'Verify & Save Expense'}
            </h3>
            <p className="text-xs text-stone-500">
              Review and adjust the extracted fields before saving to your device
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Validation Error banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {validationError}
            </div>
          )}

          {/* Receipt Preview Thumbnail (if image present) */}
          {receiptImageData && (
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <img
                src={receiptImageData}
                alt="Receipt thumbnail"
                onClick={() => setShowImageZoom(true)}
                className="w-16 h-16 object-cover rounded-lg border border-stone-300 cursor-pointer hover:opacity-90 transition-opacity"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-stone-800">Attached Receipt</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                    Stored Locally
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  Tap to preview full receipt image
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowImageZoom(true)}
                    className="text-[11px] text-emerald-700 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    Preview Image
                  </button>
                  {rawOcrText && onViewRawText && (
                    <button
                      type="button"
                      onClick={() => onViewRawText(rawOcrText)}
                      className="text-[11px] text-stone-600 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      View OCR Text
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Merchant */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                Merchant / Business Name *
              </label>
              <input
                type="text"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Home Depot, Sunshine Cafe"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Total Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-semibold text-stone-900 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / ACH</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Tax Amount (optional) */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                Sales Tax (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                Notes / Line Items
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Item descriptions, business purpose, client name..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 flex items-start gap-2 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              This expense and receipt image are saved locally in your device's IndexedDB. Nothing is ever sent across the network.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              Save Expense Locally
            </button>
          </div>
        </form>
      </div>

      {/* Image Zoom Modal */}
      {showImageZoom && receiptImageData && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowImageZoom(false)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={receiptImageData}
              alt="Receipt Full Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl border border-stone-700 bg-stone-900"
            />
            <p className="text-white text-xs mt-3 bg-black/60 px-3 py-1 rounded-full">
              Click anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
