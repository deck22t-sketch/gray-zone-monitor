import fs from 'node:fs';
import path from 'node:path';

export function resolvePwaBasePath(env: NodeJS.ProcessEnv = process.env): string {
  if (env.NEXT_PUBLIC_BASE_PATH !== undefined) {
    return env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '');
  }
  if (env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY) {
    const repo = env.GITHUB_REPOSITORY.split('/')[1] || '';
    if (repo && !repo.endsWith('.github.io')) {
      return `/${repo}`;
    }
  }
  return '';
}

export function buildPwaArtifacts(basePath: string, cacheVersion: string) {
  const normalizedBase = basePath ? basePath.replace(/\/$/, '') : '';
  const rootUrl = `${normalizedBase}/`;

  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="108" fill="#0A0E17"/>
  <rect x="28" y="28" width="456" height="456" rx="84" stroke="#38BDF8" stroke-opacity="0.28" stroke-width="6"/>
  <circle cx="256" cy="256" r="144" stroke="#38BDF8" stroke-opacity="0.45" stroke-width="8"/>
  <circle cx="256" cy="256" r="84" stroke="#F59E0B" stroke-opacity="0.55" stroke-width="6" stroke-dasharray="18 12"/>
  <path d="M256 76V148M256 364V436M76 256H148M364 256H436" stroke="#38BDF8" stroke-width="10" stroke-linecap="round"/>
  <rect x="232" y="232" width="48" height="48" rx="10" fill="#EF4444"/>
</svg>
`;

  const manifestObj = {
    name: 'Gray-Zone & Infrastructure Monitor',
    short_name: 'Risk Monitor',
    description:
      'Private executive risk synthesis & public backbone telemetry monitor. Shared passphrase required.',
    start_url: rootUrl,
    scope: rootUrl,
    display: 'standalone',
    orientation: 'any',
    background_color: '#0A0E17',
    theme_color: '#0A0E17',
    icons: [
      {
        src: `${normalizedBase}/icon.svg`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };

  const preCacheRoutes = [
    rootUrl,
    `${normalizedBase}/geopolitics/`,
    `${normalizedBase}/incidents/`,
    `${normalizedBase}/contagion/`,
    `${normalizedBase}/watchlist/`,
    `${normalizedBase}/manifest.webmanifest`,
    `${normalizedBase}/icon.svg`,
  ];

  const swJs = `/* Gray-Zone Monitor Offline Service Worker (Encrypted-Safe Shell Cache) */
const CACHE_NAME = 'gz-monitor-shell-${cacheVersion}';
const PRECACHE_URLS = ${JSON.stringify(preCacheRoutes, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('gz-monitor-shell-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first with cached shell fallback for flight / dead-zone mode
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('${rootUrl}')))
    );
    return;
  }

  // Static JS/CSS/images: stale-while-revalidate
  if (
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/images/') ||
    url.pathname.endsWith('/icon.svg') ||
    url.pathname.endsWith('/manifest.webmanifest')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
`;

  const robotsTxt = `User-agent: *
Disallow: /
`;

  return {
    iconSvg,
    manifestJson: `${JSON.stringify(manifestObj, null, 2)}\n`,
    swJs,
    robotsTxt,
  };
}

function main() {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const changelogPath = path.join(rootDir, 'src', 'data', 'changelog.json');

  let docHashPrefix = 'v1';
  if (fs.existsSync(changelogPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(changelogPath, 'utf8')) as { docHash?: string };
      if (parsed.docHash) {
        docHashPrefix = parsed.docHash.slice(0, 10);
      }
    } catch {
      docHashPrefix = 'v1';
    }
  }

  const basePath = resolvePwaBasePath(process.env);
  const { iconSvg, manifestJson, swJs, robotsTxt } = buildPwaArtifacts(
    basePath,
    docHashPrefix
  );

  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'manifest.webmanifest'), manifestJson, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sw.js'), swJs, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

  console.log(
    `[generate-pwa] Wrote manifest.webmanifest, sw.js, icon.svg & robots.txt (scope="${basePath || ''}/", cache=${docHashPrefix}).`
  );
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]).endsWith('generate-pwa.ts');
if (isDirectRun) {
  main();
}
