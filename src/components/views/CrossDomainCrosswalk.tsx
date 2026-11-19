'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { GitMerge, ArrowUpRight, Sparkles, RotateCcw } from 'lucide-react';
import { usePortal } from '@/context/PortalContext';
import {
  buildCrossDomainGraph,
  CrossDomainColumn,
  CrossDomainNode,
} from '@/lib/evidence';

interface CrossDomainCrosswalkProps {
  focusedKey: string;
  onFocusKey: (key: string) => void;
}

const COLUMNS: Array<{ key: CrossDomainColumn; code: string; label: string }> = [
  { key: 'risk', code: '01', label: 'Risk Vectors' },
  { key: 'incident', code: '02', label: 'Tracked Wave' },
  { key: 'watchlist', code: '03', label: 'Watchlist' },
  { key: 'cliff', code: '04', label: '120d Cliffs' },
  { key: 'signal', code: '05', label: 'Live OSINT' },
];

const COL_INDEX: Record<CrossDomainColumn, number> = {
  risk: 0,
  incident: 1,
  watchlist: 2,
  cliff: 3,
  signal: 4,
};

// Exact horizontal coordinates in a 1000-unit space matching 5 columns of 18% width + 4 gaps of 2.5%
const COL_BOUNDS = [
  { left: 0, right: 180 },
  { left: 205, right: 385 },
  { left: 410, right: 590 },
  { left: 615, right: 795 },
  { left: 820, right: 1000 },
] as const;

const HEADER_OFFSET_PX = 36;
const CARD_HEIGHT_PX = 50;
const CARD_GAP_PX = 8;
const ROW_PITCH_PX = CARD_HEIGHT_PX + CARD_GAP_PX;

function edgeHex(tone: 'crimson' | 'amber' | 'cyan'): string {
  if (tone === 'crimson') return '#EF4444';
  if (tone === 'amber') return '#F59E0B';
  return '#38BDF8';
}

function nodeToneClasses(tone: CrossDomainNode['tone'], highlighted: boolean, focused: boolean) {
  if (focused) {
    if (tone === 'crimson') return 'bg-[#EF4444]/20 border-[#EF4444] text-white ring-1 ring-[#EF4444]/50';
    if (tone === 'amber') return 'bg-[#F59E0B]/20 border-[#F59E0B] text-white ring-1 ring-[#F59E0B]/50';
    if (tone === 'emerald') return 'bg-[#10B981]/20 border-[#10B981] text-white ring-1 ring-[#10B981]/50';
    return 'bg-[#38BDF8]/20 border-[#38BDF8] text-white ring-1 ring-[#38BDF8]/50';
  }
  if (highlighted) {
    return 'bg-[#141D2F] border-[#38BDF8]/55 text-gray-100';
  }
  return 'bg-[#0E1524]/85 border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/25';
}

