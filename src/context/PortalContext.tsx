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
import vaultMetaJson from '@/data/vaultMeta.json';
import {
  ChangelogData,
  CountdownCliff,
  FeedHealthData,
  IncidentRow,
  LiveSignalsData,
  PrimarySourceEntry,
  RiskVector,
  SectionsData,
  VaultMeta,
  WatchlistRow,
} from '@/types/schemas';
import { decryptBundleWithPasscode, FullBriefingDataBundle } from '@/lib/vault-crypto';

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
  unlockWithPasscode: (passcode: string) => Promise<void>;
  activeCitation: ActiveCitation | null;
  openCitation: (citation: ActiveCitation) => void;
  closeCitation: () => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isChangelogOpen: boolean;
  setChangelogOpen: (open: boolean) => void;
  lookupSourceByUrl: (url: string) => PrimarySourceEntry | undefined;
}

const SESSION_CACHE_KEY = 'gz_decrypted_bundle_v1';

const staticBundle: FullBriefingDataBundle = {
  riskMatrix: riskMatrixJson as RiskVector[],
  incidents: incidentsJson as IncidentRow[],
  countdownCliffs: countdownCliffsJson as CountdownCliff[],
  watchlist: watchlistJson as WatchlistRow[],
  sections: sectionsJson as SectionsData,
  changelog: changelogJson as ChangelogData,
  liveSignals: liveSignalsJson as LiveSignalsData,
  feedHealth: feedHealthJson as FeedHealthData,
};

const staticVaultMeta = vaultMetaJson as VaultMeta;

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [unlockedBundle, setUnlockedBundle] = useState<FullBriefingDataBundle | null>(null);
  const [activeCitation, setActiveCitation] = useState<ActiveCitation | null>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isChangelogOpen, setChangelogOpen] = useState(false);

  // Restore decrypted session if SITE_PASSCODE mode was unlocked during this tab session
  useEffect(() => {
    if (!staticVaultMeta.encrypted) return;
    try {
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (cached) {
        setUnlockedBundle(JSON.parse(cached) as FullBriefingDataBundle);
      }
    } catch {
      // Ignore storage access errors
    }
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

  async function unlockWithPasscode(passcode: string) {
    const decrypted = await decryptBundleWithPasscode(staticVaultMeta, passcode);
    setUnlockedBundle(decrypted);
    try {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(decrypted));
    } catch {
      // Ignore quota errors
    }
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
    unlockWithPasscode,
    activeCitation,
    openCitation,
    closeCitation: () => setActiveCitation(null),
    isSearchOpen,
    setSearchOpen,
    isChangelogOpen,
    setChangelogOpen,
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
