'use client';

import React, { useState } from 'react';
import { Globe, Flame, Cpu, AlertOctagon, Columns2, ShieldOff, Landmark } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { NarrativeAccordion } from '@/components/shell/NarrativeAccordion';
import { RichTextWithCitations } from '@/components/shell/RichTextWithCitations';
import { TacticalFigure } from '@/components/shell/TacticalFigure';

const ESCALATION_WINDOWS = [
  {
    id: 'win-1',
    period: 'Late 2026 – 2027',
    title: 'Gray-Zone & Chokepoint Friction',
    severity: 'ACTIVE',
    details:
      'Intensified European interdictions of Russia’s sanction-evading "shadow fleet," Baltic GPS jamming and undersea cable sabotage, and continuous PLA blockade rehearsals around Taiwan alongside pre-Shenzhen summit mineral/chip friction.',
  },
  {
    id: 'win-2',
    period: '2027 Milestone',
    title: 'The "Davidson Window" & 21st CCP Congress',
    severity: 'CRITICAL',
    details:
      'Target year set by Xi Jinping for the PLA to achieve full operational capability to seize or blockade Taiwan—coinciding with the 21st CCP National Congress and active Russian combat-lesson/airborne C2 transfers.',
  },
  {
    id: 'win-3',
    period: '2027 – 2028',
    title: 'Russian Conventional Regeneration Window',
    severity: 'ELEVATED',
    details:
      'Earliest intelligence window in which a ceasefire or frozen conflict in Ukraine could allow Russia to reconstitute missile, drone, and artillery stocks to test NATO’s eastern flank (Baltic states or Suwałki Gap).',
  },
  {
    id: 'win-4',
    period: '2028 – 2030',
    title: 'U.S. Political Transition & Full Reconstitution',
    severity: 'HIGH',
    details:
      'Overlaps the 2028 U.S. presidential transition with Western upper-bound estimates for rebuilt Russian conventional capability—peak risk window for opportunistic two-front crises.',
  },
] as const;

const THEATER_TRIPWIRES = {
  'Indo-Pacific': [
    'Announcement of a maritime "customs quarantine" around Taiwan.',
    'Mobilization of civilian roll-on/roll-off (Ro-Ro) ferries in Fujian province.',
    'Preemptive cyber or counter-space strikes on U.S. homeland logistics grids (Volt Typhoon).',
  ],
  Europe: [
    'Armed Russian naval escorts challenging European boardings of shadow-fleet tankers.',
    'Sudden cessation of Ukraine hostilities without Western security guarantees.',
    'Military escalation in Transnistria or Baltic airspace/undersea corridors.',
  ],
  Joint: [
    'Direct Chinese shipments of complete lethal weapons platforms to Russia.',
    'Synchronized live-fire PLA–Russian drills simultaneous with Taiwan Strait or Baltic crises.',
  ],
} as const;

const PUTIN_ESSAY_CLAIMS = [
  {
    claim: 'Claim 1 — The "One People" Thesis',
    kremlin:
      'Asserts Russians, Ukrainians, and Belarusians are three branches of a single "triune Russian nation" rooted in medieval Kyivan Rus (9th–13th centuries).',
    critique:
      'Treats a loose medieval dynastic federation prior to modern nationhood as the exclusive patrimony of Moscow, ignoring centuries of divergent political, legal, and linguistic development.',
  },
  {
    claim: 'Claim 2 — Ukrainian Identity as a Foreign Plot',
    kremlin:
      'Revives 19th-century Tsarist theories claiming Ukrainian identity was engineered by Polish-Lithuanian and Austro-Hungarian elites.',
    critique:
      'Erases organic Ukrainian vernacular literature, civic movements, and distinct Cossack political traditions that persisted despite imperial bans.',
  },
  {
    claim: 'Claim 3 — 1654 Treaty of Pereyaslav as "Reunification"',
    kremlin:
      'Frames Hetman Bohdan Khmelnytsky’s 1654 military pact with Moscow against Poland as a permanent national reunification.',
    critique:
      'Omits that Cossack leaders treated the pact as conditional autonomy, followed by Tsarist centralization and 19th-century bans on Ukrainian publishing (Valuev Circular, Ems Ukaz).',
  },
  {
    claim: 'Claim 4 — Bolshevik "Robbery" of Russia',
    kremlin:
      'Claims Lenin’s Soviet administrative borders gifted Russian lands (Donbas, Novorossiya) to Ukraine: "Russia was robbed, indeed."',
    critique:
      'Ignores that Russia formally recognized Ukraine’s sovereign borders in the 1991 Belavezha Accords, 1994 Budapest Memorandum, and 1997 Friendship Treaty.',
  },
  {
    claim: 'Claim 5 — Modern Ukraine as an "Anti-Russia" Project',
    kremlin:
      'Contends Western powers hijacked post-2014 Ukraine as a military springboard, asserting Ukrainian sovereignty is possible "only in partnership with Russia."',
    critique:
      'Inverted cause and effect: pre-2014 Ukraine was constitutionally non-aligned until Russia annexed Crimea and invaded the Donbas.',
  },
];

