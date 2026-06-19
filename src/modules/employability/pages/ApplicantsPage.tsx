import type { JobApplicationListItemResponse } from '@bopacorp/shared/employability';
import { ArrowLeft, FileText } from 'lucide-react';
import { useState } from 'react';
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

const STATE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'ACCEPTED', label: 'Aceptado' },
  { value: 'REJECTED', label: 'Rechazado' },
];

export default function ApplicantsPage() {
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

  const columns = [
    {
      id: 'candidate',
      header: 'Candidato',
      accessor: (item: JobApplicationListItemResponse) => (
        <span className="font-medium text-foreground hover:underline">
          {item.candidate.firstName} {item.candidate.lastName}
        </span>
      ),
    },
    {
      id: 'vacancy',
      header: 'Vacante',
      accessor: (item: JobApplicationListItemResponse) => item.vacancy.title,
    },
    {
      id: 'appliedAt',
      header: 'Fecha de aplicación',
      accessor: (item: JobApplicationListItemResponse) =>
        item.appliedAt ? formatDate(item.appliedAt) : '—',
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: JobApplicationListItemResponse) => (
        <StateBadge
          state={item.state}
          label={applicationStateLabel(item.state)}
          variant={applicationStateVariant(item.state)}
        />
      ),
    },
    {
      id: 'resume',
      header: 'CV',
      accessor: (item: JobApplicationListItemResponse) =>
        item.hasResume ? <FileText className="size-4 text-muted-foreground" /> : '—',
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: (item: JobApplicationListItemResponse) => (
        <ApplicationActions
          application={item}
          onDetailClick={(id) => setDetailId(id)}
          onSuccess={refetch}
        />
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
          Volver a vacantes
        </Button>
      )}

      <SectionHeader
        title="Aplicantes"
        description={
          vacancyId
            ? 'Postulantes filtrados por vacante seleccionada'
            : 'Gestión de candidatos y aplicaciones a vacantes'
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar candidatos..."
        filters={[
          {
            id: 'state',
            label: 'Estado',
            placeholder: 'Estado',
            options: STATE_OPTIONS,
            value: stateFilter,
            onChange: setStateFilter,
          },
        ]}
      />

      {applications.length === 0 ? (
        search || state ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron aplicaciones con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay aplicaciones"
            description="Las aplicaciones de candidatos aparecerán aquí"
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
