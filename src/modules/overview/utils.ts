import type { AdvisorMetricResponse } from '@bopacorp/shared/reports';

export function getStateCount(advisor: AdvisorMetricResponse, code: string): number {
  return advisor.stateCounts.find((sc) => sc.stateCode === code)?.count ?? 0;
}

export function aggregateStateCounts(data: AdvisorMetricResponse[]) {
  const map = new Map<string, { name: string; count: number }>();
  for (const advisor of data) {
    for (const sc of advisor.stateCounts) {
      const existing = map.get(sc.stateCode);
      if (existing) {
        existing.count += sc.count;
      } else {
        map.set(sc.stateCode, { name: sc.stateName, count: sc.count });
      }
    }
  }
  return map;
}

export interface StateInfo {
  code: string;
  name: string;
}

export function collectStates(data: AdvisorMetricResponse[]): StateInfo[] {
  const seen = new Map<string, string>();
  for (const advisor of data) {
    for (const sc of advisor.stateCounts) {
      if (!seen.has(sc.stateCode)) {
        seen.set(sc.stateCode, sc.stateName);
      }
    }
  }
  return Array.from(seen.entries()).map(([code, name]) => ({ code, name }));
}
