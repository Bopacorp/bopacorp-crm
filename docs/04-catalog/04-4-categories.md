# 4.4 — Categories tree

## Goal

Build category management with tree visualization. Categories are hierarchical (self-referencing `parentId`). Backend provides `GET /categories/tree` returning nested structure.

## Location

Tab inside `CatalogSettingsPage` (from phase 4.3), or standalone component `CategoryManager` rendered in the "Categorías" tab.

## Component: CategoryManager

`src/modules/catalog/components/CategoryManager.tsx`

### Layout

Two-panel layout:

**Left panel — tree view:**
- Expandable/collapsible tree rendered from `useCategoryTree()`
- Each node shows: name, sort order badge, active/inactive indicator
- Click node → selects it, shows detail in right panel
- Indent children with padding-left per depth level
- Root-level "Nueva categoría" button at top

**Right panel — detail/edit:**
- When no node selected: empty state "Selecciona una categoría"
- When node selected: detail view with edit/disable actions
- Edit mode: inline form (no separate sheet needed since panel is already visible)

### Tree node component

```tsx
interface TreeNodeProps {
  category: CategoryTreeResponse;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}
```

Render recursively. Each node:
- Expand/collapse chevron (if has children)
- Category name
- Item count badge (if available)
- Active/inactive dot indicator
- Padding: `pl-${depth * 6}` (or dynamic style)

### Create category

Dialog with fields:
- Nombre (`name`) — required
- Categoría padre (`parentId`) — select from flattened tree options, optional (null = root)
- Descripción (`description`) — optional
- Orden (`sortOrder`) — number input, default 0
- Activo (`isActive`) — switch

On success: invalidate category tree query, select new node.

### Edit category

Inline form in right panel:
- Same fields as create, but `parentId` cannot be set to self or own descendants (prevent circular reference)
- Save → `updateCategory(id, data)` → invalidate tree → toast

### Disable category

Toggle via `disableCategory(id)`. Warn if category has active children or catalog items referencing it.

## Flattened options for selects

`useCategoryOptions()` hook flattens tree for use in select dropdowns (e.g., in catalog item form):

```tsx
// Returns:
[
  { value: 'uuid-1', label: 'Voz' },
  { value: 'uuid-2', label: '  └ Planes postpago' },
  { value: 'uuid-3', label: '  └ Planes prepago' },
  { value: 'uuid-4', label: 'Conectividad' },
]
```

Indent with spaces or unicode tree chars for visual hierarchy in native select.

## Verification

- `npm run check` passes
- Tree renders with correct nesting
- Expand/collapse works
- Create root and child categories
- Edit preserves tree position
- Cannot create circular parent reference
- Category options hook returns correct flattened list
