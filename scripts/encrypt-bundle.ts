import fs from 'node:fs';
import path from 'node:path';
import {
  encryptBundleWithPasscode,
  FullBriefingDataBundle,
  PBKDF2_ITERATIONS,
} from '../src/lib/vault-crypto';
import { VaultMeta } from '../src/types/schemas';

const DATA_FILES = [
  'riskMatrix.json',
  'incidents.json',
  'countdownCliffs.json',
  'watchlist.json',
  'sections.json',
  'changelog.json',
  'liveSignals.json',
  'feedHealth.json',
] as const;

function buildRedactedStubs(nowISO: string): FullBriefingDataBundle {
  return {
    riskMatrix: [],
    incidents: [],
    countdownCliffs: [],
    watchlist: [],
    sections: {
      docTitle: 'Encrypted Intelligence Briefing Vault',
      docDate: 'Restricted',
      docScope: 'Unlock with SITE_PASSCODE to decrypt AES-256-GCM payload in browser.',
      executiveSummary: {
        intro: 'Restricted payload encrypted via PBKDF2-SHA256 + AES-256-GCM.',
        pillars: [],
      },
      narrativeSections: [],
      primarySources: [],
    },
    changelog: {
      syncedAtISO: nowISO,
      docHash: 'encrypted-aes-256-gcm',
      docDate: 'Restricted',
      addedIncidents: [],
      updatedStatuses: [],
      riskShifts: [],
      summary: 'Vault locked — client-side AES-256-GCM decryption required.',
    },
    liveSignals: {
      ingestedAtISO: nowISO,
      ingestionMode: 'ZERO_KEY_PUBLIC_FEEDS',
      totalSignals: 0,
      signals: [],
    },
    feedHealth: {
      checkedAtISO: nowISO,
      liveCount: 0,
      totalFeeds: 8,
      feeds: [],
    },
  };
}

async function main() {
  const rootDir = process.cwd();
  const dataDir = path.join(rootDir, 'src', 'data');
  const backupDir = path.join(rootDir, '.vault-backup');
  const vaultMetaPath = path.join(dataDir, 'vaultMeta.json');

  const isRestore = process.argv.includes('--restore-if-needed');
  if (isRestore) {
    if (fs.existsSync(backupDir)) {
      for (const file of DATA_FILES) {
        const src = path.join(backupDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(dataDir, file));
        }
      }
      fs.rmSync(backupDir, { recursive: true, force: true });
      const publicMeta: VaultMeta = {
        encrypted: false,
        algorithm: 'AES-256-GCM',
        kdf: 'PBKDF2-SHA256',
        iterations: PBKDF2_ITERATIONS,
        generatedAtISO: new Date().toISOString(),
      };
      fs.writeFileSync(vaultMetaPath, `${JSON.stringify(publicMeta, null, 2)}\n`, 'utf8');
      console.log('[encrypt-bundle] Restored plaintext working files after encrypted static export.');
    }
    return;
  }

  const rawPasscode = process.env.SITE_PASSCODE?.trim() || 'PUBLIC';
  if (rawPasscode === 'PUBLIC') {
    const publicMeta: VaultMeta = {
      encrypted: false,
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: PBKDF2_ITERATIONS,
      generatedAtISO: new Date().toISOString(),
    };
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(vaultMetaPath, `${JSON.stringify(publicMeta, null, 2)}\n`, 'utf8');
    console.log('[encrypt-bundle] SITE_PASSCODE=PUBLIC — rendering directly in zero-friction public mode.');
    return;
  }

  // SITE_PASSCODE is set to a secret passphrase -> encrypt all src/data/*.json via PBKDF2 + AES-GCM
  const readJson = <T>(filename: string): T =>
    JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8')) as T;

  const fullBundle: FullBriefingDataBundle = {
    riskMatrix: readJson('riskMatrix.json'),
    incidents: readJson('incidents.json'),
    countdownCliffs: readJson('countdownCliffs.json'),
    watchlist: readJson('watchlist.json'),
    sections: readJson('sections.json'),
    changelog: readJson('changelog.json'),
    liveSignals: readJson('liveSignals.json'),
    feedHealth: readJson('feedHealth.json'),
  };

  fs.mkdirSync(backupDir, { recursive: true });
  for (const file of DATA_FILES) {
    fs.copyFileSync(path.join(dataDir, file), path.join(backupDir, file));
  }

  const encryptedVaultMeta = await encryptBundleWithPasscode(fullBundle, rawPasscode);
  fs.writeFileSync(vaultMetaPath, `${JSON.stringify(encryptedVaultMeta, null, 2)}\n`, 'utf8');

  // Redact plaintext src/data/*.json during build so static Next.js chunks contain zero plaintext
  const nowISO = new Date().toISOString();
  const stubs = buildRedactedStubs(nowISO);
  fs.writeFileSync(path.join(dataDir, 'riskMatrix.json'), `${JSON.stringify(stubs.riskMatrix, null, 2)}\n`);
  fs.writeFileSync(path.join(dataDir, 'incidents.json'), `${JSON.stringify(stubs.incidents, null, 2)}\n`);
  fs.writeFileSync(
    path.join(dataDir, 'countdownCliffs.json'),
    `${JSON.stringify(stubs.countdownCliffs, null, 2)}\n`
  );
  fs.writeFileSync(path.join(dataDir, 'watchlist.json'), `${JSON.stringify(stubs.watchlist, null, 2)}\n`);
  fs.writeFileSync(path.join(dataDir, 'sections.json'), `${JSON.stringify(stubs.sections, null, 2)}\n`);
  fs.writeFileSync(path.join(dataDir, 'changelog.json'), `${JSON.stringify(stubs.changelog, null, 2)}\n`);
  fs.writeFileSync(path.join(dataDir, 'liveSignals.json'), `${JSON.stringify(stubs.liveSignals, null, 2)}\n`);
  fs.writeFileSync(path.join(dataDir, 'feedHealth.json'), `${JSON.stringify(stubs.feedHealth, null, 2)}\n`);

  console.log(
    `[encrypt-bundle] Encrypted src/data/*.json with PBKDF2-SHA256 (${PBKDF2_ITERATIONS} iter) + AES-256-GCM.`
  );
}

main();
