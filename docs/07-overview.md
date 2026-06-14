# Phase 7 — Overview Dashboard

Operational summary page. Cross-module aggregation for daily action visibility. Depends on phases 2–6 having service layers ready.

## 7.1 Overview concept

The overview page is the landing page after login. It provides at-a-glance operational metrics and recent activity. No CRUD here — pure read-only dashboard.

## 7.2 Data sources

Overview pulls from multiple services already built:
- `listBusinessClients({ isActive: true, limit: 1 })` → total active accounts (from meta.totalItems)
- `listNegotiations({ isActive: true, limit: 1 })` → total active negotiations (from meta.totalItems)
- `listVisits({ dateFrom: today, dateTo: today, limit: 5 })` → today's visits
- `listNegotiationDocuments({ state: 'PENDING_APPROVAL', limit: 1 })` → pending documents count
- `listOfferMatrices({ state: 'PENDING_APPROVAL', limit: 1 })` → pending matrices count

## 7.3 Data hook

**`useOverviewData()`** — fetches all overview metrics in parallel. Returns `{ metrics, recentVisits, loading, error, retry }`.

Structure:
```ts
interface OverviewMetrics {
  activeAccounts: number;
  activeNegotiations: number;
  visitsToday: number;
  pendingDocuments: number;
  pendingMatrices: number;
}
```

Implementation: use `Promise.all()` to fetch all counts simultaneously. Extract `meta.totalItems` from paginated responses (request with limit=1 to minimize payload).

## 7.4 OverviewPage layout

Replace current stub.

**Row 1 — KPI cards (responsive grid: 2 cols mobile, 3-5 cols desktop):**
- Cuentas activas (Briefcase icon) — activeAccounts
- Negociaciones activas (Handshake icon) — activeNegotiations
- Visitas hoy (CalendarCheck icon) — visitsToday
- Docs pendientes (FileText icon) — pendingDocuments
- Matrices pendientes (Grid icon) — pendingMatrices

Each KpiCard clickable → navigates to respective section.

**Row 2 — Recent activity (Card):**
- "Visitas de hoy" section header
- Table or list of today's visits:
  - Client businessName
  - Visit type
  - Advisor name
  - Time
  - Verified badge
- EmptyState if no visits today
- "Ver todas" link → `/negociaciones` (or visits filtered view)

**Row 3 — Quick actions (optional):**
- "Nueva negociación" button → `/negociaciones` (triggers create flow)
- "Documentos pendientes" → `/documentacion?state=PENDING_APPROVAL`
- "Matrices pendientes" → `/catalogo?state=PENDING_APPROVAL`

## 7.5 Role-based visibility

- **Advisor**: sees own metrics (filtered by their advisorId)
- **Supervisor**: sees team metrics (all advisors under supervision)
- **Manager**: sees all metrics

For advisor-scoped queries, pass `advisorId` filter from `user.id` (mapped to employee). For supervisor scope, omit advisorId to get all (backend handles permission scoping if implemented, otherwise show all).

## 7.6 Loading state

Since overview fetches 5+ endpoints, use skeleton loading:
- Show KpiCard skeletons (pulse animation) while loading
- Show table skeleton for recent activity
- All data loads in parallel — page renders progressively as each resolves, or waits for all with PageLoader

## 7.7 Permission gating

Overview is accessible to all authenticated users. Individual KPI cards and sections conditionally shown based on what the user can see:
- Docs pendientes card: only if `negotiation_documents.read`
- Matrices pendientes card: only if `offer_matrices.read`
- Recent visits: only if `visits.read`

## Deliverable

After this phase: landing dashboard with live KPI counts, today's visit activity, quick navigation to pending items. Adapts to user role.
