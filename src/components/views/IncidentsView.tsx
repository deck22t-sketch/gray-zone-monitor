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
  GitBranch,
  AlertCircle,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { IncidentClassification } from '@/types/schemas';
import { computePoissonClusterProbability, simulateRetryStormCurve } from '@/lib/poisson';
import { CitationChipList } from '@/components/shell/RichTextWithCitations';
import { NarrativeAccordion } from '@/components/shell/NarrativeAccordion';
import { TacticalFigure } from '@/components/shell/TacticalFigure';

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

const FAA_CONTRADICTIONS = [
  {
    actor: 'FAA Initial & Nov. 17 Readouts',
    statement:
      'Initially cited a "temporary telecommunications outage" and rejected software involvement before confirming data flooding across 17 of 22 ARTCCs—then on Nov. 17 halted router rollouts nationwide and powered off all ~400 installed Juniper routers.',
    gap: 'Shifted from denying software/update involvement to disabling broadcast functions on 69 routers and ultimately powering off ~400 new routers in favor of 25-year-old Cisco 6000 hardware.',
  },
  {
    actor: 'DOT Secretary Sean Duffy',
    statement:
      'Blamed decades-old copper lines transitioning from analog Time-Division Multiplexing (TDM) to digital IP fiber under L3Harris while requesting $50.1B for ATC modernization.',
    gap: 'Passive copper wires do not spontaneously generate nationwide packet storms without an active logical routing, configuration, or software broadcast trigger.',
  },
  {
    actor: 'DHS Secretary Markwayne Mullin',
    statement:
      'Stated technicians installing patches and new equipment onto legacy systems "overwhelmed the older system" (98% non-cyber), then Tuesday floated a televised theory about AI "self-fixing code" ripple effects.',
    gap: 'Exposed live Friday afternoon (3:30 p.m. ET, ~3,500 aircraft airborne) cutover governance across an unsegmented national safety backbone—and triggered bipartisan Gang of Eight briefing demands.',
  },
  {
    actor: 'L3Harris · HPE/Juniper · PASS Union',
    statement:
      'L3Harris opened Florida lab teardowns with the FBI; HPE stated its Juniper routers "worked as intended—they did not fail"; the FAA technicians union (PASS) stated its members were excluded from the router work.',
    gap: 'If router hardware did not malfunction, the devices executed the exact configuration logic supplied to them—narrowing fault to contractor engineering error or a tampered "golden configuration template."',
  },
] as const;

const SUB_IP_STACK = [
  {
    id: 'gnss',
    layer: 'LAYER 01 · RF / TIMING',
    title: 'Silent GNSS Position & PTP Clock Spoofing (+193%)',
    metric: '+193% Surge (2023–2025)',
    icon: Satellite,
    summary:
      'Expanded into North Pacific (NOPAC) U.S.–Asia airways R220 and R580—corrupting >100 commercial flights with false terrain warnings and 12-hour UTC aircraft clock shifts (exacerbated after SpaceX disabled unauthenticated local Starlink positioning in May 2026). Simultaneously threatens rooftop IEEE 1588 PTP clocks inside SEC CAT / MiFID II RTS 25 financial data centers without triggering loss-of-signal alarms.',
    mitigation:
      'Deploy terrestrial fiber / atomic Rb-Cs PTP holdover and multi-constellation spoofing angle-of-arrival checks.',
  },
  {
    id: 'transformers',
    layer: 'LAYER 02 · THERMAL & POWER GRID',
    title: 'Data-Center Thermal Limits & 128–144 Wk Transformer Bottlenecks',
    metric: '128–144 Wk Lead Times',
    icon: Zap,
    summary:
      'Nov. 2025 thermal cooling breakdown at CyrusOne’s N+2 data center halted CME Group global futures trading for ~10–11 hours. U.S. data centers face a projected 20% (~13 GW) power shortfall by 2028 alongside 128-week substation transformer and 144-week generator step-up (GSU) manufacturing lead times.',
    mitigation:
      'Pre-stage pooled domestic GSU/substation transformer spares and enforce cross-facility active-active matching engines.',
  },
  {
    id: 'slte',
    layer: 'LAYER 03 · SUBMARINE OPTICAL',
    title: 'Subsea Cable Landing Station & SLTE Security Mandate',
    metric: 'Jan. 8, 2027 FCC Deadline',
    icon: Anchor,
    summary:
      'On Nov. 16, 2026, the FCC issued correcting final rule 91 FR 73480 (DA 26-1229) tightening Submarine Line Terminal Equipment (SLTE) oversight and requiring Foreign Adversary Annual Reports by January 8, 2027 amid heightened Baltic and Indo-Pacific seabed sabotage risk.',
    mitigation:
      'Inventory all wet/dry plant SLTE firmware vendors, remote management OOB links, and foreign adversary touchpoints before Jan. 8.',
  },
  {
    id: 'tls',
    layer: 'LAYER 04 · CRYPTOGRAPHIC PKI',
    title: 'CA/Browser Forum 100-Day Public TLS Certificate Cliff',
    metric: 'Mar. 15, 2027 → 100 Days',
    icon: KeyRound,
    summary:
      'Ballot SC-081v3 cuts max public TLS certificate validity from 200 days (effective Mar. 15, 2026) to 100 days on March 15, 2027—and down to 47 days in 2029. Manual certificate renewal workflows across legacy load balancers and OT gateways face deterministic expiration outages.',
    mitigation:
      'Mandate automated ACME short-lived certificate rotation across all external gateways, APIs, and embedded appliances.',
  },
] as const;

