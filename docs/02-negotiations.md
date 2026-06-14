# Phase 2 — Negotiations & Clients

Core business module. Covers business client management, negotiation pipeline, visits, and state transitions. This is where most CRM requirements live (RF-CRM-001 through RF-CRM-022).

## 2.1 Service layer

Create `src/modules/negotiations/negotiations.service.ts`:

**Business Clients:**
- `listBusinessClients(params)` → `GET /crm/business-clients` → paginated
- `getBusinessClient(id)` → `GET /crm/business-clients/:id`
- `createBusinessClient(data)` → `POST /crm/business-clients`
- `updateBusinessClient(id, data)` → `PATCH /crm/business-clients/:id`
- `deleteBusinessClient(id)` → `DELETE /crm/business-clients/:id`

**Negotiations:**
- `listNegotiations(params)` → `GET /crm/negotiations` → paginated
- `getNegotiation(id)` → `GET /crm/negotiations/:id`
- `createNegotiation(data)` → `POST /crm/negotiations`
- `updateNegotiation(id, data)` → `PATCH /crm/negotiations/:id`
- `changeNegotiationState(id, data)` → `PATCH /crm/negotiations/:id/state`
- `getNegotiationHistory(id)` → `GET /crm/negotiations/:id/history`

**Negotiation States (lookup):**
- `listNegotiationStates(params)` → `GET /crm/negotiation-states`

**Visits:**
- `listVisits(params)` → `GET /crm/visits` → paginated
- `getVisit(id)` → `GET /crm/visits/:id`
- `createVisit(data)` → `POST /crm/visits`
- `updateVisit(id, data)` → `PATCH /crm/visits/:id`
- `verifyVisit(id, data)` → `PATCH /crm/visits/:id/verify`

**Visit Types (lookup):**
- `listVisitTypes(params)` → `GET /crm/visit-types`

## 2.2 Data hooks

**`useNegotiations(page, filters)`** — fetches paginated negotiations list with search, stateId, advisorId filters. Returns `{ negotiations, meta, loading, error, retry, refetch }`.

**`useNegotiation(id)`** — fetches single negotiation detail. Returns `{ negotiation, loading, error, retry }`.

**`useNegotiationHistory(id)`** — fetches state change history. Returns `{ history, loading }`.

**`useBusinessClients(page, filters)`** — paginated client list.

**`useVisits(params)`** — paginated visits list with date range and client/advisor filters.

**`useNegotiationStates()`** — loads available pipeline states once (for filters and dropdowns).

**`useVisitTypes()`** — loads visit type options once.

## 2.3 NegotiationsPage — List view

Replace current stub. Show all negotiations in a paginated table.

**Layout:**
- SectionHeader: "Negociaciones" + "Nueva negociación" button
- FilterBar: search (company name) + state dropdown + advisor dropdown (if supervisor/manager)
- EntityTable columns:
  - Empresa (client.businessName) — bold, clickable
  - Estado (state.name) — StateBadge
  - Asesor (advisor.username or profile name)
  - Fecha inicio (startDate) — formatted date
  - Cierre estimado (estimatedCloseDate) — formatted date
- Pagination controls
- Row click → navigate to `/negociaciones/:id`
- Loading: PageLoader. Error: ErrorState with retry. Empty: EmptyState

**"Nueva negociación" dialog:**
- Select existing client or create new one
- Select initial state from negotiation states
- Assign advisor (pre-filled if current user is advisor)
- Start date, estimated close date (optional)
- Observations textarea
- Submit → createNegotiation → toast success → refetch list

## 2.4 NegotiationDetailPage — 360° view

Replace current stub. Full detail with tabs.

**Header card:**
- Client businessName + RUC
- Current state as StateBadge
- Assigned advisor name
- Start date, estimated close date
- "Cambiar estado" action button → opens state change dialog

**State change dialog:**
- Select new state from dropdown (negotiation states)
- Optional notes textarea
- Submit → changeNegotiationState → toast → refetch

**Tabs:**

### Tab: Historial (Timeline)
- Fetch negotiation history
- Render in TimelinePanel: each state change with previous→new state, changed by, notes, date

### Tab: Visitas
- List visits for this negotiation (filter by negotiationId or clientId)
- Table: date, type, advisor, verified badge, observations preview
- "Registrar visita" button → create visit dialog
- Row click → expand or sheet with full visit detail
- Supervisor: "Verificar" action on unverified visits

### Tab: Documentos
- List negotiation documents (from documents module, filter by negotiationId)
- Table: filename, type, state (StateBadge), uploaded by, date
- Preview: read-only, links to documentation module for actions
- Count badge on tab showing pending documents

### Tab: Matrices
- List offer matrices for this negotiation
- Table: state, total amount, subsidy, creator, date
- Link to `/catalogo/matrices/:id` for detail

**Create visit dialog:**
- Visit type dropdown (from visit types lookup)
- Visit date (datetime picker)
- Observations textarea
- GPS fields (latitude, longitude) — auto-filled via browser geolocation API if available
- Submit → createVisit → toast → refetch visits tab

## 2.5 Business client management

Clients are managed within negotiations context (no separate route, but accessible from negotiation detail and create flows).

**Client detail sheet (side panel):**
- Opens when clicking client name anywhere
- Shows: businessName, RUC, contactName, contactPhone, contactEmail, address, activeServicesCount, currentMonthlyBilling
- Edit button → inline form to update fields
- isActive toggle

**Create client dialog (from "Nueva negociación" flow):**
- RUC (13 digits, validated)
- Business name
- Contact name, phone, email
- Address
- Active services count, monthly billing
- Submit → createBusinessClient → auto-select in negotiation form

## 2.6 Permission gating

| Action | Permission |
|--------|-----------|
| View negotiations list | `negotiations.read` |
| Create negotiation | `negotiations.create` |
| Update negotiation | `negotiations.update` |
| Change state | `negotiations.change_state` |
| View clients | `business_clients.read` |
| Create client | `business_clients.create` |
| Update client | `business_clients.update` |
| Delete client | `business_clients.delete` |
| View visits | `visits.read` |
| Create visit | `visits.create` |
| Verify visit | `visits.verify` |

Use `<Can>` to show/hide create buttons, edit actions, verify buttons.

## 2.7 Types consumed from @bopacorp/shared

From `@bopacorp/shared/crm`:
- `NegotiationListItemResponse`, `NegotiationResponse`
- `BusinessClientListItemResponse`, `BusinessClientResponse`
- `VisitListItemResponse`, `VisitResponse`
- `NegotiationStateResponse`, `NegotiationStateHistoryResponse`
- `VisitTypeResponse`
- All Create/Update/List request types

From `@bopacorp/shared/common`:
- `PaginationMeta`

## Deliverable

After this phase: full negotiation lifecycle works — list, create, detail view with history/visits/docs tabs, state changes, visit registration with GPS, client management via sheets, all permission-gated.
