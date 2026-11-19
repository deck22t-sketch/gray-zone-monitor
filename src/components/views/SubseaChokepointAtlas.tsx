'use client';

import React, { useState } from 'react';
import { Anchor, Eye, EyeOff, Maximize2 } from 'lucide-react';
import { resolvePublicAssetPath } from '@/components/shell/TacticalFigure';

export type SubseaTheaterId = 'euro-atlantic-baltic' | 'taiwan-luzon' | 'hormuz-redsea';

interface SubseaCalloutPin {
  id: string;
  label: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  anchor: 'start' | 'end';
  tone: 'crimson' | 'cyan' | 'amber';
}

export interface SubseaTheaterSpec {
  id: SubseaTheaterId;
  code: string;
  shortTab: string;
  title: string;
  imagePath: string;
  alt: string;
  shelfDepthMetric: string;
  cableCountMetric: string;
  regulatoryRef: string;
  summary: string;
  pins: SubseaCalloutPin[];
}

export const SUBSEA_THEATERS: SubseaTheaterSpec[] = [
  {
    id: 'euro-atlantic-baltic',
    code: 'PLATE 00A',
    shortTab: 'Atlantic & Baltic',
    title: 'Euro-Atlantic SLTE Landings, GIUK Approaches & Baltic Subsea Sabotage Zone',
    imagePath: '/images/overview-backbone-map.jpg',
    alt: 'Bathymetric submarine optical cable map linking U.S. East Coast SLTE landings (Massachusetts, Long Island NY, New Jersey, Virginia Beach) across the North Atlantic and GIUK Gap to Ireland, Cornwall UK, France, Spain, and Denmark, highlighting contested subsea interconnectors in the Gulf of Finland, Gotland-Kaliningrad basin, and Danish Straits',
    shelfDepthMetric: '40–100m Baltic Shelf · >3,500m Mid-Atlantic',
    cableCountMetric: 'Estlink 1/2 · C-Lion1 · BCS · Havfrue · Grace Hopper · Marea',
    regulatoryRef: 'Sections 5.3 & 6.5 · FCC 91 FR 73480',
    summary:
      'Russian shadow-fleet tanker transit from Ust-Luga/Primorsk through the shallow Gulf of Finland (Estlink 1/2, Balticconnector, C-Lion1), past Gotland and Kaliningrad (BCS East-West, NordBalt), and out the Danish Straits creates persistent anchor-drag exposure adjacent to high-capacity North Sea (Havfrue) and transatlantic SLTE landings.',
    pins: [
      {
        id: 'lynn-amitie',
        label: 'LYNN MA · AMITIÉ',
        x: 479,
        y: 495,
        dx: -16,
        dy: -22,
        anchor: 'end',
        tone: 'cyan',
      },
      {
        id: 'ny-nj-slte',
        label: 'NY / NJ · GRACE HOPPER & AEC',
        x: 446,
        y: 540,
        dx: -18,
        dy: -6,
        anchor: 'end',
        tone: 'cyan',
      },
      {
        id: 'va-beach-marea',
        label: 'VA BEACH · MAREA & DUNANT',
        x: 426,
        y: 619,
        dx: -18,
        dy: 18,
        anchor: 'end',
        tone: 'cyan',
      },
      {
        id: 'giuk-farice',
        label: 'GIUK GAP · FARICE / SHEFA-2',
        x: 845,
        y: 255,
        dx: -16,
        dy: -24,
        anchor: 'end',
        tone: 'cyan',
      },
      {
        id: 'cornwall-cork',
        label: 'CORNWALL & CORK SLTEs',
        x: 966,
        y: 610,
        dx: -24,
        dy: -26,
        anchor: 'end',
        tone: 'cyan',
      },
      {
        id: 'bilbao-marea',
        label: 'BILBAO · MAREA CLS',
        x: 989,
        y: 785,
        dx: -18,
        dy: -14,
        anchor: 'end',
        tone: 'cyan',
      },
      {
        id: 'blaabjerg-havfrue',
        label: 'BLAABJERG DK · HAVFRUE',
        x: 1186,
        y: 412,
        dx: -24,
        dy: -28,
        anchor: 'end',
        tone: 'cyan',
      },
      {
        id: 'gulf-of-finland',
        label: 'GULF OF FINLAND · ESTLINK & C-LION1',
        x: 1402,
        y: 356,
        dx: -18,
        dy: -42,
        anchor: 'end',
        tone: 'crimson',
      },
      {
        id: 'danish-straits',
        label: 'DANISH STRAITS / ROSTOCK',
        x: 1216,
        y: 514,
        dx: -22,
        dy: 34,
        anchor: 'end',
        tone: 'crimson',
      },
      {
        id: 'kaliningrad-gotland',
        label: 'KALININGRAD / GOTLAND · BCS',
        x: 1318,
        y: 504,
        dx: 20,
        dy: 16,
        anchor: 'start',
        tone: 'crimson',
      },
    ],
  },
  {
    id: 'taiwan-luzon',
    code: 'PLATE 00B',
    shortTab: 'Taiwan & Luzon',
    title: '2027 Davidson Window: Taiwan Strait Shallow Links & Luzon Strait (Bashi) Chokepoint',
    imagePath: '/images/subsea-taiwan-luzon-map.jpg',
    alt: 'Bathymetric submarine optical cable map of the Western Pacific, Taiwan Strait, Matsu and Kinmen shallow links, Toucheng, Tamsui, and Fangshan cable landing stations, and the Luzon Strait Bashi Channel bottleneck connecting East Asia to the Pacific and South China Sea',
    shelfDepthMetric: '~60m Taiwan Strait · >3,000m Luzon / Ryukyu Trenches',
    cableCountMetric: '14+ Intl Trunks (APCN-2 · SJC · PLCN · FASTER · TPU · Taima #2/#3)',
    regulatoryRef: 'Sections 5.3 & 6.5 · Jan. 8 SLTE Cliff',
    summary:
      'Over 95% of Taiwan’s international bandwidth lands at Toucheng, Tamsui/Bali, and Fangshan, funneling through the narrow seismically active Luzon Strait (Bashi Channel) and Ryukyu Arc—while ~60m shallow Taiwan Strait links to Matsu (Taima #2/#3) and Kinmen face recurring gray-zone trawler/cargo anchor cuts and maritime quarantine risk.',
    pins: [
      {
        id: 'matsu-taima',
        label: 'MATSU · TAIMA #2/#3 (60m SHELF)',
        x: 626,
        y: 443,
        dx: -44,
        dy: -28,
        anchor: 'end',
        tone: 'crimson',
      },
      {
        id: 'kinmen-penghu',
        label: 'KINMEN / PENGHU SHALLOW LINK',
        x: 528,
        y: 510,
        dx: -22,
        dy: -16,
        anchor: 'end',
        tone: 'crimson',
      },
      {
        id: 'hk-cls',
        label: 'HONG KONG CLS HUB',
        x: 345,
        y: 606,
        dx: -18,
        dy: -18,
        anchor: 'end',
        tone: 'amber',
      },
      {
        id: 'fangshan-cls',
        label: 'FANGSHAN CLS',
        x: 629,
        y: 594,
        dx: -24,
        dy: -8,
        anchor: 'end',
        tone: 'amber',
      },
      {
        id: 'tamsui-cls',
        label: 'TAMSUI CLS (EAC-C2C / SMW-3)',
        x: 675,
        y: 483,
        dx: 22,
        dy: -26,
        anchor: 'start',
        tone: 'amber',
      },
      {
        id: 'toucheng-cls',
        label: 'TOUCHENG CLS (APCN-2 / PLCN)',
        x: 685,
        y: 506,
        dx: 28,
        dy: 6,
        anchor: 'start',
        tone: 'cyan',
      },
      {
        id: 'luzon-bashi',
        label: 'LUZON STRAIT / BASHI · 14+ TRUNKS',
        x: 662,
        y: 646,
        dx: 46,
        dy: 26,
        anchor: 'start',
        tone: 'crimson',
      },
      {
        id: 'okinawa-ryukyu',
        label: 'OKINAWA / RYUKYU ARC',
        x: 933,
        y: 463,
        dx: 16,
        dy: -48,
        anchor: 'start',
        tone: 'cyan',
      },
      {
        id: 'chikura-shima',
        label: 'CHIKURA / SHIMA SLTEs (JAPAN)',
        x: 1390,
        y: 76,
        dx: -22,
        dy: 16,
        anchor: 'end',
        tone: 'amber',
      },
      {
        id: 'guam-transpac',
        label: 'TRANS-PACIFIC SPURS → GUAM / US',
        x: 1340,
        y: 780,
        dx: -18,
        dy: -28,
        anchor: 'end',
        tone: 'cyan',
      },
    ],
  },
  {
    id: 'hormuz-redsea',
    code: 'PLATE 00C',
    shortTab: 'Hormuz & Red Sea',
    title: 'Active Theater: Strait of Hormuz, Fujairah SLTE Hub & Bab el-Mandeb Subsea Funnel',
    imagePath: '/images/subsea-hormuz-redsea-map.jpg',
    alt: 'Bathymetric submarine optical cable map of the Red Sea, Bab el-Mandeb Strait, Gulf of Aden, Arabian Sea, Fujairah UAE SLTE landing hub, Strait of Hormuz, Qeshm Island, and Persian Gulf spurs alongside overland Saudi-UAE bypass fiber',
    shelfDepthMetric: '50–90m Persian Gulf · 100–200m Bab el-Mandeb',
    cableCountMetric: '15+ Red Sea Trunks (AAE-1 · 2Africa · SMW-5 · FALCON · GBI)',
    regulatoryRef: 'Sections 5.4 & 6.5 · Operation Epic Fury',
    summary:
      'Roughly 17% of global internet traffic and >90% of Europe–Asia subsea capacity threads the 26 km Bab el-Mandeb chokepoint before landing at Fujairah (east of Musandam outside Hormuz), where shallow 50–90m FALCON/GBI/POI spurs enter the contested Strait of Hormuz past Qeshm Island.',
    pins: [
      {
        id: 'suez-entry',
        label: 'SUEZ → RED SEA (~17% GLOBAL TRAFFIC)',
        x: 226,
        y: 98,
        dx: 20,
        dy: 12,
        anchor: 'start',
        tone: 'cyan',
      },
      {
        id: 'jeddah-cls',
        label: 'JEDDAH CLS · RED SEA LANDING',
        x: 450,
        y: 422,
        dx: -24,
        dy: 18,
        anchor: 'end',
        tone: 'amber',
      },
      {
        id: 'bab-el-mandeb',
        label: 'BAB EL-MANDEB · 15+ EUR-ASIA CABLES',
        x: 576,
        y: 738,
        dx: -38,
        dy: -28,
        anchor: 'end',
        tone: 'crimson',
      },
      {
        id: 'jadi-bypass',
        label: 'JADI / MENA TERRESTRIAL BYPASS',
        x: 695,
        y: 314,
        dx: -18,
        dy: -24,
        anchor: 'end',
        tone: 'amber',
      },
      {
        id: 'gulf-spurs',
        label: 'GULF SPURS · KUWAIT / BAHRAIN / QATAR',
        x: 842,
        y: 224,
        dx: -16,
        dy: -52,
        anchor: 'end',
        tone: 'crimson',
      },
      {
        id: 'hormuz-qeshm',
        label: 'STRAIT OF HORMUZ / QESHM (FALCON / GBI)',
        x: 1048,
        y: 224,
        dx: 34,
        dy: -28,
        anchor: 'start',
        tone: 'crimson',
      },
      {
        id: 'fujairah-hub',
        label: 'FUJAIRAH UAE · PRIMARY SLTE BYPASS HUB',
        x: 1038,
        y: 288,
        dx: 28,
        dy: 20,
        anchor: 'start',
        tone: 'amber',
      },
      {
        id: 'mumbai-india-trunks',
        label: 'INDIA-BOUND TRUNKS → MUMBAI CLS',
        x: 1540,
        y: 502,
        dx: -24,
        dy: -26,
        anchor: 'end',
        tone: 'cyan',
      },
    ],
  },
];

