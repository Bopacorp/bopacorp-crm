import type { BusinessClientListItemResponse } from '@bopacorp/shared/crm';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
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
import { CreateBusinessClientDialog } from '../components/CreateBusinessClientDialog.js';
import { useClientSheet } from '../context/ClientSheetContext.js';
import { useBusinessClients } from '../hooks/useBusinessClients.js';

function employeeName(emp: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  return emp.user.firstName && emp.user.lastName
    ? `${emp.user.firstName} ${emp.user.lastName}`
    : emp.user.username;
}

export default function ClientsPage() {
  const { openClientSheet } = useClientSheet();
  const { user, hasRole } = useAuth();
  const isAdvisor = hasRole('advisor');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [advisorId, setAdvisorId] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const { hasPermission } = usePermission();
  const { advisors } = useAdvisors();

  const effectiveAdvisorId = isAdvisor ? user?.id : advisorId;

  const { clients, meta, loading, fetching, error, refetch } = useBusinessClients(page, {
    search,
    isActive,
    advisorId: effectiveAdvisorId,
    sortBy,
    sortOrder,
    limit: pageSize,
  });

  usePageReset([search, isActive, advisorId, sortBy, sortOrder, pageSize], setPage);

  const advisorOptions = useMemo(
    () => advisors.map((emp) => ({ value: emp.userId, label: employeeName(emp) })),
    [advisors],
  );

  const columns = [
    {
      id: 'businessName',
      header: 'Empresa',
      accessor: (item: BusinessClientListItemResponse) => (
        <span className="font-medium">{item.businessName}</span>
      ),
      sortable: true,
    },
    {
      id: 'ruc',
      header: 'RUC',
      accessor: (item: BusinessClientListItemResponse) => item.ruc,
    },
    {
      id: 'contactName',
      header: 'Contacto',
      accessor: (item: BusinessClientListItemResponse) => item.contactName,
      sortable: true,
    },
    ...(!isAdvisor
      ? [
          {
            id: 'advisor',
            header: 'Asesor',
            accessor: (item: BusinessClientListItemResponse) => {
              const a = item.advisor;
              if (!a) return '—';
              return a.profile ? `${a.profile.firstName} ${a.profile.lastName}` : a.username;
            },
          },
        ]
      : []),
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: BusinessClientListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? 'Activo' : 'Inactivo'}
        />
      ),
    },
    {
      id: 'createdAt',
      header: 'Creado',
      accessor: (item: BusinessClientListItemResponse) => formatDate(item.createdAt),
      sortable: true,
    },
  ];

  const activeOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' },
  ];

  if (loading) return <TableSkeleton columns={isAdvisor ? 5 : 6} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        fetching && 'opacity-60 pointer-events-none transition-opacity',
      )}
    >
      <SectionHeader
        title="Clientes"
        description="Gestión de empresas y contactos comerciales"
        actions={
          <Can permission="business_clients.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nuevo cliente
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por empresa o RUC..."
        filters={[
          {
            id: 'active',
            label: 'Estado',
            placeholder: 'Estado',
            options: activeOptions,
            value: isActive === undefined ? 'all' : String(isActive),
            onChange: (value) => setIsActive(value === 'all' ? undefined : value === 'true'),
          },
          ...(!isAdvisor
            ? [
                {
                  id: 'advisor',
                  label: 'Asesor',
                  placeholder: 'Seleccionar asesor',
                  searchable: true,
                  options: [{ value: 'all', label: 'Todos' }, ...advisorOptions],
                  value: advisorId ?? 'all',
                  onChange: (value: string) => setAdvisorId(value === 'all' ? undefined : value),
                },
              ]
            : []),
        ]}
      />

      {clients.length === 0 ? (
        search || isActive !== undefined || (!isAdvisor && advisorId) ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron clientes con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay clientes"
            description="Crea tu primer cliente para comenzar"
            action={
              hasPermission('business_clients.create')
                ? { label: '+ Nuevo cliente', onClick: () => setCreateOpen(true) }
                : undefined
            }
          />
        )
      ) : (
        <>
          <EntityTable
            data={clients}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => openClientSheet(item.id)}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(col, order) => {
              setSortBy(col);
              setSortOrder(order);
            }}
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

      <CreateBusinessClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
