import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BriefingValidationError,
  computeChangelogDiff,
  parseBriefingMarkdown,
  syncBriefingToDataDir,
} from '../scripts/lib/doc-parser';
import {
  parseAppleSystemStatus,
  parseCisaAdvisoriesXml,
  parseCisaKevJson,
  parseFaaNasStatus,
  parseFederalRegisterJson,
  parseStatuspageIncidentsJson,
  stripJsonpWrapper,
} from '../scripts/lib/signal-parsers';
import { maybeEnrichWithGemini } from '../scripts/lib/gemini-enricher';
import { computePoissonClusterProbability } from '../src/lib/poisson';
import {
  decryptBundleWithPasscode,
  encryptBundleWithPasscode,
  FullBriefingDataBundle,
  normalizePassphrase,
} from '../src/lib/vault-crypto';
import {
  appendFeedHistorySnapshot,
  createEmptyFeedHistory,
} from '../scripts/lib/feed-history';
import {
  assessIncidentVerification,
  assessRiskVerification,
  buildCrossDomainGraph,
  buildExecutiveSummaryText,
  classifySourceTier,
  computeBundleSha256Hex,
  NON_AFFILIATION_NOTICE,
  resolveTraceNodeKey,
} from '../src/lib/evidence';
import { buildPwaArtifacts, resolvePwaBasePath } from '../scripts/generate-pwa';
import {
  evaluateChokepointStress,
  evaluateComplianceClocks,
} from '../src/lib/simulators';
import {
  CountdownCliffsArraySchema,
  IncidentsArraySchema,
  RiskMatrixArraySchema,
  WatchlistArraySchema,
} from '../src/types/schemas';

const CANONICAL_MD_PATH = path.join(process.cwd(), 'content', 'executive_briefing.md');

