import type { NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { Columns3, List, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { useClientSheet } from '@/modules/clients/context/ClientSheetContext.js';
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
import { CreateNegotiationDialog } from '../components/CreateNegotiationDialog.js';
import { NegotiationKanbanBoard } from '../components/NegotiationKanbanBoard.js';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { useNegotiations } from '../hooks/useNegotiations.js';

function employeeName(emp: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  return emp.user.firstName && emp.user.lastName
    ? `${emp.user.firstName} ${emp.user.lastName}`
    : emp.user.username;
}

export default function NegotiationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openClientSheet } = useClientSheet();
  const { user, hasRole } = useAuth();
  const isAdvisor = hasRole('advisor');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState<string | undefined>();
  const [advisorId, setAdvisorId] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [view, setView] = useState<'table' | 'kanban'>(() => {
    const saved = localStorage.getItem('negotiations-view');
    return saved === 'kanban' ? 'kanban' : 'table';
  });

  const handleViewChange = (v: 'table' | 'kanban') => {
    setView(v);
    localStorage.setItem('negotiations-view', v);
  };
  const [createOpen, setCreateOpen] = useState(false);
  const { hasPermission } = usePermission();

  const effectiveAdvisorId = isAdvisor ? user?.id : advisorId;

  const { negotiations, meta, loading, fetching, error, refetch } = useNegotiations(page, {
    search,
    stateId,
    advisorId: effectiveAdvisorId,
    sortBy,
    sortOrder,
    limit: pageSize,
  });
  const { states } = useNegotiationStates();
  const { advisors } = useAdvisors();

  const advisorOptions = useMemo(
    () => advisors.map((emp) => ({ value: emp.userId, label: employeeName(emp) })),
    [advisors],
  );

  usePageReset([search, stateId, effectiveAdvisorId, sortBy, sortOrder, pageSize], setPage);

  const columns = [
    {
      id: 'company',
      header: t('common.company'),
      accessor: (item: NegotiationListItemResponse) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openClientSheet(item.client.id);
          }}
        >
          <span className="font-medium text-foreground hover:underline">
            {item.client.businessName}
          </span>
        </button>
      ),
    },
    {
      id: 'state',
      header: t('common.status'),
      accessor: (item: NegotiationListItemResponse) => (
        <StateBadge state={item.state.code} label={item.state.name} />
      ),
    },
    ...(!isAdvisor
      ? [
          {
            id: 'advisor',
            header: t('common.advisor'),
            accessor: (item: NegotiationListItemResponse) => {
              const a = item.advisor;
              return a.profile ? `${a.profile.firstName} ${a.profile.lastName}` : a.username;
            },
          },
        ]
      : []),
    {
      id: 'startDate',
      header: t('common.startDate'),
      accessor: (item: NegotiationListItemResponse) => formatDate(item.startDate),
      sortable: true,
    },
    {
      id: 'estimatedCloseDate',
      header: t('common.estimatedClose'),
      accessor: (item: NegotiationListItemResponse) => formatDate(item.estimatedCloseDate),
      sortable: true,
    },
  ];

  const stateOptions = [
    { value: 'all', label: t('common.all') },
    ...states.map((s) => ({ value: s.id, label: s.name })),
  ];

  if (loading) return <TableSkeleton columns={5} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-6',
        fetching && 'opacity-60 pointer-events-none transition-opacity',
      )}
    >
      <SectionHeader
        title={t('negotiations.title')}
        description={t('negotiations.description')}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => handleViewChange('table')}
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={view === 'kanban' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => handleViewChange('kanban')}
              >
                <Columns3 className="size-4" />
              </Button>
            </div>
            <Can permission="negotiations.create">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus data-icon="inline-start" />
                {t('negotiations.newNegotiation')}
              </Button>
            </Can>
          </div>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('negotiations.searchPlaceholder')}
        filters={[
          ...(view === 'table'
            ? [
                {
                  id: 'state',
                  label: t('common.status'),
                  placeholder: t('common.status'),
                  options: stateOptions,
                  value: stateId ?? 'all',
                  onChange: (value: string) => setStateId(value === 'all' ? undefined : value),
                },
              ]
            : []),
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

      {negotiations.length === 0 && view === 'table' ? (
        search || stateId || advisorId ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noFilterResults', {
              entities: t('negotiations.title').toLowerCase(),
            })}
          />
        ) : (
          <EmptyState
            title={t('common.noEntities', { entities: t('negotiations.title').toLowerCase() })}
            description={t('common.createFirstEntity', {
              entity: t('negotiations.title').toLowerCase(),
            })}
            action={
              hasPermission('negotiations.create')
                ? {
                    label: `+ ${t('negotiations.newNegotiation')}`,
                    onClick: () => setCreateOpen(true),
                  }
                : undefined
            }
          />
        )
      ) : view === 'kanban' ? (
        <NegotiationKanbanBoard
          states={states}
          filters={{ search, advisorId: effectiveAdvisorId }}
          onCardClick={(id) => navigate(`/negociaciones/${id}`)}
          onClientClick={(clientId) => openClientSheet(clientId)}
        />
      ) : (
        <>
          <EntityTable
            data={negotiations}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => navigate(`/negociaciones/${item.id}`)}
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

      <CreateNegotiationDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={refetch} />
    </div>
  );
}
