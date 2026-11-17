# AGENTS.md — Gray-Zone & Critical Infrastructure Risk Monitor

## Canonical Editorial Source of Truth
- **Google Doc:** `Geopolitical Strategy, Gray-Zone Warfare & Critical Infrastructure Risk: Executive Briefing`
- **Google Doc ID:** `1lDZB7DdprC6tbgMtsT69WEmj-AesGcqvyv3RDE1vSXw`
- **Local Verbatim Snapshot:** `content/executive_briefing.md`

## Two-Word Sync Command: `"sync briefing"`
Whenever the user types **`sync briefing`** (or asks to sync/refresh the briefing from Google Drive):
1. Follow `.agents/skills/sync-briefing/SKILL.md`:
   - Export Google Doc `1lDZB7DdprC6tbgMtsT69WEmj-AesGcqvyv3RDE1vSXw` verbatim as Markdown to `content/executive_briefing.md` (`gdrive readonly export 1lDZB7DdprC6tbgMtsT69WEmj-AesGcqvyv3RDE1vSXw content/executive_briefing.md --format md`).
   - Run `npm run sync:doc` to deterministically parse and `zod`-validate `src/data/{riskMatrix,incidents,countdownCliffs,watchlist,sections,changelog}.json` (fail-safe aborts on malformed tables).
   - Run `npx vitest run` and `npm run build` to verify zero regressions.
   - Commit updated `content/executive_briefing.md` and `src/data/*.json` and push to `origin main` to trigger GitHub Pages deployment.

## Architecture Guardrails
- **Strict Canonical Isolation:** `scripts/ingest-signals.ts` writes ONLY to `src/data/liveSignals.json` and `src/data/feedHealth.json`. Never auto-mutate canonical `src/data/incidents.json`.
- **Public Attribution Compliance:** FAA NAS Status telemetry must always be attributed strictly in plain text as `"Source: FAA NAS Status (nasstatus.faa.gov)"` plus `Update_Time`. Never render FAA or U.S. DOT logos/seals.
- **Section 9 Exclusion:** Section 9 of the Google Doc (internal Antigravity build spec) is excluded from public `src/data/sections.json` pages.
- **Secrets Discipline:** `SITE_PASSCODE` (if changed from `PUBLIC`) and optional `GEMINI_API_KEY` must ONLY live in GitHub Actions Secrets (`gh secret set ...`) and must NEVER be committed to Git.
