'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Globe,
  Activity,
  Scale,
  Eye,
  Search,
  History,
  Rss,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

const NAV_ITEMS = [
  { href: '/', label: 'Command Overview', icon: ShieldAlert },
  { href: '/geopolitics', label: 'Geopolitical Arc', icon: Globe },
  { href: '/incidents', label: 'Outage Wave & Forensics', icon: Activity },
  { href: '/contagion', label: 'Contagion & Legal', icon: Scale },
  { href: '/watchlist', label: 'Watchlist & Live Wire', icon: Eye },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { bundle, setSearchOpen, setChangelogOpen } = usePortal();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`);
  };

  const { feedHealth } = bundle;
  const allLive = feedHealth.liveCount === feedHealth.totalFeeds && feedHealth.totalFeeds > 0;

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#111827] border border-white/15 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444] shadow-[0_0_10px_#EF4444]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-white group-hover:text-[#38BDF8] transition">
                  GRAY-ZONE &amp; INFRASTRUCTURE MONITOR
                </span>
                <span className="hidden sm:inline-block font-mono-tactical text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-gray-300">
                  NOV 2026
                </span>
              </div>
              <p className="text-[11px] font-mono-tactical text-gray-400">
                Canonical Executive Briefing + Zero-Key Federal/Backbone OSINT
              </p>
            </div>
          </Link>

          {/* Right Tactical Controls */}
          <div className="flex items-center gap-2">
            <Link
              href="/watchlist?tab=live-wire"
              id="nav-feed-health-pill"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono-tactical text-xs transition ${
                allLive
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  allLive ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
              />
              <span>
                {feedHealth.liveCount}/{feedHealth.totalFeeds} Public Feeds Live
              </span>
            </Link>

            <button
              id="nav-changelog-button"
              type="button"
              onClick={() => setChangelogOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono-tactical text-gray-300 hover:text-white transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden md:inline">What Changed</span>
            </button>

            <button
              id="nav-cmdk-button"
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0A0E17] hover:bg-white/[0.06] border border-white/15 text-xs text-gray-300 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden sm:inline text-gray-400">Search</span>
              <kbd className="font-mono-tactical text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-300">
                ⌘K
              </kbd>
            </button>

            <a
              href={`${basePath}/feed.xml`}
              target="_blank"
              rel="noopener noreferrer"
              title="Static RSS 2.0 Intelligence Feed (/feed.xml)"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-[#F59E0B] transition"
            >
              <Rss className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 5-View Modular Navigation Bar */}
        <nav aria-label="Primary Intelligence Views" className="flex items-center gap-1 overflow-x-auto pb-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-white/[0.09] text-white border border-white/15'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${active ? 'text-[#38BDF8]' : 'text-gray-500'}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
