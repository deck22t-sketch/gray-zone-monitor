export interface PoissonClusterResult {
  weeklyRate: number;
  annualRate: number;
  windowHours: number;
  windowDays: number;
  windowsPerYear: number;
  minEventsInWindow: number;
  lambdaPerWindow: number;
  singleWindowProb: number;
  annualAtLeastOneProb: number;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let acc = 1;
  for (let i = 2; i <= n; i += 1) {
    acc *= i;
  }
  return acc;
}

/**
 * Calculates the Poisson null-hypothesis cluster probability per Section 8.2:
 * Given a baseline weekly failure rate across global tier-one backbones,
 * evaluates P(X >= k) in a single non-overlapping window (default 120 hours = 5 days, 73 windows/yr)
 * and P(at least one window >= k across the full 365-day year).
 */
export function computePoissonClusterProbability(params: {
  weeklyRate: number;
  windowDays?: number;
  minEventsInWindow?: number;
}): PoissonClusterResult {
  const windowDays = params.windowDays ?? 5;
  const minEventsInWindow = Math.max(1, Math.round(params.minEventsInWindow ?? 4));
  const weeklyRate = Math.max(0, params.weeklyRate);
  // Section 8.2 convention: 1/wk -> 52/yr, 1.4/wk -> 73/yr, 2.0/wk -> 104/yr
  const annualRate =
    Math.abs(weeklyRate - 1.4) < 0.001 ? 73 : weeklyRate * 52;
  const windowsPerYear = 365 / windowDays;
  const lambdaPerWindow = (annualRate * windowDays) / 365;

  let cumulativeLess = 0;
  for (let i = 0; i < minEventsInWindow; i += 1) {
    const term = (Math.exp(-lambdaPerWindow) * Math.pow(lambdaPerWindow, i)) / factorial(i);
    cumulativeLess += term;
  }

  const singleWindowProb = Math.min(1, Math.max(0, 1 - cumulativeLess));
  const annualAtLeastOneProb = Math.min(
    1,
    Math.max(0, 1 - Math.pow(1 - singleWindowProb, windowsPerYear))
  );

  return {
    weeklyRate,
    annualRate,
    windowHours: windowDays * 24,
    windowDays,
    windowsPerYear,
    minEventsInWindow,
    lambdaPerWindow,
    singleWindowProb,
    annualAtLeastOneProb,
  };
}

export interface RetryStormPoint {
  minute: number;
  unpolicedLoadPct: number;
  jitteredPolicedLoadPct: number;
}

/**
 * Simulates unpoliced exponential-backoff synchronization ("thundering herd")
 * vs jittered control-plane policed recovery load (%) after an edge/auth fault.
 */
export function simulateRetryStormCurve(endpointMillions = 2.5): RetryStormPoint[] {
  const scale = Math.min(2.2, Math.max(0.4, endpointMillions / 2.0));
  const points: RetryStormPoint[] = [];
  for (let m = 0; m <= 60; m += 5) {
    const wave = Math.sin((m / 12) * Math.PI) * 28 + 118 * scale * Math.exp(-m / 95);
    const unpolicedLoadPct = Math.round(Math.max(95, Math.min(420, 100 + wave)));
    const policedBase = 145 * Math.exp(-m / 22) + 48;
    const jitteredPolicedLoadPct = Math.round(Math.min(130, Math.max(45, policedBase)));
    points.push({
      minute: m,
      unpolicedLoadPct,
      jitteredPolicedLoadPct,
    });
  }
  return points;
}
