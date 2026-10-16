export type ExpenseCategory =
  | 'Inventory'
  | 'Office Supplies'
  | 'Meals & Coffee'
  | 'Travel & Fuel'
  | 'Equipment & Tools'
  | 'Utilities & Rent'
  | 'Software & Services'
  | 'Repairs & Maintenance'
  | 'Marketing & Ads'
  | 'Other';

export interface ExpenseItem {
  id: string;
  merchant: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  tax?: number;
  paymentMethod?: 'Card' | 'Cash' | 'Bank Transfer' | 'Other';
  notes?: string;
  receiptImageData?: string; // base64 or object URL (stored locally in IndexedDB)
  rawOcrText?: string;
  extractedConfidence?: number; // 0 to 1
  isSample?: boolean;
  createdAt: number;
}

export interface ReceiptExtractionResult {
  merchant: string;
  amount: number | null;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  tax?: number;
  paymentMethod?: 'Card' | 'Cash' | 'Bank Transfer' | 'Other';
  confidence: number;
  rawText: string;
  lineItems?: Array<{ description: string; price: number }>;
  providerName: string;
  notes?: string;
}

export interface AIProviderConfig {
  activeProvider: 'local-heuristic' | 'ollama' | 'custom-open-weight';
  ollamaEndpoint?: string;
  ollamaModel?: string;
  customEndpoint?: string;
}