const DETERRENCE_FAILURES = [
  {
    num: '01',
    title: 'Deepened European Energy Reliance',
    detail:
      'Approval of the Nord Stream 2 gas pipeline in 2015 signaled that key European capitals prioritized cheap Russian hydrocarbons over strategic decoupling after Crimea.',
  },
  {
    num: '02',
    title: 'Incremental Sanctions & $630B "Fortress Russia"',
    detail:
      'Gradual post-2014 sanctions gave Moscow 8 years to amass >$630B in FX and gold reserves, build domestic payment rails, and pivot trade toward China.',
  },
  {
    num: '03',
    title: 'Fragmented Western Signaling',
    detail:
      'The 2014–2015 Minsk Accords treated Moscow as a mediator rather than a belligerent; fluctuating NATO rhetoric and the chaotic Aug. 2021 Kabul withdrawal reinforced Kremlin perceptions of fatigue.',
  },
  {
    num: '04',
    title: 'Absence of Military Ambiguity',
    detail:
      'Explicit U.S. and NATO assurances before Feb. 2022 that allied troops would not fight inside non-member Ukraine removed direct military deterrence from Putin’s pre-invasion calculus.',
  },
  {
    num: '05',
    title: 'Ideology Over Economic Rationality',
    detail:
      'Western capitals assumed GDP contraction and oligarch asset freezes would deter invasion, misjudging Putin’s willingness to trade economic growth for Petrine empire-building.',
  },
] as const;

const LEGACY_CONDITIONS = [
  {
    cond: '1. Subjugation or Partition of Ukraine',
    req: 'Legal recognition of Crimea + 4 annexed oblasts, permanent demilitarized neutrality, and political subordination in Kyiv.',
    reality: 'Forged permanent Ukrainian national resistance and armed Western interoperability.',
  },
  {
    cond: '2. Rollback of NATO to 1997 Borders',
    req: 'Enforcing Dec. 2021 treaty ultimatums removing allied infrastructure from Poland and the Baltic states.',
    reality: 'Finland and Sweden joined NATO, doubling Russia’s direct land border with the alliance.',
  },
  {
    cond: '3. Post-Soviet Re-Integration',
    req: 'Completing "Union State" absorption of Belarus and reasserting hegemony across Central Asia and the South Caucasus.',
    reality: 'Chinese economic dominance in Central Asia and regional autonomy eroded Moscow’s monopoly.',
  },
  {
    cond: '4. Collapse of Western Resolve & Asset Unfreeze',
    req: 'Exhausting U.S./EU aid and unfreezing sovereign central bank reserves without Russian concessions.',
    reality: 'Accelerated multi-year European rearmament and long-term decoupling from Russian pipeline gas.',
  },
  {
    cond: '5. Domestic Endurance & Controlled Succession',
    req: 'Weathering severe wartime inflation, labor deficits, and massive casualties as Putin (age 74) advances into his late 70s.',
    reality: 'Turned Russia into an economic junior partner to China (GDP ~8–10x larger).',
  },
] as const;

