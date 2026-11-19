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
  { id: 'swimlane-section', code: '01', label: '6-Day Swimlane', badge: '10' },
  { id: 'faa-teardown-section', code: '02', label: 'FAA Router Teardown' },
  { id: 'incident-ledger-section', code: '03', label: 'Master Ledger' },
  { id: 'poisson-calc-section', code: '04', label: 'Poisson & Retry Math' },
  { id: 'sub-ip-section', code: '05', label: 'Sub-IP Blind Spots' },
  { id: 'incidents-verbatim-section', code: '06', label: 'Verbatim Sec. 6 & 8' },
];

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
    label: 'Hybrid Transition / Technical Bug',
    shortLabel: 'HYBRID / TECH BUG',
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
    actor: 'FAA Readouts & 8-Min Sign-Off',
    statement:
      'Initially cited a "temporary telecommunications outage" before confirming floods across 17 of 22 ARTCCs, powering off ~400 Juniper routers, and standing up a White House "tiger team." WaPo/Mashable revealed an on-site FAA official supervised L3Harris in El Dorado, tested the cutover, and signed off 8 minutes before the ground stop.',
    gap: 'Shifted from denying software/update involvement to powering off ~400 new routers in favor of 25-year-old Cisco 6000 hardware—while on-site sign-off proved standard pre-checks could not detect peer-triggered backbone broadcast storms.',
  },
  {
    actor: 'DOT Secretary Sean Duffy',
    statement:
      'Blamed decades-old copper lines transitioning from analog Time-Division Multiplexing (TDM) to digital IP fiber under L3Harris while requesting $50.1B for ATC modernization.',
    gap: 'Passive copper wires do not spontaneously generate nationwide packet storms without an active logical routing, configuration, or software broadcast trigger.',
  },
  {
    actor: 'Sec. Rubio · Sec. Mullin · Congress',
    statement:
      'Sec. Marco Rubio stated Nov. 18 in Manila that agencies found "zero evidence" tying the outages to foreign malign actors; DHS Sec. Mullin (98% non-cyber; Tuesday AI "self-fixing code" theory) and FBI Dep. Dir. Christopher Raia testify today (10:00 a.m. ET) amid bipartisan Gang of Eight & Sen. Lummis demands.',
    gap: 'Exposed live Friday afternoon (3:30 p.m. ET, ~3,500 aircraft airborne) cutover governance across an unsegmented safety backbone during a week with ~6M U.S. Downdetector reports.',
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
    <div className="space-y-9">
      {/* Sticky In-Page Section Wayfinding */}
      <SectionNavStrip items={INCIDENTS_NAV_ITEMS} ariaLabel="Outage Wave & Forensics sections" />

      {/* Header */}
      <section className="glass-panel rounded-2xl p-6 sm:p-7 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono-tactical text-xs text-[#F59E0B]">
            <Activity className="w-4 h-4" />
            <span>SECTIONS 6 &amp; 8 · NOV 12–18, 2026 DISRUPTION WAVE &amp; FORENSICS</span>
          </div>
          <span className="font-mono-tactical text-xs px-2.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-gray-300">
            ~6M Weekly U.S. Downdetector Reports · Rubio Manila &ldquo;Zero Evidence&rdquo; Readout
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
          Master Tracked Incident Explorer, Hybrid TDM/IP Teardown &amp; Sub-IP Blind Spots
        </h1>
        <p className="text-sm sm:text-[15px] text-gray-200 max-w-4xl leading-[1.68]">
          Forensic separation of the ten-event November 12–17, 2026 disruption cluster—isolating
          confirmed supply-chain malware (<em>OPTIMJACK</em> via <code>webshell[.]lol</code>) from
          hybrid copper-TDM/IP routing storms, unpoliced &ldquo;thundering herd&rdquo; recovery
          stalls, and cross-client iOS authentication cascades.
        </p>
      </section>

      {/* Six-Day Chronological Swimlane Strip (Nov 12–17) */}
      <section
        id="swimlane-section"
        aria-label="Nov 12–17 Six-Day Incident Swimlane"
        className="glass-card rounded-2xl p-5 space-y-3.5 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono-tactical text-xs uppercase tracking-wider text-white">
            Six-Day Disruption Wave Chronology (Nov. 12–17, 2026) — Click Any Node to Jump
          </p>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            10 Tier-1 Events · {updatedEventIds.size} Status Updates in {sections.docDate} Edition
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
                className={`text-left rounded-xl p-2.5 border transition cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'surface-elevated border-[#38BDF8]/60 ring-1 ring-[#38BDF8]/30'
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
                        className="font-mono-tactical text-[8px] px-1 rounded bg-[#38BDF8]/20 text-[#38BDF8]"
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
                <p className="font-mono-tactical text-[9px] text-gray-400 mt-1.5 truncate">
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
          { label: 'On-Site FAA Sign-Off', value: '8 Min Before Ground Stop', tone: 'amber' },
          { label: 'Nov. 17 Rollout Halt', value: '~400 / 3,600+ Routers Powered Off', tone: 'cyan' },
          { label: 'GAO-26-107992 Audit', value: '105 of 138 Systems Unsustainable', tone: 'amber' },
        ]}
        caption="When modern high-throughput IP routers execute unpoliced broadcast rules into legacy low-buffer analog Time-Division Multiplexing (TDM) switches without Control-Plane Policing (CoPP), two remote edge sites can saturate national backbone signaling within seconds—even immediately after an on-site FAA test sign-off."
      />

      {/* Interactive FAA Two-Router Anomaly & 4-Actor Institutional Contradiction Diagnostic */}
      <section
        id="faa-teardown-section"
        aria-labelledby="faa-teardown-heading"
        className="glass-panel rounded-2xl p-6 space-y-5 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#F59E0B]" />
            <h2
              id="faa-teardown-heading"
              className="text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Sec. 6.1–6.3 &amp; 8.1 · Nov. 13 Nationwide Ground Stop: Two-Router Anomaly, 8-Min
              Sign-Off &amp; Readout Contradictions
            </h2>
          </div>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            White House &ldquo;Tiger Team&rdquo; Active · ~$345M Carrier Hit · $50.1B ATC Request
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-[13px]">
          {/* Left: Two-Router Anomaly + Poison-Pill Hypothesis */}
          <div className="lg:col-span-6 space-y-3">
            <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-[#38BDF8]">
              The Two-Site Trigger Geometry (Friday, Nov. 13 · 3:30–3:54 p.m. ET)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="obsidian-surface rounded-xl p-4 space-y-1.5 border border-[#F59E0B]/35">
                <span className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase">
                  SITE A · 8-MIN PRIOR FAA SIGN-OFF
                </span>
                <h3 className="text-sm font-semibold text-white">El Dorado, Arkansas</h3>
                <p className="text-gray-200 leading-relaxed text-xs sm:text-[13px]">
                  An on-site FAA official supervised L3Harris, tested the copper-TDM-to-IP fiber
                  switchover, and signed off <strong>8 minutes before</strong> the ground stop
                  (~3,500 aircraft airborne) under legacy blast-radius isolation assumptions.
                </p>
              </div>

              <div className="obsidian-surface rounded-xl p-4 space-y-1.5 border border-[#EF4444]/35">
                <span className="font-mono-tactical text-[10px] text-[#EF4444] uppercase">
                  SITE B · DORMANT PEER DETONATION
                </span>
                <h3 className="text-sm font-semibold text-white">Amarillo, Texas</h3>
                <p className="text-gray-200 leading-relaxed text-xs sm:text-[13px]">
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
              <p className="text-gray-200 leading-relaxed text-xs sm:text-[13px]">
                Because HPE/Juniper confirmed the hardware did not fail, local El Dorado pre-tests
                passed 8 minutes prior, and Amarillo stayed dormant for 21 days until peer topology
                changed, Florida FBI/lab teardowns and the White House tiger team must test whether
                an accidental broadcast loop or a tampered <strong>golden configuration
                template</strong> triggered without external C2 traffic.
              </p>
            </div>
          </div>

          {/* Right: 4-Actor Institutional Contradiction Switcher */}
          <div className="lg:col-span-6 glass-card rounded-xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-300">
                Institutional Public Explanations vs. Engineering Reality
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                  <p className="text-gray-200 mt-1 leading-relaxed">
                    {FAA_CONTRADICTIONS[selectedActorIdx].gap}
                  </p>
                </div>
              </div>
            </div>

            <p className="font-mono-tactical text-[10px] text-gray-400">
              Plain-text source note: U.S. DOT / FAA briefings, Sec. Rubio Manila remarks,
              GAO-26-107992, WaPo/Mashable, L3Harris &amp; HPE statements (Nov. 13–18, 2026).
            </p>
          </div>
        </div>
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
            className="text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Section 8.4 · Master Tracked Incident Ledger (Events #1–#{incidents.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Cards vs Compact Table Toggle */}
            <div className="inline-flex rounded-lg bg-[#0E1524] border border-white/15 p-0.5">
              <button
                type="button"
                onClick={() => setLedgerDisplayMode('cards')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-tactical cursor-pointer transition ${
                  ledgerDisplayMode === 'cards'
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setLedgerDisplayMode('table')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-tactical cursor-pointer transition ${
                  ledgerDisplayMode === 'table'
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Matrix</span>
              </button>
            </div>

            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                id="incidents-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entity, vector, CVE, router…"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0E1524] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
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
            if (cls === 'unspecified' && count === 0) return null;
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

        {/* Display Mode 1: Detailed Forensic Cards */}
        {ledgerDisplayMode === 'cards' ? (
          <div className="space-y-3.5">
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
                  className={`glass-card rounded-xl p-5 space-y-3.5 scroll-mt-nav transition ${
                    isHighlighted ? 'ring-1 ring-[#38BDF8]/55 border-[#38BDF8]/40' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-tactical text-xs font-semibold px-2.5 py-0.5 rounded bg-[#0E1524] border border-white/15 text-white">
                          EVENT {inc.eventId}
                        </span>
                        <span className="font-mono-tactical text-xs text-gray-300">
                          {inc.window}
                        </span>
                        <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-white/[0.05] text-gray-300">
                          {inc.sector}
                        </span>
                        <span
                          title={verif.basis}
                          className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded border ${
                            verif.tone === 'emerald'
                              ? 'bg-[#10B981]/12 border-[#10B981]/35 text-[#10B981]'
                              : 'bg-[#F59E0B]/12 border-[#F59E0B]/35 text-[#F59E0B]'
                          }`}
                        >
                          {verif.level}
                        </span>
                        {wasUpdated && (
                          <span className="font-mono-tactical text-[10px] font-semibold px-2 py-0.5 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/35 text-[#38BDF8]">
                            NOV 18 STATUS UPDATE
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">
                        {inc.entity}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/?trace=inc-${inc.eventId.replace('#', '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#38BDF8]/35 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 font-mono-tactical text-[11px] text-[#38BDF8] transition"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>Trace Blast Radius</span>
                      </Link>
                      <span
                        className={`font-mono-tactical text-[11px] font-medium px-2.5 py-1 rounded border ${meta.badgeStyle}`}
                      >
                        {meta.shortLabel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 text-[13px]">
                    <div className="obsidian-surface rounded-lg p-3.5 space-y-1.5">
                      <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                        Operational Impact
                      </p>
                      <p className="text-gray-200 leading-relaxed">{inc.impact}</p>
                    </div>
                    <div className="obsidian-surface rounded-lg p-3.5 space-y-1.5">
                      <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                        Stated Cause / Forensic Vector
                      </p>
                      <p className="text-gray-200 leading-relaxed">{inc.vector}</p>
                    </div>
                    <div className="obsidian-surface rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1.5">
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
        ) : (
          /* Display Mode 2: Dense Executive Comparison Matrix */
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="bg-[#0F1624] border-b border-white/10 font-mono-tactical text-[11px] uppercase text-gray-300">
                  <th className="px-3.5 py-3">Event / Window</th>
                  <th className="px-3.5 py-3">Entity &amp; Sector</th>
                  <th className="px-3.5 py-3">Class</th>
                  <th className="px-3.5 py-3">Forensic Vector</th>
                  <th className="px-3.5 py-3">Current Status &amp; Sources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08] bg-[#0A0E17]/60">
                {filteredIncidents.map((inc) => {
                  const meta = CLASSIFICATION_META[inc.classification];
                  const wasUpdated = updatedEventIds.has(inc.eventId);
                  return (
                    <tr
                      key={inc.eventId}
                      id={`incident-card-${inc.eventId.replace('#', '')}`}
                      className="hover:bg-white/[0.03] align-top"
                    >
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <div className="font-mono-tactical font-semibold text-white">
                          {inc.eventId}
                        </div>
                        <div className="font-mono-tactical text-[11px] text-gray-400 mt-0.5">
                          {inc.window.split('(')[0].trim()}
                        </div>
                        {wasUpdated && (
                          <span className="inline-block mt-1 font-mono-tactical text-[9px] px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8]">
                            NOV 18 UPD
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3.5">
                        <div className="font-semibold text-white">{inc.entity}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{inc.sector}</div>
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded border ${meta.badgeStyle}`}
                        >
                          {meta.shortLabel}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-gray-200 leading-relaxed max-w-xs">
                        {inc.vector}
                      </td>
                      <td className="px-3.5 py-3.5 text-gray-200 leading-relaxed max-w-sm space-y-1.5">
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
        className="glass-panel rounded-2xl p-6 space-y-5 scroll-mt-nav"
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

            <p className="text-[13px] text-gray-300 leading-relaxed">
              <strong className="text-white">Forensic Interpretation:</strong> At{' '}
              {weeklyRate.toFixed(1)} baseline failures/week, there is a{' '}
              <span className="font-mono-tactical text-white font-semibold">
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
      <section
        id="sub-ip-section"
        aria-labelledby="sub-ip-heading"
        className="space-y-4 scroll-mt-nav"
      >
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
                <p className="text-[13px] text-gray-200 leading-relaxed">{item.summary}</p>
                <div className="pt-2.5 border-t border-white/[0.08] text-xs sm:text-[13px]">
                  <span className="font-mono-tactical text-xs text-[#10B981]">
                    DEFENSIVE POSTURE:{' '}
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
        heading="Complete Forensic Case Studies — FAA Ground Stop, NSANet, Apple/Marriott & Poison-Pill Hypothesis (Sec. 6 & 8)"
      />
    </div>
  );
}
