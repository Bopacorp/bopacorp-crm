import type { NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { useClientSheet } from '@/modules/clients/context/ClientSheetContext.js';
import {
  buildPageNumbers,
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  PageSizeSelect,
  SectionHeader,
  StateBadge,
  TableSkeleton,
} from '@/shared/ui';
import { CreateNegotiationDialog } from '../components/CreateNegotiationDialog.js';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { useNegotiations } from '../hooks/useNegotiations.js';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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
      accessor: (item: NegotiationListItemResponse) => <StateBadge state={item.state.code} />,
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

  const searchRef = useRef(search);
  const stateIdRef = useRef(stateId);
  const sortByRef = useRef(sortBy);
  const sortOrderRef = useRef(sortOrder);
  const pageSizeRef = useRef(pageSize);
  useEffect(() => {
    if (
      searchRef.current !== search ||
      stateIdRef.current !== stateId ||
      sortByRef.current !== sortBy ||
      sortOrderRef.current !== sortOrder ||
      pageSizeRef.current !== pageSize
    ) {
      searchRef.current = search;
      stateIdRef.current = stateId;
      sortByRef.current = sortBy;
      sortOrderRef.current = sortOrder;
      pageSizeRef.current = pageSize;
      setPage(1);
    }
  });

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

          <div className="flex items-center justify-between">
            <PageSizeSelect value={pageSize} onChange={setPageSize} />
            {meta && (
              <span className="text-sm text-muted-foreground">{meta.totalItems} resultados</span>
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text="Anterior"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {buildPageNumbers(page, meta.totalPages).map((entry) =>
                  entry.type === 'ellipsis' ? (
                    <PaginationItem key={entry.key}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={entry.page}>
                      <PaginationLink
                        isActive={entry.page === page}
                        onClick={() => setPage(entry.page)}
                        className="cursor-pointer"
                      >
                        {entry.page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    text="Siguiente"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    aria-disabled={page === meta.totalPages}
                    className={
                      page === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <CreateNegotiationDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={refetch} />
    </div>
  );
}
