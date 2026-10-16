import { createWorker } from 'tesseract.js';
import { ExpenseCategory, ReceiptExtractionResult } from '../../types/expense';

export class HeuristicOcrProvider {
  name = 'In-Browser OCR + Heuristic Parser';
  description = '100% offline client-side OCR (Tesseract.js) with deterministic regex extraction. No server uploads.';

  async isAvailable(): Promise<boolean> {
    return true; // Always available offline in any modern browser
  }

  async extract(
    imageDataUrl: string,
    onProgress?: (msg: string, pct: number) => void
  ): Promise<ReceiptExtractionResult> {
    onProgress?.('Preparing local OCR engine...', 10);

    let rawText = '';
    try {
      // Create and initialize Tesseract worker
      const worker = await createWorker('eng');
      
      onProgress?.('Reading receipt image...', 35);
      const ret = await worker.recognize(imageDataUrl);
      rawText = ret.data.text || '';
      
      onProgress?.('Finalizing local OCR...', 80);
      await worker.terminate();
    } catch (ocrErr) {
      console.warn('Tesseract OCR error:', ocrErr);
      throw new Error(
        'Unable to process receipt image locally. Please ensure the image is clear, well-lit, and in JPG/PNG format.'
      );
    }

    if (!rawText.trim() || rawText.trim().length < 5) {
      throw new Error(
        'No readable text could be recognized from this image. Please retake the photo with better lighting or enter the expense manually.'
      );
    }

    onProgress?.('Extracting merchant, date, and amounts...', 90);
    const parsed = this.parseReceiptText(rawText);
    onProgress?.('Done!', 100);

    return {
      ...parsed,
      rawText,
      providerName: this.name,
    };
  }

  /**
   * Deterministic heuristic parser for OCR text.
   * Completely transparent, fast, and does not pretend to be a deep LLM.
   */
  public parseReceiptText(text: string): {
    merchant: string;
    amount: number | null;
    date: string;
    category: ExpenseCategory;
    tax?: number;
    paymentMethod?: 'Card' | 'Cash' | 'Bank Transfer' | 'Other';
    confidence: number;
    notes?: string;
  } {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 1. Merchant Extraction:
    // Usually in first 5 lines; ignore generic terms like "RECEIPT", "INVOICE", "WELCOME", date stamps, phone numbers
    let merchant = 'Unknown Merchant';
    const cleanLines = lines.filter((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('receipt') || lower.includes('invoice') || lower.includes('tax invoice')) return false;
      if (lower.includes('welcome') || lower.includes('order #') || lower.includes('table #')) return false;
      if (/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) return false; // phone
      if (/^\d{1,4}[-\/\.]\d{1,2}[-\/\.]\d{2,4}/.test(line)) return false; // date
      if (line.length < 3 || line.length > 50) return false;
      return true;
    });

