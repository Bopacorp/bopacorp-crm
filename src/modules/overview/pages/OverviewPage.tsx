import type { AdvisorMetricResponse } from '@bopacorp/shared/reports';
import { CalendarCheck, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.js';
import { Field, FieldLabel } from '@/components/ui/field.js';
import { Input } from '@/components/ui/input.js';
import { formatCurrency } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { MANAGEMENT_ROLES } from '@/modules/auth/constants.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisorMetrics } from '@/modules/reports/hooks/useAdvisorMetrics.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  KpiCard,
  SectionHeader,
  TableSkeleton,
} from '@/shared/ui';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { AdvisorDetailSheet } from '../components/AdvisorDetailSheet.js';
import { FunnelChart } from '../components/FunnelChart.js';
import { aggregateStateCounts, collectStates, getStateCount } from '../utils.js';

function advisorName(item: AdvisorMetricResponse) {
  const profile = item.advisor.profile;
  return profile ? `${profile.firstName} ${profile.lastName}` : item.advisor.username;
}

export default function OverviewPage() {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();

  const isManagement = MANAGEMENT_ROLES.some((r) => hasRole(r));
  const isSupervisor = hasRole('supervisor');
  const isAdvisorOnly = hasRole('advisor') && !isManagement;

  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorMetricResponse | null>(null);

  const metricsQuery = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      ...(isSupervisor && !hasRole('admin') && !hasRole('manager') && { supervisorId: user?.id }),
    }),
    [dateFrom, dateTo, isSupervisor, hasRole, user],
  );

  const {
    data: metrics,
    isLoading: loading,
    isFetching: fetching,
    error,
    refetch,
  } = useAdvisorMetrics(metricsQuery);

  const displayMetrics = useMemo(() => {
    if (!metrics) return [];
    if (isAdvisorOnly) return metrics.filter((m) => m.advisor.id === user?.id);
    return metrics;
  }, [metrics, isAdvisorOnly, user]);

  const states = useMemo(() => collectStates(displayMetrics), [displayMetrics]);

  const totals = useMemo(() => {
    const stateTotals = aggregateStateCounts(displayMetrics);
    const visited = displayMetrics.reduce((sum, m) => sum + m.clientsVisited, 0);
    let avgDaysSum = 0;
    let avgDaysCount = 0;
    for (const m of displayMetrics) {
      if (m.avgDaysToClose != null) {
        avgDaysSum += m.avgDaysToClose;
        avgDaysCount++;
      }
    }
    return { stateTotals, visited, avgDaysSum, avgDaysCount };
  }, [displayMetrics]);

  const avgDays =
    totals.avgDaysCount > 0 ? (totals.avgDaysSum / totals.avgDaysCount).toFixed(1) : null;

  const columns = useMemo(() => {
    const base = [
      {
        id: 'advisor',
        header: t('common.advisor'),
        accessor: (item: AdvisorMetricResponse) => (
          <span className="font-medium text-foreground hover:underline">{advisorName(item)}</span>
        ),
      },
    ];

    const stateCols = states.map((s) => ({
      id: s.code,
      header: s.name,
      accessor: (item: AdvisorMetricResponse) => getStateCount(item, s.code),
    }));

    const tail = [
      {
        id: 'visited',
        header: t('overview.visited'),
        accessor: (item: AdvisorMetricResponse) => item.clientsVisited,
      },
      {
        id: 'billed',
        header: t('overview.billed'),
        accessor: (item: AdvisorMetricResponse) => formatCurrency(item.totalBilledAmount),
      },
      {
        id: 'avgPerService',
        header: t('overview.avgPerService'),
        accessor: (item: AdvisorMetricResponse) => formatCurrency(item.averageBillingPerService),
      },
      {
        id: 'daysToClose',
        header: t('overview.daysToClose'),
        accessor: (item: AdvisorMetricResponse) =>
          item.avgDaysToClose?.toFixed(1) ?? t('overview.noData'),
      },
    ];

    return [...base, ...stateCols, ...tail];
  }, [states, t]);

  if (loading) return <TableSkeleton columns={6} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-6',
        fetching && 'pointer-events-none opacity-60 transition-opacity',
      )}
    >
      <SectionHeader
        title={isAdvisorOnly ? t('overview.myMetrics') : t('overview.title')}
        description={isAdvisorOnly ? t('overview.myMetricsDesc') : t('overview.description')}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {states.slice(0, 2).map((s) => (
          <KpiCard
            key={s.code}
            title={s.name}
            value={totals.stateTotals.get(s.code)?.count ?? 0}
            subtitle={s.name}
          />
        ))}
        <KpiCard
          title={t('overview.clientsVisited')}
          value={totals.visited}
          subtitle={t('overview.clientsVisitedSub')}
          icon={CalendarCheck}
        />
        <KpiCard
          title={t('overview.avgDaysToClose')}
          value={avgDays ?? t('overview.noData')}
          subtitle={t('overview.avgDaysToCloseSub')}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FunnelChart data={displayMetrics} />
        </div>
        <ActivityFeed
          dateFrom={dateFrom || undefined}
          dateTo={dateTo || undefined}
          advisorId={isAdvisorOnly ? user?.id : undefined}
        />
      </div>

      {!isAdvisorOnly && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <Field className="w-auto">
              <FieldLabel>{t('overview.from')}</FieldLabel>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={today}
              />
            </Field>
            <Field className="w-auto">
              <FieldLabel>{t('overview.to')}</FieldLabel>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                max={today}
              />
            </Field>
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              {t('common.clear')}
            </Button>
          </div>

          {displayMetrics.length === 0 ? (
            <EmptyState title={t('overview.noMetrics')} description={t('overview.noMetricsDesc')} />
          ) : (
            <EntityTable
              data={displayMetrics}
              columns={columns}
              keyExtractor={(item) => item.advisor.id}
              onRowClick={(item) => setSelectedAdvisor(item)}
            />
          )}
        </div>
      )}

      <AdvisorDetailSheet advisor={selectedAdvisor} onClose={() => setSelectedAdvisor(null)} />
    </div>
  );
}
