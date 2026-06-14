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
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
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

type PageEntry = { type: 'page'; page: number } | { type: 'ellipsis'; key: string };

function buildPageNumbers(current: number, total: number): PageEntry[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => ({ type: 'page' as const, page: i + 1 }));
  }
  const entries: PageEntry[] = [{ type: 'page', page: 1 }];
  if (current > 3) entries.push({ type: 'ellipsis', key: 'start' });
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    entries.push({ type: 'page', page: i });
  }
  if (current < total - 2) entries.push({ type: 'ellipsis', key: 'end' });
  entries.push({ type: 'page', page: total });
  return entries;
}

const columns = [
  {
    id: 'company',
    header: 'Empresa',
    accessor: (item: NegotiationListItemResponse) => (
      <span className="font-medium">{item.client.businessName}</span>
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
    accessor: (item: NegotiationListItemResponse) => item.advisor.username,
  },
  {
    id: 'startDate',
    header: 'Fecha inicio',
    accessor: (item: NegotiationListItemResponse) => formatDate(item.startDate),
  },
  {
    id: 'closeDate',
    header: 'Cierre estimado',
    accessor: (item: NegotiationListItemResponse) => formatDate(item.estimatedCloseDate),
  },
];

export default function NegotiationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  const { negotiations, meta, loading, fetching, error, refetch } = useNegotiations(page, {
    search,
    stateId,
  });
  const { states } = useNegotiationStates();

  const searchRef = useRef(search);
  const stateIdRef = useRef(stateId);
  useEffect(() => {
    if (searchRef.current !== search || stateIdRef.current !== stateId) {
      searchRef.current = search;
      stateIdRef.current = stateId;
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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Nueva negociación
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por empresa..."
        filters={[
          {
            id: 'state',
            placeholder: 'Estado',
            options: stateOptions,
            value: stateId ?? 'all',
            onChange: (value) => setStateId(value === 'all' ? undefined : value),
          },
        ]}
      />

      {negotiations.length === 0 ? (
        <EmptyState
          title="No hay negociaciones"
          description="Crea tu primera negociación para comenzar"
          action={{ label: '+ Nueva negociación', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <>
          <EntityTable
            data={negotiations}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => navigate(`/negociaciones/${item.id}`)}
          />

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
