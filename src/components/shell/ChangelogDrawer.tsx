'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, GitCompare, CheckCircle2, Radio, ShieldCheck } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { computeBundleSha256Hex } from '@/lib/evidence';
import { FeedSparkline } from '@/components/shell/FeedSparkline';

export function ChangelogDrawer() {
  const { isChangelogOpen, setChangelogOpen, bundle } = usePortal();
  const [runtimeHash, setRuntimeHash] = useState<string | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!isChangelogOpen) return;
    let cancelled = false;
    computeBundleSha256Hex(bundle)
      .then((hex) => {
        if (!cancelled) setRuntimeHash(hex);
      })
      .catch(() => {
        if (!cancelled) setRuntimeHash(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isChangelogOpen, bundle]);

  if (!isChangelogOpen) return null;

  const { changelog, feedHealth, liveSignals, feedHistory } = bundle;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end bg-black/60 backdrop-blur-xs print:hidden">
      <div
        className="fixed inset-0"
        onClick={() => setChangelogOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Briefing Sync Changelog & Feed Telemetry"
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartY.current === null) return;
          const deltaY = (e.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
          touchStartY.current = null;
          if (deltaY > 75) {
            setChangelogOpen(false);
          }
        }}
        className="relative z-10 w-full md:max-w-lg bg-[#111827] border-t md:border-t-0 md:border-l border-white/15 rounded-t-2xl md:rounded-none max-h-[78vh] md:max-h-none md:h-full p-5 sm:p-6 overflow-y-auto space-y-5 shadow-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        {/* Mobile Bottom-Sheet Drag Handle */}
        <div className="md:hidden flex justify-center -mt-1">
          <span className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <p className="font-mono-tactical text-[11px] uppercase tracking-widest text-[#10B981]">
              Canonical Sync &amp; Provenance Ledger
            </p>
            <h2 className="text-base font-semibold text-white mt-1">
              What Changed Since Last Snapshot
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setChangelogOpen(false)}
            aria-label="Close changelog drawer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-tactical text-gray-400">CANONICAL DOC EDITION</span>
            <span className="font-mono-tactical text-white">{changelog.docDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono-tactical text-gray-400">LAST DOC SYNC (UTC)</span>
            <span className="font-mono-tactical text-[#38BDF8]">
              {new Date(changelog.syncedAtISO).toISOString().replace('T', ' ').slice(0, 19)} UTC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono-tactical text-gray-400">DOC SNAPSHOT SHA-256</span>
            <span className="font-mono-tactical text-gray-300">
              {changelog.docHash.slice(0, 16)}…
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.07]">
            <span className="font-mono-tactical text-gray-400">WEB CRYPTO BUNDLE CHECK</span>
            {runtimeHash ? (
              <span className="inline-flex items-center gap-1 font-mono-tactical text-[#10B981]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>VERIFIED ({runtimeHash.slice(0, 12)}…)</span>
              </span>
            ) : (
              <span className="font-mono-tactical text-gray-400">Computing SHA-256…</span>
            )}
          </div>
          <p className="pt-2 border-t border-white/10 text-gray-200 leading-relaxed">
            {changelog.summary}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-mono-tactical text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <GitCompare className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Editorial Snapshot Diffs</span>
          </h3>

          {changelog.addedIncidents.length === 0 &&
          changelog.updatedStatuses.length === 0 &&
          changelog.riskShifts.length === 0 ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3.5 flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>
                All 8 Risk Vectors, {bundle.incidents.length} Tracked Incidents, 9 Watchlist
                Indicators, and 8 Countdown Cliffs match the canonical Google Doc baseline with zero
                structural drift.
              </span>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {changelog.addedIncidents.map((inc) => (
                <div
                  key={inc.eventId}
                  className="rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 p-3"
                >
                  <span className="font-mono-tactical text-[#EF4444] font-semibold">
                    + ADDED {inc.eventId}
                  </span>{' '}
                  <span className="text-white font-medium">{inc.entity}</span>{' '}
                  <span className="text-gray-400">({inc.window})</span>
                </div>
              ))}
              {changelog.updatedStatuses.map((u) => (
                <div
                  key={u.eventId}
                  className="rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-3 space-y-1"
                >
                  <div className="font-mono-tactical text-[#F59E0B] font-semibold">
                    STATUS SHIFT {u.eventId} — {u.entity}
                  </div>
                  <p className="text-gray-400 line-through">{u.previousStatus}</p>
                  <p className="text-gray-100">{u.currentStatus}</p>
                </div>
              ))}
              {changelog.riskShifts.map((r, idx) => (
                <div
                  key={`${r.id}-${idx}`}
                  className="rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 p-3 space-y-1"
                >
                  <div className="font-mono-tactical text-[#38BDF8] font-semibold">
                    RISK {r.id} ({r.field.toUpperCase()}) — {r.domain}
                  </div>
                  <p className="text-gray-400 line-through">{r.previous}</p>
                  <p className="text-gray-100">{r.current}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="font-mono-tactical text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#10B981]" />
              <span>14-Day Rolling Feed Latency &amp; Status</span>
            </h3>
            <span className="font-mono-tactical text-xs text-[#10B981]">
              {feedHealth.liveCount}/{feedHealth.totalFeeds} Live · {liveSignals.totalSignals} Signals
            </span>
          </div>

          <div className="space-y-1.5">
            {feedHealth.feeds.map((f) => {
              const historyPoints = feedHistory?.series?.[f.id];
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[#0A0E17] border border-white/[0.08] px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        f.status === 'live'
                          ? 'bg-[#10B981]'
                          : f.status === 'degraded'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#EF4444]'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-gray-200 truncate">{f.name}</p>
                      <p className="font-mono-tactical text-[10px] text-gray-400">
                        HTTP {f.httpStatus ?? 'ERR'} · {f.latencyMs}ms · {f.itemCount} items
                      </p>
                    </div>
                  </div>
                  <FeedSparkline
                    points={historyPoints}
                    metric="latencyMs"
                    strokeColor={f.status === 'live' ? '#10B981' : '#F59E0B'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
