# 2.5 — Business client management

## Goal

Build client detail sheet (side panel) and create client dialog, both used within negotiations context. No separate route — clients are accessed from negotiation flows.

## Files

- `src/modules/negotiations/components/BusinessClientSheet.tsx` — side panel for view/edit
- `src/modules/negotiations/components/CreateBusinessClientDialog.tsx` — create dialog (used in create negotiation flow)

## Business client sheet

Opens as a `Sheet` (slide-over panel) when clicking client name anywhere in negotiations module.

**View mode:**
```
┌─────────────────────────────┐
│ Empresa ABC S.A.        [✏] │
├─────────────────────────────┤
│ RUC: 0991234567001          │
│ Contacto: Juan Pérez        │
│ Teléfono: 099-123-4567      │
│ Email: juan@abc.com          │
│ Dirección: Av. 9 de Oct...  │
│ Servicios activos: 5        │
│ Facturación mensual: $2,500 │
│ Estado: ● Activo [toggle]   │
└─────────────────────────────┘
```

**Edit mode (toggle with pencil icon):**
- Inline form with all fields editable
- Save → `updateBusinessClient(id, data)` → toast → refetch
- Cancel → revert to view mode

**Fields:**
- `businessName` — text
- `ruc` — text (13 digits, readonly in edit to prevent accidental change)
- `contactName` — text
- `contactPhone` — text
- `contactEmail` — email
- `address` — textarea
- `activeServicesCount` — number
- `currentMonthlyBilling` — number (currency format)
- `isActive` — toggle switch

## Create business client dialog

Used from "Nueva negociación" flow when user selects "Crear nuevo cliente".

**Fields:**
- RUC: 13 digits, validated on blur
- Business name: required
- Contact name: required
- Contact phone: optional
- Contact email: optional (email format)
- Address: optional textarea
- Active services count: number, default 0
- Monthly billing: number, default 0

**Submit flow:**
1. Validate fields
2. `createBusinessClient(data)` → returns new client
3. Toast success "Cliente creado"
4. Close dialog
5. Auto-select new client in parent negotiation form (via callback prop)

## Client context

Need a way to open client sheet from anywhere in negotiations module. Options:
- Pass `clientId` + `onClose` as props
- Use a lightweight context (`ClientSheetProvider`) that exposes `openClientSheet(id)`

Recommend context approach — avoids prop drilling through table rows.

**File:** `src/modules/negotiations/context/ClientSheetContext.tsx`

```ts
interface ClientSheetContextValue {
  openClientSheet: (id: string) => void;
}
```

Wraps negotiations pages, renders `BusinessClientSheet` with current clientId state.

## Dependencies

- `useBusinessClients` hook (for search in create negotiation)
- Service: `getBusinessClient`, `createBusinessClient`, `updateBusinessClient`
- shadcn: `Sheet`, `Dialog`, `Switch`, `Input`, `Textarea`
- Shared UI: `FieldGroup`, `Field`, `FieldLabel`, `FormAlert`

## Verification

- Sheet opens when clicking client name in table
- View mode shows all fields correctly
- Edit mode saves and updates
- Create dialog validates RUC format
- New client auto-selected in negotiation form
- `npm run check` passes
