import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reportPerformanceA, reportPerformanceB } from '@/test/crm-phase5-fixtures.js';

const mocks = vi.hoisted(() => ({ barChart: vi.fn() }));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('recharts', () => ({
  Bar: ({ dataKey }: { dataKey: string }) => <span data-testid={`bar-${dataKey}`} />,
  BarChart: ({ data, children }: { data: unknown; children: ReactNode }) => {
    mocks.barChart(data);
    return <div data-testid="bar-chart">{children}</div>;
  },
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));
vi.mock('@/components/ui/card.js', () => ({
  Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));
vi.mock('@/components/ui/chart.js', () => ({
  ChartContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

import { PerformanceChart } from './PerformanceChart.js';

describe('PerformanceChart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('converts tier performance into chart series with zeroes for missing tiers', () => {
    render(<PerformanceChart data={[reportPerformanceA, reportPerformanceB]} />);

    expect(screen.getByText('reports.performanceChart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-ONE_SHOT')).toBeInTheDocument();
    expect(screen.getByTestId('bar-MEDIANO')).toBeInTheDocument();
    expect(screen.getByTestId('bar-SMALL')).toBeInTheDocument();
    expect(mocks.barChart).toHaveBeenCalledWith([
      {
        name: 'Alex Advisor',
        ONE_SHOT: 2,
        MEDIANO: 1,
        SMALL: 0,
        total: 3,
        required: 4,
      },
      {
        name: 'Blair Advisor',
        ONE_SHOT: 3,
        MEDIANO: 0,
        SMALL: 2,
        total: 5,
        required: 4,
      },
    ]);
  });
});
