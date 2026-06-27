import type { EmployeeListItemResponse } from '@bopacorp/shared/core';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export default function TeamPage() {
  const { t } = useTranslation();
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
    () => [{ value: 'all', label: t('common.all') }, ...orgRoleOptions],
    [orgRoleOptions, t],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'true', label: t('common.actives') },
      { value: 'false', label: t('common.inactives') },
    ],
    [t],
  );

  const columns = [
    {
      id: 'name',
      header: t('common.name'),
      accessor: (item: EmployeeListItemResponse) => (
        <span className="font-medium">{fullName(item)}</span>
      ),
      sortable: true,
    },
    {
      id: 'email',
      header: t('common.email'),
      accessor: (item: EmployeeListItemResponse) => item.user.email,
    },
    {
      id: 'orgRole',
      header: t('org.role'),
      accessor: (item: EmployeeListItemResponse) => item.orgRole.name,
    },
    {
      id: 'territory',
      header: t('org.territory'),
      accessor: (item: EmployeeListItemResponse) => item.territory ?? '—',
    },
    {
      id: 'status',
      header: t('common.status'),
      accessor: (item: EmployeeListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? t('common.active') : t('common.inactive')}
        />
      ),
    },
    {
      id: 'createdAt',
      header: t('common.created'),
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
        title={t('org.title')}
        description={t('org.description')}
        actions={
          <Can permission="employees.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('org.newMember')}
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('org.searchPlaceholder')}
        filters={[
          {
            id: 'orgRole',
            label: t('org.role'),
            placeholder: t('org.role'),
            options: roleFilterOptions,
            value: orgRoleFilter,
            onChange: setOrgRoleFilter,
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
      />

      {employees.length === 0 ? (
        search || isActive !== undefined || orgRoleId ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noFilterResults', {
              entities: t('org.employee').toLowerCase(),
            })}
          />
        ) : (
          <EmptyState
            title={t('common.noEntities', { entities: t('org.employee').toLowerCase() })}
            description={t('common.createFirstEntity', { entity: t('org.employee').toLowerCase() })}
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
