import {
  CountdownCliff,
  IncidentRow,
  LiveSignal,
  RiskVector,
  WatchlistRow,
} from '@/types/schemas';
import { FullBriefingDataBundle } from '@/lib/vault-crypto';

export const NON_AFFILIATION_NOTICE =
  'Independent open-source risk synthesis. Not affiliated with or endorsed by the U.S. Department of Defense or any government agency.';

export type SourceTierCode = 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface SourceTierAssessment {
  code: SourceTierCode;
  shortBadge: string;
  label: string;
  rationale: string;
  tone: 'emerald' | 'cyan' | 'amber';
}

export type VerificationLevel = 'Corroborated' | 'Developing';

export interface VerificationAssessment {
  level: VerificationLevel;
  basis: string;
  tone: 'emerald' | 'amber';
}

const TIER_1_HOST_PATTERNS = [
  /\.gov$/i,
  /\.mil$/i,
  /federalregister\.gov/i,
  /cisa\.gov/i,
  /faa\.gov/i,
  /sec\.gov/i,
  /fcc\.gov/i,
  /ic3\.gov/i,
  /gao\.gov/i,
  /europa\.eu$/i,
  /parliament\.uk$/i,
];

const TIER_2_HOST_PATTERNS = [
  /stepsecurity\.io/i,
  /blackkite\.com/i,
  /report-uri\.com/i,
  /cloudflarestatus\.com/i,
  /githubstatus\.com/i,
  /status\.aws\.amazon\.com/i,
  /apple\.com/i,
  /rusi\.org/i,
  /csis\.org/i,
  /RAND\.org/i,
  /carnegieendowment\.org/i,
  /iswresearch\.org/i,
  /understandingwar\.org/i,
  /industrialcyber\.co/i,
  /bleepingcomputer\.com/i,
  /krebsonsecurity\.com/i,
  /mandiant\.com/i,
  /crowdstrike\.com/i,
  /microsoft\.com/i,
  /cabforum\.org/i,
  /dtcc\.com/i,
  /fau\.edu/i,
];

export function classifySourceTier(url: string, publisherHint?: string): SourceTierAssessment {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    host = url.toLowerCase();
  }

  const combined = `${host} ${publisherHint ?? ''}`;

  if (TIER_1_HOST_PATTERNS.some((re) => re.test(host))) {
    return {
      code: 'TIER_1',
      shortBadge: 'Tier 1 · Primary Filing',
      label: 'Primary Regulatory / Statutory Feed',
      rationale:
        'Direct public government docket, statutory notice, or official infrastructure status endpoint.',
      tone: 'emerald',
    };
  }

  if (
    TIER_2_HOST_PATTERNS.some((re) => re.test(host)) ||
    /postmortem|advisory|cve-|stepsecurity|black kite|report uri|status/i.test(combined)
  ) {
    return {
      code: 'TIER_2',
      shortBadge: 'Tier 2 · Technical Forensics',
      label: 'Corroborated Vendor / Technical Research',
      rationale:
        'First-party engineering status telemetry, security lab IOC teardown, or peer-reviewed policy institute.',
      tone: 'cyan',
    };
  }

  return {
    code: 'TIER_3',
    shortBadge: 'Tier 3 · Press / Telemetry',
    label: 'Wire Reporting & Outage Telemetry',
    rationale:
      'Journalistic reporting, crowd outage aggregation, or secondary synthesis pending final vendor PIR.',
    tone: 'amber',
  };
}

export function assessRiskVerification(vec: RiskVector): VerificationAssessment {
  // Vectors #2, #3, #5, #6, #7 rest on published CVEs, statutory Federal Register dates, or court rulings
  if (['#2', '#3', '#5', '#6', '#7'].includes(vec.id)) {
    return {
      level: 'Corroborated',
      basis:
        'Anchored in published CVEs/IOCs, statutory Federal Register enforcement dates, or formal judicial/regulatory orders.',
      tone: 'emerald',
    };
  }
  return {
    level: 'Developing',
    basis:
      'Active hardware/forensic lab reviews, diplomatic negotiations, or multi-year strategic posture variables remain in motion.',
    tone: 'amber',
  };
}

