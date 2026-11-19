import { XMLParser } from 'fast-xml-parser';
import { LiveSignal, SignalSeverity } from '../../src/types/schemas';
import {
  buildSection84MarkdownRow,
  formatShortWindow,
  shortHashHex,
  stripHtml,
  truncateText,
} from '../../src/lib/live-parsers';

export {
  buildSection84MarkdownRow,
  formatShortWindow,
  parseCisaKevJson,
  parseFederalRegisterJson,
  parseGcpStatusJson,
  parseNistNvdJson,
  parseNoaaSwpcAlertsJson,
  parseOciComponentsJson,
  parseOfacMaradDoeJson,
  parseStatuspageIncidentsJson,
  parseUsgsSeismicGeoJson,
  shortHashHex,
  stripHtml,
  truncateText,
} from '../../src/lib/live-parsers';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  parseTagValue: false,
  isArray: (tagName) =>
    [
      'item',
      'entry',
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

/**
 * CISA Cybersecurity Advisories RSS XML Parser (ICS/OT/PLC, Emergency Directives, FBI/NSA LotL/ARTEX/Java4Shell -> Watchlist #1, #2, #3, #8)
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
      /icsa-|ics-advisories|plc\b|scada|operational technology|rockwell|siemens|schneider|dorsett|controls|modbus|water|energy|dams|artex/.test(
        hay
      );
    const isDirective =
      /emergency directive|binding operational|bootloader|firmware|juniper|cisco|java4shell|openjdk|puppet/.test(
        hay
      );
    const isLotl =
      /living-off-the-land|living off the land|volt typhoon|salt typhoon|nsa|fbi|tacacs|radius|staging|artex/.test(
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
 * FAA NAS Status XML + JSON Parser
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

  for (let dtIdx = 0; dtIdx < delayTypes.length; dtIdx += 1) {
    const dt = delayTypes[dtIdx];
    const typeName = String(dt.Name ?? `NAS Event Group ${dtIdx + 1}`).trim();

    // Ground Stops (<Ground_Stop_List><Program>...)
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

    // Ground Delay Programs (<Ground_Delay_List><Ground_Delay>...)
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

    // Arrival / Departure Delays (<Arrival_Departure_Delay_List><Delay>...)
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

    // Airport Closures (<Airport_Closure_List><Airport>...) across ALL <Delay_type> blocks
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

  // Enrich/fallback from JSON /api/airport-events if any groundStop wasn't in XML
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
 * AWS Service Health RSS XML Parser (recent 7-day items)
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
        id: `aws-${idx}-${shortHashHex(url).slice(0, 12)}`,
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
 * Microsoft Azure & Entra ID RSS XML Parser (rssfeed.azure.status.microsoft)
 */
export function parseAzureStatusRss(rawXml: string, now = new Date()): LiveSignal[] {
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

  const cutoffMs = now.getTime() - 10 * 24 * 60 * 60 * 1000;
  const items = doc.rss?.channel?.item ?? [];

  return items
    .filter((item) => {
      const pubMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
      return Number.isNaN(pubMs) || pubMs >= cutoffMs;
    })
    .slice(0, 10)
    .map((item, idx) => {
      const title = stripHtml(String(item.title ?? `Microsoft Azure Event #${idx + 1}`));
      const rawGuid =
        typeof item.guid === 'object' ? item.guid?.['#text'] : item.guid;
      const rawLink = String(item.link || rawGuid || 'https://azure.status.microsoft/en-us/status').trim();
      const url = rawLink.startsWith('http')
        ? rawLink
        : 'https://azure.status.microsoft/en-us/status';
      const desc = truncateText(stripHtml(String(item.description ?? '')), 265);
      const pubMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
      const publishedAtISO = !Number.isNaN(pubMs)
        ? new Date(pubMs).toISOString()
        : now.toISOString();

      const hay = `${title} ${desc}`.toLowerCase();
      const isEntraSso =
        /entra|active directory|azure ad|conditional access|multi-factor|mfa|sign-in|identity|authentication/.test(
          hay
        );
      const isResolved = /resolved|mitigated|recovery complete/i.test(hay);
      const isMajor = /outage|critical|global|front door|expressroute|entra/i.test(hay);

      const severity: SignalSeverity =
        !isResolved && isMajor ? 'critical' : !isResolved ? 'elevated' : 'info';
      const watchlistMatches = isEntraSso ? ['#6', '#7', '#9'] : ['#6', '#7'];
      const riskMatrixMatches = ['#1', '#2'];

      return {
        id: `azure-${idx}-${shortHashHex(`${title}-${publishedAtISO}`).slice(0, 10)}`,
        sourceId: 'azure-status',
        sourceName: 'Microsoft Azure & Entra ID',
        attributionText: 'Source: Microsoft Azure Service Health (azure.status.microsoft)',
        publishedAtISO,
        title: `Azure: ${title}`,
        summary:
          desc ||
          `${title}${
            isEntraSso
              ? ' [Monitor for downstream enterprise Entra ID / SSO authentication cascade per Watchlist #9]'
              : ''
          }`,
        url,
        severity,
        watchlistMatches,
        riskMatrixMatches,
        countdownMatches: [],
        tags: [
          'Microsoft-Azure',
          'Hyperscale-Cloud',
          ...(isEntraSso ? ['Entra-SSO-Watch'] : []),
        ],
        markdownRow: buildSection84MarkdownRow({
          windowText: formatShortWindow(publishedAtISO),
          entitySector: `Microsoft Azure${isEntraSso ? ' / Entra ID' : ''} (Hyperscale Cloud & Identity)`,
          impact: truncateText(title, 135),
          sourceLabel: 'Azure Status',
          url,
          vector: truncateText(desc || 'Azure regional or identity service event', 125),
          severity,
          watchlistMatches,
        }),
      };
    });
}

/**
 * Oracle Cloud Infrastructure (OCI) Incident Summary RSS XML Parser
 */
export function parseOciStatusRss(rawXml: string, now = new Date()): LiveSignal[] {
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

  const cutoffMs = now.getTime() - 10 * 24 * 60 * 60 * 1000;
  const items = doc.rss?.channel?.item ?? [];

  return items
    .filter((item) => {
      const pubMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
      return Number.isNaN(pubMs) || pubMs >= cutoffMs;
    })
    .slice(0, 8)
    .map((item, idx) => {
      const title = stripHtml(String(item.title ?? `Oracle Cloud Event #${idx + 1}`));
      const rawGuid =
        typeof item.guid === 'object' ? item.guid?.['#text'] : item.guid;
      const rawLink = String(item.link || rawGuid || 'https://ocistatus.oraclecloud.com/').trim();
      const url = rawLink.startsWith('http') ? rawLink : 'https://ocistatus.oraclecloud.com/';
      const desc = truncateText(stripHtml(String(item.description ?? '')), 260);
      const pubMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
      const publishedAtISO = !Number.isNaN(pubMs)
        ? new Date(pubMs).toISOString()
        : now.toISOString();

      const hay = `${title} ${desc}`.toLowerCase();
      const isResolved = /resolved|completed|operating normally/i.test(hay);
      const isOutage = /outage|severe|major|critical/i.test(hay);
      const severity: SignalSeverity =
        !isResolved && isOutage ? 'critical' : !isResolved ? 'elevated' : 'info';

      return {
        id: `oci-rss-${idx}-${shortHashHex(`${title}-${url}`).slice(0, 10)}`,
        sourceId: 'oci-status',
        sourceName: 'Oracle Cloud (OCI) Status',
        attributionText: 'Source: Oracle Cloud Infrastructure Status (ocistatus.oraclecloud.com)',
        publishedAtISO,
        title: `Oracle Cloud (OCI): ${title}`,
        summary: desc || title,
        url,
        severity,
        watchlistMatches: ['#6', '#7'],
        riskMatrixMatches: ['#1', '#2'],
        countdownMatches: [],
        tags: ['Oracle-Cloud', 'OCI', 'Hyperscale-Cloud'],
        markdownRow: buildSection84MarkdownRow({
          windowText: formatShortWindow(publishedAtISO),
          entitySector: 'Oracle Cloud Infrastructure (Hyperscale Cloud)',
          impact: truncateText(title, 135),
          sourceLabel: 'OCI Status',
          url,
          vector: truncateText(desc || 'OCI service incident', 125),
          severity,
          watchlistMatches: ['#6', '#7'],
        }),
      };
    });
}

/**
 * Apple System Status Parser (JSONP or pure JSON)
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
