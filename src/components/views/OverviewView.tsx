'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Maximize2,
  X,
  ChevronsUpDown,
  Zap,
  Layers,
  BookOpen,
  GitMerge,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { HorizonGroup } from '@/types/schemas';
import { CitationChipList, RichTextWithCitations } from '@/components/shell/RichTextWithCitations';
import { SectionNavStrip, scrollToSectionById } from '@/components/shell/SectionNavStrip';
import { MorningBriefDeck } from '@/components/views/MorningBriefDeck';
import { GlobalFlashpointMap } from '@/components/views/GlobalFlashpointMap';
import { CrossDomainCrosswalk } from '@/components/views/CrossDomainCrosswalk';
import {
  SubseaChokepointAtlas,
  SubseaTheaterId,
} from '@/components/views/SubseaChokepointAtlas';
import { assessRiskVerification, resolveTraceNodeKey } from '@/lib/evidence';

const PILLAR_ROUTES = [
  { href: '/geopolitics', label: 'Ideological Contrast' },
  { href: '/geopolitics#crimea-deterrence-section', label: 'Crimea & Deterrence' },
  { href: '/geopolitics#entente-section', label: '2026–2030 Escalation' },
  { href: '/incidents#faa-teardown-section', label: 'FAA Case Study' },
  { href: '/contagion', label: 'Contagion & Legal' },
  { href: '/incidents#poisson-calc-section', label: 'Poisson Calculator' },
];

const CONSOLE_SECTION_IDS = new Set([
  'command-overview-hero',
  'flashpoint-map-section',
  'crosswalk-section',
  'cliff-strip-section',
  'bento-summary-section',
  'risk-matrix-section',
]);