export function assessIncidentVerification(inc: IncidentRow): VerificationAssessment {
  // Events where active lab probes, pending Nov 20 PIRs, or unconfirmed internal timelines remain open
  if (inc.eventId === '#2') {
    return {
      level: 'Developing',
      basis:
        'Broadcast flood & 8-min sign-off confirmed; Florida FBI/L3Harris router lab teardown and White House review remain active.',
      tone: 'amber',
    };
  }
  if (inc.eventId === '#8') {
    return {
      level: 'Developing',
      basis:
        'Official statement cites scheduled maintenance degradation; full internal enclave restoration timeline remains unconfirmed.',
      tone: 'amber',
    };
  }
  if (inc.eventId === '#1') {
    return {
      level: 'Corroborated',
      basis:
        'Gateway lock-contention & retry-storm mechanism confirmed by vendor; final post-incident report scheduled Nov. 20, 2026.',
      tone: 'emerald',
    };
  }
  if (inc.classification === 'unspecified') {
    return {
      level: 'Developing',
      basis: 'Root-cause engineering disclosure still pending.',
      tone: 'amber',
    };
  }
  return {
    level: 'Corroborated',
    basis:
      inc.classification === 'malicious_attack'
        ? 'Multi-lab forensic IOCs, payload hashes, and vendor remediation advisories independently verified.'
        : 'Service restoration and non-cyber technical root cause confirmed by operator statements and independent telemetry.',
    tone: 'emerald',
  };
}

export type CrossDomainColumn = 'risk' | 'incident' | 'watchlist' | 'cliff' | 'signal';

export interface CrossDomainNode {
  key: string; // e.g., 'risk:#1', 'inc:#2', 'watch:#2', 'cliff:2026-12-31', 'sig:...'
  column: CrossDomainColumn;
  code: string;
  title: string;
  subtitle: string;
  tone: 'crimson' | 'amber' | 'cyan' | 'emerald';
  href: string;
}

export interface CrossDomainEdge {
  from: string;
  to: string;
  tone: 'crimson' | 'amber' | 'cyan';
}

export interface CrossDomainGraph {
  nodes: CrossDomainNode[];
  nodeMap: Record<string, CrossDomainNode>;
  edges: CrossDomainEdge[];
  adjacency: Record<string, string[]>;
}

const RISK_CORRELATIONS: Record<
  string,
  { incidents: string[]; watchlist: string[]; cliffs: string[]; tone: 'crimson' | 'amber' | 'cyan' }
> = {
  '#1': {
    incidents: ['#1', '#2', '#3', '#5', '#6', '#7', '#8', '#9', '#10'],
    watchlist: ['#1', '#3', '#4', '#5', '#7', '#9'],
    cliffs: ['2026-11-18', '2026-11-20'],
    tone: 'amber',
  },
  '#2': {
    incidents: ['#2', '#4'],
    watchlist: ['#1', '#2', '#3', '#4', '#6', '#8'],
    cliffs: ['2026-11-18'],
    tone: 'crimson',
  },
  '#3': {
    incidents: ['#4', '#2'],
    watchlist: ['#1', '#5', '#8'],
    cliffs: ['2026-11-27', '2027-01-01'],
    tone: 'crimson',
  },
  '#4': {
    incidents: ['#1'],
    watchlist: ['#5', '#7'],
    cliffs: ['2026-11-27', '2027-01-01', '2027-01-10'],
    tone: 'amber',
  },
  '#5': {
    incidents: ['#5', '#9', '#10'],
    watchlist: ['#6', '#9'],
    cliffs: ['2026-11-18', '2026-12-31'],
    tone: 'cyan',
  },
  '#6': {
    incidents: ['#2', '#6', '#9'],
    watchlist: ['#4', '#5', '#9'],
    cliffs: ['2027-01-08', '2027-03-15'],
    tone: 'cyan',
  },
  '#7': {
    incidents: ['#1', '#3', '#5', '#7', '#10'],
    watchlist: ['#6', '#7'],
    cliffs: ['2026-11-20', '2026-12-31'],
    tone: 'amber',
  },
  '#8': {
    incidents: ['#2', '#8'],
    watchlist: ['#1', '#3', '#5', '#8'],
    cliffs: ['2026-11-27', '2027-01-01', '2027-01-08', '2027-01-10'],
    tone: 'crimson',
  },
};

