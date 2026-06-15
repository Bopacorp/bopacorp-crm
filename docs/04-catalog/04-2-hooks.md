# 4.2 — Data hooks

## Goal

Create TanStack Query hooks for all catalog entities under `src/modules/catalog/hooks/`.

## Hooks to implement

### Lookup table hooks (7 × identical pattern)

For each lookup entity, create `use{Entity}s.ts`:

```ts
use{Entity}s(page: number, filters: { search?: string; isActive?: boolean })
```

Wraps `usePaginatedList`. Returns `{ {entity}s, meta, loading, fetching, error, refetch }`.

Since these are small datasets often used as select options, also create a convenience hook:

```ts
use{Entity}Options()
```

Returns `{ options: Array<{ value: string; label: string }>, loading }` — fetches all active items (page 1, limit 100, isActive: true). Used for select dropdowns in forms.

Hooks needed:
- `useItemTypes` / `useItemTypeOptions`
- `useContractTypes` / `useContractTypeOptions`
- `useSegments` / `useSegmentOptions`
- `useTiers` / `useTierOptions`
- `useGeoZones` / `useGeoZoneOptions`
- `useBenefitTypes` / `useBenefitTypeOptions`
- `useContentTypes` / `useContentTypeOptions`

### Category hooks

**`useCategories(page, filters)`** — paginated flat list. Filters: `{ search?, parentId?, isActive? }`.

**`useCategoryTree()`** — calls `getCategoryTree()`, returns `{ tree: CategoryTreeResponse[], loading, error }`. Uses `useQuery` directly (not paginated).

**`useCategoryOptions()`** — flattened tree for select dropdowns. Returns `{ options: Array<{ value: string; label: string; depth: number }> }`. Flatten tree recursively, indent label by depth for visual hierarchy in selects.

### Catalog item hooks

**`useCatalogItems(page, filters)`** — paginated list. Filters: `{ search?, categoryId?, itemTypeId?, isActive?, isPublished? }`.

**`useCatalogItem(id)`** — single item detail with all nested relations.

### Content block hooks

**`useContentBlocks(page, filters)`** — paginated. Filters: `{ search?, contentTypeId? }`.

**`useContentBlock(id)`** — single block detail.

### Contact request hooks

**`useContactRequests(page, filters)`** — paginated. Filters: `{ search?, itemId?, isAttended? }`.

**`useContactRequest(id)`** — single request detail.

## Query keys

Add to `src/lib/query-keys.ts`:

```ts
catalog: {
  all: ['catalog'] as const,
  itemTypes: { all: ['catalog', 'item-types'], list: (p) => [...] },
  contractTypes: { all: ['catalog', 'contract-types'], list: (p) => [...] },
  segments: { all: ['catalog', 'segments'], list: (p) => [...] },
  tiers: { all: ['catalog', 'tiers'], list: (p) => [...] },
  geoZones: { all: ['catalog', 'geo-zones'], list: (p) => [...] },
  benefitTypes: { all: ['catalog', 'benefit-types'], list: (p) => [...] },
  contentTypes: { all: ['catalog', 'content-types'], list: (p) => [...] },
  categories: { all: ['catalog', 'categories'], list: (p) => [...], tree: ['catalog', 'categories', 'tree'] },
  items: { all: ['catalog', 'items'], list: (p) => [...], detail: (id) => [...] },
  contentBlocks: { all: ['catalog', 'content-blocks'], list: (p) => [...], detail: (id) => [...] },
  contactRequests: { all: ['catalog', 'contact-requests'], list: (p) => [...], detail: (id) => [...] },
}
```

## Pattern

Follow existing hook patterns from negotiations module. Use `usePaginatedList` for all list hooks. Use `useQuery` directly for single-entity and tree hooks.

## Verification

- `npm run check` passes
- Each hook returns correct types from shared package
