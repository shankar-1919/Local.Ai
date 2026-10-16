import { ReceiptExtractionResult, ExpenseCategory } from '../../types/expense';

export interface OpenWeightConfig {
  endpoint: string; // e.g., 'http://localhost:11434/api/generate' or 'http://localhost:1234/v1/chat/completions'
  model: string; // e.g., 'llama3.2-vision', 'qwen2.5-vl', 'mistral'
  mode: 'ollama' | 'openai-compatible';
}

export const DEFAULT_OPEN_WEIGHT_CONFIG: OpenWeightConfig = {
  endpoint: 'http://localhost:11434/api/generate',
  model: 'llama3.2-vision',
  mode: 'ollama',
};

export class OpenWeightModelProvider {
  name = 'Open-Weight Model Connector';
  description = 'Connects to a locally hosted open-weight model (e.g., Ollama / LM Studio) without cloud fees or external servers.';
  config: OpenWeightConfig;

  constructor(customConfig?: Partial<OpenWeightConfig>) {
    this.config = { ...DEFAULT_OPEN_WEIGHT_CONFIG, ...customConfig };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const pingUrl = this.config.mode === 'ollama' 
        ? this.config.endpoint.replace('/api/generate', '/api/tags')
        : this.config.endpoint.replace('/chat/completions', '/models');

      const res = await fetch(pingUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async extract(
    imageDataUrl: string,
    rawOcrText: string,
    onProgress?: (msg: string, pct: number) => void
  ): Promise<ReceiptExtractionResult> {
    onProgress?.(`Connecting to local open-weight model (${this.config.model})...`, 25);

    const prompt = `Analyze this receipt text and return ONLY a valid JSON object with the following fields:
- "merchant": name of store or service (string)
- "amount": total amount as number (e.g. 24.50)
- "date": date in YYYY-MM-DD format (string)
- "category": one of ["Inventory", "Office Supplies", "Meals & Coffee", "Travel & Fuel", "Equipment & Tools", "Utilities & Rent", "Software & Services", "Repairs & Maintenance", "Marketing & Ads", "Other"]
- "tax": tax amount as number or null
- "paymentMethod": "Card", "Cash", "Bank Transfer", or "Other"

Receipt Text:
${rawOcrText}`;

    onProgress?.('Querying open-weight inference engine...', 55);

    if (this.config.mode === 'ollama') {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          format: 'json',
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Local model returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.response;
      onProgress?.('Parsing model output...', 85);

      const parsed = JSON.parse(content);
      return {
        merchant: parsed.merchant || 'Unknown Merchant',
        amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || null,
        date: parsed.date || new Date().toISOString().slice(0, 10),
        category: (parsed.category as ExpenseCategory) || 'Other',
        tax: typeof parsed.tax === 'number' ? parsed.tax : undefined,
        paymentMethod: parsed.paymentMethod || 'Card',
        confidence: 0.95,
        rawText: rawOcrText,
        providerName: `${this.name} (${this.config.model})`,
      };
    }

    throw new Error('Unsupported open-weight mode configuration.');
  }
}