function pinHex(tone: SubseaCalloutPin['tone']): string {
  if (tone === 'crimson') return '#EF4444';
  if (tone === 'amber') return '#F59E0B';
  return '#38BDF8';
}

interface SubseaChokepointAtlasProps {
  theaterId: SubseaTheaterId;
  onTheaterChange: (id: SubseaTheaterId) => void;
  defaultShowCallouts?: boolean;
  compact?: boolean;
  onRequestExpand?: () => void;
}

export function SubseaChokepointAtlas({
  theaterId,
  onTheaterChange,
  defaultShowCallouts = true,
  compact = false,
  onRequestExpand,
}: SubseaChokepointAtlasProps) {
  const [showCallouts, setShowCallouts] = useState<boolean>(defaultShowCallouts);

  const spec =
    SUBSEA_THEATERS.find((t) => t.id === theaterId) ?? SUBSEA_THEATERS[0];
  const imgSrc = resolvePublicAssetPath(spec.imagePath);

  return (
    <div className="obsidian-surface rounded-md overflow-hidden border border-white/14">
      {/* Top Control & Theater Selector Bar */}
      <div className="px-3 sm:px-4 py-2 bg-[#070A10] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono-tactical text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#38BDF8]/12 border border-[#38BDF8]/35 text-[#38BDF8] shrink-0">
            {spec.code}
          </span>
          <div className="flex items-center gap-1">
            {SUBSEA_THEATERS.map((t) => {
              const active = t.id === spec.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTheaterChange(t.id)}
                  className={`px-2 py-0.5 rounded-sm text-[10px] sm:text-[11px] font-mono-tactical border transition cursor-pointer ${
                    active
                      ? 'bg-[#38BDF8]/16 border-[#38BDF8]/50 text-white'
                      : 'bg-[#05080E] border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {t.shortTab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCallouts((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono-tactical text-[10px] transition cursor-pointer ${
              showCallouts
                ? 'bg-white/[0.08] border-white/25 text-white'
                : 'bg-white/[0.03] border-white/12 text-gray-400 hover:text-white'
            }`}
            aria-label="Toggle geodetic subsea cable callout labels"
          >
            {showCallouts ? (
              <Eye className="w-3 h-3 text-[#38BDF8]" />
            ) : (
              <EyeOff className="w-3 h-3 text-gray-400" />
            )}
            <span>{showCallouts ? 'Callouts ON' : 'Callouts OFF'}</span>
          </button>

          {onRequestExpand && (
            <button
              type="button"
              onClick={onRequestExpand}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.1] border border-white/14 font-mono-tactical text-[10px] text-gray-200 hover:text-white transition cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-[#38BDF8]" />
              <span>Expand</span>
            </button>
          )}
        </div>
      </div>

      {/* Calibrated 16:9 SVG + Bathymetric Raster Canvas */}
      <div
        onClick={onRequestExpand}
        role={onRequestExpand ? 'button' : undefined}
        tabIndex={onRequestExpand ? 0 : undefined}
        onKeyDown={
          onRequestExpand
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRequestExpand();
                }
              }
            : undefined
        }
        className={`relative aspect-[16/9] w-full bg-[#05080E] overflow-hidden ${
          onRequestExpand ? 'cursor-zoom-in group' : ''
        }`}
      >
        <svg
          viewBox="0 0 1600 900"
          className="w-full h-full block"
          role="img"
          aria-label={spec.alt}
        >
          <image
            href={imgSrc}
            x="0"
            y="0"
            width="1600"
            height="900"
            preserveAspectRatio="none"
          />

          {showCallouts && (
            <g pointerEvents="none">
              {spec.pins.map((pin) => {
                const color = pinHex(pin.tone);
                const pillW = pin.label.length * 6.5 + 16;
                const endX = pin.x + pin.dx;
                const endY = pin.y + pin.dy;
                const pillX = pin.anchor === 'end' ? endX - pillW : endX;
                const pillY = endY - 10;

                return (
                  <g key={pin.id}>
                    <line
                      x1={pin.x}
                      y1={pin.y}
                      x2={endX}
                      y2={endY}
                      stroke={color}
                      strokeWidth="1.4"
                      strokeOpacity="0.82"
                    />
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r="8"
                      fill={color}
                      fillOpacity="0.18"
                      stroke={color}
                      strokeWidth="1.2"
                      strokeOpacity="0.8"
                    />
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r="3.5"
                      fill={color}
                      stroke="#05080E"
                      strokeWidth="1.4"
                    />
                    <rect
                      x={pillX}
                      y={pillY}
                      width={pillW}
                      height={20}
                      rx={3}
                      fill="rgba(6, 9, 15, 0.90)"
                      stroke={
                        pin.tone === 'crimson'
                          ? 'rgba(239, 68, 68, 0.65)'
                          : pin.tone === 'amber'
                            ? 'rgba(245, 158, 11, 0.55)'
                            : 'rgba(56, 189, 248, 0.50)'
                      }
                      strokeWidth="1.1"
                    />
                    <text
                      x={pillX + pillW / 2}
                      y={pillY + 13.5}
                      textAnchor="middle"
                      fill="#F1F5F9"
                      fontSize="10.2"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {pin.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Hydrographic & Chokepoint Telemetry Strip */}
      {!compact ? (
        <div className="px-3.5 sm:px-4 py-3 bg-[#06090F] border-t border-white/10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tactical">
            <span className="inline-flex items-center gap-1.5 text-white font-semibold">
              <Anchor className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span>{spec.title}</span>
            </span>
            <span className="text-[#38BDF8]">{spec.regulatoryRef}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono-tactical">
            <div className="rounded-sm bg-[#090D16] border border-white/10 px-2.5 py-1.5 text-gray-300">
              <span className="text-gray-500 uppercase mr-1.5">Bathymetry:</span>
              <span className="text-[#F59E0B]">{spec.shelfDepthMetric}</span>
            </div>
            <div className="rounded-sm bg-[#090D16] border border-white/10 px-2.5 py-1.5 text-gray-300">
              <span className="text-gray-500 uppercase mr-1.5">Key Systems:</span>
              <span className="text-[#38BDF8]">{spec.cableCountMetric}</span>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">{spec.summary}</p>
        </div>
      ) : (
        <div className="px-3 py-1.5 bg-[#06090F] border-t border-white/10 flex items-center justify-between gap-2 text-[10px] font-mono-tactical text-gray-300">
          <span className="truncate text-gray-300">{spec.shelfDepthMetric}</span>
          <span className="shrink-0 text-[#38BDF8]">Click to inspect callouts →</span>
        </div>
      )}
    </div>
  );
}
