import type { ContactRequestResponse } from '@bopacorp/shared/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { getErrorMessage } from '@/shared/errors/index.js';
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
import { updateContactRequest } from '../catalog.service.js';
import { ContactRequestDetailSheet } from '../components/ContactRequestDetailSheet.js';
import { useContactRequests } from '../hooks/useContactRequests.js';

const ATTENDED_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Atendidos' },
  { value: 'false', label: 'Pendientes' },
];

const PAGE_SIZE = 10;

export default function ContactRequestsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAttendedFilter, setIsAttendedFilter] = useState('all');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  usePageReset([search, isAttendedFilter], setPage);

  const isAttended = isAttendedFilter === 'all' ? undefined : isAttendedFilter === 'true';

  const { contactRequests, meta, loading, error, refetch } = useContactRequests(page, {
    search,
    isAttended,
  });

  const canUpdate = hasPermission('contact_requests.update');

  const attendMutation = useMutation({
    mutationFn: (id: string) => updateContactRequest(id, { isAttended: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.contactRequests.all });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const columns = [
    {
      id: 'clientName',
      header: 'Nombre',
      accessor: (item: ContactRequestResponse) => (
        <span className="font-medium text-foreground hover:underline">{item.clientName}</span>
      ),
    },
    {
      id: 'clientEmail',
      header: 'Correo',
      accessor: (item: ContactRequestResponse) => item.clientEmail,
    },
    {
      id: 'clientPhone',
      header: 'Teléfono',
      accessor: (item: ContactRequestResponse) => item.clientPhone ?? '—',
    },
    {
      id: 'receivedAt',
      header: 'Recibido',
      accessor: (item: ContactRequestResponse) => formatDate(item.createdAt),
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: ContactRequestResponse) => (
        <StateBadge
          state={item.isAttended ? 'ATTENDED' : 'PENDING'}
          label={item.isAttended ? 'Atendido' : 'Pendiente'}
          variant={item.isAttended ? 'default' : 'secondary'}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: (item: ContactRequestResponse) =>
        !item.isAttended &&
        canUpdate && (
          <div
            role="none"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              disabled={attendMutation.isPending && attendMutation.variables === item.id}
              onClick={() => attendMutation.mutate(item.id)}
            >
              {attendMutation.isPending && attendMutation.variables === item.id ? (
                <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 data-icon="inline-start" className="size-4" />
              )}
              {attendMutation.isPending && attendMutation.variables === item.id
                ? 'Atendiendo…'
                : 'Marcar atendida'}
            </Button>
          </div>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Solicitudes de contacto"
          description="Mensajes de clientes interesados en los planes"
        />
        <TableSkeleton columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Solicitudes de contacto"
          description="Mensajes de clientes interesados en los planes"
        />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Solicitudes de contacto"
        description="Mensajes de clientes interesados en los planes"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, correo o teléfono..."
        filters={[
          {
            id: 'isAttended',
            label: 'Estado',
            placeholder: 'Estado',
            options: ATTENDED_OPTIONS,
            value: isAttendedFilter,
            onChange: setIsAttendedFilter,
          },
        ]}
      />

      {contactRequests.length === 0 ? (
        <EmptyState
          title="No hay solicitudes"
          description="Las solicitudes de contacto del sitio web aparecerán aquí"
        />
      ) : (
        <>
          <EntityTable
            data={contactRequests}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => {
              setSelectedRequestId(item.id);
              setDetailOpen(true);
            }}
          />
          <PaginationFooter
            page={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            onPageSizeChange={() => {}}
            meta={meta}
          />
        </>
      )}

      {selectedRequestId && (
        <ContactRequestDetailSheet
          open={detailOpen}
          onOpenChange={setDetailOpen}
          contactRequestId={selectedRequestId}
        />
      )}
    </div>
  );
}
