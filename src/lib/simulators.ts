export type ComplianceIncidentType =
  | 'cyber_intrusion'
  | 'vendor_outage'
  | 'ransom_payment'
  | 'ai_investigation';

export type ComplianceSectorProfile =
  | 'bank_fintech'
  | 'public_issuer'
  | 'eu_financial'
  | 'defense_infra';

export type ClockStatus = 'BREACHED' | 'URGENT' | 'ACTIVE' | 'NOT_APPLICABLE';

export interface ComplianceClockResult {
  id: string;
  regime: string;
  authority: string;
  limitHours: number;
  limitLabel: string;
  applicable: boolean;
  status: ClockStatus;
  remainingHours: number;
  percentUsed: number;
  action: string;
}

export interface ComplianceSimulationOutput {
  applicableCount: number;
  breachedCount: number;
  urgentCount: number;
  clocks: ComplianceClockResult[];
  privilegeAlert: {
    active: boolean;
    headline: string;
    detail: string;
  };
}

export function evaluateComplianceClocks(params: {
  incidentType: ComplianceIncidentType;
  sector: ComplianceSectorProfile;
  hoursElapsed: number;
  usesConsumerAi: boolean;
}): ComplianceSimulationOutput {
  const hours = Math.max(0, Math.min(168, params.hoursElapsed));

  const definitions: Array<{
    id: string;
    regime: string;
    authority: string;
    limitHours: number;
    limitLabel: string;
    applies: () => boolean;
    action: string;
  }> = [
    {
      id: 'us-vendor-4h',
      regime: 'Critical Vendor Outage Notice',
      authority: 'U.S. Bank Service Providers (OCC/Fed/FDIC)',
      limitHours: 4,
      limitLabel: '4 Hours',
      applies: () =>
        params.sector === 'bank_fintech' &&
        (params.incidentType === 'vendor_outage' || params.incidentType === 'cyber_intrusion'),
      action:
        'Notify covered banking clients of material service disruptions lasting or expected to last >=4h.',
    },
    {
      id: 'eu-dora-4h',
      regime: 'EU DORA Initial Classification',
      authority: 'ESAs / National Competent Authority',
      limitHours: 4,
      limitLabel: '4h (<=24h Detect)',
      applies: () =>
        params.sector === 'eu_financial' && params.incidentType !== 'ai_investigation',
      action:
        'File initial major ICT incident notice within 4h of classification (and no later than 24h from detection).',
    },
    {
      id: 'circia-24h',
      regime: 'CIRCIA Ransom Payment Report',
      authority: 'CISA (Federal Rulemaking)',
      limitHours: 24,
      limitLabel: '24 Hours',
      applies: () => params.incidentType === 'ransom_payment',
      action:
        'Preserve payment telemetry, wallet addresses, and demand artifacts; file 24h CISA ransom disbursement report.',
    },
    {
      id: 'us-bank-36h',
      regime: 'Federal Banking Regulator Notice',
      authority: 'OCC / Federal Reserve / FDIC',
      limitHours: 36,
      limitLabel: '36 Hours',
      applies: () =>
        params.sector === 'bank_fintech' && params.incidentType !== 'ai_investigation',
      action:
        'Submit formal notification to primary federal banking regulator within 36h of determining a notification incident.',
    },
    {
      id: 'circia-dora-72h',
      regime: 'Covered Cyber Incident Report',
      authority: 'CISA CIRCIA / EU DORA Intermediate',
      limitHours: 72,
      limitLabel: '72 Hours',
      applies: () =>
        (params.sector === 'defense_infra' ||
          params.sector === 'bank_fintech' ||
          params.sector === 'eu_financial') &&
        params.incidentType !== 'ai_investigation',
      action:
        'Transmit verified IOCs, root-cause scope, and mitigation status (72h CIRCIA / DORA intermediate report).',
    },
    {
      id: 'sec-8k-96h',
      regime: 'SEC Form 8-K Item 1.05 Filing',
      authority: 'U.S. Securities & Exchange Commission',
      limitHours: 96,
      limitLabel: '4 Business Days',
      applies: () =>
        (params.sector === 'public_issuer' || params.sector === 'bank_fintech') &&
        params.incidentType !== 'ai_investigation',
      action:
        'Disclose material cyber incident scope & financial impact; DOJ national-security delay applies narrowly.',
    },
  ];

  const clocks: ComplianceClockResult[] = definitions.map((def) => {
    const applicable = def.applies();
    const remainingHours = Number((def.limitHours - hours).toFixed(1));
    const percentUsed = Math.min(100, Math.round((hours / def.limitHours) * 100));

    let status: ClockStatus = 'NOT_APPLICABLE';
    if (applicable) {
      if (hours > def.limitHours) {
        status = 'BREACHED';
      } else if (remainingHours <= Math.max(4, def.limitHours * 0.25)) {
        status = 'URGENT';
      } else {
        status = 'ACTIVE';
      }
    }

    return {
      id: def.id,
      regime: def.regime,
      authority: def.authority,
      limitHours: def.limitHours,
      limitLabel: def.limitLabel,
      applicable,
      status,
      remainingHours,
      percentUsed,
      action: def.action,
    };
  });

  const applicableClocks = clocks.filter((c) => c.applicable);
  const breachedCount = applicableClocks.filter((c) => c.status === 'BREACHED').length;
  const urgentCount = applicableClocks.filter((c) => c.status === 'URGENT').length;

  const privilegeActive = params.usesConsumerAi || params.incidentType === 'ai_investigation';

  return {
    applicableCount: applicableClocks.length,
    breachedCount,
    urgentCount,
    clocks,
    privilegeAlert: {
      active: privilegeActive,
      headline: privilegeActive
        ? 'PRIVILEGE WAIVER RISK — U.S. v. Heppner (Feb. 2026)'
        : 'Privilege Guardrail Nominal',
      detail: privilegeActive
        ? 'Judge Jed Rakoff ruled consumer/public AI prompts and outputs are NOT covered by attorney-client privilege or work-product doctrine. Move all forensic triage into counsel-directed zero-retention enclaves immediately.'
        : 'Ensure incident commanders do not paste logs, IOCs, or draft materiality memos into consumer AI chats outside counsel-controlled zero-retention workspaces.',
    },
  };
}

