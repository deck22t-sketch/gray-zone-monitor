'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export interface SectionAnchorItem {
  id: string;
  code: string;
  label: string;
  badge?: string;
}

export function SectionNavStrip({
  items,
  ariaLabel = 'In-page section navigation',
}: {
  items: SectionAnchorItem[];
  ariaLabel?: string;
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (items.length === 0) return;

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 360);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.15, 0.4],
      }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [items]);

  // Keep the active section tab smoothly centered horizontally inside the sub-rail without vertical scroll jumps
  useEffect(() => {
    const track = scrollTrackRef.current;
    const activeEl = itemRefs.current[activeId];
    if (!track || !activeEl) return;

    const targetLeft =
      activeEl.offsetLeft - track.clientWidth / 2 + activeEl.clientWidth / 2;
    track.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, [activeId]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      style={{ top: 'var(--portal-header-h, 34px)' }}
      className="sticky z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-[#080B11]/[0.98] backdrop-blur-md border-y border-white/[0.11] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.95)] print:hidden"
    >
      <div className="flex items-center justify-between gap-2 h-10">
        {/* Scrollable horizontal section rail with subtle right-edge fade */}
        <div className="relative flex-1 min-w-0 h-full flex items-center">
          <div
            ref={scrollTrackRef}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full pr-8"
          >
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  href={`#${item.id}`}
                  onClick={() => setActiveId(item.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 h-full text-xs whitespace-nowrap transition border-b-2 shrink-0 ${
                    isActive
                      ? 'border-[#38BDF8] text-white font-medium bg-white/[0.03]'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.025]'
                  }`}
                >
                  <span
                    className={`font-mono-tactical text-[10px] ${
                      isActive ? 'text-[#38BDF8]' : 'text-gray-500'
                    }`}
                  >
                    {item.code}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="font-mono-tactical text-[10px] px-1.5 py-0.2 rounded-sm bg-white/[0.06] text-gray-300">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
          {/* Soft right-edge mask prevents abrupt mid-word clipping on narrow viewports */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-9 bg-gradient-to-l from-[#080B11] via-[#080B11]/85 to-transparent"
          />
        </div>

        {showBackToTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-white/[0.05] hover:bg-white/[0.11] border border-white/12 font-mono-tactical text-[11px] text-gray-300 hover:text-white shrink-0 cursor-pointer transition"
            aria-label="Scroll back to top"
          >
            <ArrowUp className="w-3 h-3 text-[#38BDF8]" />
            <span className="hidden sm:inline">Top</span>
          </button>
        )}
      </div>
    </nav>
  );
}
