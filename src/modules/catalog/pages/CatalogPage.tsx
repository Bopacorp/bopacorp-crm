import type { CatalogItemListItemResponse } from '@bopacorp/shared/catalog';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format.js';
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
import { CatalogItemCreateSheet } from '../components/CatalogItemCreateSheet.js';
import { useCatalogItems } from '../hooks/useCatalogItems.js';
import { useCategoryOptions } from '../hooks/useCategoryOptions.js';

export default function CatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [isPublishedFilter, setIsPublishedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);

  usePageReset(
    [search, categoryId, isActiveFilter, isPublishedFilter, sortBy, sortOrder, pageSize],
    setPage,
  );

  const isActive = isActiveFilter === 'all' ? undefined : isActiveFilter === 'true';
  const isPublished = isPublishedFilter === 'all' ? undefined : isPublishedFilter === 'true';

  const { items, meta, loading, fetching, error, refetch } = useCatalogItems(page, {
    search,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    isActive,
    isPublished,
    sortBy,
    sortOrder,
    limit: pageSize,
  });

  const { options: categoryOptions } = useCategoryOptions();

  const hasFilters =
    search !== '' || categoryId !== 'all' || isActive !== undefined || isPublished !== undefined;

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'true', label: t('common.actives') },
    { value: 'false', label: t('common.inactives') },
  ];

  const publishedOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'true', label: t('common.publishedPlural') },
    { value: 'false', label: t('common.unpublished') },
  ];

  const columns = [
    {
      id: 'name',
      header: t('common.name'),
      accessor: (item: CatalogItemListItemResponse) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      id: 'category',
      header: t('common.category'),
      accessor: (item: CatalogItemListItemResponse) => item.category.name,
    },
    {
      id: 'contractType',
      header: t('common.contract'),
      accessor: (item: CatalogItemListItemResponse) => item.contractType.name,
    },
    {
      id: 'price',
      header: t('common.price'),
      sortable: true,
      accessor: (item: CatalogItemListItemResponse) => (
        <span className="tabular-nums">{formatCurrency(item.price)}</span>
      ),
    },
    {
      id: 'state',
      header: t('common.status'),
      accessor: (item: CatalogItemListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? t('common.active') : t('common.inactive')}
        />
      ),
    },
    {
      id: 'published',
      header: t('common.published'),
      accessor: (item: CatalogItemListItemResponse) => (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'size-2 rounded-full',
              item.isPublished ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
          />
          <span className="text-xs text-muted-foreground">
            {item.isPublished ? t('common.yes') : t('common.no')}
          </span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title={t('catalog.title')} description={t('catalog.description')} />
        <TableSkeleton columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title={t('catalog.title')} description={t('catalog.description')} />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-6',
        fetching && 'opacity-60 pointer-events-none transition-opacity',
      )}
    >
      <SectionHeader
        title={t('catalog.title')}
        description={t('catalog.description')}
        actions={
          <Can permission="catalog_items.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('catalog.newProduct')}
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('catalog.searchPlaceholder')}
        filters={[
          {
            id: 'category',
            label: t('common.category'),
            placeholder: t('common.category'),
            options: [{ value: 'all', label: t('common.allFeminine') }, ...categoryOptions],
            value: categoryId,
            onChange: setCategoryId,
          },
          {
            id: 'isActive',
            label: t('common.status'),
            placeholder: t('common.status'),
            options: statusOptions,
            value: isActiveFilter,
            onChange: setIsActiveFilter,
          },
          {
            id: 'isPublished',
            label: t('common.publication'),
            placeholder: t('common.published'),
            options: publishedOptions,
            value: isPublishedFilter,
            onChange: setIsPublishedFilter,
          },
        ]}
      />

      {items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('common.noFilterResults', { entities: t('catalog.product') })}
          />
        ) : (
          <EmptyState
            title={t('common.noEntities', { entities: t('catalog.product') })}
            description={t('common.createFirstEntity', { entity: t('catalog.product') })}
          />
        )
      ) : (
        <>
          <EntityTable
            data={items}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => navigate(`/catalogo/${item.id}`)}
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

      <CatalogItemCreateSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
