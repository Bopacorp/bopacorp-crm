import { FileUp, Search, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, KpiCard } from '@/shared/ui';
import { usePendingSummary } from '../hooks/usePendingSummary.js';

interface PendingSummaryProps {
  onAdvisorClick: (advisorId: string) => void;
  selectedAdvisorId?: string;
}

function PendingSummarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export function PendingSummary({ onAdvisorClick, selectedAdvisorId }: PendingSummaryProps) {
  const { t } = useTranslation();
  const { data, isLoading } = usePendingSummary();

  const chartConfig = {
    pendingUpload: { label: t('documentation.pendingUpload'), color: 'var(--chart-1)' },
    pendingReview: { label: t('documentation.pendingReview'), color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      id: item.advisor.id,
      name: `${item.advisor.firstName} ${item.advisor.lastName}`,
      pendingUpload: item.pendingUpload,
      pendingReview: item.pendingReview,
    }));
  }, [data]);

  const totals = useMemo(() => {
    if (!data) return { upload: 0, review: 0, advisors: 0 };
    return {
      upload: data.reduce((sum, item) => sum + item.pendingUpload, 0),
      review: data.reduce((sum, item) => sum + item.pendingReview, 0),
      advisors: data.length,
    };
  }, [data]);

  if (isLoading) return <PendingSummarySkeleton />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={t('documentation.allUpToDate')}
        description={t('documentation.allUpToDateDesc')}
      />
    );
  }

  const chartHeight = Math.max(200, data.length * 40);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title={t('documentation.pendingUpload')}
          value={totals.upload}
          subtitle={t('documentation.pendingUploadSub')}
          icon={FileUp}
        />
        <KpiCard
          title={t('documentation.pendingReview')}
          value={totals.review}
          subtitle={t('documentation.pendingReviewSub')}
          icon={Search}
        />
        <KpiCard
          title={t('documentation.advisorsWithPending')}
          value={totals.advisors}
          subtitle={t('documentation.advisorsWithPendingSub')}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('documentation.pendingSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} style={{ height: chartHeight }} className="w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              accessibilityLayer
              onClick={(state: Record<string, unknown> | null) => {
                const payload = (
                  state as { activePayload?: { payload?: { id?: string } }[] } | null
                )?.activePayload?.[0]?.payload;
                if (payload?.id) onAdvisorClick(payload.id);
              }}
              className="cursor-pointer"
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={140}
                className="text-xs"
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="central"
                    className="fill-foreground text-xs"
                    fontWeight={
                      payload.value &&
                      chartData.find((d) => d.name === payload.value)?.id === selectedAdvisorId
                        ? 700
                        : 400
                    }
                  >
                    {payload.value}
                  </text>
                )}
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
              <Bar
                dataKey="pendingUpload"
                stackId="pending"
                fill="var(--chart-1)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="pendingReview"
                stackId="pending"
                fill="var(--chart-3)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
