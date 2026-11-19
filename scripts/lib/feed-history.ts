import {
  FeedHealthData,
  FeedHistoryData,
  FeedHistoryDataSchema,
  FeedHistoryPoint,
  FeedId,
} from '../../src/types/schemas';

export const MAX_FEED_HISTORY_POINTS = 28; // 14 days at 2 sweeps/day

const ALL_FEED_IDS: FeedId[] = [
  'cisa-kev',
  'cisa-advisories',
  'faa-nas',
  'federal-register',
  'cloudflare-status',
  'github-status',
  'aws-status',
  'apple-status',
];

export function createEmptyFeedHistory(nowISO: string): FeedHistoryData {
  const series = {} as Record<FeedId, FeedHistoryPoint[]>;
  for (const id of ALL_FEED_IDS) {
    series[id] = [];
  }
  return {
    updatedAtISO: nowISO,
    maxPointsPerFeed: MAX_FEED_HISTORY_POINTS,
    series,
  };
}

export function appendFeedHistorySnapshot(
  previous: FeedHistoryData | null | undefined,
  health: FeedHealthData,
  maxPoints: number = MAX_FEED_HISTORY_POINTS
): FeedHistoryData {
  const base = previous ?? createEmptyFeedHistory(health.checkedAtISO);
  const nextSeries = {} as Record<FeedId, FeedHistoryPoint[]>;

  for (const id of ALL_FEED_IDS) {
    nextSeries[id] = [...(base.series[id] ?? [])];
  }

  for (const feed of health.feeds) {
    const existing = nextSeries[feed.id] ?? [];
    const point: FeedHistoryPoint = {
      checkedAtISO: health.checkedAtISO,
      status: feed.status,
      httpStatus: feed.httpStatus,
      latencyMs: feed.latencyMs,
      itemCount: feed.itemCount,
    };

    // Deduplicate identical timestamp if run twice within the same millisecond
    const last = existing[existing.length - 1];
    if (last && last.checkedAtISO === point.checkedAtISO) {
      existing[existing.length - 1] = point;
    } else {
      existing.push(point);
    }

    if (existing.length > maxPoints) {
      nextSeries[feed.id] = existing.slice(existing.length - maxPoints);
    } else {
      nextSeries[feed.id] = existing;
    }
  }

  return FeedHistoryDataSchema.parse({
    updatedAtISO: health.checkedAtISO,
    maxPointsPerFeed: maxPoints,
    series: nextSeries,
  });
}