const CHOKEPOINT_GAUGES = [
  {
    label: 'Global Raw Gallium Production Controlled by China',
    sub: 'Nov. 27, 2026 U.S. export-ban pause expiry · AESA radar / F-35 / AMDR exposure',
    pct: 98,
    display: '98%',
    color: '#EF4444',
  },
  {
    label: 'Active API Drug Master Files Held by China (45%) + India (43%)',
    sub: 'U.S. holds only 3% · 48 of top 100 critical U.S. hospital drugs rely on single-country KSMs',
    pct: 88,
    display: '88% vs 3% U.S.',
    color: '#EF4444',
  },
  {
    label: 'U.S. Post-Busan REE Compound Import Contraction',
    sub: 'Driven by unpaused April 2025 licensing on 7 heavy REEs · Jan. 10, 2027 0.1% waiver cliff',
    pct: 75,
    display: '-75% Drop',
    color: '#F59E0B',
  },
  {
    label: 'U.S. Drug Manufacturing Supply-Chain Visibility Gap (FDA)',
    sub: 'Lack of full upstream KSM facility visibility across U.S.-marketed medicines',
    pct: 63,
    display: '63% Opaque',
    color: '#F59E0B',
  },
  {
    label: 'Global Germanium Supply Controlled by China',
    sub: 'Essential for infrared night-vision optics, fiber optics, and space solar cells',
    pct: 60,
    display: '60%',
    color: '#38BDF8',
  },
] as const;

