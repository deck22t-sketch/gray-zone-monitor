'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import { SourceLink } from '@/types/schemas';

function renderInlineEmphasis(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b-${counter++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`${keyPrefix}-i-${counter++}`} className="italic text-gray-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts;
}

export function RichTextWithCitations({
  text,
  contextLabel,
  className = '',
}: {
  text: string;
  contextLabel?: string;
  className?: string;
}) {
  const { openCitation, lookupSourceByUrl } = usePortal();

  const normalizedText = text
    .replace(/\*{1,2}(\[[^\]]+\]\(https?:\/\/[^)\s]+\))\*{1,2}/g, '$1')
    .replace(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\))\*;?\*\s*/g, '$1; ');

  const nodes: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = linkRegex.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      const chunk = normalizedText.slice(lastIndex, match.index);
      nodes.push(...renderInlineEmphasis(chunk, `chunk-${idx}`));
    }
    const label = match[1].replace(/\*\*/g, '').replace(/\*/g, '').trim();
    const url = match[2].trim();
    const meta = lookupSourceByUrl(url);
    let hostname = '';
    try {
      hostname = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      hostname = url;
    }

    nodes.push(
      <button
        key={`cite-${idx++}`}
        type="button"
        title={`${label} (${hostname}) — Click to inspect in Source Drawer`}
        onClick={() =>
          openCitation({
            title: label,
            url,
            category: meta?.category,
            domainTag: meta?.domainTag,
            context: contextLabel,
          })
        }
        className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/25 text-[#38BDF8] font-mono-tactical text-[11px] leading-tight align-baseline transition cursor-pointer"
      >
        <span>{label}</span>
        <ArrowUpRight className="w-3 h-3 opacity-80" />
      </button>
    );

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < normalizedText.length) {
    nodes.push(...renderInlineEmphasis(normalizedText.slice(lastIndex), `tail-${idx}`));
  }

  return <span className={className}>{nodes}</span>;
}

export function CitationChipList({
  sources,
  contextLabel,
}: {
  sources: SourceLink[];
  contextLabel?: string;
}) {
  const { openCitation, lookupSourceByUrl } = usePortal();

  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sources.map((src, i) => {
        const meta = lookupSourceByUrl(src.url);
        let host = '';
        try {
          host = new URL(src.url).hostname.replace(/^www\./, '');
        } catch {
          host = src.url;
        }
        return (
          <button
            key={`${src.url}-${i}`}
            type="button"
            title={`${src.label} (${host}) — Click to inspect in Source Drawer`}
            onClick={() =>
              openCitation({
                title: src.label,
                url: src.url,
                category: meta?.category,
                domainTag: meta?.domainTag,
                context: contextLabel,
              })
            }
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#38BDF8]/15 border border-white/10 hover:border-[#38BDF8]/35 text-xs font-mono-tactical text-gray-300 hover:text-[#38BDF8] transition cursor-pointer"
          >
            <span>{src.label}</span>
            <ArrowUpRight className="w-3 h-3 text-[#38BDF8]" />
          </button>
        );
      })}
    </div>
  );
}
