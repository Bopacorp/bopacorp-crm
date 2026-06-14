# 2.7 — Permission gating & sidebar filtering

## Goal

Wire `<Can>` component and `usePermission` to all negotiation actions. Filter sidebar nav items by permissions.

## Permission map

| Action | Permission code | Where |
|--------|----------------|-------|
| View negotiations list | `negotiations.read` | NegotiationsPage access |
| Create negotiation | `negotiations.create` | "+ Nueva" button |
| Update negotiation | `negotiations.update` | Edit fields |
| Change state | `negotiations.change_state` | "Cambiar estado" button |
| View clients | `business_clients.read` | Client sheet access |
| Create client | `business_clients.create` | "Crear cliente" option |
| Update client | `business_clients.update` | Edit button in sheet |
| Delete client | `business_clients.delete` | Delete action in sheet |
| View visits | `visits.read` | Visits tab access |
| Create visit | `visits.create` | "Registrar visita" button |
| Verify visit | `visits.verify` | "Verificar" action |

## Implementation

### Action gating (in components)

Wrap action buttons with `<Can>`:

```tsx
<Can permission="negotiations.create">
  <Button onClick={openCreateDialog}>+ Nueva negociación</Button>
</Can>
```

### Sidebar filtering

Update `src/app/Sidebar.tsx` nav items to include required permission. Filter items user can't access:

```tsx
const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Negociaciones', path: '/negociaciones', icon: Handshake, permission: 'negotiations.read' },
  { label: 'Documentación', path: '/documentacion', icon: FileText, permission: 'documentation.read' },
  // ...
];

// Filter by permission
const visibleItems = navItems.filter(
  (item) => !item.permission || hasPermission(item.permission)
);
```

### Route-level guard (optional)

Could add `RequirePermission` wrapper for routes, but `<Can>` + API 403 handling covers most cases. Evaluate if needed after wiring component-level gates.

## Files to modify

- `src/app/Sidebar.tsx` — add permission field to nav items, filter
- `src/modules/negotiations/pages/NegotiationsPage.tsx` — gate create button
- `src/modules/negotiations/pages/NegotiationDetailPage.tsx` — gate state change button
- `src/modules/negotiations/components/BusinessClientSheet.tsx` — gate edit/delete
- `src/modules/negotiations/components/VisitsTab.tsx` — gate create visit, verify
- `src/modules/negotiations/components/CreateNegotiationDialog.tsx` — gate client creation option

## Verification

- User without `negotiations.create` can't see "+ Nueva" button
- User without `visits.verify` can't see "Verificar" action
- Sidebar hides items user can't access
- All permissions match API expectations
- `npm run check` passes
