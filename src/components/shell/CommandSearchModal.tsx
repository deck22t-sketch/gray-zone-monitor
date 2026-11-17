'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';

interface SearchHit {
  id: string;
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
  const router = useRouter();

  const allItems = useMemo<SearchHit[]>(() => {
    const items: SearchHit[] = [];

    for (const r of bundle.riskMatrix) {
      items.push({
        id: `risk-${r.id}`,
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
    if (!q) return allItems.slice(0, 14);
    return allItems
      .filter((item) =>
        `${item.badge} ${item.title} ${item.subtitle}`.toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [allItems, query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/70 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setSearchOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Global Intelligence Search"
        className="relative z-10 w-full max-w-2xl rounded-xl bg-[#111827] border border-white/15 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-4 h-4 text-[#38BDF8]" />
          <input
            id="global-cmdk-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 8 risk vectors, 10 incidents, 9 watchlist signals, live OSINT, or 86 primary sources…"
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded bg-white/5 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto divide-y divide-white/[0.06]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No intelligence entries matched &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
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
                }}
                className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-tactical text-[10px] px-1.5 py-0.5 rounded border ${hit.badgeColor}`}
                    >
                      {hit.badge}
                    </span>
                    <span className="text-sm font-medium text-white truncate">
                      {hit.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">{hit.subtitle}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-[#0A0E17] border-t border-white/10 flex items-center justify-between text-[11px] font-mono-tactical text-gray-500">
          <span>Click any result to jump or inspect source</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