describe('Phase 1: Canonical Google Doc Deterministic Parser & Fail-Safe Validator', () => {
  it('parses all 8 risk vectors, 10 incidents, 9 watchlist rows, 8 countdown cliffs, and omits Section 9 with zero data loss', () => {
    const markdown = fs.readFileSync(CANONICAL_MD_PATH, 'utf8');
    const bundle = parseBriefingMarkdown(markdown);

    // 1. Risk Matrix (8 rows)
    expect(bundle.riskMatrix).toHaveLength(8);
    expect(bundle.riskMatrix.map((r) => r.id)).toEqual([
      '#1',
      '#2',
      '#3',
      '#4',
      '#5',
      '#6',
      '#7',
      '#8',
    ]);
    expect(bundle.riskMatrix.filter((r) => r.horizonGroup === 'Immediate')).toHaveLength(4);
    expect(bundle.riskMatrix.filter((r) => r.horizonGroup === '10–54 Days')).toHaveLength(3);
    expect(bundle.riskMatrix.filter((r) => r.horizonGroup === '2027–2030')).toHaveLength(1);

    // 2. Master Tracked Incident Ledger (10 rows)
    expect(bundle.incidents).toHaveLength(10);
    expect(bundle.incidents.map((i) => i.eventId)).toEqual([
      '#1',
      '#2',
      '#3',
      '#4',
      '#5',
      '#6',
      '#7',
      '#8',
      '#9',
      '#10',
    ]);
    const ev4 = bundle.incidents.find((i) => i.eventId === '#4');
    expect(ev4?.classification).toBe('malicious_attack');
    expect(ev4?.sources.length).toBeGreaterThanOrEqual(2);

    const ev10 = bundle.incidents.find((i) => i.eventId === '#10');
    expect(ev10?.classification).toBe('client_cascade');

    const ev7 = bundle.incidents.find((i) => i.eventId === '#7');
    expect(ev7?.classification).toBe('hybrid_transition_bug');
    expect(ev7?.status).toContain('Resolved Tuesday evening');

    // Verify 'unspecified' fallback still activates when root cause is pending
    const pendingBundle = parseBriefingMarkdown(
      markdown.replace(
        'Technical issue affecting sign-in capabilities; cyber ruled out by Marriott',
        'Unspecified technical disruption; root cause pending'
      )
    );
    expect(pendingBundle.incidents.find((i) => i.eventId === '#7')?.classification).toBe(
      'unspecified'
    );

    // 3. Nine-Point Watchlist (9 rows)
    expect(bundle.watchlist).toHaveLength(9);
    expect(bundle.watchlist.map((w) => w.id)).toEqual([
      '#1',
      '#2',
      '#3',
      '#4',
      '#5',
      '#6',
      '#7',
      '#8',
      '#9',
    ]);

    // 4. Countdown Cliffs (8 dates)
    expect(bundle.countdownCliffs).toHaveLength(8);
    expect(bundle.countdownCliffs[0].targetDateISO).toBe('2026-11-18');
    expect(bundle.countdownCliffs[7].targetDateISO).toBe('2027-03-15');

    // 5. Narrative Sections (Sections 1–8 preserved including Section 6.7; Section 9 strictly omitted)
    expect(bundle.sections.docDate).toBe('November 18, 2026');
    expect(bundle.sections.executiveSummary.pillars).toHaveLength(6);
    expect(bundle.sections.narrativeSections).toHaveLength(8);
    expect(bundle.sections.narrativeSections.map((s) => s.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    const serializedSections = JSON.stringify(bundle.sections);
    expect(serializedSections).not.toContain('Google Antigravity Website Architecture');
    expect(serializedSections).not.toContain('Ready-to-Paste Antigravity Workspace Kickoff Prompt');

    // Verify trailing ## 6.7 was cleanly attached to Section 6
    const sec6 = bundle.sections.narrativeSections.find((s) => s.number === 6);
    expect(sec6?.subsections.some((sub) => sub.code === '6.7')).toBe(true);

    // Verify Section 10 Primary Sources Vault (Nov. 18 update expanded to 98 verified URLs)
    expect(bundle.sections.primarySources.length).toBeGreaterThanOrEqual(90);
  });

  it('aborts overwriting existing src/data/*.json when malformed markdown fails Zod validation', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-failsafe-'));
    try {
      // First perform valid sync
      syncBriefingToDataDir(CANONICAL_MD_PATH, tmpDir);
      const sentinelBefore = fs.readFileSync(path.join(tmpDir, 'riskMatrix.json'), 'utf8');

      // Write corrupted markdown (truncated Risk Matrix with only 2 rows)
      const brokenMdPath = path.join(tmpDir, 'broken.md');
      const validMd = fs.readFileSync(CANONICAL_MD_PATH, 'utf8');
      const brokenMd = validMd.replace(
        /\| \*\*3\\\. Active Third-Theater[\s\S]*?\| \*\*8\\\. Opportunistic Two-Front[^\n]+\n/,
        ''
      );
      fs.writeFileSync(brokenMdPath, brokenMd, 'utf8');

      expect(() => syncBriefingToDataDir(brokenMdPath, tmpDir)).toThrow(BriefingValidationError);

      // Verify existing JSON file was NOT overwritten
      const sentinelAfter = fs.readFileSync(path.join(tmpDir, 'riskMatrix.json'), 'utf8');
      expect(sentinelAfter).toBe(sentinelBefore);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('computes changelog diffs accurately when new incidents or status updates occur', () => {
    const markdown = fs.readFileSync(CANONICAL_MD_PATH, 'utf8');
    const bundle = parseBriefingMarkdown(markdown);
    const prevIncidents = bundle.incidents.slice(0, 9).map((inc, idx) =>
      idx === 0 ? { ...inc, status: 'Investigating outage' } : inc
    );
    const diff = computeChangelogDiff({
      previousIncidents: prevIncidents,
      previousRiskMatrix: bundle.riskMatrix,
      nextBundle: bundle,
    });
    expect(diff.addedIncidents).toHaveLength(1);
    expect(diff.addedIncidents[0].eventId).toBe('#10');
    expect(diff.updatedStatuses).toHaveLength(1);
    expect(diff.updatedStatuses[0].eventId).toBe('#1');
  });
});

describe('Phase 2: Zero-Key OSINT Collector Parsers & Dormant Gemini Adapter', () => {
  it('iterates ALL <Delay_type> blocks in FAA NAS XML and enforces plain-text attribution', () => {
    const multiDelayXml = `
      <AIRPORT_STATUS_INFORMATION>
        <Update_Time>Tue Nov 17 21:59:26 2026 GMT</Update_Time>
        <Delay_type>
          <Name>Ground Stops</Name>
          <Ground_Stop_List>
            <Program>
              <ARPT>ORD</ARPT>
              <Reason>EQUIPMENT / TELECOM</Reason>
              <End_Time>10:30 PM EDT</End_Time>
            </Program>
          </Ground_Stop_List>
        </Delay_type>
        <Delay_type>
          <Name>Ground Delay Programs</Name>
          <Ground_Delay_List>
            <Ground_Delay>
              <ARPT>EWR</ARPT>
              <Reason>VOLUME</Reason>
              <Avg>45 minutes</Avg>
              <Max>1 hour 30 minutes</Max>
            </Ground_Delay>
          </Ground_Delay_List>
        </Delay_type>
        <Delay_type>
          <Name>Airport Closures</Name>
          <Airport_Closure_List>
            <Airport>
              <ARPT>SNA</ARPT>
              <Reason>!SNA 11/020 AD AP CLSD</Reason>
              <Reopen>Nov 21 at 14:15 UTC.</Reopen>
            </Airport>
          </Airport_Closure_List>
        </Delay_type>
      </AIRPORT_STATUS_INFORMATION>
    `;

    const result = parseFaaNasStatus(multiDelayXml, null);
    expect(result.updateTimeText).toBe('Tue Nov 17 21:59:26 2026 GMT');
    expect(result.signals).toHaveLength(3);
    expect(result.signals.map((s) => s.title).join(' ')).toContain('ORD');
    expect(result.signals.map((s) => s.title).join(' ')).toContain('EWR');
    expect(result.signals.map((s) => s.title).join(' ')).toContain('SNA');
    for (const sig of result.signals) {
      expect(sig.attributionText).toContain('Source: FAA NAS Status (nasstatus.faa.gov)');
      expect(sig.attributionText).toContain('Tue Nov 17 21:59:26 2026 GMT');
      expect(sig.markdownRow).toContain('| #11+ —');
    }
  });

  it('strips jsonCallback(...) JSONP wrapper on Apple System Status and flags Watchlist #9 cascade services', () => {
    const now = new Date('2026-11-17T22:00:00Z');
    const jsonpPayload = `jsonCallback(${JSON.stringify({
      services: [
        {
          serviceName: 'iCloud Account & Sign In',
          events: [
            {
              messageId: '991',
              statusType: 'Outage',
              message: 'Users may be unable to sign in.',
              startDate: '11/17/2026 09:35 PST',
              epochStartDate: now.getTime() - 3600_000,
              usersAffected: 'Some users are affected',
              eventStatus: 'ongoing',
            },
          ],
        },
      ],
    })});`;

    expect(stripJsonpWrapper(jsonpPayload).startsWith('{')).toBe(true);
    const signals = parseAppleSystemStatus(jsonpPayload, now);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe('critical');
    expect(signals[0].watchlistMatches).toContain('#9');
  });

  it('maps CISA KEV priority perimeter/routing vendors to Watchlist #2 & #8', () => {
    const now = new Date('2026-11-17T22:00:00Z');
    const kevPayload = JSON.stringify({
      catalogVersion: '2026.11.17',
      vulnerabilities: [
        {
          cveID: 'CVE-2026-99999',
          vendorProject: 'Juniper',
          product: 'Junos OS',
          vulnerabilityName: 'Junos Routing Daemon Vulnerability',
          dateAdded: '2026-11-16',
          shortDescription: 'Routing control plane vulnerability.',
          dueDate: '2026-11-19',
        },
      ],
    });
    const signals = parseCisaKevJson(kevPayload, now);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe('critical');
    expect(signals[0].watchlistMatches).toEqual(expect.arrayContaining(['#2', '#8']));
  });

  it('parses CISA ICS advisories, Federal Register cliffs, and Statuspage incidents cleanly', () => {
    const cisaRss = `<rss><channel><item><title>Rockwell Automation ControlLogix PLC</title><link>https://www.cisa.gov/news-events/ics-advisories/icsa-26-321-99</link><description>OT PLC advisory</description><pubDate>Tue, 17 Nov 2026 12:00:00 GMT</pubDate></item></channel></rss>`;
    const cisaSignals = parseCisaAdvisoriesXml(cisaRss);
    expect(cisaSignals[0].watchlistMatches).toContain('#8');

    const frJson = JSON.stringify({
      results: [
        {
          document_number: '2026-23255',
          title: 'Review of Submarine Cable Landing License Rules (SLTE)',
          type: 'Rule',
          abstract: 'FCC SLTE foreign adversary reporting rules.',
          html_url: 'https://www.federalregister.gov/d/2026-23255',
          publication_date: '2026-11-16',
          agencies: [{ name: 'Federal Communications Commission' }],
        },
      ],
    });
    const frSignals = parseFederalRegisterJson(frJson);
    expect(frSignals[0].countdownMatches).toContain('2027-01-08');

    const cfJson = JSON.stringify({
      incidents: [
        {
          id: 'inc1',
          name: 'Elevated Edge Errors',
          status: 'investigating',
          impact: 'major',
          created_at: '2026-11-17T21:00:00Z',
        },
      ],
    });
    const cfSignals = parseStatuspageIncidentsJson(
      cfJson,
      'cloudflare-status',
      new Date('2026-11-17T22:00:00Z')
    );
    expect(cfSignals[0].severity).toBe('critical');
  });

  it('skips Gemini Search-grounding cleanly when GEMINI_API_KEY is empty', async () => {
    const prev = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const res = await maybeEnrichWithGemini({ signals: [], trackedIncidents: [] });
      expect(res.activated).toBe(false);
    } finally {
      if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
    }
  });
});

describe('Phase 3: Poisson Null-Hypothesis Math & Client-Side AES-256-GCM Vault', () => {
  it('reproduces Section 8.2 canonical Poisson probabilities (36.1%, 75.3%, 98.6%)', () => {
    const r1 = computePoissonClusterProbability({
      weeklyRate: 1.0,
      windowDays: 5,
      minEventsInWindow: 4,
    });
    expect(Number((r1.singleWindowProb * 100).toFixed(2))).toBeCloseTo(0.61, 2);
    expect(Number((r1.annualAtLeastOneProb * 100).toFixed(1))).toBeCloseTo(36.1, 1);

    const r14 = computePoissonClusterProbability({
      weeklyRate: 1.4,
      windowDays: 5,
      minEventsInWindow: 4,
    });
    expect(Number((r14.annualAtLeastOneProb * 100).toFixed(1))).toBeCloseTo(75.3, 1);

    const r2 = computePoissonClusterProbability({
      weeklyRate: 2.0,
      windowDays: 5,
      minEventsInWindow: 4,
    });
    expect(Number((r2.singleWindowProb * 100).toFixed(2))).toBeCloseTo(5.65, 2);
    expect(Number((r2.annualAtLeastOneProb * 100).toFixed(1))).toBeCloseTo(98.6, 1);
  });

  it('encrypts and decrypts the full briefing bundle via Web Crypto PBKDF2 + AES-256-GCM', async () => {
    const sampleBundle = {
      riskMatrix: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/riskMatrix.json'), 'utf8')
      ),
      incidents: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/incidents.json'), 'utf8')
      ),
      countdownCliffs: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/countdownCliffs.json'), 'utf8')
      ),
      watchlist: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/watchlist.json'), 'utf8')
      ),
      sections: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/sections.json'), 'utf8')
      ),
      changelog: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/changelog.json'), 'utf8')
      ),
      liveSignals: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/liveSignals.json'), 'utf8')
      ),
      feedHealth: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/feedHealth.json'), 'utf8')
      ),
      feedHistory: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'src/data/feedHistory.json'), 'utf8')
      ),
    } as FullBriefingDataBundle;

    expect(normalizePassphrase('  Alpha Bravo 99  ')).toBe('alpha-bravo-99');
    expect(normalizePassphrase('ALPHA-BRAVO-99')).toBe('alpha-bravo-99');

    const meta = await encryptBundleWithPasscode(sampleBundle, 'correct-horse-battery-staple');
    expect(meta.encrypted).toBe(true);
    expect(meta.ciphertextBase64).not.toContain('Optimizely');

    // Verify mobile-friendly case/whitespace normalization unlocks identically
    const decrypted = await decryptBundleWithPasscode(
      meta,
      '  Correct Horse Battery Staple  '
    );
    expect(decrypted.incidents).toHaveLength(10);
    expect(decrypted.riskMatrix).toHaveLength(8);
    expect(decrypted.feedHistory?.series['cisa-kev']?.length).toBeGreaterThanOrEqual(1);

    await expect(decryptBundleWithPasscode(meta, 'wrong-passcode')).rejects.toThrow();
  });

  it('ships all 8 bespoke editorial JPEG plates in public/images/ and resolves GitHub Pages basePath cleanly', async () => {
    const { resolvePublicAssetPath } = await import('../src/components/shell/TacticalFigure');
    const expectedImages = [
      'overview-backbone-map.jpg',
      'geopolitics-imperial-arc.jpg',
      'hormuz-mineral-chokepoints.jpg',
      'incidents-hybrid-routing.jpg',
      'sub-ip-blindspots.jpg',
      'contagion-clearing-vault.jpg',
      'watchlist-telemetry-mesh.jpg',
      'nsanet-patch-enclave.jpg',
    ];

    for (const fileName of expectedImages) {
      const fullPath = path.join(process.cwd(), 'public', 'images', fileName);
      expect(fs.existsSync(fullPath)).toBe(true);
      const buf = fs.readFileSync(fullPath);
      expect(buf.length).toBeGreaterThan(100_000);
      expect(buf.subarray(0, 3).toString('hex')).toBe('ffd8ff');
    }

    const prevBase = process.env.NEXT_PUBLIC_BASE_PATH;
    try {
      process.env.NEXT_PUBLIC_BASE_PATH = '/gray-zone-monitor';
      expect(resolvePublicAssetPath('/images/overview-backbone-map.jpg')).toBe(
        '/gray-zone-monitor/images/overview-backbone-map.jpg'
      );
      process.env.NEXT_PUBLIC_BASE_PATH = '';
      expect(resolvePublicAssetPath('/images/overview-backbone-map.jpg')).toBe(
        '/images/overview-backbone-map.jpg'
      );
    } finally {
      if (prevBase === undefined) {
        delete process.env.NEXT_PUBLIC_BASE_PATH;
      } else {
        process.env.NEXT_PUBLIC_BASE_PATH = prevBase;
      }
    }
  });
});

