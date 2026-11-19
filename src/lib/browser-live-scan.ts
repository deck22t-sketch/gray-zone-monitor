import { buildNistNvdWindowUrl, FEED_META_BY_ID } from '@/lib/feed-registry';
import {
  parseFederalRegisterJson,
  parseGcpStatusJson,
  parseNistNvdJson,
  parseNoaaSwpcAlertsJson,
  parseOciComponentsJson,
  parseOfacMaradDoeJson,
  parseStatuspageIncidentsJson,
  parseUsgsSeismicGeoJson,
} from '@/lib/live-parsers';
import { FullBriefingDataBundle } from '@/lib/vault-crypto';
import { FeedHealthEntry, FeedId, LiveSignal } from '@/types/schemas';

export interface LiveScanSummary {
  scannedAtISO: string;
  refreshedFeedCount: number;
  attemptedFeedCount: number;
  newSignalCount: number;
  totalSignals: number;
}

interface BrowserFeedJob {
  id: FeedId;
  getUrl: (now: Date) => string;
  parse: (body: string, now: Date) => LiveSignal[];
}

const BROWSER_CORS_JOBS: BrowserFeedJob[] = [
  {
    id: 'nist-nvd',
    getUrl: (now) => buildNistNvdWindowUrl(now, 14),
    parse: (body, now) => parseNistNvdJson(body, now),
  },
  {
    id: 'usgs-seismic',
    getUrl: () => FEED_META_BY_ID['usgs-seismic'].browserSweepUrl!,
    parse: (body) => parseUsgsSeismicGeoJson(body),
  },
  {
    id: 'noaa-swpc',
    getUrl: () => FEED_META_BY_ID['noaa-swpc'].browserSweepUrl!,
    parse: (body, now) => parseNoaaSwpcAlertsJson(body, now),
  },
  {
    id: 'federal-register',
    getUrl: () => FEED_META_BY_ID['federal-register'].browserSweepUrl!,
    parse: (body) => parseFederalRegisterJson(body),
  },
  {
    id: 'ofac-marad-doe',
    getUrl: () => FEED_META_BY_ID['ofac-marad-doe'].browserSweepUrl!,
    parse: (body) => parseOfacMaradDoeJson(body),
  },
  {
    id: 'gcp-status',
    getUrl: () => FEED_META_BY_ID['gcp-status'].browserSweepUrl!,
    parse: (body, now) => parseGcpStatusJson(body, now),
  },
  {
    id: 'oci-status',
    getUrl: () => FEED_META_BY_ID['oci-status'].browserSweepUrl!,
    parse: (body, now) => parseOciComponentsJson(body, now),
  },
  {
    id: 'cloudflare-status',
    getUrl: () => FEED_META_BY_ID['cloudflare-status'].browserSweepUrl!,
    parse: (body, now) => parseStatuspageIncidentsJson(body, 'cloudflare-status', now),
  },
  {
    id: 'github-status',
    getUrl: () => FEED_META_BY_ID['github-status'].browserSweepUrl!,
    parse: (body, now) => parseStatuspageIncidentsJson(body, 'github-status', now),
  },
];

const SEVERITY_RANK: Record<LiveSignal['severity'], number> = {
  critical: 3,
  elevated: 2,
  info: 1,
};

export async function runBrowserLiveScan(
  currentBundle: FullBriefingDataBundle
): Promise<{ updatedBundle: FullBriefingDataBundle; summary: LiveScanSummary }> {
  const now = new Date();
  const scannedAtISO = now.toISOString();

  const settled = await Promise.allSettled(
    BROWSER_CORS_JOBS.map(async (job) => {
      const t0 = performance.now();
      const resp = await fetch(job.getUrl(now), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const text = await resp.text();
      const signals = job.parse(text, now);
      return {
        id: job.id,
        httpStatus: resp.status,
        latencyMs: Math.max(1, Math.round(performance.now() - t0)),
        signals,
      };
    })
  );

  const refreshedByFeed = new Map<
    FeedId,
    { httpStatus: number; latencyMs: number; signals: LiveSignal[] }
  >();

  for (const res of settled) {
    if (res.status === 'fulfilled') {
      refreshedByFeed.set(res.value.id, res.value);
    }
  }

  const priorSignalIds = new Set(currentBundle.liveSignals.signals.map((s) => s.id));
  const priorEnrichmentById = new Map(
    currentBundle.liveSignals.signals
      .filter((s) => s.aiEnrichment)
      .map((s) => [s.id, s.aiEnrichment])
  );

  // Retain signals from feeds not refreshed in this browser sweep (or OCI RSS items alongside OCI components)
  const retainedSignals = currentBundle.liveSignals.signals.filter((sig) => {
    if (!refreshedByFeed.has(sig.sourceId)) return true;
    if (sig.sourceId === 'oci-status' && sig.id.startsWith('oci-rss-')) return true;
    return false;
  });

  const mergedMap = new Map<string, LiveSignal>();
  for (const sig of retainedSignals) {
    mergedMap.set(sig.id, sig);
  }

  let newSignalCount = 0;
  for (const [, outcome] of refreshedByFeed) {
    for (const sig of outcome.signals) {
      if (!priorSignalIds.has(sig.id)) {
        newSignalCount += 1;
      }
      const priorAi = priorEnrichmentById.get(sig.id);
      mergedMap.set(sig.id, priorAi ? { ...sig, aiEnrichment: priorAi } : sig);
    }
  }

  const nextSignals = Array.from(mergedMap.values()).sort((a, b) => {
    const sevDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return (Date.parse(b.publishedAtISO) || 0) - (Date.parse(a.publishedAtISO) || 0);
  });

  const nextFeeds: FeedHealthEntry[] = currentBundle.feedHealth.feeds.map((feed) => {
    const fresh = refreshedByFeed.get(feed.id);
    if (!fresh) return feed;
    const itemCount =
      feed.id === 'oci-status'
        ? nextSignals.filter((s) => s.sourceId === 'oci-status').length
        : fresh.signals.length;
    return {
      ...feed,
      status: 'live',
      httpStatus: fresh.httpStatus,
      latencyMs: fresh.latencyMs,
      itemCount,
      error: undefined,
      lastSuccessAtISO: scannedAtISO,
    };
  });

  const liveCount = nextFeeds.filter((f) => f.status === 'live').length;

  const updatedBundle: FullBriefingDataBundle = {
    ...currentBundle,
    liveSignals: {
      ...currentBundle.liveSignals,
      ingestedAtISO: refreshedByFeed.size > 0 ? scannedAtISO : currentBundle.liveSignals.ingestedAtISO,
      totalSignals: nextSignals.length,
      signals: nextSignals,
    },
    feedHealth: {
      ...currentBundle.feedHealth,
      checkedAtISO: refreshedByFeed.size > 0 ? scannedAtISO : currentBundle.feedHealth.checkedAtISO,
      liveCount,
      totalFeeds: nextFeeds.length,
      feeds: nextFeeds,
    },
  };

  return {
    updatedBundle,
    summary: {
      scannedAtISO,
      refreshedFeedCount: refreshedByFeed.size,
      attemptedFeedCount: BROWSER_CORS_JOBS.length,
      newSignalCount,
      totalSignals: nextSignals.length,
    },
  };
}
