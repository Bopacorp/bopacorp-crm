import type { AdvisorPerformanceResponse } from '@bopacorp/shared/reports';
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

interface PerformanceChartProps {
  data: AdvisorPerformanceResponse[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const { t } = useTranslation();

  const chartConfig = {
    ONE_SHOT: { label: 'One Shot', color: 'var(--chart-1)' },
    MEDIANO: { label: t('reports.tierMediano'), color: 'var(--chart-3)' },
    SMALL: { label: 'Small', color: 'var(--chart-5)' },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    return data.map((item) => {
      const name = item.advisor.profile
        ? `${item.advisor.profile.firstName} ${item.advisor.profile.lastName}`
        : item.advisor.username;

      const tierMap: Record<string, number> = { ONE_SHOT: 0, MEDIANO: 0, SMALL: 0 };
      for (const tier of item.tiers) {
        tierMap[tier.tierCode] = tier.closedCount;
      }

      return {
        name,
        ONE_SHOT: tierMap.ONE_SHOT,
        MEDIANO: tierMap.MEDIANO,
        SMALL: tierMap.SMALL,
        total: item.totalClosed,
        required: item.totalRequired,
      };
    });
  }, [data]);

  const chartHeight = Math.max(256, data.length * 48);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.performanceChart')}</CardTitle>
        <CardDescription>{t('reports.performanceChartDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: chartHeight }} className="w-full">
          <BarChart data={chartData} layout="vertical" accessibilityLayer>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={120}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <>
                      <div
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{
                          backgroundColor:
                            chartConfig[name as keyof typeof chartConfig]?.color ??
                            'var(--chart-1)',
                        }}
                      />
                      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {value}
                        </span>
                      </div>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey="ONE_SHOT" stackId="closes" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="MEDIANO" stackId="closes" fill="var(--chart-3)" />
            <Bar dataKey="SMALL" stackId="closes" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
