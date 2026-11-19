'use client';

import React, { useMemo, useState } from 'react';
import { Factory, AlertTriangle, ShieldCheck, CalendarClock } from 'lucide-react';
import { evaluateChokepointStress, SupplyChainProfile } from '@/lib/simulators';

const PROFILES: Array<{ id: SupplyChainProfile; label: string; tag: string }> = [
  { id: 'defense_rf_optics', label: 'Defense RF / Radar', tag: 'Ga / Ge / DFARS' },
  { id: 'grid_utility', label: 'Grid / Substations', tag: '128–144 wk LPT' },
  { id: 'ai_hyperscaler', label: 'AI / Cloud Backbone', tag: 'SLTE + Optics' },
  { id: 'pharma_medtech', label: 'Healthcare / APIs', tag: '>80% PRC/IN' },
];

export function ChokepointStressSimulator() {
  const [profile, setProfile] = useState<SupplyChainProfile>('defense_rf_optics');
  const [bufferWeeks, setBufferWeeks] = useState<number>(10);

  const stress = useMemo(
    () =>
      evaluateChokepointStress({
        profile,
        bufferWeeks,
        referenceDateISO: '2026-11-18',
      }),
    [profile, bufferWeeks]
  );

  const ratingClasses =
    stress.riskRating === 'CRITICAL'
      ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
      : stress.riskRating === 'ELEVATED'
      ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
      : 'bg-[#10B981]/12 border-[#10B981]/35 text-[#10B981]';

  return (
    <section
      id="chokepoint-simulator-section"
      className="glass-panel tac-frame rounded-lg p-4 sm:p-5 space-y-4 scroll-mt-nav"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <p className="font-mono-tactical text-[10px] uppercase tracking-widest text-[#F59E0B] flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5" />
            <span>Interactive Chokepoint Stress Test</span>
          </p>
          <h2 className="text-base sm:text-lg font-semibold text-white mt-0.5">
            Supply-Chain Buffer &amp; Statutory Cliff Simulator
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Model on-hand inventory runway against Nov. 27 Ga/Ge/Sb, Jan. 1 DFARS magnet, and Jan. 10 REE cliffs.
          </p>
        </div>

        <span
          className={`font-mono-tactical text-xs font-semibold px-2.5 py-1 rounded-sm border ${ratingClasses}`}
        >
          POSTURE: {stress.riskRating}
        </span>
      </div>

      {/* Sector Profile Selector + Buffer Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROFILES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setProfile(item.id)}
              className={`p-2.5 rounded-md border text-left transition cursor-pointer ${
                profile === item.id
                  ? 'bg-[#38BDF8]/14 border-[#38BDF8]/45 text-white'
                  : 'bg-[#070A10] border-white/[0.08] text-gray-400 hover:text-gray-200 hover:border-white/15'
              }`}
            >
              <span className="block text-xs font-semibold leading-tight">{item.label}</span>
              <span className="block font-mono-tactical text-[10px] text-gray-400 mt-1">
                {item.tag}
              </span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-5 obsidian-surface rounded-md p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono-tactical text-[11px] mb-1.5">
            <span className="text-gray-400 uppercase">On-Hand Buffer Runway</span>
            <span className="text-[#38BDF8] font-semibold">
              {bufferWeeks} wks → {stress.stockoutDateISO}
            </span>
          </div>
          <input
            type="range"
            aria-label="On-hand inventory buffer in weeks"
            min={2}
            max={52}
            step={2}
            value={bufferWeeks}
            onChange={(e) => setBufferWeeks(Number(e.target.value))}
            className="w-full accent-[#F59E0B] cursor-pointer"
          />
          <div className="flex justify-between font-mono-tactical text-[10px] text-gray-500 mt-0.5">
            <span>2w</span>
            <span>12w</span>
            <span>26w</span>
            <span>38w</span>
            <span>52w</span>
          </div>
        </div>
      </div>

      {/* Verdict Strip */}
      <div className="obsidian-surface rounded-md p-3.5 border border-white/[0.08] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5 space-y-1">
          <span className="font-mono-tactical text-[10px] uppercase tracking-wider text-gray-500">
            Structural Bottleneck · Lead Time
          </span>
          <p className="text-xs font-medium text-white">{stress.bottleneckMetric}</p>
          <p className="font-mono-tactical text-[11px] text-[#F59E0B]">
            Replacement Cycle: {stress.leadTimeWindow}
          </p>
        </div>
        <div className="md:col-span-7 md:border-l md:border-white/[0.08] md:pl-4 text-xs text-gray-300 leading-relaxed flex items-start gap-2">
          {stress.riskRating === 'BUFFERED' ? (
            <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                stress.riskRating === 'CRITICAL' ? 'text-[#EF4444]' : 'text-[#F59E0B]'
              }`}
            />
          )}
          <p>{stress.summaryVerdict}</p>
        </div>
      </div>

      {/* Cliff Exposure Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {stress.cliffs.map((cliff) => (
          <div
            key={cliff.dateISO}
            className={`obsidian-surface rounded-md p-3.5 border space-y-2 ${
              cliff.exposed ? 'border-[#EF4444]/35' : 'border-[#10B981]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2 font-mono-tactical text-[10px]">
              <span className="inline-flex items-center gap-1 text-gray-300">
                <CalendarClock className="w-3 h-3 text-[#38BDF8]" />
                {cliff.label} (T-{cliff.daysUntilCliff}d)
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-sm font-semibold ${
                  cliff.exposed
                    ? 'bg-[#EF4444]/15 text-[#EF4444]'
                    : 'bg-[#10B981]/12 text-[#10B981]'
                }`}
              >
                {cliff.exposed ? 'EXPOSED' : 'COVERED'}
              </span>
            </div>
            <p className="text-xs font-medium text-white leading-snug">{cliff.milestone}</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">{cliff.mitigation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
