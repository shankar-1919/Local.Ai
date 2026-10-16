import { ExpenseItem } from '../types/expense';
import { INITIAL_SAMPLE_EXPENSES } from './sampleData';

const DB_NAME = 'LocalBizAI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'expenses';
const LOCALSTORAGE_KEY = 'localbiz_expenses_backup_v1';
const SEEDED_KEY = 'localbiz_has_seeded_v1';

// Open IndexedDB database
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// LocalStorage fallback utilities
function getFromLocalStorage(): ExpenseItem[] {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('LocalStorage read error:', err);
    return [];
  }
}

function saveToLocalStorage(expenses: ExpenseItem[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.warn('LocalStorage write error:', err);
  }
}

export const dbService = {
  async init(): Promise<ExpenseItem[]> {
    try {
      const db = await openDatabase();
      const expenses = await this.getAll();
      
      const hasSeeded = localStorage.getItem(SEEDED_KEY);
      if (expenses.length === 0 && !hasSeeded) {
        // Seed initial sample expenses
        for (const item of INITIAL_SAMPLE_EXPENSES) {
          await this.add(item);
        }
        localStorage.setItem(SEEDED_KEY, 'true');
        return await this.getAll();
      }
      return expenses;
    } catch (err) {
      console.warn('IndexedDB initialization failed, falling back to LocalStorage:', err);
      let localItems = getFromLocalStorage();
      const hasSeeded = localStorage.getItem(SEEDED_KEY);
      if (localItems.length === 0 && !hasSeeded) {
        localItems = [...INITIAL_SAMPLE_EXPENSES];
        saveToLocalStorage(localItems);
        localStorage.setItem(SEEDED_KEY, 'true');
      }
      return localItems;
    }
  },

  async getAll(): Promise<ExpenseItem[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const items: ExpenseItem[] = req.result || [];
          // Sort by date descending
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
          resolve(items);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      const items = getFromLocalStorage();
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
      return items;
    }
  },

  async add(expense: ExpenseItem): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(expense);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB add error, falling back to LocalStorage:', err);
    }
    // Also keep localstorage backup updated
    const local = getFromLocalStorage().filter(x => x.id !== expense.id);
    local.push(expense);
    saveToLocalStorage(local);
  },

  async update(expense: ExpenseItem): Promise<void> {
    return this.add(expense);
  },

  async delete(id: string): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB delete error, falling back to LocalStorage:', err);
    }
    const local = getFromLocalStorage().filter(x => x.id !== id);
    saveToLocalStorage(local);
  },

  async removeSampleExpenses(): Promise<ExpenseItem[]> {
    const all = await this.getAll();
    const samples = all.filter(item => item.isSample);
    for (const sample of samples) {
      await this.delete(sample.id);
    }
    return await this.getAll();
  },

  async resetSampleExpenses(): Promise<ExpenseItem[]> {
    for (const item of INITIAL_SAMPLE_EXPENSES) {
      await this.add(item);
    }
    return await this.getAll();
  },

  async clearAll(): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB clear error:', err);
    }
    saveToLocalStorage([]);
  },

  exportToCSV(expenses: ExpenseItem[]): string {
    const headers = [
      'ID',
      'Date',
      'Merchant',
      'Category',
      'Amount',
      'Tax',
      'Payment Method',
      'Notes',
      'Sample Data'
    ];

    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = expenses.map(exp => [
      escapeCSV(exp.id),
      escapeCSV(exp.date),
      escapeCSV(exp.merchant),
      escapeCSV(exp.category),
      exp.amount.toFixed(2),
      exp.tax !== undefined ? exp.tax.toFixed(2) : '',
      escapeCSV(exp.paymentMethod || 'Card'),
      escapeCSV(exp.notes || ''),
      exp.isSample ? 'Yes' : 'No'
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  },

  downloadCSV(expenses: ExpenseItem[], filename = 'localbiz_expenses.csv'): void {
    const csvContent = this.exportToCSV(expenses);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportJSON(expenses: ExpenseItem[]): void {
    const dataStr = JSON.stringify(expenses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `localbiz_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async importJSON(jsonString: string): Promise<ExpenseItem[]> {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON format: expected an array of expenses');
    }
    for (const item of parsed) {
      if (item && item.id && item.merchant && typeof item.amount === 'number') {
        await this.add(item);
      }
    }
    return await this.getAll();
  }
};
