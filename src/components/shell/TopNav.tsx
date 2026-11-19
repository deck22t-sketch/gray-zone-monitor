'use client';

import React, { useEffect, useState } from 'react';
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
  FileText,
  Lock,
  WifiOff,
  Clock,
} from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

const NAV_ITEMS = [
  { href: '/', label: 'Command Overview', icon: ShieldAlert },
  { href: '/geopolitics', label: 'Geopolitical Arc', icon: Globe },
  { href: '/incidents', label: 'Outage Wave & Forensics', icon: Activity },
  { href: '/contagion', label: 'Contagion & Legal', icon: Scale },
  { href: '/watchlist', label: 'Watchlist & Live Wire', icon: Eye },
] as const;

function formatOperationalClocks(nowMs: number): { utc: string; et: string } {
  const d = new Date(nowMs);
  const utc = d.toISOString().slice(11, 16) + ' UTC';
  let et = '';
  try {
    et =
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d) + ' ET';
  } catch {
    et = utc;
  }
  return { utc, et };
}

export function TopNav() {
  const pathname = usePathname();
  const {
    bundle,
    vaultMeta,
    lockVault,
    setSearchOpen,
    setChangelogOpen,
    setExportOpen,
    isOffline,
  } = usePortal();

  const [scrollPct, setScrollPct] = useState(0);
  const [compactMobile, setCompactMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.parse('2026-11-18T16:00:00Z'));

  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      const y = window.scrollY;
      setCompactMobile(y > 72);
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setScrollPct(0);
        return;
      }
      setScrollPct(Math.min(100, Math.max(0, (y / docHeight) * 100)));
    };
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, [pathname]);

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`);
  };

  const { feedHealth, changelog, sections } = bundle;
  const allLive = feedHealth.liveCount === feedHealth.totalFeeds && feedHealth.totalFeeds > 0;
  const totalDiffs =
    changelog.addedIncidents.length +
    changelog.updatedStatuses.length +
    changelog.riskShifts.length;

  const sweepAgeHours = Math.max(
    0,
    Math.floor((nowMs - Date.parse(feedHealth.checkedAtISO)) / 3_600_000)
  );
  const showStaleOrOffline = mounted && (isOffline || sweepAgeHours >= 18);
  const clocks = formatOperationalClocks(nowMs);

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 print:hidden">
      {/* Slim Operational Clock & Offline Telemetry Micro-Bar */}
      <div className="border-b border-white/[0.07] bg-[#080C14]/85">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-8 sm:h-7 flex items-center justify-between gap-2 text-[11px] font-mono-tactical">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1 text-gray-300 shrink-0">
              <Clock className="w-3 h-3 text-[#38BDF8]" />
              <span>{mounted ? `${clocks.utc} · ${clocks.et}` : 'SYNCING CLOCK'}</span>
            </span>
            <span className="hidden lg:inline text-gray-600">|</span>
            <span className="hidden lg:inline text-gray-400 truncate">
              Independent Open-Source Analysis · Zero-Key Public Telemetry
            </span>
            {showStaleOrOffline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] text-[10px] shrink-0">
                <WifiOff className="w-3 h-3" />
                <span>
                  {isOffline
                    ? `OFFLINE SNAPSHOT · T+${sweepAgeHours}h`
                    : `LAST SWEEP T+${sweepAgeHours}h`}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Compact mobile quick-controls stay visible even when scrolled */}
            <Link
              href="/watchlist?tab=live-wire"
              className={`md:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${
                allLive
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  allLive ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
              />
              <span>
                {feedHealth.liveCount}/{feedHealth.totalFeeds}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search briefing"
              className="md:hidden p-1 rounded bg-white/[0.05] border border-white/10 text-gray-300 hover:text-white cursor-pointer"
            >
              <Search className="w-3 h-3 text-[#38BDF8]" />
            </button>

            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/12 text-[10px] text-gray-200 hover:text-white transition cursor-pointer"
            >
              <FileText className="w-3 h-3 text-[#38BDF8]" />
              <span className="hidden sm:inline">Export Summary</span>
              <span className="sm:hidden">Summary</span>
            </button>

            {vaultMeta.encrypted && (
              <button
                type="button"
                onClick={() => lockVault()}
                title="Lock briefing and clear device session"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#EF4444]/15 border border-white/12 hover:border-[#EF4444]/40 text-[10px] text-gray-300 hover:text-[#EF4444] transition cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Lock</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Row (collapses cleanly on <768px downward scroll to maximize reading space) */}
      <div
        className={`max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-200 ${
          compactMobile ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0E1524] border border-white/15 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold tracking-tight text-white group-hover:text-[#38BDF8] transition truncate">
                  GRAY-ZONE &amp; INFRASTRUCTURE MONITOR
                </span>
                <span className="hidden sm:inline-block font-mono-tactical text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-gray-300 shrink-0">
                  {sections.docDate.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] font-mono-tactical text-gray-400 truncate">
                Executive Risk Synthesis · Keyless Public &amp; Backbone OSINT
              </p>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <Link
              href="/watchlist?tab=live-wire"
              id="nav-feed-health-pill"
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono-tactical text-xs transition ${
                allLive
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full pulse-live ${
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
              <span className="hidden lg:inline">What Changed</span>
              {totalDiffs > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[10px] font-semibold text-[#F59E0B]">
                  {totalDiffs}
                </span>
              )}
            </button>

            <button
              id="nav-cmdk-button"
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0A0E17] hover:bg-white/[0.06] border border-white/15 text-xs text-gray-300 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden sm:inline text-gray-400">Search</span>
              <kbd className="hidden sm:inline font-mono-tactical text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-300">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Desktop 5-View Modular Navigation Bar (hidden on <768px where MobileBottomNav is active) */}
        <nav
          aria-label="Primary Intelligence Views"
          className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-white/[0.09] text-white border border-white/18 shadow-xs'
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

      {/* Subtle 2px Reading Progress Indicator */}
      <div className="h-[2px] w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-[#38BDF8]/80 transition-[width] duration-100 ease-out"
          style={{ width: `${scrollPct}%` }}
        />
      </div>
    </header>
  );
}
