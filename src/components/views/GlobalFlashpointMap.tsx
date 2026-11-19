'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GitMerge,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { resolvePublicAssetPath } from '@/components/shell/TacticalFigure';

export type FlashpointLayer =
  | 'ALL'
  | 'BACKBONE'
  | 'KINETIC'
  | 'SUB_IP'
  | 'CLEARING';

interface FlashpointNode {
  id: string;
  code: string;
  name: string;
  region: string;
  coordsLabel: string;
  x: number;
  y: number;
  secondaryPoint?: { x: number; y: number; label: string };
  layer: Exclude<FlashpointLayer, 'ALL'>;
  tone: 'crimson' | 'amber' | 'cyan';
  verification: 'Corroborated' | 'Developing';
  headlineMetric: string;
  summary: string;
  exposure: string;
  traceKey: string;
  detailHref: string;
  detailLabel: string;
}

const FLASHPOINTS: FlashpointNode[] = [
  {
    id: 'fti-eldorado-amarillo',
    code: 'FP-01',
    name: 'El Dorado, AR ↔ Amarillo, TX (FAA FTI Backbone)',
    region: 'Continental U.S. Telecom Core',
    coordsLabel: '33.21°N 92.66°W · 35.22°N 101.83°W',
    x: 242,
    y: 170,
    secondaryPoint: { x: 212, y: 164, label: 'Amarillo Peer' },
    layer: 'BACKBONE',
    tone: 'amber',
    verification: 'Developing',
    headlineMetric: '17/22 ARTCCs · ~400 Routers Halted',
    summary:
      'Friday Nov. 13 cutover signed off 8 minutes prior triggered a peer broadcast flood (>1,000 attempts per 4–5s) from a 3-week-old Amarillo router across legacy TDM trunks.',
    exposure:
      'FAA halted Juniper rollout Nov. 17, reverted to legacy Cisco 6000 gear, and opened Florida FBI/L3Harris lab teardowns.',
    traceKey: 'inc:#2',
    detailHref: '/incidents#faa-teardown-section',
    detailLabel: 'Open Two-Router Teardown',
  },
  {
    id: 'us-east-clearing',
    code: 'FP-02',
    name: 'US East Clearing Corridor (NYC / NJ — DTCC & Instant Rails)',
    region: 'North American G-SIB & Repo Core',
    coordsLabel: '40.71°N 74.01°W',
    x: 294,
    y: 148,
    layer: 'CLEARING',
    tone: 'cyan',
    verification: 'Corroborated',
    headlineMetric: '~$550B/day Cash Clearing · Dec. 31',
    summary:
      'Nov. 16 Chase hardware/software bug cascaded across Zelle counterparties (BofA, Wells Fargo, Truist) ahead of mandatory SEC U.S. Treasury cash clearing concentration at DTCC/FICC.',
    exposure:
      '24/7 $10M RTP/FedNow instant rails create autonomous AI liquidity run risk when noisy outage telemetry spikes.',
    traceKey: 'risk:#5',
    detailHref: '/contagion',
    detailLabel: 'Inspect Clearing & Contagion',
  },
  {
    id: 'transatlantic-slte',
    code: 'FP-03',
    name: 'Transatlantic Subsea SLTE Landings (NY/NJ ↔ UK/EU)',
    region: 'North Atlantic Optical Trunk',
    coordsLabel: '40.6°N 73.9°W ↔ 50.1°N 5.5°W',
    x: 392,
    y: 134,
    layer: 'SUB_IP',
    tone: 'cyan',
    verification: 'Corroborated',
    headlineMetric: 'FCC 91 FR 73480 · Due Jan. 8, 2027',
    summary:
      'Nov. 16 FCC final rule tightens Submarine Line Terminal Equipment (SLTE) security oversight and mandates Foreign Adversary Annual Reports across wet/dry landing stations.',
    exposure:
      'Out-of-band optical terminal management interfaces bridge physical seabed trunks to carrier IP cores.',
    traceKey: 'cliff:2027-01-08',
    detailHref: '/incidents#sub-ip-section',
    detailLabel: 'Open Sub-IP Blind Spots',
  },
  {
    id: 'baltic-shadow-fleet',
    code: 'FP-04',
    name: 'Baltic Sea & Kaliningrad Subsea / GNSS Theater',
    region: 'Northern European Maritime Chokepoint',
    coordsLabel: '55.7°N 19.8°E',
    x: 548,
    y: 106,
    layer: 'SUB_IP',
    tone: 'crimson',
    verification: 'Developing',
    headlineMetric: 'Seabed Cable & Regional GNSS Jamming',
    summary:
      'Persistent gray-zone anchor-drag exposure across Baltic telecom/power interconnectors paired with regional AIS/GNSS navigation interference.',
    exposure:
      'Tests NATO/EU sub-threshold attribution thresholds below formal cyber war-exclusion triggers.',
    traceKey: 'risk:#8',
    detailHref: '/geopolitics',
    detailLabel: 'Explore Geopolitical Arc',
  },
  {
    id: 'hormuz-epic-fury',
    code: 'FP-05',
    name: 'Strait of Hormuz & Regional OT Wiper Theater',
    region: 'Persian Gulf Energy & Defense Corridor',
    coordsLabel: '26.56°N 56.25°E',
    x: 656,
    y: 206,
    layer: 'KINETIC',
    tone: 'crimson',
    verification: 'Corroborated',
    headlineMetric: '$38B Munitions Burn · CISA AA26-097A',
    summary:
      'Operation Epic Fury kinetic attrition coincides with Iranian-nexus PLC intrusions (ports 44818, 2222, 102, 502) and Check Point-to-ESXi destroy_v6 hypervisor wipers.',
    exposure:
      'Compounds U.S. precision-munitions industrial strain ahead of 2027 Indo-Pacific deterrence windows.',
    traceKey: 'risk:#3',
    detailHref: '/geopolitics#entente-section',
    detailLabel: 'View Attrition & Chokepoints',
  },
  {
    id: 'taiwan-mineral-chokepoint',
    code: 'FP-06',
    name: 'Taiwan Strait & Critical Mineral Export Controls',
    region: 'East Asia Semiconductor & REE Hub',
    coordsLabel: '24.5°N 119.5°E',
    x: 818,
    y: 204,
    layer: 'KINETIC',
    tone: 'crimson',
    verification: 'Corroborated',
    headlineMetric: 'Nov. 27 Ga/Ge/Sb · Jan. 10 REE Cliffs',
    summary:
      'Expiry of China’s gallium, germanium, and antimony export pause (Nov. 27) and 0.1% extraterritorial REE waiver (Jan. 10) following Nov. 16 U.S. BIS AI chip rules.',
    exposure:
      'Directly impacts AESA defense radars, RF semiconductors, NdFeB magnets, and 2027 Ro-Ro mobilization readiness.',
    traceKey: 'risk:#4',
    detailHref: '/geopolitics#entente-section',
    detailLabel: 'Inspect Mineral Chokepoints',
  },
  {
    id: 'nopac-gnss-airways',
    code: 'FP-07',
    name: 'NOPAC Airways R220 / R580 GNSS Spoofing Corridor',
    region: 'North Pacific U.S.–Asia Flight Routes',
    coordsLabel: '48.0°N 165.0°E',
    x: 896,
    y: 134,
    layer: 'SUB_IP',
    tone: 'amber',
    verification: 'Corroborated',
    headlineMetric: '+193% GNSS Spoofing · >100 Flights',
    summary:
      'Silent GPS/GNSS spoofing along North Pacific airways R220/R580 induces false EGPWS terrain alerts and 12-hour UTC clock shifts without loss-of-signal alarms.',
    exposure:
      'Parallel RF timing vector threatens rooftop IEEE 1588 PTP clocks at financial trading centers and grid substations.',
    traceKey: 'risk:#6',
    detailHref: '/incidents#sub-ip-section',
    detailLabel: 'Inspect GNSS & PTP Timing',
  },
];

