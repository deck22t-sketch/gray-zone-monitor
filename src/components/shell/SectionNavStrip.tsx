'use client';

import React, { useEffect, useState } from 'react';
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
        rootMargin: '-140px 0px -62% 0px',
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

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-[102px] sm:top-[94px] z-30 -mx-1 px-1 py-1.5"
    >
      <div className="glass-panel rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-white font-medium'
                    : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
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
                  <span className="font-mono-tactical text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-gray-300">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {showBackToTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 font-mono-tactical text-[11px] text-gray-300 hover:text-white shrink-0 cursor-pointer transition"
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