function formatCountdownDelta(targetIso: string, nowMs: number) {
  const targetMs = Date.parse(targetIso);
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    const elapsedDays = Math.floor(Math.abs(diffMs) / 86_400_000);
    const sameUtcDay =
      new Date(targetMs).toISOString().slice(0, 10) ===
      new Date(nowMs).toISOString().slice(0, 10);
    return {
      expired: true,
      days: elapsedDays,
      hours: 0,
      minutes: 0,
      seconds: 0,
      badgeText: sameUtcDay ? 'COMPLETED TODAY' : `COMPLETED · T+${Math.max(1, elapsedDays)}d`,
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

  const [nowMs, setNowMs] = useState<number>(() => Date.parse('2026-11-18T14:00:00Z'));
  const [mounted, setMounted] = useState(false);
  const [overviewMode, setOverviewMode] = useState<'console' | 'brief'>('console');
  const [focusedCrosswalkKey, setFocusedCrosswalkKey] = useState<string>('inc:#2');
  const [selectedCliffIdx, setSelectedCliffIdx] = useState<number>(0);
  const [horizonFilter, setHorizonFilter] = useState<'ALL' | HorizonGroup>('ALL');
  const [riskQuery, setRiskQuery] = useState('');
  const [heroPlateOpen, setHeroPlateOpen] = useState(false);
  const [subseaTheater, setSubseaTheater] = useState<SubseaTheaterId>('euro-atlantic-baltic');
  const [expandedRisks, setExpandedRisks] = useState<Record<string, boolean>>({
    '#1': true,
    '#2': true,
  });
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({});

  const overviewNavItems = useMemo(
    () => [
      { id: 'command-overview-hero', code: '01', label: 'Situation Deck' },
      { id: 'flashpoint-map-section', code: '02', label: 'Flashpoints', badge: '7' },
      { id: 'crosswalk-section', code: '03', label: 'Crosswalk' },
      {
        id: 'cliff-strip-section',
        code: '04',
        label: '120d Cliffs',
        badge: String(countdownCliffs.length),
      },
      {
        id: 'bento-summary-section',
        code: '05',
        label: 'Pillars',
        badge: String(sections.executiveSummary.pillars.length),
      },
      {
        id: 'risk-matrix-section',
        code: '06',
        label: 'Risk Matrix',
        badge: String(riskMatrix.length),
      },
    ],
    [countdownCliffs.length, sections.executiveSummary.pillars.length, riskMatrix.length]
  );

  // Build data-driven Situation Flash items directly from canonical changelog diffs, cliffs, and top live OSINT
  const situationFlashItems = useMemo(() => {
    const items: Array<{ id: string; tone: 'cyan' | 'amber' | 'crimson'; title: string; body: string }> = [];

    for (const u of changelog.updatedStatuses.slice(0, 2)) {
      items.push({
        id: `diff-${u.eventId}`,
        tone: u.eventId === '#8' ? 'cyan' : 'amber',
        title: `Event ${u.eventId} · ${u.entity}:`,
        body: u.currentStatus.replace(/^Vector:\s*/i, ''),
      });
    }

    if (items.length < 3 && changelog.riskShifts[0]) {
      const shift = changelog.riskShifts[0];
      items.push({
        id: `risk-${shift.id}`,
        tone: 'amber',
        title: `Risk ${shift.id} Shift (${shift.field}):`,
        body: shift.current,
      });
    }

    const topCriticalSignal =
      liveSignals.signals.find((s) => s.severity === 'critical') ?? liveSignals.signals[0];
    if (topCriticalSignal) {
      items.push({
        id: `sig-${topCriticalSignal.id}`,
        tone: topCriticalSignal.severity === 'critical' ? 'crimson' : 'cyan',
        title: `${topCriticalSignal.sourceName}:`,
        body: topCriticalSignal.title,
      });
    }

    if (items.length < 3 && countdownCliffs[0]) {
      items.push({
        id: `cliff-${countdownCliffs[0].targetDateISO}`,
        tone: 'crimson',
        title: `${countdownCliffs[0].dateLabel} Cliff:`,
        body: countdownCliffs[0].milestone,
      });
    }

    return items.slice(0, 3);
  }, [changelog, liveSignals.signals, countdownCliffs]);

  useEffect(() => {
    const now = Date.now();
    setMounted(true);
    setNowMs(now);

    // Auto-select the nearest live upcoming cliff once prior deadlines have completed
    const nextLiveIdx = countdownCliffs.findIndex(
      (c) => Date.parse(c.targetTimestampISO) > now
    );
    if (nextLiveIdx >= 0) {
      setSelectedCliffIdx(nextLiveIdx);
    }

    // Check ?trace=... or #section hash deep links first; otherwise default <768px mobile visitors to 60s Brief
    const params = new URLSearchParams(window.location.search);
    const traceParam = resolveTraceNodeKey(params.get('trace'));
    const hashId = window.location.hash.replace(/^#/, '');

    if (traceParam) {
      setOverviewMode('console');
      setFocusedCrosswalkKey(traceParam);
      setTimeout(() => {
        scrollToSectionById('crosswalk-section', 'smooth');
      }, 80);
    } else if (hashId && CONSOLE_SECTION_IDS.has(hashId)) {
      setOverviewMode('console');
      setTimeout(() => {
        scrollToSectionById(hashId, 'smooth');
      }, 80);
    } else if (window.innerWidth < 768) {
      setOverviewMode('brief');
    }

    const onHashChange = () => {
      const nextHash = window.location.hash.replace(/^#/, '');
      if (nextHash && CONSOLE_SECTION_IDS.has(nextHash)) {
        setOverviewMode('console');
        setTimeout(() => {
          scrollToSectionById(nextHash, 'smooth');
        }, 40);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      clearInterval(timer);
    };
  }, [countdownCliffs]);

  function jumpAndTraceInCrosswalk(traceKey: string) {
    setOverviewMode('console');
    setFocusedCrosswalkKey(traceKey);
    setTimeout(() => {
      scrollToSectionById('crosswalk-section', 'smooth');
    }, 50);
  }

  useEffect(() => {
    if (!heroPlateOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHeroPlateOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [heroPlateOpen]);

  const incidentSpectrum = useMemo(() => {
    const total = Math.max(1, incidents.length);
    const malicious = incidents.filter((i) => i.classification === 'malicious_attack').length;
    const hybrid = incidents.filter((i) => i.classification === 'hybrid_transition_bug').length;
    const cascade = incidents.filter((i) => i.classification === 'client_cascade').length;
    const unspecified = incidents.filter((i) => i.classification === 'unspecified').length;
    return [
      {
        key: 'malicious_attack',
        label: 'Confirmed Malicious Supply-Chain',
        count: malicious,
        pct: (malicious / total) * 100,
        color: '#EF4444',
        textClass: 'text-[#EF4444]',
      },
      {
        key: 'hybrid_transition_bug',
        label: 'Hybrid TDM/IP & Technical Bugs',
        count: hybrid,
        pct: (hybrid / total) * 100,
        color: '#F59E0B',
        textClass: 'text-[#F59E0B]',
      },
      {
        key: 'client_cascade',
        label: 'Cross-Client Auth Cascade',
        count: cascade,
        pct: (cascade / total) * 100,
        color: '#38BDF8',
        textClass: 'text-[#38BDF8]',
      },
      ...(unspecified > 0
        ? [
            {
              key: 'unspecified',
              label: 'Root Cause Pending',
              count: unspecified,
              pct: (unspecified / total) * 100,
              color: '#9CA3AF',
              textClass: 'text-gray-400',
            },
          ]
        : []),
    ];
  }, [incidents]);

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

  const allFilteredRisksExpanded =
    filteredRisks.length > 0 && filteredRisks.every((r) => expandedRisks[r.id]);

  const selectedCliff = countdownCliffs[selectedCliffIdx] ?? countdownCliffs[0];
  const selectedCliffDelta = selectedCliff
    ? formatCountdownDelta(selectedCliff.targetTimestampISO, nowMs)
    : null;

  // Proportional 120-day window positioning (Nov 17, 2026 -> Mar 17, 2027)
  const windowStartMs = Date.parse('2026-11-17T00:00:00Z');
  const windowSpanMs = Date.parse('2027-03-17T00:00:00Z') - windowStartMs;

  const totalDiffCount =
    changelog.addedIncidents.length +
    changelog.updatedStatuses.length +
    changelog.riskShifts.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Segmented Mode Bar: Mobile defaults to 60s Morning Brief; Desktop defaults to Full Console */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="inline-flex rounded-md bg-[#0B0F17] border border-white/12 p-1">
          <button
            id="mode-btn-morning-brief"
            type="button"
            onClick={() => setOverviewMode('brief')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono-tactical transition cursor-pointer ${
              overviewMode === 'brief'
                ? 'bg-[#38BDF8]/16 text-[#38BDF8] border border-[#38BDF8]/40'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>60s Executive Brief</span>
          </button>
          <button
            id="mode-btn-full-console"
            type="button"
            onClick={() => setOverviewMode('console')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono-tactical transition cursor-pointer ${
              overviewMode === 'console'
                ? 'bg-[#38BDF8]/16 text-[#38BDF8] border border-[#38BDF8]/40'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full Console</span>
          </button>
        </div>

        <span className="font-mono-tactical text-[11px] text-gray-500 hidden sm:inline">
          {overviewMode === 'brief'
            ? 'Swipeable 4-Card Executive Readout'
            : 'Flashpoint Map · Dependency Crosswalk · 8-Vector Matrix'}
        </span>
      </div>

      {overviewMode === 'brief' ? (
        <MorningBriefDeck
          nowMs={nowMs}
          onOpenFullConsole={() => setOverviewMode('console')}
        />
      ) : (
        <>
          {/* In-Page Sticky Section Navigation */}
          <SectionNavStrip items={overviewNavItems} ariaLabel="Command Overview sections" />

          {/* Asymmetric 12-Column Executive Situation Deck */}
          <section
            id="command-overview-hero"
            className="glass-panel tac-frame rounded-lg overflow-hidden scroll-mt-nav"
          >
            {/* Top Telemetry Status Bar */}
            <div className="px-4 sm:px-6 py-3 bg-[#070A10] border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-tactical">
                <span className="px-2 py-0.5 rounded-sm bg-[#10B981]/12 border border-[#10B981]/35 text-[#10B981] inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {feedHealth.liveCount}/{feedHealth.totalFeeds} PUBLIC FEEDS LIVE
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8]">
                  {liveSignals.ingestionMode}
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-white/[0.04] border border-white/10 text-gray-300">
                  EDITION: {sections.docDate.toUpperCase()} · SYNC{' '}
                  {new Date(changelog.syncedAtISO).toISOString().replace('T', ' ').slice(0, 16)} UTC
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="hero-what-changed-btn"
                  type="button"
                  onClick={() => setChangelogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/[0.04] hover:bg-white/[0.09] border border-white/14 text-xs font-mono-tactical text-white transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>What Changed</span>
                  {totalDiffCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-sm bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[10px] font-semibold text-[#F59E0B]">
                      {totalDiffCount}
                    </span>
                  )}
                </button>
                <Link
                  href="/watchlist?tab=live-wire"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#38BDF8]/14 hover:bg-[#38BDF8]/24 border border-[#38BDF8]/40 text-xs font-mono-tactical text-[#38BDF8] transition"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Live Wire ({liveSignals.totalSignals})</span>
                </Link>
              </div>
            </div>

            {/* Main 12-Column Asymmetric Body */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 7 Columns: Editorial Thesis, KPI Matrix & Forensic Attribution Bar */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <p className="font-mono-tactical text-[10px] uppercase tracking-widest text-[#38BDF8]">
                    EXECUTIVE SYNTHESIS · {sections.docDate.toUpperCase()}
                  </p>
                  <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-white leading-[1.18]">
                    {sections.docTitle}
                  </h1>
                  <p className="text-xs sm:text-[14px] text-gray-300 leading-[1.65]">
                    {sections.executiveSummary.intro}
                  </p>
                </div>

                {/* 4 Interactive KPI Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Link
                    href="/incidents"
                    className="obsidian-surface hover:border-[#EF4444]/45 rounded-md p-3 transition group"
                  >
                    <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500">
                      Tracked Wave
                    </p>
                    <p className="font-mono-tactical text-xl sm:text-2xl font-semibold text-white mt-1 group-hover:text-[#EF4444] transition">
                      {incidents.length} Events
                    </p>
                    <p className="text-[10px] text-[#EF4444] mt-0.5 font-mono-tactical">
                      ~6M US Reports/Wk
                    </p>
                  </Link>

                  <a
                    href="#risk-matrix-section"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSectionById('risk-matrix-section', 'smooth');
                    }}
                    className="obsidian-surface hover:border-[#F59E0B]/45 rounded-md p-3 transition group"
                  >
                    <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500">
                      Risk Domains
                    </p>
                    <p className="font-mono-tactical text-xl sm:text-2xl font-semibold text-white mt-1 group-hover:text-[#F59E0B] transition">
                      {riskMatrix.length} Vectors
                    </p>
                    <p className="text-[10px] text-[#F59E0B] mt-0.5 font-mono-tactical">
                      {riskMatrix.filter((r) => r.horizonGroup === 'Immediate').length} Immediate Active
                    </p>
                  </a>

                  <a
                    href="#cliff-strip-section"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSectionById('cliff-strip-section', 'smooth');
                    }}
                    className="obsidian-surface hover:border-[#38BDF8]/45 rounded-md p-3 transition group"
                  >
                    <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500">
                      120-Day Window
                    </p>
                    <p className="font-mono-tactical text-xl sm:text-2xl font-semibold text-white mt-1 group-hover:text-[#38BDF8] transition">
                      {countdownCliffs.length} Cliffs
                    </p>
                    <p className="text-[10px] text-[#38BDF8] mt-0.5 font-mono-tactical">
                      {countdownCliffs[0]?.dateLabel ?? 'Q4'} →{' '}
                      {countdownCliffs[countdownCliffs.length - 1]?.dateLabel ?? 'Q1'}
                    </p>
                  </a>

                  <Link
                    href="/watchlist?tab=vault"
                    className="obsidian-surface hover:border-[#10B981]/45 rounded-md p-3 transition group"
                  >
                    <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500">
                      Source Vault
                    </p>
                    <p className="font-mono-tactical text-xl sm:text-2xl font-semibold text-white mt-1 group-hover:text-[#10B981] transition">
                      {sections.primarySources.length} URLs
                    </p>
                    <p className="text-[10px] text-[#10B981] mt-0.5 font-mono-tactical">
                      {bundle.watchlist.length}-Point Watchlist
                    </p>
                  </Link>
                </div>

                {/* Forensic Attribution Spectrum Bar */}
                <div className="obsidian-surface rounded-md p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                      Forensic Attribution Split ({incidents.length} Tracked Events)
                    </span>
                    <Link
                      href="/incidents"
                      className="font-mono-tactical text-[11px] text-[#38BDF8] hover:underline"
                    >
                      Inspect All Readouts →
                    </Link>
                  </div>

                  <div className="h-2 w-full rounded-xs overflow-hidden bg-[#06080C] border border-white/10 flex">
                    {incidentSpectrum.map((seg) =>
                      seg.count > 0 ? (
                        <div
                          key={seg.key}
                          style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                          title={`${seg.label}: ${seg.count} (${Math.round(seg.pct)}%)`}
                          className="h-full transition-all"
                        />
                      ) : null
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono-tactical">
                    {incidentSpectrum.map((seg) => (
                      <Link
                        key={seg.key}
                        href="/incidents"
                        className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white transition"
                      >
                        <span
                          className="w-2 h-2 rounded-[1px]"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span>{seg.label}:</span>
                        <span className={`font-semibold ${seg.textClass}`}>{seg.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: Framed PLATE 00 Subsea Chokepoint Atlas + Dynamic Canonical Situation Flash */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
                <SubseaChokepointAtlas
                  theaterId={subseaTheater}
                  onTheaterChange={setSubseaTheater}
                  defaultShowCallouts={false}
                  compact={true}
                  onRequestExpand={() => setHeroPlateOpen(true)}
                />

                {/* Data-Driven Latest Sync Situation Flash (updates automatically on every Google Doc sync) */}
                <div className="obsidian-surface rounded-md p-3.5 space-y-2.5 flex-1 flex flex-col justify-between border border-white/12">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tactical text-[10px] uppercase tracking-wider text-[#F59E0B] inline-flex items-center gap-1.5 font-semibold">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{sections.docDate} · Live Sync Delta</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setChangelogOpen(true)}
                        className="font-mono-tactical text-[10px] text-[#38BDF8] hover:underline cursor-pointer"
                      >
                        {totalDiffCount > 0 ? `View ${totalDiffCount} Diffs →` : 'Sync Ledger →'}
                      </button>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-200 leading-snug">
                      {situationFlashItems.map((item) => {
                        const dot =
                          item.tone === 'crimson'
                            ? 'bg-[#EF4444]'
                            : item.tone === 'amber'
                            ? 'bg-[#F59E0B]'
                            : 'bg-[#38BDF8]';
                        return (
                          <li key={item.id} className="flex items-start gap-2">
                            <span className={`w-1.5 h-1.5 rounded-[1px] ${dot} mt-1.5 shrink-0`} />
                            <span className="line-clamp-2">
                              <strong className="text-white">{item.title}</strong> {item.body}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hero Subsea Chokepoint & SLTE Conflict-Zone Atlas Lightbox */}
          {heroPlateOpen &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                className="fixed inset-0 z-[100] bg-[#06080C]/95 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
                onClick={() => setHeroPlateOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-label="PLATE 00 — Subsea Optical Cable & Chokepoint Conflict-Zone Atlas"
              >
                <div
                  className="max-w-[980px] w-full obsidian-surface rounded-lg overflow-hidden shadow-2xl border border-white/20 my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 sm:px-5 py-2.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#070A10]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono-tactical text-xs px-2 py-0.5 rounded-sm bg-[#38BDF8]/15 border border-[#38BDF8]/35 text-[#38BDF8] shrink-0">
                        PLATE 00
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                        Subsea Optical Cable Landings &amp; Conflict-Zone Chokepoint Atlas
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline font-mono-tactical text-[11px] text-gray-500">
                        ESC to close
                      </span>
                      <button
                        type="button"
                        onClick={() => setHeroPlateOpen(false)}
                        className="p-1.5 rounded-sm bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-gray-300 hover:text-white transition cursor-pointer"
                        aria-label="Close Subsea Chokepoint Atlas"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3.5 bg-[#05080E]">
                    <SubseaChokepointAtlas
                      theaterId={subseaTheater}
                      onTheaterChange={setSubseaTheater}
                      defaultShowCallouts={true}
                      compact={false}
                    />
                  </div>
                </div>
              </div>,
              document.body
            )}

      {/* Flagship Interactive Module 1: Global Flashpoint & Backbone Vector Map */}
      <GlobalFlashpointMap onTraceNode={jumpAndTraceInCrosswalk} />

      {/* Flagship Interactive Module 2: Dual-Mode Cross-Domain Dependency Crosswalk */}
      <CrossDomainCrosswalk
        focusedKey={focusedCrosswalkKey}
        onFocusKey={setFocusedCrosswalkKey}
      />

      {/* Live Client-Side 120-Day Cliff Countdown Strip */}
      <section
        id="cliff-strip-section"
        aria-labelledby="cliff-strip-heading"
        className="space-y-3.5 scroll-mt-nav"
      >
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

        {/* Proportional 120-Day Horizon Rail */}
        <div className="obsidian-surface rounded-md px-4 py-3 space-y-2 hidden sm:block">
          <div className="flex items-center justify-between font-mono-tactical text-[10px] text-gray-400 uppercase">
            <span>Nov 18, 2026 (House Hearing &amp; ANT IPO)</span>
            <span>Dec 31 – Jan 10 (Clearing, DFARS &amp; REE Cliffs)</span>
            <span>Mar 15, 2027 (100-Day TLS Cliff)</span>
          </div>
          <div className="relative h-5 flex items-center">
            <div className="w-full h-1 rounded-xs bg-white/10" />
            {countdownCliffs.map((cliff, idx) => {
              const targetMs = Date.parse(cliff.targetTimestampISO);
              const rawPct = ((targetMs - windowStartMs) / windowSpanMs) * 100;
              const clampedPct = Math.min(98.5, Math.max(1.5, rawPct));
              const delta = formatCountdownDelta(cliff.targetTimestampISO, nowMs);
              const active = idx === selectedCliffIdx;
              const dotBg = delta.expired
                ? 'bg-[#10B981]'
                : delta.days <= 12
                ? 'bg-[#EF4444]'
                : delta.days <= 55
                ? 'bg-[#F59E0B]'
                : 'bg-[#38BDF8]';
              return (
                <button
                  key={cliff.targetDateISO}
                  type="button"
                  onClick={() => setSelectedCliffIdx(idx)}
                  style={{ left: `${clampedPct}%` }}
                  title={`${cliff.dateLabel}: ${cliff.milestone}`}
                  className={`absolute -translate-x-1/2 rounded-full transition-transform cursor-pointer ${dotBg} ${
                    active
                      ? 'w-3.5 h-3.5 ring-4 ring-white/25 scale-110 z-10'
                      : 'w-2.5 h-2.5 opacity-80 hover:opacity-100 hover:scale-125'
                  }`}
                  aria-label={`Select countdown cliff ${cliff.dateLabel}`}
                />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {countdownCliffs.map((cliff, idx) => {
            const delta = formatCountdownDelta(cliff.targetTimestampISO, nowMs);
            const isSelected = idx === selectedCliffIdx;
            const urgencyColor = delta.expired
              ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10'
              : delta.days <= 12
              ? 'text-[#EF4444] border-[#EF4444]/35 bg-[#EF4444]/10'
              : delta.days <= 55
              ? 'text-[#F59E0B] border-[#F59E0B]/35 bg-[#F59E0B]/10'
              : 'text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10';

            return (
              <button
                key={cliff.targetDateISO}
                type="button"
                onClick={() => setSelectedCliffIdx(idx)}
                className={`text-left rounded-md p-4 transition cursor-pointer border ${
                  isSelected
                    ? 'surface-elevated border-[#38BDF8]/60 shadow-lg'
                    : 'glass-card border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono-tactical text-xs font-medium text-gray-200">
                    {cliff.dateLabel}
                  </span>
                  <span
                    className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm border ${urgencyColor}`}
                  >
                    {delta.badgeText}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] font-medium text-white line-clamp-2 leading-snug">
                  {cliff.milestone}
                </p>
              </button>
            );
          })}
        </div>

        {selectedCliff && selectedCliffDelta && (
          <div className="surface-elevated rounded-md px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-tactical text-xs font-semibold text-[#F59E0B]">
                  SELECTED CLIFF ({selectedCliff.dateLabel} · {selectedCliff.targetDateISO})
                </span>
                <span className="text-sm font-semibold text-white">
                  — {selectedCliff.milestone}
                </span>
              </div>
              <p className="text-xs sm:text-[13.5px] text-gray-200 leading-relaxed">
                <span className="font-mono-tactical text-xs text-[#38BDF8]">
                  REQUIRED ACTION &amp; EXPOSURE:{' '}
                </span>
                {selectedCliff.actionExposure}
              </p>
            </div>

            <div className="obsidian-surface rounded-sm px-3.5 py-2.5 shrink-0 flex items-center gap-3 self-start lg:self-center">
              <span className="font-mono-tactical text-[10px] uppercase text-gray-400">
                {selectedCliffDelta.expired ? 'Status' : 'T-Minus'}
              </span>
              <span className="font-mono-tactical text-sm font-semibold text-white">
                {selectedCliffDelta.badgeText}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 6-Pillar Executive Summary Bento Grid */}
      <section
        id="bento-summary-section"
        aria-labelledby="bento-summary-heading"
        className="space-y-3.5 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="bento-summary-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Executive Summary — 6 Strategic Synthesis Pillars
          </h2>
          <span className="font-mono-tactical text-xs text-gray-400">
            Click any inline citation chip to inspect primary source provenance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sections.executiveSummary.pillars.map((pillar, idx) => {
            const routeInfo = PILLAR_ROUTES[idx] ?? {
              href: '/watchlist',
              label: 'Explore Watchlist',
            };
            const isExpanded = Boolean(expandedPillars[pillar.id]);
            return (
              <article
                key={pillar.id}
                className="glass-card rounded-md p-4 sm:p-5 flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tactical text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#06080C] border border-white/12 text-[#38BDF8]">
                      PILLAR 0{idx + 1}
                    </span>
                    <span className="font-mono-tactical text-[10px] text-gray-500">
                      {pillar.sources.length} ref{pillar.sources.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-white leading-snug">
                    {pillar.title}
                  </h3>
                  <div
                    className={`text-xs sm:text-[13px] text-gray-300 leading-[1.62] ${
                      isExpanded ? '' : 'line-clamp-3'
                    }`}
                  >
                    <RichTextWithCitations
                      text={pillar.body}
                      contextLabel={`Executive Summary — ${pillar.title}`}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPillars((prev) => ({ ...prev, [pillar.id]: !prev[pillar.id] }))
                    }
                    className="font-mono-tactical text-[11px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    {isExpanded ? '− Less' : '+ Full text'}
                  </button>
                  <Link
                    href={routeInfo.href}
                    className="inline-flex items-center gap-1 text-[11px] font-mono-tactical text-[#38BDF8] hover:underline"
                  >
                    <span>{routeInfo.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Interactive 8-Vector Executive Risk Matrix */}
      <section
        id="risk-matrix-section"
        aria-labelledby="risk-matrix-heading"
        className="space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <h2
              id="risk-matrix-heading"
              className="text-sm font-mono-tactical uppercase tracking-wider text-white flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              <span>{riskMatrix.length}-Vector Executive Risk Matrix ({sections.docDate})</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Filter by horizon or keyword; expand vectors for tripwires, mitigations, and live OSINT hits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
                  className={`px-2.5 py-1.5 rounded-sm text-xs font-mono-tactical border transition cursor-pointer ${
                    active
                      ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                      : 'bg-[#0B0F17] border-white/10 text-gray-300 hover:bg-white/[0.06]'
                  }`}
                >
                  {h === 'ALL' ? 'All' : h} ({count})
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                const next: Record<string, boolean> = { ...expandedRisks };
                const shouldExpand = !allFilteredRisksExpanded;
                for (const r of filteredRisks) {
                  next[r.id] = shouldExpand;
                }
                setExpandedRisks(next);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-[#0B0F17] hover:bg-white/[0.06] border border-white/10 text-xs font-mono-tactical text-gray-300 hover:text-white transition cursor-pointer"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{allFilteredRisksExpanded ? 'Collapse' : 'Expand All'}</span>
            </button>

            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                id="risk-keyword-filter"
                type="text"
                value={riskQuery}
                onChange={(e) => setRiskQuery(e.target.value)}
                placeholder="Filter vectors…"
                className="pl-8 pr-3 py-1.5 rounded-sm bg-[#070A10] border border-white/14 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredRisks.map((vec) => {
            const expanded = Boolean(expandedRisks[vec.id]);
            const liveMatches = signalCountByRisk[vec.id] ?? 0;
            const isCatastrophicOrSevere = /catastrophic|severe/i.test(vec.blastRadius);
            const verif = assessRiskVerification(vec);

            return (
              <div
                key={vec.id}
                className={`glass-card rounded-md overflow-hidden border-l-2 ${
                  isCatastrophicOrSevere ? 'border-l-[#EF4444]' : 'border-l-[#F59E0B]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedRisks((prev) => ({ ...prev, [vec.id]: !prev[vec.id] }))
                  }
                  className="w-full text-left px-4 sm:px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="font-mono-tactical text-xs font-semibold px-2 py-0.5 rounded-sm bg-[#06080C] border border-white/15 text-white shrink-0">
                      {vec.id}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-[15px] font-semibold text-white">
                        {vec.domain}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono-tactical mt-0.5">
                        Horizon: {vec.horizon}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <span
                      title={verif.basis}
                      className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm border ${
                        verif.tone === 'emerald'
                          ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                          : 'bg-white/[0.04] border-white/14 text-gray-300'
                      }`}
                    >
                      {verif.level}
                    </span>
                    <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]">
                      {vec.likelihood.split('(')[0].trim()}
                    </span>
                    <span
                      className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm border ${
                        isCatastrophicOrSevere
                          ? 'bg-[#EF4444]/10 border-[#EF4444]/35 text-[#EF4444]'
                          : 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
                      }`}
                    >
                      Blast: {vec.blastRadius.split('(')[0].trim()}
                    </span>
                    {liveMatches > 0 && (
                      <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
                        {liveMatches} OSINT
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
                  <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-white/[0.08] grid grid-cols-1 lg:grid-cols-2 gap-3.5 text-[13px] bg-[#070A10]">
                    <div className="obsidian-surface rounded-md p-3.5 space-y-2">
                      <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-[#F59E0B]">
                        Primary Trigger / Tripwire
                      </p>
                      <p className="text-gray-200 leading-relaxed">{vec.tripwire}</p>
                      <p className="text-xs text-gray-400 pt-1">
                        <span className="font-mono-tactical text-gray-300">Blast Scope:</span>{' '}
                        {vec.blastRadius}
                      </p>
                      <CitationChipList
                        sources={vec.sources}
                        contextLabel={`Risk Vector ${vec.id}: ${vec.domain}`}
                      />
                    </div>

                    <div className="obsidian-surface rounded-md p-3.5 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-[#10B981]">
                          Priority Mitigation Directive
                        </p>
                        <p className="text-gray-200 leading-relaxed">{vec.mitigation}</p>
                        <p className="text-xs text-gray-400 pt-1">
                          <span className="font-mono-tactical text-gray-300">
                            Verification Basis:
                          </span>{' '}
                          {verif.basis}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tactical text-gray-400">
                        <button
                          type="button"
                          onClick={() => jumpAndTraceInCrosswalk(`risk:${vec.id}`)}
                          className="inline-flex items-center gap-1 text-[#38BDF8] hover:underline cursor-pointer"
                        >
                          <GitMerge className="w-3 h-3" />
                          <span>Trace in Crosswalk</span>
                        </button>
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
        </>
      )}
    </div>
  );
}
