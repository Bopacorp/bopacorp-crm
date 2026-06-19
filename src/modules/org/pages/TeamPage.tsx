import type { EmployeeListItemResponse } from '@bopacorp/shared/core';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { CreateEmployeeSheet } from '../components/CreateEmployeeSheet.js';
import { EmployeeSheet } from '../components/EmployeeSheet.js';
import { useEmployees } from '../hooks/useEmployees.js';
import { useOrgRoleOptions } from '../hooks/useOrgRoleOptions.js';

function fullName(emp: EmployeeListItemResponse) {
  const { firstName, lastName, username } = emp.user;
  return firstName && lastName ? `${firstName} ${lastName}` : username;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

export default function TeamPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [orgRoleFilter, setOrgRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const isActive = isActiveFilter === 'all' ? undefined : isActiveFilter === 'true';
  const orgRoleId = orgRoleFilter === 'all' ? undefined : orgRoleFilter;

  const { employees, meta, loading, fetching, error, refetch } = useEmployees(page, {
    search,
    isActive,
    orgRoleId,
    sortBy,
    sortOrder,
    limit: pageSize,
  });

  const { orgRoleOptions } = useOrgRoleOptions();

  usePageReset([search, isActiveFilter, orgRoleFilter, sortBy, sortOrder, pageSize], setPage);

  const roleFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Todos' }, ...orgRoleOptions],
    [orgRoleOptions],
  );

  const columns = [
    {
      id: 'name',
      header: 'Nombre',
      accessor: (item: EmployeeListItemResponse) => (
        <span className="font-medium">{fullName(item)}</span>
      ),
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessor: (item: EmployeeListItemResponse) => item.user.email,
    },
    {
      id: 'orgRole',
      header: 'Rol',
      accessor: (item: EmployeeListItemResponse) => item.orgRole.name,
    },
    {
      id: 'territory',
      header: 'Territorio',
      accessor: (item: EmployeeListItemResponse) => item.territory ?? '—',
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: EmployeeListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? 'Activo' : 'Inactivo'}
        />
      ),
    },
    {
      id: 'createdAt',
      header: 'Creado',
      accessor: (item: EmployeeListItemResponse) => formatDate(item.createdAt),
      sortable: true,
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
        title="Equipo"
        description="Gestión de empleados y asignaciones"
        actions={
          <Can permission="employees.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nuevo miembro
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o email..."
        filters={[
          {
            id: 'orgRole',
            label: 'Rol',
            placeholder: 'Rol',
            options: roleFilterOptions,
            value: orgRoleFilter,
            onChange: setOrgRoleFilter,
          },
          {
            id: 'isActive',
            label: 'Estado',
            placeholder: 'Estado',
            options: STATUS_OPTIONS,
            value: isActiveFilter,
            onChange: setIsActiveFilter,
          },
        ]}
      />

      {employees.length === 0 ? (
        search || isActive !== undefined || orgRoleId ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron empleados con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay empleados"
            description="Crea tu primer miembro del equipo para comenzar"
          />
        )
      ) : (
        <>
          <EntityTable
            data={employees}
            columns={columns}
            keyExtractor={(item) => item.userId}
            onRowClick={(item) => setSelectedUserId(item.userId)}
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

      <EmployeeSheet
        open={!!selectedUserId}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />

      <CreateEmployeeSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
