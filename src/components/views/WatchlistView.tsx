'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Radio,
  Library,
  Copy,
  Check,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  GitMerge,
  Pin,
  PinOff,
  RefreshCw,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { FeedId, PrimarySourceEntry, SignalSeverity } from '@/types/schemas';
import { FEED_DOMAIN_GROUPS, FEED_META_BY_ID, FeedDomainGroup } from '@/lib/feed-registry';
import { CitationChipList } from '@/components/shell/RichTextWithCitations';
import { FeedSparkline } from '@/components/shell/FeedSparkline';
import { TacticalFigure } from '@/components/shell/TacticalFigure';
import { scrollToSectionById } from '@/components/shell/SectionNavStrip';
import { classifySourceTier } from '@/lib/evidence';

type WatchlistTab = 'watchlist' | 'live-wire' | 'vault';
type TriagePreset = 'all' | 'pinned' | FeedDomainGroup;

const TRIAGE_PRESETS: Array<{ id: TriagePreset; label: string }> = [
  { id: 'all', label: 'All 15 Feeds' },
  { id: 'pinned', label: 'Pinned' },
  ...FEED_DOMAIN_GROUPS.map((g) => ({ id: g.id, label: g.shortLabel })),
];

const DOMAIN_TAGS: Array<'ALL' | PrimarySourceEntry['domainTag']> = [
  'ALL',
  'Geopolitics & Doctrine',
  'Aviation & FAA',
  'Cyber & OT Advisories',
  'Supply Chain & Minerals',
  'Financial & Banking',
  'Legal & Insurance',
  'Outage Telemetry',
];