describe('Phase 4: Cross-Domain Graph, Feed History, Provenance, PWA & Non-Spoofing Guardrails', () => {
  const loadFullBundle = (): FullBriefingDataBundle => ({
    riskMatrix: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/riskMatrix.json'), 'utf8')
    ),
    incidents: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/incidents.json'), 'utf8')
    ),
    countdownCliffs: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/countdownCliffs.json'), 'utf8')
    ),
    watchlist: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/watchlist.json'), 'utf8')
    ),
    sections: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/sections.json'), 'utf8')
    ),
    changelog: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/changelog.json'), 'utf8')
    ),
    liveSignals: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/liveSignals.json'), 'utf8')
    ),
    feedHealth: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/feedHealth.json'), 'utf8')
    ),
    feedHistory: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/feedHistory.json'), 'utf8')
    ),
  });

  it('caps feedHistory ring buffer at 28 points per feed and deduplicates identical timestamps', () => {
    const bundle = loadFullBundle();
    let history = createEmptyFeedHistory('2026-11-01T00:00:00Z');

    // Same timestamp twice should replace rather than duplicate
    history = appendFeedHistorySnapshot(history, {
      ...bundle.feedHealth,
      checkedAtISO: '2026-11-01T15:00:00Z',
    });
    history = appendFeedHistorySnapshot(history, {
      ...bundle.feedHealth,
      checkedAtISO: '2026-11-01T15:00:00Z',
    });
    expect(history.series['cisa-kev']).toHaveLength(1);

    // Push 32 distinct sweeps and verify ring-buffer cap at 28
    for (let i = 0; i < 32; i += 1) {
      const ts = new Date(Date.UTC(2026, 10, 2, 0, i, 0)).toISOString();
      history = appendFeedHistorySnapshot(history, {
        ...bundle.feedHealth,
        checkedAtISO: ts,
      });
    }
    expect(history.series['cisa-kev']).toHaveLength(28);
    expect(history.series['faa-nas']).toHaveLength(28);
  });

  it('classifies Source Tiers, Verification Statuses, Cross-Domain Graph edges, and ?trace= keys accurately', async () => {
    const bundle = loadFullBundle();

    expect(classifySourceTier('https://www.federalregister.gov/d/2026-23255').code).toBe('TIER_1');
    expect(classifySourceTier('https://www.stepsecurity.io/blog/trivy').code).toBe('TIER_2');
    expect(classifySourceTier('https://example-news-outlet.com/story').code).toBe('TIER_3');

    const ev4 = bundle.incidents.find((i) => i.eventId === '#4')!;
    const ev2 = bundle.incidents.find((i) => i.eventId === '#2')!;
    expect(assessIncidentVerification(ev4).level).toBe('Corroborated');
    expect(assessIncidentVerification(ev2).level).toBe('Developing');

    const r2 = bundle.riskMatrix.find((r) => r.id === '#2')!;
    const r1 = bundle.riskMatrix.find((r) => r.id === '#1')!;
    expect(assessRiskVerification(r2).level).toBe('Corroborated');
    expect(assessRiskVerification(r1).level).toBe('Developing');

    const graph = buildCrossDomainGraph(bundle);
    expect(graph.nodes.filter((n) => n.column === 'risk')).toHaveLength(8);
    expect(graph.nodes.filter((n) => n.column === 'incident')).toHaveLength(10);
    expect(graph.nodes.filter((n) => n.column === 'watchlist')).toHaveLength(9);
    expect(graph.nodes.filter((n) => n.column === 'cliff')).toHaveLength(8);
    expect(graph.edges.length).toBeGreaterThan(40);

    // Every risk vector and incident must have at least one connected neighbor
    for (const r of bundle.riskMatrix) {
      expect(graph.adjacency[`risk:${r.id}`].length).toBeGreaterThan(0);
    }
    for (const inc of bundle.incidents) {
      expect(graph.adjacency[`inc:${inc.eventId}`].length).toBeGreaterThan(0);
    }

    expect(resolveTraceNodeKey('inc-2')).toBe('inc:#2');
    expect(resolveTraceNodeKey('risk-5')).toBe('risk:#5');
    expect(resolveTraceNodeKey('watch-8')).toBe('watch:#8');
    expect(resolveTraceNodeKey('cliff-2026-12-31')).toBe('cliff:2026-12-31');

    const sha = await computeBundleSha256Hex(bundle);
    expect(sha).toMatch(/^[a-f0-9]{64}$/);

    const summary = buildExecutiveSummaryText(bundle, Date.parse('2026-11-18T18:00:00Z'));
    expect(summary).toContain(NON_AFFILIATION_NOTICE);
    expect(summary).toContain('GRAY-ZONE & CRITICAL INFRASTRUCTURE RISK MONITOR');
  });

  it('generates GitHub Pages-scoped PWA manifest, offline service worker, and Disallow robots.txt', () => {
    expect(
      resolvePwaBasePath({
        NODE_ENV: 'production',
        GITHUB_ACTIONS: 'true',
        GITHUB_REPOSITORY: 'deck22t-sketch/gray-zone-monitor',
      })
    ).toBe('/gray-zone-monitor');

    const { manifestJson, swJs, robotsTxt } = buildPwaArtifacts('/gray-zone-monitor', 'abc1234567');
    const manifest = JSON.parse(manifestJson);
    expect(manifest.start_url).toBe('/gray-zone-monitor/');
    expect(manifest.scope).toBe('/gray-zone-monitor/');
    expect(swJs).toContain('gz-monitor-shell-abc1234567');
    expect(swJs).toContain('/gray-zone-monitor/incidents/');
    expect(robotsTxt).toContain('Disallow: /');
  });

  it('enforces zero DoD/government protocol spoofing and prohibited UI labels across src/ and scripts/', () => {
    const dirsToScan = [
      path.join(process.cwd(), 'src'),
      path.join(process.cwd(), 'scripts'),
    ];
    const forbiddenPatterns = [
      /\bTLP:(CLEAR|GREEN|AMBER|RED)\b/i,
      /\bICD\s*203\b/i,
      /\bAdmiralty\b/i,
      /\bSITREP\b/i,
      /\bZULU\b/,
      /President['’]s Daily Brief/i,
      /Thumb\s*Dock/i,
    ];

    function collectFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'data') continue; // skip canonical Google Doc narrative JSON
          files.push(...collectFiles(full));
        } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
          files.push(full);
        }
      }
      return files;
    }

    const codeFiles = dirsToScan.flatMap(collectFiles);
    expect(codeFiles.length).toBeGreaterThan(20);

    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of forbiddenPatterns) {
        expect(content, `Forbidden term ${pattern} found in ${file}`).not.toMatch(pattern);
      }
    }
  });
});

