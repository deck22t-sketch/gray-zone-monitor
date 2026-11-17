import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { BriefingValidationError, syncBriefingToDataDir } from './lib/doc-parser';

const DEFAULT_DOC_ID = '1lDZB7DdprC6tbgMtsT69WEmj-AesGcqvyv3RDE1vSXw';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function fetchMarkdownFromGoogleDriveIfConfigured(targetMdPath: string): Promise<boolean> {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!saJson) {
    return false;
  }

  const docId = process.env.GOOGLE_DOC_ID?.trim() || DEFAULT_DOC_ID;
  const creds = JSON.parse(saJson) as ServiceAccountCredentials;
  const tokenUri = creds.token_uri || 'https://oauth2.googleapis.com/token';
  const nowSec = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: tokenUri,
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claimSet}`);
  sign.end();
  const signature = base64UrlEncode(sign.sign(creds.private_key));
  const assertion = `${header}.${claimSet}.${signature}`;

  const tokenResp = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!tokenResp.ok) {
    throw new Error(`Google OAuth token exchange failed with HTTP ${tokenResp.status}`);
  }

  const tokenJson = (await tokenResp.json()) as { access_token: string };
  const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    docId
  )}/export?mimeType=${encodeURIComponent('text/markdown')}`;

  const exportResp = await fetch(exportUrl, {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      'User-Agent': 'GrayZoneRiskMonitor/1.0 (+github-actions)',
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!exportResp.ok) {
    throw new Error(`Google Drive markdown export failed with HTTP ${exportResp.status}`);
  }

  const exportedMarkdown = await exportResp.text();
  if (exportedMarkdown.trim().length < 500) {
    throw new Error('Exported Google Doc markdown appears unexpectedly short; aborting.');
  }

  fs.mkdirSync(path.dirname(targetMdPath), { recursive: true });
  fs.writeFileSync(targetMdPath, exportedMarkdown, 'utf8');
  return true;
}

async function main() {
  const rootDir = process.cwd();
  const mdPath = path.join(rootDir, 'content', 'executive_briefing.md');
  const dataDir = path.join(rootDir, 'src', 'data');

  try {
    const pulledRemote = await fetchMarkdownFromGoogleDriveIfConfigured(mdPath);
    if (pulledRemote) {
      console.log('[sync-doc] Pulled fresh snapshot from Google Drive API -> content/executive_briefing.md');
    } else {
      console.log('[sync-doc] Parsing canonical local snapshot: content/executive_briefing.md');
    }

    if (!fs.existsSync(mdPath)) {
      console.error(`[sync-doc] ERROR: Missing canonical snapshot at ${mdPath}`);
      process.exit(1);
    }

    const { bundle, changelog } = syncBriefingToDataDir(mdPath, dataDir);
    console.log(
      `[sync-doc] SUCCESS — Validated & wrote src/data/*.json:` +
        ` riskMatrix=${bundle.riskMatrix.length},` +
        ` incidents=${bundle.incidents.length},` +
        ` watchlist=${bundle.watchlist.length},` +
        ` countdownCliffs=${bundle.countdownCliffs.length},` +
        ` narrativeSections=${bundle.sections.narrativeSections.length} (Section 9 excluded),` +
        ` primarySources=${bundle.sections.primarySources.length}`
    );
    console.log(`[sync-doc] Changelog: ${changelog.summary}`);
  } catch (err) {
    if (err instanceof BriefingValidationError) {
      console.error(`[sync-doc] FAIL-SAFE ABORT — Zod/Structure Validation Error: ${err.message}`);
      if (err.issues) {
        console.error(JSON.stringify(err.issues, null, 2));
      }
    } else {
      console.error('[sync-doc] FAIL-SAFE ABORT — Unexpected Error:', err);
    }
    console.error('[sync-doc] Existing src/data/*.json modules were left untouched.');
    process.exit(1);
  }
}

main();
