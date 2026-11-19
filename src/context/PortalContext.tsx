'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import riskMatrixJson from '@/data/riskMatrix.json';
import incidentsJson from '@/data/incidents.json';
import countdownCliffsJson from '@/data/countdownCliffs.json';
import watchlistJson from '@/data/watchlist.json';
import sectionsJson from '@/data/sections.json';
import changelogJson from '@/data/changelog.json';
import liveSignalsJson from '@/data/liveSignals.json';
import feedHealthJson from '@/data/feedHealth.json';
import feedHistoryJson from '@/data/feedHistory.json';
import vaultMetaJson from '@/data/vaultMeta.json';
import {
  ChangelogData,
  CountdownCliff,
  FeedHealthData,
  FeedHistoryData,
  IncidentRow,
  LiveSignalsData,
  PrimarySourceEntry,
  RiskVector,
  SectionsData,
  VaultMeta,
  WatchlistRow,
} from '@/types/schemas';
import {
  clearVaultGrants,
  decryptBundleWithPasscode,
  FullBriefingDataBundle,
  persistVaultGrant,
  restorePersistedPassphrase,
} from '@/lib/vault-crypto';

export interface ActiveCitation {
  title: string;
  url: string;
  category?: string;
  domainTag?: string;
  context?: string;
}

interface PortalContextValue {
  bundle: FullBriefingDataBundle;
  vaultMeta: VaultMeta;
  isLocked: boolean;
  isRestoringVault: boolean;
  unlockWithPasscode: (passcode: string, rememberDeviceFor30Days?: boolean) => Promise<void>;
  lockVault: () => Promise<void>;
  activeCitation: ActiveCitation | null;
  openCitation: (citation: ActiveCitation) => void;
  closeCitation: () => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isChangelogOpen: boolean;
  setChangelogOpen: (open: boolean) => void;
  isExportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  isOffline: boolean;
  lookupSourceByUrl: (url: string) => PrimarySourceEntry | undefined;
}

const staticBundle: FullBriefingDataBundle = {
  riskMatrix: riskMatrixJson as RiskVector[],
  incidents: incidentsJson as IncidentRow[],
  countdownCliffs: countdownCliffsJson as CountdownCliff[],
  watchlist: watchlistJson as WatchlistRow[],
  sections: sectionsJson as SectionsData,
  changelog: changelogJson as ChangelogData,
  liveSignals: liveSignalsJson as LiveSignalsData,
  feedHealth: feedHealthJson as FeedHealthData,
  feedHistory: feedHistoryJson as FeedHistoryData,
};

const staticVaultMeta = vaultMetaJson as VaultMeta;

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [unlockedBundle, setUnlockedBundle] = useState<FullBriefingDataBundle | null>(null);
  const [isRestoringVault, setIsRestoringVault] = useState<boolean>(staticVaultMeta.encrypted);
  const [activeCitation, setActiveCitation] = useState<ActiveCitation | null>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isChangelogOpen, setChangelogOpen] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Restore active 30-day IndexedDB device key or current-tab grant in memory
  useEffect(() => {
    let cancelled = false;
    async function attemptRestore() {
      if (!staticVaultMeta.encrypted) {
        setIsRestoringVault(false);
        return;
      }
      try {
        const storedPassphrase = await restorePersistedPassphrase();
        if (storedPassphrase && !cancelled) {
          const decrypted = await decryptBundleWithPasscode(staticVaultMeta, storedPassphrase);
          if (!cancelled) {
            setUnlockedBundle(decrypted);
          }
        }
      } catch {
        // Stored passphrase expired or rotated; clear stale grant cleanly
        await clearVaultGrants();
      } finally {
        if (!cancelled) {
          setIsRestoringVault(false);
        }
      }
    }
    attemptRestore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track online/offline state for Flight / Dead-Zone PWA indicator
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut & Escape handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setActiveCitation(null);
        setChangelogOpen(false);
        setExportOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isLocked = staticVaultMeta.encrypted && unlockedBundle === null;
  const bundle = unlockedBundle ?? staticBundle;

  const sourceMap = useMemo(() => {
    const map = new Map<string, PrimarySourceEntry>();
    for (const s of bundle.sections.primarySources) {
      map.set(s.url, s);
    }
    return map;
  }, [bundle.sections.primarySources]);

  async function unlockWithPasscode(passcode: string, rememberDeviceFor30Days: boolean = true) {
    const decrypted = await decryptBundleWithPasscode(staticVaultMeta, passcode);
    setUnlockedBundle(decrypted);
    await persistVaultGrant(passcode, rememberDeviceFor30Days);
  }

  async function lockVault() {
    setUnlockedBundle(null);
    setActiveCitation(null);
    setSearchOpen(false);
    setChangelogOpen(false);
    setExportOpen(false);
    await clearVaultGrants();
  }

  function openCitation(citation: ActiveCitation) {
    const matched = sourceMap.get(citation.url);
    setActiveCitation({
      title: citation.title || matched?.title || 'Primary Source Reference',
      url: citation.url,
      category: citation.category || matched?.category || 'Verified Briefing Source',
      domainTag: citation.domainTag || matched?.domainTag || 'Outage Telemetry',
      context: citation.context,
    });
  }

  const value: PortalContextValue = {
    bundle,
    vaultMeta: staticVaultMeta,
    isLocked,
    isRestoringVault,
    unlockWithPasscode,
    lockVault,
    activeCitation,
    openCitation,
    closeCitation: () => setActiveCitation(null),
    isSearchOpen,
    setSearchOpen,
    isChangelogOpen,
    setChangelogOpen,
    isExportOpen,
    setExportOpen,
    isOffline,
    lookupSourceByUrl: (url: string) => sourceMap.get(url),
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal must be used inside <PortalProvider>');
  }
  return ctx;
}
