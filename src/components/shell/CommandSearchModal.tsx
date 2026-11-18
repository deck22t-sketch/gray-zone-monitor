'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

type SearchScope = 'ALL' | 'RISK' | 'EVENT' | 'WATCHLIST' | 'OSINT' | 'SOURCE';

interface SearchHit {
  id: string;
  scope: Exclude<SearchScope, 'ALL'>;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  href?: string;
  externalUrl?: string;
}

export function CommandSearchModal() {
  const { isSearchOpen, setSearchOpen, bundle, openCitation } = usePortal();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const allItems = useMemo<SearchHit[]>(() => {
    const items: SearchHit[] = [];

    for (const r of bundle.riskMatrix) {
      items.push({
        id: `risk-${r.id}`,
        scope: 'RISK',
        badge: `RISK ${r.id}`,
        badgeColor: 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10',
        title: r.domain,
        subtitle: `${r.horizon} · ${r.blastRadius} — ${r.mitigation}`,
        href: '/',
      });
    }

    for (const inc of bundle.incidents) {
      items.push({
        id: `inc-${inc.eventId}`,
        scope: 'EVENT',
        badge: `EVENT ${inc.eventId}`,
        badgeColor:
          inc.classification === 'malicious_attack'
            ? 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10'
            : inc.classification === 'client_cascade'
            ? 'text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10'
            : 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10',
        title: `${inc.entity} (${inc.sector})`,
        subtitle: `${inc.window} — ${inc.impact}`,
        href: '/incidents/',
      });
    }

    for (const cliff of bundle.countdownCliffs) {
      items.push({
        id: `cliff-${cliff.targetDateISO}`,
        scope: 'RISK',
        badge: `CLIFF ${cliff.dateLabel}`,
        badgeColor: 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10',
        title: cliff.milestone,
        subtitle: cliff.actionExposure,
        href: '/',
      });
    }

    for (const wl of bundle.watchlist) {
      items.push({
        id: `wl-${wl.id}`,
        scope: 'WATCHLIST',
        badge: `WATCHLIST ${wl.id}`,
        badgeColor: 'text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10',
        title: wl.signal,
        subtitle: `${wl.mechanism} — ${wl.forensicMeaning}`,
        href: '/watchlist/',
      });
    }

    for (const sig of bundle.liveSignals.signals.slice(0, 50)) {
      items.push({
        id: `sig-${sig.id}`,
        scope: 'OSINT',
        badge: `OSINT · ${sig.sourceName}`,
        badgeColor: 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10',
        title: sig.title,
        subtitle: sig.summary,
        href: '/watchlist/?tab=live-wire',
      });
    }

    for (const sec of bundle.sections.narrativeSections) {
      const route =
        sec.number <= 5
          ? '/geopolitics/'
          : sec.number === 6 || sec.number === 8
          ? '/incidents/'
          : '/contagion/';
      items.push({
        id: `sec-${sec.id}`,
        scope: 'RISK',
        badge: `SECTION ${sec.number}`,
        badgeColor: 'text-gray-300 border-white/15 bg-white/5',
        title: sec.title,
        subtitle: sec.subsections.map((s) => `${s.code} ${s.title}`).join(' · '),
        href: route,
      });
    }

    for (const src of bundle.sections.primarySources) {
      items.push({
        id: `src-${src.id}`,
        scope: 'SOURCE',
        badge: src.domainTag,
        badgeColor: 'text-[#38BDF8] border-[#38BDF8]/25 bg-[#38BDF8]/10',
        title: src.title,
        subtitle: `${src.category} — ${src.url}`,
        externalUrl: src.url,
      });
    }

    return items;
  }, [bundle]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = scope === 'ALL' ? allItems : allItems.filter((item) => item.scope === scope);
    if (!q) return scoped.slice(0, 16);
    return scoped
      .filter((item) =>
        `${item.badge} ${item.title} ${item.subtitle}`.toLowerCase().includes(q)
      )
      .slice(0, 28);
  }, [allItems, query, scope]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, scope, isSearchOpen]);

  function activateHit(hit: SearchHit | undefined) {
    if (!hit) return;
    setSearchOpen(false);
    if (hit.externalUrl) {
      openCitation({
        title: hit.title,
        url: hit.externalUrl,
        domainTag: hit.badge,
      });
    } else if (hit.href) {
      router.push(hit.href);
    }
  }

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/75 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setSearchOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Global Intelligence Search"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) =>
              filtered.length === 0 ? 0 : (prev + 1) % filtered.length
            );
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) =>
              filtered.length === 0 ? 0 : (prev - 1 + filtered.length) % filtered.length
            );
          } else if (e.key === 'Enter' && filtered[selectedIndex]) {
            e.preventDefault();
            activateHit(filtered[selectedIndex]);
          }
        }}
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-[#0F1624] border border-white/15 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <input
            id="global-cmdk-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search 8 risk vectors, 10 incidents, 9 watchlist signals, live OSINT, or ${bundle.sections.primarySources.length} primary sources…`}
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="font-mono-tactical text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-gray-300 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
            aria-label="Close search modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Filter Pills */}
        <div className="px-4 py-2 bg-[#0A0E17]/75 border-b border-white/[0.08] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              ['ALL', 'All Intelligence'],
              ['RISK', 'Risks & Cliffs'],
              ['EVENT', '10 Incidents'],
              ['WATCHLIST', 'Watchlist'],
              ['OSINT', 'Live OSINT'],
              ['SOURCE', `Sources (${bundle.sections.primarySources.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={`px-2.5 py-1 rounded-md font-mono-tactical text-[11px] whitespace-nowrap border transition cursor-pointer ${
                scope === id
                  ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]'
                  : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="max-h-[58vh] overflow-y-auto divide-y divide-white/[0.06]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No intelligence entries matched &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((hit, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={hit.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => activateHit(hit)}
                  className={`w-full text-left px-4 py-3 transition flex items-start justify-between gap-3 cursor-pointer ${
                    active ? 'bg-[#38BDF8]/[0.08]' : 'hover:bg-white/[0.035]'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono-tactical text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${hit.badgeColor}`}
                      >
                        {hit.badge}
                      </span>
                      <span className="text-sm font-medium text-white truncate">
                        {hit.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">{hit.subtitle}</p>
                  </div>
                  {active ? (
                    <CornerDownLeft className="w-4 h-4 text-[#38BDF8] shrink-0 mt-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[#0A0E17] border-t border-white/10 flex items-center justify-between text-[11px] font-mono-tactical text-gray-500">
          <span>↑↓ Navigate · ↵ Open entry or source drawer</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