export type SupplyChainProfile =
  | 'defense_rf_optics'
  | 'grid_utility'
  | 'ai_hyperscaler'
  | 'pharma_medtech';

export interface ChokepointCliffImpact {
  dateISO: string;
  label: string;
  milestone: string;
  daysUntilCliff: number;
  exposed: boolean;
  mitigation: string;
}

export interface ChokepointStressOutput {
  profileLabel: string;
  bottleneckMetric: string;
  leadTimeWindow: string;
  stockoutDateISO: string;
  riskRating: 'CRITICAL' | 'ELEVATED' | 'BUFFERED';
  summaryVerdict: string;
  cliffs: ChokepointCliffImpact[];
}

export function evaluateChokepointStress(params: {
  profile: SupplyChainProfile;
  bufferWeeks: number;
  referenceDateISO?: string;
}): ChokepointStressOutput {
  const refIso = params.referenceDateISO ?? '2026-11-18';
  const refMs = Date.parse(`${refIso}T12:00:00Z`);
  const weeks = Math.max(1, Math.min(52, params.bufferWeeks));
  const stockoutMs = refMs + weeks * 7 * 86_400_000;
  const stockoutDateISO = new Date(stockoutMs).toISOString().slice(0, 10);

  const profileMeta: Record<
    SupplyChainProfile,
    {
      label: string;
      bottleneck: string;
      leadTime: string;
      minSafeWeeks: number;
      cliffs: Array<{ dateISO: string; label: string; milestone: string; mitigation: string }>;
    }
  > = {
    defense_rf_optics: {
      label: 'Defense RF / Radar / Munitions',
      bottleneck: 'China controls ~98% Ga, ~60% Ge, ~90% REE magnet processing',
      leadTime: '26–78 wks (non-PRC)',
      minSafeWeeks: 26,
      cliffs: [
        {
          dateISO: '2026-11-27',
          label: 'Nov 27, 2026',
          milestone: 'PRC Gallium / Germanium / Antimony dual-use suspension expires',
          mitigation: 'Lock allied GaAs/Ge wafer buffers and activate DLA allocation requests.',
        },
        {
          dateISO: '2027-01-01',
          label: 'Jan 1, 2027',
          milestone: 'U.S. DoD DFARS NdFeB / SmCo permanent magnet sourcing ban',
          mitigation: 'Audit Tier-2/3 actuators & seekers for non-PRC magnet chain-of-custody.',
        },
        {
          dateISO: '2027-01-10',
          label: 'Jan 10, 2027',
          milestone: 'PRC heavy rare-earth & graphite control suspension expires',
          mitigation: 'Pre-qualify Japanese/Australian/US heavy REE tolling contracts.',
        },
      ],
    },
    grid_utility: {
      label: 'Electric Grid / HV Substations',
      bottleneck: 'Large Power Transformers (LPTs) at 128–144 wk lead times',
      leadTime: '128–144 wks (2.5–3 yrs)',
      minSafeWeeks: 40,
      cliffs: [
        {
          dateISO: '2026-11-27',
          label: 'Nov 27, 2026',
          milestone: 'PRC dual-use antimony / flame-retardant & specialty mineral cliff',
          mitigation: 'Secure spare HV bushings, relays, and SF6-free switchgear inventory.',
        },
        {
          dateISO: '2027-01-10',
          label: 'Jan 10, 2027',
          milestone: 'PRC graphite / specialty alloy & grain-oriented steel stress',
          mitigation: 'Enforce NERC CIP physical/sub-IP isolation and mutual-aid spare transformer pools.',
        },
        {
          dateISO: '2027-03-15',
          label: 'Mar 15, 2027',
          milestone: 'TLS certificate lifecycle drops to 100 days (automation cliff)',
          mitigation: 'Automate SCADA/EMS gateway certificate rotation via ACME before 100d cutover.',
        },
      ],
    },
    ai_hyperscaler: {
      label: 'AI Data Center / Cloud Backbone',
      bottleneck: 'Subsea SLTE landing stations, GaN power ICs & 128–144 wk utility LPTs',
      leadTime: '32–144 wks power & optics',
      minSafeWeeks: 24,
      cliffs: [
        {
          dateISO: '2026-11-27',
          label: 'Nov 27, 2026',
          milestone: 'PRC Ga/Ge optical transceiver & compound semiconductor cliff',
          mitigation: 'Dual-source 800G/1.6T optical transceivers and power-delivery GaN stages.',
        },
        {
          dateISO: '2027-01-08',
          label: 'Jan 8, 2027',
          milestone: 'FCC subsea cable SLTE foreign-adversary ownership review deadline',
          mitigation: 'Verify optical subsea cable SLTE routes and diverse terrestrial lit fiber failover.',
        },
        {
          dateISO: '2027-03-15',
          label: 'Mar 15, 2027',
          milestone: 'TLS 100-day public certificate limit takes effect',
          mitigation: 'Eliminate manual TLS renewals across edge load balancers and API gateways.',
        },
      ],
    },
    pharma_medtech: {
      label: 'Healthcare / Critical API Pharma',
      bottleneck: '>80% of key U.S. generic APIs & starting materials originate in China/India',
      leadTime: '18–36 wks FDA site requalification',
      minSafeWeeks: 20,
      cliffs: [
        {
          dateISO: '2026-11-27',
          label: 'Nov 27, 2026',
          milestone: 'PRC dual-use chemical/mineral export leverage window reopens',
          mitigation: 'Map Tier-2 Chinese key starting materials (KSMs) hidden behind Indian finished APIs.',
        },
        {
          dateISO: '2027-01-10',
          label: 'Jan 10, 2027',
          milestone: 'Broader PRC customs/rare-earth export licensing escalation',
          mitigation: 'Expand strategic buffer stock for antibiotics, anesthetics, and contrast media.',
        },
        {
          dateISO: '2027-03-15',
          label: 'Mar 15, 2027',
          milestone: 'TLS 100-day lifecycle hits legacy medical/EHR devices',
          mitigation: 'Segment legacy clinical devices behind automated reverse proxies before Q1 2027.',
        },
      ],
    },
  };

  const spec = profileMeta[params.profile];
  const cliffs: ChokepointCliffImpact[] = spec.cliffs.map((c) => {
    const cliffMs = Date.parse(`${c.dateISO}T12:00:00Z`);
    const daysUntilCliff = Math.max(0, Math.ceil((cliffMs - refMs) / 86_400_000));
    // Exposed if stockout occurs BEFORE or within 45 days after the cliff window (no time to requalify)
    const exposed = stockoutMs <= cliffMs + 45 * 86_400_000 || weeks < spec.minSafeWeeks;
    return {
      dateISO: c.dateISO,
      label: c.label,
      milestone: c.milestone,
      daysUntilCliff,
      exposed,
      mitigation: c.mitigation,
    };
  });

  const exposedCount = cliffs.filter((c) => c.exposed).length;
  let riskRating: 'CRITICAL' | 'ELEVATED' | 'BUFFERED' = 'BUFFERED';
  if (weeks <= 10 || (exposedCount >= 2 && weeks < spec.minSafeWeeks)) {
    riskRating = 'CRITICAL';
  } else if (weeks < spec.minSafeWeeks || exposedCount >= 1) {
    riskRating = 'ELEVATED';
  }

  const summaryVerdict =
    riskRating === 'CRITICAL'
      ? `Depletion hits ${stockoutDateISO} (${weeks} wks) — well below the ${spec.leadTime} requalification cycle. Immediate dual-sourcing and buffer expansion required.`
      : riskRating === 'ELEVATED'
      ? `Buffer carries to ${stockoutDateISO} (${weeks} wks), absorbing initial Nov–Jan shocks but leaving a gap versus ${spec.leadTime} replacement lead times.`
      : `Buffer carries to ${stockoutDateISO} (${weeks} wks), crossing near-term Q4/Q1 statutory cliffs while non-PRC qualification completes.`;

  return {
    profileLabel: spec.label,
    bottleneckMetric: spec.bottleneck,
    leadTimeWindow: spec.leadTime,
    stockoutDateISO,
    riskRating,
    summaryVerdict,
    cliffs,
  };
}
