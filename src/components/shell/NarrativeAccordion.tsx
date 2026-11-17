'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { ContentBlock, NarrativeSection } from '@/types/schemas';
import { RichTextWithCitations } from './RichTextWithCitations';

function RenderBlocks({ blocks, contextLabel }: { blocks: ContentBlock[]; contextLabel: string }) {
  return (
    <div className="space-y-3.5">
      {blocks.map((block, bIdx) => {
        if (block.type === 'paragraph') {
          return (
            <p key={bIdx} className="text-sm text-gray-300 leading-relaxed">
              <RichTextWithCitations text={block.text} contextLabel={contextLabel} />
            </p>
          );
        }
        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={bIdx}
              className={`space-y-2 pl-5 text-sm text-gray-300 leading-relaxed ${
                block.ordered ? 'list-decimal' : 'list-disc'
              }`}
            >
              {block.items.map((item, iIdx) => (
                <li key={iIdx}>
                  <RichTextWithCitations text={item.text} contextLabel={contextLabel} />
                </li>
              ))}
            </ListTag>
          );
        }
        if (block.type === 'table') {
          return (
            <div key={bIdx} className="overflow-x-auto rounded-lg border border-white/10 my-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111827] border-b border-white/10">
                    {block.table.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3.5 py-2.5 font-mono-tactical uppercase tracking-wider text-[11px] text-gray-300"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {block.table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.025]">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2.5 text-gray-300 align-top leading-relaxed">
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
}: {
  sections: NarrativeSection[];
  heading?: string;
  defaultOpenFirst?: boolean;
}) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    if (defaultOpenFirst && sections[0]) {
      return { [sections[0].id]: true };
    }
    return {};
  });

  function toggle(id: string) {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (sections.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="text-sm font-mono-tactical uppercase tracking-wider text-gray-300">
            {heading}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            const allOpen = sections.every((s) => openIds[s.id]);
            const next: Record<string, boolean> = {};
            if (!allOpen) {
              sections.forEach((s) => {
                next[s.id] = true;
              });
            }
            setOpenIds(next);
          }}
          className="text-xs font-mono-tactical text-[#38BDF8] hover:underline cursor-pointer"
        >
          {sections.every((s) => openIds[s.id]) ? 'Collapse All Sections' : 'Expand All Sections'}
        </button>
      </div>

      <div className="space-y-2.5">
        {sections.map((sec) => {
          const isOpen = Boolean(openIds[sec.id]);
          return (
            <div key={sec.id} className="glass-card rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(sec.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-tactical text-xs px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[#38BDF8]">
                    SEC {sec.number}
                  </span>
                  <span className="font-medium text-sm text-white">{sec.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono-tactical text-gray-400">
                  <span>{sec.subsections.length} subsections</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#38BDF8]" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-white/[0.08] space-y-5">
                  {sec.blocks.length > 0 && (
                    <RenderBlocks
                      blocks={sec.blocks}
                      contextLabel={`Section ${sec.number}: ${sec.title}`}
                    />
                  )}
                  {sec.subsections.map((sub) => (
                    <div key={sub.id} className="space-y-2.5 pt-2 border-t border-white/[0.05]">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span className="font-mono-tactical text-xs text-[#F59E0B]">
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