export function CrossDomainCrosswalk({ focusedKey, onFocusKey }: CrossDomainCrosswalkProps) {
  const { bundle } = usePortal();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [mobilePivotColumn, setMobilePivotColumn] = useState<CrossDomainColumn>('incident');

  const graph = useMemo(() => buildCrossDomainGraph(bundle), [bundle]);

  const activeKey =
    hoveredKey && graph.nodeMap[hoveredKey]
      ? hoveredKey
      : graph.nodeMap[focusedKey]
      ? focusedKey
      : 'inc:#2';

  const activeNode = graph.nodeMap[activeKey] ?? graph.nodes[0];
  const connectedSet = useMemo(() => {
    const s = new Set<string>([activeKey]);
    for (const neighbor of graph.adjacency[activeKey] ?? []) {
      s.add(neighbor);
    }
    return s;
  }, [graph.adjacency, activeKey]);

  const nodesByColumn = useMemo(() => {
    const grouped: Record<CrossDomainColumn, CrossDomainNode[]> = {
      risk: [],
      incident: [],
      watchlist: [],
      cliff: [],
      signal: [],
    };
    for (const n of graph.nodes) {
      grouped[n.column].push(n);
    }
    return grouped;
  }, [graph.nodes]);

  const nodeCoords = useMemo(() => {
    const map: Record<string, { colIdx: number; rowIdx: number; yCenter: number }> = {};
    for (const col of COLUMNS) {
      const colIdx = COL_INDEX[col.key];
      nodesByColumn[col.key].forEach((node, rowIdx) => {
        map[node.key] = {
          colIdx,
          rowIdx,
          yCenter: HEADER_OFFSET_PX + rowIdx * ROW_PITCH_PX + CARD_HEIGHT_PX / 2,
        };
      });
    }
    return map;
  }, [nodesByColumn]);

  const maxRows = Math.max(
    1,
    ...COLUMNS.map((c) => nodesByColumn[c.key].length)
  );
  const canvasHeightPx = HEADER_OFFSET_PX + maxRows * ROW_PITCH_PX;

  const correlatedByColumn = useMemo(() => {
    const neighborKeys = graph.adjacency[activeKey] ?? [];
    const grouped: Record<CrossDomainColumn, CrossDomainNode[]> = {
      risk: [],
      incident: [],
      watchlist: [],
      cliff: [],
      signal: [],
    };
    for (const k of neighborKeys) {
      const n = graph.nodeMap[k];
      if (n) grouped[n.column].push(n);
    }
    return grouped;
  }, [graph, activeKey]);

  function handleMobileSelect(node: CrossDomainNode) {
    setMobilePivotColumn(node.column);
    onFocusKey(node.key);
  }

  return (
    <section
      id="crosswalk-section"
      aria-labelledby="crosswalk-heading"
      className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-nav"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2
            id="crosswalk-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white flex items-center gap-2"
          >
            <GitMerge className="w-4 h-4 text-[#38BDF8]" />
            <span>Cross-Domain Dependency &amp; Blast-Radius Crosswalk</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Select any Risk Vector, Outage Event, Watchlist Indicator, or Countdown Cliff to trace
            correlated upstream triggers and downstream exposure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tactical">
          {activeNode && (
            <span className="px-2.5 py-1 rounded-lg bg-[#38BDF8]/12 border border-[#38BDF8]/35 text-[#38BDF8]">
              Focused: {activeNode.code} · {(graph.adjacency[activeKey] ?? []).length} Linked Nodes
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setHoveredKey(null);
              onFocusKey('inc:#2');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/12 text-gray-300 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Event #2</span>
          </button>
        </div>
      </div>

      {/* Focused Node Inspector Banner (shared across Desktop & Mobile) */}
      {activeNode && (
        <div className="surface-elevated rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-tactical text-[11px] font-semibold px-2 py-0.5 rounded bg-[#0A0E17] border border-white/15 text-[#38BDF8]">
                {activeNode.code}
              </span>
              <span className="font-mono-tactical text-[11px] text-gray-400 uppercase">
                {activeNode.subtitle}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">
              {activeNode.title}
            </h3>
          </div>

          <Link
            href={activeNode.href}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-xs font-mono-tactical text-[#38BDF8] transition self-start sm:self-center"
          >
            <span>Open Section Dossier</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* =====================================================================
          MODE A (Desktop >= 1024px): 5-Column Interactive SVG Circuit-Wiring Graph
          ===================================================================== */}
      <div
        className="hidden lg:block relative w-full select-none"
        style={{ height: `${canvasHeightPx}px` }}
      >
        {/* SVG Cubic-Bezier Wiring Layer */}
        <svg
          viewBox={`0 0 1000 ${canvasHeightPx}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          aria-hidden="true"
        >
          {graph.edges.map((edge, idx) => {
            const cA = nodeCoords[edge.from];
            const cB = nodeCoords[edge.to];
            if (!cA || !cB) return null;

            const leftNode = cA.colIdx <= cB.colIdx ? cA : cB;
            const rightNode = cA.colIdx <= cB.colIdx ? cB : cA;

            const x1 = COL_BOUNDS[leftNode.colIdx].right;
            const y1 = leftNode.yCenter;
            const x2 = COL_BOUNDS[rightNode.colIdx].left;
            const y2 = rightNode.yCenter;
            const midX = (x1 + x2) / 2;

            const isActiveEdge = edge.from === activeKey || edge.to === activeKey;
            const stroke = isActiveEdge ? edgeHex(edge.tone) : 'rgba(148, 163, 184, 0.14)';

            return (
              <path
                key={`${edge.from}-${edge.to}-${idx}`}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={stroke}
                strokeWidth={isActiveEdge ? 2.1 : 0.9}
                strokeOpacity={isActiveEdge ? 0.9 : 0.32}
              />
            );
          })}
        </svg>

        {/* 5 Exact-Width Node Columns (5 * 18% + 4 * 2.5% = 100%) */}
        <div className="relative z-10 grid grid-cols-[18%_18%_18%_18%_18%] justify-between h-full">
          {COLUMNS.map((col) => {
            const colNodes = nodesByColumn[col.key];
            return (
              <div key={col.key} className="flex flex-col">
                <div className="h-[28px] mb-[8px] px-2 rounded-md bg-[#0A0E17]/90 border border-white/10 flex items-center justify-between text-[10px] font-mono-tactical text-gray-300 uppercase">
                  <span>
                    {col.code} · {col.label}
                  </span>
                  <span className="text-gray-500">{colNodes.length}</span>
                </div>

                <div className="flex flex-col gap-[8px]">
                  {colNodes.map((node) => {
                    const isFocused = node.key === activeKey;
                    const isConnected = connectedSet.has(node.key);
                    const dimmed = !isConnected;
                    return (
                      <button
                        key={node.key}
                        type="button"
                        onClick={() => onFocusKey(node.key)}
                        onMouseEnter={() => setHoveredKey(node.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        title={`${node.code}: ${node.title}`}
                        className={`h-[50px] px-2.5 py-1.5 rounded-lg border text-left transition flex flex-col justify-center cursor-pointer ${nodeToneClasses(
                          node.tone,
                          isConnected,
                          isFocused
                        )} ${dimmed ? 'opacity-40' : 'opacity-100'}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono-tactical text-[9.5px] font-semibold text-[#38BDF8] truncate">
                            {node.code}
                          </span>
                          {isFocused && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] font-medium leading-tight truncate mt-0.5">
                          {node.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          MODE B (Mobile & Tablet < 1024px): Touch "Focus-Pivot Stack"
          ===================================================================== */}
      <div className="lg:hidden space-y-4">
        {/* Step 1: Choose Domain Category */}
        <div className="grid grid-cols-4 gap-1.5">
          {COLUMNS.slice(0, 4).map((col) => {
            const active = mobilePivotColumn === col.key;
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => {
                  setMobilePivotColumn(col.key);
                  const first = nodesByColumn[col.key][0];
                  if (first) onFocusKey(first.key);
                }}
                className={`py-2 px-2 rounded-lg text-[11px] font-mono-tactical border text-center transition cursor-pointer ${
                  active
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-[#0A0E17] border-white/10 text-gray-400'
                }`}
              >
                {col.label}
              </button>
            );
          })}
        </div>

        {/* Step 2: Horizontal Pill Picker for Active Category */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {nodesByColumn[mobilePivotColumn].map((node) => {
            const selected = node.key === activeKey;
            return (
              <button
                key={node.key}
                type="button"
                onClick={() => handleMobileSelect(node)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
                  selected
                    ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white'
                    : 'bg-[#0E1524] border-white/10 text-gray-300'
                }`}
              >
                {node.code} · {node.title.slice(0, 24)}
                {node.title.length > 24 ? '…' : ''}
              </button>
            );
          })}
        </div>

        {/* Step 3: Vertical Correlated Blast-Radius Stack */}
        <div className="space-y-3">
          {COLUMNS.map((col) => {
            const matches = correlatedByColumn[col.key];
            if (!matches || matches.length === 0) return null;
            return (
              <div
                key={col.key}
                className="obsidian-surface rounded-xl p-3.5 space-y-2 border border-white/10"
              >
                <div className="flex items-center justify-between text-[10px] font-mono-tactical uppercase text-gray-400">
                  <span className="inline-flex items-center gap-1 text-[#38BDF8]">
                    <Sparkles className="w-3 h-3" />
                    <span>Correlated {col.label}</span>
                  </span>
                  <span>{matches.length} linked</span>
                </div>

                <div className="space-y-1.5">
                  {matches.map((m) => (
                    <div
                      key={m.key}
                      className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-2.5 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => handleMobileSelect(m)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="font-mono-tactical text-[10px] text-[#F59E0B] block">
                          {m.code} · Tap to Pivot
                        </span>
                        <span className="text-xs font-medium text-white line-clamp-1">
                          {m.title}
                        </span>
                      </button>

                      <Link
                        href={m.href}
                        aria-label={`Open ${m.code}`}
                        className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-[#38BDF8] shrink-0"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
