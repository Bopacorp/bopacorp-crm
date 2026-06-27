import type { JobVacancyListItemResponse } from '@bopacorp/shared/employability';
import { Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
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
import { CreateVacancyDialog } from '../components/CreateVacancyDialog.js';
import { VacancySheet } from '../components/VacancySheet.js';
import { useVacancies } from '../hooks/useVacancies.js';

export default function VacanciesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [isPublishedFilter, setIsPublishedFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const isActive = isActiveFilter === 'all' ? undefined : isActiveFilter === 'true';
  const isPublished = isPublishedFilter === 'all' ? undefined : isPublishedFilter === 'true';

  const { vacancies, meta, loading, fetching, error, refetch } = useVacancies(page, {
    search,
    isActive,
    isPublished,
  });

  usePageReset([search, isActiveFilter, isPublishedFilter, pageSize], setPage);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'true', label: t('employability.activeFem') },
      { value: 'false', label: t('employability.inactiveFem') },
    ],
    [t],
  );
  const publishedOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'true', label: t('employability.publishedFem') },
      { value: 'false', label: t('employability.draft') },
    ],
    [t],
  );

  const columns = [
    {
      id: 'title',
      header: t('employability.vacancyTitle'),
      accessor: (item: JobVacancyListItemResponse) => (
        <span className="font-medium text-foreground hover:underline">{item.title}</span>
      ),
    },
    {
      id: 'creator',
      header: t('employability.creator'),
      accessor: (item: JobVacancyListItemResponse) => item.creator.username,
    },
    {
      id: 'isActive',
      header: t('employability.activeFem'),
      accessor: (item: JobVacancyListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? t('employability.activeFem') : t('employability.inactiveFem')}
        />
      ),
    },
    {
      id: 'isPublished',
      header: t('employability.publishedFem'),
      accessor: (item: JobVacancyListItemResponse) => (
        <StateBadge
          state={item.isPublished ? 'published' : 'draft'}
          label={item.isPublished ? t('employability.publishedFem') : t('employability.draft')}
        />
      ),
    },
    {
      id: 'publicationDate',
      header: t('employability.publishDate'),
      accessor: (item: JobVacancyListItemResponse) => formatDate(item.publicationDate),
      sortable: true,
    },
    {
      id: 'closingDate',
      header: t('employability.closing'),
      accessor: (item: JobVacancyListItemResponse) => formatDate(item.closingDate),
      sortable: true,
    },
    {
      id: 'applications',
      header: t('employability.applicants'),
      accessor: (item: JobVacancyListItemResponse) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            navigate(`/empleabilidad/aplicantes?vacancyId=${item.id}`);
          }}
        >
          <Users data-icon="inline-start" className="size-4" />
          {t('employability.viewApplicants')}
        </Button>
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
      <SectionHeader
        title={t('employability.vacancies')}
        description={t('employability.vacanciesDesc')}
        actions={
          <Can permission="job_vacancies.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('employability.newVacancy')}
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('employability.searchVacancies')}
        filters={[
          {
            id: 'isActive',
            label: t('common.status'),
            placeholder: t('common.status'),
            options: statusOptions,
            value: isActiveFilter,
            onChange: setIsActiveFilter,
          },
          {
            id: 'isPublished',
            label: t('employability.publishedFem'),
            placeholder: t('employability.publishedFem'),
            options: publishedOptions,
            value: isPublishedFilter,
            onChange: setIsPublishedFilter,
          },
        ]}
      />

      {vacancies.length === 0 ? (
        search || isActive !== undefined || isPublished !== undefined ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noResultsDescription')}
          />
        ) : (
          <EmptyState
            title={t('employability.noVacancies')}
            description={t('employability.noVacanciesDesc')}
          />
        )
      ) : (
        <>
          <EntityTable
            data={vacancies}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => setEditId(item.id)}
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

      <CreateVacancyDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={refetch} />

      <VacancySheet
        open={!!editId}
        onOpenChange={(open) => {
          if (!open) setEditId(null);
        }}
        vacancyId={editId}
        onSuccess={refetch}
      />
    </div>
  );
}
