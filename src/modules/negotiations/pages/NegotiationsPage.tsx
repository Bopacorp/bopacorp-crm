import type { NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { useClientSheet } from '@/modules/clients/context/ClientSheetContext.js';
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
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { useNegotiations } from '../hooks/useNegotiations.js';

export default function NegotiationsPage() {
  const navigate = useNavigate();
  const { openClientSheet } = useClientSheet();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const { hasPermission } = usePermission();

  const { negotiations, meta, loading, fetching, error, refetch } = useNegotiations(page, {
    search,
    stateId,
    sortBy,
    sortOrder,
    limit: pageSize,
  });
  const { states } = useNegotiationStates();

  usePageReset([search, stateId, sortBy, sortOrder, pageSize], setPage);

  const columns = [
    {
      id: 'company',
      header: 'Empresa',
      accessor: (item: NegotiationListItemResponse) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openClientSheet(item.client.id);
          }}
        >
          <span className="font-medium text-primary hover:underline">
            {item.client.businessName}
          </span>
        </button>
      ),
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: NegotiationListItemResponse) => (
        <StateBadge state={item.state.code} label={item.state.name} />
      ),
    },
    {
      id: 'advisor',
      header: 'Asesor',
      accessor: (item: NegotiationListItemResponse) => {
        const a = item.advisor;
        return a.profile ? `${a.profile.firstName} ${a.profile.lastName}` : a.username;
      },
    },
    {
      id: 'startDate',
      header: 'Fecha inicio',
      accessor: (item: NegotiationListItemResponse) => formatDate(item.startDate),
      sortable: true,
    },
    {
      id: 'estimatedCloseDate',
      header: 'Cierre estimado',
      accessor: (item: NegotiationListItemResponse) => formatDate(item.estimatedCloseDate),
      sortable: true,
    },
  ];

  const stateOptions = [
    { value: 'all', label: 'Todos' },
    ...states.map((s) => ({ value: s.id, label: s.name })),
  ];

  if (loading) return <TableSkeleton columns={5} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        fetching && 'opacity-60 pointer-events-none transition-opacity',
      )}
    >
      <SectionHeader
        title="Negociaciones"
        description="Gestión de cuentas, contratos y visitas comerciales"
        actions={
          <Can permission="negotiations.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nueva negociación
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por empresa..."
        filters={[
          {
            id: 'state',
            label: 'Estado',
            placeholder: 'Estado',
            options: stateOptions,
            value: stateId ?? 'all',
            onChange: (value) => setStateId(value === 'all' ? undefined : value),
          },
        ]}
      />

      {negotiations.length === 0 ? (
        search || stateId ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron negociaciones con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay negociaciones"
            description="Crea tu primera negociación para comenzar"
            action={
              hasPermission('negotiations.create')
                ? { label: '+ Nueva negociación', onClick: () => setCreateOpen(true) }
                : undefined
            }
          />
        )
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
