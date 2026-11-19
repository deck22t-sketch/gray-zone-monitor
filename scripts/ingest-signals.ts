import fs from 'node:fs';
import path from 'node:path';
import {
  FeedHealthData,
  FeedHealthDataSchema,
  FeedHealthEntry,
  FeedHistoryData,
  FeedId,
  IncidentRow,
  LiveSignal,
  LiveSignalsData,
  LiveSignalsDataSchema,
} from '../src/types/schemas';
import { buildNistNvdWindowUrl, FEED_META_BY_ID, FEED_REGISTRY } from '../src/lib/feed-registry';
import {
  parseAppleSystemStatus,
  parseAwsStatusRss,
  parseAzureStatusRss,
  parseCisaAdvisoriesXml,
  parseCisaKevJson,
  parseFaaNasStatus,
  parseFederalRegisterJson,
  parseGcpStatusJson,
  parseNistNvdJson,
  parseNoaaSwpcAlertsJson,
  parseOciComponentsJson,
  parseOciStatusRss,
  parseOfacMaradDoeJson,
  parseStatuspageIncidentsJson,
  parseUsgsSeismicGeoJson,
} from './lib/signal-parsers';
import { maybeEnrichWithGemini } from './lib/gemini-enricher';
import { appendFeedHistorySnapshot } from './lib/feed-history';

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
  const meta = FEED_META_BY_ID['cisa-kev'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseCisaKevJson(body),
  };
}

async function collectCisaAdvisories(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['cisa-advisories'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseCisaAdvisoriesXml(body),
  };
}

