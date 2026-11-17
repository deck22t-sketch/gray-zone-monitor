# Gray-Zone & Critical Infrastructure Risk Monitor

Live, continuously updating static Next.js 15 intelligence portal combining canonical executive geopolitical/forensic analysis with **100% keyless federal and backbone OSINT collection**.

## Key Capabilities
- **Canonical Google Doc Sync (`npm run sync:doc`):** Deterministic Markdown-to-JSON compiler with strict `zod` fail-safe validation (`riskMatrix.json`, `incidents.json`, `countdownCliffs.json`, `watchlist.json`, `sections.json`, `changelog.json`), automatically omitting internal build Section 9 from public pages.
- **Zero-Key Public OSINT Collector (`npm run ingest:signals`):** Sweeps 8 keyless federal & backbone endpoints (`Promise.allSettled`, 15s timeouts, explicit `User-Agent`):
  1. CISA Known Exploited Vulnerabilities (KEV) Catalog (JSON)
  2. CISA Cybersecurity & ICS Advisories (RSS XML)
  3. FAA National Airspace System (NAS) Status (XML iterating all `<Delay_type>` blocks + JSON enrichment)
  4. U.S. Federal Register REST API v1 (BIS, FAA, FCC, SEC, OCC, DHS/CISA)
  5. Cloudflare Status API v2
  6. GitHub Status API v2
  7. AWS Service Health Dashboard RSS
  8. Apple System Status (JSONP/JSON)
- **Dormant Gemini Search-Grounding Hook:** Automatically activates `@google/genai` (`gemini-2.5-flash` + `googleSearch`) if `GEMINI_API_KEY` is added to GitHub Actions Secrets; runs silently with zero warnings when unset.
- **Optional Client-Side AES-256-GCM Vault (`scripts/encrypt-bundle.ts`):** Defaults to `SITE_PASSCODE=PUBLIC` (zero friction). Setting `gh secret set SITE_PASSCODE` encrypts `src/data/*.json` via Web Crypto PBKDF2-SHA256 + AES-256-GCM at build time.

## Quick Commands
```bash
npm run sync:doc        # Parse & Zod-validate content/executive_briefing.md -> src/data/*.json
npm run ingest:signals  # Sweep all 8 keyless federal & backbone OSINT feeds
npm test                # Execute Vitest suite
npm run build           # Export static site to out/
```

In any connected Antigravity Remote Conversation, type **`sync briefing`** to re-export the attached Google Doc, validate, test, commit, and deploy.
