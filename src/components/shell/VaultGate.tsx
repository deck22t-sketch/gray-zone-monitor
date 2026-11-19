'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { NON_AFFILIATION_NOTICE } from '@/lib/evidence';

export function VaultGate({ children }: { children: React.ReactNode }) {
  const { isLocked, isRestoringVault, unlockWithPasscode, vaultMeta } = usePortal();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLocked) {
    return <>{children}</>;
  }

  if (isRestoringVault) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0E17]">
        <div className="glass-panel max-w-sm w-full rounded-2xl p-6 text-center space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] mx-auto">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
          </div>
          <p className="font-mono-tactical text-xs text-gray-300">
            Verifying encrypted session in Web Crypto…
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await unlockWithPasscode(passcode, rememberDevice);
    } catch {
      setError('Incorrect access passphrase. Please check the shared phrase and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0A0E17]">
      <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="font-mono-tactical text-[11px] uppercase tracking-widest text-[#38BDF8]">
              Private Briefing Access
            </p>
            <h1 className="text-lg sm:text-xl font-semibold text-white leading-snug">
              Gray-Zone &amp; Infrastructure Monitor
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          Enter the shared access passphrase provided with your link. All briefing modules and
          public feed snapshots are encrypted with{' '}
          <span className="font-mono-tactical text-xs text-gray-200">
            {vaultMeta.algorithm} ({vaultMeta.kdf})
          </span>{' '}
          and decrypted locally in your browser.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="vault-passcode-input"
              className="block text-xs font-mono-tactical uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Shared Access Passphrase
            </label>
            <div className="relative">
              <input
                id="vault-passcode-input"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter shared passphrase…"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
                spellCheck={false}
                autoFocus
                className="w-full rounded-xl bg-[#0A0E17] border border-white/15 pl-3.5 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                aria-label={showPasscode ? 'Hide passphrase' : 'Show passphrase'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 font-mono-tactical">
              No username required · Case-insensitive on mobile keyboards
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl bg-white/[0.03] border border-white/[0.08] p-3">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="mt-0.5 rounded border-white/25 bg-[#0A0E17] text-[#38BDF8] focus:ring-[#38BDF8]"
            />
            <span className="text-xs text-gray-300 leading-snug">
              Remember this device for 30 days{' '}
              <span className="block text-[11px] text-gray-500 mt-0.5">
                Stores a non-extractable Web Crypto key locally; use Lock anytime to clear.
              </span>
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="vault-unlock-button"
            type="submit"
            disabled={busy || !passcode.trim()}
            className="w-full rounded-xl bg-[#38BDF8]/18 hover:bg-[#38BDF8]/28 border border-[#38BDF8]/45 text-[#38BDF8] font-medium py-3 text-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{busy ? 'Decrypting Briefing…' : 'Unlock Briefing'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-[11px] text-gray-500 leading-relaxed">
          {NON_AFFILIATION_NOTICE}
        </div>
      </div>
    </div>
  );
}
