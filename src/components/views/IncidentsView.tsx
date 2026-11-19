'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
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
  GitMerge,
  AlertCircle,
  LayoutList,
  Table2,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { IncidentClassification } from '@/types/schemas';
import { computePoissonClusterProbability, simulateRetryStormCurve } from '@/lib/poisson';
import { assessIncidentVerification } from '@/lib/evidence';
import { CitationChipList } from '@/components/shell/RichTextWithCitations';
import { NarrativeAccordion } from '@/components/shell/NarrativeAccordion';
import { TacticalFigure } from '@/components/shell/TacticalFigure';
import { SectionNavStrip } from '@/components/shell/SectionNavStrip';

const INCIDENTS_NAV_ITEMS = [
  { id: 'swimlane-section', code: '01', label: 'Swimlane', badge: '10' },
  { id: 'faa-teardown-section', code: '02', label: 'FAA Teardown' },
  { id: 'nsanet-enclave-section', code: '03', label: 'NSANet Patch' },
  { id: 'incident-ledger-section', code: '04', label: 'Ledger' },
  { id: 'poisson-calc-section', code: '05', label: 'Poisson Math' },
  { id: 'sub-ip-section', code: '06', label: 'Sub-IP Stack' },
  { id: 'incidents-verbatim-section', code: '07', label: 'Verbatim' },
];

const CLASSIFICATION_META: Record<
  IncidentClassification,
  { label: string; shortLabel: string; badgeStyle: string; borderAccent: string; dotColor: string }
> = {
  malicious_attack: {
    label: 'Confirmed Malicious Supply-Chain Attack',
    shortLabel: 'MALICIOUS ATTACK',
    badgeStyle: 'bg-[#EF4444]/15 border-[#EF4444]/45 text-[#EF4444]',
    borderAccent: 'border-l-[#EF4444]',
    dotColor: '#EF4444',
  },
  hybrid_transition_bug: {
    label: 'Hybrid Transition / Technical Bug',
    shortLabel: 'HYBRID / TECH BUG',
    badgeStyle: 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]',
    borderAccent: 'border-l-[#F59E0B]',
    dotColor: '#F59E0B',
  },
  client_cascade: {
    label: 'Cross-Client Auth Cascade',
    shortLabel: 'AUTH CASCADE',
    badgeStyle: 'bg-[#38BDF8]/15 border-[#38BDF8]/45 text-[#38BDF8]',
    borderAccent: 'border-l-[#38BDF8]',
    dotColor: '#38BDF8',
  },
  unspecified: {
    label: 'Unspecified / Root Cause Pending',
    shortLabel: 'ROOT CAUSE PENDING',
    badgeStyle: 'bg-white/[0.07] border-white/20 text-gray-300',
    borderAccent: 'border-l-gray-500',
    dotColor: '#9CA3AF',
  },
};

