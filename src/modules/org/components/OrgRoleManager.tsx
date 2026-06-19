import type { PaginationMeta } from '@bopacorp/shared/common';
import type { OrgRoleListItemResponse } from '@bopacorp/shared/core';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query-keys.js';
import { cn } from '@/lib/utils';
import { usePageReset } from '@/shared/hooks/usePageReset.js';
import {
  Can,
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  PaginationFooter,
  StateBadge,
  TableSkeleton,
} from '@/shared/ui';
import { listDepartments, listOrgRoles } from '../org.service.js';
import { OrgRoleSheet } from './OrgRoleSheet.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

export function OrgRoleManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [debouncedSearch] = useDebounce(search, 400);

  const isActive = isActiveFilter === 'all' ? undefined : isActiveFilter === 'true';
  const departmentId = departmentFilter === 'all' ? undefined : departmentFilter;

  usePageReset([debouncedSearch, isActiveFilter, departmentFilter, pageSize], setPage);

  const { data: deptData } = useQuery({
    queryKey: [...queryKeys.departments.all, 'filter-options'],
    queryFn: () => listDepartments({ page: 1, limit: 100, sortOrder: 'asc', isActive: true }),
    staleTime: 5 * 60_000,
  });

  const departmentOptions = [
    { value: 'all', label: 'Todos' },
    ...(deptData?.data.map((d) => ({ value: d.id, label: d.name })) ?? []),
  ];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      ...queryKeys.orgRoles.all,
      'list',
      page,
      { search: debouncedSearch, isActive, departmentId, pageSize },
    ],
    queryFn: () =>
      listOrgRoles({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive,
        departmentId,
        sortOrder: 'asc',
      }),
  });

  const items = data?.data ?? [];
  const meta: PaginationMeta | null = data?.meta ?? null;

  const columns = [
    {
      id: 'code',
      header: 'Código',
      accessor: (item: OrgRoleListItemResponse) => (
        <span className="font-mono text-xs">{item.code}</span>
      ),
    },
    {
      id: 'name',
      header: 'Nombre',
      accessor: (item: OrgRoleListItemResponse) => item.name,
    },
    {
      id: 'department',
      header: 'Departamento',
      accessor: (item: OrgRoleListItemResponse) => (
        <span className="text-muted-foreground">{item.department?.name ?? '—'}</span>
      ),
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: OrgRoleListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? 'Activo' : 'Inactivo'}
        />
      ),
    },
  ];

  if (isLoading) return <TableSkeleton columns={4} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        isFetching && 'pointer-events-none opacity-60 transition-opacity',
      )}
    >
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar roles organizacionales..."
        filters={[
          {
            id: 'department',
            label: 'Departamento',
            placeholder: 'Departamento',
            options: departmentOptions,
            value: departmentFilter,
            onChange: setDepartmentFilter,
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
        actions={
          <Can permission="org_roles.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nuevo rol
            </Button>
          </Can>
        }
      />

      {items.length === 0 ? (
        debouncedSearch || isActive !== undefined || departmentId ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron roles organizacionales con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay roles organizacionales"
            description="Crea tu primer rol organizacional para comenzar"
          />
        )
      ) : (
        <>
          <EntityTable
            data={items}
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

      <OrgRoleSheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        entityId={selectedId}
        mode="view"
      />

      <OrgRoleSheet open={createOpen} onOpenChange={setCreateOpen} entityId={null} mode="create" />
    </div>
  );
}
