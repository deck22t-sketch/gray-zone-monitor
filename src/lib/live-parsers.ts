import { LiveSignal, SignalSeverity } from '@/types/schemas';

export const PRIORITY_KEV_VENDORS = [
  'juniper',
  'cisco',
  'check point',
  'checkpoint',
  'ivanti',
  'fortinet',
  'palo alto',
  'vmware',
  'broadcom',
  'chrome',
  'google',
  'apple',
  'connectwise',
  'citrix',
  'f5',
  'microsoft',
  'puppet',
  'perforce',
  'openjdk',
  'oracle',
  'atlassian',
  'keycloak',
  'litellm',
  'rockwell',
  'siemens',
  'schneider',
];

export function stripHtml(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(text: string, maxLen = 240): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

export function formatShortWindow(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function shortHashHex(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export function buildSection84MarkdownRow(params: {
  windowText: string;
  entitySector: string;
  impact: string;
  sourceLabel: string;
  url: string;
  vector: string;
  severity: SignalSeverity;
  watchlistMatches: string[];
}): string {
  const safe = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
  const wl =
    params.watchlistMatches.length > 0
      ? `Watchlist ${params.watchlistMatches.join(', ')}`
      : 'Baseline OSINT';
  return `| #11+ — ${safe(params.windowText)} | ${safe(params.entitySector)} | ${safe(
    params.impact
  )} ([${safe(params.sourceLabel)}](${params.url})) | ${safe(
    params.vector
  )} | Live Wire (${params.severity.toUpperCase()}) — ${wl} |`;
}

/**
 * 1. CISA KEV Catalog JSON Parser
 */
export function parseCisaKevJson(rawJson: string, now = new Date()): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as {
    catalogVersion?: string;
    dateReleased?: string;
    vulnerabilities?: Array<{
      cveID: string;
      vendorProject: string;
      product: string;
      vulnerabilityName: string;
      dateAdded: string;
      shortDescription: string;
      dueDate?: string;
      knownRansomwareCampaignUse?: string;
    }>;
  };

  const vulns = parsed.vulnerabilities ?? [];
  const cutoffMs = now.getTime() - 14 * 24 * 60 * 60 * 1000;

  const recent = vulns.filter((v) => {
    const t = Date.parse(`${v.dateAdded}T00:00:00Z`);
    return !Number.isNaN(t) && t >= cutoffMs;
  });

  const selected = (recent.length > 0 ? recent : vulns.slice(0, 10)).slice(0, 20);

  return selected.map((v) => {
    const vendorProd = `${v.vendorProject} ${v.product} ${v.vulnerabilityName}`.toLowerCase();
    const isPriorityVendor = PRIORITY_KEV_VENDORS.some((kw) => vendorProd.includes(kw));
    const watchlistMatches = ['#2'];
    const riskMatrixMatches = ['#2'];

    if (
      isPriorityVendor ||
      /esxi|vmware|check point|juniper|cisco|ivanti|fortinet|puppet|perforce|openjdk|java4shell/i.test(
        vendorProd
      )
    ) {
      if (!watchlistMatches.includes('#8')) watchlistMatches.push('#8');
    }
    if (/juniper|cisco|palo alto|fortinet|ivanti|puppet|perforce/i.test(vendorProd)) {
      if (!watchlistMatches.includes('#1')) watchlistMatches.push('#1');
      if (!riskMatrixMatches.includes('#1')) riskMatrixMatches.push('#1');
    }
    if (/connectwise|screenconnect/i.test(vendorProd)) {
      if (!watchlistMatches.includes('#6')) watchlistMatches.push('#6');
    }
    if (/check point|vmware|esxi/i.test(vendorProd)) {
      if (!riskMatrixMatches.includes('#3')) riskMatrixMatches.push('#3');
    }

    const severity: SignalSeverity = isPriorityVendor ? 'critical' : 'elevated';
    const publishedAtISO = `${v.dateAdded}T12:00:00.000Z`;
    const url = `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(
      v.cveID
    )}`;
    const summary = truncateText(
      `${v.shortDescription}${v.dueDate ? ` Federal BOD 22-01 remediation due ${v.dueDate}.` : ''}`,
      280
    );
    const tags = [
      'CISA-KEV',
      v.cveID,
      v.vendorProject,
      ...(isPriorityVendor ? ['Priority-Edge-Vendor'] : []),
    ];

    return {
      id: `kev-${v.cveID.toLowerCase()}`,
      sourceId: 'cisa-kev',
      sourceName: 'CISA KEV Catalog',
      attributionText: `Source: CISA Known Exploited Vulnerabilities Catalog (${parsed.catalogVersion ?? 'live'})`,
      publishedAtISO,
      title: `${v.cveID}: ${v.vendorProject} ${v.product} — ${v.vulnerabilityName}`,
      summary,
      url,
      severity,
      watchlistMatches,
      riskMatrixMatches,
      countdownMatches: [],
      tags,
      markdownRow: buildSection84MarkdownRow({
        windowText: v.dateAdded,
        entitySector: `${v.vendorProject} ${v.product} (Enterprise / Edge Security)`,
        impact: truncateText(v.shortDescription, 140),
        sourceLabel: 'CISA KEV',
        url,
        vector: `Active exploitation confirmed (${v.cveID}); due ${v.dueDate ?? 'per BOD 22-01'}`,
        severity,
        watchlistMatches,
      }),
    };
  });
}

/**
 * 2. NIST NVD CVE 2.0 API Parser (Pre-KEV CVSS 9.0+ Critical Routing, Hypervisor, OT & AI Infrastructure Flaws)
 */
export function parseNistNvdJson(rawJson: string, now = new Date()): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as {
    vulnerabilities?: Array<{
      cve?: {
        id?: string;
        published?: string;
        lastModified?: string;
        vulnStatus?: string;
        descriptions?: Array<{ lang?: string; value?: string }>;
        metrics?: {
          cvssMetricV40?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
          cvssMetricV31?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
          cvssMetricV30?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
        };
      };
    }>;
  };

  const rawItems = parsed.vulnerabilities ?? [];
  const candidates = rawItems
    .map((entry) => entry.cve)
    .filter((cve): cve is NonNullable<typeof cve> => {
      if (!cve?.id) return false;
      if (/reject/i.test(cve.vulnStatus ?? '')) return false;
      return true;
    })
    .map((cve) => {
      const m40 = cve.metrics?.cvssMetricV40?.[0]?.cvssData;
      const m31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
      const m30 = cve.metrics?.cvssMetricV30?.[0]?.cvssData;
      const score = m31?.baseScore ?? m40?.baseScore ?? m30?.baseScore ?? 9.0;
      const sevText = (
        m31?.baseSeverity ??
        m40?.baseSeverity ??
        m30?.baseSeverity ??
        'CRITICAL'
      ).toUpperCase();
      const enDesc =
        cve.descriptions?.find((d) => d.lang === 'en')?.value ??
        cve.descriptions?.[0]?.value ??
        'Critical vulnerability published in NIST National Vulnerability Database.';
      const pubMs = cve.published ? Date.parse(cve.published.endsWith('Z') ? cve.published : `${cve.published}Z`) : NaN;
      const publishedAtISO = !Number.isNaN(pubMs)
        ? new Date(pubMs).toISOString()
        : now.toISOString();
      return {
        id: cve.id!,
        score,
        sevText,
        description: stripHtml(enDesc),
        publishedAtISO,
        pubMs: Number.isNaN(pubMs) ? 0 : pubMs,
      };
    })
    .filter((item) => item.score >= 8.8 || item.sevText === 'CRITICAL')
    .sort((a, b) => b.pubMs - a.pubMs)
    .slice(0, 12);

  return candidates.map((item) => {
    const hay = item.description.toLowerCase();
    const isInfraOrOt =
      /juniper|cisco|fortinet|palo alto|ivanti|check point|vmware|esxi|citrix|f5|rockwell|siemens|schneider|modbus|plc\b|scada|bgp|router|gateway|firewall|hypervisor|litellm|langchain|vllm|ollama|kubernetes|containerd|openssh|linux kernel|envoy|haproxy|keycloak|active directory/.test(
        hay
      );
    const isEdgeRouter =
      /juniper|cisco|fortinet|palo alto|ivanti|bgp|router|gateway|firewall/.test(hay);

    const watchlistMatches = ['#2'];
    const riskMatrixMatches = ['#2'];
    if (isInfraOrOt) {
      watchlistMatches.push('#8');
    }
    if (isEdgeRouter) {
      watchlistMatches.push('#1');
      riskMatrixMatches.push('#1');
    }

    const severity: SignalSeverity =
      isInfraOrOt || item.score >= 9.8 ? 'critical' : 'elevated';
    const url = `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(item.id)}`;
    const summary = truncateText(
      `[CVSS ${item.score.toFixed(1)} ${item.sevText}] ${item.description}`,
      275
    );

    return {
      id: `nvd-${item.id.toLowerCase()}`,
      sourceId: 'nist-nvd',
      sourceName: 'NIST NVD Critical CVEs',
      attributionText: `Source: NIST National Vulnerability Database API 2.0 (nvd.nist.gov — CVSS ${item.score.toFixed(1)})`,
      publishedAtISO: item.publishedAtISO,
      title: `${item.id} (CVSS ${item.score.toFixed(1)}): ${truncateText(item.description, 105)}`,
      summary,
      url,
      severity,
      watchlistMatches,
      riskMatrixMatches,
      countdownMatches: [],
      tags: [
        'NIST-NVD',
        item.id,
        `CVSS-${item.score.toFixed(1)}`,
        ...(isInfraOrOt ? ['Core-Infra-OT'] : []),
      ],
      markdownRow: buildSection84MarkdownRow({
        windowText: formatShortWindow(item.publishedAtISO),
        entitySector: `${item.id} (${isInfraOrOt ? 'Edge / OT / Cloud Infrastructure' : 'Enterprise Software'})`,
        impact: truncateText(item.description, 135),
        sourceLabel: `NIST NVD (${item.score.toFixed(1)})`,
        url,
        vector: `Pre-KEV critical disclosure (CVSS ${item.score.toFixed(1)})`,
        severity,
        watchlistMatches,
      }),
    };
  });
}

interface SubseaCorridorBox {
  name: string;
  cableSystems: string;
  riskMatches: string[];
  matches: (lat: number, lon: number) => boolean;
}

const SUBSEA_CABLE_CORRIDORS: SubseaCorridorBox[] = [
  {
    name: 'Luzon & Taiwan Strait Cable Corridor',
    cableSystems: 'APG, EAC-C2C, TPE, SJC, PLCN',
    riskMatches: ['#6', '#8'],
    matches: (lat, lon) => lat >= 17.5 && lat <= 26.5 && lon >= 117.5 && lon <= 124.5,
  },
  {
    name: 'Ryukyu, Japan Trench & Trans-Pacific Landing Zone',
    cableSystems: 'FASTER, Unity, Jupiter, PC-1, Topaz',
    riskMatches: ['#6', '#8'],
    matches: (lat, lon) => lat >= 24.0 && lat <= 41.5 && lon >= 124.5 && lon <= 146.0,
  },
  {
    name: 'Red Sea, Bab el-Mandeb & Gulf of Aden Corridor',
    cableSystems: 'AAE-1, Seacom, EIG, PEACE, 2Africa',
    riskMatches: ['#3', '#6'],
    matches: (lat, lon) => lat >= 10.5 && lat <= 28.5 && lon >= 32.0 && lon <= 51.5,
  },
  {
    name: 'Strait of Hormuz, Gulf of Oman & Makran Trench',
    cableSystems: 'FALCON, EPEG, GBI, MENA Gulf',
    riskMatches: ['#3', '#4', '#6'],
    matches: (lat, lon) => lat >= 22.0 && lat <= 28.5 && lon >= 54.0 && lon <= 66.5,
  },
  {
    name: 'Mediterranean, Sicily & Suez Landbridge Approaches',
    cableSystems: 'SEA-ME-WE 5, BlueMed, TE North, IEX',
    riskMatches: ['#6'],
    matches: (lat, lon) => lat >= 30.0 && lat <= 40.5 && lon >= 11.0 && lon <= 35.5,
  },
  {
    name: 'GIUK, North Sea & North Pacific Great-Circle Cable Arc',
    cableSystems: 'Dunant, Amitie, Havfrue, NOPAC Subsea',
    riskMatches: ['#6'],
    matches: (lat, lon) =>
      (lat >= 50.0 && lat <= 68.0 && lon >= -32.0 && lon <= 25.0) ||
      (lat >= 49.0 && lat <= 61.5 && (lon >= 165.0 || lon <= -148.0)),
  },
];

/**
 * 3. USGS Subsea Chokepoint Seismic GeoJSON Parser (M5.0+ seabed events in submarine cable corridors)
 */
export function parseUsgsSeismicGeoJson(rawJson: string): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as {
    features?: Array<{
      id?: string;
      properties?: {
        mag?: number | null;
        place?: string | null;
        time?: number | null;
        url?: string | null;
        tsunami?: number | null;
        title?: string | null;
      };
      geometry?: {
        coordinates?: [number, number, number?];
      };
    }>;
  };

  const features = parsed.features ?? [];
  const signals: LiveSignal[] = [];

  for (const feat of features) {
    const coords = feat.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    const depthKm = Number(coords[2] ?? 10);
    const mag = Number(feat.properties?.mag ?? 0);
    if (Number.isNaN(lat) || Number.isNaN(lon) || mag < 5.0) continue;

    const corridor = SUBSEA_CABLE_CORRIDORS.find((c) => c.matches(lat, lon));
    const isMajorGlobalBaseline = !corridor && mag >= 6.2;
    if (!corridor && !isMajorGlobalBaseline) continue;

    const timeMs = feat.properties?.time ?? Date.now();
    const publishedAtISO = new Date(timeMs).toISOString();
    const place = feat.properties?.place ?? `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    const url =
      feat.properties?.url ||
      `https://earthquake.usgs.gov/earthquakes/eventpage/${encodeURIComponent(feat.id ?? '')}`;
    const tsunamiFlag = feat.properties?.tsunami === 1;

    const severity: SignalSeverity = corridor
      ? mag >= 6.5 || tsunamiFlag || (mag >= 5.8 && depthKm <= 45)
        ? 'critical'
        : 'elevated'
      : 'info';

    const watchlistMatches = corridor ? ['#4'] : ['#7'];
    const riskMatrixMatches = corridor ? corridor.riskMatches : ['#6'];
    const corridorLabel = corridor
      ? corridor.name
      : 'Global Tectonic Baseline (Outside Primary Cable Chokepoints)';
    const forensicNote = corridor
      ? `Adjacent to ${corridor.cableSystems}. Cross-check optical SLTE attenuation & BGP reroutes to separate natural seabed turbidity currents from gray-zone anchor/sabotage activity.`
      : `Major M${mag.toFixed(1)} seismic event outside primary cable chokepoint boxes; logged as geophysical baseline.`;

    signals.push({
      id: `usgs-${(feat.id ?? shortHashHex(`${lat}-${lon}-${timeMs}`)).toLowerCase()}`,
      sourceId: 'usgs-seismic',
      sourceName: 'USGS Subsea Chokepoint Seismic',
      attributionText: `Source: USGS Earthquake Hazards Program GeoJSON (earthquake.usgs.gov — M${mag.toFixed(1)}, ${depthKm.toFixed(0)}km depth)`,
      publishedAtISO,
      title: `USGS M${mag.toFixed(1)} (${depthKm.toFixed(0)}km depth) — ${place} [${
        corridor ? corridor.name : 'Global Baseline'
      }]`,
      summary: truncateText(
        `${corridorLabel}: M${mag.toFixed(1)} at ${lat.toFixed(2)}°, ${lon.toFixed(2)}° (${depthKm.toFixed(
          0
        )}km depth)${tsunamiFlag ? ' · TSUNAMI ADVISORY FLAG' : ''}. ${forensicNote}`,
        280
      ),
      url,
      severity,
      watchlistMatches,
      riskMatrixMatches,
      countdownMatches: corridor ? ['2027-01-08'] : [],
      tags: [
        'USGS-Seismic',
        `M${mag.toFixed(1)}`,
        ...(corridor ? ['Subsea-Cable-Corridor'] : ['Global-Baseline']),
      ],
      markdownRow: buildSection84MarkdownRow({
        windowText: formatShortWindow(publishedAtISO),
        entitySector: `${corridorLabel} (Subsea Fiber & Seabed Infrastructure)`,
        impact: `M${mag.toFixed(1)} seismic event near ${place} (${depthKm.toFixed(0)}km depth)`,
        sourceLabel: 'USGS GeoJSON',
        url,
        vector: corridor
          ? `Turbidity-current / cable-fault baseline check (${corridor.cableSystems})`
          : 'Global seismic baseline',
        severity,
        watchlistMatches,
      }),
    });

    if (signals.length >= 10) break;
  }

  return signals;
}

