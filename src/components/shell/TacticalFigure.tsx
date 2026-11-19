'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X } from 'lucide-react';

export interface TacticalMetricPill {
  label: string;
  value: string;
  tone?: 'crimson' | 'amber' | 'cyan' | 'emerald' | 'neutral';
}

interface TacticalFigureProps {
  /** Path under public/, e.g. "/images/geopolitics-imperial-arc.jpg" */
  src: string;
  alt: string;
  plateId: string;
  title: string;
  caption: string;
  domainBadge?: string;
  metrics?: TacticalMetricPill[];
  aspectClassName?: string;
  priority?: boolean;
}

const TONE_CLASSES: Record<NonNullable<TacticalMetricPill['tone']>, string> = {
  crimson: 'border-[#EF4444]/35 bg-[#EF4444]/10 text-[#EF4444]',
  amber: 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#F59E0B]',
  cyan: 'border-[#38BDF8]/35 bg-[#38BDF8]/10 text-[#38BDF8]',
  emerald: 'border-[#10B981]/35 bg-[#10B981]/10 text-[#10B981]',
  neutral: 'border-white/15 bg-white/[0.05] text-gray-200',
};

export function resolvePublicAssetPath(assetPath: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${basePath}${normalized}`;
}

export function TacticalFigure({
  src,
  alt,
  plateId,
  title,
  caption,
  domainBadge,
  metrics,
  aspectClassName = 'aspect-[16/9] sm:aspect-[21/9]',
  priority = false,
}: TacticalFigureProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const resolvedSrc = resolvePublicAssetPath(src);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen]);

  return (
    <>
      <figure className="glass-panel tac-frame rounded-lg overflow-hidden">
        {/* Top Plate Telemetry Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#070A10] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tactical text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#38BDF8]/12 border border-[#38BDF8]/35 text-[#38BDF8]">
              {plateId}
            </span>
            <span className="text-xs sm:text-sm font-medium text-white">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {domainBadge && (
              <span className="hidden md:inline-block font-mono-tactical text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-white/[0.04] border border-white/10 text-gray-400">
                {domainBadge}
              </span>
            )}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/[0.04] hover:bg-white/[0.1] border border-white/14 font-mono-tactical text-[11px] text-gray-200 hover:text-white transition cursor-pointer"
              aria-label={`Expand ${plateId}: ${title}`}
            >
              <Maximize2 className="w-3 h-3 text-[#38BDF8]" />
              <span>Inspect</span>
            </button>
          </div>
        </div>

        {/* Visual Frame */}
        <div
          onClick={() => setLightboxOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setLightboxOpen(true);
            }
          }}
          className={`relative w-full ${aspectClassName} bg-[#06080C] overflow-hidden group cursor-zoom-in`}
        >
          <img
            src={resolvedSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06080C]/80 via-transparent to-[#06080C]/25" />
        </div>

        {/* Footer Caption & Telemetry Strip */}
        <figcaption className="px-4 sm:px-5 py-3 bg-[#0B0F17] border-t border-white/10 space-y-2.5">
          {metrics && metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metrics.map((m) => {
                const toneClass = TONE_CLASSES[m.tone ?? 'neutral'];
                return (
                  <div
                    key={m.label}
                    className={`rounded-sm px-2.5 py-1.5 border ${toneClass} flex flex-col justify-between`}
                  >
                    <span className="font-mono-tactical text-[10px] uppercase tracking-wider opacity-80">
                      {m.label}
                    </span>
                    <span className="font-mono-tactical text-xs font-semibold mt-0.5">
                      {m.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-300 leading-relaxed">{caption}</p>
        </figcaption>
      </figure>

      {/* Full-Resolution Lightbox Modal */}
      {lightboxOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-[#06080C]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${plateId} — ${title}`}
          >
            <div
              className="max-w-5xl w-full obsidian-surface rounded-lg overflow-hidden shadow-2xl border border-white/20 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-[#070A10]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono-tactical text-xs px-2 py-0.5 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/35 text-[#38BDF8] shrink-0">
                    {plateId}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-white truncate">{title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-gray-300 hover:text-white transition cursor-pointer shrink-0"
                  aria-label="Close plate preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#0A0E17] max-h-[70dvh] flex items-center justify-center overflow-hidden">
                <img
                  src={resolvedSrc}
                  alt={alt}
                  className="w-full h-auto max-h-[70dvh] object-contain"
                />
              </div>

              <div className="px-4 sm:px-5 py-3 border-t border-white/10 text-xs text-gray-300 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#070A10]">
                <p>{caption}</p>
                <span className="font-mono-tactical text-[11px] text-gray-500 shrink-0">
                  ESC to close
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
