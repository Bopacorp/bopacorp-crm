import type { ContactRequestResponse } from '@bopacorp/shared/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Mail, MessageSquare, Phone } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { usePageReset } from '@/shared/hooks/usePageReset.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  PaginationFooter,
  SectionHeader,
  TableSkeleton,
} from '@/shared/ui';
import { updateContactRequest } from '../catalog.service.js';
import { useContactRequests } from '../hooks/useContactRequests.js';

const ATTENDED_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Atendidos' },
  { value: 'false', label: 'Pendientes' },
];

const PAGE_SIZE = 10;

export default function ContactRequestsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAttendedFilter, setIsAttendedFilter] = useState('all');

  usePageReset([search, isAttendedFilter], setPage);

  const isAttended = isAttendedFilter === 'all' ? undefined : isAttendedFilter === 'true';

  const { contactRequests, meta, loading, error, refetch } = useContactRequests(page, {
    search,
    isAttended,
  });

  const attendMutation = useMutation({
    mutationFn: (id: string) => updateContactRequest(id, { isAttended: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.contactRequests.all });
    },
  });

  const columns = [
    {
      id: 'clientName',
      header: 'Nombre',
      accessor: (item: ContactRequestResponse) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.clientName}</span>
          {item.itemName && (
            <span className="text-xs text-muted-foreground">Plan: {item.itemName}</span>
          )}
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contacto',
      accessor: (item: ContactRequestResponse) => (
        <div className="flex flex-col gap-0.5 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="size-3.5" />
            <span>{item.clientEmail}</span>
          </div>
          {item.clientPhone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-3.5" />
              <span>{item.clientPhone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'message',
      header: 'Mensaje',
      accessor: (item: ContactRequestResponse) => (
        <div className="flex items-start gap-1.5 max-w-xs">
          <MessageSquare className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate">
            {item.message ?? 'Sin mensaje'}
          </span>
        </div>
      ),
    },
    {
      id: 'receivedAt',
      header: 'Recibido',
      accessor: (item: ContactRequestResponse) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: ContactRequestResponse) =>
        item.isAttended ? (
          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200">
            <CheckCircle2 className="size-3" />
            Atendido
          </Badge>
        ) : (
          <Badge variant="secondary">Pendiente</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: (item: ContactRequestResponse) =>
        !item.isAttended && (
          <Can permission="contact_requests.update">
            <Button
              size="sm"
              variant="outline"
              disabled={attendMutation.isPending && attendMutation.variables === item.id}
              onClick={() => attendMutation.mutate(item.id)}
            >
              Marcar atendida
            </Button>
          </Can>
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
          <EntityTable data={contactRequests} columns={columns} keyExtractor={(item) => item.id} />
          <PaginationFooter
            page={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            onPageSizeChange={() => {}}
            meta={meta}
          />
        </>
      )}
    </div>
  );
}
