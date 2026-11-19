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
  Anchor,
  Crosshair,
  Globe,
} from 'lucide-react';
import { resolvePublicAssetPath } from '@/components/shell/TacticalFigure';
import {
  SubseaChokepointAtlas,
  SubseaTheaterId,
} from '@/components/views/SubseaChokepointAtlas';

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
  num: string;
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
  secondaryLayers?: Array<Exclude<FlashpointLayer, 'ALL'>>;
  subseaTheater?: SubseaTheaterId;
  tone: 'crimson' | 'amber' | 'cyan';
  verification: 'Corroborated' | 'Developing';
  headlineMetric: string;
  summary: string;
  exposure: string;
  traceKey: string;
  detailHref: string;
  detailLabel: string;
}

export const FLASHPOINTS: FlashpointNode[] = [
  {
    id: 'fti-eldorado-amarillo',
    code: 'FP-01',
    num: '01',
    shortTag: 'FTI CORE',
    name: 'El Dorado, AR ↔ Amarillo, TX (FAA FTI Backbone)',
    region: 'Continental U.S. Telecom Core',
    coordsLabel: '33.21°N 92.66°W · 35.22°N 101.83°W',
    x: 368,
    y: 370,
    pillDx: -16,
    pillDy: 24,
    pillAnchor: 'end',
    secondaryPoints: [
      { x: 326, y: 360, label: 'AMARILLO', labelDx: -9, labelDy: -7, anchor: 'end' },
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
    num: '02',
    shortTag: 'NYC / NJ',
    name: 'US East Clearing & Enclave Corridor (NYC / NJ · Ft. Meade)',
    region: 'North American G-SIB, DTCC & Enclave Core',
    coordsLabel: '40.71°N 74.01°W · 39.11°N 76.77°W',
    x: 458,
    y: 334,
    pillDx: 20,
    pillDy: 22,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 445, y: 344, label: 'FT MEADE', labelDx: -10, labelDy: 11, anchor: 'end' },
      { x: 390, y: 328, label: 'CME CHI', labelDx: -9, labelDy: -6, anchor: 'end' },
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
    num: '03',
    shortTag: 'ATLANTIC SLTE',
    name: 'Transatlantic Subsea SLTE Landings (Cornwall / Brittany / Bilbao ↔ US East)',
    region: 'North Atlantic & GIUK Submarine Optical Trunks',
    coordsLabel: '50.83°N 4.55°W ↔ 40.60°N 73.90°W',
    x: 754,
    y: 281,
    pillDx: -18,
    pillDy: -20,
    pillAnchor: 'end',
    secondaryPoints: [
      { x: 757, y: 297, label: 'BRITTANY', labelDx: -9, labelDy: 10, anchor: 'end' },
      { x: 767, y: 326, label: 'BILBAO CLS', labelDx: -9, labelDy: 10, anchor: 'end' },
      { x: 737, y: 198, label: 'GIUK / FARICE', labelDx: -9, labelDy: -7, anchor: 'end' },
      { x: 469, y: 324, label: 'LYNN / NY SLTE', labelDx: 10, labelDy: -7, anchor: 'start' },
    ],
    layer: 'SUB_IP',
    subseaTheater: 'euro-atlantic-baltic',
    tone: 'cyan',
    verification: 'Corroborated',
    headlineMetric: 'FCC 91 FR 73480 · Due Jan. 8, 2027',
    summary:
      'Nov. 16 FCC final rule tightens Submarine Line Terminal Equipment (SLTE) oversight and mandates Foreign Adversary Annual Reports across U.S.–European cable landing stations.',
    exposure:
      'Out-of-band optical terminal management interfaces bridge physical seabed repeaters (Grace Hopper, Marea, Amitié, Havfrue) to carrier IP cores.',
    traceKey: 'cliff:2027-01-08',
    detailHref: '/incidents#sub-ip-section',
    detailLabel: 'Open Sub-IP Blind Spots',
  },
  {
    id: 'baltic-shadow-fleet',
    code: 'FP-04',
    num: '04',
    shortTag: 'BALTIC / FINLAND',
    name: 'Baltic Sea, Gulf of Finland & Kaliningrad Subsea Flank',
    region: 'Northern & Eastern European Maritime Theater',
    coordsLabel: '59.80°N 25.50°E · 54.71°N 20.51°E',
    x: 864,
    y: 244,
    pillDx: 18,
    pillDy: 18,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 892, y: 217, label: 'GULF OF FINLAND', labelDx: 10, labelDy: -7, anchor: 'start' },
      { x: 825, y: 251, label: 'DANISH STRAITS', labelDx: -9, labelDy: 13, anchor: 'end' },
      { x: 812, y: 248, label: 'HAVFRUE DK', labelDx: -9, labelDy: -8, anchor: 'end' },
      { x: 934, y: 314, label: 'CRIMEA', labelDx: 9, labelDy: 4, anchor: 'start' },
    ],
    layer: 'SUB_IP',
    subseaTheater: 'euro-atlantic-baltic',
    tone: 'crimson',
    verification: 'Developing',
    headlineMetric: '40–100m Shelf · Estlink / C-Lion1 / BCS',
    summary:
      'Shadow-fleet tanker transit from Ust-Luga/Primorsk through the shallow Gulf of Finland, past Gotland and Kaliningrad, and out the Danish Straits pairs anchor-drag cable exposure with regional GNSS jamming.',
    exposure:
      'Tests NATO/EU sub-threshold attribution across Estlink 1/2, Balticconnector, C-Lion1, and BCS East-West below formal war-exclusion triggers.',
    traceKey: 'risk:#8',
    detailHref: '/geopolitics#crimea-deterrence-section',
    detailLabel: 'Explore Deterrence & Flank',
  },
  {
    id: 'hormuz-epic-fury',
    code: 'FP-05',
    num: '05',
    shortTag: 'HORMUZ / FUJAIRAH',
    name: 'Strait of Hormuz, Fujairah SLTE & Bab el-Mandeb Subsea Corridor',
    region: 'Persian Gulf & Red Sea Maritime Chokepoints',
    coordsLabel: '26.56°N 56.25°E · 12.58°N 43.33°E',
    x: 1025,
    y: 422,
    pillDx: 18,
    pillDy: -18,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 1027, y: 431, label: 'FUJAIRAH SLTE', labelDx: 11, labelDy: 12, anchor: 'start' },
      { x: 969, y: 486, label: 'BAB EL-MANDEB', labelDx: -9, labelDy: 11, anchor: 'end' },
      { x: 922, y: 405, label: 'SUEZ CLS', labelDx: -9, labelDy: -7, anchor: 'end' },
      { x: 998, y: 412, label: 'KUWAIT / BAHRAIN', labelDx: -9, labelDy: -8, anchor: 'end' },
      { x: 982, y: 426, label: 'RIYADH', labelDx: -9, labelDy: 10, anchor: 'end' },
    ],
    layer: 'KINETIC',
    secondaryLayers: ['SUB_IP'],
    subseaTheater: 'hormuz-redsea',
    tone: 'crimson',
    verification: 'Corroborated',
    headlineMetric: '$38B Burn · 15+ Red Sea & FALCON/GBI Spurs',
    summary:
      'Nov. 18 escalation hit an ADNOC UAE oil vessel in Hormuz (11 injured, 1 missing) alongside U.S. strikes on Qeshm Island and Iranian attacks on Kuwait, Bahrain, and Riyadh.',
    exposure:
      'Roughly 17% of global traffic transits Bab el-Mandeb into Fujairah SLTEs, while shallow 50–90m FALCON/GBI spurs enter Hormuz alongside Iranian-nexus PLC/ESXi wiper threats.',
    traceKey: 'risk:#3',
    detailHref: '/geopolitics#epic-fury-section',
    detailLabel: 'View Operation Epic Fury',
  },
  {
    id: 'taiwan-mineral-chokepoint',
    code: 'FP-06',
    num: '06',
    shortTag: 'TAIWAN / LUZON',
    name: 'Taiwan Strait, Luzon (Bashi) Subsea Funnel & Shenzhen Corridor',
    region: 'First Island Chain Subsea, Mineral & Bomber Theater',
    coordsLabel: '24.50°N 120.80°E · 20.20°N 121.20°E',
    x: 1315,
    y: 432,
    pillDx: 18,
    pillDy: 6,
    pillAnchor: 'start',
    secondaryPoints: [
      { x: 1315, y: 453, label: 'LUZON STRAIT', labelDx: 11, labelDy: 13, anchor: 'start' },
      { x: 1308, y: 420, label: 'MATSU 60m', labelDx: -9, labelDy: -7, anchor: 'end' },
      { x: 1280, y: 446, label: 'HK / SHENZHEN', labelDx: -9, labelDy: -7, anchor: 'end' },
      { x: 1348, y: 410, label: 'OKINAWA ARC', labelDx: 10, labelDy: -8, anchor: 'start' },
      { x: 1408, y: 367, label: 'CHIKURA JP', labelDx: 10, labelDy: 8, anchor: 'start' },
      { x: 1360, y: 336, label: 'VLADIVOSTOK', labelDx: -9, labelDy: -7, anchor: 'end' },
    ],
    layer: 'KINETIC',
    secondaryLayers: ['SUB_IP'],
    subseaTheater: 'taiwan-luzon',
    tone: 'crimson',
    verification: 'Corroborated',
    headlineMetric: '14+ Luzon Trunks · Nov. 27 Ga/Ge · Jan. 10 REE',
    summary:
      'Trump & Xi met in Shenzhen on Nov. 18 ahead of a trilateral with Putin as Russia flew nuclear-capable bombers from Vladivostok past Japan and Taiwan toward Vietnam.',
    exposure:
      '>95% of Taiwan’s international bandwidth lands at Toucheng, Tamsui, and Fangshan through the Luzon Strait (Bashi Channel) and Ryukyu Arc alongside 60m Matsu/Kinmen links.',
    traceKey: 'risk:#4',
    detailHref: '/geopolitics#minerals-section',
    detailLabel: 'Inspect Mineral & Strait Risk',
  },
  {
    id: 'nopac-gnss-airways',
    code: 'FP-07',
    num: '07',
    shortTag: 'NOPAC R220',
    name: 'NOPAC Airways R220 / R580 GNSS Spoofing Corridor',
    region: 'North Pacific U.S.–Asia Flight Routes',
    coordsLabel: '48.00°N 165.00°E ↔ 61.17°N 149.99°W',
    x: 1492,
    y: 260,
    pillDx: -16,
    pillDy: -16,
    pillAnchor: 'end',
    secondaryPoints: [
      { x: 128, y: 206, label: 'ANC R220', labelDx: 10, labelDy: -7, anchor: 'start' },
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

interface TheaterPreset {
  id: string;
  label: string;
  cx: number;
  cy: number;
  zoom: number;
  focusNodeId?: string;
  atlasId?: SubseaTheaterId;
}

export const THEATER_PRESETS: TheaterPreset[] = [
  { id: 'global', label: 'Global 1.0x', cx: 800, cy: 450, zoom: 1 },
  {
    id: 'us-core',
    label: 'US Core',
    cx: 410,
    cy: 348,
    zoom: 2.35,
    focusNodeId: 'fti-eldorado-amarillo',
  },
  {
    id: 'euro-baltic',
    label: 'GIUK & Baltic',
    cx: 826,
    cy: 248,
    zoom: 2.85,
    focusNodeId: 'baltic-shadow-fleet',
    atlasId: 'euro-atlantic-baltic',
  },
  {
    id: 'hormuz-redsea',
    label: 'Hormuz & Red Sea',
    cx: 992,
    cy: 444,
    zoom: 2.85,
    focusNodeId: 'hormuz-epic-fury',
    atlasId: 'hormuz-redsea',
  },
  {
    id: 'taiwan-luzon',
    label: 'Taiwan & Luzon',
    cx: 1332,
    cy: 425,
    zoom: 2.95,
    focusNodeId: 'taiwan-mineral-chokepoint',
    atlasId: 'taiwan-luzon',
  },
];

// Measured geodetic graticule & piecewise control points for global-theater-map.jpg (1600x900 v4 bathymetric basemap)
const LAT_PARALLELS = [
  { y: 214, label: '60°N', eq: false },
  { y: 404, label: '30°N', eq: false },
  { y: 548, label: '0° EQ', eq: true },
  { y: 696, label: '30°S', eq: false },
] as const;

const LON_MERIDIANS = [
  { x: 250, label: '120°W', prime: false },
  { x: 511, label: '60°W', prime: false },
  { x: 772, label: '0° UTC', prime: true },
  { x: 1040, label: '60°E', prime: false },
  { x: 1308, label: '120°E', prime: false },
] as const;

const LAT_CONTROL_POINTS: Array<[number, number]> = [
  [0, 82.0],
  [112, 72.0],
  [214, 60.0],
  [281, 50.8],
  [334, 40.7],
  [370, 33.2],
  [404, 30.0],
  [422, 26.5],
  [453, 20.2],
  [486, 12.6],
  [548, 0.0],
  [696, -30.0],
  [815, -54.0],
  [900, -68.0],
];

export function svgPointToLatLon(svgX: number, svgY: number): { lat: number; lon: number } {
  let lon = svgX >= 772 ? (svgX - 772) / 4.47 : (svgX - 772) / 4.35;
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
  const [activePresetId, setActivePresetId] = useState<string>('global');
  const [showSubseaAtlas, setShowSubseaAtlas] = useState(false);
  const [atlasTheater, setAtlasTheater] = useState<SubseaTheaterId>('taiwan-luzon');
  const [cursorGeo, setCursorGeo] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const worldGroupRef = useRef<SVGGElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const theaterMapSrc = resolvePublicAssetPath('/images/global-theater-map.jpg');

  function syncAtlasForNodeId(nodeId: string) {
    if (nodeId === 'taiwan-mineral-chokepoint' || nodeId === 'nopac-gnss-airways') {
      setAtlasTheater('taiwan-luzon');
    } else if (nodeId === 'hormuz-epic-fury') {
      setAtlasTheater('hormuz-redsea');
    } else {
      setAtlasTheater('euro-atlantic-baltic');
    }
  }

  const visibleNodes = useMemo(() => {
    if (layer === 'ALL') return FLASHPOINTS;
    return FLASHPOINTS.filter(
      (n) => n.layer === layer || Boolean(n.secondaryLayers?.includes(layer))
    );
  }, [layer]);

  const selectedNode = useMemo(() => {
    return (
      visibleNodes.find((n) => n.id === selectedId) ??
      visibleNodes[0] ??
      FLASHPOINTS[0]
    );
  }, [visibleNodes, selectedId]);

  function adjustZoom(delta: number) {
    setActivePresetId('custom');
    setZoom((prev) => {
      const next = Math.min(3.2, Math.max(1, Number((prev + delta).toFixed(2))));
      if (next === 1) {
        setPan({ x: 0, y: 0 });
        setActivePresetId('global');
      } else {
        setPan((cur) => clampPanForZoom(cur.x, cur.y, next));
      }
      return next;
    });
  }

  function focusOnNode(node: FlashpointNode, targetZoom = 2.65) {
    const rawPanX = targetZoom * (800 - node.x);
    const rawPanY = targetZoom * (450 - node.y);
    setZoom(targetZoom);
    setPan(clampPanForZoom(rawPanX, rawPanY, targetZoom));
    setActivePresetId('custom');
    syncAtlasForNodeId(node.id);
  }

  function applyTheaterPreset(preset: TheaterPreset) {
    setShowSubseaAtlas(false);
    setActivePresetId(preset.id);
    if (preset.zoom === 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const rawPanX = preset.zoom * (800 - preset.cx);
    const rawPanY = preset.zoom * (450 - preset.cy);
    setZoom(preset.zoom);
    setPan(clampPanForZoom(rawPanX, rawPanY, preset.zoom));
    if (preset.focusNodeId) {
      setSelectedId(preset.focusNodeId);
      syncAtlasForNodeId(preset.focusNodeId);
    }
    if (preset.atlasId) {
      setAtlasTheater(preset.atlasId);
    }
  }

  function resetViewport() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActivePresetId('global');
  }

  function openTheaterBathymetry(theater: SubseaTheaterId) {
    setAtlasTheater(theater);
    setShowSubseaAtlas(true);
    if (theater === 'taiwan-luzon') {
      setSelectedId('taiwan-mineral-chokepoint');
    } else if (theater === 'hormuz-redsea') {
      setSelectedId('hormuz-epic-fury');
    } else {
      setSelectedId('baltic-shadow-fleet');
    }
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
    if (layer === 'ALL') return 0.92;
    return layer === corridorLayer ? 1 : 0.14;
  };

  // Counter-scale factor so pins & labels remain crisp and legible across 1.0x -> 3.2x zoom
  const isZoomedIn = zoom >= 1.7;
  const invScale = 1 / Math.pow(zoom, 0.72);

  // Project world (1600x900) coords into current zoomed SVG viewport to suppress half-clipped edge labels
  const isPointInsideZoomedFrame = (wx: number, wy: number, padX = 110, padY = 56): boolean => {
    const vx = 800 + pan.x + zoom * (wx - 800);
    const vy = 450 + pan.y + zoom * (wy - 450);
    return vx >= padX && vx <= 1600 - padX && vy >= padY && vy <= 900 - padY;
  };

  return (
    <section
      id="flashpoint-map-section"
      aria-labelledby="flashpoint-map-heading"
      className="glass-panel tac-frame rounded-lg p-4 sm:p-5 space-y-3.5 scroll-mt-nav"
    >
      {/* Header & Domain Layer Filter Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2
            id="flashpoint-map-heading"
            className="text-sm font-mono-tactical uppercase tracking-wider text-white flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>Global Multi-Domain Correlation &amp; Chokepoint Map</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Correlating U.S. homeland backbone &amp; clearing outages with water-routed conflict-zone subsea cables, kinetic straits, and GNSS airways.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {LAYER_OPTIONS.map((opt) => {
            const active = !showSubseaAtlas && layer === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setShowSubseaAtlas(false);
                  setLayer(opt.id);
                }}
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
            onClick={() => {
              if (!showSubseaAtlas) {
                syncAtlasForNodeId(selectedNode.id);
              }
              setShowSubseaAtlas((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-mono-tactical border transition cursor-pointer ${
              showSubseaAtlas
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/45 text-[#F59E0B]'
                : 'bg-[#070A10] border-white/10 text-gray-300 hover:bg-white/[0.06]'
            }`}
          >
            <Anchor className="w-3 h-3 text-[#38BDF8]" />
            <span>{showSubseaAtlas ? '← Global Map' : 'Subsea Bathymetry'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: 16:9 Interactive Theater Map or Subsea Chokepoint Atlas (8 cols) + Active Node Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 flex flex-col gap-2">
          {/* 1-Tap Conflict Theater Zoom Presets (Solves mobile 1.0x micro-scale inspection) */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#070A10] border border-white/10 rounded-sm px-2.5 py-1.5">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500 mr-1 hidden sm:inline">
                Theater Focus:
              </span>
              {THEATER_PRESETS.map((preset) => {
                const isPresetActive = !showSubseaAtlas && activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyTheaterPreset(preset)}
                    className={`px-2 py-0.5 rounded-xs text-[10px] sm:text-[11px] font-mono-tactical border transition cursor-pointer ${
                      isPresetActive
                        ? 'bg-[#38BDF8]/18 border-[#38BDF8]/55 text-white'
                        : 'bg-[#05080E] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {showSubseaAtlas && (
              <button
                type="button"
                onClick={() => setShowSubseaAtlas(false)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[10px] font-mono-tactical text-[#38BDF8] shrink-0 cursor-pointer"
              >
                <Globe className="w-3 h-3" />
                <span>Return to Global Map</span>
              </button>
            )}
          </div>

          {showSubseaAtlas ? (
            <SubseaChokepointAtlas
              theaterId={atlasTheater}
              onTheaterChange={setAtlasTheater}
              defaultShowCallouts={true}
              compact={false}
            />
          ) : (
            <>
              <div className="relative obsidian-surface rounded-md overflow-hidden border border-white/14 aspect-[16/9] w-full bg-[#05080E]">
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
                    aria-label="Calibrated global bathymetric and critical infrastructure correlation map"
                  >
                    <defs>
                      <filter id="basemap-enhance" colorInterpolationFilters="sRGB">
                        <feComponentTransfer>
                          <feFuncR type="linear" slope="1.08" intercept="0.005" />
                          <feFuncG type="linear" slope="1.10" intercept="0.008" />
                          <feFuncB type="linear" slope="1.12" intercept="0.010" />
                        </feComponentTransfer>
                      </filter>
                      <filter id="active-pin-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
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
                      {/* 1. GEBCO-Style Global Bathymetric & Continental Shelf Basemap */}
                      <image
                        href={theaterMapSrc}
                        x="0"
                        y="0"
                        width="1600"
                        height="900"
                        preserveAspectRatio="none"
                        filter="url(#basemap-enhance)"
                      />

                      {/* 2. Calibrated Geodetic Graticule Grid */}
                      <g pointerEvents="none">
                        {LAT_PARALLELS.map((p) => (
                          <g key={p.label}>
                            <line
                              x1="0"
                              y1={p.y}
                              x2="1600"
                              y2={p.y}
                              stroke={
                                p.eq ? 'rgba(56, 189, 248, 0.20)' : 'rgba(148, 163, 184, 0.10)'
                              }
                              strokeWidth={(p.eq ? 1.1 : 0.9) * invScale}
                              strokeDasharray={p.eq ? '6 6' : '3 7'}
                            />
                            <text
                              x="16"
                              y={p.y - 5}
                              fill={p.eq ? 'rgba(56, 189, 248, 0.72)' : 'rgba(148, 163, 184, 0.50)'}
                              fontSize={10.5 * invScale}
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
                                m.prime ? 'rgba(56, 189, 248, 0.16)' : 'rgba(148, 163, 184, 0.08)'
                              }
                              strokeWidth={0.9 * invScale}
                              strokeDasharray="3 8"
                            />
                            <text
                              x={m.x + 5}
                              y="542"
                              fill={
                                m.prime ? 'rgba(56, 189, 248, 0.65)' : 'rgba(148, 163, 184, 0.46)'
                              }
                              fontSize={9.5 * invScale}
                              fontFamily="monospace"
                            >
                              {m.label}
                            </text>
                          </g>
                        ))}
                      </g>

                      {/* 3. Multi-Domain Corridors & 100% Water-Verified Submarine Optical Trunks */}
                      <g fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
                        {/* BACKBONE: Amarillo <-> El Dorado peer flood + terrestrial feed to Ft Meade & NYC */}
                        <g opacity={corridorOpacity('BACKBONE')}>
                          <path
                            d="M326,360 L368,370"
                            stroke="#F59E0B"
                            strokeWidth={2.8 * invScale}
                            strokeOpacity="0.95"
                          />
                          <path
                            d="M368,370 Q412,358 445,344 L458,334"
                            stroke="#F59E0B"
                            strokeWidth={1.9 * invScale}
                            strokeOpacity="0.80"
                            strokeDasharray="6 4"
                          />
                        </g>

                        {/* CLEARING: Chicago CME <-> NYC/NJ DTCC/FICC <-> London Clearing */}
                        <g opacity={corridorOpacity('CLEARING')}>
                          <path
                            d="M390,328 L458,334"
                            stroke="#38BDF8"
                            strokeWidth={2.2 * invScale}
                            strokeOpacity="0.88"
                          />
                          <path
                            d="M458,334 Q612,262 772,276"
                            stroke="#38BDF8"
                            strokeWidth={1.4 * invScale}
                            strokeOpacity="0.45"
                            strokeDasharray="3 5"
                          />
                        </g>

                        {/* SUB_IP: Pixel-Verified Water-Only Submarine Cable Bundles & Chokepoints */}
                        <g opacity={corridorOpacity('SUB_IP')}>
                          {/* Euro-Atlantic SLTE Trunks: Amitié/AEC (Cornwall), Grace Hopper (Brittany), Marea (Bilbao offshore), Havfrue (Blaabjerg DK), GIUK Farice */}
                          <path
                            d="M469,324 Q595,288 754,281"
                            stroke="#38BDF8"
                            strokeWidth={2.2 * invScale}
                            strokeOpacity="0.92"
                          />
                          <path
                            d="M458,334 Q605,304 757,297"
                            stroke="#38BDF8"
                            strokeWidth={1.8 * invScale}
                            strokeOpacity="0.78"
                          />
                          <path
                            d="M450,353 Q600,338 742,318 L767,326"
                            stroke="#38BDF8"
                            strokeWidth={1.6 * invScale}
                            strokeOpacity="0.68"
                          />
                          <path
                            d="M464,328 C575,242 695,212 762,218 L795,228 L812,248"
                            stroke="#38BDF8"
                            strokeWidth={1.6 * invScale}
                            strokeOpacity="0.72"
                          />
                          <path
                            d="M698,182 L737,198 L765,212"
                            stroke="#38BDF8"
                            strokeWidth={1.4 * invScale}
                            strokeOpacity="0.64"
                            strokeDasharray="3 3"
                          />

                          {/* Baltic & Gulf of Finland Contested Subsea Corridor (100% water: Skagerrak -> Kattegat -> Danish Straits -> Rostock -> Bornholm -> Gotland/Kaliningrad -> Gulf of Finland) */}
                          <path
                            d="M814,232 L824,232 L825,242 L825,253 L834,257 L848,254 L864,244 L872,224 L886,218 L902,216"
                            stroke="#EF4444"
                            strokeWidth={2.4 * invScale}
                            strokeOpacity="0.92"
                          />
                          <circle
                            cx="892"
                            cy="217"
                            r={9 * invScale}
                            stroke="#EF4444"
                            strokeWidth={1.3 * invScale}
                            strokeOpacity="0.75"
                            strokeDasharray="3 2"
                          />
                          {/* Black Sea Maritime Corridor off Crimea */}
                          <path
                            d="M918,322 Q934,324 952,324"
                            stroke="#EF4444"
                            strokeWidth={1.5 * invScale}
                            strokeOpacity="0.68"
                            strokeDasharray="4 3"
                          />

                          {/* Suez -> Red Sea -> Bab el-Mandeb -> Gulf of Aden -> Arabian Sea -> Fujairah -> Strait of Hormuz -> Persian Gulf */}
                          <path
                            d="M922,405 L936,430 L950,456 L964,478 L969,486 L984,484 L1008,476 L1046,456 L1054,434 L1027,431"
                            stroke="#38BDF8"
                            strokeWidth={2.0 * invScale}
                            strokeOpacity="0.86"
                          />
                          <path
                            d="M1046,456 Q1074,458 1098,464"
                            stroke="#38BDF8"
                            strokeWidth={1.4 * invScale}
                            strokeOpacity="0.62"
                          />
                          <path
                            d="M1027,431 L1028,424 L1025,421 L1014,424 L1004,418 L994,404"
                            stroke="#EF4444"
                            strokeWidth={2.1 * invScale}
                            strokeOpacity="0.90"
                          />
                          <circle
                            cx="969"
                            cy="486"
                            r={9.5 * invScale}
                            stroke="#EF4444"
                            strokeWidth={1.4 * invScale}
                            strokeOpacity="0.78"
                            strokeDasharray="3 2"
                          />

                          {/* Indo-Pacific: Singapore/SCS & HK -> Luzon Strait (Bashi) -> East Taiwan -> Ryukyu Trench -> Chikura Japan -> Trans-Pacific & Guam */}
                          <path
                            d="M1246,522 L1268,495 L1292,470 L1315,453"
                            stroke="#38BDF8"
                            strokeWidth={1.9 * invScale}
                            strokeOpacity="0.82"
                          />
                          <path
                            d="M1280,446 L1298,452 L1315,453"
                            stroke="#38BDF8"
                            strokeWidth={1.7 * invScale}
                            strokeOpacity="0.76"
                          />
                          <path
                            d="M1315,453 L1320,440 L1320,427 L1338,418 L1362,405 L1388,392 L1412,370 L1495,352 L1598,342"
                            stroke="#38BDF8"
                            strokeWidth={2.1 * invScale}
                            strokeOpacity="0.88"
                          />
                          <path
                            d="M1315,453 L1368,464 L1435,478"
                            stroke="#38BDF8"
                            strokeWidth={1.5 * invScale}
                            strokeOpacity="0.68"
                          />
                          {/* Matsu (Taima #2/#3) & Kinmen/Penghu 60m Shallow Taiwan Strait Links + Luzon Chokepoint Ring */}
                          <path
                            d="M1306,419 L1314,423"
                            stroke="#EF4444"
                            strokeWidth={2.1 * invScale}
                            strokeOpacity="0.95"
                          />
                          <path
                            d="M1301,434 L1312,436"
                            stroke="#EF4444"
                            strokeWidth={1.9 * invScale}
                            strokeOpacity="0.90"
                          />
                          <circle
                            cx="1315"
                            cy="453"
                            r={10 * invScale}
                            stroke="#EF4444"
                            strokeWidth={1.4 * invScale}
                            strokeOpacity="0.82"
                            strokeDasharray="3 2"
                          />

                          {/* NOPAC Airways R220 / R580: Tokyo FIR -> Kurils/FP-07 -> 180° IDL + Wrapped West -> Anchorage */}
                          <path
                            d="M1412,366 Q1450,308 1492,260 Q1545,238 1598,226"
                            stroke="#F59E0B"
                            strokeWidth={2.2 * invScale}
                            strokeOpacity="0.88"
                            strokeDasharray="7 5"
                          />
                          <path
                            d="M2,238 Q68,242 128,206"
                            stroke="#F59E0B"
                            strokeWidth={2.2 * invScale}
                            strokeOpacity="0.84"
                            strokeDasharray="7 5"
                          />
                        </g>

                        {/* KINETIC: Strait of Hormuz Strike Ring + Nov. 17 Russian Bomber Maritime Track + Shenzhen <-> Taiwan */}
                        <g opacity={corridorOpacity('KINETIC')}>
                          <circle
                            cx="1025"
                            cy="422"
                            r={20 * invScale}
                            stroke="#EF4444"
                            strokeWidth={1.3 * invScale}
                            strokeOpacity="0.55"
                            strokeDasharray="4 3"
                          />
                          <path
                            d="M982,426 L998,412 Q1012,418 1025,422"
                            stroke="#EF4444"
                            strokeWidth={2.0 * invScale}
                            strokeOpacity="0.85"
                          />
                          {/* Russian Bomber Track: Vladivostok -> Sea of Japan -> East of Taiwan -> South China Sea off Vietnam */}
                          <path
                            d="M1360,336 Q1378,365 1344,424 Q1318,468 1266,492"
                            stroke="#EF4444"
                            strokeWidth={1.9 * invScale}
                            strokeOpacity="0.80"
                            strokeDasharray="6 4"
                          />
                          <path
                            d="M1280,446 L1315,432"
                            stroke="#EF4444"
                            strokeWidth={2.1 * invScale}
                            strokeOpacity="0.90"
                          />
                        </g>
                      </g>

                      {/* 4. Secondary Strait & CLS Endpoint Markers (Dots at 1.0x; Full Counter-Scaled Labels at Theater Zoom >= 1.7x) */}
                      {visibleNodes.map((node) => {
                        const isNodeSelected = selectedNode.id === node.id;
                        const color = toneHex(node.tone);
                        return (
                          <g
                            key={`sec-${node.id}`}
                            opacity={isNodeSelected ? 0.96 : 0.72}
                            pointerEvents="none"
                          >
                            {node.secondaryPoints?.map((sp) => {
                              const dx = (sp.labelDx ?? 8) * invScale;
                              const dy = (sp.labelDy ?? 4) * invScale;
                              return (
                                <g key={`${node.id}-${sp.label}`}>
                                  <circle
                                    cx={sp.x}
                                    cy={sp.y}
                                    r={(isNodeSelected ? 4.2 : 3.2) * invScale}
                                    fill="#070A10"
                                    stroke={color}
                                    strokeWidth={1.6 * invScale}
                                  />
                                  {(isZoomedIn || (isNodeSelected && zoom >= 1.35)) &&
                                    isPointInsideZoomedFrame(sp.x, sp.y, 92, 42) && (
                                      <text
                                        x={sp.x + dx}
                                        y={sp.y + dy}
                                        textAnchor={sp.anchor ?? 'start'}
                                        fill="#F1F5F9"
                                        stroke="#05080E"
                                        strokeWidth={2.8 * invScale}
                                        paintOrder="stroke"
                                        fontSize={10.2 * invScale}
                                        fontFamily="monospace"
                                        fontWeight="600"
                                      >
                                        {sp.label}
                                      </text>
                                    )}
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}

                      {/* 5. Zoom-Adaptive Primary Beacons & Leader Callout Pills */}
                      {visibleNodes.map((node) => {
                        const active = selectedNode.id === node.id;
                        const color = toneHex(node.tone);
                        const showFullPill =
                          active ||
                          (isZoomedIn && isPointInsideZoomedFrame(node.x, node.y, 130, 52));

                        const pillLabel = `${node.code} · ${node.shortTag}`;
                        const fontSize = (active && !isZoomedIn ? 12.5 : 10.8) * invScale;
                        const pillH = (active && !isZoomedIn ? 24 : 20) * invScale;
                        const pillW = (pillLabel.length * (active && !isZoomedIn ? 7.6 : 6.7) + 16) * invScale;
                        const dx = node.pillDx * invScale;
                        const dy = node.pillDy * invScale;
                        const leaderEndX = node.x + dx;
                        const leaderEndY = node.y + dy;
                        const pillX =
                          node.pillAnchor === 'end' ? leaderEndX - pillW : leaderEndX;
                        const pillY = leaderEndY - pillH / 2;

                        return (
                          <g
                            key={node.id}
                            onClick={() => {
                              setSelectedId(node.id);
                              syncAtlasForNodeId(node.id);
                            }}
                            onDoubleClick={() => focusOnNode(node)}
                            className="cursor-pointer"
                            role="button"
                            tabIndex={0}
                            aria-label={`${node.code}: ${node.name}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedId(node.id);
                                syncAtlasForNodeId(node.id);
                              }
                            }}
                          >
                            {active && (
                              <circle
                                cx={node.x}
                                cy={node.y}
                                r={22 * invScale}
                                fill="none"
                                stroke={color}
                                strokeOpacity="0.58"
                                strokeWidth={1.3 * invScale}
                                strokeDasharray={`${4 * invScale} ${3 * invScale}`}
                              />
                            )}

                            {showFullPill ? (
                              <>
                                <line
                                  x1={node.x}
                                  y1={node.y}
                                  x2={leaderEndX}
                                  y2={leaderEndY}
                                  stroke={color}
                                  strokeOpacity={active ? 0.95 : 0.72}
                                  strokeWidth={(active ? 1.7 : 1.2) * invScale}
                                />
                                <circle
                                  cx={node.x}
                                  cy={node.y}
                                  r={(active ? 12 : 8.5) * invScale}
                                  fill={color}
                                  fillOpacity={active ? 0.28 : 0.16}
                                  stroke={color}
                                  strokeOpacity={active ? 0.95 : 0.70}
                                  strokeWidth={(active ? 1.8 : 1.3) * invScale}
                                  filter={active ? 'url(#active-pin-glow)' : undefined}
                                />
                                <circle
                                  cx={node.x}
                                  cy={node.y}
                                  r={(active ? 4.8 : 3.8) * invScale}
                                  fill={color}
                                  stroke="#05080E"
                                  strokeWidth={1.6 * invScale}
                                />
                                <rect
                                  x={pillX}
                                  y={pillY}
                                  width={pillW}
                                  height={pillH}
                                  rx={3 * invScale}
                                  fill={
                                    active
                                      ? 'rgba(9, 14, 24, 0.96)'
                                      : 'rgba(6, 9, 15, 0.90)'
                                  }
                                  stroke={active ? color : 'rgba(255, 255, 255, 0.24)'}
                                  strokeWidth={(active ? 1.5 : 1.05) * invScale}
                                />
                                <text
                                  x={pillX + pillW / 2}
                                  y={pillY + pillH * 0.67}
                                  textAnchor="middle"
                                  fill="#FFFFFF"
                                  fontSize={fontSize}
                                  fontFamily="monospace"
                                  fontWeight="700"
                                >
                                  {pillLabel}
                                </text>
                              </>
                            ) : (
                              /* At 1.0x Global Overview, non-selected nodes render clean high-legibility numbered beacons (readable even on 390px mobile) */
                              <>
                                <circle
                                  cx={node.x}
                                  cy={node.y}
                                  r={13}
                                  fill="rgba(7, 11, 18, 0.92)"
                                  stroke={color}
                                  strokeWidth={2.0}
                                />
                                <text
                                  x={node.x}
                                  y={node.y + 4}
                                  textAnchor="middle"
                                  fill="#F8FAFC"
                                  fontSize="11.5"
                                  fontFamily="monospace"
                                  fontWeight="700"
                                >
                                  {node.num}
                                </text>
                              </>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>

                {/* Top-Left Legend Overlay (>=640px) */}
                <div className="hidden sm:flex flex-wrap items-center gap-2.5 absolute top-2.5 left-2.5 bg-[#06080C]/90 border border-white/14 rounded-sm px-2.5 py-1 text-[10px] font-mono-tactical text-gray-200 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[1px] bg-[#EF4444]" /> Chokepoint / Sabotage
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[1px] bg-[#F59E0B]" /> Hybrid / RF Timing
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[1px] bg-[#38BDF8]" /> Subsea SLTE / Clearing
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
                    <span>Focus</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustZoom(0.5)}
                    aria-label="Zoom in map"
                    className="p-1 sm:p-1.5 rounded-xs hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustZoom(-0.5)}
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
              </div>

              {/* Mobile Legend & Geodetic Readout Bar (<640px) */}
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
            </>
          )}

          {/* Direct Conflict-Zone Subsea Bathymetry Deep-Dive Strip (Surfaces 1600x900 Hydrographic Plates in 1 Tap) */}
          {(layer === 'SUB_IP' || Boolean(selectedNode.subseaTheater) || showSubseaAtlas) && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#070A10] border border-[#38BDF8]/25 rounded-sm px-3 py-2 text-[11px] font-mono-tactical">
              <span className="inline-flex items-center gap-1.5 text-gray-200">
                <Anchor className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>Conflict Subsea Hydrography:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'euro-atlantic-baltic', label: '00A GIUK & Baltic' },
                    { id: 'taiwan-luzon', label: '00B Taiwan & Luzon' },
                    { id: 'hormuz-redsea', label: '00C Hormuz & Red Sea' },
                  ] as const
                ).map((plate) => {
                  const activePlate = showSubseaAtlas && atlasTheater === plate.id;
                  return (
                    <button
                      key={plate.id}
                      type="button"
                      onClick={() => openTheaterBathymetry(plate.id)}
                      className={`px-2 py-0.5 rounded-xs border transition cursor-pointer ${
                        activePlate
                          ? 'bg-[#38BDF8]/20 border-[#38BDF8]/60 text-white'
                          : 'bg-[#05080E] border-white/14 text-[#38BDF8] hover:bg-[#38BDF8]/12'
                      }`}
                    >
                      {plate.label}
                    </button>
                  );
                })}
              </div>
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
            {selectedNode.subseaTheater && (
              <button
                type="button"
                onClick={() => openTheaterBathymetry(selectedNode.subseaTheater!)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white/[0.05] hover:bg-white/[0.10] border border-white/15 px-3 py-2 text-xs font-mono-tactical text-white transition cursor-pointer"
              >
                <Anchor className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Inspect High-Res Subsea Plate</span>
              </button>
            )}

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
                syncAtlasForNodeId(n.id);
                if (active && zoom === 1 && !showSubseaAtlas) {
                  focusOnNode(n);
                } else {
                  setSelectedId(n.id);
                  if (zoom > 1 && !showSubseaAtlas) focusOnNode(n);
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