    if (cleanLines.length > 0) {
      // Pick first good clean line
      merchant = cleanLines[0].replace(/[^a-zA-Z0-9\s&'.,-]/g, '').trim();
    }

    // 2. Amount Extraction:
    // Look for lines containing "TOTAL", "AMOUNT DUE", "BAL DUE", "PAYMENT"
    // Also look for currency patterns ($XX.XX)
    let detectedAmount: number | null = null;
    let detectedTax: number | undefined = undefined;

    const currencyRegex = /\$?\s*([0-9]{1,4}(?:[.,][0-9]{2}))\b/g;

    // Search specifically for Total lines
    let totalLineFound = false;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const upper = line.toUpperCase();

      // Check for Tax first
      if ((upper.includes('TAX') || upper.includes('VAT') || upper.includes('GST')) && detectedTax === undefined) {
        const matches = Array.from(line.matchAll(currencyRegex));
        if (matches.length > 0) {
          const val = parseFloat(matches[matches.length - 1][1].replace(',', '.'));
          if (!isNaN(val) && val > 0 && val < 1000) {
            detectedTax = val;
          }
        }
      }

      // Check for Total / Amount Due
      if (
        (upper.includes('TOTAL') || upper.includes('AMOUNT') || upper.includes('BAL') || upper.includes('DUE') || upper.includes('CHARGED')) &&
        !upper.includes('SUBTOTAL') &&
        !totalLineFound
      ) {
        const matches = Array.from(line.matchAll(currencyRegex));
        if (matches.length > 0) {
          const val = parseFloat(matches[matches.length - 1][1].replace(',', '.'));
          if (!isNaN(val) && val > 0) {
            detectedAmount = val;
            totalLineFound = true;
          }
        }
      }
    }

    // Fallback: If no explicit total line, take the maximum valid currency amount in bottom half
    if (detectedAmount === null) {
      const allAmounts: number[] = [];
      for (const line of lines) {
        const matches = Array.from(line.matchAll(currencyRegex));
        for (const m of matches) {
          const val = parseFloat(m[1].replace(',', '.'));
          if (!isNaN(val) && val > 0 && val < 50000) {
            allAmounts.push(val);
          }
        }
      }
      if (allAmounts.length > 0) {
        detectedAmount = Math.max(...allAmounts);
      }
    }

    // 3. Date Extraction:
    let detectedDate = new Date().toISOString().slice(0, 10);
    const datePatterns = [
      // MM/DD/YYYY or MM-DD-YYYY
      /\b(0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])[\/\-\.](20\d{2}|\d{2})\b/,
      // YYYY-MM-DD
      /\b(20\d{2})[\/\-\.](0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])\b/,
      // Oct 14, 2026 or 14 Oct 2026
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.-]+(\d{1,2})(?:st|nd|rd|th)?[\s,]+(20\d{2})\b/i,
      /\b(\d{1,2})[\s\.-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(20\d{2})\b/i,
    ];

    for (const line of lines) {
      let foundDate = false;
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            // Check if matches month name pattern
            if (match[1] && isNaN(Number(match[1]))) {
              const d = new Date(match[0]);
              if (!isNaN(d.getTime())) {
                detectedDate = d.toISOString().slice(0, 10);
                foundDate = true;
                break;
              }
            } else if (match[1] && match[2] && match[3]) {
              let year = match[3];
              let month = match[1];
              let day = match[2];
              if (year.length === 2) year = '20' + year;
              // If format was YYYY-MM-DD
              if (match[1].length === 4) {
                year = match[1];
                month = match[2];
                day = match[3];
              }
              const monthPad = month.padStart(2, '0');
              const dayPad = day.padStart(2, '0');
              detectedDate = `${year}-${monthPad}-${dayPad}`;
              foundDate = true;
              break;
            }
          } catch {
            // ignore date parse error
          }
        }
      }
      if (foundDate) break;
    }

    // 4. Category Classification:
    const category = this.inferCategory(text);

    // 5. Payment Method:
    let paymentMethod: 'Card' | 'Cash' | 'Bank Transfer' | 'Other' = 'Card';
    const textUpper = text.toUpperCase();
    if (textUpper.includes('CASH') || textUpper.includes('CHANGE DUE')) {
      paymentMethod = 'Cash';
    } else if (textUpper.includes('TRANSFER') || textUpper.includes('ACH') || textUpper.includes('WIRE')) {
      paymentMethod = 'Bank Transfer';
    } else if (
      textUpper.includes('VISA') ||
      textUpper.includes('MASTERCARD') ||
      textUpper.includes('AMEX') ||
      textUpper.includes('DISCOVER') ||
      textUpper.includes('CHIP') ||
      textUpper.includes('DEBIT') ||
      textUpper.includes('CARD')
    ) {
      paymentMethod = 'Card';
    }

    // Calculate confidence score
    let score = 0.4;
    if (detectedAmount !== null) score += 0.3;
    if (merchant !== 'Unknown Merchant') score += 0.2;
    if (category !== 'Other') score += 0.1;

    return {
      merchant: merchant.length > 40 ? merchant.slice(0, 40) : merchant,
      amount: detectedAmount,
      date: detectedDate,
      category,
      tax: detectedTax,
      paymentMethod,
      confidence: Math.min(1.0, score),
      notes: lines.slice(0, 4).join(' • ').slice(0, 80),
    };
  }

  private inferCategory(text: string): ExpenseCategory {
    const t = text.toLowerCase();

    // Inventory
    if (
      t.includes('wholesale') ||
      t.includes('produce') ||
      t.includes('distributor') ||
      t.includes('inventory') ||
      t.includes('bulk') ||
      t.includes('farm') ||
      t.includes('packaging supply')
    ) {
      return 'Inventory';
    }

    // Office Supplies
    if (
      t.includes('office') ||
      t.includes('depot') ||
      t.includes('staples') ||
      t.includes('paper') ||
      t.includes('stationery') ||
      t.includes('printer') ||
      t.includes('ink') ||
      t.includes('toner') ||
      t.includes('binder')
    ) {
      return 'Office Supplies';
    }

    // Meals & Coffee
    if (
      t.includes('cafe') ||
      t.includes('coffee') ||
      t.includes('bakery') ||
      t.includes('espresso') ||
      t.includes('restaurant') ||
      t.includes('diner') ||
      t.includes('grill') ||
      t.includes('bistro') ||
      t.includes('latte') ||
      t.includes('toast') ||
      t.includes('starbucks') ||
      t.includes('food')
    ) {
      return 'Meals & Coffee';
    }

    // Travel & Fuel
    if (
      t.includes('fuel') ||
      t.includes('gas') ||
      t.includes('shell') ||
      t.includes('chevron') ||
      t.includes('exxon') ||
      t.includes('bp') ||
      t.includes('parking') ||
      t.includes('uber') ||
      t.includes('lyft') ||
      t.includes('toll') ||
      t.includes('transit') ||
      t.includes('airline')
    ) {
      return 'Travel & Fuel';
    }

    // Equipment & Tools
    if (
      t.includes('hardware') ||
      t.includes('home depot') ||
      t.includes('lowe') ||
      t.includes('drill') ||
      t.includes('tools') ||
      t.includes('timber') ||
      t.includes('plumbing') ||
      t.includes('screws')
    ) {
      return 'Equipment & Tools';
    }

    // Utilities & Rent
    if (
      t.includes('electric') ||
      t.includes('power') ||
      t.includes('water') ||
      t.includes('utility') ||
      t.includes('broadband') ||
      t.includes('internet') ||
      t.includes('telecom') ||
      t.includes('rent') ||
      t.includes('storage unit')
    ) {
      return 'Utilities & Rent';
    }

    // Software & Services
    if (
      t.includes('google') ||
      t.includes('adobe') ||
      t.includes('figma') ||
      t.includes('github') ||
      t.includes('saas') ||
      t.includes('subscription') ||
      t.includes('domain') ||
      t.includes('hosting') ||
      t.includes('zoom')
    ) {
      return 'Software & Services';
    }

    // Repairs & Maintenance
    if (
      t.includes('repair') ||
      t.includes('maintenance') ||
      t.includes('tire') ||
      t.includes('oil change') ||
      t.includes('mechanic') ||
      t.includes('service center')
    ) {
      return 'Repairs & Maintenance';
    }

    // Marketing & Ads
    if (
      t.includes('marketing') ||
      t.includes('advertising') ||
      t.includes('meta ads') ||
      t.includes('google ads') ||
      t.includes('flyer') ||
      t.includes('banner') ||
      t.includes('print shop')
    ) {
      return 'Marketing & Ads';
    }

    return 'Other';
  }
}