/**
 * 4. NOAA SWPC Space Weather & GNSS Ionospheric Alerts Parser
 */
export function parseNoaaSwpcAlertsJson(rawJson: string, now = new Date()): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as Array<{
    product_id?: string;
    issue_datetime?: string;
    message?: string;
  }>;

  if (!Array.isArray(parsed)) return [];

  const cutoffMs = now.getTime() - 10 * 24 * 60 * 60 * 1000;
  const seenDedup = new Set<string>();
  const signals: LiveSignal[] = [];

  for (const item of parsed) {
    const rawDt = (item.issue_datetime ?? '').trim();
    const isoCandidate = rawDt.includes('T') ? rawDt : `${rawDt.replace(' ', 'T')}Z`;
    const dtMs = Date.parse(isoCandidate);
    if (!Number.isNaN(dtMs) && dtMs < cutoffMs && signals.length >= 4) {
      continue;
    }

    const msg = (item.message ?? '').replace(/\r\n/g, '\n');
    if (!msg) continue;

    // Deduplicate burst alerts of the same product_id on the same UTC date
    const prodId = (item.product_id ?? 'SWPC').trim();
    const dayKey = `${prodId}-${!Number.isNaN(dtMs) ? new Date(dtMs).toISOString().slice(0, 10) : 'recent'}`;
    if (seenDedup.has(dayKey)) continue;
    seenDedup.add(dayKey);

    const headlineLine =
      msg
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /^(SUMMARY|WARNING|ALERT|WATCH|EXTENDED WARNING):/i.test(l)) ??
      `NOAA Space Weather Bulletin (${prodId})`;

    const scaleMatch = /NOAA Scale:\s*([GRS][1-5][^\n]*)/i.exec(msg);
    const scaleLabel = scaleMatch ? scaleMatch[1].trim() : null;

    const isSevere =
      /\b([GRS][45])\b|K-index of [89]|Extreme|Severe/i.test(`${headlineLine} ${scaleLabel ?? ''}`);
    const isModerate =
      /\b([GRS][23])\b|K-index of [67]|Strong|Moderate|HF Radio Blackout/i.test(
        `${headlineLine} ${scaleLabel ?? ''} ${msg}`
      );

    // Filter out minor routine electron flux summaries unless geomagnetic/radio/GNSS relevant
    const isGnssOrHfRelevant =
      /geomagnetic|k-index|radio blackout|x-ray|solar flare|proton|coronal mass|strom|g[1-5]|r[1-5]|s[1-5]/i.test(
        msg
      );
    if (!isGnssOrHfRelevant) continue;

    const severity: SignalSeverity = isSevere
      ? 'critical'
      : isModerate
      ? 'elevated'
      : 'info';

    const publishedAtISO = !Number.isNaN(dtMs) ? new Date(dtMs).toISOString() : now.toISOString();
    const cleanHeadline = headlineLine.replace(/^(SUMMARY|WARNING|ALERT|WATCH):\s*/i, '').trim();
    const title = `NOAA SWPC${scaleLabel ? ` [${scaleLabel.split(' ')[0]}]` : ''}: ${cleanHeadline}`;

    signals.push({
      id: `noaa-${prodId.toLowerCase()}-${shortHashHex(rawDt || headlineLine).slice(0, 8)}`,
      sourceId: 'noaa-swpc',
      sourceName: 'NOAA SWPC Space Weather & GNSS',
      attributionText: `Source: NOAA Space Weather Prediction Center (services.swpc.noaa.gov — ${prodId})`,
      publishedAtISO,
      title: truncateText(title, 130),
      summary: truncateText(
        `${headlineLine}${scaleLabel ? ` · NOAA Scale: ${scaleLabel}.` : '.'} Baseline check for Watchlist #5: rule out solar ionospheric scintillation before attributing NOPAC/Baltic GPS or Stratum-1 PTP clock drift to adversarial spoofing.`,
        280
      ),
      url: 'https://www.swpc.noaa.gov/',
      severity,
      watchlistMatches: ['#5'],
      riskMatrixMatches: ['#1', '#6'],
      countdownMatches: [],
      tags: ['NOAA-SWPC', 'GNSS-Timing-Baseline', prodId, ...(scaleLabel ? [scaleLabel.split(' ')[0]] : [])],
      markdownRow: buildSection84MarkdownRow({
        windowText: formatShortWindow(publishedAtISO),
        entitySector: 'NOAA SWPC (GNSS / Aviation HF / Stratum-1 Timing Baseline)',
        impact: truncateText(cleanHeadline, 130),
        sourceLabel: 'NOAA SWPC',
        url: 'https://www.swpc.noaa.gov/',
        vector: `${scaleLabel ?? prodId} ionospheric / geomagnetic telemetry`,
        severity,
        watchlistMatches: ['#5'],
      }),
    });

    if (signals.length >= 8) break;
  }

  return signals;
}

