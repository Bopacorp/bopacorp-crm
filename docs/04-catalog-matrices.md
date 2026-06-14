# Phase 4 — Catalog & Matrices

Offer matrix construction, line item management, attachments, and approval workflow. Covers RF-MAT-001 through RF-MAT-007 and RF-SUP-001 through RF-SUP-006.

## 4.1 Service layer

Create `src/modules/catalog/catalog.service.ts`:

**Offer Matrices:**
- `listOfferMatrices(params)` → `GET /matrices` → paginated
  - Params: negotiationId, state, creatorId, search
- `getOfferMatrix(id)` → `GET /matrices/:id`
- `createOfferMatrix(data)` → `POST /matrices`
- `updateOfferMatrix(id, data)` → `PATCH /matrices/:id`
- `deleteOfferMatrix(id)` → `DELETE /matrices/:id`
- `changeMatrixState(id, data)` → `PATCH /matrices/:id/state`
  - data: `{ state: MatrixState, supervisorMessage?: string }`
- `getMatrixHistory(id)` → `GET /matrices/:id/history` → paginated

**Matrix Line Items:**
- `listMatrixLineItems(matrixId, params)` → `GET /matrices/:id/line-items`
- `createMatrixLineItem(matrixId, data)` → `POST /matrices/:id/line-items`
- `updateMatrixLineItem(matrixId, lineItemId, data)` → `PATCH /matrices/:id/line-items/:lineItemId`
- `deleteMatrixLineItem(matrixId, lineItemId)` → `DELETE /matrices/:id/line-items/:lineItemId`

**Matrix Attachments:**
- `listMatrixAttachments(matrixId, params)` → `GET /matrices/:id/attachments`
- `createMatrixAttachment(matrixId, data)` → `POST /matrices/:id/attachments`
- `deleteMatrixAttachment(matrixId, attachmentId)` → `DELETE /matrices/:id/attachments/:attachmentId`

**Catalog Items (read-only for matrix building):**
- `listCatalogItems(params)` → `GET /catalog-items` → paginated
  - Params: categoryId, itemTypeId, isActive, isPublished, search
- `getCatalogItem(id)` → `GET /catalog-items/:id`

## 4.2 Data hooks

**`useOfferMatrices(page, filters)`** — paginated matrix list.

**`useOfferMatrix(id)`** — single matrix detail with line items and attachments.

**`useMatrixLineItems(matrixId)`** — line items for a specific matrix.

**`useMatrixAttachments(matrixId)`** — attachments for a specific matrix.

**`useMatrixHistory(matrixId)`** — state change history.

**`useCatalogItems(search, filters)`** — catalog items for line item picker.

## 4.3 CatalogPage (Matrices list)

Replace current stub.

**Layout:**
- SectionHeader: "Catálogo" + "Nueva matriz" button
- FilterBar:
  - Search by company/negotiation
  - State filter: Todos / Borrador / Pendiente / Aprobada / Rechazada
  - Creator filter (advisor dropdown, for supervisors)
- EntityTable columns:
  - Negociación (negotiation.client.businessName) — bold, clickable
  - Estado (StateBadge with MatrixState)
  - Monto total ($totalAmount formatted)
  - Subsidio ($calculatedSubsidy formatted)
  - Creador (creator.username)
  - Fecha (createdAt formatted)
- Row click → navigate to `/catalogo/matrices/:id`
- Pagination

**"Nueva matriz" dialog:**
- Select negotiation (search/select from active negotiations)
- Observations textarea (optional)
- Submit → createOfferMatrix with state DRAFT → toast → navigate to detail

## 4.4 MatrixDetailPage — Full matrix view

Replace current stub.

**Header card:**
- Negotiation: client businessName + link to negotiation
- State: StateBadge
- Creator name
- Total amount + calculated subsidy (prominent)
- Subsidy strategy label
- Created date
- Actions:
  - "Editar" (if DRAFT and user is creator) → inline edit observations
  - "Enviar a aprobación" (if DRAFT) → changeMatrixState to PENDING_APPROVAL
  - "Aprobar" (if PENDING_APPROVAL and user is supervisor) → changeMatrixState to APPROVED
  - "Rechazar" (if PENDING_APPROVAL and user is supervisor) → dialog with mandatory supervisorMessage

