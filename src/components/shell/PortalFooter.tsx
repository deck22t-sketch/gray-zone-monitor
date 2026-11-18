'use client';

import React from 'react';
import Link from 'next/link';
import { History, Rss, Search, ShieldCheck } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

export function PortalFooter() {
  const { bundle, setChangelogOpen, setSearchOpen } = usePortal();
  const { sections, changelog, feedHealth, liveSignals } = bundle;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const syncedUtc = new Date(changelog.syncedAtISO)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 16);

  return (
    <footer className="border-t border-white/10 bg-[#080B12] mt-16">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Brand & Edition Provenance */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center gap-2 font-mono-tactical text-xs text-white font-semibold">
              <span className="w-2 h-2 rounded-xs bg-[#EF4444]" />
              <span>GRAY-ZONE &amp; CRITICAL INFRASTRUCTURE RISK MONITOR</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md">
              Deterministic static intelligence portal synchronized against the canonical{' '}
              <span className="text-gray-200 font-medium">{sections.docDate}</span> Executive
              Briefing and automated zero-key federal &amp; backbone telemetry endpoints.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono-tactical text-[11px] text-gray-400">
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-gray-300">
                SHA-256: {changelog.docHash.slice(0, 12)}…
              </span>
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-gray-300">
                SYNC: {syncedUtc} UTC
              </span>
              <span className="px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {feedHealth.liveCount}/{feedHealth.totalFeeds} Feeds · {liveSignals.totalSignals}{' '}
                Signals
              </span>
            </div>
          </div>

          {/* 5 Intelligence Views */}
          <div className="md:col-span-4 space-y-2">
            <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-400">
              Intelligence Modules
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <Link href="/" className="text-gray-300 hover:text-[#38BDF8] transition">
                01 · Command Overview
              </Link>
              <Link href="/geopolitics" className="text-gray-300 hover:text-[#38BDF8] transition">
                02 · Geopolitical Arc
              </Link>
              <Link href="/incidents" className="text-gray-300 hover:text-[#38BDF8] transition">
                03 · Outage Forensics
              </Link>
              <Link href="/contagion" className="text-gray-300 hover:text-[#38BDF8] transition">
                04 · Contagion &amp; Legal
              </Link>
              <Link href="/watchlist" className="text-gray-300 hover:text-[#38BDF8] transition">
                05 · 9-Point Watchlist
              </Link>
              <Link
                href="/watchlist?tab=vault"
                className="text-gray-300 hover:text-[#38BDF8] transition"
              >
                06 · Source Vault ({sections.primarySources.length})
              </Link>
            </div>
          </div>

          {/* Quick Tools & Compliance */}
          <div className="md:col-span-3 space-y-2.5">
            <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-400">
              Audit &amp; Syndication
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setChangelogOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono-tactical text-xs text-gray-300 hover:text-white transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Sync Diffs</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono-tactical text-xs text-gray-300 hover:text-white transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>⌘K Search</span>
              </button>
              <a
                href={`${basePath}/feed.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono-tactical text-xs text-gray-300 hover:text-[#F59E0B] transition"
              >
                <Rss className="w-3.5 h-3.5" />
                <span>RSS 2.0</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono-tactical text-gray-500">
          <span>
            EDITION: {sections.docDate.toUpperCase()} · {sections.primarySources.length} VERIFIED
            PRIMARY CITATIONS · SECTION 9 INTERNAL SPEC OMITTED
          </span>
          <span>
            PLAIN-TEXT FEDERAL ATTRIBUTION: CISA · FEDERAL REGISTER · FAA NAS STATUS
            (nasstatus.faa.gov)
          </span>
        </div>
      </div>
    </footer>
  );
}
