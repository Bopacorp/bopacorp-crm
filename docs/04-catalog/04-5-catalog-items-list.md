# 4.5 — Catalog items list page

## Goal

Replace current `CatalogPage` stub with real catalog items list. This is the main product management page.

## Page

`src/modules/catalog/pages/CatalogItemsPage.tsx`

Route: `/catalogo` (replaces current stub)

## Layout

Standard list page per `docs/09-crud-standards.md`:

### SectionHeader
- Title: "Catálogo de productos"
- Description: "Gestión de planes, servicios y dispositivos"
- Actions: "Nuevo producto" button (permission-gated: `catalog_items.create`)

### FilterBar

| Filter | Type | Options |
|--------|------|---------|
| Search | text | Placeholder: "Buscar por nombre..." |
| Categoría | select | From `useCategoryOptions()` + "Todas" |
| Tipo de item | select | From `useItemTypeOptions()` + "Todos" |
| Estado | select | Todos / Activos / Inactivos |
| Publicado | select | Todos / Publicados / No publicados |

### EntityTable

| Column | Accessor | Sortable |
|--------|----------|----------|
| Nombre | `name` — bold, with small image thumbnail if `imagePath` exists | No |
| Categoría | `category.name` | No |
| Tipo | `itemType.name` — as badge | No |
| Contrato | `contractType.name` | No |
| Precio | `$price` formatted | Yes |
| Estado | StateBadge active/inactive | No |
| Publicado | green/gray dot indicator | No |

Row click → navigate to `/catalogo/:id`

### Empty state

Differentiate filtered vs truly empty (per CRUD standards).

### Pagination

`PaginationFooter` with page size selector.

## Data

```tsx
const { catalogItems, meta, loading, fetching, error, refetch } = useCatalogItems(page, {
  search,
  categoryId,
  itemTypeId,
  isActive,
  isPublished,
});
```

## Price formatting

Use shared currency formatter. Products use `$` prefix with 2 decimals, `es-EC` locale:

```tsx
function formatPrice(value: number): string {
  return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
}
```

Consider adding to `@/lib/format.js` as `formatCurrency` if not already there.

## Published indicator

Small dot or badge:
- Published: `bg-emerald-500` dot + "Publicado" tooltip — wait, semantic tokens only.
- Use StateBadge variant or a custom indicator with semantic tokens.
- Option: `text-primary` dot for published, `text-muted-foreground` for unpublished.

## Verification

- `npm run check` passes
- List loads real data from API
- All filters work and reset page to 1
- Pagination works
- Row click navigates to detail
- Empty states show correctly
- Loading shows `TableSkeleton`