/**
 * 5. U.S. Federal Register REST API v1 Parser (BIS, FAA, FCC, SEC, OCC)
 */
export function parseFederalRegisterJson(rawJson: string): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as {
    results?: Array<{
      document_number: string;
      title: string;
      type: string;
      abstract?: string | null;
      html_url: string;
      publication_date: string;
      agencies?: Array<{ name?: string; slug?: string }>;
    }>;
  };

  const docs = parsed.results ?? [];
  return docs.slice(0, 15).map((d) => {
    const agencyNames = (d.agencies ?? [])
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ');
    const hay = `${d.title} ${d.abstract ?? ''} ${agencyNames}`.toLowerCase();

    const watchlistMatches: string[] = [];
    const riskMatrixMatches: string[] = [];
    const countdownMatches: string[] = [];
    const tags: string[] = ['Federal-Register', d.type];

    if (/industry and security|export|semiconductor|gallium|germanium|rare earth|entity list|gpu|chip/.test(hay)) {
      riskMatrixMatches.push('#4');
      countdownMatches.push('2026-11-27', '2027-01-10');
      tags.push('BIS-Export-Controls');
    }
    if (/submarine cable|slte|communications commission|fcc|bgp|eas|emergency alert/.test(hay)) {
      riskMatrixMatches.push('#6');
      countdownMatches.push('2027-01-08');
      watchlistMatches.push('#9');
      tags.push('FCC-Telecom-Subsea');
    }
    if (/securities and exchange|treasury|clearing|ficc|dtcc|form 8-k/.test(hay)) {
      riskMatrixMatches.push('#5', '#7');
      countdownMatches.push('2026-12-31');
      watchlistMatches.push('#6');
      tags.push('SEC-Clearing');
    }
    if (/comptroller of the currency|banking|occ|cybersecurity|cisa|circia|critical infrastructure/.test(hay)) {
      if (!riskMatrixMatches.includes('#7')) riskMatrixMatches.push('#7');
      if (!watchlistMatches.includes('#6')) watchlistMatches.push('#6');
      tags.push('Regulatory-Resilience');
    }
    if (/aviation administration|faa|airspace|airworthiness|gnss|navigation|router/.test(hay)) {
      if (!riskMatrixMatches.includes('#1')) riskMatrixMatches.push('#1');
      if (!watchlistMatches.includes('#5')) watchlistMatches.push('#5');
      tags.push('FAA-Regulatory');
    }
    if (riskMatrixMatches.length === 0) {
      riskMatrixMatches.push('#7');
    }

    const isHighSignal =
      countdownMatches.length > 0 ||
      /submarine cable|export administration|treasury|cybersecurity|emergency/.test(hay);
    const severity: SignalSeverity = isHighSignal ? 'elevated' : 'info';
    const publishedAtISO = `${d.publication_date}T13:00:00.000Z`;
    const summary = truncateText(
      d.abstract || `${d.type} published by ${agencyNames || 'U.S. Federal Agency'} (${d.document_number}).`,
      260
    );

    return {
      id: `fedreg-${d.document_number}`,
      sourceId: 'federal-register',
      sourceName: 'U.S. Federal Register',
      attributionText: `Source: U.S. Federal Register (${d.document_number} — ${agencyNames || 'Federal Agency'})`,
      publishedAtISO,
      title: `${d.title} (${d.document_number})`,
      summary,
      url: d.html_url,
      severity,
      watchlistMatches,
      riskMatrixMatches,
      countdownMatches,
      tags,
      markdownRow: buildSection84MarkdownRow({
        windowText: d.publication_date,
        entitySector: `${agencyNames || 'Federal Register'} (Federal Regulatory)`,
        impact: truncateText(d.title, 140),
        sourceLabel: `FR ${d.document_number}`,
        url: d.html_url,
        vector: `${d.type} filing mapped to Risk ${riskMatrixMatches.join(', ')}`,
        severity,
        watchlistMatches,
      }),
    };
  });
}

