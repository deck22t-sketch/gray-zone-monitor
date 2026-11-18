'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { FeedId, PrimarySourceEntry, SignalSeverity } from '@/types/schemas';
import { CitationChipList } from '@/components/shell/RichTextWithCitations';

type WatchlistTab = 'watchlist' | 'live-wire' | 'vault';

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
  const { bundle, openCitation } = usePortal();
  const { watchlist, liveSignals, feedHealth, sections } = bundle;

  const [activeTab, setActiveTab] = useState<WatchlistTab>('watchlist');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SignalSeverity>('ALL');
  const [feedFilter, setFeedFilter] = useState<'ALL' | FeedId>('ALL');
  const [watchlistIdFilter, setWatchlistIdFilter] = useState<string>('ALL');
  const [liveQuery, setLiveQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);

  const [vaultQuery, setVaultQuery] = useState('');
  const [vaultDomain, setVaultDomain] =
    useState<'ALL' | PrimarySourceEntry['domainTag']>('ALL');

  // Support ?tab=live-wire deep-linking on client without needing Suspense wrapper in static export
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'live-wire' || tab === 'vault' || tab === 'watchlist') {
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

  const liveCountsByWatchlist = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sig of liveSignals.signals) {
      for (const wId of sig.watchlistMatches) {
        map[wId] = (map[wId] ?? 0) + 1;
      }
    }
    return map;
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
  }, [liveSignals.signals, severityFilter, feedFilter, watchlistIdFilter, liveQuery]);

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
    <div className="space-y-8">
      {/* Header + 3-Tab Switcher */}
      <section className="glass-panel rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono-tactical text-xs text-[#38BDF8]">
              <Eye className="w-4 h-4" />
              <span>SECTIONS 8.3 &amp; 10 + LIVE ZERO-KEY FEDERAL/BACKBONE OSINT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              9-Point Operational Watchlist, Live Wire &amp; Primary Source Vault
            </h1>
          </div>

          <span className="font-mono-tactical text-xs px-3 py-1.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/35 text-[#10B981]">
            {feedHealth.liveCount}/{feedHealth.totalFeeds} Keyless Feeds Live ·{' '}
            {liveSignals.totalSignals} Signals
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          <button
            id="tab-btn-watchlist"
            type="button"
            onClick={() => switchTab('watchlist')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>9-Point CISA/FS-ISAC Watchlist ({watchlist.length})</span>
          </button>

          <button
            id="tab-btn-live-wire"
            type="button"
            onClick={() => switchTab('live-wire')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
              activeTab === 'live-wire'
                ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]'
                : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Wire (Keyless Federal &amp; Backbone OSINT) ({liveSignals.totalSignals})</span>
          </button>

          <button
            id="tab-btn-vault"
            type="button"
            onClick={() => switchTab('vault')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F59E0B]'
                : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Primary Source Vault ({sections.primarySources.length})</span>
          </button>
        </div>
      </section>

      {/* TAB 1: 9-Point Watchlist Board */}
      {activeTab === 'watchlist' && (
        <section aria-label="9-Point Cross-Sector Watchlist" className="space-y-5">
          {/* Active Nov. 17–18 Threat Spotlight Strip */}
          <div className="surface-elevated rounded-2xl p-5 space-y-3 border border-[#EF4444]/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                <span className="font-mono-tactical text-xs font-semibold uppercase tracking-wider text-white">
                  Active Nov. 17–18 Detections Across Watchlist #2 &amp; #8
                </span>
              </div>
              <span className="font-mono-tactical text-[11px] text-[#F59E0B]">
                Remediation Clocks Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-[13px]">
              <div className="obsidian-surface rounded-xl p-3.5 space-y-1">
                <span className="font-mono-tactical text-[10px] text-[#EF4444] uppercase font-semibold">
                  WATCHLIST #2 · CISA KEV (DUE DEC. 1)
                </span>
                <p className="font-semibold text-white">
                  Perforce Puppet Enterprise (CVE-2026-115731)
                </p>
                <p className="text-gray-300 leading-relaxed text-xs">
                  CVSS 9.4 deserialization RCE actively exploited in the wild; compromises fleet
                  configuration management templates.
                </p>
              </div>

              <div className="obsidian-surface rounded-xl p-3.5 space-y-1">
                <span className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase font-semibold">
                  WATCHLIST #2 · CISA / CANADA ALERT
                </span>
                <p className="font-semibold text-white">
                  &ldquo;Java4Shell&rdquo; OpenJDK RCE (CVE-2026-114938)
                </p>
                <p className="text-gray-300 leading-relaxed text-xs">
                  Unauthenticated Base64 RCE in OpenJDK/HotSpot (Java 17/21/25/27) impacting Jira,
                  Confluence, Jenkins &amp; Keycloak.
                </p>
              </div>

              <div className="obsidian-surface rounded-xl p-3.5 space-y-1">
                <span className="font-mono-tactical text-[10px] text-[#38BDF8] uppercase font-semibold">
                  WATCHLIST #8 · FBI FLASH ADVISORY
                </span>
                <p className="font-semibold text-white">
                  LLM-Driven &ldquo;ARTEX&rdquo; Intrusion Framework
                </p>
                <p className="text-gray-300 leading-relaxed text-xs">
                  Autonomous LLM attack chain breaching U.S. energy, manufacturing &amp; telecom
                  networks in <strong>under 3 hours</strong>.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-400">
            Even if strategic White House attribution is withheld to prevent market contagion, CISA
            and sector regulators must issue defensive directives if forensic teardowns uncover
            supply-chain or staging tampering. Click any indicator&rsquo;s live signal badge to
            filter the Live Wire.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((item) => {
              const hitCount = liveCountsByWatchlist[item.id] ?? 0;
              return (
                <article
                  key={item.id}
                  className="glass-card rounded-xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tactical text-xs font-semibold px-2.5 py-0.5 rounded bg-[#0E1524] border border-white/15 text-[#38BDF8]">
                        WATCHLIST {item.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setWatchlistIdFilter(item.id);
                          switchTab('live-wire');
                        }}
                        className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] cursor-pointer transition"
                      >
                        {hitCount} Live OSINT {hitCount === 1 ? 'Match' : 'Matches'} →
                      </button>
                    </div>

                    <h2 className="text-base font-semibold text-white leading-snug">
                      {item.signal}
                    </h2>

                    <div className="obsidian-surface rounded-lg p-3.5 text-[13px] space-y-1">
                      <p className="font-mono-tactical text-[10px] uppercase text-gray-400">
                        Public Regulatory / Technical Mechanism
                      </p>
                      <p className="text-gray-200 leading-relaxed">{item.mechanism}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2.5 border-t border-white/[0.08] text-[13px]">
                    <p className="font-mono-tactical text-[10px] uppercase text-[#F59E0B]">
                      Underlying Forensic Meaning
                    </p>
                    <p className="text-gray-200 leading-relaxed">{item.forensicMeaning}</p>
                    <CitationChipList
                      sources={item.sources}
                      contextLabel={`Watchlist ${item.id}: ${item.signal}`}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: Live Wire (Keyless Federal & Backbone OSINT) */}
      {activeTab === 'live-wire' && (
        <section aria-label="Live Wire Keyless OSINT" className="space-y-6">
          {/* 8-Feed Health Telemetry Grid + Severity Spectrum */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#10B981]/15 border border-[#10B981]/35 font-mono-tactical text-[11px] text-[#10B981]">
                  LIVE WIRE · KEYLESS FEDERAL &amp; BACKBONE OSINT
                </span>
                <span className="font-mono-tactical text-xs text-gray-400">
                  Swept {new Date(feedHealth.checkedAtISO).toISOString().replace('T', ' ').slice(0, 19)}Z
                </span>
              </div>
              <span className="font-mono-tactical text-[11px] text-gray-400">
                Canonical incidents.json protected (read-only) · Dormant Gemini adapter ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {feedHealth.feeds.map((f) => {
                const selected = feedFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFeedFilter(selected ? 'ALL' : f.id)}
                    className={`text-left rounded-xl p-3 border transition cursor-pointer ${
                      selected
                        ? 'surface-elevated border-[#38BDF8]/60'
                        : 'obsidian-surface hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-white truncate">{f.name}</span>
                      {f.status === 'live' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                      )}
                    </div>
                    <p className="font-mono-tactical text-[11px] text-gray-400 mt-1">
                      HTTP {f.httpStatus ?? 'ERR'} · {f.latencyMs}ms · {f.itemCount} items
                    </p>
                    {f.id === 'faa-nas' && f.updateTimeText && (
                      <p className="font-mono-tactical text-[10px] text-gray-400 mt-1 truncate">
                        Source: FAA NAS Status (nasstatus.faa.gov) · {f.updateTimeText}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Signal Severity Distribution Bar */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tactical text-[11px]">
                <span className="text-gray-400 uppercase">
                  Normalized Signal Severity Distribution ({liveSignals.totalSignals} Items)
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[#EF4444]">● Critical: {severityBreakdown.critical}</span>
                  <span className="text-[#F59E0B]">● Elevated: {severityBreakdown.elevated}</span>
                  <span className="text-[#38BDF8]">● Info: {severityBreakdown.info}</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-[#0A0E17] border border-white/10 overflow-hidden flex">
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

          {/* Filter Bar + Keyword Search + Bulk Export */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'critical', 'elevated', 'info'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical border cursor-pointer transition ${
                    severityFilter === sev
                      ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                      : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {sev === 'ALL' ? 'All Severities' : sev.toUpperCase()}
                </button>
              ))}

              {watchlistIdFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setWatchlistIdFilter('ALL')}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono-tactical bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] cursor-pointer"
                >
                  Watchlist {watchlistIdFilter} ×
                </button>
              )}

              {feedFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFeedFilter('ALL')}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono-tactical bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] cursor-pointer"
                >
                  Feed: {feedFilter} ×
                </button>
              )}

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={liveQuery}
                  onChange={(e) => setLiveQuery(e.target.value)}
                  placeholder="Filter CVE, airport, vendor…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0E1524] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono-tactical text-xs text-gray-400">
                Showing {filteredSignals.length} of {liveSignals.totalSignals} signals
              </span>
              {filteredSignals.length > 0 && (
                <button
                  type="button"
                  onClick={copyAllFilteredRows}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/35 text-xs font-mono-tactical text-[#38BDF8] transition cursor-pointer"
                >
                  {bulkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[#10B981]">
                        Copied {filteredSignals.length} Rows!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Filtered Rows (Markdown)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Signal List */}
          <div className="space-y-3">
            {filteredSignals.map((sig) => {
              const sevBadge =
                sig.severity === 'critical'
                  ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                  : sig.severity === 'elevated'
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
                  : 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]';
              const isCopied = copiedId === sig.id;

              return (
                <article key={sig.id} className="glass-card rounded-xl p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono-tactical text-[10px] font-semibold px-2 py-0.5 rounded border ${sevBadge}`}
                        >
                          {sig.severity.toUpperCase()}
                        </span>
                        <span className="font-mono-tactical text-xs text-gray-300">
                          {sig.sourceName}
                        </span>
                        <span className="font-mono-tactical text-[11px] text-gray-500">
                          {sig.publishedAtISO.slice(0, 16).replace('T', ' ')} UTC
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        {sig.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyMarkdownRow(sig.id, sig.markdownRow)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-mono-tactical text-gray-200 transition cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-[#10B981]">Copied Row!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>Copy Markdown Row for Google Doc</span>
                          </>
                        )}
                      </button>

                      <a
                        href={sig.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-gray-300 hover:text-white transition"
                        title="Open official feed item"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <p className="text-[13px] text-gray-200 leading-relaxed">{sig.summary}</p>

                  {sig.aiEnrichment && (
                    <div className="obsidian-surface rounded-lg p-3 text-xs space-y-1 border border-[#38BDF8]/30">
                      <p className="font-mono-tactical text-[10px] text-[#38BDF8] uppercase">
                        Gemini Search-Grounded Correlation
                      </p>
                      <p className="text-gray-200">{sig.aiEnrichment.summary}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.07] text-[11px] font-mono-tactical">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {sig.watchlistMatches.map((w) => (
                        <span
                          key={w}
                          className="px-2 py-0.5 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8]"
                        >
                          Watchlist {w}
                        </span>
                      ))}
                      {sig.riskMatrixMatches.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-gray-300"
                        >
                          Risk {r}
                        </span>
                      ))}
                      {sig.countdownMatches.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B]"
                        >
                          Cliff {c}
                        </span>
                      ))}
                    </div>

                    {/* Plain-text attribution strictly enforced (no FAA/DOT seals or logos) */}
                    <span className="text-gray-400">{sig.attributionText}</span>
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
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-tactical border cursor-pointer transition ${
                      vaultDomain === tag
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]'
                        : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    {tag} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                id="vault-search-input"
                type="text"
                value={vaultQuery}
                onChange={(e) => setVaultQuery(e.target.value)}
                placeholder={`Search ${sections.primarySources.length} primary sources…`}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0E1524] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSources.map((src) => (
              <div
                key={src.id}
                className="glass-card rounded-xl p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8]">
                      {src.domainTag}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate">{src.category}</span>
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
                    className="text-left text-sm font-medium text-white hover:text-[#38BDF8] transition cursor-pointer"
                  >
                    {src.title}
                  </button>
                  <p className="font-mono-tactical text-[11px] text-gray-500 truncate">
                    {src.url}
                  </p>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-gray-300 hover:text-white shrink-0"
                  title="Open external source"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
