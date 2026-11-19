'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Clock,
  AlertTriangle,
  Radio,
  ChevronLeft,
  ChevronRight,
  Layers,
  History,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

interface MorningBriefDeckProps {
  nowMs: number;
  onOpenFullConsole: () => void;
}

function shortDelta(targetIso: string, nowMs: number): {
  label: string;
  urgent: boolean;
  completed: boolean;
} {
  const diffMs = Date.parse(targetIso) - nowMs;
  if (diffMs <= 0) {
    return { label: 'COMPLETED', urgent: false, completed: true };
  }
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays <= 1) {
    return { label: 'DUE <24H', urgent: true, completed: false };
  }
  return {
    label: `T-${diffDays}d`,
    urgent: diffDays <= 12,
    completed: false,
  };
}

export function MorningBriefDeck({ nowMs, onOpenFullConsole }: MorningBriefDeckProps) {
  const { bundle, setChangelogOpen, setExportOpen } = usePortal();
  const { sections, incidents, riskMatrix, countdownCliffs, changelog, liveSignals, feedHealth } =
    bundle;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const malicious = incidents.filter((i) => i.classification === 'malicious_attack').length;
  const hybrid = incidents.filter((i) => i.classification === 'hybrid_transition_bug').length;
  const cascade = incidents.filter((i) => i.classification === 'client_cascade').length;
  const immediateRisks = riskMatrix.filter((r) => r.horizonGroup === 'Immediate');

  const upcomingCliffs = countdownCliffs.filter(
    (c) => Date.parse(c.targetTimestampISO) > nowMs
  );
  const displayedCliffs = (
    upcomingCliffs.length >= 4 ? upcomingCliffs : countdownCliffs
  ).slice(0, 4);

  function scrollToCard(index: number) {
    const clamped = Math.max(0, Math.min(3, index));
    setActiveSlide(clamped);
    const container = scrollRef.current;
    if (!container) return;
    const child = container.children[clamped] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }

  function handleScroll() {
    const container = scrollRef.current;
    if (!container || container.clientWidth === 0) return;
    const idx = Math.round(container.scrollLeft / (container.clientWidth * 0.85));
    setActiveSlide(Math.max(0, Math.min(3, idx)));
  }

  return (
    <section
      aria-label="60-Second Executive Brief"
      className="glass-panel tac-frame rounded-lg p-4 sm:p-5 space-y-4"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-sm bg-[#38BDF8]/15 border border-[#38BDF8]/35 font-mono-tactical text-[10px] font-semibold text-[#38BDF8]">
            60-SECOND BRIEF
          </span>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            4 Cards · {sections.docDate}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-white/[0.04] hover:bg-white/[0.09] border border-white/12 font-mono-tactical text-[11px] text-gray-200 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-[#38BDF8]" />
            <span>Share Brief</span>
          </button>
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToCard(activeSlide - 1)}
              disabled={activeSlide === 0}
              aria-label="Previous brief card"
              className="p-1 rounded-sm bg-white/[0.04] border border-white/10 text-gray-300 disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToCard(activeSlide + 1)}
              disabled={activeSlide === 3}
              aria-label="Next brief card"
              className="p-1 rounded-sm bg-white/[0.04] border border-white/10 text-gray-300 disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Snap-Scroll 4-Card Deck */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1"
      >
        {/* CARD 1: Executive Posture & Wave Attribution */}
        <article className="snap-start shrink-0 w-[88%] sm:w-[46%] lg:w-[32%] obsidian-surface rounded-md p-4 flex flex-col justify-between space-y-3.5 border border-white/12">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono-tactical">
              <span className="text-[#38BDF8] font-semibold">01 / POSTURE &amp; SPLIT</span>
              <span className="text-[#10B981]">
                {feedHealth.liveCount}/{feedHealth.totalFeeds} Live
              </span>
            </div>
            <h2 className="text-[15px] font-semibold text-white leading-snug">
              Ten-Event Cluster: Legacy Transition Fragility Meets Opportunistic Malware
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed line-clamp-4">
              {sections.executiveSummary.intro}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono-tactical">
              <div className="rounded-sm bg-[#EF4444]/10 border border-[#EF4444]/30 py-1.5 px-1">
                <p className="text-sm font-semibold text-[#EF4444]">{malicious}</p>
                <p className="text-[9px] text-gray-300">Malicious</p>
              </div>
              <div className="rounded-sm bg-[#F59E0B]/10 border border-[#F59E0B]/30 py-1.5 px-1">
                <p className="text-sm font-semibold text-[#F59E0B]">{hybrid}</p>
                <p className="text-[9px] text-gray-300">Hybrid / Bug</p>
              </div>
              <div className="rounded-sm bg-[#38BDF8]/10 border border-[#38BDF8]/30 py-1.5 px-1">
                <p className="text-sm font-semibold text-[#38BDF8]">{cascade}</p>
                <p className="text-[9px] text-gray-300">Auth Cascade</p>
              </div>
            </div>
            <Link
              href="/incidents"
              className="inline-flex items-center gap-1 text-[11px] font-mono-tactical text-[#38BDF8] hover:underline"
            >
              <span>Inspect All {incidents.length} Readouts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </article>

        {/* CARD 2: Latest Edition Status Shifts */}
        <article className="snap-start shrink-0 w-[88%] sm:w-[46%] lg:w-[32%] obsidian-surface rounded-md p-4 flex flex-col justify-between space-y-3.5 border border-white/12">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono-tactical">
              <span className="text-[#F59E0B] font-semibold inline-flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>02 / SYNC DELTAS</span>
              </span>
              <span className="text-gray-400">
                {changelog.updatedStatuses.length + changelog.riskShifts.length} Shifts
              </span>
            </div>
            <h2 className="text-[15px] font-semibold text-white leading-snug">
              Latest Canonical Changes ({sections.docDate})
            </h2>
            <ul className="space-y-2 text-xs text-gray-200">
              {changelog.updatedStatuses.slice(0, 3).map((u) => (
                <li key={u.eventId} className="rounded-sm bg-white/[0.03] border border-white/[0.07] p-2">
                  <span className="font-mono-tactical text-[10px] text-[#F59E0B] font-semibold">
                    EVENT {u.eventId} · {u.entity}
                  </span>
                  <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5 leading-snug">
                    {u.currentStatus.replace(/^Vector:\s*/i, '')}
                  </p>
                </li>
              ))}
              {changelog.riskShifts.slice(0, 1).map((r) => (
                <li key={r.id} className="rounded-sm bg-white/[0.03] border border-white/[0.07] p-2">
                  <span className="font-mono-tactical text-[10px] text-[#38BDF8] font-semibold">
                    RISK {r.id} · {r.field.toUpperCase()}
                  </span>
                  <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5 leading-snug">
                    {r.current}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setChangelogOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.09] border border-white/12 py-2 text-[11px] font-mono-tactical text-[#38BDF8] cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Open Sync &amp; Provenance Ledger</span>
          </button>
        </article>

        {/* CARD 3: Nearest Countdown Cliffs */}
        <article className="snap-start shrink-0 w-[88%] sm:w-[46%] lg:w-[32%] obsidian-surface rounded-md p-4 flex flex-col justify-between space-y-3.5 border border-white/12">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono-tactical">
              <span className="text-[#38BDF8] font-semibold inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>03 / ACTIVE CLIFFS</span>
              </span>
              <span className="text-gray-400">120-Day Window</span>
            </div>
            <h2 className="text-[15px] font-semibold text-white leading-snug">
              Nearest Regulatory, Mineral &amp; Clearing Deadlines
            </h2>
            <div className="space-y-2">
              {displayedCliffs.map((c) => {
                const delta = shortDelta(c.targetTimestampISO, nowMs);
                return (
                  <div
                    key={c.targetDateISO}
                    className="rounded-sm bg-white/[0.03] border border-white/[0.07] p-2 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white line-clamp-1">{c.milestone}</p>
                      <p className="font-mono-tactical text-[10px] text-gray-400">{c.dateLabel}</p>
                    </div>
                    <span
                      className={`font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm border shrink-0 ${
                        delta.completed
                          ? 'bg-[#10B981]/12 border-[#10B981]/30 text-[#10B981]'
                          : delta.urgent
                          ? 'bg-[#EF4444]/15 border-[#EF4444]/35 text-[#EF4444]'
                          : 'bg-[#F59E0B]/15 border-[#F59E0B]/35 text-[#F59E0B]'
                      }`}
                    >
                      {delta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenFullConsole}
            className="inline-flex items-center gap-1 text-[11px] font-mono-tactical text-[#38BDF8] hover:underline cursor-pointer"
          >
            <span>Inspect All {countdownCliffs.length} Countdown Cliffs in Console</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </article>

        {/* CARD 4: Immediate Risk Tripwires & Live OSINT */}
        <article className="snap-start shrink-0 w-[88%] sm:w-[46%] lg:w-[32%] obsidian-surface rounded-md p-4 flex flex-col justify-between space-y-3.5 border border-white/12">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono-tactical">
              <span className="text-[#EF4444] font-semibold inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>04 / LIVE TRIPWIRES</span>
              </span>
              <span className="text-[#10B981]">{liveSignals.totalSignals} OSINT Signals</span>
            </div>
            <h2 className="text-[15px] font-semibold text-white leading-snug">
              Immediate Risk Vectors &amp; Public Feed Detections
            </h2>
            <div className="space-y-1.5">
              {immediateRisks.slice(0, 2).map((r) => (
                <div
                  key={r.id}
                  className="rounded-sm bg-[#EF4444]/8 border border-[#EF4444]/25 p-2"
                >
                  <p className="font-mono-tactical text-[10px] text-[#EF4444] font-semibold">
                    RISK {r.id} · IMMEDIATE
                  </p>
                  <p className="text-xs text-white line-clamp-1">{r.domain}</p>
                </div>
              ))}
              {liveSignals.signals.slice(0, 2).map((sig) => (
                <div
                  key={sig.id}
                  className="rounded-sm bg-white/[0.03] border border-white/[0.08] p-2"
                >
                  <p className="font-mono-tactical text-[10px] text-[#38BDF8]">
                    {sig.severity.toUpperCase()} · {sig.sourceName}
                  </p>
                  <p className="text-xs text-gray-200 line-clamp-1">{sig.title}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/watchlist?tab=live-wire"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-[#10B981]/12 hover:bg-[#10B981]/22 border border-[#10B981]/35 py-2 text-[11px] font-mono-tactical text-[#10B981]"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Open Live Wire ({liveSignals.totalSignals})</span>
          </Link>
        </article>
      </div>

      {/* Pagination Dots + Switch to Full Console CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToCard(idx)}
              aria-label={`Jump to card ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeSlide === idx ? 'w-6 bg-[#38BDF8]' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          id="btn-open-full-console"
          type="button"
          onClick={onOpenFullConsole}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/45 px-4 py-2.5 text-xs font-mono-tactical font-medium text-[#38BDF8] transition cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Open Full Console (Flashpoint Map, Crosswalk &amp; 8-Vector Matrix)</span>
        </button>
      </div>
    </section>
  );
}
