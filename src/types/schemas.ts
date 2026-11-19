import { z } from 'zod';

export const SourceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export type SourceLink = z.infer<typeof SourceLinkSchema>;

export const HorizonGroupSchema = z.enum(['Immediate', '10–54 Days', '2027–2030']);
export type HorizonGroup = z.infer<typeof HorizonGroupSchema>;

export const RiskVectorSchema = z.object({
  id: z.string().regex(/^#[1-8]$/),
  domain: z.string().min(3),
  horizon: z.string().min(3),
  horizonGroup: HorizonGroupSchema,
  likelihood: z.string().min(3),
  blastRadius: z.string().min(3),
  tripwire: z.string().min(5),
  mitigation: z.string().min(5),
  sources: z.array(SourceLinkSchema),
});

export const RiskMatrixArraySchema = z.array(RiskVectorSchema).length(8);
export type RiskVector = z.infer<typeof RiskVectorSchema>;

export const IncidentClassificationSchema = z.enum([
  'malicious_attack',
  'hybrid_transition_bug',
  'client_cascade',
  'unspecified',
]);

export type IncidentClassification = z.infer<typeof IncidentClassificationSchema>;

export const IncidentRowSchema = z.object({
  eventId: z.string().regex(/^#\d+$/),
  window: z.string().min(3),
  entity: z.string().min(2),
  sector: z.string().min(2),
  classification: IncidentClassificationSchema,
  impact: z.string().min(5),
  vector: z.string().min(5),
  status: z.string().min(3),
  sources: z.array(SourceLinkSchema),
});

export const IncidentsArraySchema = z.array(IncidentRowSchema).min(10);
export type IncidentRow = z.infer<typeof IncidentRowSchema>;

export const CountdownCliffSchema = z.object({
  targetDateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetTimestampISO: z.string().datetime(),
  dateLabel: z.string().min(3),
  milestone: z.string().min(5),
  actionExposure: z.string().min(5),
});

export const CountdownCliffsArraySchema = z.array(CountdownCliffSchema).length(8);
export type CountdownCliff = z.infer<typeof CountdownCliffSchema>;

export const WatchlistRowSchema = z.object({
  id: z.string().regex(/^#[1-9]$/),
  signal: z.string().min(3),
  mechanism: z.string().min(5),
  forensicMeaning: z.string().min(5),
  sources: z.array(SourceLinkSchema),
});

export const WatchlistArraySchema = z.array(WatchlistRowSchema).length(9);
export type WatchlistRow = z.infer<typeof WatchlistRowSchema>;

export const MarkdownTableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

export type MarkdownTable = z.infer<typeof MarkdownTableSchema>;

export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('paragraph'),
    text: z.string(),
    sources: z.array(SourceLinkSchema),
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(
      z.object({
        text: z.string(),
        sources: z.array(SourceLinkSchema),
      })
    ),
  }),
  z.object({
    type: z.literal('table'),
    table: MarkdownTableSchema,
  }),
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export const SubsectionSchema = z.object({
  id: z.string().min(1),
  code: z.string(),
  title: z.string().min(1),
  blocks: z.array(ContentBlockSchema),
});

export type Subsection = z.infer<typeof SubsectionSchema>;

export const NarrativeSectionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1).max(8),
  title: z.string().min(1),
  blocks: z.array(ContentBlockSchema),
  subsections: z.array(SubsectionSchema),
});

export type NarrativeSection = z.infer<typeof NarrativeSectionSchema>;

export const SummaryPillarSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  body: z.string().min(10),
  sources: z.array(SourceLinkSchema),
});

export type SummaryPillar = z.infer<typeof SummaryPillarSchema>;

export const PrimarySourceEntrySchema = z.object({
  id: z.string().min(1),
  category: z.string().min(2),
  domainTag: z.enum([
    'Geopolitics & Doctrine',
    'Aviation & FAA',
    'Cyber & OT Advisories',
    'Supply Chain & Minerals',
    'Financial & Banking',
    'Legal & Insurance',
    'Outage Telemetry',
  ]),
  title: z.string().min(2),
  url: z.string().url(),
});

export type PrimarySourceEntry = z.infer<typeof PrimarySourceEntrySchema>;

export const SectionsDataSchema = z.object({
  docTitle: z.string().min(5),
  docDate: z.string().min(4),
  docScope: z.string().min(20),
  executiveSummary: z.object({
    intro: z.string().min(10),
    pillars: z.array(SummaryPillarSchema).length(6),
  }),
  narrativeSections: z.array(NarrativeSectionSchema).length(8),
  primarySources: z.array(PrimarySourceEntrySchema).min(30),
});

export type SectionsData = z.infer<typeof SectionsDataSchema>;

