# AGENT.md

Rules and patterns for AI agents working on this codebase. Supplements CLAUDE.md with hard-won lessons from implementation.

## Styling rules

### Clickable text links

Use `text-foreground font-medium hover:underline` for inline clickable text (entity names, row links, card titles). Never use `text-primary` — it renders as harsh blue in dark mode.

Reserve `text-primary` for:
- Buttons and badges (where bg-primary carries it)
- `tel:` and `mailto:` anchors in detail panels (small, utility links)

```tsx
// correct — entity name link
<button className="text-foreground font-medium hover:underline">
  {client.businessName}
</button>

// wrong
<button className="text-primary hover:underline">
  {client.businessName}
</button>
```

### Dark mode compatibility

Never use `dark:` variant overrides. All color switching goes through CSS variables in `.dark` class (see `src/index.css`). If a token looks wrong in dark mode, the fix is choosing a different semantic token — not adding a `dark:` override.

Kanban-specific tokens that work in both modes:
- Column background: `bg-muted/70`
- Card background: `bg-popover`
- Card border: `ring-1 ring-border shadow-sm`
- Drag highlight: `bg-accent/30`

### View persistence

Save user view preferences (table/kanban, sort order, etc.) in localStorage. Key pattern: `<module>-<preference>` (e.g. `negotiations-view`).

## Date and time formatting

Always import from `@/lib/format.js`:

| Function | Use case | Example output |
|----------|----------|----------------|
| `formatDate` | Table cells, detail fields | `15/03/2025` |
| `formatDateTime` | Timestamps with time | `15/03/2025, 10:30` |
| `formatRelativeTime` | Cards, activity feeds, "created ago" | `hace 2 horas` |

Never define inline `timeAgo`, `formatDate`, or date formatting helpers in components.

## Kanban board architecture

### Per-column fetching

Each kanban column makes its own API call with `stateId` filter. This avoids hitting backend's limit cap (100) and allows independent pagination per column.

```tsx
const { negotiations, meta, loading } = useNegotiations(page, {
  stateId: state.id,
  limit: COLUMN_PAGE_SIZE, // 10
  sortBy: 'updatedAt',
  sortOrder: 'desc',
});
```

### Items accumulation pattern

Page 1 always replaces items (handles filter resets). Page 2+ appends only on actual page change (prevents duplicate appends on re-renders).

```tsx
const prevPageRef = useRef(page);

useEffect(() => {
  if (loading) return;
  if (page === 1) {
    setItems(negotiations);
  } else if (page !== prevPageRef.current) {
    setItems((prev) => [...prev, ...negotiations]);
  }
  prevPageRef.current = page;
}, [negotiations, page, loading]);
```

### Drag-and-drop state changes

Reuse `ChangeStateDialog` with a `targetStateId` prop for drag-drop. When set, dialog shows read-only target state instead of dropdown. User adds optional notes, then confirms.

```tsx
<ChangeStateDialog
  negotiationId={pendingDrop.negotiationId}
  currentStateId={pendingDrop.currentStateId}
  targetStateId={pendingDrop.targetStateId}  // locks state selection
  onSuccess={() => setPendingDrop(null)}
/>
```

## API patterns

### Backend search limitations

Backend search (`search` param) only searches specific fields per entity. For negotiations, it searches `observations` — not client `businessName`. If search seems broken, verify which fields the backend indexes.

### Backend sort column map

Backend validates `sortBy` against a whitelist map. New sortable fields (e.g. `updatedAt`) must be added to the backend's sort column map before they work on the frontend.

## Component reuse

Before building new components, check:
- `src/shared/ui/` — business components (EntityTable, FilterBar, StateBadge, etc.)
- `src/shared/hooks/` — shared hooks (usePageReset, usePaginatedList, useUnsavedGuard)
- `src/components/ui/` — shadcn primitives
- `src/lib/format.js` — date/time formatting
- `src/lib/utils.ts` — `cn()` helper

Extend existing dialog/sheet components with optional props (like `targetStateId`) rather than creating parallel components.
