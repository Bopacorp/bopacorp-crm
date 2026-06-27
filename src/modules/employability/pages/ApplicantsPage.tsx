import type { JobApplicationListItemResponse } from '@bopacorp/shared/employability';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { usePageReset } from '@/shared/hooks/usePageReset.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  PaginationFooter,
  SectionHeader,
  StateBadge,
  TableSkeleton,
} from '@/shared/ui';
import { ApplicationActions } from '../components/ApplicationActions.js';
import { ApplicationDetailSheet } from '../components/ApplicationDetailSheet.js';
import { useJobApplications } from '../hooks/useJobApplications.js';
import { applicationStateLabel, applicationStateVariant } from '../lib/state.js';

export default function ApplicantsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const vacancyId = searchParams.get('vacancyId') ?? undefined;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [detailId, setDetailId] = useState<string | null>(null);

  const state = stateFilter === 'all' ? undefined : stateFilter;

  const { applications, meta, loading, fetching, error, refetch } = useJobApplications(page, {
    search,
    vacancyId,
    state,
  });

  usePageReset([search, stateFilter, vacancyId, pageSize], setPage);

  const stateOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'DRAFT', label: t('employability.stateDraft') },
      { value: 'PENDING', label: t('employability.statePending') },
      { value: 'ACCEPTED', label: t('employability.stateReviewed') },
      { value: 'REJECTED', label: t('employability.stateRejected') },
    ],
    [t],
  );

  const columns = [
    {
      id: 'candidate',
      header: t('employability.candidate'),
      accessor: (item: JobApplicationListItemResponse) => (
        <span className="font-medium text-foreground hover:underline">
          {item.candidate.firstName} {item.candidate.lastName}
        </span>
      ),
    },
    {
      id: 'vacancy',
      header: t('employability.vacancy'),
      accessor: (item: JobApplicationListItemResponse) => item.vacancy.title,
    },
    {
      id: 'appliedAt',
      header: t('employability.applicationDate'),
      accessor: (item: JobApplicationListItemResponse) =>
        item.appliedAt ? formatDate(item.appliedAt) : '—',
    },
    {
      id: 'state',
      header: t('common.status'),
      accessor: (item: JobApplicationListItemResponse) => (
        <StateBadge
          state={item.state}
          label={applicationStateLabel(item.state)}
          variant={applicationStateVariant(item.state)}
        />
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      accessor: (item: JobApplicationListItemResponse) => (
        <ApplicationActions application={item} onSuccess={refetch} />
      ),
    },
  ];

  if (loading) return <TableSkeleton columns={columns.length} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-6',
        fetching && 'pointer-events-none opacity-60 transition-opacity',
      )}
    >
      {vacancyId && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => {
            searchParams.delete('vacancyId');
            setSearchParams(searchParams);
          }}
        >
          <ArrowLeft data-icon="inline-start" />
          {t('employability.backToVacancies')}
        </Button>
      )}

      <SectionHeader
        title={t('employability.applicants')}
        description={
          vacancyId ? t('employability.applicantsVacancyDesc') : t('employability.applicantsDesc')
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('employability.searchApplicants')}
        filters={[
          {
            id: 'state',
            label: t('common.status'),
            placeholder: t('common.status'),
            options: stateOptions,
            value: stateFilter,
            onChange: setStateFilter,
          },
        ]}
      />

      {applications.length === 0 ? (
        search || state ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noResultsDescription')}
          />
        ) : (
          <EmptyState
            title={t('employability.noApplications')}
            description={t('employability.noApplicationsDesc')}
          />
        )
      ) : (
        <>
          <EntityTable
            data={applications}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => setDetailId(item.id)}
          />

          <PaginationFooter
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            meta={meta}
          />
        </>
      )}

      <ApplicationDetailSheet
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        applicationId={detailId}
        onSuccess={refetch}
      />
    </div>
  );
}