export const ChangelogDataSchema = z.object({
  syncedAtISO: z.string().datetime(),
  docHash: z.string().min(16),
  docDate: z.string(),
  addedIncidents: z.array(
    z.object({
      eventId: z.string(),
      entity: z.string(),
      window: z.string(),
    })
  ),
  updatedStatuses: z.array(
    z.object({
      eventId: z.string(),
      entity: z.string(),
      previousStatus: z.string(),
      currentStatus: z.string(),
    })
  ),
  riskShifts: z.array(
    z.object({
      id: z.string(),
      domain: z.string(),
      field: z.string(),
      previous: z.string(),
      current: z.string(),
    })
  ),
  summary: z.string(),
});

export type ChangelogData = z.infer<typeof ChangelogDataSchema>;

export const FeedIdSchema = z.enum([
  'cisa-kev',
  'cisa-advisories',
  'faa-nas',
  'federal-register',
  'cloudflare-status',
  'github-status',
  'aws-status',
  'apple-status',
]);

export type FeedId = z.infer<typeof FeedIdSchema>;

export const SignalSeveritySchema = z.enum(['critical', 'elevated', 'info']);
export type SignalSeverity = z.infer<typeof SignalSeveritySchema>;

export const LiveSignalSchema = z.object({
  id: z.string().min(3),
  sourceId: FeedIdSchema,
  sourceName: z.string().min(2),
  attributionText: z.string().min(3),
  publishedAtISO: z.string(),
  title: z.string().min(3),
  summary: z.string().min(3),
  url: z.string().url(),
  severity: SignalSeveritySchema,
  watchlistMatches: z.array(z.string()),
  riskMatrixMatches: z.array(z.string()),
  countdownMatches: z.array(z.string()),
  tags: z.array(z.string()),
  markdownRow: z.string().min(10),
  aiEnrichment: z
    .object({
      summary: z.string(),
      incidentCorrelations: z.array(z.string()),
      groundedSources: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
        })
      ),
    })
    .optional(),
});

export type LiveSignal = z.infer<typeof LiveSignalSchema>;

export const LiveSignalsDataSchema = z.object({
  ingestedAtISO: z.string().datetime(),
  ingestionMode: z.enum(['ZERO_KEY_PUBLIC_FEEDS', 'GEMINI_ENRICHED']),
  totalSignals: z.number().int().nonnegative(),
  incidentSweepNotes: z
    .array(
      z.object({
        eventId: z.string(),
        entity: z.string(),
        latestNote: z.string(),
        sources: z.array(z.object({ title: z.string(), url: z.string() })),
      })
    )
    .optional(),
  signals: z.array(LiveSignalSchema),
});

export type LiveSignalsData = z.infer<typeof LiveSignalsDataSchema>;

export const FeedHealthEntrySchema = z.object({
  id: FeedIdSchema,
  name: z.string(),
  endpoint: z.string().url(),
  status: z.enum(['live', 'degraded', 'offline']),
  httpStatus: z.number().int().nullable(),
  latencyMs: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  updateTimeText: z.string().optional(),
  error: z.string().optional(),
  lastSuccessAtISO: z.string().nullable(),
});

export type FeedHealthEntry = z.infer<typeof FeedHealthEntrySchema>;

export const FeedHealthDataSchema = z.object({
  checkedAtISO: z.string().datetime(),
  liveCount: z.number().int().nonnegative(),
  totalFeeds: z.number().int().positive(),
  feeds: z.array(FeedHealthEntrySchema).length(8),
});

export type FeedHealthData = z.infer<typeof FeedHealthDataSchema>;

export const FeedHistoryPointSchema = z.object({
  checkedAtISO: z.string().datetime(),
  status: z.enum(['live', 'degraded', 'offline']),
  httpStatus: z.number().int().nullable(),
  latencyMs: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
});

export type FeedHistoryPoint = z.infer<typeof FeedHistoryPointSchema>;

export const FeedHistoryDataSchema = z.object({
  updatedAtISO: z.string().datetime(),
  maxPointsPerFeed: z.number().int().positive(),
  series: z.record(FeedIdSchema, z.array(FeedHistoryPointSchema)),
});

export type FeedHistoryData = z.infer<typeof FeedHistoryDataSchema>;

export const VaultMetaSchema = z.object({
  encrypted: z.boolean(),
  algorithm: z.literal('AES-256-GCM'),
  kdf: z.literal('PBKDF2-SHA256'),
  iterations: z.number().int().positive(),
  saltBase64: z.string().optional(),
  ivBase64: z.string().optional(),
  ciphertextBase64: z.string().optional(),
  generatedAtISO: z.string(),
});

export type VaultMeta = z.infer<typeof VaultMetaSchema>;