async function collectNistNvd(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['nist-nvd'];
  const windowUrl14 = buildNistNvdWindowUrl(new Date(), 14);
  const windowUrl7 = buildNistNvdWindowUrl(new Date(), 7);
  const t0 = Date.now();
  try {
    const { status, body } = await fetchWithHeaderAndTimeout(windowUrl14);
    return {
      id: meta.id,
      name: meta.name,
      endpoint: meta.endpoint,
      httpStatus: status,
      latencyMs: Date.now() - t0,
      signals: parseNistNvdJson(body),
    };
  } catch {
    await new Promise((r) => setTimeout(r, 1200));
    const { status, body } = await fetchWithHeaderAndTimeout(windowUrl7);
    return {
      id: meta.id,
      name: meta.name,
      endpoint: meta.endpoint,
      httpStatus: status,
      latencyMs: Date.now() - t0,
      signals: parseNistNvdJson(body),
    };
  }
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

async function collectUsgsSeismic(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['usgs-seismic'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseUsgsSeismicGeoJson(body),
  };
}

async function collectNoaaSwpc(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['noaa-swpc'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseNoaaSwpcAlertsJson(body),
  };
}

async function collectFederalRegister(): Promise<FeedFetchOutcome> {
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
    endpoint: FEED_META_BY_ID['federal-register'].endpoint,
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

async function collectOfacMaradDoe(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['ofac-marad-doe'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseOfacMaradDoeJson(body),
  };
}

async function collectAwsStatus(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['aws-status'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseAwsStatusRss(body),
  };
}

async function collectGcpStatus(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['gcp-status'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseGcpStatusJson(body),
  };
}

async function collectAzureStatus(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['azure-status'];
  const fallbackUrl = 'https://azure.microsoft.com/en-us/status/feed/';
  const t0 = Date.now();
  try {
    const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
    return {
      id: meta.id,
      name: meta.name,
      endpoint: meta.endpoint,
      httpStatus: status,
      latencyMs: Date.now() - t0,
      signals: parseAzureStatusRss(body),
    };
  } catch {
    const { status, body } = await fetchWithHeaderAndTimeout(fallbackUrl);
    return {
      id: meta.id,
      name: meta.name,
      endpoint: meta.endpoint,
      httpStatus: status,
      latencyMs: Date.now() - t0,
      signals: parseAzureStatusRss(body),
    };
  }
}

async function collectOciStatus(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['oci-status'];
  const rssEndpoint = 'https://ocistatus.oraclecloud.com/api/v2/incident-summary.rss';
  const componentsEndpoint = 'https://ocistatus.oraclecloud.com/api/v2/components.json';
  const t0 = Date.now();

  const [rssRes, compRes] = await Promise.allSettled([
    fetchWithHeaderAndTimeout(rssEndpoint),
    fetchWithHeaderAndTimeout(componentsEndpoint),
  ]);

  if (rssRes.status === 'rejected' && compRes.status === 'rejected') {
    throw new Error(`OCI Status endpoints failed: ${String(rssRes.reason)}`);
  }

  const merged: LiveSignal[] = [];
  if (rssRes.status === 'fulfilled') {
    merged.push(...parseOciStatusRss(rssRes.value.body));
  }
  if (compRes.status === 'fulfilled') {
    merged.push(...parseOciComponentsJson(compRes.value.body));
  }

  const httpStatus =
    rssRes.status === 'fulfilled'
      ? rssRes.value.status
      : compRes.status === 'fulfilled'
      ? compRes.value.status
      : 200;

  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus,
    latencyMs: Date.now() - t0,
    signals: merged.slice(0, 10),
  };
}

async function collectCloudflareStatus(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['cloudflare-status'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseStatuspageIncidentsJson(body, 'cloudflare-status'),
  };
}

async function collectGithubStatus(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['github-status'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseStatuspageIncidentsJson(body, 'github-status'),
  };
}

async function collectAppleStatus(): Promise<FeedFetchOutcome> {
  const meta = FEED_META_BY_ID['apple-status'];
  const t0 = Date.now();
  const { status, body } = await fetchWithHeaderAndTimeout(meta.endpoint);
  return {
    id: meta.id,
    name: meta.name,
    endpoint: meta.endpoint,
    httpStatus: status,
    latencyMs: Date.now() - t0,
    signals: parseAppleSystemStatus(body),
  };
}

const RUNNER_BY_ID: Record<FeedId, () => Promise<FeedFetchOutcome>> = {
  'cisa-kev': collectCisaKev,
  'cisa-advisories': collectCisaAdvisories,
  'nist-nvd': collectNistNvd,
  'faa-nas': collectFaaNas,
  'usgs-seismic': collectUsgsSeismic,
  'noaa-swpc': collectNoaaSwpc,
  'federal-register': collectFederalRegister,
  'ofac-marad-doe': collectOfacMaradDoe,
  'aws-status': collectAwsStatus,
  'gcp-status': collectGcpStatus,
  'azure-status': collectAzureStatus,
  'oci-status': collectOciStatus,
  'cloudflare-status': collectCloudflareStatus,
  'github-status': collectGithubStatus,
  'apple-status': collectAppleStatus,
};

const FEED_MANIFEST = FEED_REGISTRY.map((entry) => ({
  id: entry.id,
  name: entry.name,
  endpoint: entry.endpoint,
  runner: RUNNER_BY_ID[entry.id],
}));

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
  const feedHistoryPath = path.join(dataDir, 'feedHistory.json');
  const incidentsPath = path.join(dataDir, 'incidents.json');

  const nowISO = new Date().toISOString();

  // Load prior feedHealth & signals so transient upstream failures preserve prior cached telemetry
  let priorHealthData: FeedHealthData | null = null;
  let priorHealthMap = new Map<FeedId, FeedHealthEntry>();
  if (fs.existsSync(feedHealthPath)) {
    try {
      const prior = JSON.parse(fs.readFileSync(feedHealthPath, 'utf8')) as FeedHealthData;
      priorHealthData = prior;
      priorHealthMap = new Map(prior.feeds.map((f) => [f.id, f]));
    } catch {
      // Ignore malformed prior telemetry
    }
  }

  let priorFeedHistory: FeedHistoryData | null = null;
  if (fs.existsSync(feedHistoryPath)) {
    try {
      priorFeedHistory = JSON.parse(fs.readFileSync(feedHistoryPath, 'utf8')) as FeedHistoryData;
    } catch {
      priorFeedHistory = null;
    }
  } else if (priorHealthData) {
    priorFeedHistory = appendFeedHistorySnapshot(null, priorHealthData);
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

  const feedHistoryPayload: FeedHistoryData = appendFeedHistorySnapshot(
    priorFeedHistory,
    feedHealthPayload
  );

  const liveSignalsPayload: LiveSignalsData = LiveSignalsDataSchema.parse({
    ingestedAtISO: nowISO,
    ingestionMode: enrichment.activated ? 'GEMINI_ENRICHED' : 'ZERO_KEY_PUBLIC_FEEDS',
    totalSignals: enrichment.signals.length,
    incidentSweepNotes: enrichment.incidentSweepNotes,
    signals: enrichment.signals,
  });

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(feedHealthPath, `${JSON.stringify(feedHealthPayload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(feedHistoryPath, `${JSON.stringify(feedHistoryPayload, null, 2)}\n`, 'utf8');
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
    console.error(`[ingest-signals] ERROR: 0/${FEED_MANIFEST.length} public feeds succeeded.`);
    process.exit(1);
  }
}

main();
