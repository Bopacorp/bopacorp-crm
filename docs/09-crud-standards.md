# CRUD Page Standards

Minimum requirements for any CRM page that creates, reads, updates, or deletes registers. Reference implementation: `src/modules/clients/`.

---

## 1. File structure

Every CRUD module lives under `src/modules/<domain>/` with this layout:

```
src/modules/<domain>/
  <domain>.service.ts        # API calls (list, get, create, update, delete)
  hooks/
    use<Entity>s.ts          # Paginated list hook
    use<Entity>.ts           # Single record hook
  components/
    <Entity>Form.tsx          # Shared form for create and edit
    <Entity>Sheet.tsx         # Detail panel (view + edit + delete)
    Create<Entity>Dialog.tsx  # Create flow (Sheet or Dialog)
  context/                    # Optional: shared state (e.g. sheet open/close)
  pages/
    <Entity>Page.tsx          # List page
```

Types come from `@bopacorp/shared/<module>` — never define inline interfaces for API data.

---

## 2. List page

### 2.1 Required elements

| Element | Component | Notes |
|---------|-----------|-------|
| Page header | `SectionHeader` | Title + description + action button |
| Search + filters | `FilterBar` | Debounced search, select filters |
| Data table | `EntityTable` | Sortable columns, row click → detail |
| Pagination | `Pagination` + `PageSizeSelect` | Page numbers + size selector |
| Loading state | `TableSkeleton` | Shown on initial load |
| Error state | `ErrorState` | With retry button |
| Empty state | `EmptyState` | **Must differentiate filtered vs truly empty** |
| Create button | `Button` inside `<Can>` | Permission-gated |

### 2.2 Empty state differentiation

When the table has zero results, show different messages depending on whether filters are active:

```tsx
{items.length === 0 ? (
  search || someFilter !== undefined ? (
    <EmptyState
      title="Sin resultados"
      description="No se encontraron registros con los filtros aplicados"
    />
  ) : (
    <EmptyState
      title="No hay registros"
      description="Crea tu primer registro para comenzar"
      action={
        hasPermission('entity.create')
          ? { label: '+ Nuevo registro', onClick: () => setCreateOpen(true) }
          : undefined
      }
    />
  )
) : (
  // table + pagination
)}
```

### 2.3 Filter reset on change

When any filter, search term, sort column, or page size changes, reset to page 1. Use refs to detect changes:

```tsx
const searchRef = useRef(search);
useEffect(() => {
  if (searchRef.current !== search) {
    searchRef.current = search;
    setPage(1);
  }
});
```

### 2.4 Fetching overlay

While refetching (not initial load), dim the content to signal loading without removing it:

```tsx
<div className={cn('flex flex-col gap-6', fetching && 'opacity-60 pointer-events-none transition-opacity')}>
```

---

## 3. Form component

One shared form used by both create and edit flows. Never duplicate form fields.

### 3.1 Required props

```tsx
interface EntityFormProps {
  defaultValues: EntityFormValues;
  onSubmit: (values: EntityFormValues) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;         // "Crear" | "Guardar"
  onDirtyChange?: (dirty: boolean) => void;
}
```

### 3.2 Form structure

- Use `FieldGroup` > `Field` > `FieldLabel` + input — never raw `<div>` + `<label>`
- Scrollable body with `flex-1 overflow-y-auto p-4`
- Fixed footer with `SheetFooter` containing submit button
- Show `FormAlert` above fields when `error` is set

### 3.3 Dirty state detection

Compare each field against `defaultValues`. Report via callback:

```tsx
const isDirty = name !== defaultValues.name || /* ... */;

useEffect(() => {
  onDirtyChange?.(isDirty);
}, [isDirty, onDirtyChange]);
```

### 3.4 Submit button

Disabled when: `isPending`, or required fields empty. Show `Loader2` spinner while pending:

```tsx
<Button type="submit" disabled={isPending || !requiredField}>
  {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
  {submitLabel}
</Button>
```

### 3.5 Computed fields

Never include computed or read-only fields (counts, aggregations) in forms. If the backend type requires them, hardcode defaults in the mutation call, not the form.

---

## 4. Create flow

Rendered as a `Sheet` (or `Dialog`) from the list page.

### 4.1 Key requirements

- **Permission gate**: wrap trigger button in `<Can permission="entity.create">`
- **Form reset on close**: increment a `key` state to force remount
- **Error cleanup on close**: clear error state
- **Unsaved changes guard**: see section 7
- **On success**: invalidate queries, toast success, close

### 4.2 Mutation pattern

```tsx
const mutation = useMutation({
  mutationFn: (data: CreateEntityRequest) => createEntity(data),
  onSuccess: (entity) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.entities.all });
    toast.success('Registro creado');
    dirtyRef.current = false;
    forceClose();
    onSuccess(entity);
  },
  onError: (err) => setError(getErrorMessage(err)),
});
```