const LAYER_OPTIONS: Array<{ id: FlashpointLayer; label: string }> = [
  { id: 'ALL', label: 'All Nodes (7)' },
  { id: 'BACKBONE', label: 'Telecom Core' },
  { id: 'KINETIC', label: 'Chokepoints & OT' },
  { id: 'SUB_IP', label: 'Sub-IP & Subsea' },
  { id: 'CLEARING', label: 'Clearing Rails' },
];

function toneHex(tone: FlashpointNode['tone']): string {
  if (tone === 'crimson') return '#EF4444';
  if (tone === 'amber') return '#F59E0B';
  return '#38BDF8';
}

interface GlobalFlashpointMapProps {
  onTraceNode: (traceKey: string) => void;
}

export function GlobalFlashpointMap({ onTraceNode }: GlobalFlashpointMapProps) {
  const [layer, setLayer] = useState<FlashpointLayer>('ALL');
  const [selectedId, setSelectedId] = useState<string>('fti-eldorado-amarillo');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showRasterCompare, setShowRasterCompare] = useState(false);

  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const rasterPlateSrc = resolvePublicAssetPath('/images/overview-backbone-map.jpg');

  const visibleNodes = useMemo(() => {
    if (layer === 'ALL') return FLASHPOINTS;
    return FLASHPOINTS.filter((n) => n.layer === layer);
  }, [layer]);

  const selectedNode = useMemo(() => {
    return (
      visibleNodes.find((n) => n.id === selectedId) ??
      visibleNodes[0] ??
      FLASHPOINTS[0]
    );
  }, [visibleNodes, selectedId]);

  function adjustZoom(delta: number) {
    setZoom((prev) => {
      const next = Math.min(2.4, Math.max(1, Number((prev + delta).toFixed(2))));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function resetViewport() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <section
      id="flashpoint-map-section"
      aria-labelledby="flashpoint-map-heading"
      className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 scroll-mt-nav"
    >
      {/* Header & Layer Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2
            id="flashpoint-map-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-[#38BDF8]" />
            <span>Global Flashpoint, Subsea &amp; Backbone Vector Map</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Tap or click any theater node to inspect verification status, physical/logical exposure,
            and jump into the dependency crosswalk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {LAYER_OPTIONS.map((opt) => {
            const active = layer === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLayer(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-tactical border transition cursor-pointer ${
                  active
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowRasterCompare((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono-tactical border transition cursor-pointer ${
              showRasterCompare
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]'
                : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>{showRasterCompare ? 'Interactive Vector' : 'Plate 00 Artwork'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Interactive Map Canvas (8 cols) + Selected Node Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 relative obsidian-surface rounded-xl overflow-hidden border border-white/12 min-h-[260px] sm:min-h-[340px] flex items-center justify-center">
          {showRasterCompare ? (
            <img
              src={rasterPlateSrc}
              alt="Transatlantic submarine optical cable landings and continental corridors illustration"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <div
                onPointerDown={(e) => {
                  if (zoom <= 1) return;
                  dragStart.current = {
                    x: e.clientX,
                    y: e.clientY,
                    panX: pan.x,
                    panY: pan.y,
                  };
                }}
                onPointerMove={(e) => {
                  if (!dragStart.current || zoom <= 1) return;
                  const dx = e.clientX - dragStart.current.x;
                  const dy = e.clientY - dragStart.current.y;
                  setPan({
                    x: Math.max(-240, Math.min(240, dragStart.current.panX + dx)),
                    y: Math.max(-140, Math.min(140, dragStart.current.panY + dy)),
                  });
                }}
                onPointerUp={() => {
                  dragStart.current = null;
                }}
                onPointerLeave={() => {
                  dragStart.current = null;
                }}
                className={`w-full h-full select-none ${
                  zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                }`}
              >
                <svg
                  viewBox="0 0 1000 460"
                  className="w-full h-full"
                  role="img"
                  aria-label="Interactive global infrastructure flashpoint vector map"
                >
                  <g
                    transform={`translate(${500 + pan.x}, ${230 + pan.y}) scale(${zoom}) translate(-500, -230)`}
                  >
                    {/* Subtle Equator & Tropic Reference Arcs */}
                    <line
                      x1="20"
                      y1="245"
                      x2="980"
                      y2="245"
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="4 6"
                    />
                    <line
                      x1="20"
                      y1="145"
                      x2="980"
                      y2="145"
                      stroke="rgba(56,189,248,0.07)"
                      strokeDasharray="2 6"
                    />

                    {/* Simplified Continental Landmass Silhouettes */}
                    <g
                      fill="#121B2D"
                      stroke="rgba(255,255,255,0.13)"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    >
                      {/* North America */}
                      <path d="M75,78 L185,68 L282,92 L322,135 L292,182 L255,204 L218,225 L178,205 L145,168 L112,132 Z" />
                      {/* South America */}
                      <path d="M262,242 L328,258 L358,312 L324,398 L286,420 L268,352 L252,284 Z" />
                      {/* Europe & UK */}
                      <path d="M462,88 L538,72 L595,85 L598,142 L542,158 L484,152 L458,124 Z" />
                      {/* Africa */}
                      <path d="M468,176 L568,172 L624,228 L596,338 L544,386 L504,335 L485,254 L458,214 Z" />
                      {/* Eurasia & Middle East */}
                      <path d="M598,76 L795,68 L918,92 L894,168 L835,224 L758,246 L698,222 L642,226 L598,178 Z" />
                      {/* Japan, Taiwan & Maritime SE Asia */}
                      <path d="M852,148 L874,162 L862,186 L844,174 Z" />
                      <path d="M812,200 L824,206 L818,216 L808,210 Z" />
                      <path d="M775,258 L848,266 L868,298 L792,296 Z" />
                      {/* Australia */}
                      <path d="M808,326 L898,322 L918,378 L842,396 L802,366 Z" />
                    </g>

                    {/* Strategic Backbone & Subsea Cable Corridors */}
                    <g fill="none" strokeLinecap="round">
                      {/* Amarillo <-> El Dorado <-> NYC */}
                      <path
                        d="M212,164 Q228,172 242,170 T294,148"
                        stroke="#F59E0B"
                        strokeOpacity="0.65"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                      />
                      {/* Transatlantic SLTE NYC <-> UK/EU */}
                      <path
                        d="M294,148 Q392,112 484,122"
                        stroke="#38BDF8"
                        strokeOpacity="0.65"
                        strokeWidth="2"
                      />
                      {/* UK <-> Baltic */}
                      <path
                        d="M484,122 Q516,104 548,106"
                        stroke="#EF4444"
                        strokeOpacity="0.55"
                        strokeWidth="1.6"
                        strokeDasharray="3 3"
                      />
                      {/* Med <-> Hormuz <-> Taiwan Strait */}
                      <path
                        d="M565,168 Q615,192 656,206 Q742,238 818,204"
                        stroke="#EF4444"
                        strokeOpacity="0.45"
                        strokeWidth="1.6"
                        strokeDasharray="5 4"
                      />
                      {/* Taiwan <-> NOPAC R220/R580 Airway */}
                      <path
                        d="M818,204 Q862,164 896,134 Q942,116 982,122"
                        stroke="#F59E0B"
                        strokeOpacity="0.6"
                        strokeWidth="1.7"
                        strokeDasharray="4 4"
                      />
                    </g>

                    {/* Plotted Interactive Flashpoint Nodes */}
                    {visibleNodes.map((node) => {
                      const active = selectedNode.id === node.id;
                      const color = toneHex(node.tone);
                      return (
                        <g
                          key={node.id}
                          onClick={() => setSelectedId(node.id)}
                          className="cursor-pointer"
                          role="button"
                          tabIndex={0}
                          aria-label={`${node.code}: ${node.name}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedId(node.id);
                            }
                          }}
                        >
                          {node.secondaryPoint && (
                            <>
                              <line
                                x1={node.secondaryPoint.x}
                                y1={node.secondaryPoint.y}
                                x2={node.x}
                                y2={node.y}
                                stroke={color}
                                strokeWidth="2"
                              />
                              <circle
                                cx={node.secondaryPoint.x}
                                cy={node.secondaryPoint.y}
                                r={active ? 5 : 3.5}
                                fill={color}
                                fillOpacity="0.85"
                              />
                            </>
                          )}

                          {/* Outer Selection Halo */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={active ? 16 : 10}
                            fill={color}
                            fillOpacity={active ? 0.22 : 0.1}
                            stroke={color}
                            strokeOpacity={active ? 0.85 : 0.35}
                            strokeWidth={active ? 1.6 : 1}
                          />
                          {/* Core Node Pin */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={active ? 6 : 4.5}
                            fill={color}
                            stroke="#0A0E17"
                            strokeWidth="1.5"
                          />
                          {/* Code Tag */}
                          <text
                            x={node.x + 10}
                            y={node.y - 8}
                            fill={active ? '#FFFFFF' : '#CBD5E1'}
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight={active ? '700' : '500'}
                          >
                            {node.code}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Floating Zoom / Reset Controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#0A0E17]/90 border border-white/15 rounded-lg p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => adjustZoom(0.4)}
                  aria-label="Zoom in map"
                  className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustZoom(-0.4)}
                  aria-label="Zoom out map"
                  className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetViewport}
                  aria-label="Reset map view"
                  className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Legend Overlay */}
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2.5 bg-[#0A0E17]/85 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-mono-tactical text-gray-300">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Chokepoint / Wiper
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Hybrid / RF Timing
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Subsea / Clearing
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right 4 Columns: Active Flashpoint Dossier */}
        <div className="lg:col-span-4 surface-elevated rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-tactical text-xs font-semibold px-2 py-0.5 rounded bg-[#0A0E17] border border-white/15 text-[#38BDF8]">
                {selectedNode.code} · {selectedNode.layer}
              </span>
              <span
                className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded border ${
                  selectedNode.verification === 'Corroborated'
                    ? 'bg-[#10B981]/12 border-[#10B981]/35 text-[#10B981]'
                    : 'bg-[#F59E0B]/12 border-[#F59E0B]/35 text-[#F59E0B]'
                }`}
              >
                Status: {selectedNode.verification}
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-white leading-snug">
                {selectedNode.name}
              </h3>
              <p className="font-mono-tactical text-[11px] text-gray-400 mt-0.5">
                {selectedNode.region} · {selectedNode.coordsLabel}
              </p>
            </div>

            <div className="rounded-lg bg-[#0A0E17] border border-white/10 px-3 py-2 font-mono-tactical text-xs text-[#F59E0B]">
              {selectedNode.headlineMetric}
            </div>

            <p className="text-xs sm:text-[13px] text-gray-200 leading-relaxed">
              {selectedNode.summary}
            </p>

            <div className="pt-2 border-t border-white/[0.08] text-xs text-gray-300 leading-relaxed">
              <span className="font-mono-tactical text-[10px] uppercase text-[#38BDF8] block mb-0.5">
                Operational Exposure
              </span>
              {selectedNode.exposure}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => onTraceNode(selectedNode.traceKey)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 px-3 py-2 text-xs font-mono-tactical text-[#38BDF8] transition cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Trace Blast Radius in Crosswalk</span>
            </button>

            <Link
              href={selectedNode.detailHref}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 px-3 py-2 text-xs font-mono-tactical text-gray-200 hover:text-white transition"
            >
              <span>{selectedNode.detailLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Mobile/Desktop Node Pill Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        {visibleNodes.map((n) => {
          const active = selectedNode.id === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelectedId(n.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono-tactical border transition cursor-pointer ${
                active
                  ? 'bg-white/[0.11] border-[#38BDF8]/55 text-white'
                  : 'bg-[#0A0E17] border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: toneHex(n.tone) }}
              />
              <span>
                {n.code} · {n.name.split('(')[0].trim()}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
