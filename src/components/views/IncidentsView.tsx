'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  Calculator,
  RadioTower,
  Search,
  Satellite,
  Zap,
  Anchor,
  KeyRound,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { IncidentClassification } from '@/types/schemas';
import { computePoissonClusterProbability, simulateRetryStormCurve } from '@/lib/poisson';
import { CitationChipList } from '@/components/shell/RichTextWithCitations';
import { NarrativeAccordion } from '@/components/shell/NarrativeAccordion';

const CLASSIFICATION_META: Record<
  IncidentClassification,
  { label: string; shortLabel: string; badgeStyle: string; dotColor: string }
> = {
  malicious_attack: {
    label: 'Confirmed Malicious Supply-Chain Attack',
    shortLabel: 'MALICIOUS ATTACK',
    badgeStyle: 'bg-[#EF4444]/15 border-[#EF4444]/45 text-[#EF4444]',
    dotColor: '#EF4444',
  },
  hybrid_transition_bug: {
    label: 'Hybrid Transition / Retry-Storm Bug',
    shortLabel: 'HYBRID / RETRY BUG',
    badgeStyle: 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]',
    dotColor: '#F59E0B',
  },
  client_cascade: {
    label: 'Cross-Client Auth Cascade',
    shortLabel: 'AUTH CASCADE',
    badgeStyle: 'bg-[#38BDF8]/15 border-[#38BDF8]/45 text-[#38BDF8]',
    dotColor: '#38BDF8',
  },
  unspecified: {
    label: 'Unspecified / Root Cause Pending',
    shortLabel: 'ROOT CAUSE PENDING',
    badgeStyle: 'bg-white/[0.07] border-white/20 text-gray-300',
    dotColor: '#9CA3AF',
  },
};

const SUB_IP_STACK = [
  {
    id: 'gnss',
    layer: 'LAYER 01 · RF / TIMING',
    title: 'Silent GNSS Position & PTP Clock Spoofing (+193%)',
    metric: '+193% Surge (2023–2025)',
    icon: Satellite,
    summary:
      'Expanded into North Pacific (NOPAC) U.S.–Asia airways R220 and R580—corrupting >100 commercial flights with false terrain warnings and 12-hour UTC aircraft clock shifts (exacerbated after SpaceX disabled unauthenticated local Starlink positioning in May 2026). Simultaneously threatens rooftop IEEE 1588 PTP clocks inside SEC CAT / MiFID II RTS 25 financial data centers without triggering loss-of-signal alarms.',
    mitigation: 'Deploy terrestrial fiber / atomic Rb-Cs PTP holdover and multi-constellation spoofing angle-of-arrival checks.',
  },
  {
    id: 'transformers',
    layer: 'LAYER 02 · THERMAL & POWER GRID',
    title: 'Data-Center Thermal Limits & 128–144 Wk Transformer Bottlenecks',
    metric: '128–144 Wk Lead Times',
    icon: Zap,
    summary:
      'Nov. 2025 thermal cooling breakdown at CyrusOne’s N+2 data center halted CME Group global futures trading for ~10–11 hours. U.S. data centers face a projected 20% (~13 GW) power shortfall by 2028 alongside 128-week substation transformer and 144-week generator step-up (GSU) manufacturing lead times.',
    mitigation: 'Pre-stage pooled domestic GSU/substation transformer spares and enforce cross-facility active-active matching engines.',
  },
  {
    id: 'slte',
    layer: 'LAYER 03 · SUBMARINE OPTICAL',
    title: 'Subsea Cable Landing Station & SLTE Security Mandate',
    metric: 'Jan. 8, 2027 FCC Deadline',
    icon: Anchor,
    summary:
      'On Nov. 16, 2026, the FCC issued correcting final rule 91 FR 73480 (DA 26-1229) tightening Submarine Line Terminal Equipment (SLTE) oversight and requiring Foreign Adversary Annual Reports by January 8, 2027 amid heightened Baltic and Indo-Pacific seabed sabotage risk.',
    mitigation: 'Inventory all wet/dry plant SLTE firmware vendors, remote management OOB links, and foreign adversary touchpoints before Jan. 8.',
  },
  {
    id: 'tls',
    layer: 'LAYER 04 · CRYPTOGRAPHIC PKI',
    title: 'CA/Browser Forum 100-Day Public TLS Certificate Cliff',
    metric: 'Mar. 15, 2027 → 100 Days',
    icon: KeyRound,
    summary:
      'Ballot SC-081v3 cuts max public TLS certificate validity from 200 days (effective Mar. 15, 2026) to 100 days on March 15, 2027—and down to 47 days in 2029. Manual certificate renewal workflows across legacy load balancers and OT gateways face deterministic expiration outages.',
    mitigation: 'Mandate automated ACME short-lived certificate rotation across all external gateways, APIs, and embedded appliances.',
  },
] as const;

