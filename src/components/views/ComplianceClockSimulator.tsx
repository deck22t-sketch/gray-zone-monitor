'use client';

import React, { useMemo, useState } from 'react';
import { Clock, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';
import {
  ComplianceIncidentType,
  ComplianceSectorProfile,
  evaluateComplianceClocks,
} from '@/lib/simulators';

const INCIDENT_OPTIONS: Array<{ id: ComplianceIncidentType; label: string }> = [
  { id: 'cyber_intrusion', label: 'Cyber Intrusion' },
  { id: 'vendor_outage', label: 'Vendor Outage' },
  { id: 'ransom_payment', label: 'Ransom Payment' },
  { id: 'ai_investigation', label: 'AI-Assisted Triage' },
];

const SECTOR_OPTIONS: Array<{ id: ComplianceSectorProfile; label: string }> = [
  { id: 'bank_fintech', label: 'U.S. Bank / FinTech' },
  { id: 'public_issuer', label: 'SEC Public Issuer' },
  { id: 'eu_financial', label: 'EU DORA Entity' },
  { id: 'defense_infra', label: 'Critical Infra / DIB' },
];

export function ComplianceClockSimulator() {
  const [incidentType, setIncidentType] = useState<ComplianceIncidentType>('cyber_intrusion');
  const [sector, setSector] = useState<ComplianceSectorProfile>('bank_fintech');
  const [hoursElapsed, setHoursElapsed] = useState<number>(18);
  const [usesConsumerAi, setUsesConsumerAi] = useState<boolean>(false);

  const result = useMemo(
    () =>
      evaluateComplianceClocks({
        incidentType,
        sector,
        hoursElapsed,
        usesConsumerAi,
      }),
    [incidentType, sector, hoursElapsed, usesConsumerAi]
  );

  const activeClocks = result.clocks.filter((c) => c.applicable);

  return (
    <section
      id="compliance-simulator-section"
      className="glass-panel tac-frame rounded-lg p-4 sm:p-5 space-y-4 scroll-mt-nav"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <p className="font-mono-tactical text-[10px] uppercase tracking-widest text-[#38BDF8] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            <span>Interactive Statutory Simulator</span>
          </p>
          <h2 className="text-base sm:text-lg font-semibold text-white mt-0.5">
            Incident Reporting &amp; Privilege Clock Simulator
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Stress-test overlapping 4h–96h disclosure deadlines and the Feb. 2026 Rakoff AI privilege guardrail.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-tactical text-xs">
          <span
            className={`px-2 py-1 rounded-sm border ${
              result.breachedCount > 0
                ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                : 'bg-[#10B981]/12 border-[#10B981]/35 text-[#10B981]'
            }`}
          >
            {result.breachedCount} BREACHED
          </span>
          <span className="px-2 py-1 rounded-sm bg-[#F59E0B]/12 border border-[#F59E0B]/35 text-[#F59E0B]">
            {result.urgentCount} URGENT
          </span>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-4 space-y-1.5">
          <span className="block font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
            1. Trigger Scenario
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {INCIDENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setIncidentType(opt.id)}
                className={`px-2.5 py-2 rounded-md border text-xs font-medium text-left transition cursor-pointer ${
                  incidentType === opt.id
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/45 text-white'
                    : 'bg-[#070A10] border-white/[0.08] text-gray-400 hover:text-gray-200 hover:border-white/15'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-1.5">
          <span className="block font-mono-tactical text-[10px] uppercase tracking-wider text-gray-400">
            2. Entity Jurisdiction
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {SECTOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSector(opt.id)}
                className={`px-2.5 py-2 rounded-md border text-xs font-medium text-left transition cursor-pointer ${
                  sector === opt.id
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/45 text-white'
                    : 'bg-[#070A10] border-white/[0.08] text-gray-400 hover:text-gray-200 hover:border-white/15'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 obsidian-surface rounded-md p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between font-mono-tactical text-[11px] mb-1.5">
              <span className="text-gray-400 uppercase">3. Elapsed Since Discovery</span>
              <span className="text-[#38BDF8] font-semibold">T+{hoursElapsed}h</span>
            </div>
            <input
              type="range"
              aria-label="Hours elapsed since discovery"
              min={0}
              max={120}
              step={2}
              value={hoursElapsed}
              onChange={(e) => setHoursElapsed(Number(e.target.value))}
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
            <div className="flex justify-between font-mono-tactical text-[10px] text-gray-500 mt-0.5">
              <span>0h</span>
              <span>24h</span>
              <span>48h</span>
              <span>72h</span>
              <span>96h</span>
              <span>120h</span>
            </div>
          </div>

          <label className="flex items-center gap-2 pt-2 border-t border-white/[0.08] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={usesConsumerAi}
              onChange={(e) => setUsesConsumerAi(e.target.checked)}
              className="rounded-xs border-white/25 bg-[#06080C] text-[#EF4444]"
            />
            <span className="text-[11px] text-gray-300">
              Team pasted logs/drafts into consumer AI tool
            </span>
          </label>
        </div>
      </div>

      {/* Privilege Alert Strip */}
      <div
        className={`rounded-md border px-3.5 py-2.5 flex items-start gap-2.5 text-xs ${
          result.privilegeAlert.active
            ? 'bg-[#EF4444]/12 border-[#EF4444]/40 text-red-200'
            : 'bg-[#10B981]/8 border-[#10B981]/25 text-emerald-200'
        }`}
      >
        {result.privilegeAlert.active ? (
          <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
        )}
        <div>
          <span className="font-mono-tactical text-[11px] font-semibold uppercase tracking-wide block">
            {result.privilegeAlert.headline}
          </span>
          <p className="text-gray-300 mt-0.5 leading-relaxed">{result.privilegeAlert.detail}</p>
        </div>
      </div>

      {/* Computed Statutory Clocks */}
      {activeClocks.length === 0 ? (
        <div className="obsidian-surface rounded-md p-4 text-xs text-gray-400 font-mono-tactical">
          No statutory filing timers triggered for pure AI triage review — verify counsel privilege boundary above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeClocks.map((clock) => {
            const tone =
              clock.status === 'BREACHED'
                ? {
                    border: 'border-[#EF4444]/40',
                    bar: 'bg-[#EF4444]',
                    badge: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40',
                    label: `BREACHED (+${Math.abs(clock.remainingHours)}h)`,
                  }
                : clock.status === 'URGENT'
                ? {
                    border: 'border-[#F59E0B]/40',
                    bar: 'bg-[#F59E0B]',
                    badge: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
                    label: `${clock.remainingHours}h LEFT`,
                  }
                : {
                    border: 'border-white/10',
                    bar: 'bg-[#38BDF8]',
                    badge: 'bg-[#10B981]/12 text-[#10B981] border-[#10B981]/35',
                    label: `${clock.remainingHours}h LEFT`,
                  };

            return (
              <div
                key={clock.id}
                className={`obsidian-surface rounded-md p-3.5 border ${tone.border} space-y-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                      <h3 className="text-xs font-semibold text-white">{clock.regime}</h3>
                    </div>
                    <p className="font-mono-tactical text-[10px] text-gray-400 mt-0.5">
                      {clock.authority} · Limit: {clock.limitLabel}
                    </p>
                  </div>
                  <span
                    className={`font-mono-tactical text-[10px] font-semibold px-2 py-0.5 rounded-sm border shrink-0 ${tone.badge}`}
                  >
                    {tone.label}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-xs bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full ${tone.bar} transition-all duration-150`}
                    style={{ width: `${clock.percentUsed}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed">{clock.action}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