/**
 * 6. Treasury OFAC, DOT MARAD & DOE / FERC Directives Parser (Sanctions, Shadow Fleet & Bulk-Power Grid)
 */
export function parseOfacMaradDoeJson(rawJson: string): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as {
    results?: Array<{
      document_number: string;
      title: string;
      type: string;
      abstract?: string | null;
      html_url: string;
      publication_date: string;
      agencies?: Array<{ name?: string; slug?: string }>;
    }>;
  };

  const docs = parsed.results ?? [];
  return docs.slice(0, 12).map((d) => {
    const agencyNames = (d.agencies ?? [])
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ');
    const slugs = (d.agencies ?? []).map((a) => a.slug ?? '').join(' ');
    const hay = `${d.title} ${d.abstract ?? ''} ${agencyNames} ${slugs}`.toLowerCase();

    const watchlistMatches: string[] = [];
    const riskMatrixMatches: string[] = [];
    const countdownMatches: string[] = [];
    const tags: string[] = ['OFAC-MARAD-DOE'];

    const isOfac =
      /foreign-assets-control|foreign assets control|ofac|sanctions|blocked persons|sdn|iran|russia|houthi|cyber-related|vessel|shadow fleet|petroleum/.test(
        hay
      );
    const isMarad =
      /maritime-administration|maritime administration|marad|shipping|vessel|strait|hormuz|red sea|tanker|port|subsea/.test(
        hay
      );
    const isGridEnergy =
      /energy-department|energy-regulatory|ferc|bulk-power|electric reliability|nerc|cip-|grid|transformer|lng|petroleum reserve|nuclear/.test(
        hay
      );

    if (isOfac) {
      watchlistMatches.push('#4', '#6');
      riskMatrixMatches.push('#3', '#4');
      tags.push('OFAC-Sanctions');
    }
    if (isMarad) {
      if (!watchlistMatches.includes('#4')) watchlistMatches.push('#4');
      if (!watchlistMatches.includes('#5')) watchlistMatches.push('#5');
      if (!riskMatrixMatches.includes('#3')) riskMatrixMatches.push('#3');
      if (!riskMatrixMatches.includes('#6')) riskMatrixMatches.push('#6');
      tags.push('MARAD-Maritime');
    }
    if (isGridEnergy) {
      if (!watchlistMatches.includes('#8')) watchlistMatches.push('#8');
      if (!riskMatrixMatches.includes('#3')) riskMatrixMatches.push('#3');
      if (!riskMatrixMatches.includes('#7')) riskMatrixMatches.push('#7');
      tags.push('DOE-FERC-Grid');
    }
    if (watchlistMatches.length === 0) watchlistMatches.push('#6');
    if (riskMatrixMatches.length === 0) riskMatrixMatches.push('#3');

    const isCritical =
      /emergency|iran|russia|cyber|bulk-power|critical infrastructure|hormuz|red sea|blocked persons|designation/.test(
        hay
      );
    const severity: SignalSeverity =
      /emergency order|imminent|grid security emergency/.test(hay)
        ? 'critical'
        : isCritical
        ? 'elevated'
        : 'info';

    const publishedAtISO = `${d.publication_date}T13:30:00.000Z`;
    const summary = truncateText(
      d.abstract ||
        `${d.type} issued by ${agencyNames || 'OFAC / MARAD / DOE'} (${d.document_number}).`,
      265
    );

    return {
      id: `ofac-doe-${d.document_number}`,
      sourceId: 'ofac-marad-doe',
      sourceName: 'OFAC, MARAD & DOE Directives',
      attributionText: `Source: U.S. Federal Register — ${agencyNames || 'OFAC / MARAD / DOE'} (${d.document_number})`,
      publishedAtISO,
      title: `${d.title} (${d.document_number})`,
      summary,
      url: d.html_url,
      severity,
      watchlistMatches,
      riskMatrixMatches,
      countdownMatches,
      tags,
      markdownRow: buildSection84MarkdownRow({
        windowText: d.publication_date,
        entitySector: `${agencyNames || 'OFAC / MARAD / DOE'} (Sanctions, Maritime & Grid)`,
        impact: truncateText(d.title, 135),
        sourceLabel: `FR ${d.document_number}`,
        url: d.html_url,
        vector: `${d.type} directive mapped to Watchlist ${watchlistMatches.join(', ')}`,
        severity,
        watchlistMatches,
      }),
    };
  });
}

