import type { DocumentTypeResponse, ListDocumentTypesQuery } from '@bopacorp/shared/documents';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query-keys.js';
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
import { DocumentTypeSheet } from '../components/DocumentTypeSheet.js';
import { listDocumentTypes } from '../documentation.service.js';

export default function DocumentTypesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [isMandatoryFilter, setIsMandatoryFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [debouncedSearch] = useDebounce(search, 400);
  const isActive = isActiveFilter === 'all' ? undefined : isActiveFilter === 'true';
  const isMandatory = isMandatoryFilter === 'all' ? undefined : isMandatoryFilter === 'true';

  usePageReset(
    [debouncedSearch, isActiveFilter, isMandatoryFilter, pageSize, sortBy ?? '', sortOrder],
    setPage,
  );

  const query: ListDocumentTypesQuery = {
    page,
    limit: pageSize,
    sortOrder,
    search: debouncedSearch || undefined,
    isActive,
    isMandatory,
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.documents.types.list(page, {
      search: debouncedSearch,
      isActive,
      isMandatory,
      pageSize,
      sortBy,
      sortOrder,
    }),
    queryFn: () => listDocumentTypes(query),
  });

  const items = data?.data ?? [];
  const meta = data?.meta ?? null;

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'true', label: t('common.actives') },
    { value: 'false', label: t('common.inactives') },
  ];

  const mandatoryOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'true', label: t('documentation.types.mandatory') },
    { value: 'false', label: t('documentation.types.optional') },
  ];

  const columns = [
    {
      id: 'code',
      header: t('common.code'),
      sortable: true,
      accessor: (item: DocumentTypeResponse) => (
        <span className="font-mono text-xs">{item.code}</span>
      ),
    },
    {
      id: 'name',
      header: t('common.name'),
      sortable: true,
      accessor: (item: DocumentTypeResponse) => item.name,
    },
    {
      id: 'isMandatory',
      header: t('documentation.types.isMandatory'),
      accessor: (item: DocumentTypeResponse) => (
        <StateBadge
          state={item.isMandatory ? 'mandatory' : 'optional'}
          label={
            item.isMandatory
              ? t('documentation.types.mandatory')
              : t('documentation.types.optional')
          }
        />
      ),
    },
    {
      id: 'state',
      header: t('common.status'),
      accessor: (item: DocumentTypeResponse) => (
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
      <SectionHeader
        title={t('documentation.types.title')}
        description={t('documentation.types.description')}
        actions={
          <Can permission="document_types.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('common.newEntity', {
                entity: t('documentation.types.singular').toLowerCase(),
              })}
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('common.searchEntities', {
          entities: t('documentation.types.plural').toLowerCase(),
        })}
        filters={[
          {
            id: 'isMandatory',
            label: t('documentation.types.isMandatory'),
            placeholder: t('documentation.types.isMandatory'),
            options: mandatoryOptions,
            value: isMandatoryFilter,
            onChange: setIsMandatoryFilter,
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

      {items.length === 0 ? (
        debouncedSearch || isActive !== undefined || isMandatory !== undefined ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noFilterResults', {
              entities: t('documentation.types.plural').toLowerCase(),
            })}
          />
        ) : (
          <EmptyState
            title={t('common.noEntities', {
              entities: t('documentation.types.plural').toLowerCase(),
            })}
            description={t('common.createFirstEntity', {
              entity: t('documentation.types.singular').toLowerCase(),
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

      <DocumentTypeSheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        entityId={selectedId}
        mode="view"
      />

      <DocumentTypeSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        entityId={null}
        mode="create"
      />
    </div>
  );
}
