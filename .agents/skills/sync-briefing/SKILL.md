---
name: sync-briefing
description: Re-reads the canonical Google Drive Executive Briefing document (1lDZB7DdprC6tbgMtsT69WEmj-AesGcqvyv3RDE1vSXw), updates content/executive_briefing.md verbatim, runs npm run sync:doc and vitest run, commits, and pushes to main. Triggered whenever the user types "sync briefing".
---

# Sync Briefing Skill (`"sync briefing"`)

Execute this workflow whenever the user types **`sync briefing`** or asks to pull the latest edits from the Executive Briefing Google Doc into the live GitHub Pages portal.

## Step-by-Step Procedure

1. **Verify Google Drive & GitHub Auth:**
   ```bash
   /opt/antigravity/plugins/gdrive/skills/gdrive/scripts/gdrive auth status
   gh auth status
   ```

2. **Export Canonical Verbatim Markdown Snapshot:**
   Export Google Doc `1lDZB7DdprC6tbgMtsT69WEmj-AesGcqvyv3RDE1vSXw` directly into `content/executive_briefing.md` without manual edits:
   ```bash
   gdrive readonly export 1lDZB7DdprC6tbgMtsT69WEmj-AesGcqvyv3RDE1vSXw content/executive_briefing.md --format md
   ```

3. **Run Fail-Safe Deterministic Parser & Zod Validator:**
   ```bash
   npm run sync:doc
   ```
   - Confirm `riskMatrix.json`, `incidents.json`, `countdownCliffs.json`, `watchlist.json`, `sections.json` (excluding Section 9), and `changelog.json` validate cleanly.
   - If `npm run sync:doc` exits non-zero due to a mid-edit table discrepancy in the Google Doc, stop and report the exact `zod` validation error to the user without force-overwriting `src/data/*.json`.

4. **Refresh RSS & Run Unit Tests + Static Export Build:**
   ```bash
   npm test
   npm run build
   ```

5. **Commit & Push to Trigger GitHub Pages Deployment:**
   ```bash
   git add content/executive_briefing.md src/data/ public/feed.xml
   git diff --cached --quiet || (git commit -m "chore(briefing): sync canonical Executive Briefing snapshot" && git push origin main)
   ```