export function IncidentsView() {
  const { bundle } = usePortal();
  const { incidents, sections } = bundle;

  const [classFilter, setClassFilter] = useState<'ALL' | IncidentClassification>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Poisson Calculator State (defaults to 1.4 events/wk -> 75.3% per Section 8.2)
  const [weeklyRate, setWeeklyRate] = useState<number>(1.4);
  const [windowDays, setWindowDays] = useState<number>(5);
  const [minEvents, setMinEvents] = useState<number>(4);
  const [endpointMillions, setEndpointMillions] = useState<number>(2.5);

  const poisson = useMemo(
    () =>
      computePoissonClusterProbability({
        weeklyRate,
        windowDays,
        minEventsInWindow: minEvents,
      }),
    [weeklyRate, windowDays, minEvents]
  );

  const retryCurve = useMemo(
    () => simulateRetryStormCurve(endpointMillions),
    [endpointMillions]
  );

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (classFilter !== 'ALL' && inc.classification !== classFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return `${inc.eventId} ${inc.entity} ${inc.sector} ${inc.impact} ${inc.vector} ${inc.status}`
          .toLowerCase()
          .includes(q);
      }
      return true;
    });
  }, [incidents, classFilter, searchQuery]);

  const forensicSections = sections.narrativeSections.filter(
    (s) => s.number === 6 || s.number === 8
  );

  return (
    <div className="space-y-9">
      {/* Header */}
      <section className="glass-panel rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2 font-mono-tactical text-xs text-[#F59E0B]">
          <Activity className="w-4 h-4" />
          <span>SECTIONS 6 &amp; 8 · NOV 12–17, 2026 DISRUPTION WAVE &amp; FORENSICS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Master Tracked Incident Explorer, Poisson Base-Rate Math &amp; Sub-IP Blind Spots
        </h1>
        <p className="text-sm text-gray-300 max-w-4xl leading-relaxed">
          Forensic separation of the ten-event November 12–17, 2026 disruption cluster—isolating
          confirmed supply-chain malware (<em>OPTIMJACK</em>) from hybrid TDM/IP routing floods,
          unpoliced &ldquo;thundering herd&rdquo; retry storms, and cross-client iOS authentication
          cascades.
        </p>
      </section>

      {/* Classification Filter Strip + Search */}
      <section aria-labelledby="incident-ledger-heading" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2
            id="incident-ledger-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Section 8.4 · Master Tracked Incident Ledger (Events #1–#{incidents.length})
          </h2>

          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            <input
              id="incidents-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entity, vector, CVE, router…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#111827] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setClassFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
              classFilter === 'ALL'
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All Tracked Events ({incidents.length})
          </button>

          {(
            [
              'malicious_attack',
              'hybrid_transition_bug',
              'client_cascade',
              'unspecified',
            ] as const
          ).map((cls) => {
            const meta = CLASSIFICATION_META[cls];
            const count = incidents.filter((i) => i.classification === cls).length;
            const active = classFilter === cls;
            return (
              <button
                key={cls}
                id={`filter-cls-${cls}`}
                type="button"
                onClick={() => setClassFilter(cls)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
                  active
                    ? meta.badgeStyle
                    : 'bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.07]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.dotColor }}
                />
                <span>
                  {meta.label} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Chronological Event Cards */}
        <div className="space-y-3">
          {filteredIncidents.map((inc) => {
            const meta = CLASSIFICATION_META[inc.classification];
            return (
              <article
                key={inc.eventId}
                className="glass-card rounded-xl p-5 space-y-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-tactical text-xs font-semibold px-2 py-0.5 rounded bg-[#111827] border border-white/15 text-white">
                        EVENT {inc.eventId}
                      </span>
                      <span className="font-mono-tactical text-xs text-gray-400">
                        {inc.window}
                      </span>
                      <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-white/[0.05] text-gray-300">
                        {inc.sector}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      {inc.entity}
                    </h3>
                  </div>

                  <span
                    className={`font-mono-tactical text-[11px] font-medium px-2.5 py-1 rounded border ${meta.badgeStyle}`}
                  >
                    {meta.shortLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                  <div className="obsidian-surface rounded-lg p-3.5 space-y-1">
                    <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                      Operational Impact
                    </p>
                    <p className="text-gray-200 leading-relaxed">{inc.impact}</p>
                  </div>
                  <div className="obsidian-surface rounded-lg p-3.5 space-y-1">
                    <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                      Stated Cause / Forensic Vector
                    </p>
                    <p className="text-gray-200 leading-relaxed">{inc.vector}</p>
                  </div>
                  <div className="obsidian-surface rounded-lg p-3.5 space-y-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-[#10B981]">
                        Tracking &amp; Correlation Status
                      </p>
                      <p className="text-gray-200 leading-relaxed">{inc.status}</p>
                    </div>
                    <CitationChipList
                      sources={inc.sources}
                      contextLabel={`Tracked Incident ${inc.eventId} — ${inc.entity}`}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Interactive Poisson Base-Rate Cluster Calculator + Retry-Storm Curve */}
      <section
        aria-labelledby="poisson-calc-heading"
        className="glass-panel rounded-2xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#38BDF8]" />
            <div>
              <h2
                id="poisson-calc-heading"
                className="text-sm font-mono-tactical uppercase tracking-wider text-white"
              >
                Section 8.2 · Interactive Poisson Null-Hypothesis Cluster Calculator &amp;
                Retry-Storm Physics
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Guarding against clustering apophenia across ~50 global tier-one critical
                infrastructure backbones.
              </p>
            </div>
          </div>

          {/* Section 8.2 Canonical Presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '1.0/wk (36.1% / yr)', rate: 1.0 },
              { label: '1.4/wk (75.3% / yr)', rate: 1.4 },
              { label: '2.0/wk (98.6% / yr)', rate: 2.0 },
            ].map((preset) => (
              <button
                key={preset.rate}
                type="button"
                onClick={() => {
                  setWeeklyRate(preset.rate);
                  setWindowDays(5);
                  setMinEvents(4);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono-tactical border cursor-pointer transition ${
                  Math.abs(weeklyRate - preset.rate) < 0.01 &&
                  windowDays === 5 &&
                  minEvents === 4
                    ? 'bg-[#38BDF8]/20 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls + Output */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-mono-tactical mb-1">
                  <label htmlFor="slider-weekly-rate" className="text-gray-300">
                    Baseline Global Tier-1 Failure Rate
                  </label>
                  <span className="text-[#38BDF8]">
                    {weeklyRate.toFixed(1)} events/wk ({Math.round(poisson.annualRate)}/yr)
                  </span>
                </div>
                <input
                  id="slider-weekly-rate"
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={weeklyRate}
                  onChange={(e) => setWeeklyRate(Number(e.target.value))}
                  className="w-full accent-[#38BDF8] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono-tactical mb-1">
                  <label htmlFor="slider-window-days" className="text-gray-300">
                    Observation Window Length
                  </label>
                  <span className="text-[#38BDF8]">
                    {windowDays} days ({windowDays * 24} hours ·{' '}
                    {poisson.windowsPerYear.toFixed(1)} windows/yr)
                  </span>
                </div>
                <input
                  id="slider-window-days"
                  type="range"
                  min={3}
                  max={10}
                  step={1}
                  value={windowDays}
                  onChange={(e) => setWindowDays(Number(e.target.value))}
                  className="w-full accent-[#38BDF8] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono-tactical mb-1">
                  <label htmlFor="slider-min-events" className="text-gray-300">
                    Minimum Coincident Failures in Window (k)
                  </label>
                  <span className="text-[#38BDF8]">≥ {minEvents} independent events</span>
                </div>
                <input
                  id="slider-min-events"
                  type="range"
                  min={2}
                  max={7}
                  step={1}
                  value={minEvents}
                  onChange={(e) => setMinEvents(Number(e.target.value))}
                  className="w-full accent-[#38BDF8] cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="obsidian-surface rounded-xl p-3.5">
                <p className="font-mono-tactical text-[10px] text-gray-400 uppercase">
                  Window Mean (λ)
                </p>
                <p className="font-mono-tactical text-xl font-semibold text-white mt-1">
                  {poisson.lambdaPerWindow.toFixed(2)}
                </p>
                <p className="text-[11px] text-gray-400">expected / {poisson.windowHours}h</p>
              </div>
              <div className="obsidian-surface rounded-xl p-3.5">
                <p className="font-mono-tactical text-[10px] text-gray-400 uppercase">
                  Single {windowDays}d Window
                </p>
                <p className="font-mono-tactical text-xl font-semibold text-[#38BDF8] mt-1">
                  {(poisson.singleWindowProb * 100).toFixed(2)}%
                </p>
                <p className="text-[11px] text-gray-400">P(X ≥ {minEvents})</p>
              </div>
              <div className="obsidian-surface rounded-xl p-3.5 border border-[#F59E0B]/40">
                <p className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase">
                  Annual Chance
                </p>
                <p className="font-mono-tactical text-xl font-semibold text-[#F59E0B] mt-1">
                  {(poisson.annualAtLeastOneProb * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-gray-300">≥1 cluster / year</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-200">Forensic Interpretation:</strong> At{' '}
              {weeklyRate.toFixed(1)} baseline failures/week, there is a{' '}
              <span className="font-mono-tactical text-white">
                {(poisson.annualAtLeastOneProb * 100).toFixed(1)}%
              </span>{' '}
              probability of observing at least one {poisson.windowHours}-hour window with ≥
              {minEvents} independent outages purely by chance—requiring hard telemetry (Watchlist
              #1–#9) before inferring coordinated sabotage.
            </p>
          </div>

          {/* Retry-Storm ("Thundering Herd") Physics Visualizer */}
          <div className="lg:col-span-6 obsidian-surface rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono-tactical text-xs text-[#F59E0B] uppercase">
                  Unpoliced &ldquo;Thundering Herd&rdquo; vs. Policed Recovery Load
                </p>
                <p className="text-[11px] text-gray-400">
                  Observed in Microsoft 365 (~10h stall), FAA TDM floods (1,000 req/4–5s), Chase
                  re-crashes, &amp; NSANet staggered shift orders.
                </p>
              </div>
              <div className="text-right">
                <label
                  htmlFor="slider-endpoints"
                  className="block font-mono-tactical text-[10px] text-gray-400"
                >
                  SYNC CLIENTS: {endpointMillions.toFixed(1)}M
                </label>
                <input
                  id="slider-endpoints"
                  type="range"
                  min={0.5}
                  max={5.0}
                  step={0.5}
                  value={endpointMillions}
                  onChange={(e) => setEndpointMillions(Number(e.target.value))}
                  className="w-24 accent-[#F59E0B] cursor-pointer"
                />
              </div>
            </div>

            <svg
              viewBox="0 0 420 155"
              className="w-full h-40 overflow-visible"
              role="img"
              aria-label="Unpoliced retry storm load vs jittered control-plane policed recovery curve"
            >
              {/* 100% Capacity Threshold Line */}
              <line
                x1={32}
                y1={110}
                x2={405}
                y2={110}
                stroke="rgba(255,255,255,0.22)"
                strokeDasharray="4 4"
              />
              <text
                x={36}
                y={105}
                fill="#9CA3AF"
                fontSize="9"
                fontFamily="monospace"
              >
                100% Control-Plane Saturation Threshold
              </text>

              {/* Unpoliced Curve (#EF4444) */}
              <polyline
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.2"
                points={retryCurve
                  .map((pt, i) => {
                    const x = 32 + (i / (retryCurve.length - 1)) * 373;
                    const y = 142 - Math.min(130, (pt.unpolicedLoadPct / 360) * 125);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Jittered + Policed Curve (#10B981) */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.2"
                points={retryCurve
                  .map((pt, i) => {
                    const x = 32 + (i / (retryCurve.length - 1)) * 373;
                    const y = 142 - Math.min(130, (pt.jitteredPolicedLoadPct / 360) * 125);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>

            <div className="flex items-center justify-between text-[11px] font-mono-tactical pt-1 border-t border-white/[0.07]">
              <span className="text-[#EF4444]">
                ● Unpoliced Retry Storm (Peak {Math.max(...retryCurve.map((p) => p.unpolicedLoadPct))}%
                load)
              </span>
              <span className="text-[#10B981]">
                ● Jitter + CoPP Throttled (Converges &lt;25m)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-IP Blind-Spot Stack */}
      <section aria-labelledby="sub-ip-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <RadioTower className="w-4 h-4 text-[#38BDF8]" />
          <h2
            id="sub-ip-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Sub-IP Physical, Timing, Optical &amp; Cryptographic Blind-Spot Stack
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUB_IP_STACK.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="glass-card rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tactical text-[11px] text-[#38BDF8] inline-flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.layer}</span>
                  </span>
                  <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/35 text-[#F59E0B]">
                    {item.metric}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{item.summary}</p>
                <div className="pt-2.5 border-t border-white/[0.08] text-xs">
                  <span className="font-mono-tactical text-[#10B981]">DEFENSIVE POSTURE: </span>
                  <span className="text-gray-200">{item.mitigation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Complete Verbatim Case Studies (Sections 6 & 8) */}
      <NarrativeAccordion
        sections={forensicSections}
        heading="Complete Forensic Case Studies — FAA Ground Stop, NSANet, Apple/Marriott & Poison-Pill Hypothesis (Sec. 6 & 8)"
      />
    </div>
  );
}
