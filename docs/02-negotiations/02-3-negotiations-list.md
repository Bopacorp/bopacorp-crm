# 2.3 — Negotiations list page

## Goal

Replace `NegotiationsPage` stub with full paginated table, filters, and create dialog.

## File

`src/modules/negotiations/pages/NegotiationsPage.tsx`

## Layout

```
┌─────────────────────────────────────────────┐
│ SectionHeader: "Negociaciones"  [+ Nueva]   │
├─────────────────────────────────────────────┤
│ FilterBar: [Search] [Estado ▾] [Asesor ▾]   │
├─────────────────────────────────────────────┤
│ EntityTable                                 │
│  Empresa | Estado | Asesor | Inicio | Cierre│
│  ──────────────────────────────────────────  │
│  Acme... | ●Act.. | Juan.. | 12/03 | 15/06 │
│  Beta... | ●Pro.. | Ana..  | 05/04 | 20/07 │
├─────────────────────────────────────────────┤
│ Pagination                                  │
└─────────────────────────────────────────────┘
```

## Columns (EntityTable)

| Column | Source field | Render |
|--------|------------|--------|
| Empresa | `client.businessName` | Bold text, clickable → client sheet |
| Estado | `state.name` | `StateBadge` |
| Asesor | `advisor.username` | Plain text |
| Fecha inicio | `startDate` | Formatted date (dd/MM/yyyy) |
| Cierre estimado | `estimatedCloseDate` | Formatted date or "—" |

## Interactions

- **Row click** → navigate to `/negociaciones/:id`
- **"+ Nueva negociación"** → opens create dialog (see below)
- **Search** → debounced 300ms, filters by company name
- **Estado dropdown** → filter by `stateId` (options from `useNegotiationStates`)
- **Asesor dropdown** → filter by `advisorId` (only visible to supervisors/managers)

## States

- **Loading**: `PageLoader`
- **Error**: `ErrorState` with retry
- **Empty**: `EmptyState` with message "No hay negociaciones" and create CTA

## Create negotiation dialog

Components: `src/modules/negotiations/components/CreateNegotiationDialog.tsx`

**Fields:**
- Client selector: search existing clients or "Crear nuevo cliente" option
- State: dropdown from `useNegotiationStates` (initial state pre-selected)
- Advisor: dropdown (pre-filled with current user if advisor role)
- Start date: date picker (default today)
- Estimated close date: date picker (optional)
- Observations: textarea

**Submit flow:**
1. If new client selected → first `createBusinessClient()` → get client ID
2. `createNegotiation(data)` with client ID
3. Toast success "Negociación creada"
4. Close dialog
5. Refetch list

## Dependencies

- `useNegotiations` hook (2.2)
- `useNegotiationStates` hook (2.2)
- `SectionHeader`, `FilterBar`, `EntityTable`, `PageLoader`, `ErrorState`, `EmptyState`, `StateBadge` from shared/ui
- `Dialog` from shadcn/ui
- `CreateNegotiationDialog` (new component)

## Verification

- Table renders with real data from API
- Filters narrow results
- Pagination works
- Create dialog submits successfully
- Row click navigates to detail
- `npm run check` passes
