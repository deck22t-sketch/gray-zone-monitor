'use client';

import React, { useMemo, useState } from 'react';
import { X, Copy, Check, Printer, Download, FileText } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { buildExecutiveSummaryText, NON_AFFILIATION_NOTICE } from '@/lib/evidence';

export function BriefingExportModal() {
  const { isExportOpen, setExportOpen, bundle, pinnedSignalIds, clearPinnedSignals } = usePortal();
  const [copied, setCopied] = useState(false);

  const summaryText = useMemo(() => {
    if (!isExportOpen) return '';
    return buildExecutiveSummaryText(bundle, Date.now(), pinnedSignalIds);
  }, [isExportOpen, bundle, pinnedSignalIds]);

  if (!isExportOpen) return null;

  function handleCopy() {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleDownloadTxt() {
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gray-zone-briefing-summary-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintBrief() {
    setExportOpen(false);
    setTimeout(() => {
      window.print();
    }, 120);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 print:hidden">
      <div
        className="fixed inset-0"
        onClick={() => setExportOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Export Executive Briefing Summary"
        className="relative z-10 w-full sm:max-w-2xl bg-[#0B0F17] border-t sm:border border-white/15 rounded-t-lg sm:rounded-lg max-h-[82vh] flex flex-col overflow-hidden shadow-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#38BDF8]/12 border border-[#38BDF8]/35 flex items-center justify-center text-[#38BDF8]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-[#38BDF8]">
                Shareable Executive Brief
              </p>
              <h2 className="text-base font-semibold text-white">
                Export Briefing Summary &amp; Print View
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExportOpen(false)}
            aria-label="Close export modal"
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {pinnedSignalIds.length > 0 && (
            <div className="rounded-md bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-3 py-2 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono-tactical text-[#38BDF8]">
                ★ {pinnedSignalIds.length} pinned Live Wire signal
                {pinnedSignalIds.length === 1 ? '' : 's'} included in export
              </span>
              <button
                type="button"
                onClick={clearPinnedSignals}
                className="font-mono-tactical text-[11px] text-gray-400 hover:text-white cursor-pointer"
              >
                Clear pins
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              id="btn-copy-executive-summary"
              type="button"
              onClick={handleCopy}
              className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-md bg-[#38BDF8]/16 hover:bg-[#38BDF8]/26 border border-[#38BDF8]/45 px-4 py-2.5 text-xs font-medium text-[#38BDF8] transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#10B981]">Copied for Signal / Slack / Email</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Plain-Text Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/14 px-3.5 py-2.5 text-xs font-mono-tactical text-gray-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Download .txt</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBrief}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/14 px-3.5 py-2.5 text-xs font-mono-tactical text-gray-200 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          <pre className="rounded-md bg-[#06080C] border border-white/10 p-4 text-[11px] font-mono-tactical text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[42vh] overflow-y-auto">
            {summaryText}
          </pre>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            {NON_AFFILIATION_NOTICE}
          </p>
        </div>
      </div>
    </div>
  );
}
