import { ReceiptExtractionResult, AIProviderConfig } from '../../types/expense';
import { HeuristicOcrProvider } from './heuristicOcrProvider';
import { OpenWeightModelProvider, OpenWeightConfig, DEFAULT_OPEN_WEIGHT_CONFIG } from './openWeightProvider';

export interface ReceiptInferenceProvider {
  name: string;
  description: string;
  extract(
    imageDataUrl: string,
    onProgress?: (msg: string, pct: number) => void
  ): Promise<ReceiptExtractionResult>;
  isAvailable(): Promise<boolean>;
}

const AI_CONFIG_KEY = 'localbiz_ai_provider_config';

class AiAdapterManager {
  private heuristicProvider: HeuristicOcrProvider;
  private openWeightProvider: OpenWeightModelProvider;
  private config: AIProviderConfig;

  constructor() {
    this.heuristicProvider = new HeuristicOcrProvider();
    
    // Read stored config or default to 100% local heuristic OCR
    let savedConfig: AIProviderConfig = {
      activeProvider: 'local-heuristic',
      ollamaEndpoint: DEFAULT_OPEN_WEIGHT_CONFIG.endpoint,
      ollamaModel: DEFAULT_OPEN_WEIGHT_CONFIG.model,
    };

    try {
      const stored = localStorage.getItem(AI_CONFIG_KEY);
      if (stored) {
        savedConfig = { ...savedConfig, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }

    this.config = savedConfig;
    this.openWeightProvider = new OpenWeightModelProvider({
      endpoint: this.config.ollamaEndpoint || DEFAULT_OPEN_WEIGHT_CONFIG.endpoint,
      model: this.config.ollamaModel || DEFAULT_OPEN_WEIGHT_CONFIG.model,
    });
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  saveConfig(newConfig: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(this.config));
    
    this.openWeightProvider = new OpenWeightModelProvider({
      endpoint: this.config.ollamaEndpoint || DEFAULT_OPEN_WEIGHT_CONFIG.endpoint,
      model: this.config.ollamaModel || DEFAULT_OPEN_WEIGHT_CONFIG.model,
    });
  }

  getActiveProviderName(): string {
    if (this.config.activeProvider === 'ollama') {
      return `Open-Weight Model (${this.config.ollamaModel || 'Ollama'})`;
    }
    return this.heuristicProvider.name;
  }

  getActiveProviderDescription(): string {
    if (this.config.activeProvider === 'ollama') {
      return `Custom open-weight endpoint (${this.config.ollamaEndpoint}). Runs on your local network machine.`;
    }
    return this.heuristicProvider.description;
  }

  async testOpenWeightConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const isOnline = await this.openWeightProvider.isAvailable();
      if (isOnline) {
        return {
          ok: true,
          message: `Connected successfully to local open-weight server at ${this.openWeightProvider.config.endpoint}!`,
        };
      }
      return {
        ok: false,
        message: `Could not reach ${this.openWeightProvider.config.endpoint}. Ensure your local Ollama or LLM server is running with CORS enabled.`,
      };
    } catch (e: any) {
      return {
        ok: false,
        message: e?.message || 'Connection test failed.',
      };
    }
  }

  async processReceipt(
    imageDataUrl: string,
    onProgress?: (msg: string, pct: number) => void
  ): Promise<ReceiptExtractionResult> {
    // 1. If Open-weight model is selected, attempt OCR first then query model
    if (this.config.activeProvider === 'ollama') {
      try {
        const isOnline = await this.openWeightProvider.isAvailable();
        if (isOnline) {
          // Perform OCR to get receipt text
          const ocrResult = await this.heuristicProvider.extract(imageDataUrl, (msg, pct) => {
            onProgress?.(`OCR: ${msg}`, Math.round(pct * 0.5));
          });

          // Hand off to local open-weight model for advanced reasoning
          return await this.openWeightProvider.extract(
            imageDataUrl,
            ocrResult.rawText,
            (msg, pct) => {
              onProgress?.(msg, 50 + Math.round(pct * 0.5));
            }
          );
        } else {
          onProgress?.('Local model offline, falling back to local heuristic OCR...', 20);
        }
      } catch (err) {
        console.warn('Open-weight model extraction error, falling back to heuristic:', err);
      }
    }

    // Default primary provider: 100% In-Browser OCR + Heuristic Parser
    return await this.heuristicProvider.extract(imageDataUrl, onProgress);
  }
}

export const aiAdapter = new AiAdapterManager();