const FAA_CONTRADICTIONS = [
  {
    actor: 'FAA Admin. Bedford & 8-Min Sign-Off',
    statement:
      'On Nov. 18, Admin. Bryan Bedford took "full responsibility" (~1M travelers affected), noting investigators still do not know why El Dorado diverged from 68 clean prior cutovers after an on-site FAA official tested and signed off 8 minutes before the ground stop.',
    gap: 'Shifted from denying software involvement to powering off ~400 Juniper routers for 25-year-old Cisco 6000s—proving local pre-checks could not detect peer-triggered national broadcast floods.',
  },
  {
    actor: 'DOT Secretary Sean Duffy',
    statement:
      'Blamed copper-to-IP fiber transitions, cited two-decade L3Harris vendor lock-in since 2002 with no timeline to resume Juniper installs, and requested $50.1B for ATC modernization.',
    gap: 'Passive copper wires do not spontaneously generate 1,000+ req/4–5s floods without an active logical routing, configuration, or software broadcast trigger.',
  },
  {
    actor: 'House Hearing · DNI Clayton · VP Vance',
    statement:
      'At the completed Nov. 18 House Worldwide Threats hearing, DNI Jay Clayton, DHS Sec. Mullin, and FBI Dep. Dir. Raia testified no foreign coordination links the outages; VP JD Vance canceled DealBook for White House outage meetings as Sen. Mark Warner warned of an AI-driven patching rush.',
    gap: 'Exposed Friday afternoon (3:30 p.m. ET, ~3,500 aircraft airborne) cutover governance and AI-accelerated emergency patch fragility across unsegmented backbones.',
  },
  {
    actor: 'L3Harris · HPE/Juniper · PASS Union',
    statement:
      'L3Harris opened Florida lab teardowns with the FBI; HPE stated Juniper routers "worked as intended—they did not fail"; the FAA technicians union (PASS) noted exclusion from router work.',
    gap: 'If hardware did not fail, the routers executed exact supplied config logic—narrowing root cause to installer engineering error or a tampered golden template.',
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
  const { incidents, sections, changelog } = bundle;

  const [classFilter, setClassFilter] = useState<'ALL' | IncidentClassification>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerDisplayMode, setLedgerDisplayMode] = useState<'cards' | 'table'>('cards');
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>('#2');
  const [selectedActorIdx, setSelectedActorIdx] = useState<number>(0);

  // Poisson Calculator State (defaults to 1.4 events/wk -> 75.3% per Section 8.2)
  const [weeklyRate, setWeeklyRate] = useState<number>(1.4);
  const [windowDays, setWindowDays] = useState<number>(5);
  const [minEvents, setMinEvents] = useState<number>(4);
  const [endpointMillions, setEndpointMillions] = useState<number>(2.5);

  const updatedEventIds = useMemo(
    () => new Set(changelog.updatedStatuses.map((u) => u.eventId)),
    [changelog.updatedStatuses]
  );

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
    <div className="space-y-7">
      {/* Edge-to-Edge Docked In-Page Section Rail */}
      <SectionNavStrip items={INCIDENTS_NAV_ITEMS} ariaLabel="Outage Wave & Forensics sections" />

      {/* Header */}
      <section className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono-tactical text-[11px] text-[#F59E0B]">
            <Activity className="w-3.5 h-3.5" />
            <span>SECTIONS 6 &amp; 8 · NOV 12–18 DISRUPTION WAVE &amp; FORENSICS</span>
          </div>
          <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded-sm bg-white/[0.04] border border-white/10 text-gray-300">
            ~6M Weekly Reports · House Hearing Completed Nov. 18
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
          Incident Forensics, FAA Hybrid Teardown &amp; NSANet Patch Recovery
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
          Separating confirmed supply-chain malware (<em>OPTIMJACK</em>) from hybrid TDM/IP
          broadcast storms, AI-accelerated PHP2Shell patch stalls, unpoliced retry herds, and iOS
          auth cascades.
        </p>
      </section>

      {/* Six-Day Chronological Swimlane Strip (Nov 12–17) */}
      <section
        id="swimlane-section"
        aria-label="Nov 12–17 Six-Day Incident Swimlane"
        className="glass-card rounded-lg p-4 sm:p-5 space-y-3 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono-tactical text-xs uppercase tracking-wider text-white">
            Disruption Wave Chronology (Nov. 12–18) — Tap to Jump
          </p>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            {incidents.length} Tracked · {updatedEventIds.size} Nov. 18 Updates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {incidents.map((inc) => {
            const meta = CLASSIFICATION_META[inc.classification];
            const isActive = highlightedEventId === inc.eventId;
            const wasUpdated = updatedEventIds.has(inc.eventId);
            const shortDate = inc.window.split('(')[0].replace(', 2026', '').trim();
            const shortEntity = inc.entity.split('(')[0].split('&')[0].trim();
            return (
              <button
                key={inc.eventId}
                type="button"
                onClick={() => jumpToIncident(inc.eventId)}
                className={`text-left rounded-md p-2.5 border transition cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'surface-elevated border-[#38BDF8]/60 ring-1 ring-[#38BDF8]/25'
                    : 'obsidian-surface hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono-tactical text-[11px] font-semibold text-white">
                    {inc.eventId}
                  </span>
                  <div className="flex items-center gap-1">
                    {wasUpdated && (
                      <span
                        title="Updated in Nov. 18 Canonical Sync"
                        className="font-mono-tactical text-[8px] px-1 rounded-xs bg-[#38BDF8]/20 text-[#38BDF8]"
                      >
                        UPD
                      </span>
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.dotColor }}
                    />
                  </div>
                </div>
                <p className="text-[11px] font-medium text-gray-200 line-clamp-2 mt-1.5 leading-tight">
                  {shortEntity}
                </p>
                <p className="font-mono-tactical text-[9px] text-gray-400 mt-1 truncate">
                  {shortDate}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Editorial Plate 03 */}
      <TacticalFigure
        src="/images/incidents-hybrid-routing.jpg"
        alt="Macro hardware view inside a carrier telecommunications rack where legacy braided copper TDM trunks interface with modern cyan and amber fiber-optic transceivers and a crimson fault indicator"
        plateId="PLATE 03"
        title="Hybrid Copper-TDM to IP Fiber 'Transition Trap' & Unpoliced Control-Plane Broadcast Floods"
        domainBadge="SECTIONS 6.1–6.3 & 8.1 · TELECOM CORE FORENSICS"
        priority
        metrics={[
          { label: 'Nov. 13 Blast Radius', value: '17 of 22 Centers · 12,462 Flights', tone: 'crimson' },
          { label: 'Bedford Readout', value: '68 Clean Prior Cutovers · 8-Min Sign-Off', tone: 'amber' },
          { label: 'Rollout Halt', value: '~400 / 3,600+ Juniper Routers Off', tone: 'cyan' },
          { label: 'GAO-26-107992', value: '105 of 138 Systems Unsustainable', tone: 'amber' },
        ]}
        caption="When modern high-throughput IP routers execute unpoliced broadcast rules into legacy low-buffer analog Time-Division Multiplexing (TDM) switches without Control-Plane Policing (CoPP), two remote edge sites can saturate national backbone signaling within seconds—even after 68 prior clean cutovers and an on-site FAA test sign-off."
      />

      {/* Interactive FAA Two-Router Anomaly & 4-Actor Institutional Contradiction Diagnostic */}
      <section
        id="faa-teardown-section"
        aria-labelledby="faa-teardown-heading"
        className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#F59E0B]" />
            <h2
              id="faa-teardown-heading"
              className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Sec. 6.1–6.3 &amp; 8.1 · FAA Ground Stop Teardown &amp; Nov. 18 Accountability
            </h2>
          </div>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            White House Tiger Team · ~$345M Carrier Hit · $50.1B Request
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-[13px]">
          {/* Left: Two-Router Anomaly + Poison-Pill Hypothesis */}
          <div className="lg:col-span-6 space-y-3">
            <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-[#38BDF8]">
              Two-Site Trigger Geometry (Fri. Nov. 13 · 3:30–3:54 p.m. ET)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="obsidian-surface rounded-md p-3.5 space-y-1.5 border border-[#F59E0B]/35">
                <span className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase">
                  SITE A · 8-MIN PRIOR SIGN-OFF
                </span>
                <h3 className="text-sm font-semibold text-white">El Dorado, Arkansas</h3>
                <p className="text-gray-300 leading-relaxed text-xs">
                  On-site FAA official supervised L3Harris, tested the copper-to-IP switchover, and
                  signed off <strong>8 minutes before</strong> the stop (~3,500 airborne). Mystery
                  persists after 68 clean prior cutovers.
                </p>
              </div>

              <div className="obsidian-surface rounded-md p-3.5 space-y-1.5 border border-[#EF4444]/35">
                <span className="font-mono-tactical text-[10px] text-[#EF4444] uppercase">
                  SITE B · DORMANT PEER TRIGGER
                </span>
                <h3 className="text-sm font-semibold text-white">Amarillo, Texas</h3>
                <p className="text-gray-300 leading-relaxed text-xs">
                  Installed <strong>3 weeks earlier</strong> and operating normally, this router
                  flooded FTI at <strong>&gt;1,000 req/4–5s</strong> the exact afternoon El Dorado
                  changed peer routing state.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-[#EF4444]/10 border border-[#EF4444]/30 p-3.5 space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                <p className="font-mono-tactical text-[10px] text-[#EF4444] uppercase font-semibold">
                  Sec. 8.1 · Unresolved &ldquo;Poison Pill&rdquo; Template Test
                </p>
              </div>
              <p className="text-gray-300 leading-relaxed text-xs">
                Because Juniper hardware functioned as configured, El Dorado pre-tests passed, and
                Amarillo waited 21 days until peer topology changed, Florida FBI/lab teardowns must
                rule out a tampered <strong>golden configuration template</strong> alongside pure
                installer loop error.
              </p>
            </div>
          </div>

          {/* Right: 4-Actor Institutional Contradiction Switcher */}
          <div className="lg:col-span-6 glass-card rounded-lg p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                Institutional Public Readouts vs. Engineering Reality
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {FAA_CONTRADICTIONS.map((item, idx) => (
                  <button
                    key={item.actor}
                    type="button"
                    onClick={() => setSelectedActorIdx(idx)}
                    className={`text-left px-2.5 py-2 rounded-md font-mono-tactical text-[11px] border transition cursor-pointer ${
                      selectedActorIdx === idx
                        ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                        : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {item.actor}
                  </button>
                ))}
              </div>

              <div className="obsidian-surface rounded-md p-3.5 space-y-2.5 text-xs">
                <div>
                  <span className="font-mono-tactical text-[10px] uppercase text-[#38BDF8]">
                    Public Readout — {FAA_CONTRADICTIONS[selectedActorIdx].actor}
                  </span>
                  <p className="text-gray-200 mt-1 leading-relaxed">
                    {FAA_CONTRADICTIONS[selectedActorIdx].statement}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/[0.08]">
                  <span className="font-mono-tactical text-[10px] uppercase text-[#F59E0B]">
                    Core Contradiction / Governance Risk
                  </span>
                  <p className="text-gray-300 mt-1 leading-relaxed">
                    {FAA_CONTRADICTIONS[selectedActorIdx].gap}
                  </p>
                </div>
              </div>
            </div>

            <p className="font-mono-tactical text-[10px] text-gray-500">
              Plain-text sources: U.S. DOT/FAA briefings, PBS NewsHour, House Worldwide Threats
              Hearing (Nov. 18), GAO-26-107992, WaPo/Mashable, L3Harris &amp; HPE statements.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Plate 07 — Nov. 18 NSANet PHP2Shell Patching Enclave */}
      <section id="nsanet-enclave-section" className="space-y-3 scroll-mt-nav">
        <TacticalFigure
          src="/images/nsanet-patch-enclave.jpg"
          alt="High-security air-gapped intelligence server vault with matte carbon racks, amber PHP2Shell patch-verification fault indicator, and staggered login telemetry conduits"
          plateId="PLATE 07"
          title="Sec. 6.6 · NSANet 'PHP2Shell' Emergency Patching Stall & Staggered 'Code Gray' Recovery"
          domainBadge="NOV. 18 EVENING READOUT · AI PATCHING STRAIN"
          metrics={[
            { label: 'Confirmed Vector', value: 'AI-Found "PHP2Shell" Patch', tone: 'amber' },
            { label: 'Operational Hit', value: 'Fort Meade + NSA Georgia Hub', tone: 'crimson' },
            { label: 'Login Containment', value: 'Code Gray Staggered Arrivals', tone: 'cyan' },
            { label: 'Senate Warning', value: 'AI Vuln Discovery > Patch Pace', tone: 'emerald' },
          ]}
          caption="Confirmed Nov. 18 by DNI Jay Clayton and CBS News/CNN: NSANet went offline during urgent patching of AI-discovered 'PHP2Shell' vulnerabilities (Oct. 21 FBI/NSA/CISA directive) when legacy web-interface handoffs failed on restart—disrupting the NSA Georgia Middle East hub and forcing 'Code Gray' staggered logins into late Nov. 18 PM recovery."
        />
      </section>

      {/* Classification Filter Strip + View Mode Toggle + Search + Master Ledger */}
      <section
        id="incident-ledger-section"
        aria-labelledby="incident-ledger-heading"
        className="space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2
            id="incident-ledger-heading"
            className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Sec. 8.4 · Master Tracked Incident Ledger (Events #1–#{incidents.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Cards vs Compact Table Toggle */}
            <div className="inline-flex rounded-md bg-[#070A10] border border-white/12 p-0.5">
              <button
                type="button"
                onClick={() => setLedgerDisplayMode('cards')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono-tactical cursor-pointer transition ${
                  ledgerDisplayMode === 'cards'
                    ? 'bg-[#38BDF8]/18 text-[#38BDF8]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setLedgerDisplayMode('table')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono-tactical cursor-pointer transition ${
                  ledgerDisplayMode === 'table'
                    ? 'bg-[#38BDF8]/18 text-[#38BDF8]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Matrix</span>
              </button>
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                id="incidents-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entity, vector, router…"
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#070A10] border border-white/12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setClassFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border transition cursor-pointer ${
              classFilter === 'ALL'
                ? 'bg-white/12 border-white/25 text-white'
                : 'bg-[#070A10] border-white/[0.08] text-gray-400 hover:text-white'
            }`}
          >
            All ({incidents.length})
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
            if (cls === 'unspecified' && count === 0) return null;
            const active = classFilter === cls;
            return (
              <button
                key={cls}
                id={`filter-cls-${cls}`}
                type="button"
                onClick={() => setClassFilter(cls)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border transition cursor-pointer ${
                  active
                    ? meta.badgeStyle
                    : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.dotColor }}
                />
                <span>
                  {meta.shortLabel} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Display Mode 1: Detailed Forensic Cards */}
        {ledgerDisplayMode === 'cards' ? (
          <div className="space-y-3">
            {filteredIncidents.map((inc) => {
              const meta = CLASSIFICATION_META[inc.classification];
              const verif = assessIncidentVerification(inc);
              const isHighlighted = highlightedEventId === inc.eventId;
              const wasUpdated = updatedEventIds.has(inc.eventId);
              return (
                <article
                  key={inc.eventId}
                  id={`incident-card-${inc.eventId.replace('#', '')}`}
                  onClick={() => setHighlightedEventId(inc.eventId)}
                  className={`glass-card rounded-lg border-l-2 ${meta.borderAccent} p-4 sm:p-5 space-y-3 scroll-mt-nav transition ${
                    isHighlighted ? 'ring-1 ring-[#38BDF8]/50 border-[#38BDF8]/35' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono-tactical text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#070A10] border border-white/12 text-white">
                          EVENT {inc.eventId}
                        </span>
                        <span className="font-mono-tactical text-[11px] text-gray-300">
                          {inc.window}
                        </span>
                        <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-white/[0.04] text-gray-300">
                          {inc.sector}
                        </span>
                        <span
                          title={verif.basis}
                          className={`font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm border ${
                            verif.tone === 'emerald'
                              ? 'bg-[#10B981]/12 border-[#10B981]/35 text-[#10B981]'
                              : 'bg-[#F59E0B]/12 border-[#F59E0B]/35 text-[#F59E0B]'
                          }`}
                        >
                          {verif.level}
                        </span>
                        {wasUpdated && (
                          <span className="font-mono-tactical text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#38BDF8]/15 border border-[#38BDF8]/35 text-[#38BDF8]">
                            NOV 18 UPD
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-white">{inc.entity}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/?trace=inc-${inc.eventId.replace('#', '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-[#38BDF8]/35 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 font-mono-tactical text-[10px] text-[#38BDF8] transition"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>Trace</span>
                      </Link>
                      <span
                        className={`font-mono-tactical text-[10px] font-medium px-2 py-1 rounded-sm border ${meta.badgeStyle}`}
                      >
                        {meta.shortLabel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 text-xs sm:text-[13px]">
                    <div className="obsidian-surface rounded-md p-3 space-y-1">
                      <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500">
                        Operational Impact
                      </p>
                      <p className="text-gray-200 leading-relaxed">{inc.impact}</p>
                    </div>
                    <div className="obsidian-surface rounded-md p-3 space-y-1">
                      <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500">
                        Stated Cause / Forensic Vector
                      </p>
                      <p className="text-gray-200 leading-relaxed">{inc.vector}</p>
                    </div>
                    <div className="obsidian-surface rounded-md p-3 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-[#10B981]">
                          Tracking Status
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
        ) : (
          /* Display Mode 2: Dense Executive Comparison Matrix */
          <div className="overflow-x-auto rounded-lg border border-white/[0.09]">
            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="bg-[#0B0F17] border-b border-white/[0.09] font-mono-tactical text-[10px] uppercase text-gray-400">
                  <th className="px-3.5 py-2.5">Event / Window</th>
                  <th className="px-3.5 py-2.5">Entity &amp; Sector</th>
                  <th className="px-3.5 py-2.5">Class</th>
                  <th className="px-3.5 py-2.5">Forensic Vector</th>
                  <th className="px-3.5 py-2.5">Current Status &amp; Sources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07] bg-[#070A10]">
                {filteredIncidents.map((inc) => {
                  const meta = CLASSIFICATION_META[inc.classification];
                  const wasUpdated = updatedEventIds.has(inc.eventId);
                  return (
                    <tr
                      key={inc.eventId}
                      id={`incident-card-${inc.eventId.replace('#', '')}`}
                      className="hover:bg-white/[0.03] align-top"
                    >
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="font-mono-tactical font-semibold text-white">
                          {inc.eventId}
                        </div>
                        <div className="font-mono-tactical text-[11px] text-gray-400 mt-0.5">
                          {inc.window.split('(')[0].trim()}
                        </div>
                        {wasUpdated && (
                          <span className="inline-block mt-1 font-mono-tactical text-[9px] px-1.5 py-0.5 rounded-sm bg-[#38BDF8]/15 text-[#38BDF8]">
                            NOV 18 UPD
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-white">{inc.entity}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{inc.sector}</div>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span
                          className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm border ${meta.badgeStyle}`}
                        >
                          {meta.shortLabel}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-gray-200 leading-relaxed max-w-xs">
                        {inc.vector}
                      </td>
                      <td className="px-3.5 py-3 text-gray-200 leading-relaxed max-w-sm space-y-1.5">
                        <p>{inc.status}</p>
                        <CitationChipList
                          sources={inc.sources}
                          contextLabel={`Tracked Incident ${inc.eventId} — ${inc.entity}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Interactive Poisson Base-Rate Cluster Calculator + Retry-Storm Curve */}
      <section
        id="poisson-calc-section"
        aria-labelledby="poisson-calc-heading"
        className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#38BDF8]" />
            <div>
              <h2
                id="poisson-calc-heading"
                className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
              >
                Sec. 8.2 · Poisson Cluster Calculator &amp; Retry-Storm Physics
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Testing null-hypothesis cluster coincidence across ~50 tier-one global backbones.
              </p>
            </div>
          </div>

          {/* Section 8.2 Canonical Presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '1.0/wk (36.1%)', rate: 1.0 },
              { label: '1.4/wk (75.3%)', rate: 1.4 },
              { label: '2.0/wk (98.6%)', rate: 2.0 },
            ].map((preset) => (
              <button
                key={preset.rate}
                type="button"
                onClick={() => {
                  setWeeklyRate(preset.rate);
                  setWindowDays(5);
                  setMinEvents(4);
                }}
                className={`px-2.5 py-1 rounded-sm text-xs font-mono-tactical border cursor-pointer transition ${
                  Math.abs(weeklyRate - preset.rate) < 0.01 &&
                  windowDays === 5 &&
                  minEvents === 4
                    ? 'bg-[#38BDF8]/18 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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
                    {windowDays} days ({windowDays * 24}h · {poisson.windowsPerYear.toFixed(1)}/yr)
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
                    Minimum Coincident Failures (k)
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

            <div className="grid grid-cols-3 gap-2">
              <div className="obsidian-surface rounded-md p-3">
                <p className="font-mono-tactical text-[10px] text-gray-500 uppercase">
                  Window Mean (λ)
                </p>
                <p className="font-mono-tactical text-lg font-semibold text-white mt-0.5">
                  {poisson.lambdaPerWindow.toFixed(2)}
                </p>
                <p className="text-[11px] text-gray-400">per {poisson.windowHours}h</p>
              </div>
              <div className="obsidian-surface rounded-md p-3">
                <p className="font-mono-tactical text-[10px] text-gray-500 uppercase">
                  Single {windowDays}d Window
                </p>
                <p className="font-mono-tactical text-lg font-semibold text-[#38BDF8] mt-0.5">
                  {(poisson.singleWindowProb * 100).toFixed(2)}%
                </p>
                <p className="text-[11px] text-gray-400">P(X ≥ {minEvents})</p>
              </div>
              <div className="obsidian-surface rounded-md p-3 border border-[#F59E0B]/40">
                <p className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase">
                  Annual Chance
                </p>
                <p className="font-mono-tactical text-lg font-semibold text-[#F59E0B] mt-0.5">
                  {(poisson.annualAtLeastOneProb * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-gray-300">≥1 cluster / yr</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-white">Base-Rate Discipline:</strong> At{' '}
              {weeklyRate.toFixed(1)} failures/week, a{' '}
              <span className="font-mono-tactical text-white font-semibold">
                {(poisson.annualAtLeastOneProb * 100).toFixed(1)}%
              </span>{' '}
              annual chance of ≥{minEvents} coincident outages occurs purely at random—demanding
              Watchlist #1–#9 evidence before asserting coordination.
            </p>
          </div>

          {/* Retry-Storm ("Thundering Herd") Physics Visualizer */}
          <div className="lg:col-span-6 obsidian-surface rounded-md p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono-tactical text-[11px] text-[#F59E0B] uppercase">
                  Unpoliced &ldquo;Thundering Herd&rdquo; vs. Policed Recovery
                </p>
                <p className="text-[11px] text-gray-400">
                  M365 (~10h stall), FAA (1,000 req/4–5s), Chase re-crashes, &amp; NSANet Code Gray.
                </p>
              </div>
              <div className="text-right">
                <label
                  htmlFor="slider-endpoints"
                  className="block font-mono-tactical text-[10px] text-gray-400"
                >
                  CLIENTS: {endpointMillions.toFixed(1)}M
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

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tactical pt-1 border-t border-white/[0.07]">
              <span className="text-[#EF4444]">
                ● Unpoliced Storm (Peak {Math.max(...retryCurve.map((p) => p.unpolicedLoadPct))}%)
              </span>
              <span className="text-[#10B981]">
                ● Jitter + CoPP (Converges &lt;25m)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-IP Blind-Spot Stack + Editorial Plate 04 */}
      <section
        id="sub-ip-section"
        aria-labelledby="sub-ip-heading"
        className="space-y-4 scroll-mt-nav"
      >
        <div className="flex items-center gap-2">
          <RadioTower className="w-4 h-4 text-[#38BDF8]" />
          <h2
            id="sub-ip-heading"
            className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SUB_IP_STACK.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="glass-card rounded-lg p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tactical text-[10px] text-[#38BDF8] inline-flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.layer}</span>
                  </span>
                  <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-[#F59E0B]/15 border border-[#F59E0B]/35 text-[#F59E0B]">
                    {item.metric}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white">{item.title}</h3>
                <p className="text-xs sm:text-[13px] text-gray-300 leading-relaxed">{item.summary}</p>
                <div className="pt-2 border-t border-white/[0.08] text-xs">
                  <span className="font-mono-tactical text-[10px] text-[#10B981]">
                    POSTURE:{' '}
                  </span>
                  <span className="text-gray-200">{item.mitigation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Complete Verbatim Case Studies (Sections 6 & 8) */}
      <NarrativeAccordion
        id="incidents-verbatim-section"
        sections={forensicSections}
        heading="Complete Verbatim Forensic Case Studies — FAA, NSANet, Apple/Marriott & Poison-Pill (Sec. 6 & 8)"
      />
    </div>
  );
}
