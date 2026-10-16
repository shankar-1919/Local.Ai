import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle,
  Server,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ExpenseItem, AIProviderConfig } from '../types/expense';
import { aiAdapter } from '../services/ai/aiAdapter';
import { dbService } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  expenses,
  onRefreshData,
}) => {
  if (!isOpen) return null;

  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(aiAdapter.getConfig());
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sampleCount = expenses.filter((e) => e.isSample).length;

  const handleSaveAiConfig = (provider: 'local-heuristic' | 'ollama') => {
    const updated = { ...aiConfig, activeProvider: provider };
    setAiConfig(updated);
    aiAdapter.saveConfig(updated);
    setStatusMessage('AI adapter settings updated.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await aiAdapter.testOpenWeightConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearSampleData = async () => {
    await dbService.removeSampleExpenses();
    onRefreshData();
    setStatusMessage('Sample expenses removed.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetSampleData = async () => {
    await dbService.resetSampleExpenses();
    onRefreshData();
    setStatusMessage('Sample expenses restored.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to delete ALL expenses and saved receipts? This cannot be undone.')) {
      await dbService.clearAll();
      onRefreshData();
      setStatusMessage('All data erased from this device.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleExportJSON = () => {
    dbService.exportJSON(expenses);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (typeof reader.result === 'string') {
          await dbService.importJSON(reader.result);
          onRefreshData();
          setStatusMessage('Data imported successfully!');
          setTimeout(() => setStatusMessage(null), 3000);
        }
      } catch (err: any) {
        alert('Failed to import JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Privacy, Local Storage & AI Engine
            </h3>
            <p className="text-xs text-stone-500">
              Complete local control over your business expense data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {statusMessage}
            </div>
          )}

          {/* Section 1: Privacy Guarantee */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Privacy & On-Device Storage
            </h4>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-700 space-y-2 leading-relaxed">
              <p>
                <strong className="text-stone-900">100% In-Browser Isolation:</strong> LocalBiz AI does not send receipt images, vendor names, or financial numbers to any server or cloud database.
              </p>
              <p>
                • Database: Stored in your browser's persistent <strong>IndexedDB</strong> ({expenses.length} records currently stored).
              </p>
              <p>
                • No Accounts or Tracking: No cookies, tracking pixels, or third-party analytics.
              </p>
              <p>
                • Receipt Images: Converted directly on your device and kept in browser sandbox storage.
              </p>
            </div>
          </div>

          {/* Section 2: AI Adapter & Open-Weight Model Architecture */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                AI Inference Adapter
              </h4>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Modular Open-Weight Ready
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              LocalBiz AI is engineered with a swappable inference provider. We do not use paid cloud LLMs (like OpenAI or Gemini). Receipt parsing is completely truthful and open:
            </p>

            <div className="space-y-2.5">
              {/* Option A: Local In-Browser OCR + Heuristic Parser */}
              <label
                onClick={() => handleSaveAiConfig('local-heuristic')}
                className={`block p-3.5 rounded-xl border transition-all cursor-pointer ${
                  aiConfig.activeProvider === 'local-heuristic'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="provider"
                      checked={aiConfig.activeProvider === 'local-heuristic'}
                      onChange={() => handleSaveAiConfig('local-heuristic')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-stone-900">
                      In-Browser OCR + Heuristic Parser (Default Active)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1.5 ml-6 leading-relaxed">
                  Uses in-browser Tesseract.js OCR to extract text from your camera or photo, followed by deterministic regex pattern matching for date, merchant, totals, and business expense category. Fast, lightweight, and requires zero setup.
                </p>
              </label>

              {/* Option B: Local Open-Weight Model (Ollama / Local LLM) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  aiConfig.activeProvider === 'ollama'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <label className="flex items-start justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="provider"
                      checked={aiConfig.activeProvider === 'ollama'}
                      onChange={() => handleSaveAiConfig('ollama')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-stone-900">
                      Open-Weight Local Model (Ollama / LM Studio)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    Optional Connector
                  </span>
                </label>

                <p className="text-[11px] text-stone-600 mt-1.5 ml-6 leading-relaxed">
                  Route receipts to your own open-weight vision model (e.g., Llama-3.2-Vision, Qwen2.5-VL, or Mistral) running on your local machine via Ollama on port 11434.
                </p>

                {/* Sub-settings if Ollama active */}
                {aiConfig.activeProvider === 'ollama' && (
                  <div className="mt-3 ml-6 pt-3 border-t border-stone-200/80 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Local Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={aiConfig.ollamaEndpoint || 'http://localhost:11434/api/generate'}
                        onChange={(e) => {
                          const updated = { ...aiConfig, ollamaEndpoint: e.target.value };
                          setAiConfig(updated);
                          aiAdapter.saveConfig(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 bg-white"
                        placeholder="http://localhost:11434/api/generate"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Open-Weight Model Name
                      </label>
                      <input
                        type="text"
                        value={aiConfig.ollamaModel || 'llama3.2-vision'}
                        onChange={(e) => {
                          const updated = { ...aiConfig, ollamaModel: e.target.value };
                          setAiConfig(updated);
                          aiAdapter.saveConfig(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 bg-white"
                        placeholder="llama3.2-vision"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-900 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        {isTesting ? 'Pinging endpoint...' : 'Test Connection'}
                      </button>

                      {testResult && (
                        <span
                          className={`text-xs font-medium ${
                            testResult.ok ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {testResult.ok ? '✓ Connected!' : '✗ Offline / CORS blocked'}
                        </span>
                      )}
                    </div>

                    {testResult && !testResult.ok && (
                      <p className="text-[11px] text-stone-500 bg-stone-100 p-2 rounded leading-relaxed">
                        Tip: When running Ollama locally, run{' '}
                        <code className="text-stone-900 bg-stone-200 px-1 py-0.5 rounded">
                          OLLAMA_ORIGINS="*" ollama serve
                        </code>{' '}
                        so browser web apps can make local requests.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Data Management */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              Data Backup & Sample Data
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="p-3 text-left rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-stone-800">Backup as JSON</div>
                  <div className="text-[10px] text-stone-500">Full backup of all records</div>
                </div>
              </button>

              <label className="p-3 text-left rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-3 cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-stone-800">Restore from JSON</div>
                  <div className="text-[10px] text-stone-500">Import previous backup</div>
                </div>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              {sampleCount > 0 ? (
                <button
                  onClick={handleClearSampleData}
                  className="p-3 text-left rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-900">Remove Sample Data</div>
                    <div className="text-[10px] text-amber-700">Clears {sampleCount} starter records</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleResetSampleData}
                  className="p-3 text-left rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-stone-800">Reload Sample Data</div>
                    <div className="text-[10px] text-stone-500">Restore demo expenses</div>
                  </div>
                </button>
              )}

              <button
                onClick={handleClearAllData}
                className="p-3 text-left rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/50 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-900">Wipe All Records</div>
                  <div className="text-[10px] text-rose-700">Reset database completely</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
