import type { BusinessClientListItemResponse } from '@bopacorp/shared/crm';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      header: t('common.company'),
      accessor: (item: BusinessClientListItemResponse) => (
        <span className="font-medium">{item.businessName}</span>
      ),
      sortable: true,
    },
    {
      id: 'ruc',
      header: t('clients.ruc'),
      accessor: (item: BusinessClientListItemResponse) => item.ruc,
    },
    {
      id: 'contactName',
      header: t('common.contact'),
      accessor: (item: BusinessClientListItemResponse) => item.contactName,
      sortable: true,
    },
    ...(!isAdvisor
      ? [
          {
            id: 'advisor',
            header: t('common.advisor'),
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
      header: t('common.status'),
      accessor: (item: BusinessClientListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? t('common.active') : t('common.inactive')}
        />
      ),
    },
    {
      id: 'createdAt',
      header: t('common.created'),
      accessor: (item: BusinessClientListItemResponse) => formatDate(item.createdAt),
      sortable: true,
    },
  ];

  const activeOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'true', label: t('common.active') },
    { value: 'false', label: t('common.inactive') },
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
        title={t('clients.title')}
        description={t('clients.description')}
        actions={
          <Can permission="business_clients.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('clients.newClient')}
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('clients.searchPlaceholder')}
        filters={[
          {
            id: 'active',
            label: t('common.status'),
            placeholder: t('common.status'),
            options: activeOptions,
            value: isActive === undefined ? 'all' : String(isActive),
            onChange: (value) => setIsActive(value === 'all' ? undefined : value === 'true'),
          },
          ...(!isAdvisor
            ? [
                {
                  id: 'advisor',
                  label: t('common.advisor'),
                  placeholder: t('common.selectAdvisor'),
                  searchable: true,
                  options: [{ value: 'all', label: t('common.all') }, ...advisorOptions],
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
            title={t('common.noResults')}
            description={t('common.noFilterResults', {
              entities: t('clients.title').toLowerCase(),
            })}
          />
        ) : (
          <EmptyState
            title={t('common.noEntities', { entities: t('clients.title').toLowerCase() })}
            description={t('common.createFirstEntity', {
              entity: t('clients.title').toLowerCase(),
            })}
            action={
              hasPermission('business_clients.create')
                ? { label: `+ ${t('clients.newClient')}`, onClick: () => setCreateOpen(true) }
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
