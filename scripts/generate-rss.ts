import fs from 'node:fs';
import path from 'node:path';
import { IncidentRow, LiveSignalsData } from '../src/types/schemas';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    if (owner && repo) {
      return repo.endsWith('.github.io')
        ? `https://${owner}.github.io`
        : `https://${owner}.github.io/${repo}`;
    }
  }
  return 'https://deck22t-sketch.github.io/gray-zone-monitor';
}

function main() {
  const rootDir = process.cwd();
  const dataDir = path.join(rootDir, 'src', 'data');
  const outPath = path.join(rootDir, 'public', 'feed.xml');
  const siteUrl = resolveSiteUrl();
  const nowRfc = new Date().toUTCString();

  const passcode = process.env.SITE_PASSCODE?.trim() || 'PUBLIC';
  if (passcode !== 'PUBLIC') {
    const lockedRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Gray-Zone &amp; Critical Infrastructure Risk Monitor (Encrypted Vault)</title>
    <link>${escapeXml(siteUrl)}/</link>
    <description>Client-side AES-256-GCM vault active. Authenticate in portal to view intelligence feed.</description>
    <lastBuildDate>${escapeXml(nowRfc)}</lastBuildDate>
  </channel>
</rss>
`;
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, lockedRss, 'utf8');
    console.log('[generate-rss] Wrote redacted public/feed.xml for encrypted SITE_PASSCODE build.');
    return;
  }

  const incidents = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'incidents.json'), 'utf8')
  ) as IncidentRow[];
  const liveSignals = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'liveSignals.json'), 'utf8')
  ) as LiveSignalsData;

  const incidentItems = incidents.map((inc) => {
    const primaryLink = inc.sources[0]?.url || `${siteUrl}/incidents/`;
    return `    <item>
      <title>${escapeXml(`[Tracked ${inc.eventId}] ${inc.entity} (${inc.sector})`)}</title>
      <link>${escapeXml(primaryLink)}</link>
      <guid isPermaLink="false">${escapeXml(`grayzone-incident-${inc.eventId.replace('#', '')}`)}</guid>
      <pubDate>${escapeXml(nowRfc)}</pubDate>
      <category>${escapeXml(inc.classification)}</category>
      <description>${escapeXml(`${inc.window} — Impact: ${inc.impact} | Vector: ${inc.vector} | Status: ${inc.status}`)}</description>
    </item>`;
  });

  const liveItems = liveSignals.signals.slice(0, 25).map((sig) => {
    const pubDate = !Number.isNaN(Date.parse(sig.publishedAtISO))
      ? new Date(Date.parse(sig.publishedAtISO)).toUTCString()
      : nowRfc;
    return `    <item>
      <title>${escapeXml(`[Live OSINT · ${sig.severity.toUpperCase()}] ${sig.title}`)}</title>
      <link>${escapeXml(sig.url)}</link>
      <guid isPermaLink="false">${escapeXml(`grayzone-signal-${sig.id}`)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <category>${escapeXml(sig.sourceName)}</category>
      <description>${escapeXml(`${sig.summary} (${sig.attributionText})`)}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Gray-Zone &amp; Critical Infrastructure Risk Monitor</title>
    <link>${escapeXml(siteUrl)}/</link>
    <atom:link href="${escapeXml(siteUrl)}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Executive Briefing &amp; Keyless Federal/Backbone OSINT Telemetry (CISA, FAA NAS, Federal Register, Cloud Status)</description>
    <language>en-us</language>
    <lastBuildDate>${escapeXml(nowRfc)}</lastBuildDate>
${[...incidentItems, ...liveItems].join('\n')}
  </channel>
</rss>
`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(
    `[generate-rss] Wrote public/feed.xml (${incidentItems.length} tracked incidents + ${liveItems.length} live OSINT signals).`
  );
}

main();