export function buildCrossDomainGraph(bundle: FullBriefingDataBundle): CrossDomainGraph {
  const nodes: CrossDomainNode[] = [];
  const nodeMap: Record<string, CrossDomainNode> = {};
  const edges: CrossDomainEdge[] = [];
  const edgeDedup = new Set<string>();
  const adjacency: Record<string, Set<string>> = {};

  function registerNode(n: CrossDomainNode) {
    nodes.push(n);
    nodeMap[n.key] = n;
    adjacency[n.key] = new Set<string>();
  }

  function addEdge(a: string, b: string, tone: 'crimson' | 'amber' | 'cyan') {
    if (!nodeMap[a] || !nodeMap[b] || a === b) return;
    const pairKey = a < b ? `${a}<->${b}` : `${b}<->${a}`;
    if (!edgeDedup.has(pairKey)) {
      edgeDedup.add(pairKey);
      edges.push({ from: a, to: b, tone });
    }
    adjacency[a].add(b);
    adjacency[b].add(a);
  }

  for (const r of bundle.riskMatrix) {
    const isSevere = /catastrophic|severe/i.test(r.blastRadius);
    registerNode({
      key: `risk:${r.id}`,
      column: 'risk',
      code: `RISK ${r.id}`,
      title: r.domain,
      subtitle: `${r.horizonGroup} · ${r.likelihood.split('(')[0].trim()}`,
      tone: isSevere ? 'crimson' : 'amber',
      href: '/#risk-matrix-section',
    });
  }

  for (const inc of bundle.incidents) {
    const tone =
      inc.classification === 'malicious_attack'
        ? 'crimson'
        : inc.classification === 'client_cascade'
        ? 'cyan'
        : 'amber';
    registerNode({
      key: `inc:${inc.eventId}`,
      column: 'incident',
      code: `EVENT ${inc.eventId}`,
      title: inc.entity,
      subtitle: inc.sector,
      tone,
      href: `/incidents/#incident-card-${inc.eventId.replace('#', '')}`,
    });
  }

  for (const w of bundle.watchlist) {
    registerNode({
      key: `watch:${w.id}`,
      column: 'watchlist',
      code: `WATCH ${w.id}`,
      title: w.signal,
      subtitle: w.forensicMeaning.slice(0, 68) + (w.forensicMeaning.length > 68 ? '…' : ''),
      tone: ['#1', '#2', '#8'].includes(w.id) ? 'crimson' : 'cyan',
      href: '/watchlist/',
    });
  }

  for (const c of bundle.countdownCliffs) {
    registerNode({
      key: `cliff:${c.targetDateISO}`,
      column: 'cliff',
      code: c.dateLabel,
      title: c.milestone,
      subtitle: c.targetDateISO,
      tone: c.targetDateISO <= '2026-11-27' ? 'crimson' : 'amber',
      href: '/#cliff-strip-section',
    });
  }

  // Include top 8 highest-priority live signals that have explicit domain matches
  const matchedSignals: LiveSignal[] = bundle.liveSignals.signals
    .filter(
      (s) =>
        s.watchlistMatches.length > 0 ||
        s.riskMatrixMatches.length > 0 ||
        s.countdownMatches.length > 0
    )
    .slice(0, 8);

  for (const sig of matchedSignals) {
    registerNode({
      key: `sig:${sig.id}`,
      column: 'signal',
      code: sig.severity.toUpperCase(),
      title: sig.title,
      subtitle: sig.sourceName,
      tone:
        sig.severity === 'critical'
          ? 'crimson'
          : sig.severity === 'elevated'
          ? 'amber'
          : 'emerald',
      href: '/watchlist/?tab=live-wire',
    });
  }

  // Wire curated canonical correlations across Risks <-> Incidents <-> Watchlist <-> Cliffs
  for (const [riskId, spec] of Object.entries(RISK_CORRELATIONS)) {
    const rKey = `risk:${riskId}`;
    for (const incId of spec.incidents) {
      addEdge(rKey, `inc:${incId}`, spec.tone);
      // Also connect those incidents to the first two watchlist indicators for direct trace hops
      for (const wId of spec.watchlist.slice(0, 3)) {
        addEdge(`inc:${incId}`, `watch:${wId}`, spec.tone);
      }
    }
    for (const wId of spec.watchlist) {
      addEdge(rKey, `watch:${wId}`, spec.tone);
      for (const cIso of spec.cliffs) {
        addEdge(`watch:${wId}`, `cliff:${cIso}`, 'amber');
      }
    }
    for (const cIso of spec.cliffs) {
      addEdge(rKey, `cliff:${cIso}`, 'amber');
    }
  }

  // Wire Live OSINT signals to their matched Watchlist, Risk, and Cliff nodes
  for (const sig of matchedSignals) {
    const sKey = `sig:${sig.id}`;
    const edgeTone = sig.severity === 'critical' ? 'crimson' : 'cyan';
    for (const wId of sig.watchlistMatches) {
      addEdge(sKey, `watch:${wId}`, edgeTone);
    }
    for (const rId of sig.riskMatrixMatches) {
      addEdge(sKey, `risk:${rId}`, edgeTone);
    }
    for (const cIso of sig.countdownMatches) {
      addEdge(sKey, `cliff:${cIso}`, 'amber');
    }
  }

  const plainAdjacency: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(adjacency)) {
    plainAdjacency[k] = Array.from(set);
  }

  return {
    nodes,
    nodeMap,
    edges,
    adjacency: plainAdjacency,
  };
}

/**
 * Resolves URL query params like `inc-2`, `inc:#2`, `risk-1`, `watch-8`, or `cliff-2026-12-31`
 * into a canonical CrossDomainNode key.
 */
