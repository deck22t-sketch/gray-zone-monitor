import {
  ChangelogData,
  CountdownCliff,
  FeedHealthData,
  IncidentRow,
  LiveSignalsData,
  RiskVector,
  SectionsData,
  VaultMeta,
  WatchlistRow,
} from '@/types/schemas';

export interface FullBriefingDataBundle {
  riskMatrix: RiskVector[];
  incidents: IncidentRow[];
  countdownCliffs: CountdownCliff[];
  watchlist: WatchlistRow[];
  sections: SectionsData;
  changelog: ChangelogData;
  liveSignals: LiveSignalsData;
  feedHealth: FeedHealthData;
}

export const PBKDF2_ITERATIONS = 210_000;

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function deriveAesGcmKey(
  passcode: string,
  salt: Uint8Array,
  iterations: number,
  usage: KeyUsage[]
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  );
}

export async function encryptBundleWithPasscode(
  bundle: FullBriefingDataBundle,
  passcode: string
): Promise<VaultMeta> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesGcmKey(passcode, salt, PBKDF2_ITERATIONS, ['encrypt']);

  const plaintextBytes = new TextEncoder().encode(JSON.stringify(bundle));
  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintextBytes
  );

  return {
    encrypted: true,
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    saltBase64: bytesToBase64(salt),
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(encryptedBuffer)),
    generatedAtISO: new Date().toISOString(),
  };
}

export async function decryptBundleWithPasscode(
  vaultMeta: VaultMeta,
  passcode: string
): Promise<FullBriefingDataBundle> {
  if (
    !vaultMeta.encrypted ||
    !vaultMeta.saltBase64 ||
    !vaultMeta.ivBase64 ||
    !vaultMeta.ciphertextBase64
  ) {
    throw new Error('Vault metadata does not contain an encrypted payload.');
  }

  const salt = base64ToBytes(vaultMeta.saltBase64);
  const iv = base64ToBytes(vaultMeta.ivBase64);
  const ciphertext = base64ToBytes(vaultMeta.ciphertextBase64);
  const key = await deriveAesGcmKey(passcode, salt, vaultMeta.iterations, ['decrypt']);

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  const jsonText = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(jsonText) as FullBriefingDataBundle;
}
