import type { PaginationMeta } from '@bopacorp/shared/common';
import type { OrgRoleListItemResponse } from '@bopacorp/shared/core';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export function OrgRoleManager() {
  const { t } = useTranslation();
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
    { value: 'all', label: t('common.all') },
    ...(deptData?.data.map((d) => ({ value: d.id, label: d.name })) ?? []),
  ];

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'true', label: t('common.actives') },
    { value: 'false', label: t('common.inactives') },
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
      header: t('common.code'),
      accessor: (item: OrgRoleListItemResponse) => (
        <span className="font-mono text-xs">{item.code}</span>
      ),
    },
    {
      id: 'name',
      header: t('common.name'),
      accessor: (item: OrgRoleListItemResponse) => item.name,
    },
    {
      id: 'department',
      header: t('org.departmentSingular'),
      accessor: (item: OrgRoleListItemResponse) => (
        <span className="text-muted-foreground">{item.department?.name ?? '—'}</span>
      ),
    },
    {
      id: 'state',
      header: t('common.status'),
      accessor: (item: OrgRoleListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? t('common.active') : t('common.inactive')}
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
        searchPlaceholder={t('org.searchOrgRoles')}
        filters={[
          {
            id: 'department',
            label: t('org.departmentSingular'),
            placeholder: t('org.departmentSingular'),
            options: departmentOptions,
            value: departmentFilter,
            onChange: setDepartmentFilter,
          },
          {
            id: 'isActive',
            label: t('common.status'),
            placeholder: t('common.status'),
            options: statusOptions,
            value: isActiveFilter,
            onChange: setIsActiveFilter,
          },
        ]}
        actions={
          <Can permission="org_roles.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('org.newOrgRole')}
            </Button>
          </Can>
        }
      />

      {items.length === 0 ? (
        debouncedSearch || isActive !== undefined || departmentId ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noFilterResults', {
              entities: t('org.orgRolePlural').toLowerCase(),
            })}
          />
        ) : (
          <EmptyState
            title={t('common.noEntities', { entities: t('org.orgRolePlural').toLowerCase() })}
            description={t('common.createFirstEntity', {
              entity: t('org.orgRoleSingular').toLowerCase(),
            })}
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