export function resolveTraceNodeKey(rawTrace: string | null | undefined): string | null {
  if (!rawTrace) return null;
  const cleaned = rawTrace.trim();
  if (!cleaned) return null;

  if (cleaned.includes(':')) {
    return cleaned;
  }
  const incMatch = cleaned.match(/^inc-(\d+)$/i);
  if (incMatch) return `inc:#${incMatch[1]}`;

  const riskMatch = cleaned.match(/^risk-(\d+)$/i);
  if (riskMatch) return `risk:#${riskMatch[1]}`;

  const watchMatch = cleaned.match(/^watch-(\d+)$/i);
  if (watchMatch) return `watch:#${watchMatch[1]}`;

  const cliffMatch = cleaned.match(/^cliff-(\d{4}-\d{2}-\d{2})$/i);
  if (cliffMatch) return `cliff:${cliffMatch[1]}`;

  return null;
}

export async function computeBundleSha256Hex(bundle: FullBriefingDataBundle): Promise<string> {
  const canonicalPayload = JSON.stringify({
    docDate: bundle.sections.docDate,
    docHash: bundle.changelog.docHash,
    riskCount: bundle.riskMatrix.length,
    incidentCount: bundle.incidents.length,
    watchlistCount: bundle.watchlist.length,
    cliffCount: bundle.countdownCliffs.length,
    riskMatrix: bundle.riskMatrix,
    incidents: bundle.incidents,
  });
  const encoded = new TextEncoder().encode(canonicalPayload);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function buildExecutiveSummaryText(
  bundle: FullBriefingDataBundle,
  nowMs: number = Date.now()
): string {
  const { sections, changelog, feedHealth, liveSignals, riskMatrix, countdownCliffs, incidents } =
    bundle;
  const generatedUtc = new Date(nowMs).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const maliciousCount = incidents.filter((i) => i.classification === 'malicious_attack').length;
  const hybridCount = incidents.filter((i) => i.classification === 'hybrid_transition_bug').length;
  const cascadeCount = incidents.filter((i) => i.classification === 'client_cascade').length;

  const immediateRisks = riskMatrix
    .filter((r) => r.horizonGroup === 'Immediate')
    .map((r) => `  • [${r.id}] ${r.domain} — Likelihood: ${r.likelihood.split('(')[0].trim()}`);

  const upcomingCliffs = countdownCliffs.slice(0, 4).map((c) => {
    const diffDays = Math.ceil((Date.parse(c.targetTimestampISO) - nowMs) / 86_400_000);
    const tag = diffDays <= 0 ? 'ACTIVE NOW' : `T-${diffDays}d`;
    return `  • ${c.dateLabel} (${tag}): ${c.milestone}`;
  });

  const statusUpdates =
    changelog.updatedStatuses.length > 0
      ? changelog.updatedStatuses.map(
          (u) => `  • Event ${u.eventId} (${u.entity}): ${u.currentStatus}`
        )
      : ['  • No incident status changes since prior canonical sync.'];

  const topLive = liveSignals.signals.slice(0, 4).map(
    (s) => `  • [${s.severity.toUpperCase()} · ${s.sourceName}] ${s.title}`
  );

  return [
    '====================================================================',
    'GRAY-ZONE & CRITICAL INFRASTRUCTURE RISK MONITOR — EXECUTIVE SUMMARY',
    `Generated: ${generatedUtc} | Canonical Briefing Edition: ${sections.docDate}`,
    `Public Feed Telemetry: ${feedHealth.liveCount}/${feedHealth.totalFeeds} Live | Active OSINT Signals: ${liveSignals.totalSignals}`,
    '====================================================================',
    '',
    '1. EXECUTIVE POSTURE & 10-EVENT ATTRIBUTION SPLIT',
    `  ${sections.executiveSummary.intro}`,
    `  • Tracked Wave (${incidents.length} Events): ${maliciousCount} Confirmed Malicious Supply-Chain | ${hybridCount} Hybrid/Technical Bugs | ${cascadeCount} Client Auth Cascade`,
    '',
    '2. LATEST EDITION STATUS UPDATES',
    ...statusUpdates,
    '',
    '3. IMMEDIATE RISK VECTORS',
    ...immediateRisks,
    '',
    '4. NEAREST REGULATORY, SUPPLY-CHAIN & CLEARING CLIFFS',
    ...upcomingCliffs,
    '',
    '5. LATEST PUBLIC BACKBONE & REGULATORY TELEMETRY',
    ...(topLive.length > 0 ? topLive : ['  • All monitored feeds nominal.']),
    '',
    '--------------------------------------------------------------------',
    `Provenance Hash (Doc SHA-256): ${changelog.docHash.slice(0, 16)}…`,
    `Notice: ${NON_AFFILIATION_NOTICE}`,
    '====================================================================',
  ].join('\n');
}
