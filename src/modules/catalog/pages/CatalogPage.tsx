import type { CatalogItemListItemResponse } from '@bopacorp/shared/catalog';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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
import { useCatalogItems } from '../hooks/useCatalogItems.js';
import { useCategoryOptions } from '../hooks/useCategoryOptions.js';
import { useItemTypes } from '../hooks/useItemTypes.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

const PUBLISHED_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Publicados' },
  { value: 'false', label: 'No publicados' },
];

export default function CatalogPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [itemTypeId, setItemTypeId] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [isPublishedFilter, setIsPublishedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);

  usePageReset(
    [
      search,
      categoryId,
      itemTypeId,
      isActiveFilter,
      isPublishedFilter,
      sortBy,
      sortOrder,
      pageSize,
    ],
    setPage,
  );

  const isActive = isActiveFilter === 'all' ? undefined : isActiveFilter === 'true';
  const isPublished = isPublishedFilter === 'all' ? undefined : isPublishedFilter === 'true';

  const { items, meta, loading, fetching, error, refetch } = useCatalogItems(page, {
    search,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    itemTypeId: itemTypeId === 'all' ? undefined : itemTypeId,
    isActive,
    isPublished,
    sortBy,
    sortOrder,
    limit: pageSize,
  });

  const { options: categoryOptions } = useCategoryOptions();
  const { itemTypes } = useItemTypes();

  const itemTypeOptions = useMemo(
    () => itemTypes.map((t) => ({ value: t.id, label: t.name })),
    [itemTypes],
  );

  const hasFilters =
    search !== '' ||
    categoryId !== 'all' ||
    itemTypeId !== 'all' ||
    isActive !== undefined ||
    isPublished !== undefined;

  const columns = [
    {
      id: 'name',
      header: 'Nombre',
      accessor: (item: CatalogItemListItemResponse) => (
        <div className="flex items-center gap-2">
          {item.imagePath && (
            <img src={item.imagePath} alt="" className="size-8 rounded object-cover" />
          )}
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Categoría',
      accessor: (item: CatalogItemListItemResponse) => item.category.name,
    },
    {
      id: 'itemType',
      header: 'Tipo',
      accessor: (item: CatalogItemListItemResponse) => (
        <Badge variant="outline">{item.itemType.name}</Badge>
      ),
    },
    {
      id: 'contractType',
      header: 'Contrato',
      accessor: (item: CatalogItemListItemResponse) => item.contractType.name,
    },
    {
      id: 'price',
      header: 'Precio',
      sortable: true,
      accessor: (item: CatalogItemListItemResponse) => (
        <span className="tabular-nums">{formatCurrency(item.price)}</span>
      ),
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: CatalogItemListItemResponse) => (
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? 'Activo' : 'Inactivo'}
        />
      ),
    },
    {
      id: 'published',
      header: 'Publicado',
      accessor: (item: CatalogItemListItemResponse) => (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'size-2 rounded-full',
              item.isPublished ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
          />
          <span className="text-xs text-muted-foreground">{item.isPublished ? 'Sí' : 'No'}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Catálogo de productos"
          description="Gestión de planes, servicios y dispositivos"
        />
        <TableSkeleton columns={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Catálogo de productos"
          description="Gestión de planes, servicios y dispositivos"
        />
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
        title="Catálogo de productos"
        description="Gestión de planes, servicios y dispositivos"
        actions={
          <Can permission="catalog_items.create">
            <Button onClick={() => navigate('/catalogo/nuevo')}>
              <Plus data-icon="inline-start" />
              Nuevo producto
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre..."
        filters={[
          {
            id: 'category',
            label: 'Categoría',
            placeholder: 'Categoría',
            options: [{ value: 'all', label: 'Todas' }, ...categoryOptions],
            value: categoryId,
            onChange: setCategoryId,
          },
          {
            id: 'itemType',
            label: 'Tipo',
            placeholder: 'Tipo de item',
            options: [{ value: 'all', label: 'Todos' }, ...itemTypeOptions],
            value: itemTypeId,
            onChange: setItemTypeId,
          },
          {
            id: 'isActive',
            label: 'Estado',
            placeholder: 'Estado',
            options: STATUS_OPTIONS,
            value: isActiveFilter,
            onChange: setIsActiveFilter,
          },
          {
            id: 'isPublished',
            label: 'Publicación',
            placeholder: 'Publicado',
            options: PUBLISHED_OPTIONS,
            value: isPublishedFilter,
            onChange: setIsPublishedFilter,
          },
        ]}
      />

      {items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron productos con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay productos"
            description="Crea tu primer producto para comenzar"
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
    </div>
  );
}
