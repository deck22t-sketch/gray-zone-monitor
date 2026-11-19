'use client';

import React, { useEffect, useState } from 'react';
import {
  Globe,
  Flame,
  Cpu,
  AlertOctagon,
  Columns2,
  ShieldOff,
  Landmark,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { NarrativeAccordion } from '@/components/shell/NarrativeAccordion';
import { RichTextWithCitations } from '@/components/shell/RichTextWithCitations';
import { TacticalFigure } from '@/components/shell/TacticalFigure';
import { SectionNavStrip, scrollToSectionById } from '@/components/shell/SectionNavStrip';
import { ChokepointStressSimulator } from '@/components/views/ChokepointStressSimulator';

const GEO_NAV_ITEMS = [
  { id: 'split-pane-section', code: '01', label: 'Doctrine Split' },
  { id: 'crimea-deterrence-section', code: '02', label: 'Crimea' },
  { id: 'entente-section', code: '03', label: 'Entente' },
  { id: 'epic-fury-section', code: '04', label: 'Epic Fury' },
  { id: 'minerals-section', code: '05', label: 'Minerals' },
  { id: 'chokepoint-simulator-section', code: '06', label: 'Stress Test' },
  { id: 'geo-verbatim-section', code: '07', label: 'Verbatim' },
];

const ESCALATION_WINDOWS = [
  {
    id: 'win-1',
    period: 'Late 2026 – 2027',
    title: 'Gray-Zone & Chokepoint Friction',
    severity: 'ACTIVE',
    details:
      'European interdictions of Russia’s shadow fleet, Baltic GPS/cable sabotage, continuous PLA Taiwan blockade drills, and Nov. 17–18 Shenzhen APEC signaling—where Russian nuclear-capable bombers flew past Japan and Taiwan to Vietnam.',
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
  const [mobileDoctrine, setMobileDoctrine] = useState<'bolshevik' | 'petrine'>('bolshevik');
  const [openClaims, setOpenClaims] = useState<Record<number, boolean>>({ 0: true, 3: true });

  useEffect(() => {
    const hashId = window.location.hash.replace(/^#/, '');
    if (!hashId) return;
    const t = setTimeout(() => {
      scrollToSectionById(hashId, 'smooth');
    }, 80);
    return () => clearTimeout(t);
  }, []);

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

  const allClaimsOpen = PUTIN_ESSAY_CLAIMS.every((_, idx) => openClaims[idx]);

  return (
    <div className="space-y-7">
      {/* Edge-to-Edge Docked In-Page Section Rail */}
      <SectionNavStrip items={GEO_NAV_ITEMS} ariaLabel="Geopolitical Strategy sections" />

      {/* Header */}
      <section className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tactical text-[11px] text-[#38BDF8]">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>SECTIONS 1–5 · GEOPOLITICAL &amp; CHOKEPOINT STRATEGY</span>
          </div>
          <span className="px-2 py-0.5 rounded-sm bg-[#EF4444]/12 border border-[#EF4444]/35 text-[#EF4444]">
            NOV 18: HORMUZ ADNOC STRIKE · SHENZHEN APEC
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
          Doctrinal Inversion, Multi-Theater Attrition &amp; 2026–2030 Chokepoints
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
          Bolshevik anti-imperial theory vs. Putin&rsquo;s Petrine revanchism, 2014 Crimea
          deterrence gaps, active <em>Operation Epic Fury</em> attrition, and expiring Chinese
          mineral &amp; API chokepoints.
        </p>
      </section>

      {/* Editorial Plate 01 */}
      <TacticalFigure
        src="/images/geopolitics-imperial-arc.jpg"
        alt="Editorial diptych contrasting early 20th-century constructivist steelworks on the left with an accurate Eurasian satellite map showing Scandinavia, Baltic and Ukraine-Crimea crimson borders, and Russia-to-China overland energy corridors on the right"
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

      {/* Split-Pane Contrast Explorer (Mobile Tab Switcher + Desktop Side-by-Side) */}
      <section
        id="split-pane-section"
        aria-labelledby="split-pane-heading"
        className="space-y-3.5 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Columns2 className="w-4 h-4 text-[#38BDF8]" />
            <h2
              id="split-pane-heading"
              className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Doctrine Split: 1917 Leninist Vanguard vs. Petrine Imperialism
            </h2>
          </div>

          {/* Mobile-only pane switcher to avoid stacked 12-card wall */}
          <div className="inline-flex lg:hidden rounded-md bg-[#070A10] border border-white/10 p-0.5 font-mono-tactical text-[11px]">
            <button
              type="button"
              onClick={() => setMobileDoctrine('bolshevik')}
              className={`px-2.5 py-1 rounded-sm cursor-pointer transition ${
                mobileDoctrine === 'bolshevik'
                  ? 'bg-[#F59E0B]/18 text-[#F59E0B]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              1917 Bolshevik
            </button>
            <button
              type="button"
              onClick={() => setMobileDoctrine('petrine')}
              className={`px-2.5 py-1 rounded-sm cursor-pointer transition ${
                mobileDoctrine === 'petrine'
                  ? 'bg-[#38BDF8]/18 text-[#38BDF8]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Putin Petrine
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Left Pane: Section 1 Bolshevik Doctrine */}
          <div
            className={`glass-card rounded-lg p-4 sm:p-5 space-y-4 ${
              mobileDoctrine === 'bolshevik' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="font-mono-tactical text-[10px] text-[#F59E0B]">
                  SECTION 1 · MARXISM-LENINISM (1903–1917)
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Lenin&rsquo;s &ldquo;Monopoly &amp; Finance Capitalism&rdquo; Lens
                </h3>
              </div>
              <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-white/[0.05] border border-white/10 text-gray-300">
                Anti-Capitalist
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                ['Vanguard Party', 'Centralized cadre over incremental reform'],
                ['Democratic Centralism', 'Iron post-vote Party command discipline'],
                ['Abolish Private Capital', 'State nationalization of industry & banks'],
                ['Proletarian Dictatorship', 'State seizure rejecting parliamentary rule'],
                ['Anti-Imperialism (1916)', 'Monopoly cartels ignite great-power wars'],
                ['Ethno-Federal USSR', 'Nominal constitutional right to secede'],
              ].map(([title, desc]) => (
                <div key={title} className="obsidian-surface rounded-md p-2.5">
                  <p className="font-semibold text-white text-xs">{title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{desc}</p>
                </div>
              ))}
            </div>

            {bolshevikTable && (
              <div className="space-y-2">
                <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                  21st-Century Capitalism via Early Bolshevik Theory (Sec. 1.2)
                </p>
                <div className="space-y-1.5">
                  {bolshevikTable.rows.map((row, idx) => (
                    <div key={idx} className="obsidian-surface rounded-md p-3 text-xs sm:text-[13px] space-y-1">
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
          <div
            className={`glass-card rounded-lg p-4 sm:p-5 space-y-4 ${
              mobileDoctrine === 'petrine' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="font-mono-tactical text-[10px] text-[#38BDF8]">
                  SECTIONS 2–4 · ANTI-BOLSHEVIK REVANCHISM
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Putin&rsquo;s Critique of Lenin &amp; The Petrine Mission
                </h3>
              </div>
              <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444]">
                Imperial Restoration
              </span>
            </div>

            <div className="obsidian-surface rounded-md p-3.5 text-xs sm:text-[13px] space-y-2">
              <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                Repudiating Lenin While Rehabilitating Stalin &amp; Tsar Peter I
              </p>
              <ul className="space-y-1.5 text-gray-300 list-disc pl-4 leading-relaxed">
                <li>
                  <strong className="text-white">Constitutional &ldquo;Time Bomb&rdquo;:</strong>{' '}
                  Blames Lenin&rsquo;s secession clause for 1991 USSR fragmentation.
                </li>
                <li>
                  <strong className="text-white">&ldquo;Creating&rdquo; Modern Ukraine:</strong>{' '}
                  Accuses Bolsheviks of transferring Donbas &amp; Novorossiya into Ukrainian SSR.
                </li>
                <li>
                  <strong className="text-white">1918 Brest-Litovsk &amp; Regicide:</strong>{' '}
                  Condemns Bolshevik WWI surrender and anti-Tsarist revolution.
                </li>
                <li>
                  <strong className="text-white">June 9, 2022 Petrine Doctrine:</strong>{' '}
                  Frames war as <em>&ldquo;returning and reinforcing&rdquo;</em>—yet doubled
                  Russia&rsquo;s NATO border (FI/SE) and deepened junior dependency on China.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
                  July 12, 2021 Essay Claims vs. Historical Fact (Sec. 2.2)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const next: Record<number, boolean> = {};
                    if (!allClaimsOpen) {
                      PUTIN_ESSAY_CLAIMS.forEach((_, idx) => {
                        next[idx] = true;
                      });
                    }
                    setOpenClaims(next);
                  }}
                  className="font-mono-tactical text-[11px] text-[#38BDF8] hover:underline cursor-pointer shrink-0"
                >
                  {allClaimsOpen ? 'Collapse All' : 'Expand All 5'}
                </button>
              </div>

              <div className="space-y-1.5">
                {PUTIN_ESSAY_CLAIMS.map((c, idx) => {
                  const isOpen = Boolean(openClaims[idx]);
                  return (
                    <div key={c.claim} className="obsidian-surface rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenClaims((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.03] transition"
                      >
                        <span className="text-xs font-semibold text-white">
                          {c.claim}
                        </span>
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 pt-2 border-t border-white/[0.07] text-xs space-y-1.5 leading-relaxed">
                          <p className="text-gray-300">
                            <span className="font-mono-tactical text-[10px] text-[#EF4444]">
                              KREMLIN THESIS:{' '}
                            </span>
                            {c.kremlin}
                          </p>
                          <p className="text-gray-200">
                            <span className="font-mono-tactical text-[10px] text-[#10B981]">
                              HISTORICAL FACT:{' '}
                            </span>
                            {c.critique}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Section 3 & 4 Diagnostic */}
      <section
        id="crimea-deterrence-section"
        aria-labelledby="crimea-deterrence-heading"
        className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldOff className="w-4 h-4 text-[#F59E0B]" />
              <h2
                id="crimea-deterrence-heading"
                className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
              >
                Sections 3 &amp; 4 · 2014 Crimea Playbook, Deterrence Gaps &amp; Legacy Limits
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              21-day Crimea hybrid template, five pre-2022 Western gaps, and five structural limits.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'crimea', label: '21-Day Crimea Playbook' },
              { id: 'deterrence', label: '5 Deterrence Gaps' },
              { id: 'legacy', label: '5 Legacy Limits' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setArcTab(t.id as 'crimea' | 'deterrence' | 'legacy')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border cursor-pointer transition ${
                  arcTab === t.id
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-[#070A10] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {arcTab === 'crimea' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs sm:text-[13px]">
            <div className="glass-card rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono-tactical text-[10px] text-[#38BDF8]">
                  SEC. 3.1 · EUROMAIDAN (NOV 2013 – FEB 2014)
                </span>
                <span className="font-mono-tactical text-[10px] text-[#10B981]">
                  328–0 Rada Vote
                </span>
              </div>
              <div className="space-y-2">
                {[
                  [
                    'Nov 21 – Dec 1, 2013',
                    'Yanukovych halts EU pact under $15B Moscow pressure; Berkut beatings spark 500,000-citizen mobilization.',
                  ],
                  [
                    'Jan 16 – 22, 2014',
                    'Anti-protest "Dictatorship Laws" passed; first fatal shootings on Hrushevsky Street.',
                  ],
                  [
                    'Feb 18 – 20, 2014',
                    'Live-ammunition sniper crackdown kills >100 demonstrators (Heavenly Hundred).',
                  ],
                  [
                    'Feb 21 – 22, 2014',
                    'Yanukovych flees to Russia; Rada votes 328–0 to remove him and restores 2004 constitution.',
                  ],
                ].map(([date, desc]) => (
                  <div key={date} className="obsidian-surface rounded-md p-3 space-y-0.5">
                    <p className="font-mono-tactical text-[11px] font-semibold text-white">{date}</p>
                    <p className="text-gray-300 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono-tactical text-[10px] text-[#EF4444]">
                  SEC. 3.2 · 21-DAY CRIMEA SEIZURE (FEB – MAR 2014)
                </span>
                <span className="font-mono-tactical text-[10px] text-[#F59E0B]">
                  Gray-Zone Prototype
                </span>
              </div>
              <div className="space-y-2">
                {[
                  [
                    '1. Leased Sevastopol Foothold',
                    'Surged GRU Spetsnaz, VDV, and naval infantry through leased Black Sea Fleet base (15k–25k capacity).',
                  ],
                  [
                    '2. Unmarked "Little Green Men"',
                    'Stripped insignia for plausible deniability to stall NATO consensus for critical weeks.',
                  ],
                  [
                    '3. Base Paralysis & EW',
                    'Encircled Ukrainian garrisons, severed C2 cables, and jammed radar while Kyiv ordered hold-fire.',
                  ],
                  [
                    '4. Coerced Feb. 27 Parliament Seizure',
                    'Armed troops locked Simferopol lawmakers inside to install Aksyonov (4% 2010 vote) before Mar. 16 vote.',
                  ],
                ].map(([step, desc]) => (
                  <div key={step} className="obsidian-surface rounded-md p-3 space-y-0.5">
                    <p className="font-semibold text-[#F59E0B]">{step}</p>
                    <p className="text-gray-300 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {arcTab === 'deterrence' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            {DETERRENCE_FAILURES.map((df) => (
              <div key={df.num} className="obsidian-surface rounded-md p-3.5 space-y-1.5">
                <span className="font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm bg-[#F59E0B]/15 border border-[#F59E0B]/35 text-[#F59E0B]">
                  GAP {df.num}
                </span>
                <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug">{df.title}</h3>
                <p className="text-gray-300 leading-relaxed">{df.detail}</p>
              </div>
            ))}
          </div>
        )}

        {arcTab === 'legacy' && (
          <div className="space-y-3 text-xs sm:text-[13px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {[
                [
                  'Phase I (1999–2006)',
                  'Centralized State Order',
                  '1999 Millennium Message consolidating power after 1990s fragmentation.',
                ],
                [
                  'Phase II (2007–2020)',
                  'Ending U.S. Unipolarity',
                  '2007 Munich Speech asserting an Orthodox civilizational counterweight.',
                ],
                [
                  'Phase III (2021–Present)',
                  'Petrine Imperial Mission (Age 74)',
                  'June 9, 2022 Great Northern War analogy: "returning and reinforcing" lands.',
                ],
              ].map(([phase, title, desc]) => (
                <div key={phase} className="glass-card rounded-md p-3.5 space-y-1">
                  <p className="font-mono-tactical text-[10px] text-[#38BDF8]">{phase}</p>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-gray-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {LEGACY_CONDITIONS.map((item) => (
                <div key={item.cond} className="obsidian-surface rounded-md p-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <p className="font-semibold text-white text-xs sm:text-sm">{item.cond}</p>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    <span className="font-mono-tactical text-[10px] text-gray-400">REQUIRED: </span>
                    {item.req}
                  </p>
                  <p className="text-gray-200 leading-relaxed">
                    <span className="font-mono-tactical text-[10px] text-[#10B981]">
                      2026 REALITY:{' '}
                    </span>
                    {item.reality}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Russia-China 2026-2030 Escalation Timeline & Tripwires */}
      <section
        id="entente-section"
        aria-labelledby="entente-heading"
        className="space-y-3.5 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="entente-heading"
            className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Russia–China Entente &amp; 2026–2030 Escalation Windows
          </h2>
          <span className="font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm bg-[#EF4444]/12 border border-[#EF4444]/30 text-[#EF4444]">
            NOV 17–18: RUSSIAN BOMBERS TO VIETNAM · SHENZHEN APEC
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ESCALATION_WINDOWS.map((win) => {
            const active = win.id === selectedWindow;
            return (
              <button
                key={win.id}
                type="button"
                onClick={() => setSelectedWindow(win.id)}
                className={`text-left rounded-md p-3.5 border transition cursor-pointer ${
                  active
                    ? 'surface-elevated border-[#38BDF8]/60'
                    : 'glass-card border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono-tactical text-[11px] text-[#38BDF8]">{win.period}</span>
                  <span className="font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                    {win.severity}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">{win.title}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 glass-card rounded-lg p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-tactical text-[11px] text-[#38BDF8]">
                HORIZON: {activeWin.period.toUpperCase()}
              </span>
              <span className="font-mono-tactical text-[11px] text-gray-400">
                &gt;90% RUB/CNY Trade · 115+ Joint Drills
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">{activeWin.title}</h3>
            <p className="text-xs sm:text-[13px] text-gray-300 leading-relaxed">{activeWin.details}</p>

            <div className="rounded-md bg-[#38BDF8]/8 border border-[#38BDF8]/25 p-3 text-xs text-gray-200 leading-relaxed">
              <span className="font-mono-tactical text-[10px] text-[#38BDF8] uppercase font-semibold">
                Nov. 18 Shenzhen APEC Signal:{' '}
              </span>
              As Presidents Trump and Xi met in Shenzhen ahead of Thursday&rsquo;s bilateral and a
              trilateral with Putin, Xi called for deeper Russia–China military ties while Russian
              nuclear-capable bombers flew past Japan and Taiwan to Vietnam on Nov. 17.
            </div>

            <div className="pt-2.5 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="obsidian-surface rounded-md p-3">
                <p className="font-mono-tactical text-[10px] text-gray-400 uppercase">
                  Active Joint Capabilities
                </p>
                <p className="text-gray-300 mt-1 leading-relaxed">
                  Submarine quieting, airborne C2 &amp; amphibious armor for Taiwan, GLONASS/BeiDou
                  integration, counter-space EW.
                </p>
              </div>
              <div className="obsidian-surface rounded-md p-3">
                <p className="font-mono-tactical text-[10px] text-gray-400 uppercase">
                  4 Structural Alliance Limits
                </p>
                <p className="text-gray-300 mt-1 leading-relaxed">
                  China’s U.S./EU market exposure, 8–10x GDP asymmetry, Central Asia/Arctic
                  friction, divergent risk appetite.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 glass-card rounded-lg p-4 sm:p-5 space-y-3">
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
                      className={`px-2 py-1 rounded-sm text-[11px] font-mono-tactical cursor-pointer transition ${
                        selectedTheater === th
                          ? 'bg-[#38BDF8]/18 text-[#38BDF8] border border-[#38BDF8]/40'
                          : 'bg-[#070A10] text-gray-400 border border-white/[0.08] hover:text-gray-200'
                      }`}
                    >
                      {th}
                    </button>
                  )
                )}
              </div>
            </div>

            <ul className="space-y-2 text-xs sm:text-[13px] text-gray-200">
              {THEATER_TRIPWIRES[selectedTheater].map((tw, idx) => (
                <li
                  key={idx}
                  className="obsidian-surface rounded-md p-3 flex items-start gap-2.5 leading-snug"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                  <span>{tw}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Editorial Plate 02 */}
      <TacticalFigure
        src="/images/hormuz-mineral-chokepoints.jpg"
        alt="Split-screen composition pairing a synthetic aperture radar nadir view of the Strait of Hormuz, Musandam Peninsula, and Qeshm Island tanker wakes with raw crystalline gallium and a cyan compound semiconductor radar wafer"
        plateId="PLATE 02"
        title="Dual Attrition Chokepoints: Strait of Hormuz Naval Blockade & Chinese Gallium / REE / API Leverage"
        domainBadge="SECTIONS 5.4–5.5 · MARITIME & MINERAL CLIFFS"
        metrics={[
          { label: 'Nov. 18 Hormuz', value: 'ADNOC Tanker Hit · Qeshm Strikes', tone: 'crimson' },
          { label: 'Brent Crude Spike', value: '$60.85 → $118.35 / bbl Peak', tone: 'amber' },
          { label: 'Nov. 27 Cliff', value: '98% China Raw Gallium Share', tone: 'crimson' },
          { label: 'Jan. 10, 2027 Cliff', value: 'MOFCOM 0.1% REE Waiver Expiry', tone: 'cyan' },
        ]}
        caption="Simultaneous U.S. munitions expenditure in Operation Epic Fury (~$38B DoD cost; SM-3, SM-6, PAC-3 interceptors) and Beijing’s expiring export-ban suspensions on gallium/germanium (Nov. 27, 2026) and trace heavy REEs (Jan. 10, 2027) compress U.S. defense industrial reconstitution margins."
      />

      {/* Operation Epic Fury & Active Third-Theater Attrition */}
      <section
        id="epic-fury-section"
        aria-labelledby="epic-fury-heading"
        className="glass-panel tac-frame rounded-lg p-5 sm:p-6 space-y-4 scroll-mt-nav"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#EF4444]" />
            <h2
              id="epic-fury-heading"
              className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
            >
              Sec. 5.4 · Operation Epic Fury (Iran), OT/PLC Sabotage &amp; DPRK Insiders
            </h2>
          </div>
          <span className="font-mono-tactical text-[11px] px-2 py-0.5 rounded-sm bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444]">
            COMBAT ACTIVE · NOV 18 GULF WIDENING
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            ['~$38.0B', 'DoD Spend Thru Sept 2026', '($33.4B thru June IG)'],
            ['18 KIA / 824 WIA', 'U.S. Casualties', '2 Carrier Strike Groups'],
            ['1,700+ Intercepts', '700+ Ballistic / 1,000+ Drones', 'SM-3, SM-6, PAC-3 Drain'],
            ['$118.35 / bbl', 'Brent Peak ($60.85 Pre-War)', '25% Oil · 20% LNG · 30% Fert.'],
            ['12 States / 6 Bases', 'Live Iranian OT/PLC Attacks', 'Ports 44818, 2222, 102, 502, 22'],
            ['70+ U.S. Corps', 'DPRK Lonestar Roundup', '40+ TX Laptop Farms (Oct 13)'],
          ].map(([metric, label, sub]) => (
            <div key={label} className="obsidian-surface rounded-md p-3 space-y-0.5">
              <p className="font-mono-tactical text-base sm:text-lg font-semibold text-white">{metric}</p>
              <p className="text-xs font-medium text-gray-200">{label}</p>
              <p className="font-mono-tactical text-[10px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/[0.08] text-xs sm:text-[13px]">
          <div className="rounded-md bg-[#EF4444]/10 border border-[#EF4444]/30 p-3.5 text-gray-200 leading-relaxed">
            <strong className="font-mono-tactical text-[10px] uppercase text-[#EF4444] block mb-1">
              Nov. 18 Persian Gulf Escalation
            </strong>
            An ADNOC (UAE state oil) vessel was struck in the Strait of Hormuz (11 injured, 1
            missing); Iran targeted a U.S. air base in Kuwait, sites in Bahrain, and areas near
            Riyadh&rsquo;s airport as U.S. forces struck Iran&rsquo;s Qeshm Island.
          </div>
          <div className="obsidian-surface rounded-md p-3.5 text-gray-300 leading-relaxed">
            <strong className="font-mono-tactical text-[10px] uppercase text-[#F59E0B] block mb-1">
              Hyperscale Kinetic Data-Center Strikes
            </strong>
            Drone and missile strikes damaged commercial cloud data centers in the Middle East and
            Eastern Europe—including AWS Middle East facilities—permanently deleting customer data
            and invalidating single-region cloud failover assumptions.
          </div>
        </div>
      </section>

      {/* Imminent Chinese Critical Mineral & API Chokepoints */}
      <section
        id="minerals-section"
        aria-labelledby="minerals-heading"
        className="space-y-4 scroll-mt-nav"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#F59E0B]" />
          <h2
            id="minerals-heading"
            className="text-xs sm:text-sm font-mono-tactical uppercase tracking-wider text-white"
          >
            Sec. 5.5 · Chinese Critical Mineral, Magnet &amp; Pharmaceutical API Chokepoints
          </h2>
        </div>

        <div className="rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-3.5 text-xs sm:text-[13px] text-amber-100 leading-relaxed">
          <strong className="font-mono-tactical text-[11px] text-[#F59E0B]">
            NOV. 16–18 BIS GPU CURBS:{' '}
          </strong>
          U.S. BIS imposed export license rules across Malaysia, Thailand, Indonesia, Singapore, and
          Brazil blocking remote Chinese AI GPU rentals—raising the odds Beijing lets its{' '}
          <strong>November 27, 2026</strong> gallium/germanium/antimony pause expire during Shenzhen
          APEC friction.
        </div>

        {/* Quantitative Supply-Share & Chokepoint Gauges */}
        <div className="glass-card rounded-lg p-4 sm:p-5 space-y-3">
          <p className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
            Structural Single-Source Concentration Telemetry
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CHOKEPOINT_GAUGES.map((g) => (
              <div key={g.label} className="obsidian-surface rounded-md p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-white">{g.label}</span>
                  <span
                    className="font-mono-tactical font-semibold shrink-0"
                    style={{ color: g.color }}
                  >
                    {g.display}
                  </span>
                </div>
                <div className="h-1.5 rounded-xs bg-[#06080C] border border-white/10 overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${g.pct}%`, backgroundColor: g.color }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">{g.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {mineralTable && (
          <div className="overflow-x-auto rounded-lg border border-white/[0.09]">
            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="bg-[#0B0F17] border-b border-white/[0.09]">
                  {mineralTable.headers.map((h, idx) => (
                    <th
                      key={idx}
                      className="px-3.5 py-2.5 font-mono-tactical uppercase tracking-wider text-[10px] text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07] bg-[#070A10]">
                {mineralTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.03]">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3.5 py-3 text-gray-200 align-top leading-relaxed"
                      >
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

      {/* Interactive Supply-Chain Buffer & Statutory Cliff Simulator */}
      <ChokepointStressSimulator />

      {/* Complete Verbatim Narrative Sections 1-5 */}
      <NarrativeAccordion
        id="geo-verbatim-section"
        sections={geoSections}
        heading="Complete Verbatim Narrative — Sections 1 through 5"
      />
    </div>
  );
}
