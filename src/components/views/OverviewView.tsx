'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Filter,
  History,
  Radio,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { HorizonGroup } from '@/types/schemas';
import { CitationChipList, RichTextWithCitations } from '@/components/shell/RichTextWithCitations';

const PILLAR_ROUTES = [
  { href: '/geopolitics', label: 'Explore Ideological Contrast' },
  { href: '/geopolitics', label: 'Inspect Crimea & Deterrence Gaps' },
  { href: '/geopolitics', label: 'View 2026–2030 Escalation Timeline' },
  { href: '/incidents', label: 'Open FAA Ground Stop Case Study' },
  { href: '/contagion', label: 'Inspect Contagion & War Clauses' },
  { href: '/incidents', label: 'Run Poisson Cluster Calculator' },
];

function formatCountdownDelta(targetIso: string, nowMs: number) {
  const targetMs = Date.parse(targetIso);
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    const elapsedDays = Math.floor(Math.abs(diffMs) / 86_400_000);
    return {
      expired: true,
      days: elapsedDays,
      hours: 0,
      minutes: 0,
      seconds: 0,
      badgeText: elapsedDays === 0 ? 'ACTIVE TODAY' : `T+${elapsedDays}d ELAPSED`,
    };
  }
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    badgeText: `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(
      2,
      '0'
    )}m ${String(seconds).padStart(2, '0')}s`,
  };
}

