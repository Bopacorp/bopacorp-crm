import type { JobVacancyListItemResponse } from '@bopacorp/shared/employability';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Activas' },
  { value: 'false', label: 'Inactivas' },
];

const PUBLISHED_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Publicadas' },
  { value: 'false', label: 'Borrador' },
];

export default function VacanciesPage() {
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

  const columns = [
    {
      id: 'title',
      header: 'Título',
      accessor: (item: JobVacancyListItemResponse) => (
        <span className="font-medium text-foreground hover:underline">{item.title}</span>
      ),
    },
    {
      id: 'creator',
      header: 'Creador',
      accessor: (item: JobVacancyListItemResponse) => item.creator.username,
    },
    {
      id: 'isActive',
      header: 'Activa',
      accessor: (item: JobVacancyListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? 'Activa' : 'Inactiva'}
        />
      ),
    },
    {
      id: 'isPublished',
      header: 'Publicada',
      accessor: (item: JobVacancyListItemResponse) => (
        <StateBadge
          state={item.isPublished ? 'published' : 'draft'}
          label={item.isPublished ? 'Publicada' : 'Borrador'}
        />
      ),
    },
    {
      id: 'publicationDate',
      header: 'Publicación',
      accessor: (item: JobVacancyListItemResponse) => formatDate(item.publicationDate),
      sortable: true,
    },
    {
      id: 'closingDate',
      header: 'Cierre',
      accessor: (item: JobVacancyListItemResponse) => formatDate(item.closingDate),
      sortable: true,
    },
    {
      id: 'applications',
      header: 'Aplicantes',
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
          Ver aplicantes
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
        title="Vacantes"
        description="Gestión de vacantes de empleo"
        actions={
          <Can permission="job_vacancies.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nueva vacante
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar vacantes..."
        filters={[
          {
            id: 'isActive',
            label: 'Estado',
            placeholder: 'Estado',
            options: STATUS_OPTIONS,
            value: isActiveFilter,
            onChange: setIsActiveFilter,
          },
          {
            id: 'isPublished',
            label: 'Publicación',
            placeholder: 'Publicación',
            options: PUBLISHED_OPTIONS,
            value: isPublishedFilter,
            onChange: setIsPublishedFilter,
          },
        ]}
      />

      {vacancies.length === 0 ? (
        search || isActive !== undefined || isPublished !== undefined ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron vacantes con los filtros aplicados"
          />
        ) : (
          <EmptyState title="No hay vacantes" description="Crea tu primera vacante para comenzar" />
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
