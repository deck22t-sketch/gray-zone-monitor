'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { NON_AFFILIATION_NOTICE } from '@/lib/evidence';

export function VaultGate({ children }: { children: React.ReactNode }) {
  const { isPublicMode, isLocked, isRestoringVault, unlockWithPasscode, vaultMeta } = usePortal();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPublicMode || !isLocked) {
    return <>{children}</>;
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

  const editionLabel = vaultMeta.docDate || 'November 2026';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="glass-panel tac-frame max-w-md w-full rounded-lg p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-[#0E131D] border border-white/15 flex items-center justify-center text-[#38BDF8] shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono-tactical text-[10px] uppercase tracking-widest text-[#38BDF8]">
                  Private Briefing Access
                </p>
                <span className="font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm bg-white/[0.05] border border-white/12 text-gray-300">
                  {editionLabel}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-white leading-snug tracking-tight">
                Gray-Zone &amp; Infrastructure Monitor
              </h1>
            </div>
          </div>
        </div>

        {vaultMeta.liveFeedSummary && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-2 text-[11px] font-mono-tactical text-[#10B981]">
            <span>● {vaultMeta.liveFeedSummary}</span>
            <span className="text-gray-300">Edition: {editionLabel}</span>
          </div>
        )}

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
              className="block text-[11px] font-mono-tactical uppercase tracking-wider text-gray-400 mb-1.5"
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
                className="w-full rounded-md bg-[#06080C] border border-white/15 pl-3.5 pr-10 py-3 text-sm font-mono-tactical text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                aria-label={showPasscode ? 'Hide passphrase' : 'Show passphrase'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-gray-400 hover:text-white cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 font-mono-tactical">
              No username required · Case-insensitive on mobile keyboards
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-md bg-[#0E131D] border border-white/[0.08] p-3">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="mt-0.5 rounded-xs border-white/25 bg-[#06080C] text-[#38BDF8] focus:ring-[#38BDF8]"
            />
            <span className="text-xs text-gray-300 leading-snug">
              Remember this device for 30 days{' '}
              <span className="block text-[11px] text-gray-500 mt-0.5">
                Stores a non-extractable Web Crypto key locally; use Lock anytime to clear.
              </span>
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="vault-unlock-button"
            type="submit"
            disabled={busy || isRestoringVault || !passcode.trim()}
            className="w-full rounded-md bg-[#38BDF8]/16 hover:bg-[#38BDF8]/26 border border-[#38BDF8]/45 text-[#38BDF8] font-medium py-3 text-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className={`w-4 h-4 ${busy || isRestoringVault ? 'animate-pulse' : ''}`} />
            <span>
              {busy || isRestoringVault ? 'Decrypting Briefing…' : 'Unlock Briefing'}
            </span>
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-[11px] text-gray-500 leading-relaxed">
          {NON_AFFILIATION_NOTICE}
        </div>
      </div>
    </div>
  );
}