export function OverviewView() {
  const { bundle, setChangelogOpen } = usePortal();
  const {
    sections,
    riskMatrix,
    countdownCliffs,
    changelog,
    feedHealth,
    liveSignals,
    incidents,
  } = bundle;

  const [nowMs, setNowMs] = useState<number>(() => Date.parse('2026-11-17T22:00:00Z'));
  const [mounted, setMounted] = useState(false);
  const [selectedCliffIdx, setSelectedCliffIdx] = useState<number>(0);
  const [horizonFilter, setHorizonFilter] = useState<'ALL' | HorizonGroup>('ALL');
  const [riskQuery, setRiskQuery] = useState('');
  const [expandedRisks, setExpandedRisks] = useState<Record<string, boolean>>({
    '#1': true,
    '#2': true,
  });

  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const signalCountByRisk = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sig of liveSignals.signals) {
      for (const rId of sig.riskMatrixMatches) {
        counts[rId] = (counts[rId] ?? 0) + 1;
      }
    }
    return counts;
  }, [liveSignals.signals]);

  const filteredRisks = useMemo(() => {
    return riskMatrix.filter((r) => {
      if (horizonFilter !== 'ALL' && r.horizonGroup !== horizonFilter) {
        return false;
      }
      if (riskQuery.trim()) {
        const q = riskQuery.toLowerCase();
        const hay = `${r.id} ${r.domain} ${r.horizon} ${r.tripwire} ${r.mitigation}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [riskMatrix, horizonFilter, riskQuery]);

  const selectedCliff = countdownCliffs[selectedCliffIdx] ?? countdownCliffs[0];

  return (
    <div className="space-y-8">
      {/* Hero Status & Telemetry Header */}
      <section className="glass-panel rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-tactical">
            <span className="px-2.5 py-1 rounded bg-[#10B981]/15 border border-[#10B981]/35 text-[#10B981] inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {feedHealth.liveCount}/{feedHealth.totalFeeds} PUBLIC FEEDS LIVE
              </span>
            </span>
            <span className="px-2.5 py-1 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8]">
              MODE: {liveSignals.ingestionMode}
            </span>
            <span className="px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 text-gray-300">
              DOC SYNC:{' '}
              {new Date(changelog.syncedAtISO).toISOString().replace('T', ' ').slice(0, 16)} UTC
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="hero-what-changed-btn"
              type="button"
              onClick={() => setChangelogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-mono-tactical text-white transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>What Changed</span>
            </button>
            <Link
              href="/watchlist?tab=live-wire"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-xs font-mono-tactical text-[#38BDF8] transition"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Wire ({liveSignals.totalSignals})</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              {sections.docTitle}
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              {sections.executiveSummary.intro}
            </p>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                Nov 12–17 Cluster
              </p>
              <p className="font-mono-tactical text-2xl font-semibold text-white mt-1">
                {incidents.length} Events
              </p>
              <p className="text-[11px] text-[#EF4444] mt-0.5 font-mono-tactical">
                1 Malicious · 1 Cascade
              </p>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                Risk Domains
              </p>
              <p className="font-mono-tactical text-2xl font-semibold text-white mt-1">
                {riskMatrix.length} Vectors
              </p>
              <p className="text-[11px] text-[#F59E0B] mt-0.5 font-mono-tactical">
                4 Immediate Active
              </p>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                120-Day Calendar
              </p>
              <p className="font-mono-tactical text-2xl font-semibold text-white mt-1">
                {countdownCliffs.length} Cliffs
              </p>
              <p className="text-[11px] text-[#38BDF8] mt-0.5 font-mono-tactical">
                Nov 18 → Mar 15
              </p>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                Verified Citations
              </p>
              <p className="font-mono-tactical text-2xl font-semibold text-white mt-1">
                {sections.primarySources.length} URLs
              </p>
              <p className="text-[11px] text-[#10B981] mt-0.5 font-mono-tactical">
                9-Point Watchlist
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Client-Side 120-Day Cliff Countdown Strip */}
      <section aria-labelledby="cliff-strip-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <h2
              id="cliff-strip-heading"
              className="text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              120-Day Supply-Chain, Clearing, Telecom &amp; Cryptographic Countdown Strip
            </h2>
          </div>
          <span className="font-mono-tactical text-xs text-gray-400">
            {mounted ? 'Live Client UTC Ticker Active' : 'Synchronizing Client Clock…'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {countdownCliffs.map((cliff, idx) => {
            const delta = formatCountdownDelta(cliff.targetTimestampISO, nowMs);
            const isSelected = idx === selectedCliffIdx;
            const urgencyColor =
              delta.days <= 12
                ? 'text-[#EF4444] border-[#EF4444]/35 bg-[#EF4444]/10'
                : delta.days <= 55
                ? 'text-[#F59E0B] border-[#F59E0B]/35 bg-[#F59E0B]/10'
                : 'text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10';

            return (
              <button
                key={cliff.targetDateISO}
                type="button"
                onClick={() => setSelectedCliffIdx(idx)}
                className={`text-left rounded-xl p-3.5 transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#111827] border-[#38BDF8]/60 shadow-lg'
                    : 'glass-card border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono-tactical text-xs text-gray-300">
                    {cliff.dateLabel}
                  </span>
                  <span
                    className={`font-mono-tactical text-[11px] px-2 py-0.5 rounded border ${urgencyColor}`}
                  >
                    {delta.badgeText}
                  </span>
                </div>
                <p className="text-xs font-medium text-white line-clamp-2 leading-snug">
                  {cliff.milestone}
                </p>
              </button>
            );
          })}
        </div>

        {selectedCliff && (
          <div className="obsidian-surface rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono-tactical text-xs text-[#F59E0B]">
                  SELECTED CLIFF ({selectedCliff.dateLabel} · {selectedCliff.targetDateISO})
                </span>
                <span className="text-xs font-semibold text-white">
                  — {selectedCliff.milestone}
                </span>
              </div>
              <p className="text-xs text-gray-300">
                <span className="font-mono-tactical text-gray-400">REQUIRED ACTION: </span>
                {selectedCliff.actionExposure}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 6-Pillar Executive Summary Bento Grid */}
      <section aria-labelledby="bento-summary-heading" className="space-y-3">
        <h2
          id="bento-summary-heading"
          className="text-sm font-mono-tactical uppercase tracking-wider text-white"
        >
          Executive Summary — 6 Strategic Synthesis Pillars
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.executiveSummary.pillars.map((pillar, idx) => {
            const routeInfo = PILLAR_ROUTES[idx] ?? {
              href: '/watchlist',
              label: 'Explore Watchlist',
            };
            return (
              <article
                key={pillar.id}
                className="glass-card rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[#38BDF8]">
                      PILLAR 0{idx + 1}
                    </span>
                    <span className="font-mono-tactical text-[11px] text-gray-500">
                      {pillar.sources.length} verified ref{pillar.sources.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <RichTextWithCitations
                      text={pillar.body}
                      contextLabel={`Executive Summary — ${pillar.title}`}
                    />
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <Link
                    href={routeInfo.href}
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tactical text-[#38BDF8] hover:underline"
                  >
                    <span>{routeInfo.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Interactive 8-Vector Executive Risk Matrix */}
      <section aria-labelledby="risk-matrix-heading" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2
              id="risk-matrix-heading"
              className="text-sm font-mono-tactical uppercase tracking-wider text-white flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              <span>8-Vector Executive Risk Matrix (November 2026 Assessment)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Filter by operational horizon or keyword; click any vector to inspect tripwires,
              mitigations, and correlated live OSINT signals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'Immediate', '10–54 Days', '2027–2030'] as const).map((h) => {
              const active = horizonFilter === h;
              const count =
                h === 'ALL'
                  ? riskMatrix.length
                  : riskMatrix.filter((r) => r.horizonGroup === h).length;
              return (
                <button
                  key={h}
                  id={`risk-filter-${h.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                  type="button"
                  onClick={() => setHorizonFilter(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
                    active
                      ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                      : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {h === 'ALL' ? 'All Horizons' : h} ({count})
                </button>
              );
            })}

            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                id="risk-keyword-filter"
                type="text"
                value={riskQuery}
                onChange={(e) => setRiskQuery(e.target.value)}
                placeholder="Filter vectors…"
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#111827] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredRisks.map((vec) => {
            const expanded = Boolean(expandedRisks[vec.id]);
            const liveMatches = signalCountByRisk[vec.id] ?? 0;
            const isCatastrophicOrSevere = /catastrophic|severe/i.test(vec.blastRadius);

            return (
              <div key={vec.id} className="glass-card rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedRisks((prev) => ({ ...prev, [vec.id]: !prev[vec.id] }))
                  }
                  className="w-full text-left px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="font-mono-tactical text-xs font-semibold px-2.5 py-1 rounded bg-[#111827] border border-white/15 text-white shrink-0">
                      {vec.id}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        {vec.domain}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono-tactical mt-0.5">
                        Horizon: {vec.horizon}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]">
                      Likelihood: {vec.likelihood.split('(')[0].trim()}
                    </span>
                    <span
                      className={`font-mono-tactical text-[11px] px-2 py-0.5 rounded border ${
                        isCatastrophicOrSevere
                          ? 'bg-[#EF4444]/10 border-[#EF4444]/35 text-[#EF4444]'
                          : 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
                      }`}
                    >
                      Blast: {vec.blastRadius.split('(')[0].trim()}
                    </span>
                    {liveMatches > 0 && (
                      <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
                        {liveMatches} OSINT hits
                      </span>
                    )}
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-[#38BDF8]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-white/[0.08] grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div className="obsidian-surface rounded-lg p-3.5 space-y-1.5">
                      <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-[#F59E0B]">
                        Primary Trigger / Tripwire
                      </p>
                      <p className="text-gray-200 leading-relaxed">{vec.tripwire}</p>
                      <p className="text-gray-400 pt-1">
                        <span className="font-mono-tactical">Full Blast Scope:</span> {vec.blastRadius}
                      </p>
                      <CitationChipList
                        sources={vec.sources}
                        contextLabel={`Risk Vector ${vec.id}: ${vec.domain}`}
                      />
                    </div>

                    <div className="obsidian-surface rounded-lg p-3.5 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-[#10B981]">
                          Priority Mitigation Directive
                        </p>
                        <p className="text-gray-200 leading-relaxed">{vec.mitigation}</p>
                      </div>
                      <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between text-[11px] font-mono-tactical text-gray-400">
                        <span>Likelihood Assessment: {vec.likelihood}</span>
                        <Link
                          href="/watchlist?tab=live-wire"
                          className="text-[#38BDF8] hover:underline"
                        >
                          Inspect Live Wire →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
