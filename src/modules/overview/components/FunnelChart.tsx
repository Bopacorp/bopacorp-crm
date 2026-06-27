import type { AdvisorMetricResponse } from '@bopacorp/shared/reports';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface FunnelChartProps {
  data: AdvisorMetricResponse[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const { t } = useTranslation();

  const chartConfig = {
    value: { label: t('overview.funnelChartDesc'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const stateMap = new Map<string, { name: string; count: number }>();

    for (const advisor of data) {
      for (const sc of advisor.stateCounts) {
        const existing = stateMap.get(sc.stateCode);
        if (existing) {
          existing.count += sc.count;
        } else {
          stateMap.set(sc.stateCode, { name: sc.stateName, count: sc.count });
        }
      }
    }

    return Array.from(stateMap.values()).map((entry, i) => ({
      stage: entry.name,
      value: entry.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('overview.funnelChart')}</CardTitle>
        <CardDescription>{t('overview.funnelChartDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="stage" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <>
                      <div
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item.payload?.fill }}
                      />
                      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                        <span className="text-muted-foreground">{item.payload?.stage}</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                      </div>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
