import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  ChangelogData,
  ChangelogDataSchema,
  ContentBlock,
  CountdownCliff,
  CountdownCliffsArraySchema,
  HorizonGroup,
  IncidentClassification,
  IncidentRow,
  IncidentsArraySchema,
  MarkdownTable,
  NarrativeSection,
  PrimarySourceEntry,
  RiskMatrixArraySchema,
  RiskVector,
  SectionsData,
  SectionsDataSchema,
  SourceLink,
  Subsection,
  SummaryPillar,
  WatchlistArraySchema,
  WatchlistRow,
} from '../../src/types/schemas';

export class BriefingValidationError extends Error {
  public readonly issues: unknown;
  constructor(message: string, issues?: unknown) {
    super(message);
    this.name = 'BriefingValidationError';
    this.issues = issues;
  }
}

export interface ParsedBriefingBundle {
  docHash: string;
  riskMatrix: RiskVector[];
  incidents: IncidentRow[];
  countdownCliffs: CountdownCliff[];
  watchlist: WatchlistRow[];
  sections: SectionsData;
}

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

/**
 * Unescapes Google Docs Markdown export escape sequences while preserving markdown links and emphasis.
 */
export function cleanMarkdownEscapes(input: string): string {
  return input
    .replace(/\\\[\\\.\s*\\\]/g, '[.]')
    .replace(/\\\[(\.)\\\]/g, '[.]')
    .replace(/\\([.~$#+><&\-_|()[\]])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips bold/italic wrappers while preserving readable text and inline markdown links if keepLinks=true.
 */
export function stripFormatting(input: string, keepLinks = false): string {
  let out = cleanMarkdownEscapes(input);
  if (!keepLinks) {
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1');
  }
  out = out
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
  return out.trim();
}

export function extractMarkdownLinks(input: string): SourceLink[] {
  const cleaned = cleanMarkdownEscapes(input);
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  const seen = new Set<string>();
  const links: SourceLink[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned)) !== null) {
    const label = stripFormatting(match[1], false);
    const url = match[2].trim();
    const key = `${label}::${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      links.push({ label, url });
    }
  }
  return links;
}

export function splitTableRow(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return inner.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}

export function extractMarkdownTableAt(
  lines: string[],
  startIdx: number
): { table: MarkdownTable; nextIdx: number } | null {
  const headerLine = lines[startIdx]?.trim() ?? '';
  const sepLine = lines[startIdx + 1]?.trim() ?? '';
  if (!headerLine.startsWith('|') || !sepLine.startsWith('|')) {
    return null;
  }
  const headers = splitTableRow(headerLine).map((h) => stripFormatting(h, false));
  const sepCells = splitTableRow(sepLine);
  if (!isSeparatorRow(sepCells)) {
    return null;
  }
  const rows: string[][] = [];
  let idx = startIdx + 2;
  while (idx < lines.length && lines[idx].trim().startsWith('|')) {
    const cells = splitTableRow(lines[idx]);
    if (!isSeparatorRow(cells)) {
      rows.push(cells);
    }
    idx += 1;
  }
  return { table: { headers, rows }, nextIdx: idx };
}

function classifyHorizonGroup(horizonText: string): HorizonGroup {
  if (/immediate/i.test(horizonText)) {
    return 'Immediate';
  }
  if (/2027[–-]2030|medium\s*term/i.test(horizonText)) {
    return '2027–2030';
  }
  return '10–54 Days';
}

function classifyIncident(
  entityAndSector: string,
  impact: string,
  vector: string
): IncidentClassification {
  const combined = `${entityAndSector} ${impact} ${vector}`;
  if (/confirmed malicious attack|optimjack|supply-chain attack|card-skimmer|malware/i.test(combined)) {
    return 'malicious_attack';
  }
  if (/ios\/gmail cascade|downstream ios gmail|phantom gmail|third-party auth/i.test(combined)) {
    return 'client_cascade';
  }
  if (/unspecified technical disruption|root cause pending/i.test(vector)) {
    return 'unspecified';
  }
  return 'hybrid_transition_bug';
}

function parseEntityAndSector(rawCell: string): { entity: string; sector: string } {
  const text = stripFormatting(rawCell, false);
  // Find the last balanced parenthetical at the end of the string
  if (text.endsWith(')')) {
    let depth = 0;
    for (let i = text.length - 1; i >= 0; i -= 1) {
      if (text[i] === ')') depth += 1;
      else if (text[i] === '(') {
        depth -= 1;
        if (depth === 0) {
          const entity = text.slice(0, i).trim();
          const sector = text.slice(i + 1, text.length - 1).trim();
          if (entity && sector) {
            return { entity, sector };
          }
          break;
        }
      }
    }
  }
  return { entity: text, sector: 'Critical Infrastructure' };
}

function parseTargetDateToISO(
  dateText: string,
  milestoneText: string
): { targetDateISO: string; targetTimestampISO: string; dateLabel: string } {
  const dateLabel = stripFormatting(dateText, false);
  const match = /^([A-Za-z]+)\.?\s+(\d{1,2}),\s*(\d{4})$/.exec(dateLabel);
  if (!match) {
    throw new BriefingValidationError(`Unable to parse countdown target date: "${dateLabel}"`);
  }
  const monthKey = match[1].toLowerCase();
  const month = MONTH_MAP[monthKey];
  if (!month) {
    throw new BriefingValidationError(`Unknown month "${match[1]}" in countdown date "${dateLabel}"`);
  }
  const day = match[2].padStart(2, '0');
  const year = match[3];
  const targetDateISO = `${year}-${month}-${day}`;

  // Use 15:00:00Z when 10:00 a.m. ET is explicitly specified, otherwise 22:00:00Z (5:00 p.m. ET)
  const targetTimestampISO = /10:00\s*a\.m\.\s*ET/i.test(milestoneText)
    ? `${targetDateISO}T15:00:00.000Z`
    : `${targetDateISO}T22:00:00.000Z`;

  return { targetDateISO, targetTimestampISO, dateLabel };
}

function inferSourceDomainTag(
  category: string,
  title: string,
  url: string
): PrimarySourceEntry['domainTag'] {
  const hay = `${category} ${title} ${url}`.toLowerCase();
  if (/merck|rakoff|debevoise|insurancejournal|njcourts|privilege|war exclusion/.test(hay)) {
    return 'Legal & Insurance';
  }
  if (/faa|transportation\.gov|l3harris|gao-26-107992|aerocorner|united-airlines|wttw|spoofing|ops\.group/.test(hay)) {
    return 'Aviation & FAA';
  }
  if (/jpmorgan|chase|federalreserve|sec\.gov|dtcc|fsisac|admiralmarkets|bank-outage|schwab/.test(hay)) {
    return 'Financial & Banking';
  }
  if (/mineral|rare-earth|gallium|manufacturersalliance|csis|mlq\.ai|chip-curbs|bis|submarine-cable|91-fr-73480|da-26-1229/.test(hay)) {
    return 'Supply Chain & Minerals';
  }
  if (/cisa|ic3\.gov|psa261013|volt-typhoon|aa24-038a|aa26-097a|optimizely|optimjack|stepsecurity|report-uri|bleepingcomputer|esxi|digicert|tls/.test(hay)) {
    return 'Cyber & OT Advisories';
  }
  if (/bolshevi|kremlin|putin|crimea|dignity|euromaidan|rusi|taiwan|epic-fury|iran-war|soufan|OEF_Q3/i.test(hay)) {
    return 'Geopolitics & Doctrine';
  }
  return 'Outage Telemetry';
}

function parseContentBlocks(rawLines: string[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let idx = 0;

  while (idx < rawLines.length) {
    const line = rawLines[idx];
    const trimmed = line.trim();

    if (!trimmed) {
      idx += 1;
      continue;
    }

    // Table check
    if (trimmed.startsWith('|')) {
      const extracted = extractMarkdownTableAt(rawLines, idx);
      if (extracted) {
        blocks.push({
          type: 'table',
          table: {
            headers: extracted.table.headers,
            rows: extracted.table.rows.map((r) => r.map((c) => cleanMarkdownEscapes(c))),
          },
        });
        idx = extracted.nextIdx;
        continue;
      }
    }

    // Bullet or ordered list check
    const isUnordered = /^[*+-]\s+/.test(trimmed);
    const isOrdered = /^\d+\\?\.\s+/.test(trimmed);
    if (isUnordered || isOrdered) {
      const items: { text: string; sources: SourceLink[] }[] = [];
      const ordered = isOrdered;
      while (idx < rawLines.length) {
        const cur = rawLines[idx].trim();
        if (!cur) break;
        const mUn = /^(\s*)[*+-]\s+(.*)$/.exec(rawLines[idx]);
        const mOrd = /^(\s*)\d+\\?\.\s+(.*)$/.exec(rawLines[idx]);
        const m = mUn ?? mOrd;
        if (!m) break;
        const indentPrefix = m[1].length >= 2 ? '↳ ' : '';
        const itemText = cleanMarkdownEscapes(m[2]);
        items.push({
          text: `${indentPrefix}${itemText}`,
          sources: extractMarkdownLinks(m[2]),
        });
        idx += 1;
      }
      if (items.length > 0) {
        blocks.push({ type: 'list', ordered, items });
        continue;
      }
    }

    // Paragraph line(s)
    blocks.push({
      type: 'paragraph',
      text: cleanMarkdownEscapes(trimmed),
      sources: extractMarkdownLinks(trimmed),
    });
    idx += 1;
  }

  return blocks;
}

export function parseBriefingMarkdown(markdown: string): ParsedBriefingBundle {
  if (!markdown || markdown.trim().length < 500) {
    throw new BriefingValidationError('Executive briefing markdown is empty or truncated.');
  }

  const docHash = crypto.createHash('sha256').update(markdown, 'utf8').digest('hex');
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  // 1. Document Header Metadata
  const h1TitleLine = lines.find((l) => /^#\s+/.test(l.trim())) ?? '';
  const docTitle = stripFormatting(h1TitleLine.replace(/^#\s+/, ''), false);

  const dateLine = lines.find((l) => /^\*\*Date:\*\*/i.test(l.trim())) ?? '';
  const docDate = stripFormatting(dateLine.replace(/^\*\*Date:\*\*/i, ''), false);

  const scopeLine = lines.find((l) => /^\*\*Scope:\*\*/i.test(l.trim())) ?? '';
  const docScope = stripFormatting(scopeLine.replace(/^\*\*Scope:\*\*/i, ''), false);

  // 2. Partition document into structural H1 / H2 blocks
  // Note: Handle trailing `## **6.7 ...**` that appears after `# **10\. Primary Sources...**`
  interface RawH1Section {
    heading: string;
    lines: string[];
  }
  const h1Sections: RawH1Section[] = [];
  let currentH1: RawH1Section | null = null;
  const orphanSubsections: { parentNum: number; heading: string; lines: string[] }[] = [];
  let currentOrphan: { parentNum: number; heading: string; lines: string[] } | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^#\s+/.test(trimmed)) {
      currentOrphan = null;
      currentH1 = {
        heading: stripFormatting(trimmed.replace(/^#\s+/, ''), false),
        lines: [],
      };
      h1Sections.push(currentH1);
      continue;
    }

    // Check if inside Section 10 and encountering a numbered subsection belonging to an earlier section (e.g. ## 6.7)
    if (currentH1 && /^10\.\s*Primary Sources/i.test(currentH1.heading) && /^##\s+/.test(trimmed)) {
      const subClean = stripFormatting(trimmed.replace(/^##\s+/, ''), false);
      const numMatch = /^([1-8])\.(\d+)/.exec(subClean);
      if (numMatch) {
        currentOrphan = {
          parentNum: Number(numMatch[1]),
          heading: subClean,
          lines: [],
        };
        orphanSubsections.push(currentOrphan);
        continue;
      }
    }

    if (currentOrphan) {
      currentOrphan.lines.push(line);
    } else if (currentH1) {
      currentH1.lines.push(line);
    }
  }

  // 3. Parse Executive Summary
  const execSection = h1Sections.find((s) => /^Executive Summary$/i.test(s.heading));
  if (!execSection) {
    throw new BriefingValidationError('Missing "# Executive Summary" section.');
  }

  let execIntro = '';
  const pillars: SummaryPillar[] = [];
  for (const rawLine of execSection.lines) {
    const t = rawLine.trim();
    if (!t) continue;
    if (/^[*+-]\s+/.test(t)) {
      const itemBody = cleanMarkdownEscapes(t.replace(/^[*+-]\s+/, ''));
      const titleMatch = /^\*\*([^*]+?):\*\*\s*(.*)$/.exec(itemBody);
      const pillarIdx = pillars.length + 1;
      if (titleMatch) {
        pillars.push({
          id: `pillar-${pillarIdx}`,
          title: titleMatch[1].trim(),
          body: titleMatch[2].trim(),
          sources: extractMarkdownLinks(t),
        });
      } else {
        pillars.push({
          id: `pillar-${pillarIdx}`,
          title: `Strategic Pillar ${pillarIdx}`,
          body: stripFormatting(itemBody, true),
          sources: extractMarkdownLinks(t),
        });
      }
    } else if (!execIntro) {
      execIntro = stripFormatting(t, false);
    }
  }

  // 4. Parse Executive Risk Matrix (8 rows)
  const riskSection = h1Sections.find((s) => /^Executive Risk Matrix/i.test(s.heading));
  if (!riskSection) {
    throw new BriefingValidationError('Missing "# Executive Risk Matrix" section.');
  }
  const riskTableStart = riskSection.lines.findIndex((l) => l.trim().startsWith('|'));
  if (riskTableStart === -1) {
    throw new BriefingValidationError('Missing Markdown table inside Executive Risk Matrix section.');
  }
  const extractedRiskTable = extractMarkdownTableAt(riskSection.lines, riskTableStart);
  if (!extractedRiskTable) {
    throw new BriefingValidationError('Malformed Markdown table inside Executive Risk Matrix section.');
  }

  const riskMatrixRaw: RiskVector[] = extractedRiskTable.table.rows.map((cells, idx) => {
    if (cells.length < 6) {
      throw new BriefingValidationError(
        `Executive Risk Matrix row ${idx + 1} has ${cells.length} columns; expected 6.`
      );
    }
    const rawDomain = stripFormatting(cells[0], false);
    const numMatch = /^(\d+)\.\s*(.*)$/.exec(rawDomain);
    const id = numMatch ? `#${numMatch[1]}` : `#${idx + 1}`;
    const domain = numMatch ? numMatch[2].trim() : rawDomain;
    const horizon = stripFormatting(cells[1], false);
    const likelihood = stripFormatting(cells[2], false);
    const blastRadius = stripFormatting(cells[3], false);
    const tripwire = stripFormatting(cells[4], false);
    const mitigation = stripFormatting(cells[5], false);
    const sources = extractMarkdownLinks(cells.join(' '));

    return {
      id,
      domain,
      horizon,
      horizonGroup: classifyHorizonGroup(horizon),
      likelihood,
      blastRadius,
      tripwire,
      mitigation,
      sources,
    };
  });

  // 5. Parse Section 8 Structured Tables (Watchlist 8.3, Incident Ledger 8.4, Countdown Cliffs 8.5)
  const sec8 = h1Sections.find((s) => /^8\.\s+/i.test(s.heading));
  if (!sec8) {
    throw new BriefingValidationError('Missing "# 8. Gray-Zone Convergence..." section.');
  }

  function findSubsectionTable(sectionLines: string[], codeRegex: RegExp, label: string): MarkdownTable {
    const headingIdx = sectionLines.findIndex(
      (l) => /^##\s+/.test(l.trim()) && codeRegex.test(stripFormatting(l, false))
    );
    if (headingIdx === -1) {
      throw new BriefingValidationError(`Missing subsection heading for ${label}.`);
    }
    let idx = headingIdx + 1;
    while (idx < sectionLines.length && !/^##\s+/.test(sectionLines[idx].trim())) {
      if (sectionLines[idx].trim().startsWith('|')) {
        const extracted = extractMarkdownTableAt(sectionLines, idx);
        if (extracted) {
          return extracted.table;
        }
      }
      idx += 1;
    }
    throw new BriefingValidationError(`Missing Markdown table under ${label}.`);
  }

  const watchlistTable = findSubsectionTable(sec8.lines, /8\.3\b/, 'Section 8.3 Watchlist');
  const watchlistRaw: WatchlistRow[] = watchlistTable.rows.map((cells, idx) => {
    if (cells.length < 3) {
      throw new BriefingValidationError(
        `Watchlist row ${idx + 1} has ${cells.length} columns; expected 3.`
      );
    }
    const rawSignal = stripFormatting(cells[0], false);
    const numMatch = /^(\d+)\.\s*(.*)$/.exec(rawSignal);
    const id = numMatch ? `#${numMatch[1]}` : `#${idx + 1}`;
    const signal = numMatch ? numMatch[2].trim() : rawSignal;
    const mechanism = stripFormatting(cells[1], false);
    const forensicMeaning = stripFormatting(cells[2], false);
    const sources = extractMarkdownLinks(cells.join(' '));
    return { id, signal, mechanism, forensicMeaning, sources };
  });

  const incidentsTable = findSubsectionTable(sec8.lines, /8\.4\b/, 'Section 8.4 Master Tracked Incident Ledger');
  const incidentsRaw: IncidentRow[] = incidentsTable.rows.map((cells, idx) => {
    if (cells.length < 5) {
      throw new BriefingValidationError(
        `Incident Ledger row ${idx + 1} has ${cells.length} columns; expected 5.`
      );
    }
    const col0 = stripFormatting(cells[0], false);
    const idWindowMatch = /^(#\d+)\s*[—–-]\s*(.*)$/.exec(col0);
    const eventId = idWindowMatch ? idWindowMatch[1] : `#${idx + 1}`;
    const window = idWindowMatch ? idWindowMatch[2].trim() : col0;
    const { entity, sector } = parseEntityAndSector(cells[1]);
    const impact = stripFormatting(cells[2], false);
    const vector = stripFormatting(cells[3], false);
    const status = stripFormatting(cells[4], false);
    const classification = classifyIncident(cells[1], cells[2], cells[3]);
    const sources = extractMarkdownLinks(cells.join(' '));

    return {
      eventId,
      window,
      entity,
      sector,
      classification,
      impact,
      vector,
      status,
      sources,
    };
  });

  const cliffsTable = findSubsectionTable(sec8.lines, /8\.5\b/, 'Section 8.5 Countdown Calendar');
  const countdownCliffsRaw: CountdownCliff[] = cliffsTable.rows.map((cells, idx) => {
    if (cells.length < 3) {
      throw new BriefingValidationError(
        `Countdown Calendar row ${idx + 1} has ${cells.length} columns; expected 3.`
      );
    }
    const milestone = stripFormatting(cells[1], false);
    const actionExposure = stripFormatting(cells[2], false);
    const { targetDateISO, targetTimestampISO, dateLabel } = parseTargetDateToISO(
      cells[0],
      milestone
    );
    return {
      targetDateISO,
      targetTimestampISO,
      dateLabel,
      milestone,
      actionExposure,
    };
  });

  // 6. Parse Narrative Sections 1–8 (STRICTLY OMITTING Section 9)
  const narrativeSections: NarrativeSection[] = [];
  for (let secNum = 1; secNum <= 8; secNum += 1) {
    const rawSec = h1Sections.find((s) => new RegExp(`^${secNum}\\.\\s+`).test(s.heading));
    if (!rawSec) {
      throw new BriefingValidationError(`Missing narrative Section ${secNum}.`);
    }
    const secTitle = rawSec.heading.replace(/^\d+\.\s*/, '').trim();

    const introLines: string[] = [];
    const subsections: Subsection[] = [];
    let activeSub: { heading: string; lines: string[] } | null = null;
    const rawSubs: { heading: string; lines: string[] }[] = [];

    for (const line of rawSec.lines) {
      const t = line.trim();
      if (/^##\s+/.test(t)) {
        activeSub = {
          heading: stripFormatting(t.replace(/^##\s+/, ''), false),
          lines: [],
        };
        rawSubs.push(activeSub);
      } else if (activeSub) {
        activeSub.lines.push(line);
      } else {
        introLines.push(line);
      }
    }

    // Re-attach any orphaned subsections belonging to this section (e.g. ## 6.7)
    for (const orphan of orphanSubsections) {
      if (orphan.parentNum === secNum) {
        rawSubs.push({ heading: orphan.heading, lines: orphan.lines });
      }
    }

    rawSubs.forEach((sub, sIdx) => {
      const m = /^(\d+(?:\.\d+)?)\.?\s*(.*)$/.exec(sub.heading);
      const code = m ? m[1] : `${secNum}.${sIdx + 1}`;
      const title = m && m[2] ? m[2].trim() : sub.heading;
      subsections.push({
        id: `sec-${secNum}-sub-${sIdx + 1}`,
        code,
        title,
        blocks: parseContentBlocks(sub.lines),
      });
    });

    narrativeSections.push({
      id: `section-${secNum}`,
      number: secNum,
      title: secTitle,
      blocks: parseContentBlocks(introLines),
      subsections,
    });
  }

  // 7. Parse Section 10 Primary Sources + Enrich with Any Additional Inline Links
  const sec10 = h1Sections.find((s) => /^10\.\s*Primary Sources/i.test(s.heading));
  if (!sec10) {
    throw new BriefingValidationError('Missing "# 10. Primary Sources & Reference Links" section.');
  }

  const primarySources: PrimarySourceEntry[] = [];
  const seenUrls = new Set<string>();

  for (const rawLine of sec10.lines) {
    const t = rawLine.trim();
    if (!/^[*+-]\s+/.test(t)) continue;
    const body = cleanMarkdownEscapes(t.replace(/^[*+-]\s+/, ''));
    const catMatch = /^\*\*([^*]+?):\*\*\s*(.*)$/.exec(body);
    const category = catMatch ? catMatch[1].trim() : 'Primary Reference';
    const links = extractMarkdownLinks(rawLine);
    for (const link of links) {
      if (seenUrls.has(link.url)) continue;
      seenUrls.add(link.url);
      primarySources.push({
        id: `src-${primarySources.length + 1}`,
        category,
        domainTag: inferSourceDomainTag(category, link.label, link.url),
        title: link.label,
        url: link.url,
      });
    }
  }

  // Capture any inline citation URLs from Sections 1–8 & Executive Summary not already in Section 10
  const publicMarkdownLines = h1Sections
    .filter((s) => !/^9\.\s+/i.test(s.heading))
    .flatMap((s) => s.lines)
    .concat(orphanSubsections.flatMap((o) => o.lines));

  for (const link of extractMarkdownLinks(publicMarkdownLines.join('\n'))) {
    if (seenUrls.has(link.url)) continue;
    seenUrls.add(link.url);
    primarySources.push({
      id: `src-${primarySources.length + 1}`,
      category: 'Inline Briefing Citation',
      domainTag: inferSourceDomainTag('Inline Citation', link.label, link.url),
      title: link.label,
      url: link.url,
    });
  }

  const sectionsCandidate: SectionsData = {
    docTitle,
    docDate,
    docScope,
    executiveSummary: {
      intro: execIntro,
      pillars,
    },
    narrativeSections,
    primarySources,
  };

  // 8. FAIL-SAFE ZOD VALIDATION OF EVERY MODULE BEFORE RETURNING
  const riskCheck = RiskMatrixArraySchema.safeParse(riskMatrixRaw);
  if (!riskCheck.success) {
    throw new BriefingValidationError(
      `Zod validation failed for riskMatrix.json: ${riskCheck.error.message}`,
      riskCheck.error.issues
    );
  }

  const incidentsCheck = IncidentsArraySchema.safeParse(incidentsRaw);
  if (!incidentsCheck.success) {
    throw new BriefingValidationError(
      `Zod validation failed for incidents.json: ${incidentsCheck.error.message}`,
      incidentsCheck.error.issues
    );
  }

  const cliffsCheck = CountdownCliffsArraySchema.safeParse(countdownCliffsRaw);
  if (!cliffsCheck.success) {
    throw new BriefingValidationError(
      `Zod validation failed for countdownCliffs.json: ${cliffsCheck.error.message}`,
      cliffsCheck.error.issues
    );
  }

  const watchlistCheck = WatchlistArraySchema.safeParse(watchlistRaw);
  if (!watchlistCheck.success) {
    throw new BriefingValidationError(
      `Zod validation failed for watchlist.json: ${watchlistCheck.error.message}`,
      watchlistCheck.error.issues
    );
  }

  const sectionsCheck = SectionsDataSchema.safeParse(sectionsCandidate);
  if (!sectionsCheck.success) {
    throw new BriefingValidationError(
      `Zod validation failed for sections.json: ${sectionsCheck.error.message}`,
      sectionsCheck.error.issues
    );
  }

  return {
    docHash,
    riskMatrix: riskCheck.data,
    incidents: incidentsCheck.data,
    countdownCliffs: cliffsCheck.data,
    watchlist: watchlistCheck.data,
    sections: sectionsCheck.data,
  };
}

export function computeChangelogDiff(params: {
  previousIncidents: IncidentRow[] | null;
  previousRiskMatrix: RiskVector[] | null;
  nextBundle: ParsedBriefingBundle;
  syncedAtISO?: string;
}): ChangelogData {
  const syncedAtISO = params.syncedAtISO ?? new Date().toISOString();
  const prevIncMap = new Map(
    (params.previousIncidents ?? []).map((inc) => [inc.eventId, inc])
  );
  const prevRiskMap = new Map(
    (params.previousRiskMatrix ?? []).map((r) => [r.id, r])
  );

  const addedIncidents: ChangelogData['addedIncidents'] = [];
  const updatedStatuses: ChangelogData['updatedStatuses'] = [];

  if (params.previousIncidents && params.previousIncidents.length > 0) {
    for (const inc of params.nextBundle.incidents) {
      const prev = prevIncMap.get(inc.eventId);
      if (!prev) {
        addedIncidents.push({
          eventId: inc.eventId,
          entity: inc.entity,
          window: inc.window,
        });
      } else if (prev.status !== inc.status) {
        updatedStatuses.push({
          eventId: inc.eventId,
          entity: inc.entity,
          previousStatus: prev.status,
          currentStatus: inc.status,
        });
      }
    }
  }

  const riskShifts: ChangelogData['riskShifts'] = [];
  if (params.previousRiskMatrix && params.previousRiskMatrix.length > 0) {
    for (const risk of params.nextBundle.riskMatrix) {
      const prev = prevRiskMap.get(risk.id);
      if (!prev) continue;
      for (const field of ['horizon', 'likelihood', 'blastRadius', 'tripwire'] as const) {
        if (prev[field] !== risk[field]) {
          riskShifts.push({
            id: risk.id,
            domain: risk.domain,
            field,
            previous: prev[field],
            current: risk[field],
          });
        }
      }
    }
  }

  const isInitialSnapshot =
    !params.previousIncidents || params.previousIncidents.length === 0;

  let summary: string;
  if (isInitialSnapshot) {
    summary = `Canonical baseline synchronized (${params.nextBundle.sections.docDate}): 8 risk vectors, ${params.nextBundle.incidents.length} tracked incidents, 9 watchlist indicators, 8 countdown cliffs, and ${params.nextBundle.sections.primarySources.length} verified primary sources.`;
  } else if (
    addedIncidents.length === 0 &&
    updatedStatuses.length === 0 &&
    riskShifts.length === 0
  ) {
    summary = `Verified in sync with canonical Executive Briefing (${params.nextBundle.sections.docDate}) — zero structural deltas since prior snapshot.`;
  } else {
    summary = `Detected ${addedIncidents.length} new incident(s), ${updatedStatuses.length} status update(s), and ${riskShifts.length} risk matrix shift(s).`;
  }

  return ChangelogDataSchema.parse({
    syncedAtISO,
    docHash: params.nextBundle.docHash,
    docDate: params.nextBundle.sections.docDate,
    addedIncidents,
    updatedStatuses,
    riskShifts,
    summary,
  });
}

/**
 * Atomic fail-safe sync: parses & validates markdown first; ONLY writes to outputDir if 100% of schemas pass.
 */
export function syncBriefingToDataDir(markdownPath: string, outputDataDir: string): {
  bundle: ParsedBriefingBundle;
  changelog: ChangelogData;
} {
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  // Parse & strictly validate BEFORE touching outputDataDir
  const bundle = parseBriefingMarkdown(markdown);

  let previousIncidents: IncidentRow[] | null = null;
  let previousRiskMatrix: RiskVector[] | null = null;

  const incidentsFile = path.join(outputDataDir, 'incidents.json');
  const riskFile = path.join(outputDataDir, 'riskMatrix.json');

  if (fs.existsSync(incidentsFile)) {
    try {
      previousIncidents = JSON.parse(fs.readFileSync(incidentsFile, 'utf8')) as IncidentRow[];
    } catch {
      previousIncidents = null;
    }
  }

  if (fs.existsSync(riskFile)) {
    try {
      previousRiskMatrix = JSON.parse(fs.readFileSync(riskFile, 'utf8')) as RiskVector[];
    } catch {
      previousRiskMatrix = null;
    }
  }

  const changelog = computeChangelogDiff({
    previousIncidents,
    previousRiskMatrix,
    nextBundle: bundle,
  });

  fs.mkdirSync(outputDataDir, { recursive: true });

  const writeAtomic = (filename: string, data: unknown) => {
    const dest = path.join(outputDataDir, filename);
    const tmp = `${dest}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    fs.renameSync(tmp, dest);
  };

  writeAtomic('riskMatrix.json', bundle.riskMatrix);
  writeAtomic('incidents.json', bundle.incidents);
  writeAtomic('countdownCliffs.json', bundle.countdownCliffs);
  writeAtomic('watchlist.json', bundle.watchlist);
  writeAtomic('sections.json', bundle.sections);
  writeAtomic('changelog.json', changelog);

  return { bundle, changelog };
}
