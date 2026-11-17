'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

export function VaultGate({ children }: { children: React.ReactNode }) {
  const { isLocked, unlockWithPasscode, vaultMeta } = usePortal();
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLocked) {
    return <>{children}</>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await unlockWithPasscode(passcode.trim());
    } catch {
      setError('Invalid passphrase — AES-256-GCM authentication tag verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0E17]">
      <div className="glass-panel max-w-md w-full rounded-xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-[#38BDF8]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-mono-tactical text-xs uppercase tracking-widest text-[#38BDF8]">
              Client-Side Cryptographic Vault
            </p>
            <h1 className="text-lg font-semibold text-white">
              Gray-Zone &amp; Infrastructure Monitor
            </h1>
          </div>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed mb-6">
          This deployment is protected with client-side{' '}
          <span className="font-mono-tactical text-xs text-gray-200">
            {vaultMeta.kdf} ({vaultMeta.iterations.toLocaleString()} iterations) + {vaultMeta.algorithm}
          </span>
          . Enter your <code className="font-mono-tactical text-xs text-amber-300">SITE_PASSCODE</code>{' '}
          to decrypt the briefing bundle locally in Web Crypto memory.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="vault-passcode-input"
              className="block text-xs font-mono-tactical uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Vault Passphrase
            </label>
            <input
              id="vault-passcode-input"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passphrase…"
              autoFocus
              className="w-full rounded-lg bg-[#0A0E17] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="vault-unlock-button"
            type="submit"
            disabled={busy || !passcode.trim()}
            className="w-full rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8] font-medium py-2.5 text-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {busy ? 'Deriving PBKDF2 Key & Decrypting…' : 'Decrypt & Unlock Briefing'}
          </button>
        </form>
      </div>
    </div>
  );
}