---

## 5. Detail panel (Sheet)

Single `Sheet` instance with conditional content — never multiple Sheet instances to avoid unmount/remount flash.

### 5.1 Structure

```
Sheet
  SheetContent (showCloseButton={false})
    SheetHeader
      action buttons row (back, edit, delete, close)
      skeleton header (only while loading)
      avatar + title + metadata (only in view mode)
    {loading → skeleton body}
    {error → ErrorState}
    {editing → EditForm}
    {viewing → ViewMode}
  DiscardChangesDialog (outside SheetContent)
  AlertDialog for delete (outside SheetContent)
```

### 5.2 Skeleton loading (no spinners)

**Never use spinners for loading states.** Always use `Skeleton` components that mimic the layout the data will fill. This applies to both list pages (`TableSkeleton`) and detail panels.

Detail panel skeleton has two parts:

**Header skeleton** — shown in SheetHeader while loading, replaces avatar + title:

```tsx
{loading && (
  <div className="flex items-center gap-3">
    <Skeleton className="size-10 rounded-full" />
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
)}
```

**Body skeleton** — replaces the content area, mimics section layout with icon + label + value rows:

```tsx
function SkeletonRow({ width = 'w-32' }: { width?: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
      <Skeleton className="size-4 rounded" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className={cn('h-4', width)} />
    </div>
  );
}
```

Group skeleton rows under skeleton section headers (`Skeleton className="mx-2 h-3 w-20"`) to match the real layout's sections. Vary the value widths to look natural.

**Accessibility**: render a `<SheetTitle className="sr-only">` during loading so the dialog remains accessible even without visible title text.

**Exception**: inline submit buttons may use `Loader2` spinner during mutation (e.g. "Eliminando…" in delete dialog) since the layout is already visible and the spinner indicates the action is in progress, not a content load.

### 5.3 View mode sections

Organize detail fields into labeled sections:

```tsx
function SectionLabel({ children }) {
  return (
    <span className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

function DetailField({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm text-foreground">{children ?? '—'}</span>
    </div>
  );
}
```

### 5.4 Header actions

Action buttons in top-right corner, permission-gated:

```tsx
<div className="flex items-center gap-1">
  <Can permission="entity.update">
    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
      <Pencil />
    </Button>
  </Can>
  <Can permission="entity.delete">
    <Button variant="ghost" size="icon-sm" onClick={() => setShowDelete(true)}>
      <Trash2 />
    </Button>
  </Can>
  <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('close')}>
    <XIcon />
  </Button>
</div>
```

### 5.5 Edit mode navigation

Back arrow when editing. Triggers unsaved changes guard if form is dirty:

```tsx
{editing && (
  <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('back')}>
    <ArrowLeft />
  </Button>
)}
```

### 5.6 Clickable contact fields

Phone and email fields should be interactive:

```tsx
<a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a>
<a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
```

### 5.7 Avatar with initials

For entity headers, show an avatar with initials derived from the name:

```tsx
function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

<Avatar size="lg" className="after:content-none">
  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
    {getInitials(entity.name)}
  </AvatarFallback>
</Avatar>
```

Use `after:content-none` to remove the default avatar border ring.

---

## 6. Delete flow

### 6.1 Requirements

- **Permission gate**: only show delete button to users with `entity.delete` permission
- **Confirmation dialog**: inline `AlertDialog` with entity name in description
- **Soft delete**: backend sets `deletedAt`, frontend just calls `DELETE` endpoint
- **Loading state**: disable buttons and show spinner during mutation
- **On success**: invalidate queries, toast, close sheet

### 6.2 Confirmation dialog

```tsx
<AlertDialog open={showDelete} onOpenChange={(v) => !v && setShowDelete(false)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
      <AlertDialogDescription>
        Se eliminará {entity.name}. Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={deleteMutation.isPending}>
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        onClick={(e) => { e.preventDefault(); deleteMutation.mutate(); }}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? (
          <><Loader2 className="animate-spin" /> Eliminando…</>
        ) : 'Eliminar'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

`e.preventDefault()` on AlertDialogAction prevents auto-close before mutation completes.

---

## 7. Unsaved changes guard

Any form that can be dismissed (Sheet, Dialog) must warn the user before discarding dirty state.

### 7.1 Pattern

```tsx
const dirtyRef = useRef(false);
const pendingAction = useRef<'close' | 'back' | null>(null);
const [showDiscard, setShowDiscard] = useState(false);

const handleDirtyChange = useCallback((dirty: boolean) => {
  dirtyRef.current = dirty;
}, []);