**Tabs:**

### Tab: Líneas de oferta
Main matrix builder.

- Table of current line items:
  - Producto (item.name)
  - Cantidad (quantity)
  - Precio unitario ($unitPrice)
  - Total ($total)
  - Actions: edit, delete (only if matrix is DRAFT)
- Total row at bottom summing all line items
- "Agregar producto" button (if DRAFT):
  - Opens catalog item picker dialog
  - Search catalog items with filters
  - Select item → pre-fill unitPrice from catalog item price
  - Enter quantity → auto-calculate total
  - Submit → createMatrixLineItem → refetch

**Edit line item:**
- Inline or dialog edit for quantity and unitPrice
- Total recalculated automatically
- Submit → updateMatrixLineItem → refetch

### Tab: Adjuntos
- List of attachments: filename, extension, size, uploaded by, date
- "Subir adjunto" button (if DRAFT):
  - File picker (PDF, Excel, JPG, PNG — max 50 MB)
  - Description field (optional)
  - Submit → createMatrixAttachment → refetch
- Delete action per attachment (if DRAFT)

### Tab: Historial
- TimelinePanel showing state transitions
- Each entry: previousState → newState, changedBy, supervisorMessage, date

## 4.5 Approval workflow (Supervisor view)

Supervisor sees matrices with PENDING_APPROVAL in list. On detail page:

**Approve flow:**
- Click "Aprobar" → confirmation dialog
- Optional supervisorMessage
- Submit → `changeMatrixState(id, { state: 'APPROVED', supervisorMessage })` → toast → refetch

**Reject flow:**
- Click "Rechazar" → dialog
- Required supervisorMessage (reason)
- Submit → `changeMatrixState(id, { state: 'REJECTED', supervisorMessage })` → toast → refetch

After approval/rejection, matrix becomes read-only.

## 4.6 State machine

```
DRAFT → PENDING_APPROVAL (advisor sends for review)
PENDING_APPROVAL → APPROVED (supervisor approves)
PENDING_APPROVAL → REJECTED (supervisor rejects)
```

StateBadge mapping:
- `DRAFT` → secondary, "Borrador"
- `PENDING_APPROVAL` → secondary, "Pendiente"
- `APPROVED` → default, "Aprobada"
- `REJECTED` → destructive, "Rechazada"

## 4.7 Integration with NegotiationDetailPage

Phase 2 NegotiationDetailPage has a "Matrices" tab. After Phase 4:
- Tab shows real matrices filtered by negotiationId
- Shows matrix state, amount, subsidy
- "Nueva matriz" button creates matrix pre-linked to this negotiation
- Click row → navigates to `/catalogo/matrices/:id`

## 4.8 Permission gating

| Action | Permission |
|--------|-----------|
| View matrices | `offer_matrices.read` |
| Create matrix | `offer_matrices.create` |
| Update matrix | `offer_matrices.update` |
| Delete matrix | `offer_matrices.delete` |
| Change state (send/approve/reject) | `offer_matrices.change_state` |
| View line items | `matrix_line_items.read` |
| Add/edit/remove line items | `matrix_line_items.create/update/delete` |
| View attachments | `matrix_attachments.read` |
| Add/remove attachments | `matrix_attachments.create/delete` |
| View catalog items | `catalog_items.read` |

## 4.9 Types consumed

From `@bopacorp/shared/matrices`:
- `OfferMatrixResponse`, `OfferMatrixListItemResponse`
- `MatrixLineItemResponse`, `MatrixLineItemListItemResponse`
- `MatrixAttachmentResponse`
- `MatrixStateHistoryResponse`
- `MatrixState` enum
- All request types

From `@bopacorp/shared/catalog`:
- `CatalogItemResponse`, `CatalogItemListItemResponse` (for item picker)

## Deliverable

After this phase: full offer matrix lifecycle — create from negotiation, add catalog items as line items, attach files, send for approval, supervisor approves/rejects with message, full state history.
