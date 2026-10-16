/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { ExpenseHistory } from './components/ExpenseHistory';
import { SettingsModal } from './components/SettingsModal';
import { RawTextModal } from './components/RawTextModal';
import { ExpenseItem, ReceiptExtractionResult } from './types/expense';
import { dbService } from './services/db';
import { CheckCircle2, ShieldCheck, Camera, Plus, Loader2 } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'expenses' | 'settings'>('dashboard');

  // Scanner & Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRawTextOpen, setIsRawTextOpen] = useState(false);

  // Active form data
  const [formInitialData, setFormInitialData] = useState<Partial<ExpenseItem> | ReceiptExtractionResult | undefined>(undefined);
  const [formReceiptImage, setFormReceiptImage] = useState<string | undefined>(undefined);
  const [formRawOcrText, setFormRawOcrText] = useState<string | undefined>(undefined);

  // Active raw text inspector
  const [inspectRawText, setInspectRawText] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Initialize DB and load expenses
  const loadExpenses = useCallback(async () => {
    try {
      const items = await dbService.init();
      setExpenses(items);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Handler: OCR Extraction Complete -> Open Editable Form
  const handleExtractionComplete = (result: ReceiptExtractionResult, imageDataUrl: string) => {
    setIsScannerOpen(false);
    setFormInitialData(result);
    setFormReceiptImage(imageDataUrl);
    setFormRawOcrText(result.rawText);
    setIsFormOpen(true);
    showToast('Receipt parsed! Verify the extracted details.');
  };

  // Handler: Manual Entry without OCR
  const handleManualEntry = () => {
    setIsScannerOpen(false);
    setFormInitialData({
      merchant: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      category: 'Other',
    });
    setFormReceiptImage(undefined);
    setFormRawOcrText(undefined);
    setIsFormOpen(true);
  };

  // Handler: Edit an existing expense
  const handleEditExpense = (expense: ExpenseItem) => {
    setFormInitialData(expense);
    setFormReceiptImage(expense.receiptImageData);
    setFormRawOcrText(expense.rawOcrText);
    setIsFormOpen(true);
  };

  // Handler: Save expense (New or Updated)
  const handleSaveExpense = async (savedItem: ExpenseItem) => {
    try {
      await dbService.add(savedItem);
      await loadExpenses();
      setIsFormOpen(false);
      showToast(`Expense for "${savedItem.merchant}" saved locally!`);
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Error saving expense to local storage.');
    }
  };

  // Handler: Delete single expense
  const handleDeleteExpense = async (id: string) => {
    try {
      await dbService.delete(id);
      await loadExpenses();
      showToast('Expense removed.');
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  // Handler: Remove sample expenses
  const handleClearSampleData = async () => {
    try {
      const updated = await dbService.removeSampleExpenses();
      setExpenses(updated);
      showToast('Sample expenses removed. Only your own entries remain.');
    } catch (err) {
      console.error('Failed to clear samples:', err);
    }
  };

  // Handler: Reload sample expenses
  const handleAddSampleData = async () => {
    try {
      const updated = await dbService.resetSampleExpenses();
      setExpenses(updated);
      showToast('Sample expenses reloaded.');
    } catch (err) {
      console.error('Failed to reload samples:', err);
    }
  };

  // Handler: View raw OCR text
  const handleViewRawText = (text: string) => {
    setInspectRawText(text);
    setIsRawTextOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 pb-20 sm:pb-8">
      {/* Top Header */}
      <Header
        expenses={expenses}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScan={() => setIsScannerOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-xs font-semibold text-stone-600">
              Loading local encrypted store...
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Navigation Tabs */}
            <div className="hidden sm:flex items-center gap-2 mb-6 border-b border-stone-200 pb-2">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentTab('expenses')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  currentTab === 'expenses'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                All Expenses ({expenses.length})
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer ml-auto flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Privacy & AI Settings
              </button>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Receipt
              </button>
            </div>

            {/* Tab: Dashboard */}
            {currentTab === 'dashboard' && (
              <Dashboard
                expenses={expenses}
                onOpenScan={() => setIsScannerOpen(true)}
                onViewAllExpenses={() => setCurrentTab('expenses')}
                onEditExpense={handleEditExpense}
                onClearSampleData={handleClearSampleData}
                onAddSampleData={handleAddSampleData}
                onOpenPrivacyNotice={() => setIsSettingsOpen(true)}
              />
            )}

            {/* Tab: Expenses History */}
            {currentTab === 'expenses' && (
              <ExpenseHistory
                expenses={expenses}
                onDeleteExpense={handleDeleteExpense}
                onEditExpense={handleEditExpense}
                onViewReceipt={(img, raw) => {
                  setFormReceiptImage(img);
                  if (raw) handleViewRawText(raw);
                }}
                onNewScan={() => setIsScannerOpen(true)}
              />
            )}

            {/* Tab: Settings (Mobile View Tab) */}
            {currentTab === 'settings' && (
              <div className="bg-white rounded-2xl p-5 border border-stone-200">
                <SettingsModal
                  isOpen={true}
                  onClose={() => setCurrentTab('dashboard')}
                  expenses={expenses}
                  onRefreshData={loadExpenses}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for Mobile Quick Add */}
      <div className="fixed bottom-20 right-4 z-20 sm:hidden">
        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 active:scale-95 transition-transform"
          aria-label="Scan Receipt"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-lg w-full">
            <ReceiptScanner
              onExtractionComplete={handleExtractionComplete}
              onManualEntry={handleManualEntry}
              onClose={() => setIsScannerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Expense Edit / Verify Form Modal */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        initialData={formInitialData}
        receiptImageData={formReceiptImage}
        rawOcrText={formRawOcrText}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveExpense}
        onViewRawText={handleViewRawText}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen && currentTab !== 'settings'}
        onClose={() => setIsSettingsOpen(false)}
        expenses={expenses}
        onRefreshData={loadExpenses}
      />

      {/* Raw OCR Text Modal */}
      <RawTextModal
        isOpen={isRawTextOpen}
        rawText={inspectRawText}
        onClose={() => setIsRawTextOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-60 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-stone-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenScan={() => setIsScannerOpen(true)}
      />
    </div>
  );
}
