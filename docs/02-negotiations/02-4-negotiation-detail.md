# 2.4 — Negotiation detail page

## Goal

Replace `NegotiationDetailPage` stub with full 360° view: header card, state change, and tabbed content.

## Files

- `src/modules/negotiations/pages/NegotiationDetailPage.tsx` — main page
- `src/modules/negotiations/components/NegotiationHeader.tsx` — header card
- `src/modules/negotiations/components/ChangeStateDialog.tsx` — state transition dialog
- `src/modules/negotiations/components/HistoryTab.tsx` — timeline tab
- `src/modules/negotiations/components/VisitsTab.tsx` — visits tab (basic, expanded in 2.6)
- `src/modules/negotiations/components/DocumentsTab.tsx` — documents tab (read-only)
- `src/modules/negotiations/components/MatricesTab.tsx` — matrices tab (read-only)

## Layout

```
┌──────────────────────────────────────────────────┐
│ ← Volver a negociaciones                         │
├──────────────────────────────────────────────────┤
│ NegotiationHeader                                │
│ ┌──────────────────────────────────────────────┐ │
│ │ Empresa ABC S.A. (RUC: 0991234567001)       │ │
│ │ Estado: ●Activa    Asesor: Juan Pérez        │ │
│ │ Inicio: 12/03/2026  Cierre: 15/06/2026      │ │
│ │                          [Cambiar estado]    │ │
│ └──────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│ [Historial] [Visitas] [Documentos(3)] [Matrices] │
├──────────────────────────────────────────────────┤
│ Tab content here                                 │
└──────────────────────────────────────────────────┘
```

## Header card

- Client `businessName` + `RUC` (clickable → client sheet from 2.5)
- Current state as `StateBadge`
- Assigned advisor name
- Start date, estimated close date
- "Cambiar estado" button → `ChangeStateDialog`

## State change dialog

- Dropdown: available states from `useNegotiationStates` (exclude current)
- Notes textarea (optional)
- Submit → `changeNegotiationState(id, { stateId, notes })` → toast → refetch

## Tabs

### Historial (Timeline)
- Uses `useNegotiationHistory(id)`
- Renders `TimelinePanel` with entries:
  - Previous state → New state (both as `StateBadge`)
  - Changed by (user name)
  - Notes (if present)
  - Date/time

### Visitas (basic — expanded in 2.6)
- Uses `useVisits({ negotiationId: id })`
- Table: date, type, advisor, verified badge, observations preview
- "Registrar visita" button placeholder (wired in 2.6)

### Documentos (read-only)
- Fetch negotiation documents (filter by `negotiationId`)
- Table: filename, type, state (`StateBadge`), uploaded by, date
- Count badge on tab label showing pending count
- Read-only — links to documentation module for actions

### Matrices (read-only)
- List offer matrices linked to this negotiation
- Table: state, total amount, subsidy, creator, date
- Row click → navigate to `/catalogo/matrices/:id`

## Dependencies

- `useNegotiation(id)` hook (2.2)
- `useNegotiationHistory(id)` hook (2.2)
- `useNegotiationStates` hook (2.2)
- `useVisits` hook (2.2)
- `Tabs` from shadcn/ui
- Shared UI: `StateBadge`, `TimelinePanel`, `PageLoader`, `ErrorState`, `EntityTable`

## States

- **Loading**: `PageLoader`
- **Error**: `ErrorState` with retry
- **Not found**: Navigate to `/negociaciones` with toast error

## Verification

- Header renders correct negotiation data
- State change dialog works end-to-end
- Timeline shows history entries
- Tabs switch correctly
- Back navigation works
- `npm run check` passes
