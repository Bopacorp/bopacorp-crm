# Overview Module — Gap Analysis

Audited: 2026-06-27

Route: `/overview` (management only)
File: `src/modules/overview/pages/OverviewPage.tsx`

## What Overview does now

- 3 KPI cards: contacto inicial, clientes visitados, en cierre (aggregated totals)
- Advisor metrics table: contactados, visitados, negociacion, cerrados, post-venta, facturado, prom. por servicio
- Date range filter (desde/hasta)
- Row click → Sheet with per-advisor KPI breakdown + billing details
- Data source: `GET /reports/advisor-metrics` via `useAdvisorMetrics` hook

## Requirements assigned to Overview

These requirements describe the **operational dashboard** — quick KPIs and at-a-glance team status.

| Req | Description | Status | Notes |
|-----|-------------|--------|-------|
| RF-CRM-015 | Supervisor view recent activity of ALL advisors | **Missing** | No activity feed. `audit_logs` table exists in API but no read endpoint exposed |
| RF-CRM-016 | Per advisor: contacted, visited, closed | **Done** | Table columns cover this |
| RF-CRM-017 | Total billed + avg revenue per service per advisor | **Done** | `totalBilledAmount`, `averageBillingPerService` |
| RF-CRM-018 | Terminals/equipment sold per advisor (count + value) | **Missing** | No equipment/terminal fields in DB schema (crm or matrices). Requires schema + API + frontend |
| RF-CRM-019 | Clients per funnel stage per advisor | **Done** | Columns: contactados, negociacion, cerrados, post-venta |
| RF-REP-003 | Key metrics: sales, closures, visits, avg negotiation time | **Partial** | Missing avg negotiation time. Needs backend calculation |
| RF-REP-008 | Bar charts, line graphs, KPI indicators | **Partial** | KPI cards only. No charts |
| RF-REP-010 | Advisor sees OWN performance | **Missing** | Advisors redirect to `/clientes`. No personal dashboard variant |

## Gaps to close

### 1. Activity feed (RF-CRM-015)

- `audit_logs` table exists with: tableName, recordId, operation, userId, oldData, newData, createdAt
- Used in: auth, users, employees, advisor-supervisors services
- NOT used in: CRM (negotiations, visits, clients) — no audit trail for CRM actions
- **API work**: Add read endpoint for audit_logs (paginated, filtered by tableName/userId)
- **API work**: Add `createAuditLog` calls in CRM services (negotiations CRUD, visits CRUD, client updates)
- **CRM work**: Activity feed component in Overview showing recent actions across advisors

### 2. Equipment/terminals (RF-CRM-018)

- No `equipment` or `terminal` fields anywhere in DB
- Requires: new table or columns in matrices schema, API endpoint, CRM display
- **Low priority** — can note as "Phase 2" in report if time-constrained

### 3. Average negotiation time (RF-REP-003)

- Need: `AVG(closedAt - createdAt)` for negotiations reaching closing state
- `negotiations` table has `createdAt` but no `closedAt` or state transition timestamp
- **API work**: Either add `closedAt` column or compute from state change history
- **CRM work**: Add KPI card showing avg days to close

### 4. Charts (RF-REP-008)

- Only KPI cards exist — no bar/line charts
- Options: recharts (lightweight, React-native), chart.js, or simple SVG bars
- Suggested charts for Overview:
  - Bar chart: clients per funnel stage (all advisors stacked)
  - Mini sparkline or bar per advisor row (inline)

### 5. Advisor self-dashboard (RF-REP-010)

- Advisors have no dashboard — redirect to `/clientes`
- Option A: Reuse OverviewPage with `advisorId` filter (show only own data)
- Option B: Dedicated lightweight page with personal KPIs
- **API already supports it**: `listAdvisorMetrics` returns per-advisor data; just needs filtering

## Dead code

- `src/modules/dashboard/pages/DashboardPage.tsx` — English labels, hardcoded zeros, no route. Delete it.

## API summary (what exists)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/reports/advisor-metrics` | GET | management roles | Returns per-advisor funnel counts + billing. Supports `dateFrom`/`dateTo` |
| `/reports/objectives` | GET/POST/PUT/DELETE | `sales_objectives.*` | CRUD for sales objectives (target amount, target deals, period) |
| `/reports/exports` | GET/POST | `report_exports.*` | CRUD for report export records (metadata only, no file generation) |

## Notes

- Report export API stores metadata (filename, path, size) but does NOT generate files. File generation would need to happen server-side or client-side
- Sales objectives API is fully functional but CRM Reports page shows hardcoded zeros instead of real data
- Advisor metrics endpoint has no supervisor scoping — returns ALL advisors regardless of who asks
