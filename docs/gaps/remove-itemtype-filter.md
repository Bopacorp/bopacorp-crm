# Remove itemType Filter from Catalog Page — Gap Analysis

Audited: 2026-06-27

## Why

RF-CAT-003 specifies filters: **category, coverage, and price**. No mention of itemType.
Seed data shows 1:1 mapping between categories and itemTypes — filtering by either produces identical results.
Removing itemType filter simplifies UI and aligns with spec.

DB tables and API support stay — only CRM filter bar changes.

---

## What needs to change

### 1. Remove itemType filter from `CatalogPage.tsx`

```diff
- import { useItemTypes } from '../hooks/useItemTypes.js';

- const [itemTypeId, setItemTypeId] = useState('all');

  usePageReset(
    [
      search,
      categoryId,
-     itemTypeId,
      isActiveFilter,
      isPublishedFilter,
      sortBy,
      sortOrder,
      pageSize,
    ],
    setPage,
  );

  const { items, meta, loading, fetching, error, refetch } = useCatalogItems(page, {
    search,
    categoryId: categoryId === 'all' ? undefined : categoryId,
-   itemTypeId: itemTypeId === 'all' ? undefined : itemTypeId,
    isActive,
    isPublished,
    sortBy,
    sortOrder,
    limit: pageSize,
  });

- const { itemTypes } = useItemTypes();
-
- const itemTypeOptions = useMemo(
-   () => itemTypes.map((it) => ({ value: it.id, label: it.name })),
-   [itemTypes],
- );

  const hasFilters =
    search !== '' ||
    categoryId !== 'all' ||
-   itemTypeId !== 'all' ||
    isActive !== undefined ||
    isPublished !== undefined;
```

Remove the itemType filter object from `FilterBar.filters` array (lines 216-222):

```diff
  filters={[
    { id: 'category', ... },
-   {
-     id: 'itemType',
-     label: t('common.type'),
-     placeholder: t('catalog.itemTypeFilter'),
-     options: [{ value: 'all', label: t('common.all') }, ...itemTypeOptions],
-     value: itemTypeId,
-     onChange: setItemTypeId,
-   },
    { id: 'isActive', ... },
    { id: 'isPublished', ... },
  ]}
```

### 2. Optional: Remove itemType column from table

The itemType column (lines 115-120) shows redundant info since category already identifies the type. Remove if desired:

```diff
- {
-   id: 'itemType',
-   header: t('common.type'),
-   accessor: (item: CatalogItemListItemResponse) => (
-     <Badge variant="outline">{item.itemType.name}</Badge>
-   ),
- },
```

Also update `TableSkeleton columns={7}` to `columns={6}` if column removed.

### 3. Remove unused import

If `useMemo` is no longer used after removing `itemTypeOptions`:

```diff
- import { useMemo, useState } from 'react';
+ import { useState } from 'react';
```

---

## Files to change

| Action | File | Description |
|--------|------|-------------|
| EDIT | `catalog/pages/CatalogPage.tsx` | Remove itemType filter, hook, state, and memo |

---

## What stays

- `useItemTypes` hook — may be used elsewhere (create/edit forms still need itemType selection)
- `itemTypeId` in `ListCatalogItemsQuerySchema` (shared) — API still supports it
- `item_types` DB table — still referenced by catalog items
- itemType column in table — optional removal (shows type badge per row)

---

## Execution order

1. Remove `itemTypeId` state + `useItemTypes` hook + `itemTypeOptions` memo
2. Remove itemType from `usePageReset` deps and `useCatalogItems` params
3. Remove itemType filter from `FilterBar`
4. Update `hasFilters` check
5. Optional: remove itemType column + update skeleton column count
6. Verify: page loads, filters work, no console errors
