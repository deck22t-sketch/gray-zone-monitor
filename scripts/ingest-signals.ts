import fs from 'node:fs';
import path from 'node:path';
import {
  FeedHealthData,
  FeedHealthDataSchema,
  FeedHealthEntry,
  FeedId,
  IncidentRow,
  LiveSignal,
  LiveSignalsData,
  LiveSignalsDataSchema,
} from '../src/types/schemas';
import {
  parseAppleSystemStatus,
  parseAwsStatusRss,
  parseCisaAdvisoriesXml,
  parseCisaKevJson,
  parseFaaNasStatus,
  parseFederalRegisterJson,
  parseStatuspageIncidentsJson,
} from './lib/signal-parsers';
import { maybeEnrichWithGemini } from './lib/gemini-enricher';

const USER_AGENT = 'GrayZoneRiskMonitor/1.0 (+github-actions)';
const PER_SOURCE_TIMEOUT_MS = 15_000;

interface FeedFetchOutcome {
  id: FeedId;
  name: string;
  endpoint: string;
  httpStatus: number | null;
  latencyMs: number;
  signals: LiveSignal[];
  updateTimeText?: string;
  error?: string;
}

async function fetchWithHeaderAndTimeout(url: string): Promise<{ status: number; body: string }> {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json, application/xml, text/xml, text/javascript, */*',
    },
    signal: AbortSignal.timeout(PER_SOURCE_TIMEOUT_MS),
  });
  const body = await resp.text();
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} from ${url}`);
  }
  return { status: resp.status, body };
}

async function collectCisaKev(): Promise<FeedFetchOutcome> {
  const endpoint =
    'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(endpoint);
  const signals = parseCisaKevJson(body);
  return {
    id: 'cisa-kev',
    name: 'CISA KEV Catalog',
    endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals,
  };
}

async function collectCisaAdvisories(): Promise<FeedFetchOutcome> {
  const endpoint = 'https://www.cisa.gov/cybersecurity-advisories/all.xml';
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(endpoint);
  const signals = parseCisaAdvisoriesXml(body);
  return {
    id: 'cisa-advisories',
    name: 'CISA Cybersecurity Advisories',
    endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals,
  };
}

async function collectFaaNas(): Promise<FeedFetchOutcome> {
  const xmlEndpoint = 'https://nasstatus.faa.gov/api/airport-status-information';
  const jsonEndpoint = 'https://nasstatus.faa.gov/api/airport-events';
  const t0 = Date.now();

  const [xmlRes, jsonRes] = await Promise.allSettled([
    fetchWithHeaderAndTimeout(xmlEndpoint),
    fetchWithHeaderAndTimeout(jsonEndpoint),
  ]);

  if (xmlRes.status === 'rejected' && jsonRes.status === 'rejected') {
    throw new Error(
      `FAA NAS endpoints failed: XML=${String(xmlRes.reason)}; JSON=${String(jsonRes.reason)}`
    );
  }

  const rawXml =
    xmlRes.status === 'fulfilled'
      ? xmlRes.value.body
      : `<AIRPORT_STATUS_INFORMATION><Update_Time>${new Date().toUTCString()}</Update_Time></AIRPORT_STATUS_INFORMATION>`;
  const rawJson = jsonRes.status === 'fulfilled' ? jsonRes.value.body : null;
  const httpStatus =
    xmlRes.status === 'fulfilled'
      ? xmlRes.value.status
      : jsonRes.status === 'fulfilled'
      ? jsonRes.value.status
      : null;

  const { updateTimeText, signals } = parseFaaNasStatus(rawXml, rawJson);
  return {
    id: 'faa-nas',
    name: 'FAA NAS Status',
    endpoint: xmlEndpoint,
    httpStatus,
    latencyMs: Date.now() - t0,
    signals,
    updateTimeText,
  };
}

async function collectFederalRegister(): Promise<FeedFetchOutcome> {
  // Primary 5 sub-agency slugs + CISA via DHS cybersecurity term filter
  const primaryEndpoint =
    'https://www.federalregister.gov/api/v1/documents.json?per_page=25&order=newest' +
    '&conditions%5Bagencies%5D%5B%5D=industry-and-security-bureau' +
    '&conditions%5Bagencies%5D%5B%5D=federal-aviation-administration' +
    '&conditions%5Bagencies%5D%5B%5D=federal-communications-commission' +
    '&conditions%5Bagencies%5D%5B%5D=securities-and-exchange-commission' +
    '&conditions%5Bagencies%5D%5B%5D=comptroller-of-the-currency';

  const cisaDhsEndpoint =
    'https://www.federalregister.gov/api/v1/documents.json?per_page=10&order=newest' +
    '&conditions%5Bagencies%5D%5B%5D=homeland-security-department' +
    '&conditions%5Bterm%5D=CISA+OR+cybersecurity+OR+critical+infrastructure';

  const t0 = Date.now();
  const [primaryRes, cisaRes] = await Promise.allSettled([
    fetchWithHeaderAndTimeout(primaryEndpoint),
    fetchWithHeaderAndTimeout(cisaDhsEndpoint),
  ]);

  if (primaryRes.status === 'rejected' && cisaRes.status === 'rejected') {
    throw new Error(`Federal Register API failed: ${String(primaryRes.reason)}`);
  }

  const mergedSignals: LiveSignal[] = [];
  const seenIds = new Set<string>();

  if (primaryRes.status === 'fulfilled') {
    for (const s of parseFederalRegisterJson(primaryRes.value.body)) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        mergedSignals.push(s);
      }
    }
  }
  if (cisaRes.status === 'fulfilled') {
    for (const s of parseFederalRegisterJson(cisaRes.value.body)) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        mergedSignals.push(s);
      }
    }
  }

  mergedSignals.sort(
    (a, b) => Date.parse(b.publishedAtISO) - Date.parse(a.publishedAtISO)
  );

  return {
    id: 'federal-register',
    name: 'U.S. Federal Register',
    endpoint: 'https://www.federalregister.gov/api/v1/documents.json?per_page=25&order=newest',
    httpStatus:
      primaryRes.status === 'fulfilled'
        ? primaryRes.value.status
        : cisaRes.status === 'fulfilled'
        ? cisaRes.value.status
        : 200,
    latencyMs: Date.now() - t0,
    signals: mergedSignals.slice(0, 15),
  };
}

async function collectCloudflareStatus(): Promise<FeedFetchOutcome> {
  const endpoint = 'https://www.cloudflarestatus.com/api/v2/incidents.json';
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(endpoint);
  return {
    id: 'cloudflare-status',
    name: 'Cloudflare Status',
    endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseStatuspageIncidentsJson(body, 'cloudflare-status'),
  };
}

async function collectGithubStatus(): Promise<FeedFetchOutcome> {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json';
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(endpoint);
  return {
    id: 'github-status',
    name: 'GitHub Status',
    endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseStatuspageIncidentsJson(body, 'github-status'),
  };
}

async function collectAwsStatus(): Promise<FeedFetchOutcome> {
  const endpoint = 'https://status.aws.amazon.com/rss/all.rss';
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(endpoint);
  return {
    id: 'aws-status',
    name: 'AWS Service Health',
    endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseAwsStatusRss(body),
  };
}

async function collectAppleStatus(): Promise<FeedFetchOutcome> {
  const endpoint = 'https://www.apple.com/support/systemstatus/data/system_status_en_US.js';
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(endpoint);
  return {
    id: 'apple-status',
    name: 'Apple System Status',
    endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseAppleSystemStatus(body),
  };
}

const FEED_MANIFEST: Array<{
  id: FeedId;
  name: string;
  endpoint: string;
  runner: () => Promise<FeedFetchOutcome>;
}> = [
  {
    id: 'cisa-kev',
    name: 'CISA KEV Catalog',
    endpoint: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    runner: collectCisaKev,
  },
  {
    id: 'cisa-advisories',
    name: 'CISA Cybersecurity Advisories',
    endpoint: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    runner: collectCisaAdvisories,
  },
  {
    id: 'faa-nas',
    name: 'FAA NAS Status',
    endpoint: 'https://nasstatus.faa.gov/api/airport-status-information',
    runner: collectFaaNas,
  },
  {
    id: 'federal-register',
    name: 'U.S. Federal Register',
    endpoint: 'https://www.federalregister.gov/api/v1/documents.json?per_page=25&order=newest',
    runner: collectFederalRegister,
  },
  {
    id: 'cloudflare-status',
    name: 'Cloudflare Status',
    endpoint: 'https://www.cloudflarestatus.com/api/v2/incidents.json',
    runner: collectCloudflareStatus,
  },
  {
    id: 'github-status',
    name: 'GitHub Status',
    endpoint: 'https://www.githubstatus.com/api/v2/incidents.json',
    runner: collectGithubStatus,
  },
  {
    id: 'aws-status',
    name: 'AWS Service Health',
    endpoint: 'https://status.aws.amazon.com/rss/all.rss',
    runner: collectAwsStatus,
  },
  {
    id: 'apple-status',
    name: 'Apple System Status',
    endpoint: 'https://www.apple.com/support/systemstatus/data/system_status_en_US.js',
    runner: collectAppleStatus,
  },
];

const SEVERITY_RANK: Record<LiveSignal['severity'], number> = {
  critical: 3,
  elevated: 2,
  info: 1,
};

async function main() {
  const rootDir = process.cwd();
  const dataDir = path.join(rootDir, 'src', 'data');
  const liveSignalsPath = path.join(dataDir, 'liveSignals.json');
  const feedHealthPath = path.join(dataDir, 'feedHealth.json');
  const incidentsPath = path.join(dataDir, 'incidents.json');

  const nowISO = new Date().toISOString();

  // Load prior feedHealth & signals so transient upstream failures preserve prior cached telemetry
  let priorHealthMap = new Map<FeedId, FeedHealthEntry>();
  if (fs.existsSync(feedHealthPath)) {
    try {
      const prior = JSON.parse(fs.readFileSync(feedHealthPath, 'utf8')) as FeedHealthData;
      priorHealthMap = new Map(prior.feeds.map((f) => [f.id, f]));
    } catch {
      // Ignore malformed prior telemetry
    }
  }

  let priorSignalsBySource = new Map<FeedId, LiveSignal[]>();
  if (fs.existsSync(liveSignalsPath)) {
    try {
      const priorSignals = JSON.parse(fs.readFileSync(liveSignalsPath, 'utf8')) as LiveSignalsData;
      for (const sig of priorSignals.signals) {
        const list = priorSignalsBySource.get(sig.sourceId) ?? [];
        list.push(sig);
        priorSignalsBySource.set(sig.sourceId, list);
      }
    } catch {
      // Ignore
    }
  }

  const settled = await Promise.allSettled(FEED_MANIFEST.map((f) => f.runner()));

  const healthEntries: FeedHealthEntry[] = [];
  const rawCollectedSignals: LiveSignal[] = [];

  settled.forEach((res, idx) => {
    const meta = FEED_MANIFEST[idx];
    const prevHealth = priorHealthMap.get(meta.id);

    if (res.status === 'fulfilled') {
      const out = res.value;
      healthEntries.push({
        id: meta.id,
        name: meta.name,
        endpoint: meta.endpoint,
        status: 'live',
        httpStatus: out.httpStatus,
        latencyMs: out.latencyMs,
        itemCount: out.signals.length,
        updateTimeText: out.updateTimeText,
        lastSuccessAtISO: nowISO,
      });
      rawCollectedSignals.push(...out.signals);
    } else {
      const errMsg = res.reason instanceof Error ? res.reason.message : String(res.reason);
      const cached = priorSignalsBySource.get(meta.id) ?? [];
      healthEntries.push({
        id: meta.id,
        name: meta.name,
        endpoint: meta.endpoint,
        status: cached.length > 0 ? 'degraded' : 'offline',
        httpStatus: null,
        latencyMs: PER_SOURCE_TIMEOUT_MS,
        itemCount: cached.length,
        error: errMsg,
        lastSuccessAtISO: prevHealth?.lastSuccessAtISO ?? null,
      });
      rawCollectedSignals.push(...cached);
    }
  });

  // Deduplicate by signal id and sort by severity then recency
  const dedupedMap = new Map<string, LiveSignal>();
  for (const sig of rawCollectedSignals) {
    if (!dedupedMap.has(sig.id)) {
      dedupedMap.set(sig.id, sig);
    }
  }

  const sortedSignals = Array.from(dedupedMap.values()).sort((a, b) => {
    const sevDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return (Date.parse(b.publishedAtISO) || 0) - (Date.parse(a.publishedAtISO) || 0);
  });

  let trackedIncidents: IncidentRow[] = [];
  if (fs.existsSync(incidentsPath)) {
    try {
      trackedIncidents = JSON.parse(fs.readFileSync(incidentsPath, 'utf8')) as IncidentRow[];
    } catch {
      trackedIncidents = [];
    }
  }

  // Optional Gemini Search-Grounding Enrichment (no-op in Zero-Key Mode)
  const enrichment = await maybeEnrichWithGemini({
    signals: sortedSignals,
    trackedIncidents,
  });

  const liveCount = healthEntries.filter((f) => f.status === 'live').length;

  const feedHealthPayload: FeedHealthData = FeedHealthDataSchema.parse({
    checkedAtISO: nowISO,
    liveCount,
    totalFeeds: FEED_MANIFEST.length,
    feeds: healthEntries,
  });

  const liveSignalsPayload: LiveSignalsData = LiveSignalsDataSchema.parse({
    ingestedAtISO: nowISO,
    ingestionMode: enrichment.activated ? 'GEMINI_ENRICHED' : 'ZERO_KEY_PUBLIC_FEEDS',
    totalSignals: enrichment.signals.length,
    incidentSweepNotes: enrichment.incidentSweepNotes,
    signals: enrichment.signals,
  });

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(feedHealthPath, `${JSON.stringify(feedHealthPayload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(liveSignalsPath, `${JSON.stringify(liveSignalsPayload, null, 2)}\n`, 'utf8');

  console.log(
    `[ingest-signals] Mode=${liveSignalsPayload.ingestionMode} | Feeds Live=${liveCount}/${FEED_MANIFEST.length} | Total Signals=${liveSignalsPayload.totalSignals}`
  );
  for (const f of healthEntries) {
    console.log(
      `  - [${f.status.toUpperCase()}] ${f.name}: HTTP ${f.httpStatus ?? 'ERR'} (${f.latencyMs}ms, ${f.itemCount} items)${
        f.error ? ` — ${f.error}` : ''
      }`
    );
  }

  if (liveCount === 0) {
    console.error('[ingest-signals] ERROR: 0/8 public feeds succeeded.');
    process.exit(1);
  }
}

main();
