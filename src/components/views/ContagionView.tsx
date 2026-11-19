'use client';

import React, { useState } from 'react';
import {
  Scale,
  Network,
  Bot,
  ShieldAlert,
  Clock,
  Gavel,
  Building2,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { NarrativeAccordion } from '@/components/shell/NarrativeAccordion';
import { TacticalFigure } from '@/components/shell/TacticalFigure';
import { SectionNavStrip } from '@/components/shell/SectionNavStrip';
import { ComplianceClockSimulator } from '@/components/views/ComplianceClockSimulator';

const CONTAGION_NAV_ITEMS = [
  { id: 'gsib-flow-section', code: '01', label: 'Topology', badge: '3' },
  { id: 'ai-runs-section', code: '02', label: 'AI & ANT IPO' },
  { id: 'nsc-ladder-section', code: '03', label: 'Attribution' },
  { id: 'compliance-simulator-section', code: '04', label: 'Clock Sim' },
  { id: 'legal-clocks-section', code: '05', label: 'War Clauses' },
  { id: 'contagion-verbatim-section', code: '06', label: 'Verbatim' },
];

const CONTAGION_SCENARIOS = [
  {
    id: 'chase-zelle',
    badge: 'NOV. 16 CASE STUDY',
    title: 'G-SIB Counterparty Cascade (JPMorgan Chase → Zelle / Rival Banks)',
    coreStatus: 'Fedwire · CHIPS · DTCC Remained 100% Green',
    stage1: {
      tag: 'SINGLE-NODE ORIGIN (9:48 AM ET)',
      heading: 'JPMorgan Chase On-Premise Hardware Bug',
      body: 'On-premise hardware software bug + queued traffic re-crashes (~4,800+ reports; teller & Irving, TX ATMs impacted; JPM closed -2.3%).',
    },
    stage2: {
      tag: 'COUNTERPARTY SETTLEMENT RAIL',
      heading: 'Zelle / Early Warning Services (EWS) Opposite Leg',
      body: 'EWS core stayed 100% online, but because a G-SIB sits on the counterparty leg of U.S. P2P volume, transfers touching Chase stalled.',
    },
    stage3: {
      tag: 'MULTI-BANK ILLUSION',
      heading: 'Simultaneous Rival Bank Downdetector Spikes',
      body: 'BofA, Wells Fargo, U.S. Bank, Capital One, and Truist logged simultaneous outage spikes despite 100% healthy internal bank cores.',
    },
    circuitBreaker:
      'Overnight ACH/Zelle cleared cleanly; pre-stage counterparty queue status banners to suppress retail run psychology.',
  },
  {
    id: 'agentic-runs',
    badge: 'NOV. 16 FED GOV. BARR WARNING',
    title: 'Autonomous AI Cash-Management Runs Over $10M RTP / FedNow Rails',
    coreStatus: '24/7/365 Instant Settlement · Zero Weekend Cooling-Off',
    stage1: {
      tag: 'TELEMETRY / DEEPFAKE TRIGGER',
      heading: 'Outage Spike or Viral Rumor Ingestion',
      body: 'Autonomous AI treasury and retail agents ingest Downdetector spikes, BGP anomalies, or synthetic blackout videos off-hours.',
    },
    stage2: {
      tag: 'MACHINE-SPEED EXECUTION',
      heading: '$10M RTP / FedNow & Uncapped Stablecoin Rails',
      body: 'AI agents trigger synchronized sweeps up to $10M per transfer over 24/7 instant rails and stablecoin pools before ALCOs convene.',
    },
    stage3: {
      tag: 'LIQUIDITY & AI CREDIT SPIRAL',
      heading: 'Mid-Tier Deposit Drain & SPE Debt Repricing',
      body: 'Intraday HQLA drain collides with >$3.8T Big-7 debt + GPU SPEs (~15% private AI DC debt held by U.S. life insurers) and Anthropic’s Nov. 18 $83/share (>$1.4T cap) ANT IPO benchmark.',
    },
    circuitBreaker:
      'Enforce programmatic velocity circuit-breakers on API-initiated RTP/FedNow sweeps and pre-position Fed Standing Repo / Discount Window collateral.',
  },
  {
    id: 'dtcc-ficc',
    badge: 'DEC. 31, 2026 MANDATE CLIFF',
    title: 'SEC Mandatory U.S. Treasury Central Clearing Concentration (DTCC / FICC)',
    coreStatus: '~$550B / Day Eligible Cash Volume Concentrating Dec. 31',
    stage1: {
      tag: 'TELECOM / UTILITY NODE FAULT',
      heading: 'Carrier Storm or Core Gateway Outage',
      body: 'A hybrid routing flood (FAA-class) or non-bank core utility outage (FIS, Fiserv, ADP, or Change Healthcare-class gateway) hits a major FICC clearing member or carrier.',
    },
    stage2: {
      tag: 'CENTRAL CLEARING BOTTLENECK',
      heading: 'DTCC / FICC Intraday Margin & Cash Settlement',
      body: 'With ~$550B/day in cash Treasury trades mandated onto FICC on Dec. 31, 2026 (and repo on June 30, 2027), single-node connectivity loss traps bilateral collateral and variation margin.',
    },
    stage3: {
      tag: 'REPO & TREASURY FREEZE',
      heading: 'Cross-Market Intraday Liquidity Dislocation',
      body: 'Delayed Treasury settlement propagates into money-market funds, tri-party repo, and sovereign dealer balance sheets within minutes during U.S. market hours.',
    },
    circuitBreaker:
      'Mandate diverse multi-carrier dark-fiber paths into FICC, out-of-band margin settlement playbooks, and active-active clearing member failover validation prior to Dec. 31.',
  },
] as const;

const ATTRIBUTION_LADDER = [
  {
    rung: 'STEP 01',
    title: 'Private Threat-Intelligence Proxy Publication',
    actors: 'Commercial Vendors / Sector ISACs',
    purpose:
      'Publish technical IOCs, malware hashes, and network signatures via private-sector researchers without triggering sovereign diplomatic escalation or revealing SIGINT collection.',
  },
  {
    rung: 'STEP 02',
    title: 'Joint CISA / NSA / FBI Technical TTP Advisories',
    actors: 'CISA · NSA · FBI · Five Eyes Cyber Centers',
    purpose:
      'Issue co-sealed defensive advisories (e.g., AA24-038A Volt Typhoon, AA26-097A Iranian OT/PLC) detailing living-off-the-land TTPs, port exposures, and configuration audits.',
  },
  {
    rung: 'STEP 03',
    title: 'DOJ Criminal Indictments & OFAC Financial Sanctions',
    actors: 'U.S. Dept. of Justice · Treasury OFAC',
    purpose:
      'Unseal federal indictments, seize operational domains (e.g., Operation Lonestar Roundup), and sanction front companies once attribution satisfies formal multi-agency evidentiary standards.',
  },
  {
    rung: 'STEP 04',
    title: 'Formal White House / Five Eyes / NATO State Attribution',
    actors: 'White House NSC · Allied Heads of State (+ USCYBERCOM Defend Forward)',
    purpose:
      'Strategic political attribution paired with diplomatic/military response—while U.S. Cyber Command executes covert "Defend Forward" infrastructure disruptions regardless of public statements.',
  },
] as const;

const LEGAL_CLOCKS = [
  {
    clock: '4 Hours',
    regime: 'U.S. Banking Service Provider Rule',
    scope: 'Third-party core/telecom vendors notify affected U.S. banking organizations',
    cyberOnly: 'NO — Covers non-cyber "technical bug" outages disrupting material operations',
    color: 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10',
  },
  {
    clock: '4 Hours',
    regime: 'EU DORA Initial Notification & CTPP Oversight',
    scope:
      'EU financial entities + 19 designated Critical ICT Third-Party Providers (Microsoft, AWS, Google Cloud, Equinix, FIS); fines up to 1% of avg daily global turnover for up to 6 months',
    cyberOnly: 'NO — Enforces 4h initial, 72h intermediate, and 1-month final root-cause reports',
    color: 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10',
  },
  {
    clock: '24 Hours',
    regime: 'CISA CIRCIA Ransomware Payment Mandate',
    scope: 'Covered critical infrastructure entities disbursing ransom payments',
    cyberOnly: 'YES — Mandatory federal reporting within 24h of payment',
    color: 'border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10',
  },
  {
    clock: '36 Hours',
    regime: 'OCC / Federal Reserve / FDIC Computer-Security Notification',
    scope: 'U.S. banking organizations experiencing material disruption to banking operations',
    cyberOnly: 'NO — Triggered by destructive malware OR non-malicious hardware/software bugs',
    color: 'border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10',
  },
  {
    clock: '72 Hours / 4 Days',
    regime: 'CISA CIRCIA Cyber Incident (72h) & SEC Form 8-K Item 1.05 (4 Bus. Days)',
    scope: 'Covered critical infrastructure & U.S. public issuers after materiality determination',
    cyberOnly: 'Materiality & investor disclosure scrutiny during multi-day restoration',
    color: 'border-[#38BDF8]/40 text-[#38BDF8] bg-[#38BDF8]/10',
  },
] as const;

export function ContagionView() {
  const { bundle } = usePortal();
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const [selectedRung, setSelectedRung] = useState<number>(1);
  const sec7 = bundle.sections.narrativeSections.filter((s) => s.number === 7);

  const activeScenario = CONTAGION_SCENARIOS[selectedScenarioIdx];

  return (
    <div className="space-y-7">
      {/* Edge-to-Edge Docked In-Page Section Rail */}
      <SectionNavStrip items={CONTAGION_NAV_ITEMS} ariaLabel="Contagion & Legal sections" />

      {/* Header */}
      <section className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tactical text-[11px] text-[#38BDF8]">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            <span>SECTION 7 · FINANCIAL CONTAGION, ATTRIBUTION &amp; LEGAL MATRIX</span>
          </div>
          <span className="px-2 py-0.5 rounded-sm bg-[#38BDF8]/12 border border-[#38BDF8]/35 text-[#38BDF8]">
            NOV 18: ANT PRICED $83/SH (&gt;$1.4T CAP)
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
          G-SIB Cascades, $10M Agentic Runs, War Clauses &amp; Statutory Clocks
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
          Single-node counterparty panics, 24/7 AI deposit runs colliding with Anthropic&rsquo;s{' '}
          <code>ANT</code> IPO benchmark and Dec. 31 DTCC/FICC central clearing, plus LMA war
          exclusions and Judge Rakoff&rsquo;s AI privilege waiver.
        </p>
      </section>

      {/* Editorial Plate 05 */}
      <TacticalFigure
        src="/images/contagion-clearing-vault.jpg"
        alt="Isometric dark-glass architectural visualization of concentric financial counterparty nodes and cyan liquidity conduits converging into a central amber clearing core with crimson circuit-breaker gates"
        plateId="PLATE 05"
        title="Systemic Clearing Hub Concentration, Instant Liquidity Conduits & Counterparty Circuit-Breakers"
        domainBadge="SECTIONS 7.1, 7.4 & 7.5 · FINANCIAL INFRASTRUCTURE"
        priority
        metrics={[
          { label: 'Dec. 31 FICC Cliff', value: '~$550B / Day Cash Treasuries', tone: 'amber' },
          { label: 'Instant Run Rails', value: '$10M RTP / FedNow Single Cap', tone: 'crimson' },
          { label: 'Nov. 18 ANT IPO', value: 'Priced $83/sh (>$1.4T Cap)', tone: 'cyan' },
          { label: 'Mandatory Clocks', value: '4h DORA / 36h OCC Non-Cyber', tone: 'emerald' },
        ]}
        caption="Modern clearinghouses (Fedwire, CHIPS, DTCC/FICC) and P2P rails (Zelle/EWS, RTP, FedNow) concentrate counterparty settlement onto shared telecom and on-premise hardware layers—meaning a single G-SIB or utility node stall cascades across healthy peer institutions within minutes."
      />

      {/* Interactive 3-Scenario Contagion Topology Simulator */}
      <section
        id="gsib-flow-section"
        aria-labelledby="gsib-flow-heading"
        className="glass-card rounded-lg p-5 space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#F59E0B]" />
              <h2
                id="gsib-flow-heading"
                className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
              >
                Sec. 7.4–7.5 · Systemic Contagion Topology (3 Pathways)
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Switch between Chase/Zelle, autonomous $10M AI sweeps, and the Dec. 31 FICC cliff.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              '1. Chase → Zelle',
              '2. AI $10M Run',
              '3. Dec. 31 FICC Cliff',
            ].map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedScenarioIdx(idx)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border cursor-pointer transition ${
                  selectedScenarioIdx === idx
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono-tactical text-[10px] text-[#F59E0B]">
              {activeScenario.badge}
            </span>
            <h3 className="text-base font-semibold text-white mt-0.5">
              {activeScenario.title}
            </h3>
          </div>
          <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded-sm bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
            {activeScenario.coreStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-11 gap-2.5 items-stretch text-xs sm:text-[13px]">
          {/* Origin Node */}
          <div className="lg:col-span-3 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/35 p-3.5 space-y-1.5">
            <span className="font-mono-tactical text-[10px] text-[#EF4444] uppercase">
              {activeScenario.stage1.tag}
            </span>
            <h4 className="text-sm font-semibold text-white">{activeScenario.stage1.heading}</h4>
            <p className="text-gray-200 leading-relaxed">{activeScenario.stage1.body}</p>
          </div>

          <div className="flex lg:hidden items-center justify-center py-0.5 text-[#F59E0B]">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-[#F59E0B]">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Rail Bottleneck */}
          <div className="lg:col-span-3 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/35 p-3.5 space-y-1.5">
            <span className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase">
              {activeScenario.stage2.tag}
            </span>
            <h4 className="text-sm font-semibold text-white">{activeScenario.stage2.heading}</h4>
            <p className="text-gray-200 leading-relaxed">{activeScenario.stage2.body}</p>
          </div>

          <div className="flex lg:hidden items-center justify-center py-0.5 text-[#38BDF8]">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-[#38BDF8]">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Downstream Perception */}
          <div className="lg:col-span-3 rounded-md bg-[#38BDF8]/10 border border-[#38BDF8]/35 p-3.5 space-y-1.5">
            <span className="font-mono-tactical text-[10px] text-[#38BDF8] uppercase">
              {activeScenario.stage3.tag}
            </span>
            <h4 className="text-sm font-semibold text-white">{activeScenario.stage3.heading}</h4>
            <p className="text-gray-200 leading-relaxed">{activeScenario.stage3.body}</p>
          </div>
        </div>

        <div className="obsidian-surface rounded-md px-3.5 py-2.5 text-xs sm:text-[13px] text-gray-200 leading-relaxed">
          <span className="font-mono-tactical text-[11px] text-[#10B981]">
            CIRCUIT-BREAKER:{' '}
          </span>
          {activeScenario.circuitBreaker}
        </div>
      </section>

      {/* Visual Flow 2: Autonomous AI Bank Runs + Anthropic S-1 IPO + Dec 31 Treasury Clearing Cliff */}
      <div id="ai-runs-section" className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-nav">
        <section className="glass-card rounded-lg p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#EF4444]" />
            <h2 className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white">
              Sec. 7.5 · Agentic Runs, Circular AI Debt &amp; ANT IPO Benchmark
            </h2>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-300 leading-relaxed">
            Fed Gov. Michael Barr (Nov. 16) warned autonomous AI cash agents can trigger
            machine-speed runs on 24/7 rails—colliding with circular AI infrastructure leverage as
            Anthropic (<code>ANT</code>) priced above range at <strong>$83/share</strong> on Nov. 18
            (exceeding <strong>$1.4T</strong> market cap ahead of its Nov. 19 Nasdaq debut).
          </p>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="obsidian-surface rounded-md p-3">
              <p className="font-mono-tactical text-base sm:text-lg font-semibold text-[#EF4444]">
                $10M / Tx
              </p>
              <p className="text-gray-200 font-medium">RTP &amp; FedNow Single Cap</p>
              <p className="text-[11px] text-gray-400 mt-0.5">+ Uncapped 24/7 stablecoin rails</p>
            </div>
            <div className="obsidian-surface rounded-md p-3">
              <p className="font-mono-tactical text-base sm:text-lg font-semibold text-[#F59E0B]">
                $83 / sh
              </p>
              <p className="text-gray-200 font-medium">Anthropic (ANT) Priced Nov. 18</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                &gt;$1.4T cap · Nov. 19 Nasdaq debut
              </p>
            </div>
            <div className="obsidian-surface rounded-md p-3">
              <p className="font-mono-tactical text-base sm:text-lg font-semibold text-white">
                &gt;$3.8T Total
              </p>
              <p className="text-gray-200 font-medium">Big-7 + Off-Sheet GPU SPEs</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                ~15% private AI DC debt at life insurers
              </p>
            </div>
            <div className="obsidian-surface rounded-md p-3">
              <p className="font-mono-tactical text-base sm:text-lg font-semibold text-[#38BDF8]">
                $104.04B Loss
              </p>
              <p className="text-gray-200 font-medium">ANT 9M 2026 ($33.24B Rev)</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                &gt;$430M perp OI · 87% Fed AI risk rank
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-lg p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white">
              Dec. 31, 2026 SEC Treasury Clearing Cliff &amp; Core Utilities
            </h2>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-300 leading-relaxed">
            Central clearing concentration accelerates on <strong>December 31, 2026</strong>, when
            eligible U.S. Treasury cash trades mandate onto DTCC&rsquo;s FICC—followed by repo
            transactions on <strong>June 30, 2027</strong>.
          </p>

          <div className="space-y-2 text-xs sm:text-[13px]">
            <div className="obsidian-surface rounded-md p-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-white">DTCC / FICC Cash Treasury Mandate</p>
                <p className="text-[11px] text-gray-400">
                  Interdealer &amp; ATS cash volume concentrating Dec. 31
                </p>
              </div>
              <span className="font-mono-tactical text-sm font-semibold text-[#F59E0B] shrink-0">
                ~$550B / day
              </span>
            </div>
            <div className="obsidian-surface rounded-md p-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-white">Phase 2 Treasury Repo Mandate</p>
                <p className="text-[11px] text-gray-400">
                  Intraday margin &amp; telecom single-point exposure
                </p>
              </div>
              <span className="font-mono-tactical text-xs text-[#38BDF8] shrink-0">
                June 30, 2027
              </span>
            </div>
            <div className="obsidian-surface rounded-md p-3">
              <p className="font-semibold text-white">Non-Bank Core Utility Concentration</p>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Single-node faults at <strong>FIS, Fiserv, ADP</strong>, or Change Healthcare-class
                gateways (OFR Brief 24-05) stall multi-bank clearing without G-SIB compromise.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 4-Step NSC Cyber Attribution Escalation Ladder */}
      <section
        id="nsc-ladder-section"
        aria-labelledby="nsc-ladder-heading"
        className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#38BDF8]" />
            <h2
              id="nsc-ladder-heading"
              className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Sec. 7.2 · U.S. Cyber Attribution Doctrine (4-Step Ladder)
            </h2>
          </div>
          <span className="font-mono-tactical text-[11px] text-gray-400">
            Technical Forensics ≠ Strategic White House Disclosure
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ATTRIBUTION_LADDER.map((item, idx) => {
            const active = selectedRung === idx;
            return (
              <button
                key={item.rung}
                type="button"
                onClick={() => setSelectedRung(idx)}
                className={`text-left rounded-md p-3.5 border transition cursor-pointer ${
                  active
                    ? 'surface-elevated border-[#38BDF8]/60'
                    : 'glass-card border-white/[0.08]'
                }`}
              >
                <span className="font-mono-tactical text-[11px] text-[#38BDF8]">{item.rung}</span>
                <h3 className="text-xs sm:text-sm font-semibold text-white mt-1 leading-snug">
                  {item.title}
                </h3>
                <p className="font-mono-tactical text-[10px] text-gray-400 mt-1.5">{item.actors}</p>
              </button>
            );
          })}
        </div>

        <div className="obsidian-surface rounded-md p-4 text-xs sm:text-[13px] space-y-2">
          <p className="font-mono-tactical text-[11px] text-[#38BDF8]">
            {ATTRIBUTION_LADDER[selectedRung].rung} —{' '}
            {ATTRIBUTION_LADDER[selectedRung].title.toUpperCase()}
          </p>
          <p className="text-gray-200 leading-relaxed">
            {ATTRIBUTION_LADDER[selectedRung].purpose}
          </p>
          <p className="text-xs text-gray-400 pt-2 border-t border-white/[0.07] leading-relaxed">
            <strong className="text-gray-200">Why Disclosure Lags:</strong> (1) Protect SIGINT
            implants; (2) Prevent panic &amp; copycat exploitation; (3) Meet formal multi-agency
            evidentiary thresholds; (4) Frame ambiguous hybrid faults around modernization budgets.
          </p>
        </div>
      </section>

      {/* Interactive Incident Reporting & Privilege Clock Simulator */}
      <ComplianceClockSimulator />

      {/* LMA War Exclusions vs Parametric Cloud Bonds + Non-Cyber Legal Clocks & Rakoff AI Privilege */}
      <div
        id="legal-clocks-section"
        className="grid grid-cols-1 lg:grid-cols-12 gap-4 scroll-mt-nav"
      >
        <section className="lg:col-span-5 glass-card rounded-lg p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white">
              Sec. 7.3 &amp; 7.6 · War Clauses, Fee Caps &amp; AI Privilege
            </h2>
          </div>

          <div className="space-y-2.5 text-xs sm:text-[13px]">
            <div className="obsidian-surface rounded-md p-3.5 space-y-1">
              <p className="font-semibold text-white">
                Merck NotPetya ($1.4B) vs. Modern LMA War Clauses
              </p>
              <p className="text-gray-300 leading-relaxed">
                NJ courts (May 2023) limited legacy war clauses to kinetic conflict. Rewritten LMA
                clauses now exclude peacetime state attacks causing &ldquo;major detrimental
                impact&rdquo; via <strong>&ldquo;objective inference&rdquo;</strong>—even without
                White House attribution.
              </p>
            </div>

            <div className="obsidian-surface rounded-md p-3.5 space-y-1">
              <p className="font-semibold text-white">
                Vendor Fee Caps &amp; Parametric Cloud Cat Bonds
              </p>
              <p className="text-gray-300 leading-relaxed">
                Cloud MSAs cap vendor liability at monthly fees and cyber CBI excludes FAA/utility
                outages. Firms transfer tail risk via parametric cloud bonds (Hannover Re{' '}
                <strong>$35M Cumulus Re</strong>; Beazley <strong>$300M PoleStar Re</strong>).
              </p>
            </div>

            <div className="rounded-md bg-[#EF4444]/10 border border-[#EF4444]/35 p-3.5 space-y-1">
              <p className="font-mono-tactical text-[10px] text-[#EF4444] uppercase font-semibold">
                Judge Jed S. Rakoff — Feb. 2026 S.D.N.Y. AI Privilege Waiver
              </p>
              <p className="text-gray-200 leading-relaxed">
                Building on <em>Capital One</em> &amp; <em>Clark Hill</em>, Judge Rakoff&rsquo;s
                Feb. 2026 opinion held consumer commercial AI outputs are non-privileged and
                pasting confidential legal/forensic drafts <strong>waives privilege</strong>.
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 glass-card rounded-lg p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#EF4444]" />
            <h2 className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white">
              Statutory &amp; Non-Cyber Operational Notification Matrix
            </h2>
          </div>

          <div className="space-y-2">
            {LEGAL_CLOCKS.map((item, idx) => (
              <div
                key={idx}
                className="obsidian-surface rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-[13px]"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono-tactical text-[11px] font-semibold px-2 py-0.5 rounded-sm border ${item.color}`}
                    >
                      {item.clock}
                    </span>
                    <span className="font-semibold text-white">{item.regime}</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{item.scope}</p>
                  <p className="font-mono-tactical text-[10px] text-gray-400">
                    Cyber-Only? {item.cyberOnly}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Verbatim Section 7 Narrative */}
      <NarrativeAccordion
        id="contagion-verbatim-section"
        sections={sec7}
        heading="Complete Verbatim Narrative — Section 7 (Financial Contagion, Attribution & War Exclusions)"
      />
    </div>
  );
}