/**
 * 7. Google Cloud Service Health JSON Parser (status.cloud.google.com/incidents.json)
 */
export function parseGcpStatusJson(rawJson: string, now = new Date()): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as Array<{
    id?: string;
    number?: string;
    begin?: string;
    end?: string | null;
    modified?: string;
    external_desc?: string;
    severity?: string;
    status_impact?: string;
    uri?: string;
    affected_products?: Array<{ title?: string }>;
    currently_affected_locations?: Array<{ title?: string; id?: string }>;
    most_recent_update?: { text?: string; when?: string };
  }>;

  if (!Array.isArray(parsed)) return [];
  const cutoffMs = now.getTime() - 10 * 24 * 60 * 60 * 1000;

  return parsed
    .filter((inc) => {
      const isOngoing = !inc.end;
      const beginMs = inc.begin ? Date.parse(inc.begin) : NaN;
      const modMs = inc.modified ? Date.parse(inc.modified) : NaN;
      const refMs = !Number.isNaN(modMs) ? modMs : beginMs;
      return isOngoing || (!Number.isNaN(refMs) && refMs >= cutoffMs);
    })
    .slice(0, 10)
    .map((inc, idx) => {
      const isOngoing = !inc.end;
      const products = (inc.affected_products ?? [])
        .map((p) => p.title)
        .filter(Boolean)
        .join(', ');
      const regions = (inc.currently_affected_locations ?? [])
        .map((l) => l.id || l.title)
        .filter(Boolean)
        .join(', ');
      const headline = stripHtml(
        inc.external_desc || products || `Google Cloud Incident #${inc.number ?? idx + 1}`
      );
      const latestText = stripHtml(inc.most_recent_update?.text ?? '');
      const hay = `${headline} ${products} ${latestText}`.toLowerCase();

      const isIdentitySso =
        /iam|identity|sign-in|oauth|workspace|sso|authentication|directory/.test(hay);
      const watchlistMatches = isIdentitySso ? ['#6', '#7', '#9'] : ['#6', '#7'];
      const riskMatrixMatches = ['#1', '#2'];

      const impact = (inc.status_impact ?? '').toUpperCase();
      const severity: SignalSeverity =
        isOngoing && (impact === 'SERVICE_OUTAGE' || inc.severity === 'high')
          ? 'critical'
          : isOngoing || impact === 'SERVICE_OUTAGE' || impact === 'SERVICE_DISRUPTION'
          ? 'elevated'
          : 'info';

      const url = inc.uri
        ? `https://status.cloud.google.com/${inc.uri.replace(/^\//, '')}`
        : 'https://status.cloud.google.com/';
      const publishedAtISO = new Date(
        inc.most_recent_update?.when || inc.modified || inc.begin || now.toISOString()
      ).toISOString();

      return {
        id: `gcp-${inc.id ?? inc.number ?? idx + 1}`,
        sourceId: 'gcp-status',
        sourceName: 'Google Cloud Service Health',
        attributionText: 'Source: Google Cloud Service Health (status.cloud.google.com)',
        publishedAtISO,
        title: `Google Cloud${products ? ` (${truncateText(products, 48)})` : ''}: ${truncateText(
          headline,
          105
        )} [${isOngoing ? 'ACTIVE' : 'RESOLVED'}]`,
        summary: truncateText(
          `${latestText || headline}${regions ? ` · Active locations: ${regions}.` : ''}`,
          270
        ),
        url,
        severity,
        watchlistMatches,
        riskMatrixMatches,
        countdownMatches: [],
        tags: [
          'Google-Cloud',
          'Hyperscale-Cloud',
          ...(isIdentitySso ? ['IAM-SSO-Watch'] : []),
        ],
        markdownRow: buildSection84MarkdownRow({
          windowText: formatShortWindow(publishedAtISO),
          entitySector: `Google Cloud${products ? ` — ${truncateText(products, 40)}` : ''} (Hyperscale Cloud)`,
          impact: truncateText(headline, 135),
          sourceLabel: 'GCP Status',
          url,
          vector: truncateText(latestText || 'Google Cloud regional/service disruption', 125),
          severity,
          watchlistMatches,
        }),
      };
    });
}

