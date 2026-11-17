'use client';

import React from 'react';
import { X, GitCompare, CheckCircle2, Radio } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

export function ChangelogDrawer() {
  const { isChangelogOpen, setChangelogOpen, bundle } = usePortal();
  if (!isChangelogOpen) return null;

  const { changelog, feedHealth, liveSignals } = bundle;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setChangelogOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Briefing Sync Changelog & Feed Telemetry"
        className="relative z-10 w-full max-w-lg bg-[#111827] border-l border-white/15 h-full p-6 overflow-y-auto space-y-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <p className="font-mono-tactical text-[11px] uppercase tracking-widest text-[#10B981]">
              Canonical Sync &amp; Diff Ledger
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
              {new Date(changelog.syncedAtISO).toISOString().replace('T', ' ').slice(0, 19)}Z
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono-tactical text-gray-400">SNAPSHOT SHA-256</span>
            <span className="font-mono-tactical text-gray-300">
              {changelog.docHash.slice(0, 16)}…
            </span>
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
              <span>Zero-Key OSINT Sweep Status</span>
            </h3>
            <span className="font-mono-tactical text-xs text-[#10B981]">
              {feedHealth.liveCount}/{feedHealth.totalFeeds} Live · {liveSignals.totalSignals} Signals
            </span>
          </div>

          <div className="space-y-1.5">
            {feedHealth.feeds.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg bg-[#0A0E17] border border-white/[0.08] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      f.status === 'live'
                        ? 'bg-[#10B981]'
                        : f.status === 'degraded'
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#EF4444]'
                    }`}
                  />
                  <span className="text-gray-200">{f.name}</span>
                </div>
                <span className="font-mono-tactical text-[11px] text-gray-400">
                  HTTP {f.httpStatus ?? 'ERR'} · {f.latencyMs}ms · {f.itemCount} items
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
