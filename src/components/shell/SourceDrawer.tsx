'use client';

import React, { useRef, useState } from 'react';
import { X, ExternalLink, Copy, Check, Shield, Link2 } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { classifySourceTier } from '@/lib/evidence';

export function SourceDrawer() {
  const { activeCitation, closeCitation, bundle, openCitation } = usePortal();
  const [copied, setCopied] = useState(false);
  const touchStartY = useRef<number | null>(null);

  if (!activeCitation) return null;

  let hostname = '';
  let isHttps = false;
  try {
    const parsed = new URL(activeCitation.url);
    hostname = parsed.hostname.replace(/^www\./, '');
    isHttps = parsed.protocol === 'https:';
  } catch {
    hostname = activeCitation.url;
  }

  const tier = classifySourceTier(activeCitation.url, activeCitation.title);
  const tierBadgeClass =
    tier.tone === 'emerald'
      ? 'bg-[#10B981]/15 border-[#10B981]/35 text-[#10B981]'
      : tier.tone === 'cyan'
      ? 'bg-[#38BDF8]/15 border-[#38BDF8]/35 text-[#38BDF8]'
      : 'bg-[#F59E0B]/15 border-[#F59E0B]/35 text-[#F59E0B]';

  const relatedSources = bundle.sections.primarySources
    .filter(
      (s) =>
        s.domainTag === activeCitation.domainTag && s.url !== activeCitation.url
    )
    .slice(0, 5);

  function handleCopyUrl() {
    if (!activeCitation) return;
    navigator.clipboard.writeText(activeCitation.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end bg-black/60 backdrop-blur-xs print:hidden">
      <div
        className="fixed inset-0"
        onClick={closeCitation}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Primary Source Inspector"
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartY.current === null) return;
          const deltaY = (e.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
          touchStartY.current = null;
          if (deltaY > 75) {
            closeCitation();
          }
        }}
        className="relative z-10 w-full md:max-w-md bg-[#111827] border-t md:border-t-0 md:border-l border-white/15 rounded-t-2xl md:rounded-none max-h-[78vh] md:max-h-none md:h-full flex flex-col justify-between p-5 sm:p-6 overflow-y-auto shadow-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="space-y-4">
          {/* Mobile Bottom-Sheet Drag Handle */}
          <div className="md:hidden flex justify-center -mt-1 pb-1">
            <span className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <p className="font-mono-tactical text-[11px] uppercase tracking-widest text-[#38BDF8]">
                Verified Citation Inspector
              </p>
              <h2 className="text-base font-semibold text-white mt-1 leading-snug">
                {activeCitation.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCitation}
              aria-label="Close source drawer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="glass-card rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-400 font-mono-tactical">SOURCE TIER</span>
                <span
                  className={`px-2 py-0.5 rounded border font-mono-tactical text-[11px] font-medium ${tierBadgeClass}`}
                >
                  {tier.shortBadge}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{tier.rationale}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
                <span className="text-gray-400 font-mono-tactical">DOMAIN TAG</span>
                <span className="px-2 py-0.5 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] font-mono-tactical">
                  {activeCitation.domainTag || 'Primary Source'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono-tactical">PUBLISHER HOST</span>
                <span className="text-white font-mono-tactical">{hostname}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono-tactical">TRANSPORT</span>
                <span className="inline-flex items-center gap-1 font-mono-tactical text-gray-200">
                  <Shield
                    className={`w-3.5 h-3.5 ${
                      isHttps ? 'text-[#10B981]' : 'text-[#F59E0B]'
                    }`}
                  />
                  {isHttps ? 'HTTPS TLS Verified' : 'Legacy HTTP Archive'}
                </span>
              </div>
              {activeCitation.category && (
                <div className="pt-2 border-t border-white/[0.07]">
                  <span className="block text-gray-400 font-mono-tactical mb-1">
                    BRIEFING DOSSIER CLUSTER
                  </span>
                  <span className="text-gray-200">{activeCitation.category}</span>
                </div>
              )}
              {activeCitation.context && (
                <div className="pt-2 border-t border-white/[0.07]">
                  <span className="block text-gray-400 font-mono-tactical mb-1">
                    REFERENCED FROM
                  </span>
                  <span className="text-gray-200">{activeCitation.context}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-[#0A0E17] border border-white/10 p-3">
              <p className="font-mono-tactical text-[11px] text-gray-400 mb-1">CANONICAL URI</p>
              <p className="font-mono-tactical text-xs text-gray-200 break-all">
                {activeCitation.url}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <a
                href={activeCitation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 px-3.5 py-2.5 text-xs font-medium text-[#38BDF8] transition"
              >
                <span>Open Primary Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2.5 text-xs font-mono-tactical text-gray-200 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {relatedSources.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <p className="font-mono-tactical text-[11px] uppercase tracking-wider text-gray-400">
                Related Sources in {activeCitation.domainTag}
              </p>
              <div className="space-y-1.5">
                {relatedSources.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() =>
                      openCitation({
                        title: rel.title,
                        url: rel.url,
                        category: rel.category,
                        domainTag: rel.domainTag,
                      })
                    }
                    className="w-full text-left rounded-lg p-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] transition cursor-pointer flex items-start gap-2"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">{rel.title}</p>
                      <p className="text-[11px] text-gray-400 truncate">{rel.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] font-mono-tactical text-gray-500 pt-4 border-t border-white/10 mt-4">
          Canonical Source Vault · {bundle.sections.primarySources.length} verified URLs indexed
        </p>
      </aside>
    </div>
  );
}