/**
 * 8. Oracle Cloud (OCI) Components JSON Parser (ocistatus.oraclecloud.com/api/v2/components.json)
 */
export function parseOciComponentsJson(rawJson: string, now = new Date()): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as {
    component_health_reports?: Array<{
      name?: string;
      status?: string;
      updated_at?: string;
      region_health_reports?: Array<{
        region_name?: string;
        incident_status?: string;
      }>;
    }>;
    components?: Array<{
      id?: string;
      name?: string;
      status?: string;
      updated_at?: string;
    }>;
  };

  const signals: LiveSignal[] = [];

  for (const comp of parsed.component_health_reports ?? []) {
    const degradedRegions = (comp.region_health_reports ?? []).filter(
      (r) => r.incident_status && !/^operational$/i.test(r.incident_status)
    );
    const compDegraded = comp.status && !/^operational$/i.test(comp.status);
    if (!compDegraded && degradedRegions.length === 0) continue;

    const statusLabel =
      degradedRegions[0]?.incident_status || comp.status || 'Service Degradation';
    const regionList = degradedRegions
      .map((r) => r.region_name)
      .filter(Boolean)
      .slice(0, 4)
      .join(', ');
    const isMajor = /major|outage/i.test(statusLabel);
    const severity: SignalSeverity = isMajor ? 'critical' : 'elevated';
    const publishedAtISO = comp.updated_at
      ? new Date(comp.updated_at).toISOString()
      : now.toISOString();

    signals.push({
      id: `oci-comp-${shortHashHex(`${comp.name}-${statusLabel}`).slice(0, 10)}`,
      sourceId: 'oci-status',
      sourceName: 'Oracle Cloud (OCI) Status',
      attributionText: 'Source: Oracle Cloud Infrastructure Status (ocistatus.oraclecloud.com)',
      publishedAtISO,
      title: `Oracle Cloud (OCI) — ${comp.name ?? 'Service'}: ${statusLabel}${
        regionList ? ` (${regionList})` : ''
      }`,
      summary: truncateText(
        `OCI ${comp.name ?? 'Infrastructure'} reporting ${statusLabel}${
          regionList ? ` across ${regionList}` : ''
        }.`,
        250
      ),
      url: 'https://ocistatus.oraclecloud.com/',
      severity,
      watchlistMatches: ['#6', '#7'],
      riskMatrixMatches: ['#1', '#2'],
      countdownMatches: [],
      tags: ['Oracle-Cloud', 'OCI', statusLabel],
      markdownRow: buildSection84MarkdownRow({
        windowText: formatShortWindow(publishedAtISO),
        entitySector: `Oracle Cloud Infrastructure — ${comp.name ?? 'OCI'} (Hyperscale Cloud)`,
        impact: `${statusLabel}${regionList ? ` in ${regionList}` : ''}`,
        sourceLabel: 'OCI Status',
        url: 'https://ocistatus.oraclecloud.com/',
        vector: 'OCI regional component telemetry',
        severity,
        watchlistMatches: ['#6', '#7'],
      }),
    });
    if (signals.length >= 8) break;
  }

  for (const comp of parsed.components ?? []) {
    if (!comp.status || /^operational$/i.test(comp.status)) continue;
    const isMajor = /major|outage/i.test(comp.status);
    const severity: SignalSeverity = isMajor ? 'critical' : 'elevated';
    const publishedAtISO = comp.updated_at
      ? new Date(comp.updated_at).toISOString()
      : now.toISOString();
    signals.push({
      id: `oci-v2-${comp.id ?? shortHashHex(comp.name ?? 'oci').slice(0, 8)}`,
      sourceId: 'oci-status',
      sourceName: 'Oracle Cloud (OCI) Status',
      attributionText: 'Source: Oracle Cloud Infrastructure Status (ocistatus.oraclecloud.com)',
      publishedAtISO,
      title: `Oracle Cloud (OCI): ${comp.name ?? 'Service'} [${comp.status.toUpperCase()}]`,
      summary: `OCI component ${comp.name ?? 'service'} is currently reporting status: ${comp.status}.`,
      url: 'https://ocistatus.oraclecloud.com/',
      severity,
      watchlistMatches: ['#6', '#7'],
      riskMatrixMatches: ['#1', '#2'],
      countdownMatches: [],
      tags: ['Oracle-Cloud', 'OCI', comp.status],
      markdownRow: buildSection84MarkdownRow({
        windowText: formatShortWindow(publishedAtISO),
        entitySector: `Oracle Cloud — ${comp.name ?? 'OCI'} (Hyperscale Cloud)`,
        impact: `${comp.name ?? 'OCI'} reporting ${comp.status}`,
        sourceLabel: 'OCI Status',
        url: 'https://ocistatus.oraclecloud.com/',
        vector: 'OCI component status degradation',
        severity,
        watchlistMatches: ['#6', '#7'],
      }),
    });
    if (signals.length >= 8) break;
  }

  return signals;
}

