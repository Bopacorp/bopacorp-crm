import { describe, expect, it } from 'vitest';
import { reportMetricA, reportMetricB } from '@/test/crm-phase5-fixtures.js';
import { aggregateStateCounts, collectStates, getStateCount } from './utils.js';

describe('overview report utilities', () => {
  it('gets a state count and returns zero for an absent state', () => {
    expect(getStateCount(reportMetricA, 'closing')).toBe(2);
    expect(getStateCount(reportMetricA, 'unknown')).toBe(0);
  });

  it('aggregates matching states across advisors and preserves first labels', () => {
    const totals = aggregateStateCounts([reportMetricA, reportMetricB]);

    expect(totals.get('prospect')).toEqual({ name: 'New, lead', count: 3 });
    expect(totals.get('closing')).toEqual({ name: 'Closing', count: 7 });
    expect(totals.get('denied')).toEqual({ name: 'Lost "deal"', count: 1 });
  });

  it('collects unique states in first-seen order and handles empty data', () => {
    expect(collectStates([reportMetricA, reportMetricB])).toEqual([
      { code: 'prospect', name: 'New, lead' },
      { code: 'closing', name: 'Closing' },
      { code: 'denied', name: 'Lost "deal"' },
    ]);
    expect(aggregateStateCounts([])).toEqual(new Map());
    expect(collectStates([])).toEqual([]);
  });
});
