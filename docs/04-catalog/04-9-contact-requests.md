# 4.9 — Contact requests

## Goal

Build an inbox-style page for managing contact requests submitted from the public-facing catalog. Requests are created via public API — this page only lists, views, and marks them as attended.

## Page

`src/modules/catalog/pages/ContactRequestsPage.tsx`

Route: `/catalogo/solicitudes`

## Layout

### SectionHeader
- Title: "Solicitudes de contacto"
- Description: "Consultas recibidas del catálogo público"
- No create button (requests come from public API)

### FilterBar

| Filter | Type | Options |
|--------|------|---------|
| Search | text | Placeholder: "Buscar por nombre o email..." |
| Producto | select | From `useCatalogItemOptions()` (need new hook or inline) + "Todos" |
| Estado | select | Todos / Pendientes / Atendidas |

### EntityTable

| Column | Accessor |
|--------|----------|
| Cliente | `clientName` |
| Email | `clientEmail` — clickable mailto |
| Teléfono | `clientPhone` or "—" — clickable tel |
| Producto | item name (resolved from `itemId`) or "General" |
| Estado | dot indicator: pending (yellow) / attended (green) |
| Fecha | `createdAt` formatted with `formatRelativeTime` |

Row click → opens detail sheet.

### Detail Sheet

`ContactRequestSheet.tsx` — read-only detail with action:

**Fields:**
- Nombre del cliente
- Email (mailto link)
- Teléfono (tel link, if exists)
- Producto relacionado (link to catalog item, if exists)
- Mensaje (full text)
- Estado: Pendiente / Atendida
- Atendida por: `attendedBy` username (if attended)
- Fecha de atención: `attendedAt` formatted (if attended)
- Fecha de creación: `createdAt` formatted

**Action:**
- "Marcar como atendida" button — only when `isAttended === false`
- `updateContactRequest(id, { isAttended: true })` → refetch → toast
- Permission: `contact_requests.update`
- No confirmation dialog needed (not destructive, can be toggled)

## No edit/delete

Contact requests are not editable or deletable. Only action is marking as attended.

## Verification

- `npm run check` passes
- List loads with filters
- Detail shows all request info
- "Marcar como atendida" works and updates UI
- Attended requests show attendedBy and attendedAt
- Permission gating
