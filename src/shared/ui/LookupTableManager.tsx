import type { PaginationMeta } from '@bopacorp/shared/common';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
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
import { LookupTableSheet } from './LookupTableSheet.js';

export interface LookupListItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LookupCreateData {
  code: string;
  name: string;
  isActive: boolean;
  description?: string;
}

export interface LookupUpdateData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface LookupListQuery {
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
  sortBy?: string;
  search?: string;
  isActive?: boolean;
}

export interface LookupTableConfig {
  entityName: string;
  entityNamePlural: string;
  permissionPrefix: string;
  queryKey: readonly unknown[];
  listFn: (query: LookupListQuery) => Promise<{ data: LookupListItem[]; meta: PaginationMeta }>;
  getFn: (id: string) => Promise<LookupListItem & { description: string | null }>;
  createFn: (data: LookupCreateData) => Promise<unknown>;
  updateFn: (id: string, data: LookupUpdateData) => Promise<unknown>;
  disableFn: (id: string) => Promise<unknown>;
}

interface LookupTableManagerProps {
  config: LookupTableConfig;
}

export function LookupTableManager({ config }: LookupTableManagerProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [debouncedSearch] = useDebounce(search, 400);
  const isActive = isActiveFilter === 'all' ? undefined : isActiveFilter === 'true';

  usePageReset([debouncedSearch, isActiveFilter, pageSize, sortBy ?? '', sortOrder], setPage);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      ...config.queryKey,
      'list',
      page,
      { search: debouncedSearch, isActive, pageSize, sortBy, sortOrder },
    ],
    queryFn: () =>
      config.listFn({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive,
        sortBy,
        sortOrder,
      }),
  });

  const items = data?.data ?? [];
  const meta = data?.meta ?? null;

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'true', label: t('common.actives') },
    { value: 'false', label: t('common.inactives') },
  ];

  const columns = [
    {
      id: 'code',
      header: t('common.code'),
      sortable: true,
      accessor: (item: LookupListItem) => <span className="font-mono text-xs">{item.code}</span>,
    },
    {
      id: 'name',
      header: t('common.name'),
      sortable: true,
      accessor: (item: LookupListItem) => item.name,
    },
    {
      id: 'state',
      header: t('common.status'),
      accessor: (item: LookupListItem) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? t('common.active') : t('common.inactive')}
        />
      ),
    },
  ];

  if (isLoading) return <TableSkeleton columns={3} />;
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
        searchPlaceholder={t('common.searchEntities', {
          entities: config.entityNamePlural.toLowerCase(),
        })}
        filters={[
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
          <Can permission={`${config.permissionPrefix}.create`}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('common.newEntity', { entity: config.entityName.toLowerCase() })}
            </Button>
          </Can>
        }
      />

      {items.length === 0 ? (
        debouncedSearch || isActive !== undefined ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noFilterResults', {
              entities: config.entityNamePlural.toLowerCase(),
            })}
          />
        ) : (
          <EmptyState
            title={t('common.noEntities', {
              entities: config.entityNamePlural.toLowerCase(),
            })}
            description={t('common.createFirstEntity', {
              entity: config.entityName.toLowerCase(),
            })}
          />
        )
      ) : (
        <>
          <EntityTable
            data={items}
            columns={columns}
            keyExtractor={(item) => item.id}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(columnId, nextOrder) => {
              setSortBy(columnId);
              setSortOrder(nextOrder);
            }}
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

      <LookupTableSheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        entityId={selectedId}
        config={config}
        mode="view"
      />

      <LookupTableSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        entityId={null}
        config={config}
        mode="create"
      />
    </div>
  );
}
