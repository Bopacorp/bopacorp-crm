# 4.3 — Lookup tables CRUD

## Goal

Build a single generic CRUD page that handles all 7 lookup tables (item types, contract types, segments, tiers, geo zones, benefit types, content types). All share identical schema: `{id, code, name, description, isActive}`.

## Approach: Generic with config

Instead of 7 separate pages, build one `LookupTableManager` component driven by a config object. Render it inside a tabbed settings page.

## Page

`src/modules/catalog/pages/CatalogSettingsPage.tsx`

Tabbed layout with one tab per lookup table + categories tab (phase 4.4):

| Tab label | Config key | Permission prefix |
|-----------|-----------|-------------------|
| Tipos de item | itemTypes | `item_types` |
| Tipos de contrato | contractTypes | `contract_types` |
| Segmentos | segments | `segments` |
| Niveles | tiers | `tiers` |
| Zonas geográficas | geoZones | `geo_zones` |
| Tipos de beneficio | benefitTypes | `benefit_types` |
| Tipos de contenido | contentTypes | `content_types` |
| Categorías | categories | `categories` |

Route: `/catalogo/configuracion`

## Component: LookupTableManager

`src/modules/catalog/components/LookupTableManager.tsx`

### Props

```tsx
interface LookupTableConfig {
  entityName: string;           // "Tipo de item" — singular Spanish label
  entityNamePlural: string;     // "Tipos de item" — plural Spanish label
  permissionPrefix: string;     // "item_types" — for Can component
  listFn: (params) => Promise;  // listItemTypes
  createFn: (data) => Promise;  // createItemType
  updateFn: (id, data) => Promise;
  disableFn: (id) => Promise;
  queryKey: readonly string[];  // queryKeys.catalog.itemTypes.all
}
```

### Layout

Standard CRUD following `docs/09-crud-standards.md`:

1. **FilterBar** — search input + isActive toggle (Todos/Activos/Inactivos)
2. **EntityTable** — columns:
   - Código (`code`) — monospace
   - Nombre (`name`)
   - Estado — `StateBadge` active/inactive
3. **PaginationFooter**
4. **Create button** — permission-gated
5. **Row click** → opens detail/edit sheet

### Create/Edit Sheet

Single `LookupTableSheet` component for both create and edit:

**Fields:**
- Código (`code`) — text input, required. Uppercase, no spaces. Only on create (read-only on edit)
- Nombre (`name`) — text input, required
- Descripción (`description`) — textarea, optional
- Activo (`isActive`) — switch, only on edit

**Behavior:**
- Create: `createFn(data)` → invalidate queries → toast → close
- Edit: `updateFn(id, data)` → invalidate queries → toast → close
- Unsaved changes guard via `useUnsavedGuard`

### Disable action

Instead of hard delete, lookup tables use soft-disable (`PATCH /:id/disable`). Toggle isActive state. Show confirmation only when disabling (not when re-enabling).

## Config registry

```tsx
const LOOKUP_CONFIGS: Record<string, LookupTableConfig> = {
  itemTypes: {
    entityName: 'Tipo de item',
    entityNamePlural: 'Tipos de item',
    permissionPrefix: 'item_types',
    listFn: listItemTypes,
    createFn: createItemType,
    updateFn: updateItemType,
    disableFn: disableItemType,
    queryKey: queryKeys.catalog.itemTypes.all,
  },
  // ... 6 more identical configs with different labels/functions/keys
};
```

## Verification

- `npm run check` passes
- Each tab renders correct data from its own endpoint
- Create/edit/disable works for each lookup table
- Permission gating per table
- Switching tabs preserves no stale state
