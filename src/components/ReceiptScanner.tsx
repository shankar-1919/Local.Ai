import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  AlertCircle,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { aiAdapter } from '../services/ai/aiAdapter';
import { ReceiptExtractionResult } from '../types/expense';
import { generateSampleReceiptImage } from '../services/sampleData';

interface ReceiptScannerProps {
  onExtractionComplete: (result: ReceiptExtractionResult, imageDataUrl: string) => void;
  onManualEntry: () => void;
  onClose?: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onExtractionComplete,
  onManualEntry,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessImage = async (dataUrl: string) => {
    setSelectedPreview(dataUrl);
    setErrorMessage(null);
    setIsProcessing(true);
    setProgressMsg('Initializing local in-browser OCR engine...');
    setProgressPct(10);

    try {
      const result = await aiAdapter.processReceipt(dataUrl, (msg, pct) => {
        setProgressMsg(msg);
        setProgressPct(pct);
      });

      // Hand off to editable form
      setIsProcessing(false);
      onExtractionComplete(result, dataUrl);
    } catch (err: any) {
      setIsProcessing(false);
      console.error('Extraction error:', err);
      setErrorMessage(
        err?.message ||
          'Could not read this receipt clearly. Please ensure clear lighting without glare, or enter the expense manually.'
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please select a valid JPG, PNG, or JPEG image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleProcessImage(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file from your device.');
    };
    reader.readAsDataURL(file);
  };

  const handleSampleReceipt = (type: 'cafe' | 'supplies' | 'hardware' | 'grocery') => {
    const dataUrl = generateSampleReceiptImage(type);
    handleProcessImage(dataUrl);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            Scan or Upload Receipt
          </h2>
          <p className="text-xs text-stone-500">
            Processed 100% in your browser. Images never leave your device.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/jpg"
        capture="environment"
        className="hidden"
      />

      {/* Processing State Overlay */}
      {isProcessing && (
        <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
              {progressPct}%
            </div>
          </div>

          <h3 className="font-semibold text-stone-800 text-sm mb-1">
            Analyzing Receipt Locally
          </h3>
          <p className="text-xs text-stone-500 max-w-xs mb-4">
            {progressMsg || 'Running local OCR and deterministic regex parser...'}
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-xs bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.max(10, progressPct)}%` }}
            />
          </div>

          <p className="text-[11px] text-stone-400 mt-4 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Active engine: {aiAdapter.getActiveProviderName()}
          </p>
        </div>
      )}

      {/* Error Message */}
      {!isProcessing && errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900 mb-0.5">Could not parse receipt</p>
              <p className="text-rose-700 leading-relaxed mb-2.5">{errorMessage}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    fileInputRef.current?.click();
                  }}
                  className="px-2.5 py-1 rounded-md bg-white border border-rose-300 text-rose-800 font-medium text-xs hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Try Another Photo
                </button>
                <button
                  onClick={onManualEntry}
                  className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Enter Details Manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Dropzone and Actions */}
      {!isProcessing && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera Snap Button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-600 text-emerald-900 transition-all cursor-pointer group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-stone-900">Take Photo</p>
                <p className="text-xs text-stone-500">Use phone camera to snap</p>
              </div>
            </button>

            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/70 hover:bg-stone-100/70 hover:border-stone-300 text-stone-800 transition-all cursor-pointer group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-stone-900">Upload Image</p>
                <p className="text-xs text-stone-500">JPG, PNG or JPEG files</p>
              </div>
            </button>
          </div>

          {/* Quick Manual Entry option */}
          <div className="text-center pt-1">
            <button
              onClick={onManualEntry}
              className="text-xs text-stone-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Skip scan and enter expense manually
            </button>
          </div>

          {/* Instant Test Presets */}
          <div className="pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Test with Sample Receipts:
              </span>
              <span className="text-[11px] text-stone-400">1-click test</span>
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              No receipt on hand? Click any sample to test instant in-browser OCR extraction:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleSampleReceipt('cafe')}
                className="px-2.5 py-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 border border-stone-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-sm">☕</div>
                <div className="font-semibold text-xs text-stone-800">Cafe Latte</div>
                <div className="text-[10px] text-stone-500">$21.97 • Meals</div>
              </button>

              <button
                onClick={() => handleSampleReceipt('supplies')}
                className="px-2.5 py-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 border border-stone-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-sm">📎</div>
                <div className="font-semibold text-xs text-stone-800">Office Depot</div>
                <div className="text-[10px] text-stone-500">$41.01 • Supplies</div>
              </button>

              <button
                onClick={() => handleSampleReceipt('hardware')}
                className="px-2.5 py-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 border border-stone-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-sm">🔨</div>
                <div className="font-semibold text-xs text-stone-800">Acme Tools</div>
                <div className="text-[10px] text-stone-500">$86.23 • Equip</div>
              </button>

              <button
                onClick={() => handleSampleReceipt('grocery')}
                className="px-2.5 py-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 border border-stone-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-sm">🥑</div>
                <div className="font-semibold text-xs text-stone-800">Trader Bros</div>
                <div className="text-[10px] text-stone-500">$32.10 • Inventory</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
