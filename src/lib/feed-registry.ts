import { FeedId } from '@/types/schemas';

export type FeedDomainGroup =
  | 'cyber'
  | 'geophysical'
  | 'regulatory'
  | 'hyperscaler';

export interface FeedRegistryEntry {
  id: FeedId;
  name: string;
  shortLabel: string;
  domainGroup: FeedDomainGroup;
  sectorBadge: 'U.S. Gov' | 'Hyperscaler' | 'Edge / Identity';
  endpoint: string;
  browserSweepUrl?: string;
}

export const FEED_DOMAIN_GROUPS: Array<{
  id: FeedDomainGroup;
  label: string;
  shortLabel: string;
}> = [
  { id: 'cyber', label: 'Federal Cyber & Vulns', shortLabel: 'Cyber & CVEs' },
  { id: 'geophysical', label: 'Aviation, Subsea & GNSS', shortLabel: 'Aviation / Subsea / GNSS' },
  { id: 'regulatory', label: 'Sanctions, Maritime & Regs', shortLabel: 'Regs & Sanctions' },
  { id: 'hyperscaler', label: 'Hyperscalers, Edge & SSO', shortLabel: 'Hyperscalers & Edge' },
];

export const FEED_REGISTRY: FeedRegistryEntry[] = [
  {
    id: 'cisa-kev',
    name: 'CISA KEV Catalog',
    shortLabel: 'CISA KEV',
    domainGroup: 'cyber',
    sectorBadge: 'U.S. Gov',
    endpoint: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
  },
  {
    id: 'cisa-advisories',
    name: 'CISA Cybersecurity Advisories',
    shortLabel: 'CISA ICS/Adv',
    domainGroup: 'cyber',
    sectorBadge: 'U.S. Gov',
    endpoint: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
  },
  {
    id: 'nist-nvd',
    name: 'NIST NVD Critical CVEs',
    shortLabel: 'NIST NVD 9.0+',
    domainGroup: 'cyber',
    sectorBadge: 'U.S. Gov',
    endpoint: 'https://services.nvd.nist.gov/rest/json/cves/2.0?cvssV3Severity=CRITICAL&resultsPerPage=25',
    browserSweepUrl: 'DYNAMIC_NVD_WINDOW',
  },
  {
    id: 'faa-nas',
    name: 'FAA NAS Status',
    shortLabel: 'FAA NAS',
    domainGroup: 'geophysical',
    sectorBadge: 'U.S. Gov',
    endpoint: 'https://nasstatus.faa.gov/api/airport-status-information',
  },
  {
    id: 'usgs-seismic',
    name: 'USGS Subsea Chokepoint Seismic',
    shortLabel: 'USGS Subsea M5+',
    domainGroup: 'geophysical',
    sectorBadge: 'U.S. Gov',
    endpoint:
      'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5.0&orderby=time&limit=40',
    browserSweepUrl:
      'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5.0&orderby=time&limit=40',
  },
  {
    id: 'noaa-swpc',
    name: 'NOAA SWPC Space Weather & GNSS',
    shortLabel: 'NOAA SWPC GNSS',
    domainGroup: 'geophysical',
    sectorBadge: 'U.S. Gov',
    endpoint: 'https://services.swpc.noaa.gov/products/alerts.json',
    browserSweepUrl: 'https://services.swpc.noaa.gov/products/alerts.json',
  },
  {
    id: 'federal-register',
    name: 'U.S. Federal Register',
    shortLabel: 'Fed. Register',
    domainGroup: 'regulatory',
    sectorBadge: 'U.S. Gov',
    endpoint: 'https://www.federalregister.gov/api/v1/documents.json?per_page=25&order=newest',
    browserSweepUrl:
      'https://www.federalregister.gov/api/v1/documents.json?per_page=20&order=newest' +
      '&conditions%5Bagencies%5D%5B%5D=industry-and-security-bureau' +
      '&conditions%5Bagencies%5D%5B%5D=federal-aviation-administration' +
      '&conditions%5Bagencies%5D%5B%5D=federal-communications-commission' +
      '&conditions%5Bagencies%5D%5B%5D=securities-and-exchange-commission' +
      '&conditions%5Bagencies%5D%5B%5D=comptroller-of-the-currency',
  },
  {
    id: 'ofac-marad-doe',
    name: 'OFAC, MARAD & DOE Directives',
    shortLabel: 'OFAC / MARAD / DOE',
    domainGroup: 'regulatory',
    sectorBadge: 'U.S. Gov',
    endpoint:
      'https://www.federalregister.gov/api/v1/documents.json?per_page=20&order=newest' +
      '&conditions%5Bagencies%5D%5B%5D=foreign-assets-control-office' +
      '&conditions%5Bagencies%5D%5B%5D=maritime-administration' +
      '&conditions%5Bagencies%5D%5B%5D=energy-department' +
      '&conditions%5Bagencies%5D%5B%5D=federal-energy-regulatory-commission',
    browserSweepUrl:
      'https://www.federalregister.gov/api/v1/documents.json?per_page=20&order=newest' +
      '&conditions%5Bagencies%5D%5B%5D=foreign-assets-control-office' +
      '&conditions%5Bagencies%5D%5B%5D=maritime-administration' +
      '&conditions%5Bagencies%5D%5B%5D=energy-department' +
      '&conditions%5Bagencies%5D%5B%5D=federal-energy-regulatory-commission',
  },
  {
    id: 'aws-status',
    name: 'AWS Service Health',
    shortLabel: 'AWS',
    domainGroup: 'hyperscaler',
    sectorBadge: 'Hyperscaler',
    endpoint: 'https://status.aws.amazon.com/rss/all.rss',
  },
  {
    id: 'gcp-status',
    name: 'Google Cloud Service Health',
    shortLabel: 'Google Cloud',
    domainGroup: 'hyperscaler',
    sectorBadge: 'Hyperscaler',
    endpoint: 'https://status.cloud.google.com/incidents.json',
    browserSweepUrl: 'https://status.cloud.google.com/incidents.json',
  },
  {
    id: 'azure-status',
    name: 'Microsoft Azure & Entra ID',
    shortLabel: 'Microsoft Azure',
    domainGroup: 'hyperscaler',
    sectorBadge: 'Hyperscaler',
    endpoint: 'https://rssfeed.azure.status.microsoft/en-us/status/feed/',
  },
  {
    id: 'oci-status',
    name: 'Oracle Cloud (OCI) Status',
    shortLabel: 'Oracle Cloud',
    domainGroup: 'hyperscaler',
    sectorBadge: 'Hyperscaler',
    endpoint: 'https://ocistatus.oraclecloud.com/api/v2/incident-summary.rss',
    browserSweepUrl: 'https://ocistatus.oraclecloud.com/api/v2/components.json',
  },
  {
    id: 'cloudflare-status',
    name: 'Cloudflare Status',
    shortLabel: 'Cloudflare',
    domainGroup: 'hyperscaler',
    sectorBadge: 'Edge / Identity',
    endpoint: 'https://www.cloudflarestatus.com/api/v2/incidents.json',
    browserSweepUrl: 'https://www.cloudflarestatus.com/api/v2/incidents.json',
  },
  {
    id: 'github-status',
    name: 'GitHub Status',
    shortLabel: 'GitHub',
    domainGroup: 'hyperscaler',
    sectorBadge: 'Edge / Identity',
    endpoint: 'https://www.githubstatus.com/api/v2/incidents.json',
    browserSweepUrl: 'https://www.githubstatus.com/api/v2/incidents.json',
  },
  {
    id: 'apple-status',
    name: 'Apple System Status',
    shortLabel: 'Apple SSO/Cloud',
    domainGroup: 'hyperscaler',
    sectorBadge: 'Edge / Identity',
    endpoint: 'https://www.apple.com/support/systemstatus/data/system_status_en_US.js',
  },
];

export const ALL_FEED_IDS: FeedId[] = FEED_REGISTRY.map((f) => f.id);

export const FEED_META_BY_ID: Record<FeedId, FeedRegistryEntry> = Object.fromEntries(
  FEED_REGISTRY.map((f) => [f.id, f])
) as Record<FeedId, FeedRegistryEntry>;

export function buildNistNvdWindowUrl(now = new Date(), daysBack = 14): string {
  const end = new Date(now.getTime());
  const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace('Z', '%2B00:00');
  return (
    `https://services.nvd.nist.gov/rest/json/cves/2.0` +
    `?pubStartDate=${fmt(start)}&pubEndDate=${fmt(end)}` +
    `&cvssV3Severity=CRITICAL&resultsPerPage=40`
  );
}