export function WatchlistView() {
  const {
    bundle,
    openCitation,
    pinnedSignalIds,
    togglePinSignal,
    clearPinnedSignals,
    isScanningLive,
    lastLiveScanSummary,
    triggerLiveScan,
  } = usePortal();
  const { watchlist, liveSignals, feedHealth, feedHistory, sections } = bundle;

  const [activeTab, setActiveTab] = useState<WatchlistTab>('watchlist');
  const [highlightedWatchId, setHighlightedWatchId] = useState<string | null>(null);
  const [triagePreset, setTriagePreset] = useState<TriagePreset>('all');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SignalSeverity>('ALL');
  const [feedFilter, setFeedFilter] = useState<'ALL' | FeedId>('ALL');
  const [watchlistIdFilter, setWatchlistIdFilter] = useState<string>('ALL');
  const [liveQuery, setLiveQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);

  const [vaultQuery, setVaultQuery] = useState('');
  const [vaultDomain, setVaultDomain] =
    useState<'ALL' | PrimarySourceEntry['domainTag']>('ALL');

  // Support ?tab=live-wire and #watchlist-card-N deep-linking on client without needing Suspense wrapper
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const hashId = window.location.hash.replace(/^#/, '');
    const cardMatch = hashId.match(/^watchlist-card-(\d+)$/);

    if (cardMatch) {
      setActiveTab('watchlist');
      setHighlightedWatchId(`#${cardMatch[1]}`);
      setTimeout(() => {
        scrollToSectionById(hashId, 'smooth');
      }, 80);
    } else if (tab === 'live-wire' || tab === 'vault' || tab === 'watchlist') {
      setActiveTab(tab);
    }
  }, []);

  function switchTab(nextTab: WatchlistTab) {
    setActiveTab(nextTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', nextTab);
      window.history.replaceState({}, '', url.toString());
    }
  }

  function applyTriagePreset(preset: TriagePreset) {
    setTriagePreset(preset);
    setFeedFilter('ALL');
    setWatchlistIdFilter('ALL');
    if (preset === 'pinned') {
      setSeverityFilter('ALL');
    }
  }

  const liveCountsByWatchlist = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sig of liveSignals.signals) {
      for (const wId of sig.watchlistMatches) {
        map[wId] = (map[wId] ?? 0) + 1;
      }
    }
    return map;
  }, [liveSignals.signals]);

  const topSpotlightSignals = useMemo(() => {
    return liveSignals.signals
      .filter(
        (s) =>
          s.sourceId === 'cisa-kev' ||
          s.sourceId === 'cisa-advisories' ||
          s.sourceId === 'nist-nvd'
      )
      .slice(0, 2);
  }, [liveSignals.signals]);

  const severityBreakdown = useMemo(() => {
    const total = Math.max(1, liveSignals.signals.length);
    const critical = liveSignals.signals.filter((s) => s.severity === 'critical').length;
    const elevated = liveSignals.signals.filter((s) => s.severity === 'elevated').length;
    const info = liveSignals.signals.filter((s) => s.severity === 'info').length;
    return {
      critical,
      elevated,
      info,
      criticalPct: (critical / total) * 100,
      elevatedPct: (elevated / total) * 100,
      infoPct: (info / total) * 100,
    };
  }, [liveSignals.signals]);

  const filteredSignals = useMemo(() => {
    const q = liveQuery.trim().toLowerCase();
    return liveSignals.signals.filter((sig) => {
      if (triagePreset === 'pinned' && !pinnedSignalIds.includes(sig.id)) return false;
      if (triagePreset !== 'all' && triagePreset !== 'pinned') {
        const meta = FEED_META_BY_ID[sig.sourceId];
        if (!meta || meta.domainGroup !== triagePreset) return false;
      }
      if (severityFilter !== 'ALL' && sig.severity !== severityFilter) return false;
      if (feedFilter !== 'ALL' && sig.sourceId !== feedFilter) return false;
      if (
        watchlistIdFilter !== 'ALL' &&
        !sig.watchlistMatches.includes(watchlistIdFilter)
      ) {
        return false;
      }
      if (q) {
        const hay = `${sig.title} ${sig.summary} ${sig.sourceName} ${sig.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    liveSignals.signals,
    triagePreset,
    pinnedSignalIds,
    severityFilter,
    feedFilter,
    watchlistIdFilter,
    liveQuery,
  ]);

  const filteredSources = useMemo(() => {
    return sections.primarySources.filter((src) => {
      if (vaultDomain !== 'ALL' && src.domainTag !== vaultDomain) return false;
      if (vaultQuery.trim()) {
        const q = vaultQuery.toLowerCase();
        return `${src.title} ${src.category} ${src.domainTag} ${src.url}`
          .toLowerCase()
          .includes(q);
      }
      return true;
    });
  }, [sections.primarySources, vaultDomain, vaultQuery]);

  function copyMarkdownRow(sigId: string, rowText: string) {
    navigator.clipboard.writeText(rowText);
    setCopiedId(sigId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function copyAllFilteredRows() {
    if (filteredSignals.length === 0) return;
    const combined = filteredSignals.map((s) => s.markdownRow).join('\n');
    navigator.clipboard.writeText(combined);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2200);
  }

  return (
    <div className="space-y-7">
      {/* Header + 3-Tab Switcher */}
      <section className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono-tactical text-[11px] text-[#38BDF8]">
              <Eye className="w-3.5 h-3.5" />
              <span>SECTIONS 8.3 &amp; 10 + 15-FEED FEDERAL &amp; HYPERSCALER TELEMETRY</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
              9-Point Operational Watchlist, Live Wire &amp; Source Vault
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono-tactical text-[11px]">
            <span className="px-2.5 py-1 rounded-sm bg-[#10B981]/12 border border-[#10B981]/35 text-[#10B981]">
              {feedHealth.liveCount}/{feedHealth.totalFeeds} Keyless Feeds ·{' '}
              {liveSignals.totalSignals} Signals
            </span>
            <button
              id="btn-header-scan-live"
              type="button"
              disabled={isScanningLive}
              onClick={() => {
                triggerLiveScan();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#38BDF8]/14 hover:bg-[#38BDF8]/24 border border-[#38BDF8]/45 text-[#38BDF8] cursor-pointer transition disabled:opacity-60"
              title="Query CORS-enabled U.S. government (.gov) and hyperscaler JSON feeds directly from your browser"
            >
              <RefreshCw className={`w-3 h-3 ${isScanningLive ? 'animate-spin' : ''}`} />
              <span>{isScanningLive ? 'Scanning Live…' : 'Scan Live Now'}</span>
            </button>
            {pinnedSignalIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  switchTab('live-wire');
                  applyTriagePreset('pinned');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] cursor-pointer hover:bg-[#F59E0B]/25 transition"
              >
                <Pin className="w-3 h-3" />
                <span>{pinnedSignalIds.length} Pinned</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.08]">
          <button
            id="tab-btn-watchlist"
            type="button"
            onClick={() => switchTab('watchlist')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono-tactical border transition cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>9-Point Watchlist ({watchlist.length})</span>
          </button>

          <button
            id="tab-btn-live-wire"
            type="button"
            onClick={() => switchTab('live-wire')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono-tactical border transition cursor-pointer ${
              activeTab === 'live-wire'
                ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
                : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Wire OSINT ({liveSignals.totalSignals})</span>
          </button>

          <button
            id="tab-btn-vault"
            type="button"
            onClick={() => switchTab('vault')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono-tactical border transition cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F59E0B]'
                : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Source Vault ({sections.primarySources.length})</span>
          </button>
        </div>
      </section>

      {/* TAB 1: 9-Point Watchlist Board */}
      {activeTab === 'watchlist' && (
        <section aria-label="9-Point Cross-Sector Watchlist" className="space-y-5">
          {/* Editorial Plate 06 */}
          <TacticalFigure
            src="/images/watchlist-telemetry-mesh.jpg"
            alt="Matte-black optical packet-broker and OSINT telemetry correlation blade routing armored fiber-optic feeds into cyan, amber, and crimson priority status lanes"
            plateId="PLATE 06"
            title="Keyless Federal & Backbone Telemetry Mesh: Deterministic Watchlist Correlation"
            domainBadge="SECTION 8.3 · AUTOMATED SIGNAL TRIAGE"
            priority
            metrics={[
              {
                label: 'Active Feeds',
                value: `${feedHealth.liveCount}/${feedHealth.totalFeeds} Keyless Live`,
                tone: 'emerald',
              },
              {
                label: 'Critical Queue',
                value: `${severityBreakdown.critical} Critical Signals`,
                tone: 'crimson',
              },
              {
                label: 'Nov. 18 KEV Wave',
                value: 'LiteLLM · Axis · REDCap · Synology',
                tone: 'amber',
              },
              {
                label: 'Pin & Export',
                value: `${pinnedSignalIds.length} Pinned for Brief`,
                tone: 'cyan',
              },
            ]}
            caption="Even when strategic attribution is withheld, CISA KEV additions, FAA NAS delay blocks, Federal Register rules, and cloud status feeds publish verifiable technical indicators—mapped deterministically onto Watchlist #1–#9 without auto-mutating canonical incident data."
          />

          {/* Dynamic Active Detections Spotlight Strip */}
          <div className="glass-panel tac-frame rounded-lg p-4 sm:p-5 space-y-3 border border-[#EF4444]/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                <span className="font-mono-tactical text-xs font-semibold uppercase tracking-wider text-white">
                  Active CISA KEV &amp; Threat Advisories (Watchlist #2 &amp; #8)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  switchTab('live-wire');
                  applyTriagePreset('cyber');
                }}
                className="font-mono-tactical text-[11px] text-[#38BDF8] hover:underline cursor-pointer"
              >
                Inspect All Cyber &amp; NVD Signals →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              {topSpotlightSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="obsidian-surface rounded-md p-3.5 border-l-2 border-l-[#EF4444] space-y-1 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-mono-tactical text-[10px] text-[#EF4444] uppercase font-semibold">
                      {sig.sourceName} · {sig.publishedAtISO.slice(0, 10)}
                    </span>
                    <p className="font-semibold text-white line-clamp-2 leading-snug">
                      {sig.title}
                    </p>
                    <p className="text-gray-400 leading-relaxed line-clamp-2">{sig.summary}</p>
                  </div>
                  <a
                    href={sig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono-tactical text-[10px] text-[#38BDF8] hover:underline pt-1"
                  >
                    <span>Official Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}

              <div className="obsidian-surface rounded-md p-3.5 border-l-2 border-l-[#F59E0B] space-y-1">
                <span className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase font-semibold">
                  NOV. 18 KEV WAVE &amp; FBI ARTEX
                </span>
                <p className="font-semibold text-white leading-snug">
                  4 New KEVs + Autonomous LLM Intrusion Chain
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Nov. 18 CISA KEV additions: <strong>BerriAI LiteLLM</strong> (CVE-2026-40217),{' '}
                  <strong>Apache Axis</strong>, <strong>REDCap</strong> &amp; <strong>Synology DSM</strong>,
                  alongside FBI&rsquo;s <strong>ARTEX</strong> (&lt;3h LLM breach) warning.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {watchlist.map((item) => {
              const hitCount = liveCountsByWatchlist[item.id] ?? 0;
              const isHighlighted = highlightedWatchId === item.id;
              return (
                <article
                  key={item.id}
                  id={`watchlist-card-${item.id.replace('#', '')}`}
                  onClick={() => setHighlightedWatchId(item.id)}
                  className={`glass-card rounded-lg p-4 sm:p-5 flex flex-col justify-between space-y-3.5 scroll-mt-nav transition ${
                    isHighlighted ? 'ring-1 ring-[#38BDF8]/55 border-[#38BDF8]/40' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tactical text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#070A10] border border-white/12 text-[#38BDF8]">
                        WATCHLIST {item.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTriagePreset('all');
                          setWatchlistIdFilter(item.id);
                          switchTab('live-wire');
                        }}
                        className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] cursor-pointer transition"
                      >
                        {hitCount} OSINT {hitCount === 1 ? 'Match' : 'Matches'} →
                      </button>
                    </div>

                    <h2 className="text-sm sm:text-base font-semibold text-white leading-snug">
                      {item.signal}
                    </h2>

                    <div className="obsidian-surface rounded-md p-3 text-xs space-y-1">
                      <p className="font-mono-tactical text-[10px] uppercase text-gray-500">
                        Public Mechanism
                      </p>
                      <p className="text-gray-200 leading-relaxed">{item.mechanism}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2.5 border-t border-white/[0.08] text-xs">
                    <p className="font-mono-tactical text-[10px] uppercase text-[#F59E0B]">
                      Forensic Meaning
                    </p>
                    <p className="text-gray-300 leading-relaxed">{item.forensicMeaning}</p>
                    <CitationChipList
                      sources={item.sources}
                      contextLabel={`Watchlist ${item.id}: ${item.signal}`}
                    />
                    <div className="pt-1.5 flex items-center justify-end">
                      <Link
                        href={`/?trace=watch-${item.id.replace('#', '')}`}
                        className="inline-flex items-center gap-1 font-mono-tactical text-[11px] text-[#38BDF8] hover:underline"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>Trace in Crosswalk</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: Live Wire (Keyless Federal & Backbone OSINT) */}
      {activeTab === 'live-wire' && (
        <section aria-label="Live Wire Keyless OSINT" className="space-y-5">
          {/* 15-Feed Health Telemetry Grid + On-Demand Live Scan + Severity Spectrum */}
          <div className="glass-card tac-frame rounded-lg p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-sm bg-[#10B981]/12 border border-[#10B981]/35 font-mono-tactical text-[10px] text-[#10B981]">
                  LIVE WIRE · 15 KEYLESS GOV &amp; CLOUD FEEDS
                </span>
                <span className="font-mono-tactical text-[11px] text-gray-400">
                  Swept {new Date(feedHealth.checkedAtISO).toISOString().replace('T', ' ').slice(0, 19)} UTC · 3h CI Cadence
                </span>
                {lastLiveScanSummary && (
                  <span className="px-2 py-0.5 rounded-sm bg-[#38BDF8]/12 border border-[#38BDF8]/35 font-mono-tactical text-[10px] text-[#38BDF8]">
                    Browser Sweep: {lastLiveScanSummary.refreshedFeedCount}/{lastLiveScanSummary.attemptedFeedCount} CORS Feeds ·{' '}
                    {lastLiveScanSummary.newSignalCount > 0
                      ? `+${lastLiveScanSummary.newSignalCount} New`
                      : 'Up to Date'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-livewire-scan-now"
                  type="button"
                  disabled={isScanningLive}
                  onClick={() => {
                    triggerLiveScan();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#38BDF8]/14 hover:bg-[#38BDF8]/24 border border-[#38BDF8]/45 font-mono-tactical text-[10px] text-[#38BDF8] cursor-pointer transition disabled:opacity-60"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanningLive ? 'animate-spin' : ''}`} />
                  <span>{isScanningLive ? 'Sweeping .gov & Cloud JSON…' : 'Scan Live Now'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {feedHealth.feeds.map((f) => {
                const selected = feedFilter === f.id;
                const historySeries = feedHistory?.series?.[f.id];
                const regMeta = FEED_META_BY_ID[f.id];
                const badgeClass =
                  regMeta?.sectorBadge === 'U.S. Gov'
                    ? 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/25'
                    : regMeta?.sectorBadge === 'Hyperscaler'
                    ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25'
                    : 'text-gray-300 bg-white/[0.05] border-white/15';
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setTriagePreset('all');
                      setFeedFilter(selected ? 'ALL' : f.id);
                    }}
                    className={`text-left rounded-md p-3 border transition cursor-pointer ${
                      selected
                        ? 'surface-elevated border-[#38BDF8]/60'
                        : 'obsidian-surface hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-medium text-white truncate">
                        {regMeta?.shortLabel ?? f.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {regMeta && (
                          <span
                            className={`font-mono-tactical text-[9px] px-1 py-0.2 rounded-xs border ${badgeClass}`}
                          >
                            {regMeta.sectorBadge}
                          </span>
                        )}
                        {f.status === 'live' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <p className="font-mono-tactical text-[10px] text-gray-400 truncate">
                        HTTP {f.httpStatus ?? 'SYNC'} · {f.latencyMs}ms · {f.itemCount}
                      </p>
                      <FeedSparkline
                        points={historySeries}
                        metric="latencyMs"
                        width={56}
                        height={15}
                        strokeColor={f.status === 'live' ? '#10B981' : '#F59E0B'}
                      />
                    </div>
                    {f.id === 'faa-nas' && f.updateTimeText && (
                      <p className="font-mono-tactical text-[9px] text-gray-500 mt-1 truncate">
                        FAA NAS · {f.updateTimeText}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Signal Severity Distribution Bar */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tactical text-[10px]">
                <span className="text-gray-400 uppercase">
                  Normalized Signal Severity ({liveSignals.totalSignals} Items)
                </span>
                <div className="flex items-center gap-3.5">
                  <span className="text-[#EF4444]">● Critical: {severityBreakdown.critical}</span>
                  <span className="text-[#F59E0B]">● Elevated: {severityBreakdown.elevated}</span>
                  <span className="text-[#38BDF8]">● Info: {severityBreakdown.info}</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-xs bg-[#06080C] border border-white/10 overflow-hidden flex">
                {severityBreakdown.critical > 0 && (
                  <div
                    style={{ width: `${severityBreakdown.criticalPct}%` }}
                    className="h-full bg-[#EF4444]"
                  />
                )}
                {severityBreakdown.elevated > 0 && (
                  <div
                    style={{ width: `${severityBreakdown.elevatedPct}%` }}
                    className="h-full bg-[#F59E0B]"
                  />
                )}
                {severityBreakdown.info > 0 && (
                  <div
                    style={{ width: `${severityBreakdown.infoPct}%` }}
                    className="h-full bg-[#38BDF8]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 1-Tap Threat Triage Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {TRIAGE_PRESETS.map((p) => {
                const active = triagePreset === p.id;
                const countSuffix =
                  p.id === 'pinned' ? ` (${pinnedSignalIds.length})` : '';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyTriagePreset(p.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border cursor-pointer transition ${
                      active
                        ? p.id === 'pinned'
                          ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F59E0B]'
                          : 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                        : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {p.id === 'pinned' && <Pin className="w-3 h-3" />}
                    <span>
                      {p.label}
                      {countSuffix}
                    </span>
                  </button>
                );
              })}
            </div>

            {pinnedSignalIds.length > 0 && (
              <button
                type="button"
                onClick={clearPinnedSignals}
                className="inline-flex items-center gap-1 font-mono-tactical text-[11px] text-gray-400 hover:text-[#EF4444] transition cursor-pointer"
              >
                <PinOff className="w-3 h-3" />
                <span>Clear {pinnedSignalIds.length} Pinned</span>
              </button>
            )}
          </div>

          {/* Filter Bar + Keyword Search + Bulk Export */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'critical', 'elevated', 'info'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border cursor-pointer transition ${
                    severityFilter === sev
                      ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                      : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                  }`}
                >
                  {sev === 'ALL' ? 'All Severities' : sev.toUpperCase()}
                </button>
              ))}

              {watchlistIdFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setWatchlistIdFilter('ALL')}
                  className="px-2.5 py-1.5 rounded-md text-xs font-mono-tactical bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] cursor-pointer"
                >
                  Watchlist {watchlistIdFilter} ×
                </button>
              )}

              {feedFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFeedFilter('ALL')}
                  className="px-2.5 py-1.5 rounded-md text-xs font-mono-tactical bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] cursor-pointer"
                >
                  Feed: {feedFilter} ×
                </button>
              )}

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={liveQuery}
                  onChange={(e) => setLiveQuery(e.target.value)}
                  placeholder="Filter CVE, airport, vendor…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#070A10] border border-white/12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-tactical text-[11px] text-gray-400">
                Showing {filteredSignals.length} / {liveSignals.totalSignals}
              </span>
              {filteredSignals.length > 0 && (
                <button
                  type="button"
                  onClick={copyAllFilteredRows}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/35 text-xs font-mono-tactical text-[#38BDF8] transition cursor-pointer"
                >
                  {bulkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[#10B981]">Copied {filteredSignals.length} Rows</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Filtered Markdown</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Empty state when Pinned filter has no pinned signals */}
          {filteredSignals.length === 0 && (
            <div className="obsidian-surface rounded-md p-6 text-center space-y-2 border border-white/[0.08]">
              <p className="font-mono-tactical text-xs text-gray-300">
                {triagePreset === 'pinned'
                  ? 'No signals pinned yet — click Pin on any Live Wire signal to add it to your Executive Brief Export.'
                  : 'No signals match the active filter combination.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setTriagePreset('all');
                  setSeverityFilter('ALL');
                  setFeedFilter('ALL');
                  setWatchlistIdFilter('ALL');
                  setLiveQuery('');
                }}
                className="font-mono-tactical text-xs text-[#38BDF8] hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}

          {/* Signal List */}
          <div className="space-y-2.5">
            {filteredSignals.map((sig) => {
              const sevBadge =
                sig.severity === 'critical'
                  ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                  : sig.severity === 'elevated'
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
                  : 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]';
              const leftBorder =
                sig.severity === 'critical'
                  ? 'border-l-[#EF4444]'
                  : sig.severity === 'elevated'
                  ? 'border-l-[#F59E0B]'
                  : 'border-l-[#38BDF8]';
              const isCopied = copiedId === sig.id;
              const isPinned = pinnedSignalIds.includes(sig.id);

              return (
                <article
                  key={sig.id}
                  className={`glass-card rounded-lg border-l-2 ${
                    isPinned ? 'border-l-[#F59E0B] ring-1 ring-[#F59E0B]/30' : leftBorder
                  } p-4 sm:p-5 space-y-2.5`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`font-mono-tactical text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${sevBadge}`}
                        >
                          {sig.severity.toUpperCase()}
                        </span>
                        <span className="font-mono-tactical text-[11px] text-gray-300">
                          {sig.sourceName}
                        </span>
                        <span className="font-mono-tactical text-[10px] text-gray-500">
                          {sig.publishedAtISO.slice(0, 16).replace('T', ' ')} UTC
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
                        {sig.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => togglePinSignal(sig.id)}
                        title={
                          isPinned
                            ? 'Unpin from Executive Brief Export'
                            : 'Pin to Executive Brief Export'
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[11px] font-mono-tactical transition cursor-pointer ${
                          isPinned
                            ? 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]'
                            : 'bg-[#070A10] border-white/12 text-gray-300 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                        <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyMarkdownRow(sig.id, sig.markdownRow)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#070A10] hover:bg-white/[0.08] border border-white/12 text-[11px] font-mono-tactical text-gray-200 transition cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-[#10B981]" />
                            <span className="text-[#10B981]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#38BDF8]" />
                            <span>Doc Row</span>
                          </>
                        )}
                      </button>

                      <a
                        href={sig.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md bg-[#070A10] hover:bg-white/[0.08] border border-white/12 text-gray-300 hover:text-white transition"
                        title="Open official feed item"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <p className="text-xs sm:text-[13px] text-gray-300 leading-relaxed">
                    {sig.summary}
                  </p>

                  {sig.aiEnrichment && (
                    <div className="obsidian-surface rounded-md p-3 text-xs space-y-1 border border-[#38BDF8]/30">
                      <p className="font-mono-tactical text-[10px] text-[#38BDF8] uppercase">
                        Gemini Search-Grounded Correlation
                      </p>
                      <p className="text-gray-200">{sig.aiEnrichment.summary}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.07] text-[10px] font-mono-tactical">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {sig.watchlistMatches.map((w) => (
                        <span
                          key={w}
                          className="px-1.5 py-0.5 rounded-sm bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8]"
                        >
                          Watchlist {w}
                        </span>
                      ))}
                      {sig.riskMatrixMatches.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 rounded-sm bg-white/[0.04] border border-white/10 text-gray-300"
                        >
                          Risk {r}
                        </span>
                      ))}
                      {sig.countdownMatches.map((c) => (
                        <span
                          key={c}
                          className="px-1.5 py-0.5 rounded-sm bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B]"
                        >
                          Cliff {c}
                        </span>
                      ))}
                    </div>

                    {/* Plain-text attribution strictly enforced (no FAA/DOT seals or logos) */}
                    <span className="text-gray-500">{sig.attributionText}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: Primary Source Vault */}
      {activeTab === 'vault' && (
        <section aria-label="Primary Source Vault" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {DOMAIN_TAGS.map((tag) => {
                const count =
                  tag === 'ALL'
                    ? sections.primarySources.length
                    : sections.primarySources.filter((s) => s.domainTag === tag).length;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setVaultDomain(tag)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border cursor-pointer transition ${
                      vaultDomain === tag
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]'
                        : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {tag} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-68">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                id="vault-search-input"
                type="text"
                value={vaultQuery}
                onChange={(e) => setVaultQuery(e.target.value)}
                placeholder={`Search ${sections.primarySources.length} primary sources…`}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#070A10] border border-white/12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredSources.map((src) => {
              const tier = classifySourceTier(src.url, src.title);
              const tierClass =
                tier.tone === 'emerald'
                  ? 'bg-[#10B981]/12 border-[#10B981]/30 text-[#10B981]'
                  : tier.tone === 'cyan'
                  ? 'bg-[#38BDF8]/12 border-[#38BDF8]/30 text-[#38BDF8]'
                  : 'bg-[#F59E0B]/12 border-[#F59E0B]/30 text-[#F59E0B]';
              return (
                <div
                  key={src.id}
                  className="glass-card rounded-lg p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        title={tier.rationale}
                        className={`font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm border ${tierClass}`}
                      >
                        {tier.shortBadge}
                      </span>
                      <span className="font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm bg-white/[0.04] border border-white/10 text-gray-300">
                        {src.domainTag}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate">{src.category}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openCitation({
                          title: src.title,
                          url: src.url,
                          category: src.category,
                          domainTag: src.domainTag,
                        })
                      }
                      className="text-left text-xs sm:text-sm font-medium text-white hover:text-[#38BDF8] transition cursor-pointer"
                    >
                      {src.title}
                    </button>
                    <p className="font-mono-tactical text-[10px] text-gray-500 truncate">
                      {src.url}
                    </p>
                  </div>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-[#070A10] hover:bg-white/[0.08] border border-white/12 text-gray-300 hover:text-white shrink-0"
                    title="Open external source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