export function GeopoliticsView() {
  const { bundle } = usePortal();
  const [selectedWindow, setSelectedWindow] = useState<string>('win-1');
  const [selectedTheater, setSelectedTheater] =
    useState<keyof typeof THEATER_TRIPWIRES>('Indo-Pacific');
  const [arcTab, setArcTab] = useState<'crimea' | 'deterrence' | 'legacy'>('crimea');

  const geoSections = bundle.sections.narrativeSections.filter((s) => s.number <= 5);
  const sec1 = geoSections.find((s) => s.number === 1);
  const sec5 = geoSections.find((s) => s.number === 5);

  const bolshevikTable = sec1?.subsections
    .flatMap((sub) => sub.blocks)
    .find((b) => b.type === 'table')?.table;

  const mineralTable = sec5?.subsections
    .flatMap((sub) => sub.blocks)
    .find((b) => b.type === 'table')?.table;

  const activeWin =
    ESCALATION_WINDOWS.find((w) => w.id === selectedWindow) ?? ESCALATION_WINDOWS[0];

  return (
    <div className="space-y-9">
      {/* Header */}
      <section className="glass-panel rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2 font-mono-tactical text-xs text-[#38BDF8]">
          <Globe className="w-4 h-4" />
          <span>SECTIONS 1–5 · HISTORICAL &amp; GEOPOLITICAL STRATEGY ARC</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Ideological Reversal, Multi-Theater Attrition &amp; 2026–2030 Great-Power Chokepoints
        </h1>
        <p className="text-sm text-gray-300 max-w-4xl leading-relaxed">
          Contrasting early 20th-century Bolshevik &ldquo;Monopoly/Finance Capitalism&rdquo; theory
          with Vladimir Putin&rsquo;s anti-Bolshevik Petrine revanchism, the 2014 Crimea hybrid
          playbook and Western deterrence gaps, active U.S.–Iran attrition under{' '}
          <em>Operation Epic Fury</em>, and imminent Chinese critical mineral &amp; API supply-chain
          cliffs.
        </p>
      </section>

      {/* Editorial Plate 01: 1917 Vanguard Industrialism vs 2026 Maritime/Orbital Coercion */}
      <TacticalFigure
        src="/images/geopolitics-imperial-arc.jpg"
        alt="Editorial diptych contrasting early 20th-century industrial steelworks and constructivist geometry with modern satellite maritime trajectories and energy chokepoint telemetry"
        plateId="PLATE 01"
        title="Doctrinal Inversion: 1917 Anti-Imperial Vanguard Theory vs. 2021–2026 Petrine Territorial Revanchism"
        domainBadge="SECTIONS 1–4 · DOCTRINE & DETERRENCE"
        priority
        metrics={[
          { label: '1903–1917 Doctrine', value: 'Monopoly / Finance Critique', tone: 'amber' },
          { label: 'June 9, 2022 Shift', value: 'Petrine "Return & Reinforce"', tone: 'crimson' },
          { label: 'Strategic Backfire', value: '2x NATO Land Border (FI/SE)', tone: 'cyan' },
          { label: 'Bilateral Entente', value: '>90% RUB/CNY · 8–10x GDP Gap', tone: 'emerald' },
        ]}
        caption="Whereas Lenin’s 1916 Imperialism thesis attributed great-power war to financial-industrial cartels and codified nominal Soviet republic secession rights, Putin explicitly repudiates Lenin’s ethno-federal architecture in favor of 18th-century Petrine imperial restoration—forging permanent Ukrainian resistance and junior-partner dependency on Beijing."
      />

      {/* Split-Pane Contrast Explorer: Bolshevik Theory vs. Putin's Anti-Bolshevik Petrine Revanchism */}
      <section aria-labelledby="split-pane-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Columns2 className="w-4 h-4 text-[#38BDF8]" />
          <h2
            id="split-pane-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Split-Pane Doctrine Explorer: 1917 Leninist Vanguard vs. 2021–2026 Petrine Imperialism
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Pane: Section 1 Bolshevik Doctrine */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-mono-tactical text-[11px] text-[#F59E0B]">
                  SECTION 1 · MARXISM-LENINISM (1903–1917)
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Lenin&rsquo;s &ldquo;Monopoly &amp; Finance Capitalism&rdquo; Lens
                </h3>
              </div>
              <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-white/[0.06] text-gray-300">
                Anti-Capitalist Vanguard
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                ['Vanguard Party', 'Centralized professional cadre over trade-union incrementalism'],
                ['Democratic Centralism', 'Iron post-vote Party unity and command discipline'],
                ['Abolish Private Capital', 'Nationalization of industry, land, and banking'],
                ['Proletarian Dictatorship', 'Seizure of state power rejecting parliamentary rule'],
                ['Anti-Imperialism (1916)', 'Monopoly & financial cartels ignite great-power wars'],
                ['Ethno-Federal USSR', 'Republics granted nominal constitutional right to secede'],
              ].map(([title, desc]) => (
                <div key={title} className="obsidian-surface rounded-lg p-2.5">
                  <p className="font-semibold text-white text-[11px]">{title}</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">{desc}</p>
                </div>
              ))}
            </div>

            {bolshevikTable && (
              <div className="space-y-2">
                <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-400">
                  21st-Century Capitalism Evaluated Through Early Bolshevik Theory (Sec. 1.2)
                </p>
                <div className="space-y-2">
                  {bolshevikTable.rows.map((row, idx) => (
                    <div key={idx} className="obsidian-surface rounded-lg p-3 text-xs space-y-1">
                      <p className="font-semibold text-[#F59E0B]">
                        <RichTextWithCitations text={row[0]} contextLabel="Section 1.2" />
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        <RichTextWithCitations text={row[1]} contextLabel="Section 1.2" />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: Sections 2-4 Putin's Anti-Bolshevik Petrine Revanchism */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-mono-tactical text-[11px] text-[#38BDF8]">
                  SECTIONS 2–4 · ANTI-BOLSHEVIK IMPERIAL REVANCHISM
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Putin&rsquo;s Critique of Lenin &amp; The Petrine Mission
                </h3>
              </div>
              <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                Imperial Restoration
              </span>
            </div>

            <div className="obsidian-surface rounded-lg p-3.5 text-xs space-y-2">
              <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-400">
                Why Putin Rejects Lenin While Rehabilitating Stalin &amp; Tsar Peter I
              </p>
              <ul className="space-y-1.5 text-gray-300 list-disc pl-4">
                <li>
                  <strong className="text-white">Constitutional &ldquo;Time Bomb&rdquo;:</strong>{' '}
                  Blames Lenin&rsquo;s ethno-republic secession clause for 1991 USSR fragmentation.
                </li>
                <li>
                  <strong className="text-white">&ldquo;Creating&rdquo; Modern Ukraine:</strong>{' '}
                  Accuses Bolsheviks of transferring Donbas &amp; Novorossiya into Ukrainian SSR.
                </li>
                <li>
                  <strong className="text-white">1918 Brest-Litovsk &amp; 1917 Regicide:</strong>{' '}
                  Condemns Bolshevik WWI territorial surrender and anti-Tsarist revolution.
                </li>
                <li>
                  <strong className="text-white">June 9, 2022 Peter the Great Doctrine:</strong>{' '}
                  Casts invasion not as conquest, but <em>&ldquo;returning and reinforcing&rdquo;</em>{' '}
                  lands—yet invasion doubled Russia&rsquo;s NATO border (Finland/Sweden) and created
                  junior-partner dependency on China.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-400">
                July 12, 2021 Essay Blueprint vs. Mainstream Historical Critique (Sec. 2.2)
              </p>
              <div className="space-y-2 max-h-[410px] overflow-y-auto pr-1">
                {PUTIN_ESSAY_CLAIMS.map((c) => (
                  <div key={c.claim} className="obsidian-surface rounded-lg p-3 text-xs space-y-1.5">
                    <p className="font-semibold text-white">{c.claim}</p>
                    <p className="text-gray-400">
                      <span className="font-mono-tactical text-[#EF4444]">Kremlin Thesis: </span>
                      {c.kremlin}
                    </p>
                    <p className="text-gray-200">
                      <span className="font-mono-tactical text-[#10B981]">Historical Fact: </span>
                      {c.critique}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Section 3 & 4 Diagnostic: Crimea Hybrid Playbook, Deterrence Gaps & Legacy Limits */}
      <section aria-labelledby="crimea-deterrence-heading" className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldOff className="w-4 h-4 text-[#F59E0B]" />
              <h2
                id="crimea-deterrence-heading"
                className="text-sm font-mono-tactical uppercase tracking-wider text-white"
              >
                Sections 3 &amp; 4 · 2014 Hybrid Annexation, Deterrence Gaps &amp; Legacy Feasibility
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Inspect how the 21-day 2014 Crimea hybrid operation exposed five Western deterrence
              failures—and why Putin&rsquo;s five strategic end-state conditions remain structurally
              unattainable.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'crimea', label: 'Euromaidan & 21-Day Crimea Playbook' },
              { id: 'deterrence', label: '5 Pre-2022 Deterrence Gaps' },
              { id: 'legacy', label: '5 Unattainable Legacy Conditions' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setArcTab(t.id as 'crimea' | 'deterrence' | 'legacy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical border cursor-pointer transition ${
                  arcTab === t.id
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {arcTab === 'crimea' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-tactical text-[11px] text-[#38BDF8]">
                  SEC. 3.1 · REVOLUTION OF DIGNITY (NOV 2013 – FEB 2014)
                </span>
                <span className="font-mono-tactical text-[11px] text-[#10B981]">
                  328–0 Rada Vote
                </span>
              </div>
              <div className="space-y-2">
                {[
                  [
                    'Nov 21 – Dec 1, 2013',
                    'Yanukovych suspends EU Association Agreement under $15B Moscow pressure; Berkut beatings spark 500,000-citizen Maidan mobilization.',
                  ],
                  [
                    'Jan 16 – 22, 2014',
                    'Anti-protest "Dictatorship Laws" rammed through parliament; first fatal shootings on Hrushevsky Street.',
                  ],
                  [
                    'Feb 18 – 20, 2014',
                    'Live-ammunition sniper crackdown kills >100 demonstrators (the Heavenly Hundred).',
                  ],
                  [
                    'Feb 21 – 22, 2014',
                    'Yanukovych flees to Russia; Verkhovna Rada votes 328–0 to remove him, restores 2004 constitution, and sets May 2014 elections.',
                  ],
                ].map(([date, desc]) => (
                  <div key={date} className="obsidian-surface rounded-lg p-3 space-y-1">
                    <p className="font-mono-tactical text-[11px] text-white">{date}</p>
                    <p className="text-gray-300 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-tactical text-[11px] text-[#EF4444]">
                  SEC. 3.2 · 21-DAY CRIMEA HYBRID SEIZURE (FEB 22 – MAR 21, 2014)
                </span>
                <span className="font-mono-tactical text-[11px] text-[#F59E0B]">
                  Gray-Zone Prototype
                </span>
              </div>
              <div className="space-y-2">
                {[
                  [
                    '1. Leased Sevastopol Foothold',
                    'Surged GRU Spetsnaz, VDV airborne, and naval infantry through the leased Black Sea Fleet base (15,000–25,000 personnel capacity).',
                  ],
                  [
                    '2. Unmarked "Little Green Men"',
                    'Stripped military insignia for plausible deniability ("local self-defense forces") to stall NATO consensus for critical weeks.',
                  ],
                  [
                    '3. Bloodless Base Paralysis & EW',
                    'Encircled Ukrainian garrisons, severed C2 cables, jammed radar, and placed civilians at gates while Kyiv ordered troops to hold fire.',
                  ],
                  [
                    '4. Coerced Feb. 27 Parliament Seizure',
                    'Armed special forces locked Simferopol lawmakers inside to install Sergey Aksyonov (4% 2010 vote share), followed by the rushed Mar. 16 ballot.',
                  ],
                ].map(([step, desc]) => (
                  <div key={step} className="obsidian-surface rounded-lg p-3 space-y-1">
                    <p className="font-semibold text-[#F59E0B]">{step}</p>
                    <p className="text-gray-300 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {arcTab === 'deterrence' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {DETERRENCE_FAILURES.map((df) => (
              <div key={df.num} className="obsidian-surface rounded-xl p-4 space-y-2">
                <span className="font-mono-tactical text-xs px-2 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/35 text-[#F59E0B]">
                  GAP {df.num}
                </span>
                <h3 className="text-sm font-semibold text-white leading-snug">{df.title}</h3>
                <p className="text-gray-300 leading-relaxed">{df.detail}</p>
              </div>
            ))}
          </div>
        )}

        {arcTab === 'legacy' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                [
                  'Phase I (1999–2006)',
                  'Restoring Centralized State Order',
                  '1999 Millennium Message rescuing Russia from 1990s oligarchic fragmentation while promising modernization.',
                ],
                [
                  'Phase II (2007–2020)',
                  'Ending U.S. Unipolarity',
                  '2007 Munich Speech positioning Russia as an Orthodox civilizational counterweight to Western institutions.',
                ],
                [
                  'Phase III (2021–Present)',
                  'The Petrine Imperial Mission (Age 74)',
                  'June 9, 2022 comparison to Peter the Great’s 21-year Great Northern War: "returning and reinforcing" lands.',
                ],
              ].map(([phase, title, desc]) => (
                <div key={phase} className="glass-card rounded-xl p-3.5 space-y-1">
                  <p className="font-mono-tactical text-[11px] text-[#38BDF8]">{phase}</p>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-gray-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {LEGACY_CONDITIONS.map((item) => (
                <div key={item.cond} className="obsidian-surface rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <p className="font-semibold text-white">{item.cond}</p>
                  </div>
                  <p className="text-gray-400">
                    <span className="font-mono-tactical text-gray-300">Required: </span>
                    {item.req}
                  </p>
                  <p className="text-gray-200">
                    <span className="font-mono-tactical text-[#10B981]">2026 Reality: </span>
                    {item.reality}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Russia-China 2026-2030 Escalation Timeline & Tripwires */}
      <section aria-labelledby="entente-heading" className="space-y-4">
        <h2
          id="entente-heading"
          className="text-sm font-mono-tactical uppercase tracking-wider text-white"
        >
          Russia–China Transactional Entente &amp; 2026–2030 Two-Front Escalation Timeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ESCALATION_WINDOWS.map((win) => {
            const active = win.id === selectedWindow;
            return (
              <button
                key={win.id}
                type="button"
                onClick={() => setSelectedWindow(win.id)}
                className={`text-left rounded-xl p-4 border transition cursor-pointer ${
                  active
                    ? 'bg-[#111827] border-[#38BDF8]/60'
                    : 'glass-card border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono-tactical text-xs text-[#38BDF8]">{win.period}</span>
                  <span className="font-mono-tactical text-[10px] px-1.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                    {win.severity}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{win.title}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-tactical text-xs text-[#38BDF8]">
                SELECTED HORIZON: {activeWin.period.toUpperCase()}
              </span>
              <span className="font-mono-tactical text-xs text-gray-400">
                &gt;90% Ruble/Yuan Trade · 115+ Joint Drills
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">{activeWin.title}</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{activeWin.details}</p>

            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2.5 text-xs">
              <div className="obsidian-surface rounded-lg p-3">
                <p className="font-mono-tactical text-[10px] text-gray-400 uppercase">
                  Active Joint Capabilities
                </p>
                <p className="text-gray-200 mt-1">
                  Submarine quieting, airborne C2 &amp; amphibious armor for Taiwan, GLONASS/BeiDou
                  ground integration, counter-space EW.
                </p>
              </div>
              <div className="obsidian-surface rounded-lg p-3">
                <p className="font-mono-tactical text-[10px] text-gray-400 uppercase">
                  4 Structural Alliance Limits
                </p>
                <p className="text-gray-200 mt-1">
                  China’s U.S./EU market exposure, 8–10x GDP asymmetry, Central Asia/Arctic
                  friction, and divergent risk appetite.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono-tactical text-xs uppercase tracking-wider text-white">
                Operational Tripwires
              </p>
              <div className="flex gap-1">
                {(Object.keys(THEATER_TRIPWIRES) as Array<keyof typeof THEATER_TRIPWIRES>).map(
                  (th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setSelectedTheater(th)}
                      className={`px-2 py-1 rounded text-[11px] font-mono-tactical cursor-pointer ${
                        selectedTheater === th
                          ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                          : 'bg-white/[0.04] text-gray-400 border border-white/10'
                      }`}
                    >
                      {th}
                    </button>
                  )
                )}
              </div>
            </div>

            <ul className="space-y-2 text-xs text-gray-200">
              {THEATER_TRIPWIRES[selectedTheater].map((tw, idx) => (
                <li
                  key={idx}
                  className="obsidian-surface rounded-lg p-3 flex items-start gap-2.5"
                >
                  <AlertOctagon className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <span>{tw}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Editorial Plate 02: Strait of Hormuz & Critical Mineral / Semiconductor Wafer Chokepoints */}
      <TacticalFigure
        src="/images/hormuz-mineral-chokepoints.jpg"
        alt="Orbital radar view of naval maritime chokepoint shipping wakes paired with macro crystalline gallium and a cyan-lit semiconductor radar wafer"
        plateId="PLATE 02"
        title="Dual Attrition Chokepoints: Strait of Hormuz Naval Blockade & Chinese Gallium / REE / API Leverage"
        domainBadge="SECTIONS 5.4–5.5 · MARITIME & MINERAL CLIFFS"
        metrics={[
          { label: 'Hormuz Oil & LNG', value: '25% Oil · 20% LNG · 30% Fert.', tone: 'crimson' },
          { label: 'Brent Crude Spike', value: '$60.85 → $118.35 / bbl Peak', tone: 'amber' },
          { label: 'Nov. 27 Cliff', value: '98% China Raw Gallium Share', tone: 'crimson' },
          { label: 'Jan. 10, 2027 Cliff', value: 'MOFCOM 0.1% REE Waiver Expiry', tone: 'cyan' },
        ]}
        caption="Simultaneous U.S. munitions expenditure in Operation Epic Fury (~$38B DoD cost; SM-3, SM-6, PAC-3 interceptors) and Beijing’s expiring export-ban suspensions on gallium/germanium (Nov. 27, 2026) and trace heavy REEs (Jan. 10, 2027) compress U.S. defense industrial reconstitution margins."
      />

      {/* Operation Epic Fury & Active Third-Theater Attrition */}
      <section aria-labelledby="epic-fury-heading" className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#EF4444]" />
            <h2
              id="epic-fury-heading"
              className="text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Section 5.4 · Active Third-Theater Attrition: Operation Epic Fury (Iran), OT/PLC
              Sabotage &amp; DPRK Insiders
            </h2>
          </div>
          <span className="font-mono-tactical text-xs px-2.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444]">
            COMBAT ACTIVE SINCE FEB 28, 2026
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ['~$38.0B', 'DoD Spend Thru Sept 2026', '($33.4B thru June IG)'],
            ['18 KIA / 824 WIA', 'U.S. Casualties', '2 Carrier Strike Groups'],
            ['1,700+ Intercepts', '700+ Ballistic / 1,000+ Drones', 'SM-3, SM-6, PAC-3 Drain'],
            ['$118.35 / bbl', 'Brent Peak ($60.85 Pre-War)', '25% Oil · 20% LNG · 30% Fert.'],
            ['12 States / 6 Bases', 'Live Iranian OT/PLC Attacks', 'Ports 44818, 2222, 102, 502, 22'],
            ['70+ U.S. Corps', 'DPRK Lonestar Roundup', '40+ TX Laptop Farms (Oct 13)'],
          ].map(([metric, label, sub]) => (
            <div key={label} className="obsidian-surface rounded-xl p-3.5 space-y-1">
              <p className="font-mono-tactical text-lg font-semibold text-white">{metric}</p>
              <p className="text-xs font-medium text-gray-200">{label}</p>
              <p className="font-mono-tactical text-[10px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-300 leading-relaxed border-t border-white/10 pt-3">
          <strong className="text-white">Hyperscale Kinetic Escalation:</strong> Drone and missile
          strikes in 2026 damaged commercial cloud data centers in the Middle East and Eastern
          Europe—including AWS facilities in the Middle East—permanently deleting some customer data
          and demonstrating that single-region cloud redundancy fails under kinetic attack.
        </p>
      </section>

      {/* Imminent Chinese Critical Mineral & API Chokepoints */}
      <section aria-labelledby="minerals-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#F59E0B]" />
          <h2
            id="minerals-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Section 5.5 · Imminent Chinese Critical Mineral, Magnet &amp; Pharmaceutical API
            Chokepoints
          </h2>
        </div>

        <div className="rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-4 text-xs text-amber-100 leading-relaxed">
          <strong className="font-mono-tactical text-[#F59E0B]">
            NOV. 16–17 ESCALATION NOTE (U.S. BIS GPU CURBS):
          </strong>{' '}
          On November 16, 2026, U.S. BIS imposed export license rules across Malaysia, Thailand,
          Indonesia, Singapore, and Brazil to block Chinese AI firms from remotely renting overseas
          GPU clusters following the Nvidia scandal and Jensen Huang&rsquo;s resignation—heightening
          the risk that Beijing allows its <strong>November 27, 2026</strong> gallium, germanium,
          and antimony export-ban pause to expire ahead of the Shenzhen summit.
        </div>

        {/* Quantitative Supply-Share & Chokepoint Gauges */}
        <div className="glass-card rounded-xl p-5 space-y-3.5">
          <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-300">
            Structural Single-Source Concentration &amp; Regulatory Visibility Telemetry
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {CHOKEPOINT_GAUGES.map((g) => (
              <div key={g.label} className="obsidian-surface rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-white">{g.label}</span>
                  <span
                    className="font-mono-tactical font-semibold shrink-0"
                    style={{ color: g.color }}
                  >
                    {g.display}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0A0E17] border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${g.pct}%`, backgroundColor: g.color }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">{g.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {mineralTable && (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#111827] border-b border-white/10">
                  {mineralTable.headers.map((h, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 font-mono-tactical uppercase tracking-wider text-[11px] text-gray-300"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08] bg-white/[0.02]">
                {mineralTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.04]">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-3.5 text-gray-200 align-top leading-relaxed">
                        <RichTextWithCitations text={cell} contextLabel="Section 5.5" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Complete Verbatim Narrative Sections 1-5 */}
      <NarrativeAccordion
        sections={geoSections}
        heading="Complete Verbatim Narrative — Sections 1 through 5"
      />
    </div>
  );
}
