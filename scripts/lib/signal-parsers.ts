import { XMLParser } from 'fast-xml-parser';
import { LiveSignal, SignalSeverity } from '../../src/types/schemas';

const PRIORITY_KEV_VENDORS = [
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
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  parseTagValue: false,
  isArray: (tagName) =>
    [
      'item',
      'Delay_type',
      'Ground_Stop',
      'Program',
      'Ground_Delay',
      'Airport',
      'Delay',
      'Arrival_Departure_Delay_List',
      'Airport_Closure_List',
      'Ground_Stop_List',
      'Ground_Delay_List',
      'Airspace_Flow_List',
      'Airspace_Flow',
    ].includes(tagName),
});

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
 * 1. CISA KEV Catalog Parser (last 14 days; highlights routing/gateway/hypervisor/browser/MSP vendors -> Watchlist #2 & #8)
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
    const vendorProd = `${v.vendorProject} ${v.product}`.toLowerCase();
    const isPriorityVendor = PRIORITY_KEV_VENDORS.some((kw) => vendorProd.includes(kw));
    const watchlistMatches = ['#2'];
    const riskMatrixMatches = ['#2'];

    if (isPriorityVendor || /esxi|vmware|check point|juniper|cisco|ivanti|fortinet/i.test(vendorProd)) {
      if (!watchlistMatches.includes('#8')) watchlistMatches.push('#8');
    }
    if (/juniper|cisco|palo alto|fortinet|ivanti/i.test(vendorProd)) {
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
 * 2. CISA Cybersecurity Advisories RSS XML Parser (ICS/OT/PLC, Emergency Directives, FBI/NSA LotL -> Watchlist #1, #3, #8)
 */
export function parseCisaAdvisoriesXml(rawXml: string): LiveSignal[] {
  const doc = xmlParser.parse(rawXml) as {
    rss?: {
      channel?: {
        item?: Array<{
          title?: string;
          link?: string;
          description?: string;
          pubDate?: string;
        }>;
      };
    };
  };

  const items = doc.rss?.channel?.item ?? [];
  return items.slice(0, 15).map((item, idx) => {
    const title = stripHtml(String(item.title ?? `CISA Advisory #${idx + 1}`));
    const link = String(item.link ?? 'https://www.cisa.gov/news-events/cybersecurity-advisories').trim();
    const desc = truncateText(stripHtml(String(item.description ?? '')), 260);
    const pubMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
    const publishedAtISO = !Number.isNaN(pubMs)
      ? new Date(pubMs).toISOString()
      : new Date().toISOString();

    const hay = `${title} ${link} ${desc}`.toLowerCase();
    const isIcsOt =
      /icsa-|ics-advisories|plc\b|scada|operational technology|rockwell|siemens|schneider|dorsett|controls|modbus|water|energy|dams/.test(
        hay
      );
    const isDirective = /emergency directive|binding operational|bootloader|firmware|juniper|cisco/.test(
      hay
    );
    const isLotl =
      /living-off-the-land|living off the land|volt typhoon|salt typhoon|nsa|fbi|tacacs|radius|staging/.test(
        hay
      );

    const watchlistMatches: string[] = [];
    const riskMatrixMatches: string[] = [];
    const tags: string[] = ['CISA-Advisory'];

    if (isDirective) {
      watchlistMatches.push('#1');
      riskMatrixMatches.push('#1');
      tags.push('Emergency-Directive');
    }
    if (isLotl) {
      watchlistMatches.push('#3');
      riskMatrixMatches.push('#2', '#8');
      tags.push('Joint-LotL-Guidance');
    }
    if (isIcsOt) {
      watchlistMatches.push('#8');
      if (!riskMatrixMatches.includes('#3')) riskMatrixMatches.push('#3');
      tags.push('ICS-OT-PLC');
    }
    if (watchlistMatches.length === 0) {
      watchlistMatches.push('#7');
      riskMatrixMatches.push('#2');
    }

    const severity: SignalSeverity = isDirective
      ? 'critical'
      : isIcsOt || isLotl
      ? 'elevated'
      : 'info';

    const slug = link.split('/').filter(Boolean).pop() ?? `item-${idx}`;

    return {
      id: `cisa-adv-${slug.replace(/[^a-zA-Z0-9_-]/g, '')}`,
      sourceId: 'cisa-advisories',
      sourceName: 'CISA Advisories',
      attributionText: 'Source: CISA Cybersecurity & ICS Advisories (cisa.gov)',
      publishedAtISO,
      title,
      summary: desc || title,
      url: link,
      severity,
      watchlistMatches,
      riskMatrixMatches,
      countdownMatches: [],
      tags,
      markdownRow: buildSection84MarkdownRow({
        windowText: formatShortWindow(publishedAtISO),
        entitySector: `${title} (${isIcsOt ? 'ICS / Critical OT' : 'Federal Cyber Advisory'})`,
        impact: desc || title,
        sourceLabel: 'CISA Advisory',
        url: link,
        vector: isIcsOt
          ? 'ICS/OT vulnerability or PLC exposure advisory'
          : 'Federal cybersecurity advisory readout',
        severity,
        watchlistMatches,
      }),
    };
  });
}

/**
 * 3. FAA NAS Status XML + JSON Parser
 * CRITICAL RULE: Iterates ALL <Delay_type> blocks in XML rather than taking only the first match.
 * Plain-text attribution strictly: "Source: FAA NAS Status (nasstatus.faa.gov)" + Update_Time.
 */
export function parseFaaNasStatus(
  rawXml: string,
  rawEventsJson?: string | null,
  now = new Date()
): { updateTimeText: string; signals: LiveSignal[] } {
  const doc = xmlParser.parse(rawXml) as {
    AIRPORT_STATUS_INFORMATION?: {
      Update_Time?: string;
      Delay_type?: Array<Record<string, unknown>>;
    };
  };

  const root = doc.AIRPORT_STATUS_INFORMATION ?? {};
  const updateTimeText = String(root.Update_Time ?? now.toUTCString()).trim();
  const parsedUpdateMs = Date.parse(updateTimeText);
  const publishedAtISO = !Number.isNaN(parsedUpdateMs)
    ? new Date(parsedUpdateMs).toISOString()
    : now.toISOString();

  const attributionText = `Source: FAA NAS Status (nasstatus.faa.gov) — Update_Time: ${updateTimeText}`;
  const delayTypes = Array.isArray(root.Delay_type)
    ? root.Delay_type
    : root.Delay_type
    ? [root.Delay_type]
    : [];

  const signals: LiveSignal[] = [];
  const seenKeys = new Set<string>();

  // Iterate EVERY <Delay_type> block in the XML document
  for (let dtIdx = 0; dtIdx < delayTypes.length; dtIdx += 1) {
    const dt = delayTypes[dtIdx];
    const typeName = String(dt.Name ?? `NAS Event Group ${dtIdx + 1}`).trim();

    // 3a. Ground Stops (<Ground_Stop_List><Program>...)
    const gsLists = (dt.Ground_Stop_List as Array<Record<string, unknown>> | undefined) ?? [];
    for (const gsList of gsLists) {
      const programs = (gsList.Program as Array<Record<string, unknown>> | undefined) ?? [];
      for (const prog of programs) {
        const arpt = String(prog.ARPT ?? 'NAS').trim();
        const reason = String(prog.Reason ?? 'Ground Stop').trim();
        const endTime = String(prog.End_Time ?? '').trim();
        const key = `gs-${arpt}-${reason}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        signals.push({
          id: `faa-gs-${arpt.toLowerCase()}-${signals.length + 1}`,
          sourceId: 'faa-nas',
          sourceName: 'FAA NAS Status',
          attributionText,
          publishedAtISO,
          title: `FAA Ground Stop Active: ${arpt} (${typeName})`,
          summary: `Ground Stop at ${arpt} — Reason: ${reason}${endTime ? ` | Est. End: ${endTime}` : ''}. (${attributionText})`,
          url: 'https://nasstatus.faa.gov/',
          severity: 'critical',
          watchlistMatches: ['#5', '#7'],
          riskMatrixMatches: ['#1'],
          countdownMatches: [],
          tags: ['FAA-NAS', 'Ground-Stop', arpt],
          markdownRow: buildSection84MarkdownRow({
            windowText: updateTimeText,
            entitySector: `FAA NAS — ${arpt} (National Aviation / ATC)`,
            impact: `Active Ground Stop at ${arpt}${endTime ? ` through ${endTime}` : ''}`,
            sourceLabel: 'FAA NAS Status',
            url: 'https://nasstatus.faa.gov/',
            vector: `FAA NAS ${typeName}: ${reason}`,
            severity: 'critical',
            watchlistMatches: ['#5', '#7'],
          }),
        });
      }
    }

    // 3b. Ground Delay Programs (<Ground_Delay_List><Ground_Delay>...)
    const gdLists = (dt.Ground_Delay_List as Array<Record<string, unknown>> | undefined) ?? [];
    for (const gdList of gdLists) {
      const gds = (gdList.Ground_Delay as Array<Record<string, unknown>> | undefined) ?? [];
      for (const gd of gds) {
        const arpt = String(gd.ARPT ?? 'NAS').trim();
        const reason = String(gd.Reason ?? 'Ground Delay Program').trim();
        const avg = String(gd.Avg ?? '').trim();
        const max = String(gd.Max ?? '').trim();
        const key = `gdp-${arpt}-${reason}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        signals.push({
          id: `faa-gdp-${arpt.toLowerCase()}-${signals.length + 1}`,
          sourceId: 'faa-nas',
          sourceName: 'FAA NAS Status',
          attributionText,
          publishedAtISO,
          title: `FAA Ground Delay Program: ${arpt} (${avg ? `Avg ${avg}` : typeName})`,
          summary: `GDP at ${arpt} — Reason: ${reason}${avg ? `, Avg delay: ${avg}` : ''}${max ? `, Max: ${max}` : ''}. (${attributionText})`,
          url: 'https://nasstatus.faa.gov/',
          severity: 'elevated',
          watchlistMatches: ['#5', '#7'],
          riskMatrixMatches: ['#1'],
          countdownMatches: [],
          tags: ['FAA-NAS', 'Ground-Delay', arpt],
          markdownRow: buildSection84MarkdownRow({
            windowText: updateTimeText,
            entitySector: `FAA NAS — ${arpt} (National Aviation / ATC)`,
            impact: `Ground Delay Program at ${arpt} (${avg || 'active'})`,
            sourceLabel: 'FAA NAS Status',
            url: 'https://nasstatus.faa.gov/',
            vector: `FAA NAS ${typeName}: ${reason}`,
            severity: 'elevated',
            watchlistMatches: ['#5', '#7'],
          }),
        });
      }
    }

    // 3c. Arrival / Departure Delays (<Arrival_Departure_Delay_List><Delay>...)
    const adLists =
      (dt.Arrival_Departure_Delay_List as Array<Record<string, unknown>> | undefined) ?? [];
    for (const adList of adLists) {
      const delays = (adList.Delay as Array<Record<string, unknown>> | undefined) ?? [];
      for (const d of delays) {
        const arpt = String(d.ARPT ?? 'NAS').trim();
        const reason = String(d.Reason ?? 'Operations').trim();
        const key = `ad-${arpt}-${reason}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        signals.push({
          id: `faa-delay-${arpt.toLowerCase()}-${signals.length + 1}`,
          sourceId: 'faa-nas',
          sourceName: 'FAA NAS Status',
          attributionText,
          publishedAtISO,
          title: `FAA Arrival/Departure Delay: ${arpt}`,
          summary: `${typeName} at ${arpt} — Reason: ${reason}. (${attributionText})`,
          url: 'https://nasstatus.faa.gov/',
          severity: 'elevated',
          watchlistMatches: ['#7'],
          riskMatrixMatches: ['#1'],
          countdownMatches: [],
          tags: ['FAA-NAS', 'Arrival-Departure-Delay', arpt],
          markdownRow: buildSection84MarkdownRow({
            windowText: updateTimeText,
            entitySector: `FAA NAS — ${arpt} (Commercial Aviation)`,
            impact: `Arrival/Departure delays reported at ${arpt}`,
            sourceLabel: 'FAA NAS Status',
            url: 'https://nasstatus.faa.gov/',
            vector: `FAA NAS ${typeName}: ${reason}`,
            severity: 'elevated',
            watchlistMatches: ['#7'],
          }),
        });
      }
    }

    // 3d. Airport Closures (<Airport_Closure_List><Airport>...) across ALL <Delay_type> blocks
    const clLists = (dt.Airport_Closure_List as Array<Record<string, unknown>> | undefined) ?? [];
    for (const clList of clLists) {
      const airports = (clList.Airport as Array<Record<string, unknown>> | undefined) ?? [];
      for (const ap of airports) {
        const arpt = String(ap.ARPT ?? 'NAS').trim();
        const reason = String(ap.Reason ?? 'NOTAM Closure').trim();
        const reopen = String(ap.Reopen ?? '').trim();
        const isNonSkedGaOnly = /NON\s+SKED\s+TRANSIENT\s+GA/i.test(reason);
        const severity: SignalSeverity = isNonSkedGaOnly ? 'info' : 'elevated';
        const key = `cl-${arpt}-${reason.slice(0, 40)}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        signals.push({
          id: `faa-closure-${arpt.toLowerCase()}-${signals.length + 1}`,
          sourceId: 'faa-nas',
          sourceName: 'FAA NAS Status',
          attributionText,
          publishedAtISO,
          title: `FAA ${typeName}: ${arpt}${isNonSkedGaOnly ? ' (GA NOTAM Restriction)' : ''}`,
          summary: `${arpt}: ${truncateText(reason, 180)}${reopen ? ` | Reopen: ${reopen}` : ''}. (${attributionText})`,
          url: 'https://nasstatus.faa.gov/',
          severity,
          watchlistMatches: ['#7'],
          riskMatrixMatches: ['#1'],
          countdownMatches: [],
          tags: ['FAA-NAS', 'Airport-Closure', arpt],
          markdownRow: buildSection84MarkdownRow({
            windowText: updateTimeText,
            entitySector: `FAA NAS — ${arpt} (National Aviation / Airport Ops)`,
            impact: `${typeName} active at ${arpt}${reopen ? ` until ${reopen}` : ''}`,
            sourceLabel: 'FAA NAS Status',
            url: 'https://nasstatus.faa.gov/',
            vector: truncateText(reason, 120),
            severity,
            watchlistMatches: ['#7'],
          }),
        });
      }
    }
  }

  // Enrich/fallback from JSON /api/airport-events if any groundStop / groundDelay wasn't in XML
  if (rawEventsJson) {
    try {
      const events = JSON.parse(rawEventsJson) as Array<{
        airportId?: string;
        airportLongName?: string;
        groundStop?: { reason?: string; endTime?: string } | null;
        groundDelay?: { reason?: string; avgDelay?: string } | null;
      }>;
      for (const ev of events) {
        const arpt = ev.airportId ?? 'NAS';
        if (ev.groundStop) {
          const reason = ev.groundStop.reason ?? 'Ground Stop';
          const key = `gs-${arpt}-${reason}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            signals.push({
              id: `faa-json-gs-${arpt.toLowerCase()}-${signals.length + 1}`,
              sourceId: 'faa-nas',
              sourceName: 'FAA NAS Status',
              attributionText,
              publishedAtISO,
              title: `FAA Ground Stop Active: ${arpt} (${ev.airportLongName ?? arpt})`,
              summary: `Ground Stop at ${arpt} — Reason: ${reason}. (${attributionText})`,
              url: 'https://nasstatus.faa.gov/',
              severity: 'critical',
              watchlistMatches: ['#5', '#7'],
              riskMatrixMatches: ['#1'],
              countdownMatches: [],
              tags: ['FAA-NAS', 'Ground-Stop', arpt],
              markdownRow: buildSection84MarkdownRow({
                windowText: updateTimeText,
                entitySector: `FAA NAS — ${arpt} (National Aviation / ATC)`,
                impact: `Ground Stop active at ${arpt}`,
                sourceLabel: 'FAA NAS Status',
                url: 'https://nasstatus.faa.gov/',
                vector: reason,
                severity: 'critical',
                watchlistMatches: ['#5', '#7'],
              }),
            });
          }
        }
      }
    } catch {
      // XML remains primary source if JSON parse fails
    }
  }

  return { updateTimeText, signals };
}

/**
 * 4. U.S. Federal Register REST API v1 Parser -> Maps to Countdown Cliffs & Risk Matrix
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
 * 5 & 6. Statuspage v2 Incidents Parser (Cloudflare & GitHub Status)
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

/**
 * 7. AWS Service Health RSS XML Parser (recent 7-day items)
 */
export function parseAwsStatusRss(rawXml: string, now = new Date()): LiveSignal[] {
  const doc = xmlParser.parse(rawXml) as {
    rss?: {
      channel?: {
        item?: Array<{
          title?: string;
          link?: string;
          pubDate?: string;
          guid?: string | { '#text'?: string };
          description?: string;
        }>;
      };
    };
  };

  const cutoffMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const items = doc.rss?.channel?.item ?? [];

  return items
    .filter((item) => {
      const pubMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
      return !Number.isNaN(pubMs) && pubMs >= cutoffMs;
    })
    .slice(0, 10)
    .map((item, idx) => {
      const title = stripHtml(String(item.title ?? `AWS Health Event #${idx + 1}`));
      const rawGuid =
        typeof item.guid === 'object' ? item.guid?.['#text'] : item.guid;
      const url = String(rawGuid || item.link || 'https://health.aws.amazon.com/health/status').trim();
      const desc = truncateText(stripHtml(String(item.description ?? '')), 260);
      const publishedAtISO = item.pubDate
        ? new Date(Date.parse(item.pubDate)).toISOString()
        : now.toISOString();
      const isResolved = /\[resolved\]|operating normally/i.test(`${title} ${desc}`);
      const severity: SignalSeverity = isResolved ? 'info' : 'elevated';

      return {
        id: `aws-${idx}-${Buffer.from(url).toString('hex').slice(0, 12)}`,
        sourceId: 'aws-status',
        sourceName: 'AWS Service Health',
        attributionText: 'Source: AWS Service Health Dashboard (status.aws.amazon.com)',
        publishedAtISO,
        title: `AWS: ${title}`,
        summary: desc || title,
        url: url.startsWith('http') ? url : 'https://status.aws.amazon.com/',
        severity,
        watchlistMatches: ['#6', '#7'],
        riskMatrixMatches: ['#1', '#3'],
        countdownMatches: [],
        tags: ['AWS', 'Hyperscale-Cloud'],
        markdownRow: buildSection84MarkdownRow({
          windowText: formatShortWindow(publishedAtISO),
          entitySector: 'Amazon Web Services (Hyperscale Cloud)',
          impact: title,
          sourceLabel: 'AWS Status',
          url: url.startsWith('http') ? url : 'https://status.aws.amazon.com/',
          vector: desc || 'AWS regional service event',
          severity,
          watchlistMatches: ['#6', '#7'],
        }),
      };
    });
}

/**
 * 8. Apple System Status Parser (JSONP or pure JSON)
 * Strips any outer `jsonCallback(...)` wrapper if present before calling JSON.parse().
 * Flags iCloud / App Store / Apple Pay / Business events for potential iOS third-party auth cascade noise (Watchlist #9).
 */
export function stripJsonpWrapper(rawInput: string): string {
  const trimmed = rawInput.trim();
  const match = /^[a-zA-Z0-9_$.]+\s*\(([\s\S]*)\)\s*;?$/.exec(trimmed);
  if (match) {
    return match[1].trim();
  }
  return trimmed;
}

export function parseAppleSystemStatus(rawPayload: string, now = new Date()): LiveSignal[] {
  const cleanJson = stripJsonpWrapper(rawPayload);
  const parsed = JSON.parse(cleanJson) as {
    services?: Array<{
      serviceName: string;
      events?: Array<{
        messageId?: string;
        statusType?: string;
        message?: string;
        startDate?: string;
        endDate?: string | null;
        epochStartDate?: number;
        epochEndDate?: number | null;
        usersAffected?: string;
        eventStatus?: string;
      }>;
    }>;
  };

  const cutoffMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const signals: LiveSignal[] = [];

  for (const svc of parsed.services ?? []) {
    for (const ev of svc.events ?? []) {
      const startMs =
        typeof ev.epochStartDate === 'number'
          ? ev.epochStartDate
          : ev.startDate
          ? Date.parse(ev.startDate)
          : NaN;

      const isOngoing = ev.eventStatus !== 'resolved' && ev.eventStatus !== 'completed';
      if (!isOngoing && !Number.isNaN(startMs) && startMs < cutoffMs) {
        continue;
      }

      const publishedAtISO = !Number.isNaN(startMs)
        ? new Date(startMs).toISOString()
        : now.toISOString();

      const isAuthCascadeProne =
        /icloud|sign in|apple account|app store|apple pay|apple business|school manager|mail/i.test(
          svc.serviceName
        );

      const watchlistMatches = isAuthCascadeProne ? ['#7', '#9'] : ['#7'];
      const riskMatrixMatches = ['#1'];
      const severity: SignalSeverity =
        isOngoing && /outage/i.test(ev.statusType ?? '')
          ? 'critical'
          : isOngoing || /outage/i.test(ev.statusType ?? '')
          ? 'elevated'
          : 'info';

      const cascadeNote = isAuthCascadeProne
        ? ' [Monitor for downstream iOS third-party auth/mail cascade noise per Watchlist #9]'
        : '';

      const id = `apple-${svc.serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${
        ev.messageId ?? signals.length + 1
      }`;

      signals.push({
        id,
        sourceId: 'apple-status',
        sourceName: 'Apple System Status',
        attributionText: 'Source: Apple System Status (apple.com/support/systemstatus)',
        publishedAtISO,
        title: `Apple ${svc.serviceName}: ${ev.statusType ?? 'Service Event'} [${(
          ev.eventStatus ?? 'active'
        ).toUpperCase()}]`,
        summary: truncateText(
          `${ev.message ?? 'Service disruption reported.'} (${
            ev.usersAffected ?? 'Users affected'
          }; Window: ${ev.startDate ?? 'recent'}${ev.endDate ? ` – ${ev.endDate}` : ' – ongoing'})${cascadeNote}`,
          280
        ),
        url: 'https://www.apple.com/support/systemstatus/',
        severity,
        watchlistMatches,
        riskMatrixMatches,
        countdownMatches: [],
        tags: [
          'Apple-Ecosystem',
          svc.serviceName,
          ...(isAuthCascadeProne ? ['Auth-Cascade-Watch'] : []),
        ],
        markdownRow: buildSection84MarkdownRow({
          windowText: ev.startDate ?? formatShortWindow(publishedAtISO),
          entitySector: `Apple — ${svc.serviceName} (Consumer, Payments & Enterprise)`,
          impact: `${ev.statusType ?? 'Issue'} (${ev.usersAffected ?? 'subset of users'}); status: ${
            ev.eventStatus ?? 'ongoing'
          }`,
          sourceLabel: 'Apple System Status',
          url: 'https://www.apple.com/support/systemstatus/',
          vector: `${ev.message ?? 'Apple service event'}${isAuthCascadeProne ? '; Watchlist #9 auth cascade check' : ''}`,
          severity,
          watchlistMatches,
        }),
      });
    }
  }

  return signals;
}
