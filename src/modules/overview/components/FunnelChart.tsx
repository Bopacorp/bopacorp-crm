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

interface FunnelChartProps {
  data: AdvisorMetricResponse[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const { t } = useTranslation();

  const chartConfig = {
    value: { label: t('overview.funnelChartDesc'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const totals = data.reduce(
      (acc, item) => ({
        contacted: acc.contacted + item.clientsContacted,
        visited: acc.visited + item.clientsVisited,
        inNegotiation: acc.inNegotiation + item.clientsInNegotiation,
        closed: acc.closed + item.clientsClosed,
        postSale: acc.postSale + item.clientsPostSale,
      }),
      { contacted: 0, visited: 0, inNegotiation: 0, closed: 0, postSale: 0 },
    );

    return [
      { stage: t('overview.contacted'), value: totals.contacted, fill: 'var(--chart-1)' },
      { stage: t('overview.visited'), value: totals.visited, fill: 'var(--chart-2)' },
      {
        stage: t('overview.inNegotiation'),
        value: totals.inNegotiation,
        fill: 'var(--chart-3)',
      },
      { stage: t('overview.closed'), value: totals.closed, fill: 'var(--chart-4)' },
      { stage: t('overview.postSale'), value: totals.postSale, fill: 'var(--chart-5)' },
    ];
  }, [data, t]);

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
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="stage" />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