const guardedAction = (action: 'close' | 'back') => {
  if (editing && dirtyRef.current) {
    pendingAction.current = action;
    setShowDiscard(true);
  } else if (action === 'close') {
    onOpenChange(false);
  } else {
    setEditing(false);
  }
};
```

### 7.2 Why useRef instead of useState

The dirty flag is read inside event handlers and Sheet's `onOpenChange` callback. Using `useState` would capture stale values in closures. `useRef` always gives the current value.

### 7.3 DiscardChangesDialog

Reusable component from `@/shared/ui`:

```tsx
<DiscardChangesDialog
  open={showDiscard}
  onCancel={() => setShowDiscard(false)}
  onDiscard={handleDiscard}
/>
```

- Title: "¿Descartar cambios?"
- Description: "Los cambios no guardados se perderán."
- Cancel: "Seguir editando"
- Action: "Descartar" (destructive)

### 7.4 Create flow guard

For create dialogs, intercept `onOpenChange` and check dirty before allowing close:

```tsx
const handleOpenChange = (value: boolean) => {
  if (!value && dirtyRef.current) {
    setShowDiscard(true);
    return;
  }
  // clean up and close
};
```

Reset dirty flag to `false` in mutation's `onSuccess` before closing, otherwise the guard blocks programmatic close after save.

---

## 8. Permission gating

### 8.1 Components

Use `<Can permission="entity.action">` to conditionally render UI elements. Available actions per entity typically follow: `list`, `read`, `create`, `update`, `delete`.

### 8.2 Hook

Use `usePermission()` for imperative checks:

```tsx
const { hasPermission } = usePermission();
if (hasPermission('entity.create')) { /* show action */ }
```

### 8.3 Role mapping

| Role | Typical permissions |
|------|-------------------|
| Coordinator | read-only (`list`, `read`) |
| Advisor | `list`, `read`, `create`, `update` |
| Supervisor | all including `delete` |
| Manager | all including `delete` |

---

## 9. StateBadge and gender

`StateBadge` defaults to feminine labels (Activa/Inactiva) which is correct for negotiations (negociación). For masculine entities (cliente, servicio), pass an explicit `label`:

```tsx
<StateBadge
  state={entity.isActive ? 'active' : 'inactive'}
  label={entity.isActive ? 'Activo' : 'Inactivo'}
/>
```

---

## 10. Cache invalidation

After any mutation (create, update, delete), invalidate related query keys:

```tsx
queryClient.invalidateQueries({ queryKey: queryKeys.entities.all });
```

If the entity appears in other modules (e.g., clients appear in negotiations), invalidate those too:

```tsx
queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
```

---

## 11. Toast feedback

- **Success**: `toast.success('Registro creado')` / `'Registro actualizado'` / `'Registro eliminado'`
- **Error in forms**: show `FormAlert` inline above form fields
- **Error in delete**: `toast.error(getErrorMessage(err))` since there's no inline form

---

## 12. Styling rules

- Semantic tokens only (`bg-primary`, `text-muted-foreground`). No raw colors
- `gap-*` not `space-y-*`
- `size-*` not `w-X h-X`
- `cn()` for conditional classes, never template literal ternaries
- Icons from `lucide-react` with `data-icon` attribute in buttons
- Overlays (`Dialog`, `Sheet`, `Drawer`) must have a `Title` — use `sr-only` if visually hidden
- Spanish UI labels, English code (component names, variables, functions)

---

## Checklist

Before considering a CRUD page complete, verify:

- [ ] List page shows `TableSkeleton` on initial load (no spinners)
- [ ] List page shows error state with retry
- [ ] Empty state differentiates filtered vs truly empty
- [ ] Create button permission-gated
- [ ] Create form resets on close (key increment)
- [ ] Unsaved changes guard on create dialog
- [ ] Detail panel uses single Sheet (no remount flash)
- [ ] Detail panel shows skeleton loading (header + body), not spinner
- [ ] Detail panel has `sr-only` SheetTitle during loading for accessibility
- [ ] View mode has sections with icons and labels
- [ ] Contact fields are clickable (tel/mailto links)
- [ ] Edit button permission-gated
- [ ] Back arrow in edit mode triggers guard if dirty
- [ ] Unsaved changes guard on detail sheet
- [ ] Delete button permission-gated
- [ ] Delete has confirmation dialog with entity name
- [ ] Delete shows loading state during mutation
- [ ] All mutations invalidate relevant caches
- [ ] All mutations show toast feedback
- [ ] StateBadge uses correct gender labels
- [ ] No computed/read-only fields in forms
- [ ] Form submit button disabled when required fields empty or pending
- [ ] No spinners for content loading — use `Skeleton` components only
- [ ] `npm run check` passes