/**
 * 9 & 10. Statuspage v2 Incidents Parser (Cloudflare & GitHub Status)
 */
export function parseStatuspageIncidentsJson(
  rawJson: string,
  provider: 'cloudflare-status' | 'github-status',
  now = new Date()
): LiveSignal[] {
  const parsed = JSON.parse(rawJson) as {
    page?: { name?: string; url?: string };
    incidents?: Array<{
      id: string;
      name: string;
      status: string;
      impact: string;
      shortlink?: string;
      created_at: string;
      updated_at?: string;
      incident_updates?: Array<{ body?: string; status?: string }>;
    }>;
  };

  const providerLabel = provider === 'cloudflare-status' ? 'Cloudflare' : 'GitHub';
  const defaultUrl =
    provider === 'cloudflare-status'
      ? 'https://www.cloudflarestatus.com'
      : 'https://www.githubstatus.com';

  const cutoffMs = now.getTime() - 10 * 24 * 60 * 60 * 1000;
  const incidents = (parsed.incidents ?? []).filter((inc) => {
    const isActive = inc.status !== 'resolved' && inc.status !== 'postmortem';
    const createdMs = Date.parse(inc.created_at);
    return isActive || (!Number.isNaN(createdMs) && createdMs >= cutoffMs);
  });

  return incidents.slice(0, 8).map((inc) => {
    const isActive = inc.status !== 'resolved' && inc.status !== 'postmortem';
    const latestUpdate = inc.incident_updates?.[0]?.body ?? '';
    const severity: SignalSeverity =
      inc.impact === 'critical' || (isActive && inc.impact === 'major')
        ? 'critical'
        : isActive || inc.impact === 'major' || inc.impact === 'minor'
        ? 'elevated'
        : 'info';

    const watchlistMatches =
      provider === 'cloudflare-status' ? ['#6', '#7'] : ['#2', '#7'];
    const riskMatrixMatches =
      provider === 'cloudflare-status' ? ['#1', '#2'] : ['#2'];
    const url = inc.shortlink || parsed.page?.url || defaultUrl;

    return {
      id: `${provider}-${inc.id}`,
      sourceId: provider,
      sourceName: `${providerLabel} Status`,
      attributionText: `Source: ${providerLabel} System Status (${new URL(defaultUrl).hostname})`,
      publishedAtISO: new Date(inc.updated_at ?? inc.created_at).toISOString(),
      title: `${providerLabel}: ${inc.name} [${inc.status.toUpperCase()}]`,
      summary: truncateText(
        latestUpdate || `${providerLabel} ${inc.impact} impact incident (${inc.status}).`,
        260
      ),
      url,
      severity,
      watchlistMatches,
      riskMatrixMatches,
      countdownMatches: [],
      tags: [providerLabel, `impact:${inc.impact}`, `status:${inc.status}`],
      markdownRow: buildSection84MarkdownRow({
        windowText: formatShortWindow(inc.created_at),
        entitySector: `${providerLabel} (${
          provider === 'cloudflare-status' ? 'Global CDN & Edge' : 'Developer & CI/CD Backbone'
        })`,
        impact: truncateText(`${inc.name} (${inc.impact} impact; ${inc.status})`, 140),
        sourceLabel: `${providerLabel} Status`,
        url,
        vector: truncateText(latestUpdate || 'Backbone service degradation', 130),
        severity,
        watchlistMatches,
      }),
    };
  });
}
