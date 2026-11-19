'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { ContentBlock, NarrativeSection } from '@/types/schemas';
import { RichTextWithCitations } from './RichTextWithCitations';

function RenderBlocks({ blocks, contextLabel }: { blocks: ContentBlock[]; contextLabel: string }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, bIdx) => {
        if (block.type === 'paragraph') {
          return (
            <p
              key={bIdx}
              className="text-[13.5px] sm:text-sm text-gray-200 leading-[1.72] max-w-4xl"
            >
              <RichTextWithCitations text={block.text} contextLabel={contextLabel} />
            </p>
          );
        }
        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={bIdx}
              className={`space-y-2.5 pl-5 text-[13.5px] sm:text-sm text-gray-200 leading-[1.7] max-w-4xl ${
                block.ordered ? 'list-decimal' : 'list-disc'
              }`}
            >
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="pl-1">
                  <RichTextWithCitations text={item.text} contextLabel={contextLabel} />
                </li>
              ))}
            </ListTag>
          );
        }
        if (block.type === 'table') {
          return (
            <div key={bIdx} className="overflow-x-auto rounded-xl border border-white/10 my-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0E131D] border-b border-white/[0.08]">
                    {block.table.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-4 py-3 font-mono-tactical uppercase tracking-wider text-[11px] text-gray-300"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07] bg-[#0A0E17]/60">
                  {block.table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.03]">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-3 text-gray-200 align-top leading-relaxed"
                        >
                          <RichTextWithCitations text={cell} contextLabel={contextLabel} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export function NarrativeAccordion({
  sections,
  heading = 'Canonical Executive Briefing Narrative & Verbatim Evidence',
  defaultOpenFirst = false,
  id,
}: {
  sections: NarrativeSection[];
  heading?: string;
  defaultOpenFirst?: boolean;
  id?: string;
}) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    if (defaultOpenFirst && sections[0]) {
      return { [sections[0].id]: true };
    }
    return {};
  });

  function toggle(secId: string) {
    setOpenIds((prev) => ({ ...prev, [secId]: !prev[secId] }));
  }

  if (sections.length === 0) return null;

  const allExpanded = sections.every((s) => openIds[s.id]);

  return (
    <section id={id} className="space-y-3.5 scroll-mt-nav">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="text-sm font-mono-tactical uppercase tracking-wider text-white">
            {heading}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            const next: Record<string, boolean> = {};
            if (!allExpanded) {
              sections.forEach((s) => {
                next[s.id] = true;
              });
            }
            setOpenIds(next);
          }}
          className="px-3 py-1 rounded-sm bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono-tactical text-[#38BDF8] transition cursor-pointer"
        >
          {allExpanded ? 'Collapse All Verbatim Sections' : 'Expand All Verbatim Sections'}
        </button>
      </div>

      <div className="space-y-2.5">
        {sections.map((sec) => {
          const isOpen = Boolean(openIds[sec.id]);
          return (
            <div key={sec.id} className="glass-card rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(sec.id)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left cursor-pointer hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-tactical text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#06080C] border border-white/15 text-[#38BDF8] shrink-0">
                    SEC {sec.number}
                  </span>
                  <span className="font-semibold text-sm sm:text-base text-white truncate">
                    {sec.title}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-mono-tactical text-gray-400 shrink-0">
                  <span className="hidden sm:inline">
                    {sec.subsections.length} subsection{sec.subsections.length === 1 ? '' : 's'}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#38BDF8]" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-white/[0.08] space-y-6 bg-[#070A10]">
                  {sec.blocks.length > 0 && (
                    <RenderBlocks
                      blocks={sec.blocks}
                      contextLabel={`Section ${sec.number}: ${sec.title}`}
                    />
                  )}
                  {sec.subsections.map((sub) => (
                    <div
                      key={sub.id}
                      className="space-y-3 pt-4 border-t border-white/[0.06] pl-3 sm:pl-4 border-l-2 border-l-[#38BDF8]/40"
                    >
                      <h3 className="text-sm sm:text-base font-semibold text-white flex flex-wrap items-center gap-2">
                        <span className="font-mono-tactical text-xs px-2 py-0.5 rounded-sm bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]">
                          {sub.code}
                        </span>
                        <span>{sub.title}</span>
                      </h3>
                      <RenderBlocks
                        blocks={sub.blocks}
                        contextLabel={`Section ${sub.code}: ${sub.title}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
