'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  { href: '/', label: 'Command Overview', shortLabel: 'OVERVIEW', icon: ShieldAlert },
  { href: '/geopolitics', label: 'Geopolitical Arc', shortLabel: 'GEOPOLITICS', icon: Globe },
  { href: '/incidents', label: 'Outage Wave & Forensics', shortLabel: 'FORENSICS', icon: Activity },
  { href: '/contagion', label: 'Contagion & Legal', shortLabel: 'CONTAGION', icon: Scale },
  { href: '/watchlist', label: 'Watchlist & Live Wire', shortLabel: 'WATCHLIST', icon: Eye },
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
  const headerRef = useRef<HTMLElement | null>(null);
  const {
    bundle,
    vaultMeta,
    lockVault,
    setSearchOpen,
    setChangelogOpen,
    setExportOpen,
    isOffline,
    pinnedSignalIds,
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

  // Measure live <header> height and publish --portal-header-h so SectionNavStrip docks with 0px gap
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeight = () => {
      const h = Math.floor(el.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--portal-header-h', `${h}px`);
      }
    };

    syncHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(syncHeight);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', syncHeight, { passive: true });
    return () => window.removeEventListener('resize', syncHeight);
  }, [compactMobile, pathname]);

  useEffect(() => {
    const updateScroll = () => {
      const y = window.scrollY;
      setCompactMobile(y > 68);
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

  const activeNav = NAV_ITEMS.find((item) => isRouteActive(item.href)) ?? NAV_ITEMS[0];

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
    <header
      id="portal-top-header"
      ref={headerRef}
      className="sticky top-0 z-40 bg-[#070A10]/[0.98] backdrop-blur-md border-b border-white/[0.11] print:hidden"
    >
      {/* Slim Telemetry & Clock Micro-Bar */}
      <div id="portal-top-utility-bar" className="border-b border-white/[0.07] bg-[#05070B]">
        <div className="max-w-[1380px] mx-auto px-3 sm:px-6 lg:px-8 h-9 sm:h-7 flex items-center justify-between gap-2 text-[11px] font-mono-tactical">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            {compactMobile && (
              <span className="md:hidden inline-flex items-center gap-1.5 text-white font-semibold shrink-0">
                <span className="w-1.5 h-1.5 rounded-[1px] bg-[#EF4444]" />
                <span className="text-[10px] tracking-wider">{activeNav.shortLabel}</span>
                <span className="hidden sm:inline text-gray-600">/</span>
              </span>
            )}
            <span
              className={`items-center gap-1 text-gray-300 shrink-0 ${
                compactMobile ? 'hidden sm:inline-flex' : 'inline-flex'
              }`}
            >
              <Clock className="w-3 h-3 text-[#38BDF8] shrink-0" />
              {mounted ? (
                <span>
                  {clocks.utc}
                  <span className="hidden sm:inline"> · {clocks.et}</span>
                </span>
              ) : (
                <span>SYNC</span>
              )}
            </span>
            <span className="hidden lg:inline text-gray-700">|</span>
            <span className="hidden lg:inline text-gray-500 truncate">
              Independent Open-Source Synthesis · Zero-Key Public Telemetry
            </span>
            {showStaleOrOffline && (
              <span
                title={
                  isOffline
                    ? `Offline cache active · Last sweep T+${sweepAgeHours}h`
                    : `Last telemetry sweep T+${sweepAgeHours}h ago`
                }
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] text-[10px] shrink-0"
              >
                <WifiOff className="w-2.5 h-2.5 shrink-0" />
                <span className="hidden sm:inline">
                  {isOffline
                    ? `OFFLINE · T+${sweepAgeHours}h`
                    : `SWEEP T+${sweepAgeHours}h`}
                </span>
                <span className="sm:hidden">
                  {isOffline ? 'OFF' : `T+${sweepAgeHours}h`}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Link
              href="/watchlist?tab=live-wire"
              aria-label={`Public feeds: ${feedHealth.liveCount} of ${feedHealth.totalFeeds} live`}
              className={`md:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[10px] ${
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

            {compactMobile && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search briefing"
                className="md:hidden p-1 rounded-sm bg-white/[0.04] border border-white/10 text-gray-300 hover:text-white cursor-pointer"
              >
                <Search className="w-3 h-3 text-[#38BDF8]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.09] border border-white/12 text-[10px] text-gray-200 hover:text-white transition cursor-pointer"
            >
              <FileText className="w-3 h-3 text-[#38BDF8]" />
              <span className="hidden sm:inline">Export Summary</span>
              <span className="sm:hidden">Brief</span>
              {pinnedSignalIds.length > 0 && (
                <span className="px-1 rounded-xs bg-[#38BDF8]/20 text-[#38BDF8] font-semibold">
                  {pinnedSignalIds.length}
                </span>
              )}
            </button>

            {vaultMeta.encrypted && (
              <button
                type="button"
                onClick={() => lockVault()}
                aria-label="Lock briefing and clear device session"
                title="Lock briefing and clear device session"
                className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-sm bg-white/[0.04] hover:bg-[#EF4444]/15 border border-white/12 hover:border-[#EF4444]/40 text-[10px] text-gray-300 hover:text-[#EF4444] transition cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Command Header Row (collapses cleanly on <768px scroll to maximize reading space) */}
      <div
        className={`max-w-[1380px] mx-auto px-3 sm:px-6 lg:px-8 ${
          compactMobile ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3 py-2 sm:py-2.5">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#0E131D] border border-white/15 flex items-center justify-center shrink-0 relative">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[1px] bg-[#EF4444]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-sm font-semibold tracking-tight text-white group-hover:text-[#38BDF8] transition truncate uppercase">
                  Gray-Zone &amp; Infrastructure Monitor
                </span>
                <span className="hidden sm:inline-block font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm bg-white/[0.05] border border-white/10 text-gray-300 shrink-0">
                  {sections.docDate.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-mono-tactical text-gray-500 truncate">
                Executive Risk Synthesis · Keyless Telemetry
              </p>
            </div>
          </Link>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/watchlist?tab=live-wire"
              id="nav-feed-health-pill"
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-mono-tactical text-xs transition ${
                allLive
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full pulse-live ${
                  allLive ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
              />
              <span>
                {feedHealth.liveCount}/{feedHealth.totalFeeds} Feeds Live
              </span>
            </Link>

            <button
              id="nav-changelog-button"
              type="button"
              onClick={() => setChangelogOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-xs font-mono-tactical text-gray-300 hover:text-white transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden lg:inline">Sync Diffs</span>
              {totalDiffs > 0 && (
                <span className="px-1.5 py-0.2 rounded-sm bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[10px] font-semibold text-[#F59E0B]">
                  {totalDiffs}
                </span>
              )}
            </button>

            <button
              id="nav-cmdk-button"
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#0B0F17] hover:bg-white/[0.06] border border-white/14 text-xs text-gray-300 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden sm:inline text-gray-400">Search</span>
              <kbd className="hidden sm:inline font-mono-tactical text-[10px] px-1.5 py-0.5 rounded-sm bg-white/[0.06] text-gray-300">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Desktop 5-View Architectural Tab Bar */}
        <nav
          aria-label="Primary Intelligence Views"
          className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-white/[0.07] pt-1.5"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium whitespace-nowrap transition border-b-2 ${
                  active
                    ? 'border-[#38BDF8] text-white bg-white/[0.03]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.025]'
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

      {/* 2px Precision Reading Progress Track */}
      <div className="h-[2px] w-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full bg-[#38BDF8] transition-[width] duration-100 ease-out"
          style={{ width: `${scrollPct}%` }}
        />
      </div>
    </header>
  );
}
