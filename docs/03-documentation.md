# Phase 3 — Documentation

Document management and approval workflow. Covers RF-DOC-001 through RF-DOC-009. Coordinators review documents uploaded by advisors for each negotiation.

## 3.1 Service layer

Create `src/modules/documentation/documentation.service.ts`:

**Negotiation Documents:**
- `listNegotiationDocuments(params)` → `GET /documents` → paginated
  - Params: negotiationId, documentTypeId, state, uploadedBy, search
- `getNegotiationDocument(id)` → `GET /documents/:id`
- `createNegotiationDocument(data)` → `POST /documents`
- `updateNegotiationDocument(id, data)` → `PATCH /documents/:id`
- `deleteNegotiationDocument(id)` → `DELETE /documents/:id`
- `changeDocumentState(id, data)` → `PATCH /documents/:id/state`
  - data: `{ state: DocumentState, coordinatorMessage?: string }`
- `getDocumentHistory(id)` → `GET /documents/:id/history` → paginated

**Document Types (lookup):**
- `listDocumentTypes(params)` → `GET /documents/types`
- `getDocumentType(id)` → `GET /documents/types/:id`
- `createDocumentType(data)` → `POST /documents/types`
- `updateDocumentType(id, data)` → `PATCH /documents/types/:id`
- `deleteDocumentType(id)` → `DELETE /documents/types/:id`

## 3.2 Data hooks

**`useNegotiationDocuments(page, filters)`** — paginated document list. Filters: state, documentTypeId, negotiationId, search.

**`useDocumentTypes()`** — loads document type options for dropdowns and labels.

**`useDocumentHistory(documentId)`** — state change history for a specific document.

## 3.3 DocumentationPage — List + approval actions

Replace current stub.

**Layout:**
- SectionHeader: "Documentación" + description "Gestión de documentos comerciales y flujo de aprobación"
- FilterBar:
  - Search by company name
  - State filter: Todos / Pendiente / Aprobado / Rechazado (maps to PENDING_APPROVAL / ACCEPTED / REJECTED)
  - Document type filter (from document types lookup)
- EntityTable columns:
  - Empresa (negotiation.client.businessName) — bold
  - Tipo (documentType.name)
  - Archivo (filename + extension + size badge)
  - Estado (StateBadge with DocumentState)
  - Subido por (uploadedBy.username)
  - Fecha (uploadedAt formatted)
  - Acciones:
    - "Aprobar" button (green) — visible when state === PENDING_APPROVAL and user has `negotiation_documents.change_state`
    - "Rechazar" button (destructive) — same condition
    - "Ver historial" button — opens history sheet
- Pagination

**Approve action:**
- Confirmation dialog: "¿Aprobar este documento?"
- Optional coordinator message textarea
- Submit → `changeDocumentState(id, { state: 'ACCEPTED', coordinatorMessage })` → toast → refetch

**Reject action:**
- Dialog: "¿Rechazar este documento?"
- Required coordinator message (reason for rejection)
- Submit → `changeDocumentState(id, { state: 'REJECTED', coordinatorMessage })` → toast → refetch

**History sheet:**
- Side sheet showing document state history
- TimelinePanel with entries: previousState → newState, changedBy, notes, date
- Document metadata at top: filename, type, uploaded by

## 3.4 Upload document flow

Document upload happens from NegotiationDetailPage (Phase 2, Documentos tab). The flow:

1. User clicks "Subir documento" in negotiation detail → documents tab
2. Dialog opens:
   - Select document type from dropdown (document types lookup, shows mandatory badge)
   - File picker (PDF, JPG, PNG — max 50 MB)
   - Description field (optional)
3. File uploaded to backend (creates storage entry)
4. `createNegotiationDocument()` called with metadata
5. Document appears in list with state PENDING_APPROVAL

Note: actual file upload mechanism depends on backend storage implementation (presigned URLs, multipart, etc). Wire the metadata creation first; file upload integration can follow.

## 3.5 Document type management

For coordinators/admins — manage which document types exist and which are mandatory.

**Inline in DocumentationPage or separate sub-section:**
- "Tipos de documento" button → opens dialog/sheet
- List existing types: code, name, isMandatory badge, isActive
- Create new type: code, name, description, isMandatory toggle
- Edit existing: update name, description, mandatory flag
- Delete (soft disable)

## 3.6 Integration with NegotiationDetailPage

Phase 2 NegotiationDetailPage has a "Documentos" tab. After Phase 3:
- Tab shows real documents filtered by negotiationId
- Shows pending/approved/rejected counts
- Upload button available (if user has `negotiation_documents.create`)
- Links to DocumentationPage for full management view

## 3.7 Permission gating

| Action | Permission |
|--------|-----------|
| View documents | `negotiation_documents.read` |
| Upload document | `negotiation_documents.create` |
| Update document | `negotiation_documents.update` |
| Delete document | `negotiation_documents.delete` |
| Approve/Reject | `negotiation_documents.change_state` |
| Manage doc types | `document_types.create`, `document_types.update` |

## 3.8 State machine

```
PENDING_APPROVAL → ACCEPTED
PENDING_APPROVAL → REJECTED
```

StateBadge mapping:
- `PENDING_APPROVAL` → secondary variant, label "Pendiente"
- `ACCEPTED` → default variant, label "Aprobado"
- `REJECTED` → destructive variant, label "Rechazado"

## 3.9 Types consumed

From `@bopacorp/shared/documents`:
- `NegotiationDocumentResponse`, `NegotiationDocumentListItemResponse`
- `DocumentTypeResponse`
- `DocumentStateHistoryResponse`
- `DocumentState` enum
- All request types

## Deliverable

After this phase: full document approval workflow — list with filters, approve/reject with coordinator messages, state history, document type management, upload flow integrated in negotiation detail.
