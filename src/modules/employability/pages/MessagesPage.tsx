import type { ContactRequestResponse } from '@bopacorp/shared/catalog';
import { useState } from 'react';
import { formatRelativeTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { useContactRequests } from '@/modules/catalog/hooks/useContactRequests.js';
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
import { ContactRequestSheet } from '../components/ContactRequestSheet.js';

const ATTENDED_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'false', label: 'Pendientes' },
  { value: 'true', label: 'Atendidos' },
];

export default function MessagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [attendedFilter, setAttendedFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isAttended = attendedFilter === 'all' ? undefined : attendedFilter === 'true';

  const { contactRequests, meta, loading, fetching, error, refetch } = useContactRequests(page, {
    search,
    isAttended,
  });

  usePageReset([search, attendedFilter, pageSize], setPage);

  const columns = [
    {
      id: 'clientName',
      header: 'Nombre',
      accessor: (item: ContactRequestResponse) => (
        <span className={cn('font-medium', !item.isAttended && 'text-foreground')}>
          {item.clientName}
        </span>
      ),
    },
    {
      id: 'clientEmail',
      header: 'Email',
      accessor: (item: ContactRequestResponse) => item.clientEmail,
    },
    {
      id: 'clientPhone',
      header: 'Teléfono',
      accessor: (item: ContactRequestResponse) => item.clientPhone ?? '—',
    },
    {
      id: 'message',
      header: 'Mensaje',
      accessor: (item: ContactRequestResponse) => (
        <span className="line-clamp-1 max-w-48 text-muted-foreground">{item.message ?? '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: ContactRequestResponse) => (
        <StateBadge
          state={item.isAttended ? 'active' : 'pending'}
          label={item.isAttended ? 'Atendido' : 'Pendiente'}
        />
      ),
    },
    {
      id: 'createdAt',
      header: 'Recibido',
      accessor: (item: ContactRequestResponse) => formatRelativeTime(item.createdAt),
    },
  ];

  if (loading) return <TableSkeleton columns={6} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        fetching && 'pointer-events-none opacity-60 transition-opacity',
      )}
    >
      <SectionHeader
        title="Solicitudes de contacto"
        description="Solicitudes recibidas desde el sitio web"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o email..."
        filters={[
          {
            id: 'attended',
            label: 'Estado',
            placeholder: 'Estado',
            options: ATTENDED_OPTIONS,
            value: attendedFilter,
            onChange: setAttendedFilter,
          },
        ]}
      />

      {contactRequests.length === 0 ? (
        search || isAttended !== undefined ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron solicitudes con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay solicitudes"
            description="Las solicitudes de contacto del sitio web aparecerán aquí"
          />
        )
      ) : (
        <>
          <EntityTable
            data={contactRequests}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => setSelectedId(item.id)}
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

      <ContactRequestSheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        requestId={selectedId}
      />
    </div>
  );
}
