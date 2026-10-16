import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';

interface RawTextModalProps {
  isOpen: boolean;
  rawText: string;
  onClose: () => void;
}

export const RawTextModal: React.FC<RawTextModalProps> = ({ isOpen, rawText, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Raw In-Browser OCR Output
              </h3>
              <p className="text-[11px] text-stone-500">
                Exact text recognized by local Tesseract.js engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="bg-stone-950 text-emerald-400 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-emerald-800 selection:text-white">
            {rawText || '(No text extracted)'}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            {rawText.length} characters parsed locally
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  Copy Text
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
