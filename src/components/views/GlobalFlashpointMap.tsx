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
  Crosshair,
} from 'lucide-react';
import { resolvePublicAssetPath } from '@/components/shell/TacticalFigure';

export type FlashpointLayer =
  | 'ALL'
  | 'BACKBONE'
  | 'KINETIC'
  | 'SUB_IP'
  | 'CLEARING';

interface SecondaryMarker {
  x: number;
  y: number;
  label: string;
  labelDx?: number;
  labelDy?: number;
  anchor?: 'start' | 'middle' | 'end';
}

interface FlashpointNode {
  id: string;
  code: string;
  shortTag: string;
  name: string;
  region: string;
  coordsLabel: string;
  x: number;
  y: number;
  pillDx: number;
  pillDy: number;
  pillAnchor: 'start' | 'end';
  secondaryPoints?: SecondaryMarker[];
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
    shortTag: 'FTI CORE',
    name: 'El Dorado, AR ↔ Amarillo, TX (FAA FTI Backbone)',
    region: 'Continental U.S. Telecom Core',
    coordsLabel: '33.21°N 92.66°W · 35.22°N 101.83°W',
    x: 376,
    y: 352,
    pillDx: 14,
    pillDy: 24,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 336, y: 342, label: 'AMARILLO', labelDx: -10, labelDy: -6, anchor: 'end' },
    ],
    layer: 'BACKBONE',
    tone: 'amber',
    verification: 'Developing',
    headlineMetric: '17/22 ARTCCs · 68 Prior Cutovers Clean',
    summary:
      'El Dorado Nov. 13 cutover triggered a peer broadcast flood (>1,000 attempts per 4–5s) from a 3-week-old Amarillo router. Admin. Bedford took full responsibility while mystery remains after 68 clean prior cutovers.',
    exposure:
      'FAA halted Juniper rollout Nov. 17; Sec. Duffy cited two-decade L3Harris vendor lock since 2002 with no timeline to resume installs.',
    traceKey: 'inc:#2',
    detailHref: '/incidents#faa-teardown-section',
    detailLabel: 'Open Two-Router Teardown',
  },
  {
    id: 'us-east-clearing',
    code: 'FP-02',
    shortTag: 'NYC / NJ',
    name: 'US East Clearing & Enclave Corridor (NYC / NJ · Ft. Meade)',
    region: 'North American G-SIB, DTCC & Enclave Core',
    coordsLabel: '40.71°N 74.01°W · 39.11°N 76.77°W',
    x: 442,
    y: 312,
    pillDx: -14,
    pillDy: -16,
    pillAnchor: 'end',
    secondaryPoints: [
      { x: 431, y: 322, label: 'FT MEADE', labelDx: 10, labelDy: 12, anchor: 'start' },
      { x: 396, y: 306, label: 'CME CHI', labelDx: -8, labelDy: -8, anchor: 'end' },
    ],
    layer: 'CLEARING',
    tone: 'cyan',
    verification: 'Corroborated',
    headlineMetric: '~$550B/day Cash Clearing · Dec. 31',
    summary:
      'Nov. 16 Chase hardware/software bug cascaded across Zelle counterparties ahead of mandatory SEC U.S. Treasury cash clearing concentration at DTCC/FICC.',
    exposure:
      '24/7 $10M RTP/FedNow instant rails create autonomous AI liquidity run risk when outage telemetry spikes.',
    traceKey: 'risk:#5',
    detailHref: '/contagion',
    detailLabel: 'Inspect Clearing & Contagion',
  },
  {
    id: 'transatlantic-slte',
    code: 'FP-03',
    shortTag: 'SLTE LANDINGS',
    name: 'Transatlantic Subsea SLTE Landings (Bude UK / Brittany ↔ NY/NJ)',
    region: 'North Atlantic Submarine Optical Trunk',
    coordsLabel: '50.83°N 4.55°W ↔ 40.60°N 73.90°W',
    x: 758,
    y: 274,
    pillDx: -14,
    pillDy: -22,
    pillAnchor: 'end',
    secondaryPoints: [
      { x: 762, y: 287, label: 'BRITTANY', labelDx: -10, labelDy: 15, anchor: 'end' },
      { x: 445, y: 311, label: 'NY SLTE', labelDx: 10, labelDy: -6, anchor: 'start' },
    ],
    layer: 'SUB_IP',
    tone: 'cyan',
    verification: 'Corroborated',
    headlineMetric: 'FCC 91 FR 73480 · Due Jan. 8, 2027',
    summary:
      'Nov. 16 FCC final rule tightens Submarine Line Terminal Equipment (SLTE) oversight and mandates Foreign Adversary Annual Reports across U.S.–European cable landing stations.',
    exposure:
      'Out-of-band optical terminal management interfaces bridge physical seabed repeaters to carrier IP cores.',
    traceKey: 'cliff:2027-01-08',
    detailHref: '/incidents#sub-ip-section',
    detailLabel: 'Open Sub-IP Blind Spots',
  },
  {
    id: 'baltic-shadow-fleet',
    code: 'FP-04',
    shortTag: 'BALTIC / CRIMEA',
    name: 'Baltic Sea, Kaliningrad & Black Sea Gray-Zone Flank',
    region: 'Northern & Eastern European Maritime Theater',
    coordsLabel: '55.70°N 19.80°E · 44.62°N 33.52°E',
    x: 860,
    y: 236,
    pillDx: 15,
    pillDy: -12,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 928, y: 304, label: 'CRIMEA', labelDx: 10, labelDy: 4, anchor: 'start' },
    ],
    layer: 'SUB_IP',
    tone: 'crimson',
    verification: 'Developing',
    headlineMetric: 'Seabed Interconnectors & Regional GNSS Jamming',
    summary:
      'Persistent gray-zone anchor-drag exposure across Baltic telecom/power interconnectors paired with Kaliningrad and Black Sea AIS/GNSS navigation interference.',
    exposure:
      'Tests NATO/EU sub-threshold attribution boundaries below formal cyber war-exclusion triggers.',
    traceKey: 'risk:#8',
    detailHref: '/geopolitics#crimea-deterrence-section',
    detailLabel: 'Explore Crimea & Deterrence',
  },
  {
    id: 'hormuz-epic-fury',
    code: 'FP-05',
    shortTag: 'HORMUZ / QESHM',
    name: 'Strait of Hormuz, Qeshm & Persian Gulf OT Wiper Theater',
    region: 'Persian Gulf Energy & Air-Defense Corridor',
    coordsLabel: '26.56°N 56.25°E',
    x: 1032,
    y: 404,
    pillDx: 15,
    pillDy: 20,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 995, y: 390, label: 'KUWAIT / BAHRAIN', labelDx: -10, labelDy: -8, anchor: 'end' },
      { x: 986, y: 412, label: 'RIYADH', labelDx: -10, labelDy: 10, anchor: 'end' },
    ],
    layer: 'KINETIC',
    tone: 'crimson',
    verification: 'Corroborated',
    headlineMetric: '$38B Burn · ADNOC & Qeshm Escalation',
    summary:
      'Nov. 18 escalation hit an ADNOC UAE oil vessel in Hormuz (11 injured, 1 missing) alongside U.S. strikes on Qeshm Island and Iranian attacks on Kuwait, Bahrain, and Riyadh.',
    exposure:
      'Pairs kinetic munitions drain with Iranian-nexus PLC intrusions (44818, 2222, 102, 502) and ESXi destroy_v6 wipers.',
    traceKey: 'risk:#3',
    detailHref: '/geopolitics#epic-fury-section',
    detailLabel: 'View Operation Epic Fury',
  },
  {
    id: 'taiwan-mineral-chokepoint',
    code: 'FP-06',
    shortTag: 'TAIWAN / GA-REE',
    name: 'Shenzhen APEC, Taiwan Strait & Mineral Cliffs',
    region: 'East Asia Semiconductor, Mineral & Bomber Corridor',
    coordsLabel: '24.50°N 119.50°E · 22.54°N 114.06°E',
    x: 1308,
    y: 414,
    pillDx: 16,
    pillDy: 6,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 1282, y: 420, label: 'SHENZHEN', labelDx: -10, labelDy: -8, anchor: 'end' },
      { x: 1354, y: 304, label: 'VLADIVOSTOK', labelDx: -10, labelDy: -6, anchor: 'end' },
      { x: 1264, y: 462, label: 'VIETNAM TRACK', labelDx: 10, labelDy: 12, anchor: 'start' },
    ],
    layer: 'KINETIC',
    tone: 'crimson',
    verification: 'Corroborated',
    headlineMetric: 'Nov. 27 Ga/Ge/Sb · Jan. 10 REE Cliffs',
    summary:
      'Trump & Xi met in Shenzhen on Nov. 18 ahead of a trilateral with Putin as Russia flew nuclear-capable bombers past Japan and Taiwan to Vietnam.',
    exposure:
      'China’s Ga/Ge/Sb pause expires Nov. 27 and 0.1% extraterritorial REE waiver ends Jan. 10, straining defense radars and magnets.',
    traceKey: 'risk:#4',
    detailHref: '/geopolitics#minerals-section',
    detailLabel: 'Inspect Mineral Chokepoints',
  },
  {
    id: 'nopac-gnss-airways',
    code: 'FP-07',
    shortTag: 'NOPAC R220',
    name: 'NOPAC Airways R220 / R580 GNSS Spoofing Corridor',
    region: 'North Pacific U.S.–Asia Flight Routes',
    coordsLabel: '48.00°N 165.00°E ↔ 61.17°N 149.99°W',
    x: 1488,
    y: 272,
    pillDx: -15,
    pillDy: -14,
    pillAnchor: 'end',
    secondaryPoints: [
      { x: 124, y: 202, label: 'ANC R220', labelDx: 10, labelDy: -6, anchor: 'start' },
    ],
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

const LAT_PARALLELS = [
  { y: 210, label: '60°N', eq: false },
  { y: 376, label: '30°N', eq: false },
  { y: 524, label: '0° EQ', eq: true },
  { y: 656, label: '30°S', eq: false },
] as const;

const LON_MERIDIANS = [
  { x: 244, label: '120°W', prime: false },
  { x: 511, label: '60°W', prime: false },
  { x: 778, label: '0° UTC', prime: true },
  { x: 1045, label: '60°E', prime: false },
  { x: 1312, label: '120°E', prime: false },
] as const;

// Piecewise latitude calibration anchored to measured coastline control points on global-theater-map.jpg (1600x900)
const LAT_CONTROL_POINTS: Array<[number, number]> = [
  [0, 83.0],
  [105, 74.0],
  [210, 60.0],
  [274, 50.8],
  [312, 40.7],
  [352, 33.2],
  [376, 30.0],
  [404, 26.6],
  [420, 22.5],
  [524, 0.0],
  [656, -30.0],
  [765, -48.0],
  [818, -56.0],
  [900, -70.0],
];

function svgPointToLatLon(svgX: number, svgY: number): { lat: number; lon: number } {
  let lon = (svgX - 778) / 4.45;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;
  lon = Math.max(-180, Math.min(180, lon));

  const cy = Math.max(0, Math.min(900, svgY));
  let lat = 0;
  for (let i = 0; i < LAT_CONTROL_POINTS.length - 1; i += 1) {
    const [y0, lat0] = LAT_CONTROL_POINTS[i];
    const [y1, lat1] = LAT_CONTROL_POINTS[i + 1];
    if (cy >= y0 && cy <= y1) {
      const t = (cy - y0) / Math.max(1, y1 - y0);
      lat = lat0 + t * (lat1 - lat0);
      break;
    }
  }
  return { lat, lon };
}

function clampPanForZoom(
  panX: number,
  panY: number,
  zoomVal: number
): { x: number; y: number } {
  const maxX = 800 * Math.max(0, zoomVal - 1);
  const maxY = 450 * Math.max(0, zoomVal - 1);
  return {
    x: Math.max(-maxX, Math.min(maxX, panX)),
    y: Math.max(-maxY, Math.min(maxY, panY)),
  };
}

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
  const [cursorGeo, setCursorGeo] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const worldGroupRef = useRef<SVGGElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const theaterMapSrc = resolvePublicAssetPath('/images/global-theater-map.jpg');
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
      const next = Math.min(2.6, Math.max(1, Number((prev + delta).toFixed(2))));
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      } else {
        setPan((cur) => clampPanForZoom(cur.x, cur.y, next));
      }
      return next;
    });
  }

  function focusOnNode(node: FlashpointNode) {
    const targetZoom = 1.85;
    const rawPanX = targetZoom * (800 - node.x);
    const rawPanY = targetZoom * (450 - node.y);
    setZoom(targetZoom);
    setPan(clampPanForZoom(rawPanX, rawPanY, targetZoom));
  }

  function resetViewport() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function updateCursorGeo(e: React.PointerEvent<HTMLDivElement>) {
    const gEl = worldGroupRef.current;
    const svgEl = svgRef.current;
    if (gEl && svgEl && typeof svgEl.createSVGPoint === 'function') {
      const ctm = gEl.getScreenCTM();
      if (ctm) {
        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const local = pt.matrixTransform(ctm.inverse());
        const { lat, lon } = svgPointToLatLon(local.x, local.y);
        const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
        setCursorGeo(`${latStr} ${lonStr}`);
        return;
      }
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * 1600;
    const svgY = ((e.clientY - rect.top) / rect.height) * 900;
    const { lat, lon } = svgPointToLatLon(svgX, svgY);
    setCursorGeo(
      `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${
        lon >= 0 ? 'E' : 'W'
      }`
    );
  }

  const corridorOpacity = (corridorLayer: Exclude<FlashpointLayer, 'ALL'>) => {
    if (layer === 'ALL') return 1;
    return layer === corridorLayer ? 1 : 0.16;
  };

  return (
    <section
      id="flashpoint-map-section"
      aria-labelledby="flashpoint-map-heading"
      className="glass-panel tac-frame rounded-lg p-4 sm:p-5 space-y-4 scroll-mt-nav"
    >
      {/* Header & Layer Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2
            id="flashpoint-map-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>Global Flashpoint &amp; Backbone Vector Map</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Calibrated satellite theater basemap with subsea SLTE trunks, RF spoofing airways, and kinetic chokepoints.
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
                className={`px-2.5 py-1 rounded-sm text-[11px] font-mono-tactical border transition cursor-pointer ${
                  active
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                    : 'bg-[#070A10] border-white/10 text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowRasterCompare((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-mono-tactical border transition cursor-pointer ${
              showRasterCompare
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]'
                : 'bg-[#070A10] border-white/10 text-gray-300 hover:bg-white/[0.06]'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>{showRasterCompare ? 'Global Theater' : 'Plate 00'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: 16:9 Interactive Theater Map (8 cols) + Active Node Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="relative obsidian-surface rounded-md overflow-hidden border border-white/14 aspect-[16/9] w-full bg-[#05080E]">
          {showRasterCompare ? (
            <img
              src={rasterPlateSrc}
              alt="North Atlantic submarine optical cable landings linking New York and New Jersey to Cornwall UK and Brittany France alongside Baltic fault highlights"
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
                  updateCursorGeo(e);
                  if (!dragStart.current || zoom <= 1) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scaleX = rect.width > 0 ? 1600 / rect.width : 1.8;
                  const scaleY = rect.height > 0 ? 900 / rect.height : 1.8;
                  const dx = (e.clientX - dragStart.current.x) * scaleX;
                  const dy = (e.clientY - dragStart.current.y) * scaleY;
                  setPan(
                    clampPanForZoom(
                      dragStart.current.panX + dx,
                      dragStart.current.panY + dy,
                      zoom
                    )
                  );
                }}
                onPointerUp={() => {
                  dragStart.current = null;
                }}
                onPointerLeave={() => {
                  dragStart.current = null;
                  setCursorGeo(null);
                }}
                className={`w-full h-full select-none ${
                  zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
                }`}
              >
                <svg
                  ref={svgRef}
                  viewBox="0 0 1600 900"
                  className="w-full h-full block"
                  role="img"
                  aria-label="High-fidelity global theater basemap with calibrated critical infrastructure flashpoint overlays"
                >
                  <defs>
                    {/* Crisp terrain & coastline contrast boost for dark OLED/LCD readability */}
                    <filter id="basemap-enhance" colorInterpolationFilters="sRGB">
                      <feComponentTransfer>
                        <feFuncR type="linear" slope="1.26" intercept="0.012" />
                        <feFuncG type="linear" slope="1.28" intercept="0.015" />
                        <feFuncB type="linear" slope="1.32" intercept="0.02" />
                      </feComponentTransfer>
                    </filter>
                    <filter id="active-pin-glow" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <g
                    ref={worldGroupRef}
                    transform={`translate(${800 + pan.x}, ${450 + pan.y}) scale(${zoom}) translate(-800, -450)`}
                  >
                    {/* 1. High-Fidelity Satellite Bathymetric & Topographic World Basemap */}
                    <image
                      href={theaterMapSrc}
                      x="0"
                      y="0"
                      width="1600"
                      height="900"
                      preserveAspectRatio="none"
                      filter="url(#basemap-enhance)"
                    />

                    {/* 2. Calibrated Geodetic Graticule Grid (60°N..30°S, 120°W..120°E) */}
                    <g pointerEvents="none">
                      {LAT_PARALLELS.map((p) => (
                        <g key={p.label}>
                          <line
                            x1="0"
                            y1={p.y}
                            x2="1600"
                            y2={p.y}
                            stroke={
                              p.eq ? 'rgba(56, 189, 248, 0.20)' : 'rgba(148, 163, 184, 0.11)'
                            }
                            strokeWidth={p.eq ? '1.2' : '1'}
                            strokeDasharray={p.eq ? '6 6' : '3 7'}
                          />
                          <text
                            x="18"
                            y={p.y - 6}
                            fill={p.eq ? 'rgba(56, 189, 248, 0.72)' : 'rgba(148, 163, 184, 0.52)'}
                            fontSize="11"
                            fontFamily="monospace"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}

                      {LON_MERIDIANS.map((m) => (
                        <g key={m.label}>
                          <line
                            x1={m.x}
                            y1="0"
                            x2={m.x}
                            y2="900"
                            stroke={
                              m.prime ? 'rgba(56, 189, 248, 0.16)' : 'rgba(148, 163, 184, 0.09)'
                            }
                            strokeWidth="1"
                            strokeDasharray="3 8"
                          />
                          <text
                            x={m.x + 6}
                            y="517"
                            fill={
                              m.prime ? 'rgba(56, 189, 248, 0.65)' : 'rgba(148, 163, 184, 0.46)'
                            }
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {m.label}
                          </text>
                        </g>
                      ))}
                    </g>

                    {/* 3. Multi-Domain Strategic Corridors, Subsea Cables & Airway Tracks */}
                    <g fill="none" strokeLinecap="round" pointerEvents="none">
                      {/* BACKBONE: Amarillo <-> El Dorado peer flood + terrestrial feed to Ft Meade & NYC */}
                      <g opacity={corridorOpacity('BACKBONE')}>
                        <path
                          d="M336,342 L376,352"
                          stroke="#F59E0B"
                          strokeWidth="3"
                          strokeOpacity="0.95"
                        />
                        <path
                          d="M376,352 Q406,338 431,322 L442,312"
                          stroke="#F59E0B"
                          strokeWidth="2"
                          strokeOpacity="0.78"
                          strokeDasharray="6 4"
                        />
                      </g>

                      {/* CLEARING: Chicago CME <-> NYC/NJ DTCC/FICC <-> London Clearing */}
                      <g opacity={corridorOpacity('CLEARING')}>
                        <path
                          d="M396,306 L442,312"
                          stroke="#38BDF8"
                          strokeWidth="2.2"
                          strokeOpacity="0.85"
                        />
                        <path
                          d="M442,312 Q608,246 776,270"
                          stroke="#38BDF8"
                          strokeWidth="1.5"
                          strokeOpacity="0.45"
                          strokeDasharray="3 5"
                        />
                      </g>

                      {/* SUB_IP: Dual Transatlantic Submarine Optical SLTE Trunks + Baltic/Crimea + NOPAC R220/R580 */}
                      <g opacity={corridorOpacity('SUB_IP')}>
                        {/* North Trunk: Long Island NY -> Bude, Cornwall UK */}
                        <path
                          d="M445,311 Q602,262 758,274"
                          stroke="#38BDF8"
                          strokeWidth="2.6"
                          strokeOpacity="0.9"
                        />
                        {/* South Trunk: Tuckerton NJ -> Brittany, France */}
                        <path
                          d="M442,316 Q606,294 762,287"
                          stroke="#38BDF8"
                          strokeWidth="1.9"
                          strokeOpacity="0.68"
                        />
                        <text
                          x="582"
                          y="306"
                          textAnchor="middle"
                          fill="rgba(56,189,248,0.82)"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          TAT-SLTE OPTIC TRUNKS
                        </text>

                        {/* North Sea -> Baltic Sea / Kaliningrad -> Gulf of Finland + Crimea Gray-Zone Flank */}
                        <path
                          d="M758,274 Q808,236 860,236 L892,212"
                          stroke="#EF4444"
                          strokeWidth="2"
                          strokeOpacity="0.72"
                          strokeDasharray="5 4"
                        />
                        <path
                          d="M860,236 Q896,268 928,304"
                          stroke="#EF4444"
                          strokeWidth="1.8"
                          strokeOpacity="0.62"
                          strokeDasharray="4 4"
                        />

                        {/* NOPAC Airways R220 / R580: Tokyo FIR -> Kurils/FP-07 -> 180° IDL + Wrapped West -> Anchorage */}
                        <path
                          d="M1398,340 Q1444,302 1488,272 Q1542,250 1598,238"
                          stroke="#F59E0B"
                          strokeWidth="2.4"
                          strokeOpacity="0.88"
                          strokeDasharray="7 5"
                        />
                        <path
                          d="M2,238 Q66,226 124,202"
                          stroke="#F59E0B"
                          strokeWidth="2.4"
                          strokeOpacity="0.82"
                          strokeDasharray="7 5"
                        />
                        <text
                          x="64"
                          y="246"
                          fill="rgba(245,158,11,0.78)"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          NOPAC R220 → ANC
                        </text>
                      </g>

                      {/* KINETIC: Persian Gulf / Hormuz Interdiction Zone + Russian Bomber Route Vladivostok -> Taiwan -> Vietnam */}
                      <g opacity={corridorOpacity('KINETIC')}>
                        {/* Hormuz Chokepoint Ring & Kuwait/Bahrain/Riyadh Strike Arc */}
                        <circle
                          cx="1032"
                          cy="404"
                          r="26"
                          stroke="#EF4444"
                          strokeWidth="1.4"
                          strokeOpacity="0.5"
                          strokeDasharray="4 3"
                        />
                        <path
                          d="M986,412 L995,390 Q1014,396 1032,404 L1066,422"
                          stroke="#EF4444"
                          strokeWidth="2.2"
                          strokeOpacity="0.85"
                        />

                        {/* Nov. 17 Russian Nuclear-Capable Bomber Maritime Track: Vladivostok -> Sea of Japan -> East of Taiwan -> Cam Ranh Vietnam */}
                        <path
                          d="M1354,304 Q1416,342 1340,414 Q1306,442 1264,462"
                          stroke="#EF4444"
                          strokeWidth="2.1"
                          strokeOpacity="0.8"
                          strokeDasharray="6 4"
                        />
                        {/* Shenzhen <-> Taiwan Strait Chokepoint */}
                        <path
                          d="M1282,420 L1308,414"
                          stroke="#EF4444"
                          strokeWidth="2.4"
                          strokeOpacity="0.9"
                        />
                      </g>
                    </g>

                    {/* 4. Secondary Geographic Endpoint Nodes */}
                    {visibleNodes.map((node) => {
                      const isNodeSelected = selectedNode.id === node.id;
                      const color = toneHex(node.tone);
                      return (
                        <g
                          key={`sec-${node.id}`}
                          opacity={isNodeSelected || layer !== 'ALL' ? 0.95 : 0.72}
                          pointerEvents="none"
                        >
                          {node.secondaryPoints?.map((sp) => (
                            <g key={`${node.id}-${sp.label}`}>
                              <circle
                                cx={sp.x}
                                cy={sp.y}
                                r={isNodeSelected ? 4.5 : 3.5}
                                fill="#070A10"
                                stroke={color}
                                strokeWidth="1.8"
                              />
                              <text
                                x={sp.x + (sp.labelDx ?? 8)}
                                y={sp.y + (sp.labelDy ?? 4)}
                                textAnchor={sp.anchor ?? 'start'}
                                fill="rgba(226, 232, 240, 0.8)"
                                fontSize="9.5"
                                fontFamily="monospace"
                              >
                                {sp.label}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })}

                    {/* 5. Primary Interactive Theater Nodes & Calibrated Leader Callout Pills */}
                    {visibleNodes.map((node) => {
                      const active = selectedNode.id === node.id;
                      const color = toneHex(node.tone);
                      const pillLabel = `${node.code} · ${node.shortTag}`;
                      const pillWidth = pillLabel.length * 6.8 + 14;
                      const leaderEndX = node.x + node.pillDx;
                      const leaderEndY = node.y + node.pillDy;
                      const pillX =
                        node.pillAnchor === 'end' ? leaderEndX - pillWidth : leaderEndX;
                      const pillY = leaderEndY - 10;

                      return (
                        <g
                          key={node.id}
                          onClick={() => setSelectedId(node.id)}
                          onDoubleClick={() => focusOnNode(node)}
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
                          {/* Leader Line */}
                          <line
                            x1={node.x}
                            y1={node.y}
                            x2={leaderEndX}
                            y2={leaderEndY}
                            stroke={color}
                            strokeOpacity={active ? 0.9 : 0.5}
                            strokeWidth={active ? 1.5 : 1.1}
                          />

                          {/* Outer Radar Reticle Ring */}
                          {active && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={23}
                              fill="none"
                              stroke={color}
                              strokeOpacity="0.5"
                              strokeWidth="1.2"
                              strokeDasharray="4 3"
                            />
                          )}

                          {/* Selection Halo */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={active ? 14 : 9.5}
                            fill={color}
                            fillOpacity={active ? 0.25 : 0.13}
                            stroke={color}
                            strokeOpacity={active ? 0.95 : 0.55}
                            strokeWidth={active ? 1.8 : 1.2}
                            filter={active ? 'url(#active-pin-glow)' : undefined}
                          />

                          {/* Core Pin */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={active ? 5.5 : 4.2}
                            fill={color}
                            stroke="#06080C"
                            strokeWidth="1.8"
                          />

                          {/* High-Contrast Callout Pill */}
                          <rect
                            x={pillX}
                            y={pillY}
                            width={pillWidth}
                            height={20}
                            rx={3}
                            fill={active ? 'rgba(11, 17, 28, 0.96)' : 'rgba(6, 9, 15, 0.88)'}
                            stroke={active ? color : 'rgba(255, 255, 255, 0.18)'}
                            strokeWidth={active ? 1.4 : 1}
                          />
                          <text
                            x={pillX + pillWidth / 2}
                            y={pillY + 13.5}
                            textAnchor="middle"
                            fill={active ? '#FFFFFF' : '#E2E8F0'}
                            fontSize="10.5"
                            fontFamily="monospace"
                            fontWeight={active ? '700' : '600'}
                          >
                            {pillLabel}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Top-Left Legend Overlay (>=640px) */}
              <div className="hidden sm:flex flex-wrap items-center gap-2.5 absolute top-2.5 left-2.5 bg-[#06080C]/90 border border-white/14 rounded-sm px-2.5 py-1 text-[10px] font-mono-tactical text-gray-200 pointer-events-none">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-[1px] bg-[#EF4444]" /> Chokepoint / Wiper
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-[1px] bg-[#F59E0B]" /> Hybrid / RF Timing
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-[1px] bg-[#38BDF8]" /> Subsea / Clearing
                </span>
              </div>

              {/* Bottom-Left Calibrated Geodetic Cursor Readout */}
              <div className="hidden sm:flex items-center gap-2 absolute bottom-2.5 left-2.5 bg-[#06080C]/92 border border-white/14 rounded-sm px-2.5 py-1 text-[10px] font-mono-tactical text-gray-300 pointer-events-none">
                <span className="text-gray-500">GEODETIC</span>
                <span className="text-[#38BDF8] tabular-nums">
                  {cursorGeo ?? selectedNode.coordsLabel.split('·')[0].split('↔')[0].trim()}
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">ZOOM {zoom.toFixed(2)}x</span>
              </div>

              {/* Bottom-Right Theater Focus & Zoom Controls */}
              <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 flex items-center gap-0.5 sm:gap-1 bg-[#06080C]/92 border border-white/15 rounded-sm p-0.5 sm:p-1">
                <button
                  type="button"
                  onClick={() => focusOnNode(selectedNode)}
                  aria-label="Focus zoom on selected flashpoint"
                  title="Center & zoom on selected flashpoint"
                  className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-xs hover:bg-white/10 text-[10px] font-mono-tactical text-[#38BDF8] cursor-pointer"
                >
                  <Crosshair className="w-3 h-3" />
                  <span className="hidden sm:inline">Focus</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustZoom(0.4)}
                  aria-label="Zoom in map"
                  className="p-1 sm:p-1.5 rounded-xs hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustZoom(-0.4)}
                  aria-label="Zoom out map"
                  className="p-1 sm:p-1.5 rounded-xs hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetViewport}
                  aria-label="Reset map view"
                  className="p-1 sm:p-1.5 rounded-xs hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
          </div>

          {/* Unobstructed Mobile Legend & Geodetic Readout Bar (<640px) */}
          {!showRasterCompare && (
            <div className="sm:hidden flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-[#070A10] border border-white/12 rounded-sm px-2.5 py-1.5 text-[10px] font-mono-tactical text-gray-300">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[1px] bg-[#EF4444]" /> Chokepoint
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[1px] bg-[#F59E0B]" /> Hybrid/RF
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[1px] bg-[#38BDF8]" /> Subsea/Rail
                </span>
              </div>
              <span className="text-[#38BDF8] tabular-nums">
                {selectedNode.coordsLabel.split('·')[0].split('↔')[0].trim()} · {zoom.toFixed(1)}x
              </span>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Active Flashpoint Dossier */}
        <div className="lg:col-span-4 surface-elevated rounded-md p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-tactical text-xs font-semibold px-2 py-0.5 rounded-sm bg-[#070A10] border border-white/15 text-[#38BDF8]">
                {selectedNode.code} · {selectedNode.layer}
              </span>
              <span
                className={`font-mono-tactical text-[10px] px-2 py-0.5 rounded-sm border ${
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

            <div className="rounded-sm bg-[#070A10] border border-white/10 px-3 py-2 font-mono-tactical text-xs text-[#F59E0B]">
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 px-3 py-2 text-xs font-mono-tactical text-[#38BDF8] transition cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Trace Blast Radius in Crosswalk</span>
            </button>

            <Link
              href={selectedNode.detailHref}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 px-3 py-2 text-xs font-mono-tactical text-gray-200 hover:text-white transition"
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
              onClick={() => {
                if (active && zoom === 1) {
                  focusOnNode(n);
                } else {
                  setSelectedId(n.id);
                  if (zoom > 1) focusOnNode(n);
                }
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono-tactical border transition cursor-pointer ${
                active
                  ? 'bg-white/[0.11] border-[#38BDF8]/55 text-white'
                  : 'bg-[#070A10] border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-[1px]"
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
