import type { AdvisorPerformanceResponse, SalesTargetResponse } from '@bopacorp/shared/reports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Pencil, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { cn } from '@/lib/utils.js';
import { Can } from '@/modules/auth/components/Can.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { usePageReset } from '@/shared/hooks/usePageReset.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  KpiCard,
  PaginationFooter,
  SectionHeader,
  TableSkeleton,
} from '@/shared/ui';
import { ExportButton } from '../components/ExportButton.js';
import { PerformanceChart } from '../components/PerformanceChart.js';
import { useAdvisorPerformance } from '../hooks/useAdvisorPerformance.js';
import { useReportExports } from '../hooks/useReportExports.js';
import { useSalesTargets } from '../hooks/useSalesTargets.js';
import { useTeamAdvisors } from '../hooks/useTeamAdvisors.js';
import { updateTarget } from '../reports.service.js';

function useTierLabel() {
  const { t } = useTranslation();
  return (code: string) => {
    const labels: Record<string, string> = {
      ONE_SHOT: t('reports.tierOneShot'),
      MEDIANO: t('reports.tierMediano'),
      SMALL: t('reports.tierSmall'),
    };
    return labels[code] ?? code;
  };
}

function TargetCard({ target }: { target: SalesTargetResponse }) {
  const { t } = useTranslation();
  const tierLabel = useTierLabel();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [minCloses, setMinCloses] = useState(target.minCloses);
  const [minBilling, setMinBilling] = useState(target.minBilling);
  const [maxBilling, setMaxBilling] = useState(target.maxBilling ?? 0);

  const mutation = useMutation({
    mutationFn: () =>
      updateTarget(target.id, {
        minCloses,
        minBilling,
        maxBilling: maxBilling || null,
      }),
    onSuccess: () => {
      toast.success(t('reports.targetUpdated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.targets() });
      setEditing(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleCancel = () => {
    setMinCloses(target.minCloses);
    setMinBilling(target.minBilling);
    setMaxBilling(target.maxBilling ?? 0);
    setEditing(false);
  };

  const billingRange = target.maxBilling
    ? `${formatCurrency(target.minBilling)} – ${formatCurrency(target.maxBilling)}`
    : `≥ ${formatCurrency(target.minBilling)}`;

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{tierLabel(target.tierCode)}</span>
          <span className="text-xs text-muted-foreground">{billingRange}</span>
          <span className="text-xs text-muted-foreground">
            {t('reports.minCloses')}: {target.minCloses}
          </span>
        </div>
        <Can permission="sales_targets.update">
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil data-icon className="size-4" />
          </Button>
        </Can>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{tierLabel(target.tierCode)}</span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 data-icon className="size-4 animate-spin" />
            ) : (
              <Check data-icon className="size-4" />
            )}
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>
            <X data-icon className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Field>
          <FieldLabel>{t('reports.minBilling')}</FieldLabel>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={minBilling}
            onChange={(e) => setMinBilling(Number(e.target.value))}
            disabled={mutation.isPending}
          />
        </Field>
        <Field>
          <FieldLabel>{t('reports.maxBilling')}</FieldLabel>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={maxBilling}
            onChange={(e) => setMaxBilling(Number(e.target.value))}
            disabled={mutation.isPending}
          />
        </Field>
        <Field>
          <FieldLabel>{t('reports.minCloses')}</FieldLabel>
          <Input
            type="number"
            min={0}
            value={minCloses}
            onChange={(e) => setMinCloses(Number(e.target.value))}
            disabled={mutation.isPending}
          />
        </Field>
      </div>
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isSupervisor } = useTeamAdvisors();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [expPage, setExpPage] = useState(1);
  const [expPageSize, setExpPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const perfQuery = {
    ...(isSupervisor && user?.id ? { supervisorId: user.id } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const { data: targets, isLoading: targetsLoading } = useSalesTargets();
  const {
    data: performance,
    isLoading: perfLoading,
    isFetching: perfFetching,
    error: perfError,
    refetch: refetchPerf,
  } = useAdvisorPerformance(perfQuery);

  const {
    data: expResult,
    isLoading: expLoading,
    isFetching: expFetching,
    error: expError,
    refetch: refetchExp,
  } = useReportExports({
    page: expPage,
    limit: expPageSize,
    sortOrder: 'desc',
  });

  usePageReset([searchQuery, expPageSize], setExpPage);

  const exports = expResult?.data ?? [];
  const expMeta =
    (expResult?.meta as { totalItems: number; totalPages: number } | undefined) ?? null;

  const tierLabel = useTierLabel();

  const totalAdvisors = performance?.length ?? 0;
  const meetingCount = performance?.filter((p) => p.overallMet).length ?? 0;
  const avgCloses =
    totalAdvisors > 0
      ? Math.round((performance?.reduce((sum, p) => sum + p.totalClosed, 0) ?? 0) / totalAdvisors)
      : 0;

  const performanceColumns = [
    {
      id: 'advisor',
      header: t('reports.advisorName'),
      accessor: (item: AdvisorPerformanceResponse) => {
        const name = item.advisor.profile
          ? `${item.advisor.profile.firstName} ${item.advisor.profile.lastName}`
          : item.advisor.username;
        return <span className="font-medium">{name}</span>;
      },
    },
    ...(['ONE_SHOT', 'MEDIANO', 'SMALL'] as const).map((code) => ({
      id: code,
      header: tierLabel(code),
      accessor: (item: AdvisorPerformanceResponse) => {
        const tier = item.tiers.find((ti) => ti.tierCode === code);
        if (!tier) return <span className="text-muted-foreground">—</span>;
        const ratio = tier.minCloses > 0 ? tier.closedCount / tier.minCloses : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  tier.met ? 'bg-primary' : ratio > 0 ? 'bg-destructive/60' : '',
                )}
                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
              />
            </div>
            <span className="tabular-nums text-xs text-muted-foreground">
              {tier.closedCount}/{tier.minCloses}
            </span>
          </div>
        );
      },
    })),
    {
      id: 'total',
      header: t('reports.totalClosed'),
      accessor: (item: AdvisorPerformanceResponse) => (
        <span className="font-semibold tabular-nums">
          {item.totalClosed} / {item.totalRequired}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('reports.status'),
      accessor: (item: AdvisorPerformanceResponse) => (
        <Badge variant={item.overallMet ? 'default' : 'outline'}>
          {item.overallMet ? t('reports.met') : t('reports.notMet')}
        </Badge>
      ),
    },
  ];

  const filteredExports = searchQuery
    ? exports.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : exports;

  const exportColumns = [
    {
      id: 'type',
      header: t('reports.reportType'),
      accessor: (item: (typeof exports)[number]) => (
        <span className="font-medium">{t(`reports.type.${item.reportType}`)}</span>
      ),
    },
    {
      id: 'title',
      header: t('reports.title'),
      accessor: (item: (typeof exports)[number]) => item.title,
    },
    {
      id: 'generated',
      header: t('reports.generatedDate'),
      accessor: (item: (typeof exports)[number]) => formatDateTime(item.generatedAt),
    },
    {
      id: 'size',
      header: t('reports.fileSize'),
      accessor: (item: (typeof exports)[number]) => `${item.fileSizeMb} MB`,
    },
  ];

  const loading = targetsLoading || perfLoading;
  const hasTargets = targets && targets.length > 0;
  const hasPerformance = performance && performance.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <SectionHeader
        title={t('reports.title')}
        description={t('reports.description')}
        actions={<ExportButton />}
      />

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">{t('reports.performance')}</TabsTrigger>
          <TabsTrigger value="exports">{t('reports.exports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          {loading ? (
            <PerformanceSkeleton />
          ) : perfError ? (
            <ErrorState error={perfError} onRetry={() => refetchPerf()} />
          ) : (
            <div
              className={cn(
                'flex flex-col gap-6',
                perfFetching && !loading && 'pointer-events-none opacity-60 transition-opacity',
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                  title={t('reports.totalAdvisors')}
                  value={totalAdvisors}
                  subtitle={t('reports.totalAdvisorsSub')}
                  icon={Users}
                />
                <KpiCard
                  title={t('reports.meetingTarget')}
                  value={`${meetingCount} / ${totalAdvisors}`}
                  subtitle={t('reports.meetingTargetSub')}
                />
                <KpiCard
                  title={t('reports.avgCloses')}
                  value={avgCloses}
                  subtitle={t('reports.avgClosesSub')}
                />
              </div>

              {hasPerformance && (
                <div className={cn('grid gap-6', hasTargets && 'lg:grid-cols-3')}>
                  <div className={cn(hasTargets && 'lg:col-span-2')}>
                    <PerformanceChart data={performance} />
                  </div>
                  {hasTargets && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('reports.tierConfig')}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {targets.map((target) => (
                          <TargetCard key={target.id} target={target} />
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end gap-4">
                  <Field className="w-auto">
                    <FieldLabel>{t('reports.dateFrom')}</FieldLabel>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      max={dateTo || undefined}
                    />
                  </Field>
                  <Field className="w-auto">
                    <FieldLabel>{t('reports.dateTo')}</FieldLabel>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom || undefined}
                    />
                  </Field>
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                    >
                      {t('common.clear')}
                    </Button>
                  )}
                </div>

                {hasPerformance ? (
                  <EntityTable
                    data={performance}
                    columns={performanceColumns}
                    keyExtractor={(item) => item.advisor.id}
                  />
                ) : dateFrom || dateTo ? (
                  <EmptyState
                    title={t('common.noResults')}
                    description={t('common.noResultsDescription')}
                  />
                ) : (
                  <EmptyState
                    title={t('reports.noPerformance')}
                    description={t('reports.noPerformanceDesc')}
                  />
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="exports" className="mt-6">
          {expLoading ? (
            <TableSkeleton columns={4} />
          ) : expError ? (
            <ErrorState error={expError} onRetry={() => refetchExp()} />
          ) : (
            <div
              className={cn(
                'flex flex-col gap-4',
                expFetching && !expLoading && 'pointer-events-none opacity-60 transition-opacity',
              )}
            >
              <FilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t('reports.searchExports')}
              />

              {filteredExports.length === 0 ? (
                searchQuery ? (
                  <EmptyState
                    title={t('common.noResults')}
                    description={t('common.noResultsDescription')}
                  />
                ) : (
                  <EmptyState
                    title={t('reports.noExports')}
                    description={t('reports.noExportsDesc')}
                  />
                )
              ) : (
                <>
                  <EntityTable
                    data={filteredExports}
                    columns={exportColumns}
                    keyExtractor={(item) => item.id}
                  />
                  <PaginationFooter
                    page={expPage}
                    onPageChange={setExpPage}
                    pageSize={expPageSize}
                    onPageSizeChange={setExpPageSize}
                    meta={expMeta}
                  />
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