describe('Phase 5: Extensible Doc Schemas, Decision Simulators & Analyst Pinning', () => {
  const loadFullBundle = (): FullBriefingDataBundle => ({
    riskMatrix: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/riskMatrix.json'), 'utf8')
    ),
    incidents: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/incidents.json'), 'utf8')
    ),
    countdownCliffs: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/countdownCliffs.json'), 'utf8')
    ),
    watchlist: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/watchlist.json'), 'utf8')
    ),
    sections: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/sections.json'), 'utf8')
    ),
    changelog: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/changelog.json'), 'utf8')
    ),
    liveSignals: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/liveSignals.json'), 'utf8')
    ),
    feedHealth: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/feedHealth.json'), 'utf8')
    ),
    feedHistory: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/feedHistory.json'), 'utf8')
    ),
  });

  it('accepts future Google Doc row additions (>baseline) while rejecting truncated tables', () => {
    const bundle = loadFullBundle();

    const extraRisk = { ...bundle.riskMatrix[0], id: '#9' };
    const extraIncident = { ...bundle.incidents[0], eventId: '#11' };
    const extraCliff = { ...bundle.countdownCliffs[0], targetDateISO: '2027-06-01' };
    const extraWatch = { ...bundle.watchlist[0], id: '#10' };

    expect(RiskMatrixArraySchema.parse([...bundle.riskMatrix, extraRisk])).toHaveLength(9);
    expect(IncidentsArraySchema.parse([...bundle.incidents, extraIncident])).toHaveLength(11);
    expect(CountdownCliffsArraySchema.parse([...bundle.countdownCliffs, extraCliff])).toHaveLength(9);
    expect(WatchlistArraySchema.parse([...bundle.watchlist, extraWatch])).toHaveLength(10);

    // Still fail-closed if a mid-edit doc truncates below baseline minimums
    expect(() => RiskMatrixArraySchema.parse(bundle.riskMatrix.slice(0, 7))).toThrow();
    expect(() => IncidentsArraySchema.parse(bundle.incidents.slice(0, 9))).toThrow();
    expect(() => CountdownCliffsArraySchema.parse(bundle.countdownCliffs.slice(0, 7))).toThrow();
    expect(() => WatchlistArraySchema.parse(bundle.watchlist.slice(0, 8))).toThrow();
  });

  it('evaluates statutory regulatory clocks accurately including non-cyber outages and U.S. v. Heppner privilege risk', () => {
    const bankVendor = evaluateComplianceClocks({
      incidentType: 'vendor_outage',
      sector: 'bank_fintech',
      hoursElapsed: 18,
      usesConsumerAi: true,
    });

    const vendor4h = bankVendor.clocks.find((c) => c.id === 'us-vendor-4h')!;
    const bank36h = bankVendor.clocks.find((c) => c.id === 'us-bank-36h')!;
    expect(vendor4h.applicable).toBe(true);
    expect(vendor4h.status).toBe('BREACHED');
    expect(bank36h.applicable).toBe(true);
    expect(bank36h.status).toBe('ACTIVE');
    expect(bank36h.remainingHours).toBe(18);
    expect(bankVendor.breachedCount).toBe(1);
    expect(bankVendor.privilegeAlert.active).toBe(true);
    expect(bankVendor.privilegeAlert.headline).toContain('U.S. v. Heppner');
    expect(bankVendor.privilegeAlert.detail).toContain('Jed Rakoff');

    const euCyber = evaluateComplianceClocks({
      incidentType: 'cyber_intrusion',
      sector: 'eu_financial',
      hoursElapsed: 18,
      usesConsumerAi: false,
    });
    const dora4h = euCyber.clocks.find((c) => c.id === 'eu-dora-4h')!;
    expect(dora4h.applicable).toBe(true);
    expect(dora4h.status).toBe('BREACHED');
    expect(euCyber.privilegeAlert.active).toBe(false);
  });

  it('models mineral & hardware chokepoint depletion across 4-week vs 52-week inventory buffers', () => {
    const criticalRun = evaluateChokepointStress({
      profile: 'defense_rf_optics',
      bufferWeeks: 4,
      referenceDateISO: '2026-11-18',
    });
    expect(criticalRun.riskRating).toBe('CRITICAL');
    expect(criticalRun.stockoutDateISO).toBe('2026-12-16');
    expect(criticalRun.cliffs.map((c) => c.dateISO)).toEqual([
      '2026-11-27',
      '2027-01-01',
      '2027-01-10',
    ]);
    expect(criticalRun.cliffs.every((c) => c.exposed)).toBe(true);

    const bufferedRun = evaluateChokepointStress({
      profile: 'defense_rf_optics',
      bufferWeeks: 52,
      referenceDateISO: '2026-11-18',
    });
    expect(bufferedRun.riskRating).toBe('BUFFERED');
    expect(bufferedRun.stockoutDateISO).toBe('2027-11-17');
    expect(bufferedRun.cliffs.every((c) => !c.exposed)).toBe(true);
  });

  it('embeds analyst-pinned live OSINT signals into the executive text briefing export', () => {
    const bundle = loadFullBundle();
    const targetSig = bundle.liveSignals.signals[0];
    expect(targetSig).toBeDefined();

    const textWithPins = buildExecutiveSummaryText(
      bundle,
      Date.parse('2026-11-18T22:00:00Z'),
      [targetSig.id]
    );
    expect(textWithPins).toContain('ANALYST-PINNED LIVE SIGNALS (1)');
    expect(textWithPins).toContain(targetSig.title);
    expect(textWithPins).toContain('6. LATEST PUBLIC BACKBONE & REGULATORY TELEMETRY');

    const textWithoutPins = buildExecutiveSummaryText(
      bundle,
      Date.parse('2026-11-18T22:00:00Z'),
      []
    );
    expect(textWithoutPins).not.toContain('ANALYST-PINNED LIVE SIGNALS');
    expect(textWithoutPins).toContain('5. LATEST PUBLIC BACKBONE & REGULATORY TELEMETRY');
  });
});