export function IncidentsView() {
  const { bundle } = usePortal();
  const { incidents, sections } = bundle;

  const [classFilter, setClassFilter] = useState<'ALL' | IncidentClassification>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>('#2');
  const [selectedActorIdx, setSelectedActorIdx] = useState<number>(0);

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

  function jumpToIncident(eventId: string) {
    setClassFilter('ALL');
    setSearchQuery('');
    setHighlightedEventId(eventId);
    setTimeout(() => {
      const domId = `incident-card-${eventId.replace('#', '')}`;
      document.getElementById(domId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  }

  return (
    <div className="space-y-9">
      {/* Header */}
      <section className="glass-panel rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2 font-mono-tactical text-xs text-[#F59E0B]">
          <Activity className="w-4 h-4" />
          <span>SECTIONS 6 &amp; 8 · NOV 12–17, 2026 DISRUPTION WAVE &amp; FORENSICS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Master Tracked Incident Explorer, Hybrid TDM/IP Teardown &amp; Sub-IP Blind Spots
        </h1>
        <p className="text-sm text-gray-300 max-w-4xl leading-relaxed">
          Forensic separation of the ten-event November 12–17, 2026 disruption cluster—isolating
          confirmed supply-chain malware (<em>OPTIMJACK</em>) from hybrid copper-TDM/IP routing
          storms, unpoliced &ldquo;thundering herd&rdquo; recovery stalls, and cross-client iOS
          authentication cascades.
        </p>
      </section>

      {/* Six-Day Chronological Swimlane Strip (Nov 12–17) */}
      <section aria-label="Nov 12–17 Six-Day Incident Swimlane" className="glass-card rounded-2xl p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono-tactical text-xs uppercase tracking-wider text-white">
            Six-Day Disruption Wave Chronology (Nov. 12–17, 2026) — Click Any Node to Jump
          </p>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            10 Tier-1 Events Across Cloud, Aviation, Banking, Classified IC &amp; Consumer Auth
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {incidents.map((inc) => {
            const meta = CLASSIFICATION_META[inc.classification];
            const isActive = highlightedEventId === inc.eventId;
            const shortDate = inc.window.split('(')[0].replace(', 2026', '').trim();
            const shortEntity = inc.entity.split('(')[0].split('&')[0].trim();
            return (
              <button
                key={inc.eventId}
                type="button"
                onClick={() => jumpToIncident(inc.eventId)}
                className={`text-left rounded-xl p-2.5 border transition cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#111827] border-white/40 ring-1 ring-white/25'
                    : 'obsidian-surface hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono-tactical text-[11px] font-semibold text-white">
                    {inc.eventId}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.dotColor }}
                  />
                </div>
                <p className="text-[11px] font-medium text-gray-200 line-clamp-2 mt-1.5 leading-tight">
                  {shortEntity}
                </p>
                <p className="font-mono-tactical text-[9px] text-gray-400 mt-1.5 truncate">
                  {shortDate}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Editorial Plate 03: Hybrid Copper TDM-to-IP Fiber Rack & FAA Two-Router Forensic Teardown */}
      <TacticalFigure
        src="/images/incidents-hybrid-routing.jpg"
        alt="Macro hardware view inside a carrier telecommunications rack where legacy braided copper TDM trunks interface with modern cyan and amber fiber-optic transceivers and a crimson fault indicator"
        plateId="PLATE 03"
        title="Hybrid Copper-TDM to IP Fiber 'Transition Trap' & Unpoliced Control-Plane Broadcast Floods"
        domainBadge="SECTIONS 6.1–6.3 & 8.1 · TELECOM CORE FORENSICS"
        priority
        metrics={[
          { label: 'Nov. 13 Blast Radius', value: '17 of 22 Centers · 12,462 Flights', tone: 'crimson' },
          { label: 'Amarillo TX Flood Rate', value: '>1,000 Attempts / 4–5 Sec', tone: 'amber' },
          { label: 'Nov. 17 Rollout Halt', value: '~400 / 3,600+ Routers Powered Off', tone: 'cyan' },
          { label: 'GAO-26-107992 Audit', value: '105 of 138 Systems Unsustainable', tone: 'amber' },
        ]}
        caption="When modern high-throughput IP routers execute unpoliced broadcast rules into legacy low-buffer analog Time-Division Multiplexing (TDM) switches without Control-Plane Policing (CoPP), two remote edge sites can saturate national backbone signaling within seconds."
      />

      {/* Interactive FAA Two-Router Anomaly & 4-Actor Institutional Contradiction Diagnostic */}
      <section aria-labelledby="faa-teardown-heading" className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#F59E0B]" />
            <h2
              id="faa-teardown-heading"
              className="text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Sec. 6.1–6.3 &amp; 8.1 · Nov. 13 Nationwide Ground Stop: Two-Router Anomaly &amp;
              72-Hour Readout Contradictions
            </h2>
          </div>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            ~$345M Big-4 Carrier Hit · $50.1B White House ATC Request
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          {/* Left: Two-Router Anomaly + Poison-Pill Hypothesis */}
          <div className="lg:col-span-6 space-y-3">
            <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-[#38BDF8]">
              The Two-Site Trigger Geometry (Friday, Nov. 13 · 3:30–3:54 p.m. ET)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="obsidian-surface rounded-xl p-4 space-y-1.5 border border-[#F59E0B]/35">
                <span className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase">
                  SITE A · ACTIVE CUTOVER
                </span>
                <h3 className="text-sm font-semibold text-white">El Dorado, Arkansas</h3>
                <p className="text-gray-300 leading-relaxed">
                  Contractor L3Harris performed a live Friday ~3:30 p.m. ET cutover (~3,500 aircraft
                  airborne) migrating discontinued copper TDM circuits onto IP fiber under legacy
                  assumptions that remote sites were blast-radius isolated.
                </p>
              </div>

              <div className="obsidian-surface rounded-xl p-4 space-y-1.5 border border-[#EF4444]/35">
                <span className="font-mono-tactical text-[10px] text-[#EF4444] uppercase">
                  SITE B · DORMANT PEER DETONATION
                </span>
                <h3 className="text-sm font-semibold text-white">Amarillo, Texas</h3>
                <p className="text-gray-300 leading-relaxed">
                  Installed <strong>3 weeks earlier</strong> and operating normally, this router
                  suddenly flooded the FTI backbone at <strong>&gt;1,000 connection attempts every
                  4–5 seconds</strong> on the exact afternoon El Dorado altered peer routing state.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <p className="font-mono-tactical text-[11px] text-[#EF4444] uppercase font-semibold">
                  Sec. 8.1 · Why Forensics Cannot Dismiss the &ldquo;Poison Pill&rdquo; Hypothesis
                </p>
              </div>
              <p className="text-gray-200 leading-relaxed">
                Because HPE/Juniper confirmed the hardware did not fail and Amarillo stayed dormant
                for 21 days until peer topology changed, Florida FBI/lab teardowns must test whether
                an accidental broadcast loop or a tampered <strong>golden configuration template</strong>{' '}
                triggered without external C2 traffic during the L3Harris-to-AT&amp;T FENS handover.
              </p>
            </div>
          </div>

          {/* Right: 4-Actor Institutional Contradiction Switcher */}
          <div className="lg:col-span-6 glass-card rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-300">
                Institutional Public Explanations vs. Engineering Reality
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {FAA_CONTRADICTIONS.map((item, idx) => (
                  <button
                    key={item.actor}
                    type="button"
                    onClick={() => setSelectedActorIdx(idx)}
                    className={`text-left px-3 py-2 rounded-lg font-mono-tactical text-[11px] border transition cursor-pointer ${
                      selectedActorIdx === idx
                        ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                        : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    {item.actor}
                  </button>
                ))}
              </div>

              <div className="obsidian-surface rounded-xl p-4 space-y-2.5">
                <div>
                  <span className="font-mono-tactical text-[10px] uppercase text-[#38BDF8]">
                    Public Readout — {FAA_CONTRADICTIONS[selectedActorIdx].actor}
                  </span>
                  <p className="text-gray-200 mt-1 leading-relaxed">
                    {FAA_CONTRADICTIONS[selectedActorIdx].statement}
                  </p>
                </div>
                <div className="pt-2.5 border-t border-white/10">
                  <span className="font-mono-tactical text-[10px] uppercase text-[#F59E0B]">
                    Core Contradiction / Governance Risk Exposed
                  </span>
                  <p className="text-gray-300 mt-1 leading-relaxed">
                    {FAA_CONTRADICTIONS[selectedActorIdx].gap}
                  </p>
                </div>
              </div>
            </div>

            <p className="font-mono-tactical text-[10px] text-gray-400">
              Plain-text source note: U.S. DOT / FAA public briefings, GAO-26-107992, L3Harris &amp;
              HPE statements (Nov. 13–17, 2026).
            </p>
          </div>
        </div>
      </section>

      {/* Classification Filter Strip + Search + Master Ledger */}
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
            const isHighlighted = highlightedEventId === inc.eventId;
            return (
              <article
                key={inc.eventId}
                id={`incident-card-${inc.eventId.replace('#', '')}`}
                onClick={() => setHighlightedEventId(inc.eventId)}
                className={`glass-card rounded-xl p-5 space-y-3.5 scroll-mt-nav transition ${
                  isHighlighted ? 'ring-1 ring-[#38BDF8]/55 border-[#38BDF8]/40' : ''
                }`}
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

      {/* Sub-IP Blind-Spot Stack + Editorial Plate 04 */}
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

        <TacticalFigure
          src="/images/sub-ip-blindspots.jpg"
          alt="Technical editorial cutaway triptych showing a deep-sea armored submarine fiber cable and repeater, a high-voltage substation large power transformer with copper coil windings, and orbital GNSS timing beams over coastal antennas"
          plateId="PLATE 04"
          title="Sub-IP Physical & Timing Layer Exposures: Seabed SLTE Repeaters, 144-Week Transformers & GNSS/PTP Spoofing"
          domainBadge="SECTION 6.5 · PHYSICAL & CRYPTOGRAPHIC STACK"
          metrics={[
            { label: 'NOPAC R220 / R580', value: '+193% GNSS Spoofing Surge', tone: 'crimson' },
            { label: 'Grid Bottleneck', value: '128–144 Wk Transformer Lead', tone: 'amber' },
            { label: 'FCC 91 FR 73480', value: 'Jan. 8, 2027 SLTE Filing', tone: 'cyan' },
            { label: 'CA/B SC-081v3', value: 'Mar. 15, 2027 → 100d TLS', tone: 'amber' },
          ]}
          caption="Firewall and EDR telemetry cannot observe sub-IP physical dependencies: unauthenticated GNSS rooftop timing receivers (IEEE 1588 PTP), 13 GW projected data-center power deficits with 3-year GSU transformer queues, foreign-serviceable undersea SLTE repeaters, and 100-day TLS certificate cliffs."
        />

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
