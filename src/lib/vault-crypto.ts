import {
  ChangelogData,
  CountdownCliff,
  FeedHealthData,
  FeedHistoryData,
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
  feedHistory?: FeedHistoryData;
}

export const PBKDF2_ITERATIONS = 210_000;
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const IDB_DB_NAME = 'gz_vault_device_v1';
const IDB_STORE_NAME = 'device_keys';
const IDB_RECORD_ID = 'active_vault_grant';
const SESSION_GRANT_KEY = 'gz_vault_session_grant_v1';

/**
 * Normalizes a shared passphrase so mobile auto-capitalization, leading/trailing spaces,
 * or spaces typed in place of hyphens resolve deterministically to the same key material.
 */
export function normalizePassphrase(passcode: string): string {
  return passcode.trim().toLowerCase().replace(/\s+/g, '-');
}

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
  const normalized = normalizePassphrase(passcode);
  const enc = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(normalized),
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

interface StoredDeviceGrant {
  id: string;
  deviceKey: CryptoKey;
  ivBase64: string;
  wrappedTokenBase64: string;
  expiresAtMs: number;
}

function openDeviceGrantDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

/**
 * Persists a 30-day device grant using a non-extractable Web Crypto AES-256-GCM key in IndexedDB
 * (or tab-only sessionStorage when rememberDevice is false). Plaintext briefing JSON is never written to disk.
 */
export async function persistVaultGrant(
  passcode: string,
  rememberDeviceFor30Days: boolean
): Promise<void> {
  const normalized = normalizePassphrase(passcode);

  // Always keep tab-scoped fallback for current session
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(
        SESSION_GRANT_KEY,
        JSON.stringify({ token: normalized, expiresAtMs: Date.now() + 12 * 3600 * 1000 })
      );
    }
  } catch {
    // Ignore storage errors
  }

  if (!rememberDeviceFor30Days) {
    await clearDeviceGrantOnly();
    return;
  }

  try {
    const deviceKey = await globalThis.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(normalized);
    const wrapped = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      deviceKey,
      encoded
    );

    const record: StoredDeviceGrant = {
      id: IDB_RECORD_ID,
      deviceKey,
      ivBase64: bytesToBase64(iv),
      wrappedTokenBase64: bytesToBase64(new Uint8Array(wrapped)),
      expiresAtMs: Date.now() + THIRTY_DAYS_MS,
    };

    const db = await openDeviceGrantDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // IndexedDB blocked in strict private mode; sessionStorage fallback remains active for current tab
  }
}

export async function restorePersistedPassphrase(): Promise<string | null> {
  // 1. Check 30-day non-extractable IndexedDB grant first
  try {
    const db = await openDeviceGrantDb();
    const record = await new Promise<StoredDeviceGrant | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const req = tx.objectStore(IDB_STORE_NAME).get(IDB_RECORD_ID);
      req.onsuccess = () => resolve(req.result as StoredDeviceGrant | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();

    if (record) {
      if (Date.now() > record.expiresAtMs) {
        await clearVaultGrants();
        return null;
      }
      const iv = base64ToBytes(record.ivBase64);
      const wrapped = base64ToBytes(record.wrappedTokenBase64);
      const unwrapped = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        record.deviceKey,
        wrapped as BufferSource
      );
      return new TextDecoder().decode(unwrapped);
    }
  } catch {
    // Fall through to tab session check
  }

  // 2. Check current-tab sessionStorage grant
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(SESSION_GRANT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { token?: string; expiresAtMs?: number };
        if (parsed.token && (!parsed.expiresAtMs || Date.now() < parsed.expiresAtMs)) {
          return parsed.token;
        }
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

async function clearDeviceGrantOnly(): Promise<void> {
  try {
    const db = await openDeviceGrantDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).delete(IDB_RECORD_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore
  }
}

export async function clearVaultGrants(): Promise<void> {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_GRANT_KEY);
      sessionStorage.removeItem('gz_decrypted_bundle_v1');
    }
  } catch {
    // Ignore
  }
  await clearDeviceGrantOnly();
}
