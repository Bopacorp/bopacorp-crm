import type { BusinessClientListItemResponse } from '@bopacorp/shared/crm';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  SectionHeader,
  TableSkeleton,
} from '@/shared/ui';
import { CreateBusinessClientDialog } from '../components/CreateBusinessClientDialog.js';
import { useClientSheet } from '../context/ClientSheetContext.js';
import { useBusinessClients } from '../hooks/useBusinessClients.js';

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

export default function ClientsPage() {
  const { openClientSheet } = useClientSheet();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const { hasPermission } = usePermission();

  const { clients, meta, loading, fetching, error, refetch } = useBusinessClients(page, {
    search,
    isActive,
  });

  const searchRef = useRef(search);
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    if (searchRef.current !== search || isActiveRef.current !== isActive) {
      searchRef.current = search;
      isActiveRef.current = isActive;
      setPage(1);
    }
  });

  const columns = [
    {
      id: 'businessName',
      header: 'Empresa',
      accessor: (item: BusinessClientListItemResponse) => (
        <span className="font-medium">{item.businessName}</span>
      ),
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
    },
    {
      id: 'advisor',
      header: 'Asesor',
      accessor: (item: BusinessClientListItemResponse) => {
        const a = item.advisor;
        if (!a) return '—';
        return a.profile ? `${a.profile.firstName} ${a.profile.lastName}` : a.username;
      },
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: BusinessClientListItemResponse) => (
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
            item.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {item.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  const activeOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' },
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
            placeholder: 'Estado',
            options: activeOptions,
            value: isActive === undefined ? 'all' : String(isActive),
            onChange: (value) => setIsActive(value === 'all' ? undefined : value === 'true'),
          },
        ]}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No hay clientes"
          description="Crea tu primer cliente para comenzar"
          action={
            hasPermission('business_clients.create')
              ? { label: '+ Nuevo cliente', onClick: () => setCreateOpen(true) }
              : undefined
          }
        />
      ) : (
        <>
          <EntityTable
            data={clients}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => openClientSheet(item.id)}
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

      <CreateBusinessClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
