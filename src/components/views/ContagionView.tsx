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
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { NarrativeAccordion } from '@/components/shell/NarrativeAccordion';
import { TacticalFigure } from '@/components/shell/TacticalFigure';

const CONTAGION_SCENARIOS = [
  {
    id: 'chase-zelle',
    badge: 'LIVE NOV. 16 CASE STUDY',
    title: 'G-SIB Counterparty Cascade (JPMorgan Chase → Zelle / Rival Banks)',
    coreStatus: 'Fedwire · CHIPS · DTCC Remained 100% Green',
    stage1: {
      tag: 'SINGLE-NODE ORIGIN (9:48 AM ET)',
      heading: 'JPMorgan Chase On-Premise Hardware Bug',
      body: 'Software bug in on-premise hardware systems + queued peak traffic secondary re-crashes (~4,800+ reports; branch teller & Irving, TX ATMs impacted; JPM closed -2.3%).',
    },
    stage2: {
      tag: 'COUNTERPARTY SETTLEMENT RAIL',
      heading: 'Zelle / Early Warning Services (EWS) Opposite Leg',
      body: 'EWS core platform stayed 100% online, but because a G-SIB sits on the counterparty leg of massive U.S. P2P volume, transfers targeting or originating at Chase stalled.',
    },
    stage3: {
      tag: 'MULTI-BANK ILLUSION',
      heading: 'Simultaneous Rival Bank Downdetector Spikes',
      body: 'Customers at Bank of America, Wells Fargo, U.S. Bank, Capital One, and Truist reported simultaneous outages despite completely healthy internal bank cores.',
    },
    circuitBreaker:
      'Overnight ACH/Zelle batch reconciliation cleared cleanly into Tuesday morning; requires pre-staged counterparty queue status messaging to prevent retail run psychology.',
  },
  {
    id: 'agentic-runs',
    badge: 'NOV. 16 FED GOV. BARR WARNING',
    title: 'Autonomous AI Cash-Management Runs Over $10M RTP / FedNow Rails',
    coreStatus: '24/7/365 Instant Settlement · Zero Weekend Cooling-Off Window',
    stage1: {
      tag: 'TELEMETRY / DEEPFAKE TRIGGER',
      heading: 'Outage Spike or Viral Rumor Ingestion',
      body: 'Autonomous AI treasury and retail agents ingest real-time Downdetector spikes, BGP anomalies, or synthetic blackout videos during off-hours or federal EAS tests.',
    },
    stage2: {
      tag: 'MACHINE-SPEED EXECUTION',
      heading: '$10M RTP / FedNow & Uncapped Stablecoin Rails',
      body: 'AI agents initiate synchronized programmatic sweeps up to $10M per transfer over 24/7 instant rails alongside uncapped stablecoin liquidity pools before human ALCOs convene.',
    },
    stage3: {
      tag: 'LIQUIDITY & AI CREDIT SPIRAL',
      heading: 'Mid-Tier Deposit Drain & SPE Debt Repricing',
      body: 'Rapid intraday HQLA depletion collides with >$3.8T in Big-7 tech debt + off-balance-sheet GPU SPEs (~15% of private AI data-center debt held by U.S. life insurers).',
    },
    circuitBreaker:
      'Implement programmatic velocity circuit-breakers on API-initiated RTP/FedNow outbound sweeps and pre-positioned Federal Reserve Standing Repo / Discount Window collateral.',
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
      'Unseal federal indictments, seize operational domains (e.g., Operation Lonestar Roundup), and sanction front companies once attribution satisfies ICD 203 high-confidence evidentiary standards.',
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
    <div className="space-y-9">
      {/* Header */}
      <section className="glass-panel rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2 font-mono-tactical text-xs text-[#38BDF8]">
          <Scale className="w-4 h-4" />
          <span>SECTION 7 · FINANCIAL CONTAGION, ATTRIBUTION DOCTRINE &amp; LEGAL MATRIX</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          G-SIB Counterparty Cascades, $10M Agentic Bank Runs, War Exclusions &amp; Legal Clocks
        </h1>
        <p className="text-sm text-gray-300 max-w-4xl leading-relaxed">
          Analyzing how single-node hardware failures trigger multi-bank retail panics, why
          autonomous AI agents over $10M RTP/FedNow rails and Dec. 31 DTCC/FICC Treasury clearing
          concentrate systemic liquidity risk, and how LMA war exclusions and Judge Rakoff&rsquo;s
          Feb. 2026 AI privilege waiver reshape incident response.
        </p>
      </section>

      {/* Editorial Plate 05: Systemic Financial Clearing Core & Circuit-Breaker Architecture */}
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
          { label: 'AI Debt Leverage', value: '>$800B Debt + >$3T GPU SPEs', tone: 'cyan' },
          { label: 'Mandatory Clocks', value: '4h DORA / 36h OCC Non-Cyber', tone: 'emerald' },
        ]}
        caption="Modern clearinghouses (Fedwire, CHIPS, DTCC/FICC) and P2P rails (Zelle/EWS, RTP, FedNow) concentrate counterparty settlement onto shared telecom and on-premise hardware layers—meaning a single G-SIB or utility node stall cascades across healthy peer institutions within minutes."
      />

      {/* Interactive 3-Scenario Contagion Topology Simulator */}
      <section aria-labelledby="gsib-flow-heading" className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#F59E0B]" />
              <h2
                id="gsib-flow-heading"
                className="text-sm font-mono-tactical uppercase tracking-wider text-white"
              >
                Sec. 7.4–7.5 · Interactive Systemic Contagion Topology Explorer (3 Pathways)
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Switch between Monday&rsquo;s live Chase/Zelle cascade, autonomous AI deposit flights,
              and the Dec. 31 DTCC/FICC central clearing mandate.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              '1. Chase → Zelle Cascade',
              '2. AI $10M RTP/FedNow Run',
              '3. Dec. 31 DTCC/FICC Cliff',
            ].map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedScenarioIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical border cursor-pointer transition ${
                  selectedScenarioIdx === idx
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono-tactical text-[11px] text-[#F59E0B]">
              {activeScenario.badge}
            </span>
            <h3 className="text-base font-semibold text-white mt-0.5">{activeScenario.title}</h3>
          </div>
          <span className="font-mono-tactical text-xs px-2.5 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
            {activeScenario.coreStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-stretch text-xs">
          {/* Origin Node */}
          <div className="lg:col-span-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/40 p-4 space-y-2">
            <span className="font-mono-tactical text-[10px] text-[#EF4444] uppercase">
              {activeScenario.stage1.tag}
            </span>
            <h4 className="text-sm font-semibold text-white">{activeScenario.stage1.heading}</h4>
            <p className="text-gray-300 leading-relaxed">{activeScenario.stage1.body}</p>
          </div>

          <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-[#F59E0B]">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Rail Bottleneck */}
          <div className="lg:col-span-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/40 p-4 space-y-2">
            <span className="font-mono-tactical text-[10px] text-[#F59E0B] uppercase">
              {activeScenario.stage2.tag}
            </span>
            <h4 className="text-sm font-semibold text-white">{activeScenario.stage2.heading}</h4>
            <p className="text-gray-300 leading-relaxed">{activeScenario.stage2.body}</p>
          </div>

          <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-[#38BDF8]">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Downstream Perception */}
          <div className="lg:col-span-3 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/35 p-4 space-y-2">
            <span className="font-mono-tactical text-[10px] text-[#38BDF8] uppercase">
              {activeScenario.stage3.tag}
            </span>
            <h4 className="text-sm font-semibold text-white">{activeScenario.stage3.heading}</h4>
            <p className="text-gray-300 leading-relaxed">{activeScenario.stage3.body}</p>
          </div>
        </div>

        <div className="obsidian-surface rounded-xl px-4 py-3 text-xs text-gray-300">
          <span className="font-mono-tactical text-[#10B981]">CIRCUIT-BREAKER &amp; CONTAINMENT: </span>
          {activeScenario.circuitBreaker}
        </div>
      </section>

      {/* Visual Flow 2: Autonomous AI Bank Runs + Dec 31 Treasury Clearing Cliff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#EF4444]" />
            <h2 className="text-sm font-mono-tactical uppercase tracking-wider text-white">
              Sec. 7.5 · Autonomous AI Bank Runs ($10M Rails) &amp; Circular AI Debt
            </h2>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            On Nov. 16, 2026, Fed Gov. Michael Barr warned that autonomous AI cash-management agents
            reacting to real-time outage or social telemetry can trigger machine-speed deposit runs
            across 24/7/365 instant rails before human risk committees convene.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-lg font-semibold text-[#EF4444]">$10M / Tx</p>
              <p className="text-gray-200 font-medium">RTP &amp; FedNow Single-Transfer Cap</p>
              <p className="text-[11px] text-gray-400 mt-0.5">+ Uncapped 24/7 stablecoin rails</p>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-lg font-semibold text-[#F59E0B]">87% Consensus</p>
              <p className="text-gray-200 font-medium">Fed Financial Vulnerability Survey</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Ranked AI top systemic risk</p>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-lg font-semibold text-white">&gt;$3.8T Total</p>
              <p className="text-gray-200 font-medium">Big-7 Tech Balance + SPE GPU Debt</p>
              <p className="text-[11px] text-gray-400 mt-0.5">&gt;$800B debt + &gt;$3T off-sheet</p>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-mono-tactical text-lg font-semibold text-[#38BDF8]">~15% Held</p>
              <p className="text-gray-200 font-medium">U.S. Life Insurer AI Data-Center Debt</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Ahead of $1.5T+ Anthropic IPO</p>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-sm font-mono-tactical uppercase tracking-wider text-white">
              Dec. 31, 2026 SEC Treasury Clearing Cliff &amp; Core Utilities
            </h2>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Structural clearinghouse concentration accelerates on <strong>December 31, 2026</strong>,
            when the SEC&rsquo;s mandatory central clearing rule for eligible U.S. Treasury cash
            trades goes live at DTCC&rsquo;s Fixed Income Clearing Corporation (FICC), followed by
            repo transactions on <strong>June 30, 2027</strong>.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="obsidian-surface rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">DTCC / FICC Cash Treasury Mandate</p>
                <p className="text-gray-400">Interdealer &amp; ATS cash volume concentrating Dec. 31</p>
              </div>
              <span className="font-mono-tactical text-sm font-semibold text-[#F59E0B]">
                ~$550B / day
              </span>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Phase 2 Treasury Repo Mandate</p>
                <p className="text-gray-400">Intraday margin &amp; telecom single-point exposure</p>
              </div>
              <span className="font-mono-tactical text-xs text-[#38BDF8]">June 30, 2027</span>
            </div>
            <div className="obsidian-surface rounded-xl p-3.5">
              <p className="font-semibold text-white">Non-Bank Core Utility Concentration</p>
              <p className="text-gray-400 mt-0.5">
                Single-node technical faults at <strong>FIS, Fiserv, ADP</strong>, or Change
                Healthcare-class clearing gateways (OFR Brief 24-05) freeze multi-institution
                settlement without direct G-SIB compromise.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 4-Step NSC Cyber Attribution Escalation Ladder */}
      <section aria-labelledby="nsc-ladder-heading" className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#38BDF8]" />
            <h2
              id="nsc-ladder-heading"
              className="text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Sec. 7.2 · U.S. National Security Cyber Attribution Doctrine (4-Step Escalation Ladder)
            </h2>
          </div>
          <span className="font-mono-tactical text-xs text-gray-400">
            Technical Attribution (ICD 203) ≠ Strategic White House Disclosure
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {ATTRIBUTION_LADDER.map((item, idx) => {
            const active = selectedRung === idx;
            return (
              <button
                key={item.rung}
                type="button"
                onClick={() => setSelectedRung(idx)}
                className={`text-left rounded-xl p-4 border transition cursor-pointer ${
                  active
                    ? 'bg-[#111827] border-[#38BDF8]/60'
                    : 'glass-card border-white/10'
                }`}
              >
                <span className="font-mono-tactical text-xs text-[#38BDF8]">{item.rung}</span>
                <h3 className="text-sm font-semibold text-white mt-1 leading-snug">{item.title}</h3>
                <p className="font-mono-tactical text-[10px] text-gray-400 mt-2">{item.actors}</p>
              </button>
            );
          })}
        </div>

        <div className="obsidian-surface rounded-xl p-4 text-xs space-y-2">
          <p className="font-mono-tactical text-[#38BDF8]">
            {ATTRIBUTION_LADDER[selectedRung].rung} OPERATIONAL MECHANISM —{' '}
            {ATTRIBUTION_LADDER[selectedRung].title.toUpperCase()}
          </p>
          <p className="text-gray-200 leading-relaxed">
            {ATTRIBUTION_LADDER[selectedRung].purpose}
          </p>
          <p className="text-gray-400 pt-2 border-t border-white/[0.07]">
            <strong className="text-gray-200">Why Washington Delays Public Attribution:</strong> (1)
            Protect counterintelligence/SIGINT implants; (2) Prevent public panic &amp; copycat
            exploitation of unpatched single points of failure; (3) Control escalation until ICD 203
            high-confidence standards are met; (4) Frame ambiguous hybrid failures around
            modernization appropriations.
          </p>
        </div>
      </section>

      {/* LMA War Exclusions vs Parametric Cloud Bonds + Non-Cyber Legal Clocks & Rakoff AI Privilege */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LMA War Exclusions */}
        <section className="lg:col-span-5 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-mono-tactical uppercase tracking-wider text-white">
              Sec. 7.3 &amp; 7.6 · War Exclusions, Fee Caps &amp; Rakoff AI Privilege Rule
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="obsidian-surface rounded-xl p-3.5 space-y-1">
              <p className="font-semibold text-white">
                Merck NotPetya Ruling ($1.4B) vs. Modern LMA Cyber War Clauses
              </p>
              <p className="text-gray-300 leading-relaxed">
                NJ Appellate courts (A-1879-21, May 2023) limited legacy war exclusions to kinetic
                hostilities. Insurers responded with rewritten LMA clauses excluding peacetime
                state-backed attacks causing &ldquo;major detrimental impact&rdquo; on state
                infrastructure—using <strong>&ldquo;objective inference&rdquo;</strong> forensics even
                when Washington stays silent.
              </p>
            </div>

            <div className="obsidian-surface rounded-xl p-3.5 space-y-1">
              <p className="font-semibold text-white">
                Vendor Fee Caps (Delta v. CrowdStrike) &amp; Parametric Cat Bonds
              </p>
              <p className="text-gray-300 leading-relaxed">
                Standard cloud MSAs cap vendor liability at monthly fees absent gross negligence, and
                cyber CBI excludes upstream FAA/utility shutdowns. Enterprises increasingly transfer
                tail risk via parametric cloud cover (Hannover Re <strong>$35M Cumulus Re 2026-1</strong>;
                Beazley <strong>$300M PoleStar Re 2026-1</strong>).
              </p>
            </div>

            <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/35 p-3.5 space-y-1">
              <p className="font-mono-tactical text-[11px] text-[#EF4444] uppercase font-semibold">
                Judge Jed S. Rakoff — Feb. 2026 S.D.N.Y. AI Privilege Waiver
              </p>
              <p className="text-gray-200 leading-relaxed">
                Post-incident forensic reports already face privilege denial (<em>Capital One</em>,{' '}
                <em>Clark Hill</em>). Under Judge Rakoff&rsquo;s Feb. 2026 written opinion, consumer
                commercial AI outputs are non-privileged and pasting confidential legal/forensic
                drafts into commercial AI tools <strong>waives attorney-client privilege</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Non-Cyber Regulatory Clocks */}
        <section className="lg:col-span-7 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#EF4444]" />
            <h2 className="text-sm font-mono-tactical uppercase tracking-wider text-white">
              Non-Cyber Operational &amp; Material Incident Compliance Clocks
            </h2>
          </div>

          <div className="space-y-2.5">
            {LEGAL_CLOCKS.map((item, idx) => (
              <div
                key={idx}
                className="obsidian-surface rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-tactical text-xs font-semibold px-2 py-0.5 rounded border ${item.color}`}
                    >
                      {item.clock}
                    </span>
                    <span className="font-semibold text-white">{item.regime}</span>
                  </div>
                  <p className="text-gray-300">{item.scope}</p>
                  <p className="font-mono-tactical text-[11px] text-gray-400">
                    Cyber-Only Trigger? {item.cyberOnly}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Verbatim Section 7 Narrative */}
      <NarrativeAccordion
        sections={sec7}
        heading="Complete Verbatim Narrative — Section 7 (Financial Contagion, Attribution & War Exclusions)"
      />
    </div>
  );
}
